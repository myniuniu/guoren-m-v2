import { DeleteOutline, MoreOutline } from 'antd-mobile-icons'
import { useEffect, useRef, useState } from 'react'

type AiConversationHeaderActionsProps = {
  showDeleteSessionAction?: boolean
  showPartnerSettingsAction?: boolean
  showCustomAgentMoreAction?: boolean
  onDeleteSession?: () => void
  onOpenPartnerSettings?: () => void
  onOpenCustomAgentDetail?: () => void
  onClose: () => void
}

export function AiConversationHeaderActions({
  showDeleteSessionAction = false,
  showPartnerSettingsAction = false,
  showCustomAgentMoreAction = false,
  onDeleteSession,
  onOpenPartnerSettings,
  onOpenCustomAgentDetail,
  onClose,
}: AiConversationHeaderActionsProps) {
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!showActionMenu) {
      return undefined
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!actionContainerRef.current || !(target instanceof Node)) {
        return
      }

      if (!actionContainerRef.current.contains(target)) {
        setShowActionMenu(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowActionMenu(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showActionMenu])

  useEffect(() => {
    if (!showCustomAgentMoreAction) {
      setShowActionMenu(false)
    }
  }, [showCustomAgentMoreAction])

  return (
    <div className="ai-page-header-right" ref={actionContainerRef}>
      {showCustomAgentMoreAction ? (
        <div className="ai-page-header-action-menu-wrap">
          <button
            aria-label="打开自定义智能体更多操作"
            className="ai-page-header-action"
            type="button"
            onClick={() => setShowActionMenu((current) => !current)}
          >
            <MoreOutline aria-hidden="true" style={{ fontSize: 20 }} />
          </button>

          {showActionMenu ? (
            <div className="ai-page-header-action-menu">
              {onDeleteSession ? (
                <button
                  className="ai-page-header-action-menu-item is-danger"
                  type="button"
                  onClick={() => {
                    setShowActionMenu(false)
                    onDeleteSession()
                  }}
                >
                  删除会话记录
                </button>
              ) : null}
              <button
                className="ai-page-header-action-menu-item"
                type="button"
                onClick={() => {
                  setShowActionMenu(false)
                  onOpenCustomAgentDetail?.()
                }}
              >
                智能体详情
              </button>
            </div>
          ) : null}
        </div>
      ) : showDeleteSessionAction ? (
        <button
          aria-label="删除当前会话"
          className="ai-page-header-action"
          type="button"
          onClick={onDeleteSession}
        >
          <DeleteOutline aria-hidden="true" style={{ fontSize: 20 }} />
        </button>
      ) : null}

      {showPartnerSettingsAction ? (
        <button
          aria-label="打开伙伴设置"
          className="ai-page-header-action"
          type="button"
          onClick={onOpenPartnerSettings}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      ) : null}

      <button
        aria-label="关闭页面"
        className="ai-page-close ai-page-header-action"
        type="button"
        onClick={onClose}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
