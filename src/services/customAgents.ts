import { type AgentPublishScope } from './agents'
import { getChatUserId } from './chat/api'
import { authorizedFetch, buildAiApiUrl } from '../utils/request'

const CUSTOM_AGENTS_PATH = '/api/v1/custom-agents'

export type CustomAgentPresetQuestion = {
  category?: string
  question: string
  instruction?: string
}

export type CustomAgentEnabledSkill = {
  skill_name: string
  chinese_name?: string
  description?: string
  template?: string
  source?: string
}

export type CustomAgentKnowledgeSpace = {
  id: string
  spaceName: string
}

export type CreateCustomAgentPayload = {
  agent_name: string
  agent_prompt: string
  avatar_url: string
  description: string
  enable_web_search: boolean
  enabled_skills: CustomAgentEnabledSkill[]
  is_public: boolean
  publish_scope: AgentPublishScope
  authorized_user_ids: string[]
  community_category_id?: string
  preset_questions: CustomAgentPresetQuestion[]
  knowledge_spaces: CustomAgentKnowledgeSpace[]
}

export type UpdateCustomAgentPayload = {
  agent_name?: string
  description?: string
  avatar_url?: string
  agent_prompt?: string
  enabled_skills?: Array<{ skill_name: string }>
  preset_questions?: CustomAgentPresetQuestion[]
  knowledge_spaces?: CustomAgentKnowledgeSpace[]
  enable_web_search?: boolean
  is_public?: boolean
  publish_scope?: AgentPublishScope
  authorized_user_ids?: string[]
  community_category_id?: string
  is_active?: boolean
}

export type CustomAgentDetail = {
  agent_id: string
  creator_user_id: string
  agent_name: string
  description: string
  avatar_url: string
  agent_prompt: string
  enabled_skills: CustomAgentEnabledSkill[]
  knowledge_spaces: CustomAgentKnowledgeSpace[]
  preset_questions: CustomAgentPresetQuestion[]
  enable_web_search: boolean
  is_active: boolean
  is_public: boolean
  publish_scope?: AgentPublishScope
  authorized_user_ids?: string[]
  created_at: string
  updated_at: string
}

type CreateCustomAgentResponse = {
  success?: boolean
  code?: number | string
  msg?: string
  message?: string
  data?: {
    agent_id?: string
  } | null
}

type UpdateCustomAgentResponse = {
  success?: boolean
  code?: number | string
  msg?: string
  message?: string
  data?: {
    agent?: CustomAgentDetail | null
  } | null
}

function getRequiredUserId(): string {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法发布智能体')
  }

  return userId
}

export async function createCustomAgent(
  payload: CreateCustomAgentPayload,
  signal?: AbortSignal,
): Promise<CreateCustomAgentResponse> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(CUSTOM_AGENTS_PATH, {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })

  const result = await response.json() as CreateCustomAgentResponse

  if (!response.ok) {
    throw new Error(result.msg || result.message || '发布失败')
  }

  if (result.success === false) {
    throw new Error(result.msg || result.message || '发布失败')
  }

  return result
}

export async function updateCustomAgent(
  agentId: string,
  payload: UpdateCustomAgentPayload,
  signal?: AbortSignal,
): Promise<CustomAgentDetail | null> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(`${CUSTOM_AGENTS_PATH}/${encodeURIComponent(agentId)}`, {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })

  const result = await response.json() as UpdateCustomAgentResponse

  if (!response.ok) {
    throw new Error(result.msg || result.message || '更新失败')
  }

  if (result.success === false) {
    throw new Error(result.msg || result.message || '更新失败')
  }

  return result.data?.agent ?? null
}
