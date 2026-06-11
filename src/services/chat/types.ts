export type ChatRole = 'user' | 'assistant'

export type ChatStreamStatus = 'streaming' | 'completed' | 'aborted' | 'error'

export type ChatAttachmentStatus = 'completed' | 'uploading' | 'parsing'

export type ChatAttachmentKind = 'uploaded' | 'resource'

export interface ChatAttachment {
  id: string
  kind: ChatAttachmentKind
  name: string
  status: ChatAttachmentStatus
  objectKey?: string
  resourceId?: string
  url?: string
}

export interface ChatReference {
  title?: string
  url?: string
}

export interface ChatArtifactItem {
  skill_name?: string
  type: string
  filename: string
  url: string
  size?: number
}

export interface ChatToolCall {
  name: string
  runId: string
  status: 'running' | 'completed'
  input: Record<string, unknown>
  output?: unknown
  toolDisplay?: Record<string, unknown>
  timestamp?: string
}

export type ChatProcessingStep =
  | {
      id: string
      type: 'reasoning'
      reasoning: string
      timestamp: string
    }
  | {
      id: string
      type: 'tool'
      toolCall: ChatToolCall
      timestamp: string
    }

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  sessionId: string | null
  loading?: boolean
  reasoningContent?: string | null
  reasoningTimestamp?: string | null
  toolCalls: ChatToolCall[]
  processingSteps?: ChatProcessingStep[]
  references: ChatReference[]
  skillOutput: ChatArtifactItem[]
  attachments: ChatAttachment[]
}

export interface ChatSessionAgentInfo {
  agent_name?: string
  avatar_url?: string | null
}

export interface ChatSession {
  session_id: string
  session_name: string | null
  user_id: string
  created_at: string
  updated_at: string
  tool_type?: string | null
  agent_id?: string | null
  agent_type?: string | null
  agent_info?: ChatSessionAgentInfo | null
}

export interface ChatSessionMessageAttachment {
  resource_id: string
  file_name: string
  url?: string
}

export interface ChatSessionMessage {
  message_id: string
  role: ChatRole
  content: string
  reasoning_content?: string | null
  tool_calls: Array<{
    call_id: string
    name: string
    input: Record<string, unknown>
    output?: unknown
    status?: string
    timestamp?: string
    tool_display?: Record<string, unknown>
  }>
  references: ChatReference[]
  skill_output: unknown
  attachments?: ChatSessionMessageAttachment[]
  created_at: string
}

export interface ChatSessionDetail extends ChatSession {
  theme_id: string | null
  tool_config: unknown
  message_count: number
  messages: ChatSessionMessage[]
  has_running_stream?: boolean
}

export interface ChatStreamSnapshot {
  sessionId: string
  messages: ChatMessage[]
  status: ChatStreamStatus
  error: string | null
  activeMessageId: string | null
  lastEventSequence: number
}

export interface ChatStreamHttpRequest {
  url: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
}

export interface ChatStreamStartPayload {
  message: string
  enableWebSearch?: boolean
  skillName?: string | null
  uploadedFiles?: Array<{
    resource_id: string
    file_name: string
    url?: string
  }>
  resourceIds?: string[]
}

export interface ChatEntryState {
  entryId: string
  initialPrompt: string
  autoSend?: boolean
  toolType?: string | null
  attachments?: ChatAttachment[]
}
