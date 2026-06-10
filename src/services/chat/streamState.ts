import {
  advanceAssistantMessageForNextModelPhase,
  appendReasoningDeltaToMessages,
  appendTextDeltaToMessages,
  attachReferencesToMessages,
  attachSkillOutputToMessages,
  upsertToolCallInMessages,
} from './messageState'
import type {
  ChatArtifactItem,
  ChatReference,
  ChatStreamSnapshot,
  ChatToolCall,
} from './types'

export function applyEventIdToSnapshot(
  snapshot: ChatStreamSnapshot,
  eventId: number,
): ChatStreamSnapshot {
  if (!Number.isFinite(eventId)) {
    return snapshot
  }

  return {
    ...snapshot,
    lastEventSequence: eventId,
  }
}

export function applyChatModelStartToSnapshot(
  snapshot: ChatStreamSnapshot,
  timestamp: string,
): ChatStreamSnapshot {
  if (!snapshot.activeMessageId) {
    return snapshot
  }

  // 每次新的 chat model phase 开始时，都要先切到新的 assistant message。
  // 这样后续到达的 think / toolcall 才会落到正文后面，而不是继续挤进上一段正文上方的步骤框。
  const result = advanceAssistantMessageForNextModelPhase(
    snapshot.messages,
    snapshot.activeMessageId,
    timestamp,
  )

  return {
    ...snapshot,
    messages: result.messages,
    activeMessageId: result.activeMessageId,
  }
}

export function applyTextDeltaToSnapshot(
  snapshot: ChatStreamSnapshot,
  chunk: string,
  timestamp: string,
): ChatStreamSnapshot {
  if (!snapshot.activeMessageId) {
    return snapshot
  }

  const result = appendTextDeltaToMessages(
    snapshot.messages,
    snapshot.activeMessageId,
    chunk,
    timestamp,
  )

  return {
    ...snapshot,
    messages: result.messages,
    activeMessageId: result.activeMessageId,
  }
}

export function applyReasoningDeltaToSnapshot(
  snapshot: ChatStreamSnapshot,
  chunk: string,
  timestamp: string,
): ChatStreamSnapshot {
  if (!snapshot.activeMessageId) {
    return snapshot
  }

  return {
    ...snapshot,
    messages: appendReasoningDeltaToMessages(
      snapshot.messages,
      snapshot.activeMessageId,
      chunk,
      timestamp,
    ),
  }
}

export function applyToolCallToSnapshot(
  snapshot: ChatStreamSnapshot,
  toolCall: ChatToolCall,
  timestamp: string,
): ChatStreamSnapshot {
  if (!snapshot.activeMessageId) {
    return snapshot
  }

  return {
    ...snapshot,
    messages: upsertToolCallInMessages(
      snapshot.messages,
      snapshot.activeMessageId,
      toolCall,
      timestamp,
    ),
  }
}

export function applyReferencesToSnapshot(
  snapshot: ChatStreamSnapshot,
  references: ChatReference[],
): ChatStreamSnapshot {
  if (!snapshot.activeMessageId) {
    return snapshot
  }

  return {
    ...snapshot,
    messages: attachReferencesToMessages(
      snapshot.messages,
      snapshot.activeMessageId,
      references,
    ),
  }
}

export function applySkillOutputToSnapshot(
  snapshot: ChatStreamSnapshot,
  skillOutput: ChatArtifactItem[],
): ChatStreamSnapshot {
  if (!snapshot.activeMessageId) {
    return snapshot
  }

  return {
    ...snapshot,
    messages: attachSkillOutputToMessages(
      snapshot.messages,
      snapshot.activeMessageId,
      skillOutput,
    ),
  }
}
