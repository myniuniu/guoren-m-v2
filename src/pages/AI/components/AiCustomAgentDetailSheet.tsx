import DisplayName from '../../../components/DisplayName'
import { AiAgentAvatar } from './AiAgentAvatar'

export type AiCustomAgentDetailQuestion = {
  id: string
  question: string
}

export type AiCustomAgentDetailSkill = {
  id: string
  title: string
  description?: string
}

type AiCustomAgentDetailSheetProps = {
  agentName: string
  avatarUrl?: string | null
  description: string
  creatorUserId: string
  publishedAt?: string
  questions: AiCustomAgentDetailQuestion[]
  configuredSkills: AiCustomAgentDetailSkill[]
  canEdit?: boolean
  onClose: () => void
  onStartConversation?: () => void
  onOpenClone?: () => void
  onOpenEdit?: () => void
}

function formatPublishedDate(value?: string): string {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed)
}

export function AiCustomAgentDetailSheet({
  agentName,
  avatarUrl,
  description,
  creatorUserId,
  publishedAt,
  questions,
  configuredSkills,
  canEdit = false,
  onClose,
  onStartConversation,
  onOpenClone,
  onOpenEdit,
}: AiCustomAgentDetailSheetProps) {
  const visibleQuestions = questions.filter((item) => item.question.trim())
  const visibleSkills = configuredSkills.filter((item) => item.title.trim())
  const publishedDate = formatPublishedDate(publishedAt)

  return (
    <div className="ai-custom-agent-detail-sheet-overlay" onClick={onClose}>
      <div className="ai-custom-agent-detail-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="ai-custom-agent-detail-sheet-header">
          <button
            aria-label="关闭智能体详情"
            className="ai-custom-agent-detail-sheet-close"
            type="button"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6L18 18" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
          <div className="ai-custom-agent-detail-sheet-title">智能体详情</div>
          {canEdit ? (
            <button
              aria-label="编辑"
              className="ai-custom-agent-detail-sheet-edit"
              type="button"
              onClick={onOpenEdit}
            >
              编辑
            </button>
          ) : (
            <div aria-hidden="true" className="ai-custom-agent-detail-sheet-header-spacer" />
          )}
        </div>

        <div className="ai-custom-agent-detail-sheet-body">
          <AiAgentAvatar
            ariaLabel={`${agentName}头像`}
            avatarUrl={avatarUrl}
            className="ai-custom-agent-detail-sheet-avatar"
            imageClassName="ai-custom-agent-detail-sheet-avatar-image"
            name={agentName}
            tone="white"
          />

          <div className="ai-custom-agent-detail-sheet-name">{agentName}</div>

          <div className="ai-custom-agent-detail-sheet-meta">
            <div className="ai-custom-agent-detail-sheet-meta-item">
              <span className="ai-custom-agent-detail-sheet-meta-label">开发者：</span>
              <DisplayName className="ai-custom-agent-detail-sheet-meta-value" fallback={creatorUserId} userId={creatorUserId} />
            </div>
            {publishedDate ? (
              <div className="ai-custom-agent-detail-sheet-meta-item">
                <span className="ai-custom-agent-detail-sheet-meta-label">发布时间：</span>
                <span className="ai-custom-agent-detail-sheet-meta-value">{publishedDate}</span>
              </div>
            ) : null}
          </div>

          {description ? <div className="ai-custom-agent-detail-sheet-desc">{description}</div> : null}

          {visibleQuestions.length > 0 ? (
            <section className="ai-custom-agent-detail-sheet-section">
              <div className="ai-custom-agent-detail-sheet-section-title">推荐问题</div>
              <div className="ai-custom-agent-detail-sheet-question-list">
                {visibleQuestions.map((item) => (
                  <div className="ai-custom-agent-detail-sheet-question" key={item.id}>
                    {item.question}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {visibleSkills.length > 0 ? (
            <section className="ai-custom-agent-detail-sheet-section">
              <div className="ai-custom-agent-detail-sheet-section-title">工具</div>
              <div className="ai-custom-agent-detail-sheet-skill-list">
                {visibleSkills.map((item) => (
                  <div className="ai-custom-agent-detail-sheet-skill-item" key={item.id}>
                    <span aria-hidden="true" className="ai-custom-agent-detail-sheet-skill-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="3" />
                        <path d="M8 12h8" />
                        <path d="M12 8v8" />
                      </svg>
                    </span>
                    <div className="ai-custom-agent-detail-sheet-skill-main">
                      <div className="ai-custom-agent-detail-sheet-skill-title">{item.title}</div>
                      {item.description ? (
                        <div className="ai-custom-agent-detail-sheet-skill-desc">{item.description}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="ai-custom-agent-detail-sheet-footer">
          <button
            aria-label="开始对话"
            className="ai-custom-agent-detail-sheet-primary"
            type="button"
            onClick={onStartConversation}
          >
            开始对话
          </button>
          <button
            aria-label="创建同款"
            className="ai-custom-agent-detail-sheet-secondary"
            type="button"
            onClick={onOpenClone}
          >
            创建同款
          </button>
        </div>
      </div>
    </div>
  )
}
