import { useMemo, useRef, useState } from 'react'

import type { ChatMessage } from '../../../services/chat/types'
import AppComposerInput from '../../../components/AppComposerInput'
import type { SelectedArtifact } from '../hooks/useAiChatRuntime'
import { AiAgentAvatar } from './AiAgentAvatar'
import { AiConversationThread } from './AiConversationThread'

type AiAgentConversationPreviewQuestion = {
  id: string
  question: string
  instruction: string
}

type AiAgentConversationPreviewSkill = {
  id: string
  title: string
  description: string
}

type AiAgentConversationPreviewProps = {
  agentName: string
  avatarUrl?: string | null
  description: string
  inputValue: string
  requestError?: string
  canSubmit?: boolean
  isResponding?: boolean
  isStopping?: boolean
  webSearchEnabled?: boolean
  webSearchLocked?: boolean
  configuredSkills?: AiAgentConversationPreviewSkill[]
  messages?: ChatMessage[]
  questions: AiAgentConversationPreviewQuestion[]
  onInputChange: (value: string) => void
  onSelectArtifact?: (artifact: SelectedArtifact) => void
  onStop?: () => void | Promise<void>
  onSubmit?: (promptOverride?: string) => void | Promise<void>
  onSuggestionClick: (prompt: string) => void
  onToggleWebSearch?: () => void
  onLockedWebSearchClick?: () => void
}

const EMPTY_MESSAGES: ChatMessage[] = []

export function AiAgentConversationPreview({
  agentName,
  avatarUrl,
  description,
  inputValue,
  requestError = '',
  canSubmit = false,
  isResponding = false,
  isStopping = false,
  webSearchEnabled = false,
  webSearchLocked = false,
  configuredSkills = [],
  messages = EMPTY_MESSAGES,
  questions,
  onInputChange,
  onSelectArtifact,
  onStop,
  onSubmit,
  onSuggestionClick,
  onToggleWebSearch,
  onLockedWebSearchClick,
}: AiAgentConversationPreviewProps) {
  const threadRef = useRef<HTMLDivElement | null>(null)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showSkillSheet, setShowSkillSheet] = useState(false)
  const hasMessages = messages.length > 0
  const visibleQuestions = useMemo(() => {
    return questions.filter((item) => item.question.trim()).slice(0, 4)
  }, [questions])

  return (
    <div className="ai-agent-chat-preview">
      <div className="ai-agent-chat-preview-content">
        {hasMessages ? (
          <AiConversationThread
            messages={messages}
            onSelectArtifact={onSelectArtifact ?? (() => undefined)}
            routeSessionId={null}
            scrollRef={threadRef}
          />
        ) : (
          <div className="ai-chat-thread ai-agent-chat-preview-thread" ref={threadRef}>
            <div className="ai-agent-chat-preview-welcome">
              <AiAgentAvatar
                ariaLabel={`${agentName || '智能体'}头像`}
                avatarUrl={avatarUrl}
                className="ai-agent-chat-preview-avatar"
                imageClassName="ai-agent-chat-preview-avatar-image"
                name={agentName}
              />
              <div className="ai-agent-chat-preview-name">{agentName || '未命名智能体'}</div>
              {description ? <div className="ai-agent-chat-preview-desc">{description}</div> : null}

              {visibleQuestions.length > 0 ? (
                <div className="ai-agent-chat-preview-question-section">
                  <div className="ai-agent-chat-preview-question-title">推荐问题</div>
                  <div className="ai-agent-chat-preview-question-list">
                    {visibleQuestions.map((item) => (
                      <button
                        className="ai-agent-chat-preview-question"
                        key={item.id}
                        type="button"
                        onClick={() => onSuggestionClick(item.instruction || item.question)}
                      >
                        {item.question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {showActionSheet ? (
        <div className="ai-agent-debug-sheet-overlay" onClick={() => setShowActionSheet(false)}>
          <div className="ai-agent-debug-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="ai-agent-debug-sheet-handle" />
            <div className="ai-agent-debug-sheet-list">
              <button
                aria-label="打开当前智能体 Skills 列表"
                className="ai-agent-debug-sheet-row"
                type="button"
                onClick={() => {
                  setShowActionSheet(false)
                  setShowSkillSheet(true)
                }}
              >
                <span className="ai-agent-debug-sheet-row-label">技能</span>
                <span aria-hidden="true" className="ai-agent-debug-sheet-row-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>

              <div className="ai-agent-debug-sheet-row is-switch-row">
                <span className="ai-agent-debug-sheet-row-label">网络请求</span>
                <button
                  aria-checked={webSearchEnabled}
                  aria-disabled={webSearchLocked}
                  aria-label="网络请求开关"
                  className={`ai-agent-debug-sheet-switch${webSearchEnabled ? ' is-active' : ''}${webSearchLocked ? ' is-locked' : ''}`}
                  role="switch"
                  type="button"
                  onClick={() => {
                    if (webSearchLocked) {
                      onLockedWebSearchClick?.()
                      return
                    }

                    onToggleWebSearch?.()
                  }}
                >
                  <span className="ai-agent-debug-sheet-switch-track">
                    <span className="ai-agent-debug-sheet-switch-thumb" />
                  </span>
                  {webSearchLocked ? (
                    <span aria-hidden="true" className="ai-agent-debug-sheet-switch-lock">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 7V5a4 4 0 1 1 8 0v2h.5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H4zm1.5-2v2h5V5a2.5 2.5 0 0 0-5 0z" />
                      </svg>
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showSkillSheet ? (
        <div className="ai-agent-debug-sheet-overlay" onClick={() => setShowSkillSheet(false)}>
          <div className="ai-agent-debug-sheet ai-agent-debug-skill-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="ai-agent-debug-sheet-handle" />
            <div className="ai-agent-debug-skill-sheet-header">
              <div className="ai-agent-debug-skill-sheet-title">已配置 Skills 服务</div>
              <button
                aria-label="关闭已配置 Skills 服务"
                className="ai-agent-debug-skill-sheet-close"
                type="button"
                onClick={() => setShowSkillSheet(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6L18 18" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            {configuredSkills.length === 0 ? (
              <div className="ai-agent-debug-skill-sheet-empty">当前智能体未配置 Skills 服务</div>
            ) : (
              <div className="ai-agent-debug-skill-sheet-list">
                {configuredSkills.map((skill) => (
                  <div className="ai-agent-debug-skill-card" key={skill.id}>
                    <div className="ai-agent-debug-skill-card-title">{skill.title}</div>
                    <div className="ai-agent-debug-skill-card-desc">{skill.description || '暂无描述'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="ai-page-bottom ai-agent-chat-preview-bottom">
        {requestError ? <div className="ai-page-error-banner">{requestError}</div> : null}
        <AppComposerInput
          actionAriaLabel="发送调试消息"
          canSubmit={canSubmit}
          className="ai-page-composer-input ai-agent-chat-preview-composer"
          inputAriaLabel="智能体调试输入框"
          isResponding={isResponding}
          isStopping={isStopping}
          note="AI 生成内容可能有误，请核实重要信息"
          placeholder="问我任何问题"
          plusAriaLabel="打开更多操作"
          value={inputValue}
          onChange={onInputChange}
          onPlusClick={() => setShowActionSheet(true)}
          onStop={onStop}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
