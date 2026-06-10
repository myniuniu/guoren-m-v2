import { useEffect, useRef, useState } from 'react'

import { fetchAgentTemplateDetail, fetchAgentTemplates, type AgentTemplateItem } from '../../../services/agentTemplates'

type AiCreateAgentModalProps = {
  visible: boolean
  onClose: () => void
  onUseTemplate?: (template: {
    agentName: string
    description: string
    instruction: string
    presetQuestions: Array<{
      id: string
      question: string
      instruction: string
    }>
  }) => void
}

const HEADER_ILLUSTRATION_URL = 'https://guoren-skills-hb-test.oss-cn-beijing.aliyuncs.com/system/images/banner/97503344fc8b44759e89945b4da68833.png'

const FEATURE_CARDS = [
  {
    title: '团队协作更顺手',
    description: '一位果仁数字助手服务整个团队，对话与记忆按人和按群隔离。',
  },
  {
    title: '能力丰富更专业',
    description: '深度操作果仁与企业系统，灵活定制技能与工具。',
  },
  {
    title: '持续进化更可控',
    description: '账密统一托管，对话日志与反馈驱动开发者持续调优。',
  },
]

export function AiCreateAgentModal({
  visible,
  onClose,
  onUseTemplate,
}: AiCreateAgentModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [templates, setTemplates] = useState<AgentTemplateItem[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateClicking, setTemplateClicking] = useState('')
  const templateDetailAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!visible) {
      setInputValue('')
      return
    }

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      templateDetailAbortRef.current?.abort()
      templateDetailAbortRef.current = null
      document.body.style.overflow = previousOverflow
    }
  }, [visible])

  useEffect(() => {
    if (!visible) {
      setTemplates([])
      setTemplatesLoading(false)
      setTemplateClicking('')
      templateDetailAbortRef.current?.abort()
      templateDetailAbortRef.current = null
      return
    }

    const controller = new AbortController()

    async function loadTemplates() {
      setTemplatesLoading(true)

      try {
        const items = await fetchAgentTemplates(controller.signal)

        if (!controller.signal.aborted) {
          setTemplates(items)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setTemplates([])
          console.error('加载智能体模板失败:', error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setTemplatesLoading(false)
        }
      }
    }

    void loadTemplates()

    return () => {
      controller.abort()
    }
  }, [visible])

  const handleUseTemplate = async (template: AgentTemplateItem) => {
    setTemplateClicking(template.templateId)
    templateDetailAbortRef.current?.abort()
    const controller = new AbortController()
    templateDetailAbortRef.current = controller

    try {
      const detail = await fetchAgentTemplateDetail(template.templateId, controller.signal)

      if (controller.signal.aborted) {
        return
      }

      onUseTemplate?.({
        agentName: detail.templateName,
        description: detail.description,
        instruction: detail.agentPrompt,
        presetQuestions: detail.presetQuestions.map((item, index) => ({
          id: `template-${detail.templateId}-question-${index}`,
          question: item.question,
          instruction: item.instruction,
        })),
      })
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('获取智能体模板详情失败:', error)
      }
    } finally {
      if (!controller.signal.aborted) {
        setTemplateClicking('')
      }

      if (templateDetailAbortRef.current === controller) {
        templateDetailAbortRef.current = null
      }
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div className="ai-create-agent-modal-overlay" onClick={onClose}>
      <div
        aria-label="创建智能体"
        aria-modal="true"
        className="ai-create-agent-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button aria-label="关闭创建智能体弹窗" className="ai-create-agent-modal-close" type="button" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6L18 18" />
            <path d="M18 6L6 18" />
          </svg>
        </button>

        <div className="ai-create-agent-modal-hero">
          <img alt="" className="ai-create-agent-modal-hero-image" src={HEADER_ILLUSTRATION_URL} />
        </div>

        <div className="ai-create-agent-modal-content">
          <h2 className="ai-create-agent-modal-title">即刻创建你的果仁团队助手</h2>

          <div className="ai-create-agent-modal-features">
            {FEATURE_CARDS.map((item, index) => (
              <div className="ai-create-agent-modal-feature" key={item.title}>
                <span className="ai-create-agent-modal-feature-icon">{index + 1}</span>
                <span className="ai-create-agent-modal-feature-copy">
                  <span className="ai-create-agent-modal-feature-title">{item.title}</span>
                  <span className="ai-create-agent-modal-feature-desc">{item.description}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="ai-create-agent-modal-input-wrap">
            <textarea
              className="ai-create-agent-modal-textarea"
              maxLength={500}
              placeholder="比如：我想要一个学习助手，能根据我的学习目标制定专属计划，梳理知识脉络和重点难点，用通俗易懂的方式讲解复杂概念，帮我高效掌握新知识。"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <button
              aria-label="发送创建请求"
              className="ai-create-agent-modal-send"
              disabled
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>

          <div className="ai-create-agent-modal-templates-title">没有灵感？试试果仁模板~</div>
          <div className="ai-create-agent-modal-templates">
            {templatesLoading ? (
              <div className="ai-create-agent-modal-templates-state">模板加载中...</div>
            ) : templates.length === 0 ? (
              <div className="ai-create-agent-modal-templates-state">暂无模板</div>
            ) : (
              templates.map((template) => (
                <button
                  className={`ai-create-agent-modal-template${templateClicking === template.templateId ? ' is-loading' : ''}`}
                  disabled={templateClicking === template.templateId}
                  key={template.templateId}
                  title={template.description}
                  type="button"
                  onClick={() => {
                    void handleUseTemplate(template)
                  }}
                >
                  {templateClicking === template.templateId ? '加载中...' : template.templateName}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
