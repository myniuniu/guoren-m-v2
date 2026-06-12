import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import { getChatUserId } from './chat/api'

const AGENT_TEMPLATES_PATH = '/api/v1/agent-templates'
const GENERATE_AGENT_TEMPLATE_PATH = '/api/v1/custom-agents/templates/generate'
const AGENT_TEMPLATE_TASK_PATH = '/api/v1/custom-agents/templates/tasks/{task_id}'

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

export type GeneratedAgentTemplatePresetQuestion = {
  category?: string
  question: string
  instruction: string
}

export type GeneratedAgentTemplateRecommendedSkill = {
  name: string
  chineseName: string
  description: string
  source: string
  template: string | null
}

export type AgentTemplateTaskResult = {
  agentName: string
  description: string
  agentPrompt: string
  presetQuestions: GeneratedAgentTemplatePresetQuestion[]
  recommendedSkills: GeneratedAgentTemplateRecommendedSkill[]
}

export type GenerateAgentTemplateSubmission = {
  taskId: string
  status: string
}

export type AgentTemplateTaskState = {
  taskId: string
  status: string
  phase: string
  isCompleted: boolean
  error: string | null
  result: AgentTemplateTaskResult | null
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

type GenerateAgentTemplateResponse = {
  success?: boolean
  msg?: string
  message?: string
  data?: {
    task_id?: unknown
    status?: unknown
  } | null
}

type AgentTemplateTaskResponse = {
  success?: boolean
  msg?: string
  message?: string
  data?: unknown
}

function getRequiredUserId(): string {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法创建智能体')
  }

  return userId
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

function normalizeGeneratedPresetQuestion(value: unknown): GeneratedAgentTemplatePresetQuestion | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const question = typeof record.question === 'string' ? record.question.trim() : ''

  if (!question) {
    return null
  }

  const category = typeof record.category === 'string' ? record.category.trim() : ''

  return {
    category: category || undefined,
    question,
    instruction: typeof record.instruction === 'string' ? record.instruction.trim() : '',
  }
}

function normalizeGeneratedRecommendedSkill(value: unknown): GeneratedAgentTemplateRecommendedSkill | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name.trim() : ''

  if (!name) {
    return null
  }

  return {
    name,
    chineseName: typeof record.chinese_name === 'string' && record.chinese_name.trim() ? record.chinese_name.trim() : name,
    description: typeof record.description === 'string' ? record.description.trim() : '',
    source: typeof record.source === 'string' ? record.source.trim() : '',
    template: typeof record.template === 'string' ? record.template : null,
  }
}

function normalizeGeneratedTaskResult(value: unknown): AgentTemplateTaskResult | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const agentName = typeof record.agent_name === 'string' ? record.agent_name.trim() : ''

  if (!agentName) {
    return null
  }

  return {
    agentName,
    description: typeof record.description === 'string' ? record.description.trim() : '',
    agentPrompt: typeof record.agent_prompt === 'string' ? record.agent_prompt.trim() : '',
    presetQuestions: Array.isArray(record.preset_questions)
      ? record.preset_questions.flatMap((item) => {
          const normalized = normalizeGeneratedPresetQuestion(item)
          return normalized ? [normalized] : []
        })
      : [],
    recommendedSkills: Array.isArray(record.recommended_skills)
      ? record.recommended_skills.flatMap((item) => {
          const normalized = normalizeGeneratedRecommendedSkill(item)
          return normalized ? [normalized] : []
        })
      : [],
  }
}

function normalizeAgentTemplateTaskState(value: unknown): AgentTemplateTaskState | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const taskId = typeof record.task_id === 'string' ? record.task_id.trim() : ''

  if (!taskId) {
    return null
  }

  return {
    taskId,
    status: typeof record.status === 'string' ? record.status.trim() : '',
    phase: typeof record.phase === 'string' ? record.phase.trim() : '',
    isCompleted: record.is_completed === true,
    error: typeof record.error === 'string' && record.error.trim() ? record.error.trim() : null,
    result: normalizeGeneratedTaskResult(record.result),
  }
}

export async function generateAgentTemplate(
  inputText: string,
  signal?: AbortSignal,
): Promise<GenerateAgentTemplateSubmission> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(GENERATE_AGENT_TEMPLATE_PATH, {
    user_id: userId,
  })
  const response = await authorizedFetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      input_text: inputText,
    }),
    signal,
  })

  const result = await response.json() as GenerateAgentTemplateResponse

  if (!response.ok) {
    throw new Error(result.msg || result.message || '生成智能体模板失败')
  }

  if (result.success === false) {
    throw new Error(result.msg || result.message || '生成智能体模板失败')
  }

  const taskId = typeof result.data?.task_id === 'string' ? result.data.task_id.trim() : ''

  if (!taskId) {
    throw new Error(result.msg || result.message || '生成智能体模板失败')
  }

  return {
    taskId,
    status: typeof result.data?.status === 'string' ? result.data.status.trim() : '',
  }
}

export async function fetchAgentTemplateTask(
  taskId: string,
  signal?: AbortSignal,
): Promise<AgentTemplateTaskState> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(
    AGENT_TEMPLATE_TASK_PATH.replace('{task_id}', encodeURIComponent(taskId)),
    { user_id: userId },
  )
  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  const result = await response.json() as AgentTemplateTaskResponse

  if (!response.ok) {
    throw new Error(result.msg || result.message || '获取模板任务状态失败')
  }

  if (result.success === false) {
    throw new Error(result.msg || result.message || '获取模板任务状态失败')
  }

  const taskState = normalizeAgentTemplateTaskState(result.data)

  if (!taskState) {
    throw new Error('模板任务状态数据不完整')
  }

  return taskState
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
