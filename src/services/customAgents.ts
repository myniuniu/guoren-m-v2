import { type AgentPublishScope } from './agents'
import { getChatUserId } from './chat/api'
import {
  authorizedFetch,
  buildAiApiUrl,
  buildAuthorizedHeaders,
  handleUnauthorizedResponse,
} from '../utils/request'

const CUSTOM_AGENTS_PATH = '/api/v1/custom-agents'
const CUSTOM_AGENT_AVATAR_UPLOAD_PATH = '/api/v1/admin/images/upload'

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

type CustomAgentAvatarUploadResponse = {
  success?: boolean
  code?: number | string
  msg?: string
  message?: string
  data?: unknown
}

type ViewCustomAgentResponse = {
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function extractCustomAgentUploadUrl(data: unknown): string {
  const record = asRecord(data)
  const nestedImage = record.image ? asRecord(record.image) : null

  return (
    asString(record.url)
    || asString(record.image_url)
    || asString(record.file_url)
    || asString(record.oss_url)
    || asString(nestedImage?.url)
    || asString(nestedImage?.image_url)
    || asString(nestedImage?.file_url)
    || asString(nestedImage?.oss_url)
    || ''
  )
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

export async function viewCustomAgent(
  agentId: string,
  signal?: AbortSignal,
): Promise<CustomAgentDetail | null> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(`${CUSTOM_AGENTS_PATH}/${encodeURIComponent(agentId)}`, {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  const result = await response.json() as ViewCustomAgentResponse

  if (!response.ok) {
    throw new Error(result.msg || result.message || '获取智能体详情失败')
  }

  if (result.success === false) {
    throw new Error(result.msg || result.message || '获取智能体详情失败')
  }

  return result.data?.agent ?? null
}

export async function uploadCustomAgentAvatar(file: File, signal?: AbortSignal): Promise<string> {
  const requestUrl = buildAiApiUrl(CUSTOM_AGENT_AVATAR_UPLOAD_PATH)
  const headers = await buildAuthorizedHeaders(requestUrl, 'POST', {
    Accept: 'application/json',
  })
  const formData = new FormData()

  // 自定义智能体头像沿用统一图片上传接口，避免前端额外维护一套上传链路。
  formData.append('file', file)
  formData.append('name', file.name)
  formData.append('category', 'avatar')
  formData.append('tags', 'custom-agent-avatar')
  formData.append('description', '自定义智能体头像')

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers,
    body: formData,
    signal,
    credentials: 'omit',
  })

  if (handleUnauthorizedResponse(response)) {
    throw new Error('Token失效，请重新登录!')
  }

  const result = await response.json() as CustomAgentAvatarUploadResponse
  if (handleUnauthorizedResponse(response, result)) {
    throw new Error(result.msg || result.message || 'Token失效，请重新登录!')
  }

  if (!response.ok) {
    throw new Error(`上传智能体头像失败（HTTP ${response.status}）`)
  }

  if (result.success === false) {
    throw new Error(result.msg || result.message || '上传智能体头像失败')
  }

  const uploadedUrl = extractCustomAgentUploadUrl(result.data)

  if (!uploadedUrl) {
    throw new Error('头像上传成功，但服务端没有返回可用图片地址')
  }

  return uploadedUrl
}
