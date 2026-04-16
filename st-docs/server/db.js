import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "st_docs.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      machine TEXT NOT NULL UNIQUE,
      group_name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      description TEXT,
      taxonomy_note TEXT,
      note_kind TEXT,
      note_text TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type_id TEXT NOT NULL,
      label TEXT NOT NULL,
      machine TEXT NOT NULL,
      hint TEXT,
      status TEXT NOT NULL CHECK(status IN ('required', 'optional')),
      type TEXT NOT NULL,
      multiple INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_type_id) REFERENCES content_types(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_fields_content_machine
      ON fields(content_type_id, machine);
    CREATE INDEX IF NOT EXISTS idx_content_types_group
      ON content_types(group_name);
    CREATE INDEX IF NOT EXISTS idx_fields_content_type
      ON fields(content_type_id, sort_order);
  `);
}

export function getDb() {
  return db;
}

export function runInTransaction(work) {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export { dbPath };
