import { enqueueBusinessEvent } from './queue';

export const queueWorkOrderCreate = (input: { title: string; description?: string; assetId?: string; priority?: string; workType?: string; photoLocalPaths?: string[] }) =>
  enqueueBusinessEvent('work_order.create', { ...input, photo_local_paths: input.photoLocalPaths ?? [] });
export const queueWorkOrderStart = (workOrderId: string) => enqueueBusinessEvent('work_order.start', { work_order_id: workOrderId });
export const queueWorkOrderHold = (workOrderId: string) => enqueueBusinessEvent('work_order.hold', { work_order_id: workOrderId });
export const queueWorkOrderComplete = (workOrderId: string) => enqueueBusinessEvent('work_order.complete', { work_order_id: workOrderId });
