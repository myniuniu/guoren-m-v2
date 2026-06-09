import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import { getChatUserId } from './chat/api'

const VISIBLE_AGENTS_PATH = '/api/v1/custom-agents/public/list'
const AGENT_USAGE_LOGS_PATH = '/api/v1/custom-agents/usage-logs'
const AGENT_USAGE_LOG_DETAIL_PATH = '/api/v1/custom-agents/usage-logs/{agent_id}'
const AGENT_USAGE_PAGE_SIZE = 100

export type AgentPublishScope = 'private' | 'public' | 'specified'
export type AgentCategoryKey = 'official' | 'enterprise' | 'collaboration' | 'mine'

export interface DiscoverAgentItem {
  agentId: string
  creatorUserId: string
  tenantId: number | null
  agentName: string
  description: string
  avatarUrl: string | null
  isActive: boolean
  publishScope: AgentPublishScope | null
  authorizedUserIds: string[]
  createdAt: string
  updatedAt: string
}

export interface AgentUsageLog {
  agentId: string
  userId: string
  agentName: string
  avatarUrl: string | null
  usedAt: string
}

type VisibleAgentsResponse = {
  success?: boolean
  code?: number | string
  msg?: string
  message?: string
  data?: {
    agents?: unknown[]
    total?: number
  }
}

type AgentUsageLogsResponse = {
  success?: boolean
  code?: number | string
  msg?: string
  message?: string
  data?: {
    logs?: Array<{
      agent_id?: string
      user_id?: string
      agent_name?: string
      avatar_url?: string
      used_at?: string
    }>
  }
}

function getRequiredUserId(): string {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法加载智能体数据')
  }

  return userId
}

function normalizeVisibleAgent(item: unknown): DiscoverAgentItem | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const agentId = typeof record.agent_id === 'string' ? record.agent_id : ''
  const agentName = typeof record.agent_name === 'string' ? record.agent_name : ''

  if (!agentId || !agentName) {
    return null
  }

  return {
    agentId,
    creatorUserId: typeof record.creator_user_id === 'string' ? record.creator_user_id : '',
    tenantId: typeof record.tenant_id === 'number' ? record.tenant_id : null,
    agentName,
    description: typeof record.description === 'string' ? record.description : '',
    avatarUrl: typeof record.avatar_url === 'string' ? record.avatar_url : null,
    isActive: Boolean(record.is_active),
    publishScope: typeof record.publish_scope === 'string' ? record.publish_scope as AgentPublishScope : null,
    authorizedUserIds: Array.isArray(record.authorized_user_ids)
      ? record.authorized_user_ids.flatMap((value) => typeof value === 'string' && value ? [value] : [])
      : [],
    createdAt: typeof record.created_at === 'string' ? record.created_at : '',
    updatedAt: typeof record.updated_at === 'string' ? record.updated_at : '',
  }
}

export async function listVisibleAgents(
  options: {
    limit?: number
    skip?: number
    signal?: AbortSignal
  } = {},
): Promise<DiscoverAgentItem[]> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(VISIBLE_AGENTS_PATH, {
    user_id: userId,
    limit: String(options.limit ?? 100),
    skip: String(options.skip ?? 0),
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error('获取可见智能体列表失败')
  }

  const payload = (await response.json()) as VisibleAgentsResponse

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '获取可见智能体列表失败')
  }

  const rawAgents = Array.isArray(payload.data?.agents) ? payload.data?.agents : []
  const uniqueAgentMap = new Map<string, DiscoverAgentItem>()

  rawAgents.forEach((item) => {
    const normalized = normalizeVisibleAgent(item)

    if (!normalized || uniqueAgentMap.has(normalized.agentId)) {
      return
    }

    uniqueAgentMap.set(normalized.agentId, normalized)
  })

  return [...uniqueAgentMap.values()]
}

export function groupVisibleAgents(
  agents: DiscoverAgentItem[],
  currentUserId: string,
): Record<AgentCategoryKey, DiscoverAgentItem[]> {
  return {
    official: agents.filter((agent) => (
      agent.tenantId === null &&
      agent.publishScope === 'public' &&
      agent.isActive
    )),
    enterprise: agents.filter((agent) => (
      agent.tenantId !== null &&
      agent.publishScope === 'public' &&
      agent.isActive
    )),
    collaboration: agents.filter((agent) => (
      agent.tenantId !== null &&
      agent.publishScope === 'specified' &&
      agent.authorizedUserIds.includes(currentUserId) &&
      agent.isActive
    )),
    mine: agents.filter((agent) => agent.creatorUserId === currentUserId),
  }
}

export async function getAgentUsageLogs(signal?: AbortSignal): Promise<AgentUsageLog[]> {
  const userId = getRequiredUserId()
  const logs: AgentUsageLog[] = []
  let skip = 0

  while (true) {
    const requestUrl = buildAiApiUrl(AGENT_USAGE_LOGS_PATH, {
      user_id: userId,
      limit: String(AGENT_USAGE_PAGE_SIZE),
      skip: String(skip),
    })

    const response = await authorizedFetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    })

    if (!response.ok) {
      throw new Error('获取智能体使用记录失败')
    }

    const payload = (await response.json()) as AgentUsageLogsResponse

    if (payload.success === false) {
      throw new Error(payload.msg || payload.message || '获取智能体使用记录失败')
    }

    const pageLogs = Array.isArray(payload.data?.logs)
      ? payload.data.logs.flatMap((item) => {
          if (!item?.agent_id || !item.used_at) {
            return []
          }

          return [{
            agentId: item.agent_id,
            userId: typeof item.user_id === 'string' ? item.user_id : '',
            agentName: typeof item.agent_name === 'string' ? item.agent_name : '',
            avatarUrl: typeof item.avatar_url === 'string' ? item.avatar_url : null,
            usedAt: item.used_at,
          }]
        })
      : []

    logs.push(...pageLogs)

    if (pageLogs.length < AGENT_USAGE_PAGE_SIZE) {
      break
    }

    skip += AGENT_USAGE_PAGE_SIZE
  }

  return logs.sort((left, right) => (
    new Date(right.usedAt).getTime() - new Date(left.usedAt).getTime()
  ))
}

export async function addAgentUsageLog(agentId: string, signal?: AbortSignal): Promise<void> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(AGENT_USAGE_LOGS_PATH, {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: agentId,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error('添加智能体使用记录失败')
  }

  const payload = await response.json() as { success?: boolean; msg?: string; message?: string }

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '添加智能体使用记录失败')
  }
}

export async function deleteAgentUsageLog(agentId: string, signal?: AbortSignal): Promise<void> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(
    AGENT_USAGE_LOG_DETAIL_PATH.replace('{agent_id}', encodeURIComponent(agentId)),
    {
      user_id: userId,
      agent_id: agentId,
    },
  )

  const response = await authorizedFetch(requestUrl, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('删除智能体使用记录失败')
  }

  const payload = await response.json() as { success?: boolean; msg?: string; message?: string }

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '删除智能体使用记录失败')
  }
}

export async function ensureAgentUsageLog(agentId: string, signal?: AbortSignal): Promise<boolean> {
  const logs = await getAgentUsageLogs(signal)

  if (logs.some((item) => item.agentId === agentId)) {
    return false
  }

  await addAgentUsageLog(agentId, signal)
  return true
}
