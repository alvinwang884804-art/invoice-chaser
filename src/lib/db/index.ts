/**
 * SQLite database connection via better-sqlite3.
 * Singleton pattern — reuse the connection across the Next.js process.
 * Tables are created on first use (auto-migrate), so the app works with
 * a fresh clone and no manual setup step beyond `npm run setup`.
 */

import Database from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "invoice-chaser.db");

// Ensure the data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

// Module-level singleton — Next.js keeps one Node process alive in dev
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  applyMigrations(db);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createDb();
  }
  return global.__db;
}

function applyMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Client (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      email     TEXT,
      phone     TEXT,
      notes     TEXT,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS Invoice (
      id          TEXT PRIMARY KEY,
      clientId    TEXT NOT NULL REFERENCES Client(id),
      number      TEXT NOT NULL,
      amountCents INTEGER NOT NULL CHECK(amountCents > 0),
      dueDate     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent','overdue','paid')),
      paymentLink TEXT,
      createdAt   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS Payment (
      id          TEXT PRIMARY KEY,
      invoiceId   TEXT NOT NULL REFERENCES Invoice(id),
      amountCents INTEGER NOT NULL CHECK(amountCents > 0),
      method      TEXT CHECK(method IN ('cash','card','e-transfer','other')),
      paidAt      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    );

    CREATE TABLE IF NOT EXISTS Template (
      id      TEXT PRIMARY KEY,
      step    INTEGER NOT NULL CHECK(step IN (1,7,14,30)),
      channel TEXT NOT NULL CHECK(channel IN ('email','sms')),
      subject TEXT,
      body    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Reminder (
      id         TEXT PRIMARY KEY,
      invoiceId  TEXT NOT NULL REFERENCES Invoice(id),
      step       INTEGER NOT NULL CHECK(step IN (1,7,14,30)),
      channel    TEXT NOT NULL CHECK(channel IN ('email','sms')),
      templateId TEXT NOT NULL REFERENCES Template(id),
      sentAt     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      status     TEXT NOT NULL CHECK(status IN ('sent','skipped','failed')),
      note       TEXT
    );
  `);
}
