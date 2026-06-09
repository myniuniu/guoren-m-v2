import type { ChatArtifactItem, ChatMessage, ChatReference, ChatToolCall } from './types'

export type MessageMutationResult = {
  messages: ChatMessage[]
  activeMessageId: string
}

function hasProcessingSteps(message: Pick<ChatMessage, 'toolCalls' | 'skillOutput'>): boolean {
  return (message.toolCalls?.length ?? 0) > 0 || (message.skillOutput?.length ?? 0) > 0
}

function buildFollowupMessageId(messages: ChatMessage[], activeMessageId: string): string {
  const prefix = `${activeMessageId}-followup-`
  const count = messages.filter((message) => message.id.startsWith(prefix)).length
  return `${prefix}${count + 1}`
}

function createFollowupAssistantMessage(
  baseMessage: ChatMessage,
  nextMessageId: string,
  nextTimestamp: string
): ChatMessage {
  return {
    ...baseMessage,
    id: nextMessageId,
    content: '',
    createdAt: nextTimestamp,
    loading: true,
    reasoningContent: null,
    reasoningTimestamp: null,
    toolCalls: [],
    references: [],
    skillOutput: [],
    attachments: [],
  }
}

export function advanceAssistantMessageForNextModelPhase(
  messages: ChatMessage[],
  activeMessageId: string,
  timestamp: string
): MessageMutationResult {
  const activeIndex = messages.findIndex((message) => message.id === activeMessageId)

  if (activeIndex === -1) {
    return { messages, activeMessageId }
  }

  const activeMessage = messages[activeIndex]

  if (activeMessage.role !== 'assistant' || !hasProcessingSteps(activeMessage)) {
    return { messages, activeMessageId }
  }

  const nextMessageId = buildFollowupMessageId(messages, activeMessageId)
  const followupMessage = createFollowupAssistantMessage(activeMessage, nextMessageId, timestamp)

  return {
    messages: [
      ...messages.slice(0, activeIndex + 1),
      followupMessage,
      ...messages.slice(activeIndex + 1),
    ],
    activeMessageId: nextMessageId,
  }
}

export function appendTextDeltaToMessages(
  messages: ChatMessage[],
  activeMessageId: string,
  chunk: string,
  timestamp: string
): MessageMutationResult {
  const activeIndex = messages.findIndex((message) => message.id === activeMessageId)

  if (activeIndex === -1) {
    return { messages, activeMessageId }
  }

  const activeMessage = messages[activeIndex]

  if (activeMessage.role !== 'assistant') {
    return { messages, activeMessageId }
  }

  if (!hasProcessingSteps(activeMessage)) {
    return {
      messages: messages.map((message, index) => {
        if (index !== activeIndex) {
          return message
        }

        return {
          ...message,
          content: `${message.content}${chunk}`,
          createdAt: timestamp,
          loading: false,
        }
      }),
      activeMessageId,
    }
  }

  const nextPhaseResult = advanceAssistantMessageForNextModelPhase(messages, activeMessageId, timestamp)
  const nextMessages = nextPhaseResult.messages.map((message) => {
    if (message.id !== nextPhaseResult.activeMessageId) {
      return message
    }

    return {
      ...message,
      content: chunk,
      loading: false,
      createdAt: timestamp,
    }
  })

  return {
    messages: nextMessages,
    activeMessageId: nextPhaseResult.activeMessageId,
  }
}

export function appendReasoningDeltaToMessages(
  messages: ChatMessage[],
  activeMessageId: string,
  chunk: string,
  timestamp: string
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== activeMessageId || message.role !== 'assistant') {
      return message
    }

    return {
      ...message,
      createdAt: timestamp,
      reasoningContent: `${message.reasoningContent ?? ''}${chunk}`,
      reasoningTimestamp: message.reasoningTimestamp ?? timestamp,
    }
  })
}

export function upsertToolCallInMessages(
  messages: ChatMessage[],
  activeMessageId: string,
  toolCall: ChatToolCall,
  timestamp: string
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== activeMessageId || message.role !== 'assistant') {
      return message
    }

    const existingIndex = message.toolCalls.findIndex((item) => item.runId === toolCall.runId)
    const nextToolCalls = [...message.toolCalls]

    if (existingIndex >= 0) {
      nextToolCalls[existingIndex] = {
        ...nextToolCalls[existingIndex],
        ...toolCall,
        timestamp: toolCall.timestamp ?? nextToolCalls[existingIndex].timestamp ?? timestamp,
      }
    } else {
      nextToolCalls.push({
        ...toolCall,
        timestamp: toolCall.timestamp ?? timestamp,
      })
    }

    return {
      ...message,
      createdAt: timestamp,
      toolCalls: nextToolCalls,
    }
  })
}

export function attachReferencesToMessages(
  messages: ChatMessage[],
  activeMessageId: string,
  references: ChatReference[]
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== activeMessageId || message.role !== 'assistant') {
      return message
    }

    return {
      ...message,
      references,
    }
  })
}

export function attachSkillOutputToMessages(
  messages: ChatMessage[],
  activeMessageId: string,
  skillOutput: ChatArtifactItem[]
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== activeMessageId || message.role !== 'assistant') {
      return message
    }

    return {
      ...message,
      skillOutput,
    }
  })
}

export function completeAssistantMessage(
  messages: ChatMessage[],
  activeMessageId: string
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== activeMessageId || message.role !== 'assistant') {
      return message
    }

    return {
      ...message,
      loading: false,
    }
  })
}

export function appendErrorToAssistantMessage(
  messages: ChatMessage[],
  activeMessageId: string,
  errorMessage: string
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== activeMessageId || message.role !== 'assistant') {
      return message
    }

    return {
      ...message,
      content: message.content || errorMessage,
      loading: false,
    }
  })
}
