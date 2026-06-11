import {
  authorizedFetch,
  buildAiApiUrl,
  buildAuthorizedHeaders,
  handleUnauthorizedResponse,
} from '../utils/request'
import { getChatUserId } from './chat/api'

const PARTNER_PATH = '/api/v1/agent'
const PARTNER_AVATAR_UPLOAD_PATH = '/api/v1/admin/images/upload'

export interface PartnerConfig {
  agentName: string
  avatarUrl: string
  soulContent: string
  userContent: string
  identityContent: string
}

export type PartnerConfigUpdateField = 'agent_name' | 'avatar_url' | 'SOUL.md' | 'USER.md' | 'IDENTITY.md'

type PartnerConfigResponse = {
  success?: boolean
  code?: string | number
  message?: string
  msg?: string
  data?: {
    agent?: {
      agent_name?: string
      avatar_url?: string
    }
    memories?: Record<string, { content?: string }>
  }
}

type PartnerAvatarUploadResponse = {
  success?: boolean
  code?: string | number
  message?: string
  msg?: string
  data?: unknown
}

function buildPartnerRequestUrl(): string {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法加载智能伙伴配置')
  }

  return buildAiApiUrl(PARTNER_PATH, {
    user_id: userId,
  })
}

function extractPartnerConfig(payload: PartnerConfigResponse): PartnerConfig {
  const memories = payload.data?.memories ?? {}

  return {
    agentName: payload.data?.agent?.agent_name?.trim() || '建国',
    avatarUrl: payload.data?.agent?.avatar_url?.trim() || '',
    soulContent: memories['SOUL.md']?.content ?? '',
    userContent: memories['USER.md']?.content ?? '',
    identityContent: memories['IDENTITY.md']?.content ?? '',
  }
}

function buildPartnerUpdatePayload(field: PartnerConfigUpdateField, value: string): Record<string, string> {
  if (field === 'USER.md') {
    return {
      USER_md: value,
    }
  }

  return {
    [field]: value,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function extractPartnerUploadUrl(data: unknown): string {
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

export async function fetchPartnerConfig(signal?: AbortSignal): Promise<PartnerConfig> {
  const response = await authorizedFetch(buildPartnerRequestUrl(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`获取智能伙伴配置失败（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as PartnerConfigResponse

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '获取智能伙伴配置失败')
  }

  return extractPartnerConfig(payload)
}

export async function updatePartnerConfig(
  field: PartnerConfigUpdateField,
  value: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await authorizedFetch(buildPartnerRequestUrl(), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildPartnerUpdatePayload(field, value)),
    signal,
  })

  if (!response.ok) {
    throw new Error(`更新智能伙伴配置失败（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as {
    success?: boolean
    code?: string | number
    message?: string
    msg?: string
  }

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '更新智能伙伴配置失败')
  }
}

export async function uploadPartnerAvatar(file: File, signal?: AbortSignal): Promise<string> {
  const requestUrl = buildAiApiUrl(PARTNER_AVATAR_UPLOAD_PATH)
  const headers = await buildAuthorizedHeaders(requestUrl, 'POST', {
    Accept: 'application/json',
  })
  const formData = new FormData()

  formData.append('file', file)
  formData.append('name', file.name)
  formData.append('category', 'avatar')
  formData.append('tags', 'partner-avatar')
  formData.append('description', '智能伙伴头像')

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

  const payload = (await response.json()) as PartnerAvatarUploadResponse
  if (handleUnauthorizedResponse(response, payload)) {
    throw new Error(payload.message || payload.msg || 'Token失效，请重新登录!')
  }

  if (!response.ok) {
    throw new Error(`上传伙伴头像失败（HTTP ${response.status}）`)
  }

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '上传伙伴头像失败')
  }

  const uploadedUrl = extractPartnerUploadUrl(payload.data)

  if (!uploadedUrl) {
    throw new Error('头像上传成功，但服务端没有返回可用图片地址')
  }

  return uploadedUrl
}
