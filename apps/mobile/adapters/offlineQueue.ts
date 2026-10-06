type OfflineMutation = {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: string;
};

const STORAGE_KEY = "loopdev_mobile_offline_mutations";
const handlers = new Map<string, (payload: unknown) => Promise<void>>();
let memoryQueue: OfflineMutation[] = [];

function readQueue(): OfflineMutation[] {
  if (typeof window === "undefined") return [...memoryQueue];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [...memoryQueue];
  }
}

function writeQueue(queue: OfflineMutation[]) {
  memoryQueue = queue;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Keep the in-memory queue when browser storage is unavailable.
  }
}

export function registerOfflineMutationHandler(kind: string, handler: (payload: unknown) => Promise<void>) {
  handlers.set(kind, handler);
}

export function enqueueOfflineMutation(kind: string, payload: unknown) {
  const queue = readQueue();
  const id = typeof payload === "object" && payload && "idempotencyKey" in payload
    ? String((payload as { idempotencyKey?: string }).idempotencyKey)
    : `${kind}:${Date.now()}`;
  if (queue.some((item) => item.id === id)) return;
  writeQueue([...queue, { id, kind, payload, createdAt: new Date().toISOString() }]);
}

export async function flushOfflineMutations() {
  const queue = readQueue();
  const remaining: OfflineMutation[] = [];
  for (const item of queue) {
    const handler = handlers.get(item.kind);
    if (!handler) {
      remaining.push(item);
      continue;
    }
    try {
      await handler(item.payload);
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
}