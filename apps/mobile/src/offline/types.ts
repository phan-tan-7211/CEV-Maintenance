export type OfflineEventType = 'asset.scan' | 'work_order.create' | 'work_order.start' | 'work_order.hold' | 'work_order.complete';
export type OfflineEventStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export type OfflineEvent = {
  clientEventId: string;
  type: OfflineEventType;
  payload: Record<string, unknown>;
  payloadVersion: 1;
  deviceTimestamp: string;
  actorId?: string;
  status: OfflineEventStatus;
  attempts: number;
  lastError?: string;
  serverTimestamp?: string;
};

export type SyncSummary = { synced: number; failed: number; remaining: number };
