import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SNAPSHOT_HEADER } from "./export-profile-usernames.mjs";

function malformedCsv() {
  throw new Error("Malformed CSV record.");
}

export function parseCsvRecords(content) {
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;
  let quoteClosed = false;

  const finishRecord = () => {
    record.push(field);
    records.push(record);
    record = [];
    field = "";
    quoteClosed = false;
  };

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (inQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (quoteClosed) {
      if (character === ",") {
        record.push(field);
        field = "";
        quoteClosed = false;
      } else if (character === "\r" && content[index + 1] === "\n") {
        finishRecord();
        index += 1;
      } else if (character === "\n") {
        finishRecord();
      } else {
        malformedCsv();
      }
      continue;
    }

    if (character === '"') {
      if (field.length !== 0) malformedCsv();
      inQuotes = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\r" && content[index + 1] === "\n") {
      finishRecord();
      index += 1;
    } else if (character === "\n") {
      finishRecord();
    } else {
      field += character;
    }
  }

  if (inQuotes) malformedCsv();
  if (quoteClosed || field.length !== 0 || record.length !== 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

export function validateSnapshotBuffer(buffer) {
  const [header, ...rows] = parseCsvRecords(buffer.toString("utf8"));
  if (!header || header.length !== SNAPSHOT_HEADER.length || !header.every((value, index) => value === SNAPSHOT_HEADER[index])) {
    throw new Error("Snapshot CSV header is invalid.");
  }
  if (rows.some((row) => row.length !== SNAPSHOT_HEADER.length)) {
    throw new Error("Snapshot CSV row is invalid.");
  }
  return {
    rowCount: rows.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function validateSnapshotFile(filePath) {
  return validateSnapshotBuffer(await readFile(filePath));
}

export function parseValidationArgs(args) {
  let filePath;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--file") {
      filePath = args[index + 1];
      index += 1;
    } else if (argument.startsWith("--file=")) {
      filePath = argument.slice("--file=".length);
    } else {
      throw new Error("Unsupported validation argument.");
    }
  }
  if (!filePath) throw new Error("A snapshot --file is required.");
  return { filePath };
}

export async function runValidationCli({
  args = process.argv.slice(2),
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  try {
    const { filePath } = parseValidationArgs(args);
    const result = await validateSnapshotFile(filePath);
    stdout.write(`Snapshot: ${filePath}\nRows: ${result.rowCount}\nSHA-256: ${result.sha256}\n`);
    return 0;
  } catch {
    stderr.write("Snapshot validation failed; no usernames were printed.\n");
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runValidationCli();
}
