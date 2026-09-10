import { supabase } from '../lib/supabase';
import { listEvents, removeEvent, saveEvent } from './store';
import type { OfflineEvent, OfflineEventType } from './types';

function uuid() {
  const random = Math.random().toString(16).slice(2);
  return `${Date.now().toString(16)}-${random}-${Math.random().toString(16).slice(2)}`;
}

export async function enqueueBusinessEvent(type: OfflineEventType, payload: Record<string, unknown>): Promise<OfflineEvent> {
  const { data } = await supabase.auth.getUser();
  const event: OfflineEvent = {
    clientEventId: uuid(), type, payload, payloadVersion: 1, deviceTimestamp: new Date().toISOString(),
    actorId: data.user?.id, status: 'pending', attempts: 0,
  };
  await saveEvent(event);
  return event;
}

export async function pendingEvents() { return listEvents(); }
export async function updateQueuedEvent(event: OfflineEvent) { return saveEvent(event); }
export async function deleteQueuedEvent(clientEventId: string) { return removeEvent(clientEventId); }
