import type { CommandApiItem } from '../../../services/commands'

export type AiCommandsPageTabKey = 'best-practice' | 'recommended-prompts' | 'my-prompts'

type AiCommandsPageProps = {
  activeTab: AiCommandsPageTabKey
  bestPractices: CommandApiItem[]
  error: string
  loading: boolean
  myCommands: CommandApiItem[]
  officialCommands: CommandApiItem[]
  onApplyCommand: (command: CommandApiItem) => void
  onBack: () => void
  onTabChange: (tab: AiCommandsPageTabKey) => void
}

const COMMAND_TABS: Array<{ key: AiCommandsPageTabKey; label: string }> = [
  { key: 'best-practice', label: '最佳实践' },
  { key: 'recommended-prompts', label: '推荐指令' },
  { key: 'my-prompts', label: '我的指令' },
]

function isRemoteAsset(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//.test(value))
}

function getPromptListState(activeTab: AiCommandsPageTabKey, myCommands: CommandApiItem[], officialCommands: CommandApiItem[]) {
  if (activeTab === 'my-prompts') {
    return {
      emptyText: '暂无我的指令',
      items: myCommands,
    }
  }

  return {
    emptyText: '暂无推荐指令',
    items: officialCommands,
  }
}

function renderCommandIcon(command: CommandApiItem) {
  if (isRemoteAsset(command.icon)) {
    return <img alt={command.name} className="ai-commands-prompt-icon-image" src={command.icon} />
  }

  return <span>{command.icon || '📝'}</span>
}

export default function AiCommandsPage({
  activeTab,
  bestPractices,
  error,
  loading,
  myCommands,
  officialCommands,
  onApplyCommand,
  onBack,
  onTabChange,
}: AiCommandsPageProps) {
  const { emptyText, items } = getPromptListState(activeTab, myCommands, officialCommands)

  return (
    <div className="ai-commands-page">
      <div className="ai-commands-page-header">
        <button className="ai-commands-page-back" type="button" onClick={onBack} aria-label="返回">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="ai-commands-page-tabs">
          {COMMAND_TABS.map((tab) => (
            <button
              className={`ai-commands-page-tab ${activeTab === tab.key ? 'is-active' : ''}`}
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="ai-commands-page-header-gap" />
      </div>

      <div className="ai-commands-page-content">
        {loading ? <div className="ai-commands-page-status">内容加载中...</div> : null}
        {!loading && error ? <div className="ai-commands-page-status">{error}</div> : null}

        {!loading && !error && activeTab === 'best-practice' ? (
          bestPractices.length > 0 ? (
            <div className="ai-commands-practice-grid">
              {bestPractices.map((command) => (
                <article className="ai-commands-practice-card" key={command.id}>
                  <div className="ai-commands-practice-title">{command.name}</div>
                  <div className="ai-commands-practice-cover">
                    {command.image ? (
                      <img
                        alt={command.name}
                        className="ai-commands-practice-cover-image"
                        decoding="async"
                        loading="lazy"
                        src={command.image}
                      />
                    ) : (
                      <div className="ai-commands-practice-cover-placeholder">
                        <span>{command.icon || '📝'}</span>
                      </div>
                    )}
                  </div>
                  <button className="ai-commands-practice-action" type="button" onClick={() => onApplyCommand(command)}>
                    做同款
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="ai-commands-page-status">暂无最佳实践</div>
          )
        ) : null}

        {!loading && !error && activeTab !== 'best-practice' ? (
          items.length > 0 ? (
            <div className="ai-commands-prompt-list">
              {items.map((command) => (
                <button className="ai-commands-prompt-card" key={command.id} type="button" onClick={() => onApplyCommand(command)}>
                  <div className="ai-commands-prompt-card-head">
                    <div className="ai-commands-prompt-icon">
                      {renderCommandIcon(command)}
                    </div>
                    <div className="ai-commands-prompt-title">{command.name}</div>
                  </div>
                  <div className="ai-commands-prompt-summary">{command.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="ai-commands-page-status">{emptyText}</div>
          )
        ) : null}
      </div>
    </div>
  )
}
