/// <reference lib="webworker" />

import {
  appendErrorToAssistantMessage,
  appendReasoningDeltaToMessages,
  appendTextDeltaToMessages,
  attachReferencesToMessages,
  attachSkillOutputToMessages,
  completeAssistantMessage,
  upsertToolCallInMessages,
} from '../services/chat/messageState'
import { readSseStream } from '../services/chat/sse'
import type { ChatStreamHttpRequest, ChatStreamSnapshot } from '../services/chat/types'

type WorkerPortMessage =
  | {
      type: 'start-stream'
      sessionId: string
      streamRequest: ChatStreamHttpRequest
      stopRequest: ChatStreamHttpRequest
      snapshot: ChatStreamSnapshot
    }
  | {
      type: 'resume-stream'
      sessionId: string
      streamRequest: ChatStreamHttpRequest
      stopRequest: ChatStreamHttpRequest
      snapshot: ChatStreamSnapshot
    }
  | {
      type: 'subscribe'
      sessionId: string
      requestId: string
    }
  | {
      type: 'unsubscribe'
      sessionId: string
    }
  | {
      type: 'stop-stream'
      sessionId: string
      requestId: string
    }

type ActiveRuntime = {
  controller: AbortController
  stopRequested: boolean
  stopRequest: ChatStreamHttpRequest
  snapshot: ChatStreamSnapshot
}

const runtimeMap = new Map<string, ActiveRuntime>()
const subscriptionMap = new Map<string, Set<MessagePort>>()

function ensureSubscription(sessionId: string): Set<MessagePort> {
  const existing = subscriptionMap.get(sessionId)

  if (existing) {
    return existing
  }

  const next = new Set<MessagePort>()
  subscriptionMap.set(sessionId, next)
  return next
}

function addSubscriber(sessionId: string, port: MessagePort): void {
  ensureSubscription(sessionId).add(port)
}

function removeSubscriber(sessionId: string, port: MessagePort): void {
  const subscribers = subscriptionMap.get(sessionId)

  if (!subscribers) {
    return
  }

  subscribers.delete(port)

  if (subscribers.size === 0) {
    subscriptionMap.delete(sessionId)
  }
}

function postSnapshot(
  sessionId: string,
  snapshot: ChatStreamSnapshot | null,
  requestId?: string
): void {
  const subscribers = subscriptionMap.get(sessionId)

  if (!subscribers) {
    return
  }

  subscribers.forEach((port) => {
    port.postMessage({
      type: 'snapshot',
      sessionId,
      requestId,
      snapshot,
    })
  })
}

function cloneSnapshot(snapshot: ChatStreamSnapshot): ChatStreamSnapshot {
  return {
    ...snapshot,
    messages: snapshot.messages.map((message) => ({
      ...message,
      toolCalls: [...message.toolCalls],
      processingSteps: (message.processingSteps ?? []).map((step) => {
        if (step.type === 'reasoning') {
          return { ...step }
        }

        return {
          ...step,
          toolCall: {
            ...step.toolCall,
            input: { ...step.toolCall.input },
          },
        }
      }),
      references: [...message.references],
      skillOutput: [...message.skillOutput],
      attachments: [...message.attachments],
    })),
  }
}

function updateSnapshot(
  sessionId: string,
  updater: (snapshot: ChatStreamSnapshot) => ChatStreamSnapshot
): ChatStreamSnapshot | null {
  const runtime = runtimeMap.get(sessionId)

  if (!runtime) {
    return null
  }

  runtime.snapshot = updater(runtime.snapshot)
  postSnapshot(sessionId, runtime.snapshot)
  return runtime.snapshot
}

function buildTimestamp(): string {
  return new Date().toISOString()
}

async function fetchStream(request: ChatStreamHttpRequest, controller: AbortController): Promise<Response> {
  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: controller.signal,
  })
}

async function runStream(message: Extract<WorkerPortMessage, { type: 'start-stream' | 'resume-stream' }>): Promise<void> {
  const previousRuntime = runtimeMap.get(message.sessionId)

  if (previousRuntime) {
    previousRuntime.controller.abort()
  }

  const controller = new AbortController()
  const runtime: ActiveRuntime = {
    controller,
    stopRequested: false,
    stopRequest: message.stopRequest,
    snapshot: cloneSnapshot(message.snapshot),
  }
  runtimeMap.set(message.sessionId, runtime)
  postSnapshot(message.sessionId, runtime.snapshot)

  try {
    const response = await fetchStream(message.streamRequest, controller)

    if (!response.ok || !response.body) {
      throw new Error('流式响应失败')
    }

    await readSseStream(response.body, {
      onEventId(eventId) {
        const nextSequence = Number(eventId)

        if (!Number.isFinite(nextSequence)) {
          return
        }

        updateSnapshot(message.sessionId, (snapshot) => ({
          ...snapshot,
          lastEventSequence: nextSequence,
        }))
      },
      onTextDelta(chunk) {
        updateSnapshot(message.sessionId, (snapshot) => {
          if (!snapshot.activeMessageId) {
            return snapshot
          }

          const result = appendTextDeltaToMessages(
            snapshot.messages,
            snapshot.activeMessageId,
            chunk,
            buildTimestamp(),
          )

          return {
            ...snapshot,
            messages: result.messages,
            activeMessageId: result.activeMessageId,
          }
        })
      },
      onReasoningDelta(chunk) {
        updateSnapshot(message.sessionId, (snapshot) => {
          if (!snapshot.activeMessageId) {
            return snapshot
          }

          return {
            ...snapshot,
            messages: appendReasoningDeltaToMessages(
              snapshot.messages,
              snapshot.activeMessageId,
              chunk,
              buildTimestamp(),
            ),
          }
        })
      },
      onToolStart(toolCall) {
        updateSnapshot(message.sessionId, (snapshot) => {
          if (!snapshot.activeMessageId) {
            return snapshot
          }

          return {
            ...snapshot,
            messages: upsertToolCallInMessages(
              snapshot.messages,
              snapshot.activeMessageId,
              toolCall,
              buildTimestamp(),
            ),
          }
        })
      },
      onToolEnd(toolCall) {
        updateSnapshot(message.sessionId, (snapshot) => {
          if (!snapshot.activeMessageId) {
            return snapshot
          }

          return {
            ...snapshot,
            messages: upsertToolCallInMessages(
              snapshot.messages,
              snapshot.activeMessageId,
              toolCall,
              buildTimestamp(),
            ),
          }
        })
      },
      onReferences(references) {
        updateSnapshot(message.sessionId, (snapshot) => {
          if (!snapshot.activeMessageId) {
            return snapshot
          }

          return {
            ...snapshot,
            messages: attachReferencesToMessages(
              snapshot.messages,
              snapshot.activeMessageId,
              references,
            ),
          }
        })
      },
      onSkillOutput(skillOutput) {
        updateSnapshot(message.sessionId, (snapshot) => {
          if (!snapshot.activeMessageId) {
            return snapshot
          }

          return {
            ...snapshot,
            messages: attachSkillOutputToMessages(
              snapshot.messages,
              snapshot.activeMessageId,
              skillOutput,
            ),
          }
        })
      },
    })

    updateSnapshot(message.sessionId, (snapshot) => ({
      ...snapshot,
      status: runtime.stopRequested ? 'aborted' : 'completed',
      messages: snapshot.activeMessageId
        ? completeAssistantMessage(snapshot.messages, snapshot.activeMessageId)
        : snapshot.messages,
      error: null,
    }))
  } catch (error) {
    const currentRuntime = runtimeMap.get(message.sessionId)

    if (!currentRuntime) {
      return
    }

    if (currentRuntime.controller.signal.aborted && currentRuntime.stopRequested) {
      updateSnapshot(message.sessionId, (snapshot) => ({
        ...snapshot,
        status: 'aborted',
        messages: snapshot.activeMessageId
          ? completeAssistantMessage(snapshot.messages, snapshot.activeMessageId)
          : snapshot.messages,
      }))
      return
    }

    updateSnapshot(message.sessionId, (snapshot) => ({
      ...snapshot,
      status: 'error',
      error: error instanceof Error ? error.message : '流式响应失败',
      messages: snapshot.activeMessageId
        ? appendErrorToAssistantMessage(
            snapshot.messages,
            snapshot.activeMessageId,
            '流式响应失败，请稍后重试。',
          )
        : snapshot.messages,
    }))
  }
}

async function stopRuntime(port: MessagePort, sessionId: string, requestId: string): Promise<void> {
  const runtime = runtimeMap.get(sessionId)

  if (!runtime) {
    port.postMessage({
      type: 'stop-stream-result',
      sessionId,
      requestId,
      ok: true,
    })
    return
  }

  runtime.stopRequested = true
  runtime.controller.abort()

  try {
    await fetch(runtime.stopRequest.url, {
      method: runtime.stopRequest.method,
      headers: runtime.stopRequest.headers,
      body: runtime.stopRequest.body,
    })

    port.postMessage({
      type: 'stop-stream-result',
      sessionId,
      requestId,
      ok: true,
    })
  } catch (error) {
    port.postMessage({
      type: 'stop-stream-result',
      sessionId,
      requestId,
      ok: false,
      error: error instanceof Error ? error.message : '停止流失败',
    })
  }
}

const workerScope = self as unknown as SharedWorkerGlobalScope

workerScope.onconnect = (event: MessageEvent) => {
  const [port] = event.ports

  if (!port) {
    return
  }

  port.start()

  port.onmessage = (messageEvent: MessageEvent<WorkerPortMessage>) => {
    const payload = messageEvent.data

    switch (payload.type) {
      case 'start-stream':
      case 'resume-stream':
        addSubscriber(payload.sessionId, port)
        void runStream(payload)
        break
      case 'subscribe':
        addSubscriber(payload.sessionId, port)
        port.postMessage({
          type: 'snapshot',
          sessionId: payload.sessionId,
          requestId: payload.requestId,
          snapshot: runtimeMap.get(payload.sessionId)?.snapshot ?? null,
        })
        break
      case 'unsubscribe':
        removeSubscriber(payload.sessionId, port)
        break
      case 'stop-stream':
        void stopRuntime(port, payload.sessionId, payload.requestId)
        break
      default:
        break
    }
  }
}

export {}
