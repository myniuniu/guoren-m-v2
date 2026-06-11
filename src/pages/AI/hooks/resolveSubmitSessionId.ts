type ResolveSubmitSessionIdOptions = {
  currentSessionId: string | null
  activeAgentId: string | null
  forceNewSession?: boolean
  findLatestEmptySession: () => Promise<string | null>
  createChatSession: (signal?: AbortSignal, agentId?: string | null) => Promise<{ sessionId: string }>
}

export async function resolveSubmitSessionId({
  currentSessionId,
  activeAgentId,
  forceNewSession = false,
  findLatestEmptySession,
  createChatSession,
}: ResolveSubmitSessionIdOptions): Promise<string> {
  if (currentSessionId && !forceNewSession) {
    return currentSessionId
  }

  if (!forceNewSession && !activeAgentId) {
    const reusedSessionId = await findLatestEmptySession()

    if (reusedSessionId) {
      return reusedSessionId
    }
  }

  return (await createChatSession(undefined, activeAgentId)).sessionId
}
