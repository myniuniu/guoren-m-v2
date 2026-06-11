import { SetOutline } from 'antd-mobile-icons'

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
  headerTitle?: string
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
  headerTitle = '',
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
  const normalizedHeaderTitle = headerTitle.trim()

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
          <div className="ai-custom-agent-conversation-header-title">{normalizedHeaderTitle}</div>
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
        <div className="ai-custom-agent-conversation-header-title">{normalizedHeaderTitle}</div>
        {canEdit ? (
          <button
            aria-label="编辑自定义智能体"
            className="ai-agent-config-close"
            type="button"
            onClick={onOpenEdit}
          >
            <SetOutline aria-hidden="true" style={{ fontSize: 20 }} />
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
        composerNote="AI 生成内容可能有误，请核实重要信息"
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
