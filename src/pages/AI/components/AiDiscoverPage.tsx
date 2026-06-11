import { useEffect, useMemo, useState } from 'react'

import type { AgentCategoryKey, DiscoverAgentItem } from '../../../services/agents'
import DisplayName from '../../../components/DisplayName'
import { useDisplayNamePrefetch } from '../../IM/utils/displayNameHooks'
import { AiNameAvatar, type AiNameAvatarTone } from './AiNameAvatar'
import { AiDiscoverHeader } from './AiDiscoverHeader'

type AiDiscoverPageProps = {
  discoverLoading: boolean
  discoverError: string
  discoverSections: Array<{ key: AgentCategoryKey; title: string; items: DiscoverAgentItem[] }>
  onOpenAgentChat: (agent: DiscoverAgentItem) => void
  onOpenCreateAgent: () => void
  onOpenDrawer: () => void
}

export const AI_DISCOVER_CATEGORY_PAGE_SIZE = 5

const DISCOVER_SECTION_EMPTY_TEXT: Record<AgentCategoryKey, string> = {
  official: '暂无官方智能体',
  enterprise: '暂无企业智能体',
  collaboration: '暂无共创智能体',
  mine: '暂无我的智能体',
}

function createInitialCategoryPages(): Record<AgentCategoryKey, number> {
  return {
    official: 0,
    enterprise: 0,
    collaboration: 0,
    mine: 0,
  }
}

function formatAgentMeta(agent: DiscoverAgentItem): string {
  if (agent.publishScope === 'specified') {
    return '协作'
  }

  if (agent.tenantId === null) {
    return '官方'
  }

  return '企业'
}

function DiscoverAgentCard({
  agent,
  tone,
  onClick,
}: {
  agent: DiscoverAgentItem
  tone: AiNameAvatarTone
  onClick: () => void
}) {
  return (
    <button className="ai-discover-card" key={agent.agentId} type="button" onClick={onClick}>
      <AiNameAvatar
        ariaLabel={`${agent.agentName}头像`}
        avatarUrl={agent.avatarUrl}
        className="ai-discover-card-avatar"
        imageClassName="ai-discover-card-avatar-image"
        name={agent.agentName}
        tone={tone}
      />
      <div className="ai-discover-card-body">
        <div className="ai-discover-card-title">{agent.agentName}</div>
        <div className="ai-discover-card-desc">{agent.description || '暂无描述'}</div>
        <div className="ai-discover-card-meta">
          <DisplayName userId={agent.creatorUserId} prefix="@" />
          <span className="ai-discover-card-chats">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {formatAgentMeta(agent)}
          </span>
        </div>
      </div>
    </button>
  )
}

function getCategoryTotalPages(agents: DiscoverAgentItem[]): number {
  return Math.max(1, Math.ceil(agents.length / AI_DISCOVER_CATEGORY_PAGE_SIZE))
}

function filterDiscoverAgents(agents: DiscoverAgentItem[], keyword: string): DiscoverAgentItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return agents
  }

  return agents.filter((agent) => (
    agent.agentName.toLowerCase().includes(normalizedKeyword) ||
    agent.description.toLowerCase().includes(normalizedKeyword)
  ))
}

export function AiDiscoverPage({
  discoverLoading,
  discoverError,
  discoverSections,
  onOpenAgentChat,
  onOpenCreateAgent,
  onOpenDrawer,
}: AiDiscoverPageProps) {
  const [searchValue, setSearchValue] = useState('')
  const [categoryPages, setCategoryPages] = useState<Record<AgentCategoryKey, number>>(() => createInitialCategoryPages())
  const filteredDiscoverSections = useMemo(() => (
    discoverSections.map((section) => ({
      ...section,
      items: filterDiscoverAgents(section.items, searchValue),
    }))
  ), [discoverSections, searchValue])

  const allCreatorIds = useMemo(
    () => filteredDiscoverSections.flatMap((section) => section.items.map((agent) => agent.creatorUserId)),
    [filteredDiscoverSections],
  )
  useDisplayNamePrefetch(allCreatorIds)

  const sectionLengthSignature = useMemo(
    () => `${searchValue.trim()}|${filteredDiscoverSections.map((section) => `${section.key}:${section.items.length}`).join('|')}`,
    [filteredDiscoverSections, searchValue],
  )

  useEffect(() => {
    // 分类结果变化后统一回到第一页，避免切换到空页。
    setCategoryPages(createInitialCategoryPages())
  }, [sectionLengthSignature])

  const handlePrevPage = (categoryKey: AgentCategoryKey) => {
    setCategoryPages((current) => ({
      ...current,
      [categoryKey]: current[categoryKey] > 0 ? current[categoryKey] - 1 : 0,
    }))
  }

  const handleNextPage = (categoryKey: AgentCategoryKey, agents: DiscoverAgentItem[]) => {
    const totalPages = getCategoryTotalPages(agents)

    setCategoryPages((current) => ({
      ...current,
      [categoryKey]: current[categoryKey] < totalPages - 1 ? current[categoryKey] + 1 : totalPages - 1,
    }))
  }

  const getCurrentCategoryAgents = (agents: DiscoverAgentItem[], categoryKey: AgentCategoryKey) => {
    const start = categoryPages[categoryKey] * AI_DISCOVER_CATEGORY_PAGE_SIZE

    return agents.slice(start, start + AI_DISCOVER_CATEGORY_PAGE_SIZE)
  }

  return (
    <div className="ai-discover-page">
      <AiDiscoverHeader onOpenDrawer={onOpenDrawer} />

      <div className="ai-discover-content">
        <div className="ai-discover-actions">
          <label className="ai-discover-search" htmlFor="ai-discover-search-input">
            <span className="ai-discover-search-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </span>
            <input
              id="ai-discover-search-input"
              className="ai-discover-search-input"
              placeholder="搜索智能体"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>

          <button className="ai-discover-create-btn" type="button" onClick={onOpenCreateAgent}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            创建智能体
          </button>
        </div>

        {discoverLoading ? <div className="ai-data-status">智能体列表加载中…</div> : null}
        {!discoverLoading && discoverError ? <div className="ai-data-status">{discoverError}</div> : null}
        {!discoverLoading && !discoverError && filteredDiscoverSections.map((section) => {
          const totalPages = getCategoryTotalPages(section.items)
          const currentPage = categoryPages[section.key]
          const currentAgents = getCurrentCategoryAgents(section.items, section.key)

          return (
            <section className="ai-discover-section" key={section.key}>
              <div className="ai-discover-section-header">
                <div className="ai-discover-section-title">{section.title}</div>
                <div className="ai-discover-section-switch">
                  <button
                    aria-label={`${section.title}上一页`}
                    className="ai-discover-section-switch-btn is-emphasis"
                    disabled={currentPage === 0}
                    type="button"
                    onClick={() => handlePrevPage(section.key)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    aria-label={`${section.title}下一页`}
                    className="ai-discover-section-switch-btn is-emphasis"
                    disabled={currentPage >= totalPages - 1}
                    type="button"
                    onClick={() => handleNextPage(section.key, section.items)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="ai-discover-list">
                {currentAgents.length > 0 ? (
                  currentAgents.map((agent) => (
                    <DiscoverAgentCard
                      key={agent.agentId}
                      agent={agent}
                      tone={section.key === 'mine' ? 'white' : 'blue'}
                      onClick={() => { onOpenAgentChat(agent) }}
                    />
                  ))
                ) : (
                  <div className="ai-discover-empty-state">{DISCOVER_SECTION_EMPTY_TEXT[section.key]}</div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
