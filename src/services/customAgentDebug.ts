import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import { getChatUserId } from './chat/api'
import { readSseStream, type ReadSseStreamOptions } from './chat/sse'

const CUSTOM_AGENT_DEBUG_PATH = '/api/v1/custom-agents/debug/stream'

export type CustomAgentDebugHistoryItem = {
  role: 'user' | 'assistant'
  content: string
}

export type CustomAgentDebugSkillItem = {
  skill_name: string
  chinese_name?: string
  description?: string
}

export type CustomAgentDebugKnowledgeSpaceItem = {
  id: string
  spaceName: string
}

export type CustomAgentDebugRequest = {
  agent_name: string
  agent_prompt: string
  description: string
  message: string
  history: CustomAgentDebugHistoryItem[]
  enabled_skills: CustomAgentDebugSkillItem[]
  knowledge_spaces: CustomAgentDebugKnowledgeSpaceItem[]
  enable_web_search?: boolean
}

export type CustomAgentDebugStreamCallbacks = ReadSseStreamOptions & {
  onComplete?: () => void
  onError?: (error: Error) => void
}

function getRequiredUserId(): string {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法调试智能体')
  }

  return userId
}

export async function streamCustomAgentDebug(
  payload: CustomAgentDebugRequest,
  signal: AbortSignal,
  callbacks: CustomAgentDebugStreamCallbacks = {},
): Promise<void> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(CUSTOM_AGENT_DEBUG_PATH, {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      user_id: userId,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    const errorSuffix = errorText.trim() ? ` ${errorText.trim()}` : ''
    throw new Error(`智能体调试失败: HTTP ${response.status}${errorSuffix}`)
  }

  if (!response.body) {
    throw new Error('智能体调试失败：响应体为空')
  }

  try {
    await readSseStream(response.body, callbacks)
    callbacks.onComplete?.()
  } catch (error) {
    if (signal.aborted) {
      return
    }

    const resolvedError = error instanceof Error ? error : new Error('智能体调试流解析失败')
    callbacks.onError?.(resolvedError)
    throw resolvedError
  }
}
