import type { ChatStreamSnapshot } from './types'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const ACTIVE_STREAM_SNAPSHOT_KEY = 'chat-active-stream-snapshots'

type SnapshotRecord = ChatStreamSnapshot & {
  savedAt: number
}

function getStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function readSnapshotMap(storage?: StorageLike | null): Record<string, SnapshotRecord> {
  const targetStorage = getStorage(storage)

  if (!targetStorage) {
    return {}
  }

  try {
    const rawValue = targetStorage.getItem(ACTIVE_STREAM_SNAPSHOT_KEY)

    if (!rawValue) {
      return {}
    }

    const parsed = JSON.parse(rawValue)
    return typeof parsed === 'object' && parsed !== null
      ? parsed as Record<string, SnapshotRecord>
      : {}
  } catch {
    return {}
  }
}

function writeSnapshotMap(
  snapshotMap: Record<string, SnapshotRecord>,
  storage?: StorageLike | null
): void {
  const targetStorage = getStorage(storage)

  if (!targetStorage) {
    return
  }

  try {
    const sessionIds = Object.keys(snapshotMap)

    if (sessionIds.length === 0) {
      targetStorage.removeItem(ACTIVE_STREAM_SNAPSHOT_KEY)
      return
    }

    targetStorage.setItem(ACTIVE_STREAM_SNAPSHOT_KEY, JSON.stringify(snapshotMap))
  } catch {
    // sessionStorage 超限时静默降级，下次恢复会退回接口拉历史
  }
}

export function persistChatStreamSnapshot(
  snapshot: ChatStreamSnapshot,
  storage?: StorageLike | null
): void {
  const snapshotMap = readSnapshotMap(storage)
  snapshotMap[snapshot.sessionId] = {
    ...snapshot,
    savedAt: Date.now(),
  }
  writeSnapshotMap(snapshotMap, storage)
}

export function loadChatStreamSnapshot(
  sessionId: string,
  storage?: StorageLike | null
): ChatStreamSnapshot | null {
  const snapshot = readSnapshotMap(storage)[sessionId]

  if (!snapshot) {
    return null
  }

  return {
    sessionId: snapshot.sessionId,
    messages: snapshot.messages,
    status: snapshot.status,
    error: snapshot.error,
    activeMessageId: snapshot.activeMessageId,
    lastEventSequence: snapshot.lastEventSequence,
  }
}

export function clearChatStreamSnapshot(sessionId: string, storage?: StorageLike | null): void {
  const snapshotMap = readSnapshotMap(storage)

  if (!(sessionId in snapshotMap)) {
    return
  }

  delete snapshotMap[sessionId]
  writeSnapshotMap(snapshotMap, storage)
}
