import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import { getChatUserId } from './chat/api'
import type { ChatAttachment } from './chat/types'

const COMMANDS_PATH = '/api/v1/commands'
const MAX_DESCRIPTION_LENGTH = 40

export type CommandApiItem = {
  id: string
  type: 'recommend' | 'practice'
  name: string
  description: string | null
  template: string
  skill_name: string | null
  attachments: unknown[]
  icon: string | null
  image?: string | null
  messages: unknown[] | null
  created_at: string | null
}

export type CommandsData = {
  official_commands: CommandApiItem[]
  best_practices: CommandApiItem[]
  my_commands: CommandApiItem[]
}

type CommandsSuccessResponse = {
  success?: boolean
  code?: string
  msg?: string
  message?: string
  data?: Partial<CommandsData>
  official_commands?: CommandApiItem[]
  best_practices?: CommandApiItem[]
  my_commands?: CommandApiItem[]
}

export type CommandPromptItem = {
  id: string
  icon: string
  title: string
  summary: string
  template: string
  skillName: string | null
  attachments: ChatAttachment[]
  image?: string | null
}

function normalizeCommandAttachments(rawAttachments: unknown): ChatAttachment[] {
  if (!Array.isArray(rawAttachments)) {
    return []
  }

  return rawAttachments.flatMap((attachment, index) => {
    if (typeof attachment !== 'object' || attachment === null) {
      return []
    }

    const rawItem = attachment as Record<string, unknown>
    const resourceId = typeof rawItem.resource_id === 'string'
      ? rawItem.resource_id
      : typeof rawItem.resourceId === 'string'
        ? rawItem.resourceId
        : ''
    const name = typeof rawItem.file_name === 'string'
      ? rawItem.file_name
      : typeof rawItem.fileName === 'string'
        ? rawItem.fileName
        : typeof rawItem.name === 'string'
          ? rawItem.name
          : ''
    const url = typeof rawItem.url === 'string' ? rawItem.url : undefined

    if (!resourceId || !name) {
      return []
    }

    return [{
      id: `command-${resourceId}-${index}`,
      kind: 'resource' as const,
      name,
      status: 'completed' as const,
      resourceId,
      url,
    }]
  })
}

function normalizeCommandText(value: string | null | undefined): string {
  return typeof value === 'string' ? value : ''
}

function resolveCommandsData(payload: CommandsSuccessResponse): CommandsData {
  const data = payload.data ?? payload

  return {
    official_commands: Array.isArray(data.official_commands) ? data.official_commands : [],
    best_practices: Array.isArray(data.best_practices) ? data.best_practices : [],
    my_commands: Array.isArray(data.my_commands) ? data.my_commands : [],
  }
}

export async function fetchCommands(signal?: AbortSignal): Promise<CommandsData> {
  const requestUrl = buildAiApiUrl(COMMANDS_PATH, {
    user_id: getChatUserId(),
  })

  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('指令接口请求失败')
  }

  const payload = (await response.json()) as CommandsSuccessResponse

  if (payload.success === false) {
    throw new Error(payload.msg || payload.message || '指令接口返回失败')
  }

  return resolveCommandsData(payload)
}

export function mapCommandsToPromptItems(commands: CommandApiItem[]): CommandPromptItem[] {
  return commands.map((command) => {
    const description = normalizeCommandText(command.description)

    return {
      id: command.id,
      icon: command.icon ?? '📝',
      title: command.name,
      summary: description.length > MAX_DESCRIPTION_LENGTH
        ? `${description.slice(0, MAX_DESCRIPTION_LENGTH)}…`
        : description,
      template: command.template,
      skillName: command.skill_name ?? null,
      attachments: normalizeCommandAttachments(command.attachments),
      image: command.image ?? null,
    }
  })
}
