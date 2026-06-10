import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import { getChatUserId } from './chat/api'

const SKILLS_PATH = '/api/v1/skills'
const CUSTOM_SKILLS_PATH = '/api/v1/skills/custom'
const CLAWHUB_BROWSE_PATH = '/api/v1/skills/clawhub/browse'
const CLAWHUB_SEARCH_PATH = '/api/v1/skills/clawhub/search'
const CLAWHUB_DETAIL_PATH = '/api/v1/skills/clawhub/{slug}'
const CLAWHUB_INSTALL_PATH = '/api/v1/skills/clawhub/{slug}/install'

export type SkillSource = 'official' | 'clawhub' | 'added' | 'created'

export interface SkillConfigField {
  key: string
  label: string
  type: string
  required: boolean
  default?: string | number
  options?: Array<{ label: string; value: string | number }>
  min?: number | null
  max?: number | null
  placeholder?: string | null
}

export interface SkillDetailItem {
  skillName: string
  title: string
  description: string
  source: SkillSource
  skillType: string
  skillMarkdown: string
  template: string
  placeholders: string[]
  configFields: SkillConfigField[]
  tags: string[]
  owner: string
  version: string
  downloads: number
  stars: number
  summary: string
}

export interface SkillSummaryItem {
  id: string
  skillName: string
  title: string
  description: string
  template: string
  source: SkillSource
  tags: string[]
  countLabel?: string
  isSelected: boolean
}

function buildSkillMergeKey(skill: Pick<SkillSummaryItem, 'id' | 'skillName'>): string {
  return skill.skillName.trim() || skill.id
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

type SkillDetailResponse = {
  success?: boolean
  msg?: string
  message?: string
  data?: Record<string, unknown>
}

type ClawhubDetailResponse = {
  success?: boolean
  msg?: string
  message?: string
  data?: {
    skill?: {
      slug?: string
      displayName?: string
      summary?: string
      tags?: unknown[]
      stats?: {
        downloads?: number
        stars?: number
      }
    }
    is_selected?: boolean
    latestVersion?: {
      version?: string
    }
    owner?: {
      handle?: string
      displayName?: string
    }
    metaContent?: {
      DisplayDescription?: string
      Keywords?: unknown[]
      skillMd?: string
    }
  }
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

function readBooleanField(value: Record<string, unknown>, keys: string[]): boolean {
  const fieldKey = keys.find((key) => typeof value[key] === 'boolean')
  return fieldKey ? Boolean(value[fieldKey]) : false
}

function replacePathParam(path: string, key: string, value: string): string {
  return path.replace(`{${key}}`, encodeURIComponent(value))
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
        isSelected: readBooleanField(record, ['is_selected', 'isSelected']),
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

function normalizeSkillConfigField(value: unknown): SkillConfigField | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const key = readStringField(record, ['key', 'name'])

  if (!key) {
    return null
  }

  const optionValues = Array.isArray(record.options)
    ? record.options.flatMap((option) => {
        if (!option || typeof option !== 'object') {
          return []
        }

        const optionRecord = option as Record<string, unknown>
        const label = readStringField(optionRecord, ['label', 'name', 'title'])
        const valueField = optionRecord.value

        if (!label || (typeof valueField !== 'string' && typeof valueField !== 'number')) {
          return []
        }

        return [{ label, value: valueField }]
      })
    : []

  return {
    key,
    label: readStringField(record, ['label', 'title', 'description']) || key,
    type: readStringField(record, ['type']) || 'string',
    required: readBooleanField(record, ['required']),
    default: typeof record.default === 'string' || typeof record.default === 'number'
      ? record.default
      : undefined,
    options: optionValues.length > 0 ? optionValues : undefined,
    min: typeof record.min === 'number' ? record.min : null,
    max: typeof record.max === 'number' ? record.max : null,
    placeholder: readStringField(record, ['placeholder']) || null,
  }
}

function normalizeOfficialSkillDetail(payload: Record<string, unknown>, skillName: string): SkillDetailItem {
  return {
    skillName: readStringField(payload, ['skill_name', 'skillName']) || skillName,
    title: readStringField(payload, ['chinese_name', 'chineseName', 'title']) || skillName,
    description: readStringField(payload, ['description', 'summary']),
    source: 'official',
    skillType: readStringField(payload, ['skill_type', 'skillType']) || 'official',
    skillMarkdown: readStringField(payload, ['skill_md', 'skillMd']),
    template: readStringField(payload, ['template', 'prompt_template', 'promptTemplate']),
    placeholders: Array.isArray(payload.placeholders)
      ? payload.placeholders.flatMap((item) => typeof item === 'string' && item.trim() ? [item.trim()] : [])
      : [],
    configFields: Array.isArray(payload.config_fields)
      ? payload.config_fields.flatMap((item) => {
          const field = normalizeSkillConfigField(item)
          return field ? [field] : []
        })
      : [],
    tags: readTags(payload),
    owner: '',
    version: '',
    downloads: 0,
    stars: 0,
    summary: readStringField(payload, ['description', 'summary']),
  }
}

function normalizeClawhubSkillDetail(payload: ClawhubDetailResponse['data'], slug: string): SkillDetailItem {
  const skill = payload?.skill
  const metaContent = payload?.metaContent
  const keywords = Array.isArray(metaContent?.Keywords)
    ? metaContent.Keywords.flatMap((item) => typeof item === 'string' && item.trim() ? [item.trim()] : [])
    : []

  return {
    skillName: skill?.slug?.trim() || slug,
    title: skill?.displayName?.trim() || slug,
    description: metaContent?.DisplayDescription?.trim() || skill?.summary?.trim() || '',
    source: 'clawhub',
    skillType: 'clawhub',
    skillMarkdown: metaContent?.skillMd?.trim() || '',
    template: metaContent?.skillMd?.trim() || '',
    placeholders: [],
    configFields: [],
    tags: Array.isArray(skill?.tags)
      ? skill.tags.flatMap((item) => typeof item === 'string' && item.trim() ? [item.trim()] : [])
      : keywords,
    owner: payload?.owner?.displayName?.trim() || payload?.owner?.handle?.trim() || '',
    version: payload?.latestVersion?.version?.trim() || '',
    downloads: skill?.stats?.downloads || 0,
    stars: skill?.stats?.stars || 0,
    summary: skill?.summary?.trim() || '',
  }
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

export function mergeSkillSummaryItems(...lists: SkillSummaryItem[][]): SkillSummaryItem[] {
  const record = new Map<string, SkillSummaryItem>()

  lists.flat().forEach((item) => {
    const key = buildSkillMergeKey(item)

    if (!record.has(key)) {
      record.set(key, item)
    }
  })

  return [...record.values()]
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

export async function fetchUserSkills(signal?: AbortSignal): Promise<SkillSummaryItem[]> {
  const [addedSkills, createdSkills] = await Promise.all([fetchAddedSkills(signal), fetchCreatedSkills(signal)])
  return mergeSkillSummaryItems(addedSkills, createdSkills)
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

export async function fetchOfficialSkillDetail(skillName: string, signal?: AbortSignal): Promise<SkillDetailItem> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(replacePathParam(SKILLS_PATH + '/{skill_name}', 'skill_name', skillName), {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('获取技能详情失败')
  }

  const payload = (await response.json()) as SkillDetailResponse

  if (payload.success === false || !payload.data) {
    throw new Error(payload.msg || payload.message || '获取技能详情失败')
  }

  return normalizeOfficialSkillDetail(payload.data, skillName)
}

export async function fetchClawhubSkillDetail(skillName: string, signal?: AbortSignal): Promise<SkillDetailItem> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(replacePathParam(CLAWHUB_DETAIL_PATH, 'slug', skillName), {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('获取技能详情失败')
  }

  const payload = (await response.json()) as ClawhubDetailResponse

  if (payload.success === false || !payload.data?.skill) {
    throw new Error(payload.msg || payload.message || '获取技能详情失败')
  }

  return normalizeClawhubSkillDetail(payload.data, skillName)
}

export async function addOfficialSkill(skillName: string, signal?: AbortSignal): Promise<void> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(`/api/v1/users/${encodeURIComponent(userId)}/skills`, {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      skill_name: skillName,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error('添加技能失败')
  }

  const payload = (await response.json()) as { success?: boolean; msg?: string; message?: string }

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '添加技能失败')
  }
}

export async function removeAddedSkill(skillName: string, signal?: AbortSignal): Promise<void> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(`/api/v1/users/${encodeURIComponent(userId)}/skills/${encodeURIComponent(skillName)}`, {
    user_id: userId,
    skill_name: skillName,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('移除技能失败')
  }

  const responseText = await response.text()

  if (!responseText) {
    return
  }

  const payload = JSON.parse(responseText) as { success?: boolean; msg?: string; message?: string }

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '移除技能失败')
  }
}

export async function installClawhubSkill(skillName: string, signal?: AbortSignal): Promise<void> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(replacePathParam(CLAWHUB_INSTALL_PATH, 'slug', skillName), {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('添加技能失败')
  }

  const payload = (await response.json()) as { success?: boolean; msg?: string; message?: string }

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '添加技能失败')
  }
}

export async function deleteCreatedSkill(skillName: string, signal?: AbortSignal): Promise<void> {
  const userId = getRequiredUserId()
  const requestUrl = buildAiApiUrl(replacePathParam(`${CUSTOM_SKILLS_PATH}/{skill_name}`, 'skill_name', skillName), {
    user_id: userId,
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('删除技能失败')
  }

  const responseText = await response.text()

  if (!responseText) {
    return
  }

  const payload = JSON.parse(responseText) as { success?: boolean; msg?: string; message?: string }

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '删除技能失败')
  }
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
