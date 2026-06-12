export type ChatParseTaskPhase = 'parsing' | 'completed' | 'failed'

export interface ChatParseTaskStatePayload {
  resource_id?: string | null
  status?: string | null
  progress?: number | null
  result?: unknown
  error?: string | null
  completed_at?: string | null
  failed_at?: string | null
}

export interface ChatParseTaskState {
  phase: ChatParseTaskPhase
  progress: number | null
  resourceId: string | null
  error: string | null
}

function normalizeOptionalText(value?: string | null): string {
  return value?.trim() || ''
}

export function resolveChatParseTaskState(payload: ChatParseTaskStatePayload): ChatParseTaskState {
  const normalizedStatus = normalizeOptionalText(payload.status).toLowerCase()
  const resourceId = normalizeOptionalText(payload.resource_id) || null
  const hasCompletedAt = Boolean(normalizeOptionalText(payload.completed_at))
  const hasFailedAt = Boolean(normalizeOptionalText(payload.failed_at))
  const hasResult = payload.result !== null && payload.result !== undefined
  const error = normalizeOptionalText(payload.error) || null

  if (normalizedStatus === 'failed' || hasFailedAt) {
    return {
      phase: 'failed',
      progress: payload.progress ?? null,
      resourceId,
      error,
    }
  }

  if (normalizedStatus === 'completed' && (hasResult || hasCompletedAt)) {
    return {
      phase: 'completed',
      progress: payload.progress ?? null,
      resourceId,
      error,
    }
  }

  return {
    phase: 'parsing',
    progress: payload.progress ?? null,
    resourceId,
    error,
  }
}
