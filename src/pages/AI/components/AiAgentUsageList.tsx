import { useEffect, useState } from 'react'

import type { AgentUsageLog } from '../../../services/agents'
import { AiNameAvatar } from './AiNameAvatar'

type AiAgentUsageListProps = {
  agents: AgentUsageLog[]
  loading?: boolean
  error?: string
  removingAgentIds?: Set<string>
  onOpenAgent: (agent: AgentUsageLog) => void
  onDeleteAgent?: (agent: AgentUsageLog) => void
}

const EMPTY_REMOVING_AGENT_IDS = new Set<string>()
const AI_MOBILE_LAYOUT_MAX_WIDTH = 430

function supportsDesktopDeleteAction(): boolean {
  if (typeof document !== 'undefined') {
    const appContainer = document.querySelector<HTMLElement>('.app-container')
    const appWidth = appContainer?.clientWidth ?? 0

    if (appWidth > 0) {
      return appWidth > AI_MOBILE_LAYOUT_MAX_WIDTH
    }
  }

  if (typeof window !== 'undefined') {
    return window.innerWidth > AI_MOBILE_LAYOUT_MAX_WIDTH
  }

  return false
}

export function AiAgentUsageList({
  agents,
  loading = false,
  error = '',
  removingAgentIds = EMPTY_REMOVING_AGENT_IDS,
  onOpenAgent,
  onDeleteAgent,
}: AiAgentUsageListProps) {
  const [canDeleteUsageLog, setCanDeleteUsageLog] = useState(() => supportsDesktopDeleteAction())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncDeleteActionSupport = () => {
      setCanDeleteUsageLog(supportsDesktopDeleteAction())
    }

    const appContainer = document.querySelector<HTMLElement>('.app-container')
    let resizeObserver: ResizeObserver | null = null

    // 删除使用记录只在宽屏布局保留，H5 窄屏容器一律隐藏。
    syncDeleteActionSupport()
    window.addEventListener('resize', syncDeleteActionSupport)

    if (appContainer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        syncDeleteActionSupport()
      })
      resizeObserver.observe(appContainer)
    }

    return () => {
      window.removeEventListener('resize', syncDeleteActionSupport)
      resizeObserver?.disconnect()
    }
  }, [])

  if (loading) {
    return <div className="ai-drawer-chat-empty">正在刷新智能体…</div>
  }

  if (error) {
    return <div className="ai-drawer-chat-empty">{error}</div>
  }

  if (agents.length === 0) {
    return <div className="ai-drawer-chat-empty">还没有智能体使用记录</div>
  }

  return (
    <>
      {agents.map((agent) => {
        const isRemoving = removingAgentIds.has(agent.agentId)

        return (
          <div className={`ai-drawer-agent-row ${isRemoving ? 'is-removing' : ''}`} key={agent.agentId}>
            <button
              className="ai-drawer-agent-item"
              disabled={isRemoving}
              type="button"
              onClick={() => onOpenAgent(agent)}
            >
              <AiNameAvatar
                ariaLabel={`${agent.agentName}头像`}
                avatarUrl={agent.avatarUrl}
                className="ai-drawer-agent-avatar"
                imageClassName="ai-drawer-agent-avatar-image"
                name={agent.agentName}
                tone="white"
              />
              <span className="ai-drawer-agent-name">{agent.agentName}</span>
            </button>

            {canDeleteUsageLog ? (
              <button
                aria-label={`删除智能体使用记录 ${agent.agentName}`}
                className="ai-drawer-agent-delete"
                disabled={isRemoving}
                type="button"
                onClick={() => onDeleteAgent?.(agent)}
              >
                {isRemoving ? '删除中' : '删除'}
              </button>
            ) : null}
          </div>
        )
      })}
    </>
  )
}
