import type { ChatEntryState } from './types'

export function createVoiceChatEntryState(transcript: string): ChatEntryState {
  return {
    entryId: `voice-entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    initialPrompt: transcript,
    autoSend: true,
    forceNewSession: true,
    enableWebSearch: true,
  }
}

export function resolveChatEntrySubmitOptions(
  state: Pick<ChatEntryState, 'forceNewSession' | 'enableWebSearch'> | null | undefined,
): { forceNewSession?: boolean; enableWebSearch?: boolean } {
  return {
    forceNewSession: state?.forceNewSession,
    enableWebSearch: state?.enableWebSearch,
  }
}
