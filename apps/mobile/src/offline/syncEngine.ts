import * as Network from 'expo-network';
import { supabase } from '../lib/supabase';
import { deleteQueuedEvent, pendingEvents, updateQueuedEvent } from './queue';
import type { OfflineEvent, SyncSummary } from './types';

export async function isOnline() {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('AUTH_REQUIRED');
  if (data.session.expires_at && data.session.expires_at * 1000 < Date.now() + 30_000) {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
  }
}

async function replay(event: OfflineEvent) {
  const { data, error } = await supabase.rpc('apply_mobile_business_event', {
    p_client_event_id: event.clientEventId,
    p_event_type: event.type,
    p_payload: event.payload,
    p_payload_version: event.payloadVersion,
    p_device_timestamp: event.deviceTimestamp,
  });
  if (error) throw error;
  return data as { server_timestamp?: string } | null;
}

export async function syncPendingEvents(onPullRefresh?: () => Promise<void>): Promise<SyncSummary> {
  const events = await pendingEvents();
  if (!(await isOnline())) return { synced: 0, failed: 0, remaining: events.length };
  await ensureSession();
  let synced = 0;
  let failed = 0;
  for (const event of events) {
    const syncing: OfflineEvent = { ...event, status: 'syncing', attempts: event.attempts + 1, lastError: undefined };
    await updateQueuedEvent(syncing);
    try {
      await replay(syncing);
      await deleteQueuedEvent(syncing.clientEventId);
      synced += 1;
    } catch (error) {
      failed += 1;
      await updateQueuedEvent({ ...syncing, status: 'failed', lastError: error instanceof Error ? error.message : String(error) });
      break;
    }
  }
  if (synced > 0 && onPullRefresh) await onPullRefresh();
  return { synced, failed, remaining: (await pendingEvents()).length };
}
