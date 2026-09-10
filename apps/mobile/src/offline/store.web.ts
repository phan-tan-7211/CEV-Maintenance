import type { OfflineEvent } from './types';

const EVENTS = 'cev.offline.events.v1';
const SCANS = 'cev.recent.scans.v1';
const read = <T,>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
};
const write = (key: string, value: unknown) => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value)); };

export async function saveEvent(event: OfflineEvent) {
  const events = read<OfflineEvent[]>(EVENTS, []).filter((item) => item.clientEventId !== event.clientEventId);
  write(EVENTS, [...events, event]);
}
export async function listEvents(): Promise<OfflineEvent[]> { return read<OfflineEvent[]>(EVENTS, []); }
export async function removeEvent(clientEventId: string) { write(EVENTS, read<OfflineEvent[]>(EVENTS, []).filter((item) => item.clientEventId !== clientEventId)); }
export async function rememberScan(rawValue: string) { write(SCANS, [rawValue, ...read<string[]>(SCANS, []).filter((value) => value !== rawValue)].slice(0, 8)); }
export async function listRecentScans(limit = 8): Promise<string[]> { return read<string[]>(SCANS, []).slice(0, limit); }
