import type { ChatMessage } from '../../../services/chat/types'
import type { SelectedArtifact } from '../hooks/useAiChatRuntime'
import { AiAgentConversationPreview } from './AiAgentConversationPreview'

type AiCustomAgentConversationQuestion = {
  id: string
  question: string
  instruction: string
}

type AiCustomAgentConversationPageProps = {
  agentName: string
  avatarUrl?: string | null
  description: string
  questions: AiCustomAgentConversationQuestion[]
  messages?: ChatMessage[]
  inputValue: string
  requestError?: string
  canSubmit?: boolean
  isResponding?: boolean
  isStopping?: boolean
  loading?: boolean
  error?: string
  canEdit?: boolean
  onBack: () => void
  onOpenEdit?: () => void
  onInputChange: (value: string) => void
  onSelectArtifact?: (artifact: SelectedArtifact) => void
  onStop?: () => void | Promise<void>
  onSubmit?: (promptOverride?: string) => void | Promise<void>
  onSuggestionClick: (prompt: string) => void
  onPlusClick?: () => void
}

export function AiCustomAgentConversationPage({
  agentName,
  avatarUrl,
  description,
  questions,
  messages,
  inputValue,
  requestError = '',
  canSubmit = false,
  isResponding = false,
  isStopping = false,
  loading = false,
  error = '',
  canEdit = false,
  onBack,
  onOpenEdit,
  onInputChange,
  onSelectArtifact,
  onStop,
  onSubmit,
  onSuggestionClick,
  onPlusClick,
}: AiCustomAgentConversationPageProps) {
  if (loading || error) {
    return (
      <div className="ai-custom-agent-conversation-page">
        <div className="ai-agent-config-header">
          <button
            aria-label="返回主页"
            className="ai-agent-config-back"
            type="button"
            onClick={onBack}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="ai-custom-agent-conversation-header-title">会话</div>
          <div aria-hidden="true" className="ai-agent-config-header-spacer" />
        </div>

        <div className="ai-custom-agent-conversation-status">
          {loading ? '智能体加载中…' : error || '智能体加载失败'}
        </div>
      </div>
    )
  }

  return (
    <div className="ai-custom-agent-conversation-page">
      <div className="ai-agent-config-header">
        <button
          aria-label="返回主页"
          className="ai-agent-config-back"
          type="button"
          onClick={onBack}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="ai-custom-agent-conversation-header-title">会话</div>
        {canEdit ? (
          <button
            aria-label="编辑自定义智能体"
            className="ai-custom-agent-conversation-settings"
            type="button"
            onClick={onOpenEdit}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55V22a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1.03H2a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.03 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H8a1.7 1.7 0 0 0 1.03-1.55V2a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 14.06 3.64a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V8c0 .67.4 1.28 1.03 1.55.16.07.34.1.52.1H22a2 2 0 1 1 0 4h-.09c-.68 0-1.29.4-1.55 1.03V15Z" />
            </svg>
          </button>
        ) : (
          <div aria-hidden="true" className="ai-agent-config-header-spacer" />
        )}
      </div>

      <AiAgentConversationPreview
        agentName={agentName}
        avatarUrl={avatarUrl}
        canSubmit={canSubmit}
        composerActionAriaLabel="发送消息"
        composerInputAriaLabel="自定义智能体输入框"
        composerNote="使用国内合规模型并严格遵循权限隔离，保障企业数据安全"
        configuredSkills={[]}
        description={description}
        inputValue={inputValue}
        isResponding={isResponding}
        isStopping={isStopping}
        messages={messages}
        plusAriaLabel="打开更多操作"
        questions={questions}
        requestError={requestError}
        showProfileEditButton={false}
        onComposerPlusClick={onPlusClick}
        onInputChange={onInputChange}
        onSelectArtifact={onSelectArtifact}
        onStop={onStop}
        onSubmit={onSubmit}
        onSuggestionClick={onSuggestionClick}
      />
    </div>
  )
}
