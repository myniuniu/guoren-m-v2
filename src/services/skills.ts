import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import { getChatUserId } from './chat/api'

const SKILLS_PATH = '/api/v1/skills'
const CUSTOM_SKILLS_PATH = '/api/v1/skills/custom'
const CLAWHUB_BROWSE_PATH = '/api/v1/skills/clawhub/browse'
const CLAWHUB_SEARCH_PATH = '/api/v1/skills/clawhub/search'

export type SkillSource = 'official' | 'clawhub' | 'added' | 'created'

export interface SkillSummaryItem {
  id: string
  skillName: string
  title: string
  description: string
  template: string
  source: SkillSource
  tags: string[]
  countLabel?: string
}

type SkillListResponse = {
  success?: boolean
  code?: string | number
  msg?: string
  message?: string
  data?: {
    skills?: unknown[]
    items?: unknown[]
    total?: number
  }
  skills?: unknown[]
  items?: unknown[]
  total?: number
}

function readStringField(value: Record<string, unknown>, keys: string[]): string {
  const fieldKey = keys.find((key) => typeof value[key] === 'string' && value[key])
  return fieldKey ? String(value[fieldKey]).trim() : ''
}

function readTags(value: Record<string, unknown>): string[] {
  if (!Array.isArray(value.tags)) {
    return []
  }

  return value.tags.flatMap((tag) => {
    if (typeof tag !== 'string' || !tag.trim()) {
      return []
    }

    return [tag.trim()]
  })
}

function buildCountLabel(value: Record<string, unknown>): string | undefined {
  if (typeof value.downloads === 'number' && value.downloads > 0) {
    return `${value.downloads} 次安装`
  }

  if (typeof value.stars === 'number' && value.stars > 0) {
    return `${value.stars} 次收藏`
  }

  return undefined
}

function normalizeSkillItems(items: unknown[], source: SkillSource): SkillSummaryItem[] {
  return items.flatMap((item, index) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    const record = item as Record<string, unknown>
    const skillName = readStringField(record, ['skill_name', 'skillName', 'name', 'slug'])
    const title = readStringField(record, ['chinese_name', 'chinesename', 'chineseName', 'title', 'skill_name', 'name', 'slug'])
    const description = readStringField(record, ['description', 'summary', 'desc'])
    const template = readStringField(record, ['template', 'prompt_template', 'promptTemplate'])

    if (!title) {
      return []
    }

    const id = readStringField(record, ['id', 'slug']) || skillName || `${source}-${index}`

    return [{
      id,
      skillName,
      title,
      description,
      template,
      source,
      tags: readTags(record),
      countLabel: buildCountLabel(record),
    }]
  })
}

function extractSkillItems(payload: SkillListResponse, source: SkillSource): SkillSummaryItem[] {
  const container = payload.data ?? payload
  const items = Array.isArray(container.skills)
    ? container.skills
    : Array.isArray(container.items)
      ? container.items
      : []

  return normalizeSkillItems(items, source)
}

function getRequiredUserId(): string {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法加载技能数据')
  }

  return userId
}

async function requestSkillList(
  requestUrl: string,
  source: SkillSource,
  signal?: AbortSignal,
): Promise<SkillSummaryItem[]> {
  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('技能接口请求失败')
  }

  const payload = (await response.json()) as SkillListResponse

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '技能接口返回失败')
  }

  return extractSkillItems(payload, source)
}

export function buildSkillDisplayName(skillName: string): string {
  const normalizedSkillName = skillName.trim().replace(/^\/+/, '')
  return normalizedSkillName ? `/${normalizedSkillName}` : ''
}

export function buildSkillInitialPrompt(skill: Pick<SkillSummaryItem, 'skillName' | 'template' | 'title'>): string {
  const template = skill.template.trim()
  const skillName = buildSkillDisplayName(skill.skillName)

  if (skillName && template) {
    return `基于 ${skillName} ${template}`
  }

  if (template) {
    return template
  }

  if (skillName) {
    return skillName
  }

  return skill.title.trim()
}

export async function fetchOfficialSkills(signal?: AbortSignal): Promise<SkillSummaryItem[]> {
  const userId = getRequiredUserId()
  return requestSkillList(buildAiApiUrl(SKILLS_PATH, { user_id: userId }), 'official', signal)
}

export async function fetchAddedSkills(signal?: AbortSignal): Promise<SkillSummaryItem[]> {
  const userId = getRequiredUserId()
  return requestSkillList(buildAiApiUrl(`/api/v1/users/${encodeURIComponent(userId)}/skills`, {
    user_id: userId,
  }), 'added', signal)
}

export async function fetchCreatedSkills(signal?: AbortSignal): Promise<SkillSummaryItem[]> {
  const userId = getRequiredUserId()
  return requestSkillList(buildAiApiUrl(CUSTOM_SKILLS_PATH, {
    user_id: userId,
  }), 'created', signal)
}

export async function fetchClawhubSkills(
  options: {
    limit?: number
    offset?: number
    signal?: AbortSignal
  } = {},
): Promise<SkillSummaryItem[]> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(CLAWHUB_BROWSE_PATH, {
    user_id: userId,
    limit: String(options.limit ?? 20),
    offset: String(options.offset ?? 0),
  })

  return requestSkillList(requestUrl, 'clawhub', options.signal)
}

export async function searchClawhubSkills(
  query: string,
  options: {
    limit?: number
    signal?: AbortSignal
  } = {},
): Promise<SkillSummaryItem[]> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(CLAWHUB_SEARCH_PATH, {
    user_id: userId,
    q: query.trim(),
    limit: String(options.limit ?? 20),
  })

  return requestSkillList(requestUrl, 'clawhub', options.signal)
}
