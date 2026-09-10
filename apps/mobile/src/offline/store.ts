import { Platform } from 'react-native';
import type { OfflineEvent } from './types';

const implementation = Platform.OS === 'web' ? import('./store.web') : import('./store.native');

export async function saveEvent(event: OfflineEvent) { return (await implementation).saveEvent(event); }
export async function listEvents(): Promise<OfflineEvent[]> { return (await implementation).listEvents(); }
export async function removeEvent(clientEventId: string) { return (await implementation).removeEvent(clientEventId); }
export async function rememberScan(rawValue: string) { return (await implementation).rememberScan(rawValue); }
export async function listRecentScans(limit = 8): Promise<string[]> { return (await implementation).listRecentScans(limit); }
