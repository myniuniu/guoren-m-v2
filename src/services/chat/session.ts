import { authorizedFetch, buildAiApiUrl } from '../../utils/request'
import { getChatUserId } from './api'
import type { ChatSession, ChatSessionDetail } from './types'

const CHAT_SESSIONS_PATH = '/api/v1/chat/sessions'

type ChatSessionsResponse = {
  sessions?: ChatSession[]
  total?: number
}

export type GroupedChatSessions = {
  today: ChatSession[]
  within7Days: ChatSession[]
  beyond7Days: ChatSession[]
}

function getSessionUpdatedTimestamp(session: Pick<ChatSession, 'updated_at'>): number {
  const timestamp = new Date(session.updated_at).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

// 后端偶发会返回重复 session_id，会直接把侧边栏“最近对话”的 React key 撞重复。
// 这里统一在服务层去重，只保留更新时间更新的一条，避免 UI 侧到处重复兜底。
export function dedupeChatSessions(sessions: ChatSession[]): ChatSession[] {
  const sessionMap = new Map<string, ChatSession>()

  sessions.forEach((session) => {
    const current = sessionMap.get(session.session_id)

    if (!current || getSessionUpdatedTimestamp(session) >= getSessionUpdatedTimestamp(current)) {
      sessionMap.set(session.session_id, session)
    }
  })

  return Array.from(sessionMap.values())
}

// 会话列表在 PC 端是按更新时间分成“今天 / 7天内 / 7天外”三段显示。
// H5 抽屉这里直接复用同一套口径，避免同一个用户在两个端上看到不同的会话分组结果。
export function groupChatSessionsByTime(sessions: ChatSession[]): GroupedChatSessions {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sortedSessions = [...dedupeChatSessions(sessions)].sort((a, b) => {
    return getSessionUpdatedTimestamp(b) - getSessionUpdatedTimestamp(a)
  })
  const groupedSessions: GroupedChatSessions = {
    today: [],
    within7Days: [],
    beyond7Days: [],
  }

  sortedSessions.forEach((session) => {
    const updatedAt = new Date(session.updated_at)
    const updatedDate = new Date(updatedAt.getFullYear(), updatedAt.getMonth(), updatedAt.getDate())

    if (updatedDate.getTime() === today.getTime()) {
      groupedSessions.today.push(session)
      return
    }

    if (updatedDate.getTime() >= sevenDaysAgo.getTime()) {
      groupedSessions.within7Days.push(session)
      return
    }

    groupedSessions.beyond7Days.push(session)
  })

  return groupedSessions
}

export async function fetchChatSessions(signal?: AbortSignal): Promise<ChatSession[]> {
  const userId = getChatUserId()

  if (!userId) {
    return []
  }

  const response = await authorizedFetch(buildAiApiUrl(CHAT_SESSIONS_PATH, {
    user_id: userId,
    tool_type: 'all',
  }), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('获取会话列表失败')
  }

  const payload = (await response.json()) as ChatSessionsResponse
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : []

  return [...dedupeChatSessions(sessions)].sort((a, b) => {
    return getSessionUpdatedTimestamp(b) - getSessionUpdatedTimestamp(a)
  })
}

export async function getChatSession(sessionId: string, signal?: AbortSignal): Promise<ChatSessionDetail> {
  const response = await authorizedFetch(buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('获取会话详情失败')
  }

  return (await response.json()) as ChatSessionDetail
}

export async function deleteChatSession(sessionId: string, signal?: AbortSignal): Promise<void> {
  const response = await authorizedFetch(buildAiApiUrl(`${CHAT_SESSIONS_PATH}/${sessionId}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('删除会话失败')
  }
}

export async function findLatestEmptySession(signal?: AbortSignal): Promise<string | null> {
  const sessions = await fetchChatSessions(signal)

  if (sessions.length === 0) {
    return null
  }

  const latestSession = [...sessions].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })[0]

  try {
    const detail = await getChatSession(latestSession.session_id, signal)
    return detail.message_count === 0 ? detail.session_id : null
  } catch {
    return null
  }
}

export function getSessionDisplayName(session: Pick<ChatSession, 'session_name'>): string {
  return session.session_name?.trim() || '话题'
}
