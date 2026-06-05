/**
 * displayName 缓存 Store
 * Map 缓存 + TTL 过期 + 并发去重 + 发布订阅
 * 双通道查询：业务 API 优先，SDK getUserProfile 兜底
 */

import { fetchUserBasicInfo } from '../api/userBasicInfo';
import { getChatInstance } from '../hooks/useIMLogin';

// TTL 配置（毫秒）
const SUCCESS_TTL = 10 * 60 * 1000; // 10 分钟
const ERROR_TTL = 1 * 60 * 1000;    // 1 分钟

export interface DisplayNameCacheEntry {
  userID: string;
  status: 'success' | 'error';
  displayName: string;
  fetchedAt: number;
  errorMessage?: string;
  username?: string;
  avatar?: string | null;
}

// 缓存容器
const displayNameCache = new Map<string, DisplayNameCacheEntry>();
// 并发去重 inflight
const inflightRequests = new Map<string, Promise<void>>();
// 订阅者
const listeners = new Set<() => void>();
// Store 版本号（用于 React 订阅）
let storeVersion = 0;

function getNow(): number {
  return Date.now();
}

function emitDisplayNameStoreChange(): void {
  storeVersion += 1;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // 忽略
    }
  });
}

export function getDisplayNameStoreVersion(): number {
  return storeVersion;
}

export function subscribeDisplayNameStore(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// SSR 快照（浏览器环境返回当前版本）
export function getDisplayNameStoreServerSnapshot(): number {
  return 0;
}

/**
 * 判断是否需要跳过 displayName 查询
 */
export function shouldSkipDisplayNameLookup(userID: string): boolean {
  if (!userID) return true;
  // 群组 ID 不是用户，跳过
  if (userID.startsWith('@TGS#')) return true;
  // 机器人 ID 跳过（SDK 兜底查询 nick）
  if (userID.startsWith('@RBT#')) return true;
  return false;
}

/**
 * 检查缓存是否有效（未过期）
 */
function isCacheValid(entry: DisplayNameCacheEntry): boolean {
  const now = getNow();
  const ttl = entry.status === 'success' ? SUCCESS_TTL : ERROR_TTL;
  return now - entry.fetchedAt < ttl;
}

/**
 * 获取缓存中的 displayName（同步）
 */
export function getDisplayNameSync(userID: string, fallback?: string): string {
  if (shouldSkipDisplayNameLookup(userID)) {
    return fallback || userID;
  }
  const entry = displayNameCache.get(userID);
  if (entry && entry.status === 'success' && isCacheValid(entry)) {
    return entry.displayName || fallback || userID;
  }
  return fallback || userID;
}

/**
 * SDK getUserProfile 兜底查询
 */
async function sdkGetUserProfile(userID: string): Promise<string | null> {
  try {
    const chat = getChatInstance();
    if (!chat || !chat.getUserProfile) return null;
    const result = await chat.getUserProfile({
      userIDList: [userID],
    });
    const profileList = result?.data || [];
    const profile = profileList[0];
    if (profile && profile.profile) {
      const nick = String(profile.profile.nick || '').trim();
      if (nick) return nick;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 确保单个 userID 的 displayName 已加载
 * 业务 API 优先，SDK 兜底
 */
async function doFetchDisplayName(userID: string): Promise<void> {
  if (shouldSkipDisplayNameLookup(userID)) return;

  // 检查缓存（有效则复用）
  const cached = displayNameCache.get(userID);
  if (cached && isCacheValid(cached)) {
    return;
  }

  // 检查 inflight（并发去重）
  const inflight = inflightRequests.get(userID);
  if (inflight) {
    return inflight;
  }

  const promise = (async () => {
    // 优先走业务 API
    const userInfo = await fetchUserBasicInfo(userID).catch(() => null);
    if (userInfo && userInfo.displayName) {
      displayNameCache.set(userID, {
        userID,
        status: 'success',
        displayName: userInfo.displayName,
        fetchedAt: getNow(),
        username: userInfo.username,
        avatar: userInfo.avatar,
      });
      emitDisplayNameStoreChange();
      return;
    }

    // SDK 兜底
    const sdkNick = await sdkGetUserProfile(userID);
    if (sdkNick) {
      displayNameCache.set(userID, {
        userID,
        status: 'success',
        displayName: sdkNick,
        fetchedAt: getNow(),
      });
      emitDisplayNameStoreChange();
      return;
    }

    // 两个都失败
    displayNameCache.set(userID, {
      userID,
      status: 'error',
      displayName: userID,
      fetchedAt: getNow(),
      errorMessage: '无法获取用户姓名',
    });
    emitDisplayNameStoreChange();
  })();

  inflightRequests.set(userID, promise);
  try {
    await promise;
  } finally {
    inflightRequests.delete(userID);
  }
}

/**
 * 确保多个 userID 的 displayName 已加载
 */
export function ensureDisplayNamesLoaded(userIDs: string[]): Promise<void> {
  const uniqueIDs = [...new Set(userIDs.filter((id) => !shouldSkipDisplayNameLookup(id)))];
  return Promise.all(uniqueIDs.map((id) => doFetchDisplayName(id))).then(() => {});
}

/**
 * 手动种子（写入已知数据到缓存，避免覆盖已有有效数据）
 */
export function seedDisplayNameCache(userID: string, displayName: string): void {
  if (shouldSkipDisplayNameLookup(userID) || !displayName) return;
  const existing = displayNameCache.get(userID);
  if (existing && existing.status === 'success' && isCacheValid(existing)) {
    // 已有有效数据，不覆盖
    return;
  }
  displayNameCache.set(userID, {
    userID,
    status: 'success',
    displayName,
    fetchedAt: getNow(),
  });
  emitDisplayNameStoreChange();
}
