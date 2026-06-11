export type LibraryScopeTabKey = 'personal' | 'org'

const LIBRARY_SCOPE_OPTIONS: Array<{ key: LibraryScopeTabKey; label: string }> = [
  { key: 'personal', label: '个人' },
  { key: 'org', label: '组织' },
]

export default function LibraryScopeTabs({
  activeScope,
  ariaLabel = '资料库范围',
  onScopeChange,
}: {
  activeScope: LibraryScopeTabKey
  ariaLabel?: string
  onScopeChange: (scope: LibraryScopeTabKey) => void
}) {
  return (
    <div className="library-scope-switch" role="tablist" aria-label={ariaLabel}>
      {LIBRARY_SCOPE_OPTIONS.map((option) => {
        const isActive = option.key === activeScope

        return (
          <button
            key={option.key}
            aria-selected={isActive}
            className={`library-scope-btn ${isActive ? 'is-active' : ''}`}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onScopeChange(option.key)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
