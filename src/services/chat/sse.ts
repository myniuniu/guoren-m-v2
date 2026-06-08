import type { ChatArtifactItem, ChatReference, ChatToolCall } from './types'

type ToolStartEvent = {
  name?: string
  run_id?: string
  data?: {
    input?: Record<string, unknown>
  }
}

type ToolEndEvent = {
  name?: string
  run_id?: string
  data?: {
    output?: unknown
    tool_display?: Record<string, unknown>
  }
}

type ChainEndEvent = {
  data?: {
    output?: {
      reasoning_content?: string
    }
    references?: unknown
    skill_output?: unknown
  }
}

type ChatModelEndEvent = {
  data?: {
    output?: {
      content?: string
      reasoning_content?: string
      tool_calls?: Array<{
        name?: string
        args?: Record<string, unknown>
        id?: string
      }>
    }
  }
}

export interface ReadSseStreamOptions {
  onEventId?: (eventId: string) => void
  onChatModelStart?: () => void
  onTextDelta?: (chunk: string) => void
  onReasoningDelta?: (chunk: string) => void
  onToolStart?: (toolCall: ChatToolCall) => void
  onToolEnd?: (toolCall: ChatToolCall) => void
  onReferences?: (references: ChatReference[]) => void
  onSkillOutput?: (skillOutput: ChatArtifactItem[]) => void
}

function extractReferences(eventObj: ChainEndEvent): ChatReference[] {
  if (!Array.isArray(eventObj.data?.references)) {
    return []
  }

  return eventObj.data.references.filter((item): item is ChatReference => {
    return typeof item === 'object' && item !== null
  })
}

function extractSkillOutput(eventObj: ChainEndEvent): ChatArtifactItem[] {
  if (!Array.isArray(eventObj.data?.skill_output)) {
    return []
  }

  return eventObj.data.skill_output.filter((item): item is ChatArtifactItem => {
    return typeof item === 'object'
      && item !== null
      && typeof (item as { url?: unknown }).url === 'string'
      && typeof (item as { filename?: unknown }).filename === 'string'
      && typeof (item as { type?: unknown }).type === 'string'
  })
}

export async function readSseStream(
  stream: ReadableStream<Uint8Array>,
  options: ReadSseStreamOptions
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''
  let currentEventId = ''
  let chunkCount = 0
  let reasoningChunkCount = 0

  const flushLine = (line: string) => {
    if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim()
      return
    }

    if (line.startsWith('id:')) {
      currentEventId = line.slice(3).trim()
      return
    }

    if (!line.startsWith('data:')) {
      return
    }

    const rawData = line.slice(5).trim()

    if (!rawData) {
      return
    }

    let parsedData: unknown

    try {
      parsedData = JSON.parse(rawData)
    } catch {
      return
    }

    if (currentEventId) {
      options.onEventId?.(currentEventId)
    }

    if (currentEvent === 'on_tool_start') {
      const eventObj = parsedData as ToolStartEvent
      if (eventObj.name && eventObj.run_id) {
        options.onToolStart?.({
          name: eventObj.name,
          runId: eventObj.run_id,
          status: 'running',
          input: eventObj.data?.input ?? {},
        })
      }
      return
    }

    if (currentEvent === 'on_chat_model_start') {
      options.onChatModelStart?.()
      return
    }

    if (currentEvent === 'on_tool_end') {
      const eventObj = parsedData as ToolEndEvent
      if (eventObj.name && eventObj.run_id) {
        options.onToolEnd?.({
          name: eventObj.name,
          runId: eventObj.run_id,
          status: 'completed',
          input: {},
          output: eventObj.data?.output,
          toolDisplay: eventObj.data?.tool_display,
        })
      }
      return
    }

    if (currentEvent === 'on_chain_end') {
      const chainEndEvent = parsedData as ChainEndEvent
      const reasoningContent = chainEndEvent.data?.output?.reasoning_content

      if (typeof reasoningContent === 'string' && reasoningContent && reasoningChunkCount === 0) {
        reasoningChunkCount += 1
        options.onReasoningDelta?.(reasoningContent)
      }

      options.onReferences?.(extractReferences(chainEndEvent))
      options.onSkillOutput?.(extractSkillOutput(chainEndEvent))
      return
    }

    if (currentEvent === 'on_chat_model_end') {
      const eventObj = parsedData as ChatModelEndEvent
      const output = eventObj.data?.output
      const toolCalls = Array.isArray(output?.tool_calls) ? output.tool_calls : []

      if (typeof output?.content === 'string' && output.content && chunkCount === 0) {
        chunkCount += 1
        options.onTextDelta?.(output.content)
      }

      if (typeof output?.reasoning_content === 'string' && output.reasoning_content && reasoningChunkCount === 0) {
        reasoningChunkCount += 1
        options.onReasoningDelta?.(output.reasoning_content)
      }

      toolCalls.forEach((toolCall) => {
        if (!toolCall.name || !toolCall.id) {
          return
        }

        options.onToolStart?.({
          name: toolCall.name,
          runId: toolCall.id,
          status: 'running',
          input: toolCall.args ?? {},
        })
      })

      return
    }

    if (currentEvent !== 'on_chat_model_stream') {
      return
    }

    const chunk = typeof parsedData === 'object' && parsedData !== null
      ? (parsedData as { data?: { chunk?: { content?: string } } }).data?.chunk?.content
      : undefined
    const reasoningChunk = typeof parsedData === 'object' && parsedData !== null
      ? (parsedData as { data?: { chunk?: { reasoning_content?: string } } }).data?.chunk?.reasoning_content
      : undefined

    if (chunk) {
      chunkCount += 1
      options.onTextDelta?.(chunk)
    }

    if (reasoningChunk) {
      reasoningChunkCount += 1
      options.onReasoningDelta?.(reasoningChunk)
    }
  }

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    lines.forEach((line) => {
      if (!line.trim()) {
        currentEvent = ''
        currentEventId = ''
        return
      }

      flushLine(line)
    })
  }

  const remaining = buffer.trim()

  if (remaining) {
    flushLine(remaining)
  }
}
