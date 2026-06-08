import {
  authorizedFetch,
  buildAiApiUrl,
  buildAuthorizedHeaders,
} from '../../utils/request'
import type { ChatStreamHttpRequest, ChatStreamStartPayload } from './types'

const CHAT_SESSIONS_PATH = '/api/v1/chat/sessions'

function readLocalStorage(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() ?? ''
  } catch {
    return ''
  }
}

function readUserInfoField(field: 'id'): string {
  const rawUserInfo = readLocalStorage('userInfo')

  if (!rawUserInfo) {
    return ''
  }

  try {
    const parsed = JSON.parse(rawUserInfo) as Record<string, unknown>
    const value = parsed[field]
    return value === undefined || value === null ? '' : String(value).trim()
  } catch {
    return ''
  }
}

export function getChatUserId(): string {
  return readLocalStorage('SUPERSONIC_ID') || readUserInfoField('id')
}

type CreateSessionResponse = {
  session_id?: string
  sessionId?: string
  id?: string
  data?: {
    session_id?: string
    sessionId?: string
    id?: string
    session?: {
      session_id?: string
      sessionId?: string
      id?: string
    }
  }
}

export function extractSessionId(payload: CreateSessionResponse): string {
  const sessionId = payload.session_id
    ?? payload.sessionId
    ?? payload.id
    ?? payload.data?.session_id
    ?? payload.data?.sessionId
    ?? payload.data?.id
    ?? payload.data?.session?.session_id
    ?? payload.data?.session?.sessionId
    ?? payload.data?.session?.id

  if (!sessionId) {
    throw new Error('会话创建成功但未返回 session_id')
  }

  return sessionId
}

export async function createChatSession(
  signal?: AbortSignal,
  agentId?: string | null,
): Promise<{ sessionId: string }> {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法创建会话')
  }

  const response = await authorizedFetch(buildAiApiUrl(CHAT_SESSIONS_PATH), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      ...(agentId ? { agent_id: agentId } : {}),
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error('创建会话失败')
  }

  return {
    sessionId: extractSessionId((await response.json()) as CreateSessionResponse),
  }
}

export async function buildStartChatStreamRequest(
  sessionId: string,
  payload: ChatStreamStartPayload
): Promise<{
  streamRequest: ChatStreamHttpRequest
  stopRequest: ChatStreamHttpRequest
}> {
  const streamUrl = buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}/stream`)
  const stopUrl = buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}/stream/stop`)

  const streamHeaders = await buildAuthorizedHeaders(streamUrl, 'POST', {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  })
  const stopHeaders = await buildAuthorizedHeaders(stopUrl, 'POST', {
    Accept: 'application/json',
  })

  return {
    streamRequest: {
      url: streamUrl,
      method: 'POST',
      headers: streamHeaders,
      body: JSON.stringify({
        enable_web_search: false,
        include_tool_details: true,
        message: payload.message,
        uploaded_files: payload.uploadedFiles ?? [],
        resource_ids: payload.resourceIds ?? [],
        ...(payload.skillName ? { skill_name: payload.skillName } : {}),
      }),
    },
    stopRequest: {
      url: stopUrl,
      method: 'POST',
      headers: stopHeaders,
    },
  }
}

export async function buildResumeChatStreamRequest(
  sessionId: string,
  afterSequence: number
): Promise<{
  streamRequest: ChatStreamHttpRequest
  stopRequest: ChatStreamHttpRequest
}> {
  const streamUrl = buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}/stream`, {
    cursor: String(afterSequence),
  })
  const stopUrl = buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}/stream/stop`)

  const streamHeaders = await buildAuthorizedHeaders(streamUrl, 'GET', {
    Accept: 'text/event-stream',
  })
  const stopHeaders = await buildAuthorizedHeaders(stopUrl, 'POST', {
    Accept: 'application/json',
  })

  return {
    streamRequest: {
      url: streamUrl,
      method: 'GET',
      headers: streamHeaders,
    },
    stopRequest: {
      url: stopUrl,
      method: 'POST',
      headers: stopHeaders,
    },
  }
}

export async function streamChatMessage(
  sessionId: string,
  payload: ChatStreamStartPayload,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const { streamRequest } = await buildStartChatStreamRequest(sessionId, payload)
  const response = await authorizedFetch(streamRequest.url, {
    method: streamRequest.method,
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: streamRequest.body,
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error('流式响应失败')
  }

  return response.body
}

export async function resumeChatMessageStream(
  sessionId: string,
  afterSequence: number,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const requestUrl = buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}/stream`, {
    cursor: String(afterSequence),
  })
  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
    },
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error('恢复流式响应失败')
  }

  return response.body
}

export async function stopChatMessageStream(sessionId: string, signal?: AbortSignal): Promise<void> {
  const response = await authorizedFetch(buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}/stream/stop`), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('停止流式响应失败')
  }
}

export function buildArtifactPreviewUrl(sessionId: string, relativePath: string): string {
  return buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}/files/preview`, {
    path: relativePath,
  })
}
