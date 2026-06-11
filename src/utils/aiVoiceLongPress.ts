export type AiVoiceReleaseSource = 'up' | 'leave'

export function shouldEmitVoiceReleaseSignal(
  source: AiVoiceReleaseSource,
  longPressTriggered: boolean,
): boolean {
  return longPressTriggered && source === 'up'
}
