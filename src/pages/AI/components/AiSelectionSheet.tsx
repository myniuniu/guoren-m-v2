import type { ReactNode } from 'react'

type AiSelectionSheetItem = {
  id: string
  title: string
  description?: string
  badge?: string
}

type AiSelectionSheetProps = {
  visible: boolean
  title: string
  searchPlaceholder: string
  searchValue: string
  items: AiSelectionSheetItem[]
  selectedIds: string[]
  showSearch?: boolean
  loading: boolean
  error: string
  emptyText: string
  fixedHeight?: boolean
  children?: ReactNode
  onClose: () => void
  onSearchChange: (value: string) => void
  onSelect: (itemId: string) => void
}

export function AiSelectionSheet({
  visible,
  title,
  searchPlaceholder,
  searchValue,
  items,
  selectedIds,
  showSearch = true,
  loading,
  error,
  emptyText,
  fixedHeight = false,
  children,
  onClose,
  onSearchChange,
  onSelect,
}: AiSelectionSheetProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="ai-selection-sheet-overlay" onClick={onClose}>
      <div
        className={`ai-selection-sheet${fixedHeight ? ' is-fixed-height' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ai-selection-sheet-header">
          <div className="ai-selection-sheet-title">{title}</div>
          <button
            aria-label={`关闭${title}`}
            className="ai-selection-sheet-close"
            type="button"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6L18 18" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        {showSearch ? (
          <label className="ai-selection-sheet-search" htmlFor={`ai-selection-sheet-search-${title}`}>
            <span className="ai-selection-sheet-search-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </span>
            <input
              id={`ai-selection-sheet-search-${title}`}
              className="ai-selection-sheet-search-input"
              placeholder={searchPlaceholder}
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        ) : null}

        <div className={`ai-selection-sheet-body has-edge-scrollbar${children ? ' is-plain' : ''}`}>
          {children ?? (
            <>
              {loading ? <div className="ai-selection-sheet-status">加载中…</div> : null}
              {!loading && error ? <div className="ai-selection-sheet-status is-error">{error}</div> : null}
              {!loading && !error && items.length === 0 ? <div className="ai-selection-sheet-status">{emptyText}</div> : null}
              {!loading && !error && items.length > 0 ? (
                <div className="ai-selection-sheet-list">
                  {items.map((item) => {
                    const checked = selectedIds.includes(item.id)

                    return (
                      <button
                        aria-pressed={checked}
                        className={`ai-selection-sheet-item${checked ? ' is-selected' : ''}`}
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                      >
                        <div className="ai-selection-sheet-item-main">
                          <div className="ai-selection-sheet-item-title-row">
                            <span className="ai-selection-sheet-item-title">{item.title}</span>
                            {item.badge ? <span className="ai-selection-sheet-item-badge">{item.badge}</span> : null}
                          </div>
                          {item.description ? <div className="ai-selection-sheet-item-desc">{item.description}</div> : null}
                        </div>
                        <span className="ai-selection-sheet-item-action">{checked ? '已添加' : '添加'}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
