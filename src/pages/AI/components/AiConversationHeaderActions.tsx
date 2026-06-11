import { DeleteOutline } from 'antd-mobile-icons'

type AiConversationHeaderActionsProps = {
  showDeleteSessionAction?: boolean
  showPartnerSettingsAction?: boolean
  onDeleteSession?: () => void
  onOpenPartnerSettings?: () => void
  onClose: () => void
}

export function AiConversationHeaderActions({
  showDeleteSessionAction = false,
  showPartnerSettingsAction = false,
  onDeleteSession,
  onOpenPartnerSettings,
  onClose,
}: AiConversationHeaderActionsProps) {
  return (
    <div className="ai-page-header-right">
      {showDeleteSessionAction ? (
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
