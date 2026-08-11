import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

const dbQueryDebugSuppression = new AsyncLocalStorage<boolean>();

export function isDbQueryDebugSuppressed() {
  return dbQueryDebugSuppression.getStore() === true;
}

export function withoutDbQueryDebug<T>(callback: () => Promise<T>) {
  return dbQueryDebugSuppression.run(true, callback);
}
