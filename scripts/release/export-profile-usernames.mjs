import { mkdir, open, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SNAPSHOT_HEADER = ["id", "username", "snapshot_at"];

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function timestampForFilename(date) {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

export function parseSnapshotArgs(args) {
  let outputDirectory;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--output-dir") {
      outputDirectory = args[index + 1];
      index += 1;
    } else if (argument.startsWith("--output-dir=")) {
      outputDirectory = argument.slice("--output-dir=".length);
    } else {
      throw new Error("Unsupported snapshot argument.");
    }
  }
  if (!outputDirectory) {
    throw new Error("A protected --output-dir is required.");
  }
  return { outputDirectory };
}

async function createPgClient(config) {
  const { Client } = await import("pg");
  return new Client(config);
}

async function safeRollback(client) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Do not log database errors from a release snapshot command.
  }
}

export async function exportProfileUsernames({
  connectionString,
  outputDirectory,
  snapshotAt = new Date(),
  createClient = createPgClient,
} = {}) {
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is required.");
  }
  if (!outputDirectory) {
    throw new Error("A protected output directory is required.");
  }

  const filename = `profile-usernames-${timestampForFilename(snapshotAt)}.csv`;
  const snapshotTimestamp = snapshotAt.toISOString();
  const outputPath = path.resolve(outputDirectory, filename);
  let client;
  let transactionStarted = false;
  let fileHandle;
  let createdOutput = false;

  try {
    await mkdir(outputDirectory, { recursive: true });
    client = await createClient({ connectionString, application_name: "earngrind-release-snapshot" });
    await client.connect();
    await client.query("BEGIN TRANSACTION READ ONLY");
    transactionStarted = true;

    const result = await client.query(
      `select id::text as id, username, $1::timestamptz as snapshot_at
       from public.profiles
       order by id`,
      [snapshotTimestamp],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    fileHandle = await open(outputPath, "wx");
    createdOutput = true;
    await fileHandle.writeFile(`${SNAPSHOT_HEADER.join(",")}\n`);
    for (const row of result.rows) {
      await fileHandle.writeFile(
        `${csvCell(row.id)},${csvCell(row.username)},${csvCell(snapshotTimestamp)}\n`,
      );
    }
    await fileHandle.close();
    fileHandle = undefined;
    return { outputPath, rowCount: result.rows.length };
  } catch {
    if (transactionStarted && client) {
      await safeRollback(client);
    }
    if (fileHandle) {
      await fileHandle.close();
    }
    if (createdOutput) {
      await unlink(outputPath).catch(() => {});
    }
    throw new Error("Snapshot export failed.");
  } finally {
    if (client) {
      await client.end().catch(() => {});
    }
  }
}

export async function runSnapshotCli({
  args = process.argv.slice(2),
  env = process.env,
  stdout = process.stdout,
  stderr = process.stderr,
  createClient,
  snapshotAt,
} = {}) {
  try {
    const { outputDirectory } = parseSnapshotArgs(args);
    const result = await exportProfileUsernames({
      connectionString: env.SUPABASE_DB_URL,
      outputDirectory,
      createClient,
      snapshotAt,
    });
    stdout.write(`Snapshot: ${result.outputPath}\nRows: ${result.rowCount}\n`);
    return 0;
  } catch {
    stderr.write("Snapshot failed; no file was written.\n");
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runSnapshotCli();
}
