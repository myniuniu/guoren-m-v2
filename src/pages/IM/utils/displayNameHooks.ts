/**
 * displayName React Hooks
 * 提供 useDisplayName / useDisplayNamePrefetch / useDisplayNameLookup
 * 底层通过 useSyncExternalStore 订阅 store 版本号变化
 */

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  getDisplayNameStoreVersion,
  subscribeDisplayNameStore,
  getDisplayNameStoreServerSnapshot,
  getDisplayNameSync,
  ensureDisplayNamesLoaded,
} from './displayNameStore';

// ----------------------------------------
// 内部：订阅 store 版本号
// ----------------------------------------
function useDisplayNameStoreSync(): number {
  return useSyncExternalStore(
    subscribeDisplayNameStore,
    getDisplayNameStoreVersion,
    getDisplayNameStoreServerSnapshot,
  );
}

// ----------------------------------------
// useDisplayName
// 给单个 userID 返回对应的 displayName
// ----------------------------------------
export function useDisplayName(userID: string | undefined, fallback?: string): string {
  // 订阅 store 版本号，驱动重新渲染
  useDisplayNameStoreSync();

  useEffect(() => {
    if (!userID) return;
    ensureDisplayNamesLoaded([userID]);
  }, [userID]);

  if (!userID) return fallback || '';
  return getDisplayNameSync(userID, fallback);
}

// ----------------------------------------
// useDisplayNamePrefetch
// 批量预加载多个 userID 的 displayName 到缓存中
// ----------------------------------------
export function useDisplayNamePrefetch(userIDs: string[]): void {
  const version = useDisplayNameStoreSync();

  useEffect(() => {
    if (!userIDs.length) return;
    ensureDisplayNamesLoaded(userIDs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...userIDs]);
}

// ----------------------------------------
// useDisplayNameLookup
// 返回一个同步 lookup 函数，用于非 React 渲染上下文
// ----------------------------------------
export function useDisplayNameLookup(): (userID: string, fallback?: string) => string {
  // 订阅 store 版本号
  useDisplayNameStoreSync();

  return useCallback((userID: string, fallback?: string): string => {
    return getDisplayNameSync(userID, fallback);
  }, []);
}
