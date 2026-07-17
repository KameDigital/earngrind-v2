import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { exportProfileUsernames, runSnapshotCli } from "./export-profile-usernames.mjs";
import { validateSnapshotBuffer, validateSnapshotFile } from "./validate-profile-username-snapshot.mjs";

const snapshotAt = new Date("2026-07-17T12:34:56.000Z");

function fakeClient(rows) {
  const queries = [];
  return {
    queries,
    client: {
      async connect() {},
      async query(statement, values) {
        queries.push({ statement, values });
        return statement.startsWith("select") ? { rows } : { rows: [] };
      },
      async end() {},
    },
  };
}

function collector() {
  let text = "";
  return { stream: { write(chunk) { text += chunk; } }, text: () => text };
}

test("exports correct escaped CSV through a read-only transaction", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "earn-release-"));
  const fake = fakeClient([{ id: "a", username: 'comma,name "quoted"', snapshot_at: snapshotAt.toISOString() }]);
  const result = await exportProfileUsernames({
    connectionString: "postgresql://not-logged",
    outputDirectory: directory,
    snapshotAt,
    createClient: async () => fake.client,
  });

  assert.equal(result.rowCount, 1);
  assert.equal(
    await readFile(result.outputPath, "utf8"),
    'id,username,snapshot_at\n"a","comma,name ""quoted""","2026-07-17T12:34:56.000Z"\n',
  );
  assert.deepEqual(fake.queries.map(({ statement }) => statement), [
    "BEGIN TRANSACTION READ ONLY",
    "select id::text as id, username, $1::timestamptz as snapshot_at\n       from public.profiles\n       order by id",
    "COMMIT",
  ]);
});

test("handles null usernames and zero-row exports", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "earn-release-"));
  const nulls = fakeClient([{ id: "a", username: null, snapshot_at: snapshotAt.toISOString() }]);
  const withNull = await exportProfileUsernames({
    connectionString: "postgresql://not-logged",
    outputDirectory: directory,
    snapshotAt,
    createClient: async () => nulls.client,
  });
  assert.match(await readFile(withNull.outputPath, "utf8"), /"a","","2026-07-17T12:34:56.000Z"/);

  const emptyDirectory = await mkdtemp(path.join(tmpdir(), "earn-release-"));
  const empty = fakeClient([]);
  const zero = await exportProfileUsernames({
    connectionString: "postgresql://not-logged",
    outputDirectory: emptyDirectory,
    snapshotAt,
    createClient: async () => empty.client,
  });
  assert.equal(zero.rowCount, 0);
  assert.equal(await readFile(zero.outputPath, "utf8"), "id,username,snapshot_at\n");
});

test("refuses overwrite and validates row count, malformed CSV, and checksum", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "earn-release-"));
  const filename = path.join(directory, "profile-usernames-20260717T123456Z.csv");
  await writeFile(filename, "existing");
  await assert.rejects(
    exportProfileUsernames({
      connectionString: "postgresql://not-logged",
      outputDirectory: directory,
      snapshotAt,
      createClient: async () => fakeClient([]).client,
    }),
    /Snapshot export failed/,
  );
  assert.equal(await readFile(filename, "utf8"), "existing");

  const valid = Buffer.from('id,username,snapshot_at\n"a","comma,name","2026-07-17T12:34:56.000Z"\n');
  const result = validateSnapshotBuffer(valid);
  assert.equal(result.rowCount, 1);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  const validFile = path.join(directory, "profile-usernames-valid.csv");
  await writeFile(validFile, valid);
  assert.deepEqual(await validateSnapshotFile(validFile), result);
  assert.throws(() => validateSnapshotBuffer(Buffer.from('id,username,snapshot_at\n"broken')), /Malformed CSV record/);
});

test("does not leak the database connection string on failure", async () => {
  const stdout = collector();
  const stderr = collector();
  const connectionString = "postgresql://release-test@example.invalid/release";
  const exitCode = await runSnapshotCli({
    args: ["--output-dir", await mkdtemp(path.join(tmpdir(), "earn-release-"))],
    env: { SUPABASE_DB_URL: connectionString },
    stdout: stdout.stream,
    stderr: stderr.stream,
    snapshotAt,
    createClient: async () => { throw new Error(connectionString); },
  });

  assert.equal(exitCode, 1);
  assert.equal(stdout.text(), "");
  assert.equal(stderr.text(), "Snapshot failed; no file was written.\n");
  assert.ok(!`${stdout.text()}${stderr.text()}`.includes(connectionString));
});
