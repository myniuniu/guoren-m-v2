type AiDiscoverHeaderProps = {
  onOpenDrawer: () => void
}

export function AiDiscoverHeader({ onOpenDrawer }: AiDiscoverHeaderProps) {
  return (
    <div className="ai-discover-header">
      <div className="ai-discover-header-menu" onClick={onOpenDrawer}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>
      <div className="ai-discover-header-title">发现</div>
      <div aria-hidden="true" className="ai-discover-header-spacer" />
    </div>
  )
}
