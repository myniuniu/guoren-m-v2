import { type ReactNode, type RefObject, useMemo, useState } from 'react'
import { Toast } from 'antd-mobile'
import type {
  ChatArtifactItem,
  ChatMessage,
  ChatReference,
  ChatToolCall,
} from '../../../services/chat/types'
import type { SelectedArtifact } from '../hooks/useAiChatRuntime'
import { AiMarkdownContent } from './AiMarkdownContent'
import {
  extractAssistantOutputText,
  resolveAssistantCopyTargets,
} from './assistantRenderUtils'

type AiConversationThreadProps = {
  messages: ChatMessage[]
  routeSessionId: string | null
  scrollRef: RefObject<HTMLDivElement | null>
  onSelectArtifact: (artifact: SelectedArtifact) => void
}

type PresentationGroup =
  | { type: 'user'; id: string; messages: ChatMessage[] }
  | { type: 'assistant:processing'; id: string; messages: ChatMessage[] }
  | { type: 'assistant:loading'; id: string; messages: ChatMessage[] }
  | { type: 'assistant'; id: string; messages: ChatMessage[] }

type ProcessStep =
  | {
      id: string
      type: 'reasoning'
      reasoning: string
      stepTimestamp: string
      sortOrder: number
    }
  | {
      id: string
      type: 'tool'
      toolCall: ChatToolCall
      stepTimestamp: string
      sortOrder: number
    }

type SearchResultItem = {
  title: string
  url: string
}

type RagVideoResultItem = {
  resourceId: string
  courseTitle: string
  duration?: number | null
  score?: number | null
}

function formatMessageTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function hasTextContent(message: ChatMessage): boolean {
  return message.content.trim().length > 0
}

function hasProcessingSteps(message: ChatMessage): boolean {
  return (message.processingSteps?.length ?? 0) > 0 || Boolean(message.reasoningContent?.trim()) || message.toolCalls.length > 0
}

function hasAssistantOutput(message: ChatMessage): boolean {
  return hasTextContent(message) || message.skillOutput.length > 0 || message.references.length > 0
}

function groupMessages(messages: ChatMessage[]): PresentationGroup[] {
  const groups: PresentationGroup[] = []

  for (const message of messages) {
    if (message.role === 'user') {
      groups.push({
        type: 'user',
        id: message.id,
        messages: [message],
      })
      continue
    }

    const shouldRenderProcessing = hasProcessingSteps(message)
    const shouldRenderAssistantOutput = hasAssistantOutput(message)
    const lastGroup = groups[groups.length - 1]

    if (shouldRenderProcessing) {
      if (lastGroup?.type === 'assistant:processing') {
        lastGroup.messages.push(message)
      } else {
        groups.push({
          type: 'assistant:processing',
          id: `${message.id}-processing`,
          messages: [message],
        })
      }
    }

    if (shouldRenderAssistantOutput) {
      groups.push({
        type: 'assistant',
        id: `${message.id}-assistant`,
        messages: [message],
      })
    }

    if (message.loading && !shouldRenderProcessing && !shouldRenderAssistantOutput) {
      groups.push({
        type: 'assistant:loading',
        id: `${message.id}-loading`,
        messages: [message],
      })
    }
  }

  return groups
}

function buildProcessSteps(messages: ChatMessage[]): ProcessStep[] {
  const steps = messages.flatMap((message, messageIndex) => {
    const processingSteps = message.processingSteps ?? []

    if (processingSteps.length > 0) {
      return processingSteps.map((step, stepIndex) => {
        if (step.type === 'reasoning') {
          return {
            id: step.id,
            type: 'reasoning' as const,
            reasoning: step.reasoning.trim(),
            stepTimestamp: step.timestamp,
            sortOrder: messageIndex * 1000 + stepIndex,
          }
        }

        return {
          id: step.id,
          type: 'tool' as const,
          toolCall: step.toolCall,
          stepTimestamp: step.timestamp,
          sortOrder: messageIndex * 1000 + stepIndex,
        }
      }).filter((step) => {
        return step.type === 'tool' || step.reasoning.trim().length > 0
      })
    }

    const steps: ProcessStep[] = []
    const stepOrderBase = messageIndex * 100

    if (message.reasoningContent?.trim()) {
      steps.push({
        id: `${message.id}-reasoning-${messageIndex}`,
        type: 'reasoning',
        reasoning: message.reasoningContent.trim(),
        stepTimestamp: message.reasoningTimestamp ?? message.createdAt,
        sortOrder: stepOrderBase,
      })
    }

    for (const [toolCallIndex, toolCall] of message.toolCalls.entries()) {
      steps.push({
        id: `${toolCall.runId}-${messageIndex}`,
        type: 'tool',
        toolCall,
        stepTimestamp: toolCall.timestamp ?? message.createdAt,
        sortOrder: stepOrderBase + toolCallIndex + 1,
      })
    }

    return steps
  })

  return [...steps].sort((left, right) => {
    const leftTimestamp = Date.parse(left.stepTimestamp)
    const rightTimestamp = Date.parse(right.stepTimestamp)

    if (Number.isFinite(leftTimestamp) && Number.isFinite(rightTimestamp) && leftTimestamp !== rightTimestamp) {
      return leftTimestamp - rightTimestamp
    }

    if (Number.isFinite(leftTimestamp) && !Number.isFinite(rightTimestamp)) {
      return -1
    }

    if (!Number.isFinite(leftTimestamp) && Number.isFinite(rightTimestamp)) {
      return 1
    }

    return left.sortOrder - right.sortOrder
  }).reduce<ProcessStep[]>((dedupedSteps, step) => {
    if (step.type !== 'tool') {
      dedupedSteps.push(step)
      return dedupedSteps
    }

    const existingIndex = dedupedSteps.findIndex((item) => item.type === 'tool' && item.toolCall.runId === step.toolCall.runId)

    if (existingIndex === -1) {
      dedupedSteps.push(step)
      return dedupedSteps
    }

    const existingStep = dedupedSteps[existingIndex]

    if (existingStep.type !== 'tool') {
      dedupedSteps.push(step)
      return dedupedSteps
    }

    dedupedSteps[existingIndex] = {
      ...existingStep,
      toolCall: {
        ...existingStep.toolCall,
        ...step.toolCall,
        input: Object.keys(step.toolCall.input).length ? step.toolCall.input : existingStep.toolCall.input,
        timestamp: existingStep.toolCall.timestamp ?? step.toolCall.timestamp,
      },
    }

    return dedupedSteps
  }, [])
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function readArrayField(record: Record<string, unknown> | null, keys: string[]): unknown[] {
  if (!record) {
    return []
  }

  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function readStringField(record: Record<string, unknown> | null, keys: string[]): string {
  if (!record) {
    return ''
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function readNumberField(record: Record<string, unknown> | null, keys: string[]): number | null {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function normalizeToolOutput(output: unknown): unknown {
  if (typeof output !== 'string') {
    return output
  }

  const trimmedOutput = output.trim()

  if (!trimmedOutput || !/^[\[{]/.test(trimmedOutput)) {
    return output
  }

  try {
    return JSON.parse(trimmedOutput) as unknown
  } catch {
    return output
  }
}

function readToolDisplayItems(toolCall: ChatToolCall): Array<Record<string, unknown>> {
  const toolDisplay = readRecord(toolCall.toolDisplay)
  const items = toolDisplay?.items

  if (!Array.isArray(items)) {
    return []
  }

  return items.flatMap((item) => {
    const record = readRecord(item)
    return record ? [record] : []
  })
}

function readSearchResults(toolCall: ChatToolCall): SearchResultItem[] {
  const displayItems = readToolDisplayItems(toolCall).flatMap((item) => {
    const title = readStringField(item, ['title', 'name', 'label'])
    const url = readStringField(item, ['url', 'source_url', 'href'])

    if (!title && !url) {
      return []
    }

    return [{
      title: title || url,
      url,
    }]
  })

  if (displayItems.length > 0) {
    return displayItems
  }

  const normalizedOutput = normalizeToolOutput(toolCall.output)
  const outputRecord = readRecord(normalizedOutput)
  const outputItems = Array.isArray(normalizedOutput) ? normalizedOutput : readArrayField(outputRecord, ['results', 'items'])

  return outputItems.flatMap((item) => {
    const record = readRecord(item)
    const title = readStringField(record, ['title', 'name', 'label'])
    const url = readStringField(record, ['url', 'source_url', 'href'])

    if (!title && !url) {
      return []
    }

    return [{
      title: title || url,
      url,
    }]
  })
}

function readTodoItems(toolCall: ChatToolCall): SearchResultItem[] {
  const displayItems = readToolDisplayItems(toolCall).flatMap((item) => {
    const title = readStringField(item, ['content', 'title', 'name', 'label'])

    if (!title) {
      return []
    }

    return [{
      title,
      url: '',
    }]
  })

  if (displayItems.length > 0) {
    return displayItems
  }

  const outputRecord = readRecord(normalizeToolOutput(toolCall.output))
  const outputItems = readArrayField(outputRecord, ['todos', 'items'])

  return outputItems.flatMap((item) => {
    const record = readRecord(item)
    const title = readStringField(record, ['content', 'title', 'name', 'label'])

    if (!title) {
      return []
    }

    return [{
      title,
      url: '',
    }]
  })
}

function readRagVideoItems(toolCall: ChatToolCall): RagVideoResultItem[] {
  const displayItems = readToolDisplayItems(toolCall).flatMap((item) => {
    const courseTitle = readStringField(item, ['course_title', 'title', 'name', 'label'])

    if (!courseTitle) {
      return []
    }

    return [{
      resourceId: readStringField(item, ['resource_id', 'resourceId', 'id']),
      courseTitle,
      duration: readNumberField(item, ['duration']),
      score: readNumberField(item, ['score']),
    }]
  })

  if (displayItems.length > 0) {
    return displayItems
  }

  const normalizedOutput = normalizeToolOutput(toolCall.output)
  const outputRecord = readRecord(normalizedOutput)
  const outputItems = Array.isArray(normalizedOutput) ? normalizedOutput : readArrayField(outputRecord, ['results', 'items', 'videos'])

  return outputItems.flatMap((item) => {
    const record = readRecord(item)
    const courseTitle = readStringField(record, ['course_title', 'title', 'name', 'label'])

    if (!courseTitle) {
      return []
    }

    return [{
      resourceId: readStringField(record, ['resource_id', 'resourceId', 'id']),
      courseTitle,
      duration: readNumberField(record, ['duration']),
      score: readNumberField(record, ['score']),
    }]
  })
}

function readRagVideoSummary(toolCall: ChatToolCall): string {
  if (typeof toolCall.output === 'string' && toolCall.output.trim()) {
    return toolCall.output.trim()
  }

  const outputRecord = readRecord(normalizeToolOutput(toolCall.output))
  const count = readNumberField(outputRecord, ['count', 'total', 'found'])

  if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
    return `找到 ${count} 条视频结果`
  }

  return ''
}

function formatRagVideoMeta(duration?: number | null, score?: number | null): string {
  const meta: string[] = []

  if (typeof duration === 'number' && Number.isFinite(duration)) {
    meta.push(`${duration.toFixed(1)} 分钟`)
  }

  if (typeof score === 'number' && Number.isFinite(score)) {
    meta.push(`相关度 ${score.toFixed(3)}`)
  }

  return meta.join(' · ')
}

function getToolDisplayTitle(toolCall: ChatToolCall): string {
  const label = typeof toolCall.toolDisplay?.tool_label === 'string' ? toolCall.toolDisplay.tool_label : ''
  return label || toolCall.name
}

function getStepStatus(toolCall: ChatToolCall): 'active' | 'complete' {
  return toolCall.status === 'running' ? 'active' : 'complete'
}

function renderResultChips(items: SearchResultItem[]) {
  if (!items.length) {
    return null
  }

  return (
    <div className="ai-cot-result-list">
      {items.map((item, index) => (
        <span className="ai-cot-result-chip" key={`${item.url || item.title}-${index}`}>
          {item.url ? (
            <a href={item.url} rel="noreferrer" target="_blank">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </span>
      ))}
    </div>
  )
}

function ProcessStepShell({
  icon,
  label,
  status = 'complete',
  isLast = false,
  children,
}: {
  icon?: string
  label: ReactNode
  status?: 'complete' | 'active'
  isLast?: boolean
  children?: ReactNode
}) {
  return (
    <div className={`ai-cot-step ${status === 'active' ? 'is-active' : ''}`}>
      <div className="ai-cot-step-icon-wrap">
        <span className="ai-cot-step-icon">{icon ? icon : <span className="ai-cot-dot" />}</span>
        {!isLast ? <span className="ai-cot-step-connector" /> : null}
      </div>
      <div className="ai-cot-step-body">
        <div className="ai-cot-step-label">{label}</div>
        {children}
      </div>
    </div>
  )
}

function ToolCallProcessStep({
  toolCall,
  isLast = false,
}: {
  toolCall: ChatToolCall
  isLast?: boolean
}) {
  const status = getStepStatus(toolCall)

  if (toolCall.name === 'rag_list_videos') {
    const query = typeof toolCall.input.query === 'string' ? toolCall.input.query.trim() : ''
    const label = query ? `检索知识库视频 “${query}”` : '检索知识库视频'
    const resultItems = readRagVideoItems(toolCall)
    const summary = readRagVideoSummary(toolCall)

    return (
      <ProcessStepShell icon="🔎" isLast={isLast} label={label} status={status}>
        {resultItems.length ? (
          <div className="ai-cot-result-list">
            {resultItems.map((item, index) => {
              const meta = formatRagVideoMeta(item.duration, item.score)
              return (
                <span className="ai-cot-result-chip" key={`${item.resourceId || item.courseTitle}-${index}`}>
                  {meta ? `${item.courseTitle} · ${meta}` : item.courseTitle}
                </span>
              )
            })}
          </div>
        ) : summary ? (
          <div className="ai-cot-result-list">
            <span className="ai-cot-result-chip">{summary}</span>
          </div>
        ) : null}
      </ProcessStepShell>
    )
  }

  if (toolCall.name === 'web_search') {
    const query = typeof toolCall.input.query === 'string' ? toolCall.input.query : ''
    const label = query ? `在网络上搜索 “${query}”` : '搜索相关信息'

    return (
      <ProcessStepShell icon="🔎" isLast={isLast} label={label} status={status}>
        {renderResultChips(readSearchResults(toolCall))}
      </ProcessStepShell>
    )
  }

  if (toolCall.name === 'web_fetch') {
    const url = readStringField(toolCall.input, ['url', 'href'])

    return (
      <ProcessStepShell icon="🌐" isLast={isLast} label="查看网页" status={status}>
        {url ? renderResultChips([{ title: url, url }]) : null}
      </ProcessStepShell>
    )
  }

  if (toolCall.name === 'ls') {
    const description = readStringField(toolCall.input, ['description']) || '列出文件夹'
    const path = readStringField(toolCall.input, ['path', 'file_path'])

    return (
      <ProcessStepShell icon="📁" isLast={isLast} label={description} status={status}>
        {path ? renderResultChips([{ title: path, url: '' }]) : null}
      </ProcessStepShell>
    )
  }

  if (toolCall.name === 'read_file') {
    const description = readStringField(toolCall.input, ['description']) || '读取文件'
    const path = readStringField(toolCall.input, ['path', 'file_path', 'filepath'])

    return (
      <ProcessStepShell icon="📄" isLast={isLast} label={description} status={status}>
        {path ? renderResultChips([{ title: path, url: '' }]) : null}
      </ProcessStepShell>
    )
  }

  if (toolCall.name === 'write_file' || toolCall.name === 'edit_file' || toolCall.name === 'str_replace') {
    const description = readStringField(toolCall.input, ['description']) || '写入文件'
    const path = readStringField(toolCall.input, ['path', 'file_path', 'filepath'])

    return (
      <ProcessStepShell icon="✏️" isLast={isLast} label={description} status={status}>
        {path ? renderResultChips([{ title: path, url: '' }]) : null}
      </ProcessStepShell>
    )
  }

  if (toolCall.name === 'bash') {
    const description = readStringField(toolCall.input, ['description']) || '执行命令'
    const command = readStringField(toolCall.input, ['command'])

    return (
      <ProcessStepShell icon="⌘" isLast={isLast} label={description} status={status}>
        {command ? <pre className="ai-cot-code-block">{command}</pre> : null}
      </ProcessStepShell>
    )
  }

  if (toolCall.name === 'ask_clarification') {
    return <ProcessStepShell icon="❓" isLast={isLast} label="需要你的协助" status={status} />
  }

  if (toolCall.name === 'write_todos' || toolCall.name === 'update_plan' || toolCall.name.includes('todo')) {
    return (
      <ProcessStepShell icon="☑️" isLast={isLast} label="更新 To-do 列表" status={status}>
        {renderResultChips(readTodoItems(toolCall))}
      </ProcessStepShell>
    )
  }

  const description = readStringField(toolCall.input, ['description']) || getToolDisplayTitle(toolCall) || `使用 “${toolCall.name}” 工具`

  return <ProcessStepShell icon="🛠" isLast={isLast} label={description} status={status} />
}

function ProcessingMessage({ messages }: { messages: ChatMessage[] }) {
  const [showAbove, setShowAbove] = useState(true)
  const steps = useMemo(() => buildProcessSteps(messages), [messages])
  const latestStep = steps[steps.length - 1] ?? null
  const aboveLatestSteps = latestStep ? steps.slice(0, -1) : []

  const renderProcessStep = (step: ProcessStep, isLast: boolean) => {
    if (step.type === 'reasoning') {
      return (
        <ProcessStepShell icon="💡" isLast={isLast} key={step.id} label={(
          <div className="ai-cot-reasoning-markdown">
            <AiMarkdownContent content={step.reasoning} />
          </div>
        )} />
      )
    }

    return <ToolCallProcessStep isLast={isLast} key={step.id} toolCall={step.toolCall} />
  }

  return (
    <div className="ai-processing-panel">
      <div className="ai-cot">
        {aboveLatestSteps.length > 0 ? (
          <button
            className="ai-cot-toggle"
            onClick={() => setShowAbove((value) => !value)}
            type="button"
          >
            <div className="ai-cot-toggle-row">
              <span className="ai-cot-toggle-label">{showAbove ? '隐藏步骤' : `查看其他 ${aboveLatestSteps.length} 个步骤`}</span>
              <span className={`ai-cot-toggle-arrow ${showAbove ? 'is-open' : ''}`}>⌃</span>
            </div>
          </button>
        ) : null}

        {latestStep ? (
          <div className="ai-cot-content">
            {showAbove ? aboveLatestSteps.map((step, index) => renderProcessStep(
              step,
              index === aboveLatestSteps.length - 1 && !latestStep,
            )) : null}
            {renderProcessStep(latestStep, true)}
          </div>
        ) : null}
      </div>
    </div>
  )
}

async function copyAssistantContent(content: string): Promise<boolean> {
  if (!content.trim()) {
    return false
  }

  try {
    await navigator.clipboard.writeText(content)
    return true
  } catch {
    return false
  }
}

function AssistantOutputMessage({
  message,
  messageSessionId,
  copiedMessageId,
  copyContent,
  onCopy,
  onSelectArtifact,
}: {
  message: ChatMessage
  messageSessionId: string | null
  copiedMessageId: string | null
  copyContent: string
  onCopy: (messageId: string, content: string) => void
  onSelectArtifact: (artifact: SelectedArtifact) => void
}) {
  const textContent = extractAssistantOutputText(message)

  return (
    <div className="ai-chat-row is-assistant">
      <div className="ai-chat-assistant-stack">
        <div className="ai-chat-bubble is-assistant">
          {textContent ? (
            <AiMarkdownContent
              className="ai-chat-markdown"
              content={textContent}
              isStreaming={Boolean(message.loading)}
            />
          ) : null}

          {message.references.length > 0 && (
            <div className="ai-chat-reference-list">
              {message.references.map((reference: ChatReference, index) => (
                <a
                  className="ai-chat-reference-chip"
                  href={reference.url || '#'}
                  key={`${reference.title ?? 'ref'}-${index}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {reference.title || reference.url || `引用 ${index + 1}`}
                </a>
              ))}
            </div>
          )}

          {message.skillOutput.length > 0 && (
            <div className="ai-chat-artifact-list">
              {message.skillOutput.map((artifact: ChatArtifactItem, index) => (
                <button
                  className="ai-chat-artifact-card"
                  key={`${artifact.filename}-${index}`}
                  onClick={() => onSelectArtifact({ sessionId: messageSessionId, createdAt: message.createdAt, artifact })}
                  type="button"
                >
                  <div className="ai-chat-artifact-name">{artifact.filename}</div>
                  <div className="ai-chat-artifact-meta">
                    {artifact.type}
                    {artifact.skill_name ? ` · ${artifact.skill_name}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="ai-chat-message-meta is-assistant is-outside">
          <span>{formatMessageTime(message.createdAt)}</span>
          {copyContent ? (
            <button
              aria-label="复制"
              className="ai-chat-copy-button"
              onClick={() => onCopy(message.id, copyContent)}
              type="button"
            >
              {copiedMessageId === message.id ? '已复制' : '复制'}
            </button>
          ) : null}
          {message.loading ? <span className="ai-chat-message-loading">流式中</span> : null}
        </div>
      </div>
    </div>
  )
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="ai-chat-row is-user">
      <div className="ai-chat-user-stack">
        <div className="ai-chat-bubble is-user">
          {message.attachments.length > 0 && (
            <div className="ai-chat-attachment-list">
              {message.attachments.map((attachment) => (
                <div className="ai-chat-attachment-chip" key={attachment.id}>
                  <span className="ai-chat-attachment-name">{attachment.name}</span>
                  <span className="ai-chat-attachment-status">
                    {attachment.kind === 'resource' ? '资料库' : '文件'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {message.content ? <div className="ai-chat-user-text">{message.content}</div> : null}
        </div>
        <div className="ai-chat-message-meta is-user is-outside">
          <span>{formatMessageTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

function LoadingMessage() {
  return (
    <div className="ai-chat-row is-assistant">
      <div className="ai-chat-loading">
        <span className="ai-chat-loading-dot" />
        <span className="ai-chat-loading-dot" />
        <span className="ai-chat-loading-dot" />
      </div>
    </div>
  )
}

export function AiConversationThread({
  messages,
  routeSessionId,
  scrollRef,
  onSelectArtifact,
}: AiConversationThreadProps) {
  const groups = useMemo(() => groupMessages(messages), [messages])
  const isResponding = useMemo(
    () => messages.some((message) => message.role === 'assistant' && Boolean(message.loading)),
    [messages],
  )
  const assistantCopyTargets = useMemo(
    () => resolveAssistantCopyTargets(messages, { excludeLastTurn: isResponding }),
    [messages, isResponding],
  )
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const handleCopy = async (messageId: string, content: string) => {
    const copied = await copyAssistantContent(content)

    if (!copied) {
      Toast.show({ content: '复制失败，请稍后重试' })
      return
    }

    setCopiedMessageId(messageId)
    Toast.show({ content: '已复制' })
  }

  return (
    <div className="ai-chat-thread" ref={scrollRef}>
      {groups.map((group) => {
        if (group.type === 'user') {
          return group.messages.map((message) => <UserMessage key={message.id} message={message} />)
        }

        if (group.type === 'assistant:processing') {
          return (
            <div className="ai-chat-row is-assistant" key={group.id}>
              <ProcessingMessage messages={group.messages} />
            </div>
          )
        }

        if (group.type === 'assistant:loading') {
          return <LoadingMessage key={group.id} />
        }

        return group.messages.map((message) => {
          const messageSessionId = message.sessionId ?? routeSessionId

          return (
            <AssistantOutputMessage
              copiedMessageId={copiedMessageId}
              copyContent={assistantCopyTargets[message.id] ?? ''}
              key={message.id}
              message={message}
              messageSessionId={messageSessionId}
              onCopy={handleCopy}
              onSelectArtifact={onSelectArtifact}
            />
          )
        })
      })}
    </div>
  )
}
