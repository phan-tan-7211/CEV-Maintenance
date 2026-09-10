import * as SQLite from 'expo-sqlite';
import type { OfflineEvent } from './types';

let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;
async function db() {
  dbPromise ??= SQLite.openDatabaseAsync('cev-maintenance-offline.db');
  const value = await dbPromise;
  await value.execAsync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pending_events (
      client_event_id TEXT PRIMARY KEY NOT NULL,
      event_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS recent_scans (
      raw_value TEXT PRIMARY KEY NOT NULL,
      scanned_at TEXT NOT NULL
    );`);
  return value;
}

export async function saveEvent(event: OfflineEvent) {
  const value = await db();
  await value.runAsync('INSERT OR REPLACE INTO pending_events (client_event_id,event_json,created_at) VALUES (?,?,?)', event.clientEventId, JSON.stringify(event), event.deviceTimestamp);
}
export async function listEvents(): Promise<OfflineEvent[]> {
  const value = await db();
  const rows = await value.getAllAsync<{ event_json: string }>('SELECT event_json FROM pending_events ORDER BY created_at ASC');
  return rows.map((row) => JSON.parse(row.event_json) as OfflineEvent);
}
export async function removeEvent(clientEventId: string) {
  const value = await db();
  await value.runAsync('DELETE FROM pending_events WHERE client_event_id = ?', clientEventId);
}
export async function rememberScan(rawValue: string) {
  const value = await db();
  await value.runAsync('INSERT OR REPLACE INTO recent_scans (raw_value,scanned_at) VALUES (?,?)', rawValue, new Date().toISOString());
}
export async function listRecentScans(limit = 8): Promise<string[]> {
  const value = await db();
  const rows = await value.getAllAsync<{ raw_value: string }>('SELECT raw_value FROM recent_scans ORDER BY scanned_at DESC LIMIT ?', limit);
  return rows.map((row) => row.raw_value);
}
