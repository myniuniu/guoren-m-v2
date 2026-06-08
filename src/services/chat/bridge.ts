import type { ChatStreamHttpRequest, ChatStreamSnapshot } from './types'

type StartOrResumePayload = {
  sessionId: string
  streamRequest: ChatStreamHttpRequest
  stopRequest: ChatStreamHttpRequest
  snapshot: ChatStreamSnapshot
}

type WorkerSnapshotMessage = {
  type: 'snapshot'
  sessionId: string
  requestId?: string
  snapshot: ChatStreamSnapshot | null
}

type WorkerStopResultMessage = {
  type: 'stop-stream-result'
  sessionId: string
  requestId: string
  ok: boolean
  error?: string
}

export interface ChatStreamBridge {
  startStream: (payload: StartOrResumePayload) => void
  resumeStream: (payload: StartOrResumePayload) => void
  stopStream: (sessionId: string) => Promise<void>
  subscribe: (sessionId: string) => Promise<ChatStreamSnapshot | null>
  unsubscribe: (sessionId: string) => void
  destroy: () => void
}

function isSnapshotMessage(value: unknown): value is WorkerSnapshotMessage {
  return typeof value === 'object'
    && value !== null
    && (value as { type?: unknown }).type === 'snapshot'
    && typeof (value as { sessionId?: unknown }).sessionId === 'string'
    && 'snapshot' in value
}

function isStopStreamResultMessage(value: unknown): value is WorkerStopResultMessage {
  return typeof value === 'object'
    && value !== null
    && (value as { type?: unknown }).type === 'stop-stream-result'
    && typeof (value as { sessionId?: unknown }).sessionId === 'string'
    && typeof (value as { requestId?: unknown }).requestId === 'string'
    && typeof (value as { ok?: unknown }).ok === 'boolean'
}

export function createChatStreamBridge(
  onSnapshot: (snapshot: ChatStreamSnapshot) => void
): ChatStreamBridge | null {
  if (typeof window === 'undefined' || typeof SharedWorker === 'undefined') {
    return null
  }

  try {
    const worker = new SharedWorker(
      new URL('../../workers/chatStreamSharedWorker.ts', import.meta.url),
      {
        type: 'module',
        name: 'chat-stream-worker',
      }
    )
    const { port } = worker
    port.start()

    const pendingSnapshots = new Map<string, (snapshot: ChatStreamSnapshot | null) => void>()
    const pendingStops = new Map<string, { resolve: () => void; reject: (error: Error) => void }>()

    port.onmessage = (event: MessageEvent<unknown>) => {
      const payload = event.data

      if (isSnapshotMessage(payload)) {
        if (payload.snapshot) {
          onSnapshot(payload.snapshot)
        }

        if (payload.requestId) {
          const resolve = pendingSnapshots.get(payload.requestId)
          if (resolve) {
            pendingSnapshots.delete(payload.requestId)
            resolve(payload.snapshot)
          }
        }

        return
      }

      if (isStopStreamResultMessage(payload)) {
        const pending = pendingStops.get(payload.requestId)

        if (!pending) {
          return
        }

        pendingStops.delete(payload.requestId)

        if (payload.ok) {
          pending.resolve()
          return
        }

        pending.reject(new Error(payload.error || '停止流式任务失败'))
      }
    }

    return {
      startStream(payload) {
        port.postMessage({
          type: 'start-stream',
          ...payload,
        })
      },
      resumeStream(payload) {
        port.postMessage({
          type: 'resume-stream',
          ...payload,
        })
      },
      stopStream(sessionId) {
        return new Promise<void>((resolve, reject) => {
          const requestId = `stop-${sessionId}-${Date.now()}-${Math.random().toString(16).slice(2)}`
          pendingStops.set(requestId, { resolve, reject })

          port.postMessage({
            type: 'stop-stream',
            sessionId,
            requestId,
          })
        })
      },
      subscribe(sessionId) {
        return new Promise<ChatStreamSnapshot | null>((resolve) => {
          const requestId = `snapshot-${sessionId}-${Date.now()}-${Math.random().toString(16).slice(2)}`
          pendingSnapshots.set(requestId, resolve)

          port.postMessage({
            type: 'subscribe',
            sessionId,
            requestId,
          })
        })
      },
      unsubscribe(sessionId) {
        port.postMessage({
          type: 'unsubscribe',
          sessionId,
        })
      },
      destroy() {
        port.close()
      },
    }
  } catch (error) {
    console.warn('[chat-stream-bridge] SharedWorker 构造失败，回退主线程 fetch：', error)
    return null
  }
}
