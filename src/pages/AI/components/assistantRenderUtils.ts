import type { ChatArtifactItem, ChatMessage } from '../../../services/chat/types'

function stripSkillOutputUrlsFromText(text: string, skillOutput: ChatArtifactItem[]): string {
  let result = text

  for (const item of skillOutput) {
    const escapedUrl = item.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const urlPattern = new RegExp(escapedUrl, 'g')
    const markdownLinkPattern = new RegExp(`\\[([^\\]]*)\\]\\(${escapedUrl}\\)`, 'g')

    result = result.replace(urlPattern, '')
    result = result.replace(markdownLinkPattern, '$1')
  }

  return result.replace(/\n{3,}/g, '\n\n').trim()
}

export function extractAssistantOutputText(message: ChatMessage): string {
  const text = message.content.trim()

  if (!message.skillOutput.length) {
    return text
  }

  return stripSkillOutputUrlsFromText(text, message.skillOutput)
}

export function resolveAssistantCopyTargets(
  messages: ChatMessage[],
  options?: { excludeLastTurn?: boolean },
): Record<string, string> {
  const targets: Record<string, string> = {}
  let currentTurnLastMessageId: string | null = null
  let currentTurnTextParts: string[] = []

  const finalizeCurrentTurn = () => {
    if (!currentTurnLastMessageId || !currentTurnTextParts.length) {
      currentTurnLastMessageId = null
      currentTurnTextParts = []
      return
    }

    targets[currentTurnLastMessageId] = currentTurnTextParts.join('\n\n').trim()
    currentTurnLastMessageId = null
    currentTurnTextParts = []
  }

  for (const message of messages) {
    if (message.role === 'user') {
      finalizeCurrentTurn()
      continue
    }

    const text = extractAssistantOutputText(message)

    if (!text) {
      continue
    }

    currentTurnLastMessageId = message.id
    currentTurnTextParts.push(text)
  }

  if (!options?.excludeLastTurn) {
    finalizeCurrentTurn()
  }

  return targets
}
