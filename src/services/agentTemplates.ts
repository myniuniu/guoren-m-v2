import { authorizedFetch, buildAiApiUrl } from '../utils/request'

const AGENT_TEMPLATES_PATH = '/api/v1/agent-templates'

export type AgentTemplateItem = {
  templateId: string
  templateName: string
  description: string
  avatarUrl: string | null
  category: string
  sortOrder: number
}

export type AgentTemplatePresetQuestion = {
  question: string
  instruction: string
}

export type AgentTemplateDetail = {
  templateId: string
  templateName: string
  description: string
  avatarUrl: string | null
  agentPrompt: string
  presetQuestions: AgentTemplatePresetQuestion[]
}

type AgentTemplatesResponse = {
  success?: boolean
  msg?: string
  message?: string
  data?: {
    templates?: unknown[]
  }
}

type AgentTemplateDetailResponse = {
  success?: boolean
  msg?: string
  message?: string
  data?: {
    template?: unknown
  }
}

function normalizeTemplateItem(value: unknown): AgentTemplateItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const templateId = typeof record.template_id === 'string' ? record.template_id : ''
  const templateName = typeof record.template_name === 'string' ? record.template_name : ''

  if (!templateId || !templateName) {
    return null
  }

  return {
    templateId,
    templateName,
    description: typeof record.description === 'string' ? record.description : '',
    avatarUrl: typeof record.avatar_url === 'string' ? record.avatar_url : null,
    category: typeof record.category === 'string' ? record.category : '',
    sortOrder: typeof record.sort_order === 'number' ? record.sort_order : 0,
  }
}

function normalizeTemplatePresetQuestions(value: unknown): AgentTemplatePresetQuestion[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    const record = item as Record<string, unknown>
    const question = typeof record.question === 'string' ? record.question : ''

    if (!question.trim()) {
      return []
    }

    return [{
      question,
      instruction: typeof record.instruction === 'string' ? record.instruction : '',
    }]
  })
}

function normalizeTemplateDetail(value: unknown): AgentTemplateDetail | null {
  const template = normalizeTemplateItem(value)

  if (!template || !value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>

  return {
    ...template,
    agentPrompt: typeof record.agent_prompt === 'string' ? record.agent_prompt : '',
    presetQuestions: normalizeTemplatePresetQuestions(record.preset_questions),
  }
}

export async function fetchAgentTemplates(signal?: AbortSignal): Promise<AgentTemplateItem[]> {
  const response = await authorizedFetch(buildAiApiUrl(AGENT_TEMPLATES_PATH), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('获取智能体模板列表失败')
  }

  const payload = (await response.json()) as AgentTemplatesResponse

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '获取智能体模板列表失败')
  }

  const items = Array.isArray(payload.data?.templates) ? payload.data.templates : []

  return items
    .flatMap((item) => {
      const normalized = normalizeTemplateItem(item)
      return normalized ? [normalized] : []
    })
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      return left.templateName.localeCompare(right.templateName, 'zh-CN')
    })
}

export async function fetchAgentTemplateDetail(templateId: string, signal?: AbortSignal): Promise<AgentTemplateDetail> {
  const response = await authorizedFetch(buildAiApiUrl(`${AGENT_TEMPLATES_PATH}/${encodeURIComponent(templateId)}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('获取智能体模板详情失败')
  }

  const payload = (await response.json()) as AgentTemplateDetailResponse

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '获取智能体模板详情失败')
  }

  const detail = normalizeTemplateDetail(payload.data?.template)

  if (!detail) {
    throw new Error('模板详情数据不完整')
  }

  return detail
}
