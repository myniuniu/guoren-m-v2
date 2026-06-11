import { useEffect, useMemo, useRef, useState } from 'react'

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
  avatarUploading?: boolean
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
  onAvatarChange?: (file: File) => void | Promise<void>
  onProfileSave?: (payload: { agentName: string; description: string }) => void
  showProfileEditButton?: boolean
  composerActionAriaLabel?: string
  composerInputAriaLabel?: string
  composerNote?: string
  composerPlaceholder?: string
  plusAriaLabel?: string
  onComposerPlusClick?: () => void
}

const EMPTY_MESSAGES: ChatMessage[] = []

export function AiAgentConversationPreview({
  agentName,
  avatarUrl,
  description,
  avatarUploading = false,
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
  onAvatarChange,
  onProfileSave,
  showProfileEditButton = true,
  composerActionAriaLabel = '发送调试消息',
  composerInputAriaLabel = '智能体调试输入框',
  composerNote = 'AI 生成内容可能有误，请核实重要信息',
  composerPlaceholder = '问我任何问题',
  plusAriaLabel = '打开更多操作',
  onComposerPlusClick,
}: AiAgentConversationPreviewProps) {
  const threadRef = useRef<HTMLDivElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showSkillSheet, setShowSkillSheet] = useState(false)
  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const [editName, setEditName] = useState(agentName)
  const [editDescription, setEditDescription] = useState(description)
  const hasMessages = messages.length > 0
  const visibleQuestions = useMemo(() => {
    return questions.filter((item) => item.question.trim()).slice(0, 4)
  }, [questions])
  const resolvedAgentName = agentName || '未命名智能体'

  useEffect(() => {
    if (!showProfileSheet) {
      return
    }

    setEditName(agentName)
    setEditDescription(description)
  }, [agentName, description, showProfileSheet])

  const closeProfileSheet = () => {
    setShowProfileSheet(false)
  }

  const handleProfileSave = () => {
    const nextAgentName = editName.trim()

    if (!nextAgentName) {
      return
    }

    onProfileSave?.({
      agentName: nextAgentName,
      description: editDescription.trim(),
    })
    setShowProfileSheet(false)
  }

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
                ariaLabel={`${resolvedAgentName}头像`}
                avatarUrl={avatarUrl}
                className="ai-agent-chat-preview-avatar"
                imageClassName="ai-agent-chat-preview-avatar-image"
                name={resolvedAgentName}
                tone="white"
              />
              <div className="ai-agent-chat-preview-title-row">
                <div className="ai-agent-chat-preview-name">{resolvedAgentName}</div>
                {showProfileEditButton ? (
                  <button
                    aria-label="编辑智能体基础信息"
                    className="ai-agent-chat-preview-edit-btn"
                    type="button"
                    onClick={() => setShowProfileSheet(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                    </svg>
                  </button>
                ) : null}
              </div>
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

      {showProfileSheet ? (
        <div className="ai-agent-debug-sheet-overlay" onClick={closeProfileSheet}>
          <div className="ai-agent-debug-sheet ai-agent-profile-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="ai-agent-debug-sheet-handle" />
            <div className="ai-agent-profile-sheet-header">
              <div className="ai-agent-profile-sheet-title">编辑基本信息</div>
              <button
                aria-label="关闭基础信息弹窗"
                className="ai-agent-profile-sheet-close"
                type="button"
                onClick={closeProfileSheet}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6L18 18" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="ai-agent-profile-sheet-body">
              <div className="ai-agent-profile-sheet-avatar-wrap">
                <div className="ai-agent-profile-sheet-avatar-box">
                  <AiAgentAvatar
                    ariaLabel={`${resolvedAgentName}头像`}
                    avatarUrl={avatarUrl}
                    className="ai-agent-profile-sheet-avatar"
                    imageClassName="ai-agent-profile-sheet-avatar-image"
                    name={resolvedAgentName}
                    tone="white"
                  />
                  <button
                    aria-label={avatarUploading ? '头像上传中' : '上传头像'}
                    className="ai-agent-profile-sheet-avatar-btn"
                    disabled={avatarUploading}
                    type="button"
                    onClick={() => {
                      if (!avatarUploading) {
                        avatarInputRef.current?.click()
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M8.5 6.5L9.9 5.1C10.3 4.7 10.5 4.5 10.8 4.4C11.1 4.2 11.5 4.2 12 4.2C12.5 4.2 12.9 4.2 13.2 4.4C13.5 4.5 13.7 4.7 14.1 5.1L15.5 6.5H17C18.9 6.5 19.8 6.5 20.4 7.1C21 7.7 21 8.6 21 10.5V15.5C21 17.4 21 18.3 20.4 18.9C19.8 19.5 18.9 19.5 17 19.5H7C5.1 19.5 4.2 19.5 3.6 18.9C3 18.3 3 17.4 3 15.5V10.5C3 8.6 3 7.7 3.6 7.1C4.2 6.5 5.1 6.5 7 6.5H8.5Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.9" />
                    </svg>
                  </button>
                </div>
                <input
                  ref={avatarInputRef}
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  aria-label="选择头像图片"
                  className="ai-agent-profile-sheet-file-input"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0]

                    event.target.value = ''

                    if (!file) {
                      return
                    }

                    void onAvatarChange?.(file)
                  }}
                />
              </div>

              <label className="ai-agent-profile-sheet-field">
                <span className="ai-agent-profile-sheet-field-label">
                  智能体名称 <span className="ai-agent-config-required">*</span>
                </span>
                <div className="ai-agent-profile-sheet-input-wrap">
                  <input
                    className="ai-agent-profile-sheet-input"
                    maxLength={30}
                    placeholder="请输入智能体名称"
                    type="text"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                  />
                  <span className="ai-agent-profile-sheet-char-count ai-agent-profile-sheet-char-count-input">
                    {editName.length}/30
                  </span>
                </div>
              </label>

              <label className="ai-agent-profile-sheet-field">
                <span className="ai-agent-profile-sheet-field-label">
                  简介 <span className="ai-agent-config-required">*</span>
                </span>
                <div className="ai-agent-profile-sheet-textarea-wrap">
                  <textarea
                    className="ai-agent-profile-sheet-textarea"
                    maxLength={200}
                    placeholder="请输入一句话介绍"
                    rows={4}
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                  />
                  <span className="ai-agent-profile-sheet-char-count">
                    {editDescription.length}/200
                  </span>
                </div>
              </label>
            </div>

            <div className="ai-agent-profile-sheet-footer">
              <button
                className="ai-agent-profile-sheet-cancel"
                type="button"
                onClick={closeProfileSheet}
              >
                取消
              </button>
              <button
                aria-label="保存基础信息"
                className={`ai-agent-profile-sheet-save${editName.trim() ? ' is-active' : ''}`}
                disabled={!editName.trim()}
                type="button"
                onClick={handleProfileSave}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="ai-page-bottom ai-agent-chat-preview-bottom">
        {requestError ? <div className="ai-page-error-banner">{requestError}</div> : null}
        <AppComposerInput
          actionAriaLabel={composerActionAriaLabel}
          canSubmit={canSubmit}
          className="ai-page-composer-input ai-agent-chat-preview-composer"
          inputAriaLabel={composerInputAriaLabel}
          isResponding={isResponding}
          isStopping={isStopping}
          note={composerNote}
          placeholder={composerPlaceholder}
          plusAriaLabel={plusAriaLabel}
          value={inputValue}
          onChange={onInputChange}
          onPlusClick={() => {
            if (onComposerPlusClick) {
              onComposerPlusClick()
              return
            }

            setShowActionSheet(true)
          }}
          onStop={onStop}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
