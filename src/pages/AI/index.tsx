import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchCommands, mapCommandsToPromptItems, type CommandPromptItem } from '../../services/commands'
import { ensureAgentUsageLog, groupVisibleAgents, listVisibleAgents, type AgentCategoryKey, type DiscoverAgentItem } from '../../services/agents'
import type { ChatAttachment } from '../../services/chat/types'
import { getChatUserId } from '../../services/chat/api'
import { fetchKnowledgeSpaces, fetchLibraryFiles, type KnowledgeSpaceOption, type LibraryResourceFile } from '../../services/library'
import {
  buildSkillInitialPrompt,
  fetchAddedSkills,
  fetchClawhubSkills,
  fetchCreatedSkills,
  fetchOfficialSkills,
  searchClawhubSkills,
  type SkillSummaryItem,
} from '../../services/skills'
import { AiConversationThread } from './components/AiConversationThread'
import { resolveArtifactPreviewUrl, useAiChatRuntime, type ActiveAgentContext } from './hooks/useAiChatRuntime'
import { useDisplayNamePrefetch } from '../IM/utils/displayNameHooks'
import DisplayName from '../../components/DisplayName'
import './index.css'

const LUCKY_AVATAR_URL = 'https://guoren-skills-hb-test.oss-cn-beijing.aliyuncs.com/system/images/avatar/73799dbfdc2c495c8c0e1d86ffd2bf23.png'
const BRAND_NAME = 'lucky'

const fallbackFeatureCards: CommandPromptItem[] = [
  {
    icon: '🎁',
    title: '领取新人免费体验',
    summary: '礼包',
    template: '帮我介绍一下飞书 aily 的新人体验内容。',
    skillName: null,
    attachments: [],
  },
  {
    id: 'fallback-2',
    icon: '📄',
    title: '解读Harness',
    summary: 'Engineering',
    template: '请帮我解读 Harness Engineering 的核心要点。',
    skillName: null,
    attachments: [],
  },
  {
    id: 'fallback-3',
    icon: '⭐',
    title: '影视飓风同款',
    summary: '落地行动建…',
    template: '请帮我生成一套影视飓风同款的落地行动建议。',
    skillName: null,
    attachments: [],
  },
]

const featureCardColors = ['#FF8C00', '#8E8E93', '#5AC8FA', '#4A7CFF', '#33C39B', '#34C759']

function getFeatureCardColor(index: number): string {
  return featureCardColors[index % featureCardColors.length]
}

function filterSkillItems(items: SkillSummaryItem[], keyword: string): SkillSummaryItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return items
  }

  return items.filter((item) => {
    return (
      item.title.toLowerCase().includes(normalizedKeyword) ||
      item.description.toLowerCase().includes(normalizedKeyword) ||
      item.skillName.toLowerCase().includes(normalizedKeyword) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))
    )
  })
}

function mergeSkillItems(...lists: SkillSummaryItem[][]): SkillSummaryItem[] {
  const record = new Map<string, SkillSummaryItem>()

  lists.flat().forEach((item) => {
    const key = item.skillName || item.id

    if (!record.has(key)) {
      record.set(key, item)
    }
  })

  return [...record.values()]
}

function getSkillCardTags(skill: SkillSummaryItem): string[] {
  return skill.tags.slice(0, 3)
}

function getAgentAvatarLetter(name: string): string {
  const normalizedName = name.trim()
  return normalizedName ? normalizedName[0] : '智'
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

function buildAgentContext(agent: DiscoverAgentItem): ActiveAgentContext {
  return {
    agentId: agent.agentId,
    agentName: agent.agentName,
    description: agent.description,
  }
}

// 发现页智能体卡片（独立组件，内部使用 useDisplayName）
function DiscoverAgentCard({
  agent,
  onClick,
}: {
  agent: DiscoverAgentItem
  onClick: () => void
}) {
  return (
    <button className="ai-discover-card" key={agent.agentId} type="button" onClick={onClick}>
      <div
        className="ai-discover-card-avatar"
        style={agent.avatarUrl ? {
          backgroundImage: `url(${agent.avatarUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'transparent',
        } : { backgroundColor: '#4A7CFF' }}
      >
        {!agent.avatarUrl && getAgentAvatarLetter(agent.agentName)}
      </div>
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

// 发现页全屏组件
interface DiscoverPageProps {
  discoverLoading: boolean
  discoverError: string
  discoverSections: Array<{ key: AgentCategoryKey; title: string; items: DiscoverAgentItem[] }>
  onOpenAgentChat: (agent: DiscoverAgentItem) => void
  onOpenDrawer: () => void
  onClose: () => void
}

function DiscoverPage({
  discoverLoading,
  discoverError,
  discoverSections,
  onOpenAgentChat,
  onOpenDrawer,
  onClose,
}: DiscoverPageProps) {
  // 预热所有智能体创建者的 displayName 缓存
  const allCreatorIds = useMemo(
    () => discoverSections.flatMap((s) => s.items.map((a) => a.creatorUserId)),
    [discoverSections],
  )
  useDisplayNamePrefetch(allCreatorIds)

  return (
    <div className="ai-discover-page">
      <div className="ai-discover-header">
        <div className="ai-discover-header-menu" onClick={onOpenDrawer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
        <div className="ai-discover-header-title">发现</div>
        <div className="ai-discover-header-actions">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
          <div className="ai-discover-header-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>
      </div>

      <div className="ai-discover-content">
        {discoverLoading ? <div className="ai-data-status">智能体列表加载中…</div> : null}
        {!discoverLoading && discoverError ? <div className="ai-data-status">{discoverError}</div> : null}
        {!discoverLoading && !discoverError && discoverSections.every((section) => section.items.length === 0) ? (
          <div className="ai-data-status">暂无可见智能体</div>
        ) : null}
        {!discoverLoading && !discoverError && discoverSections.map((section) => (
          section.items.length > 0 ? (
            <div key={section.key}>
              <div className="ai-discover-section-title">{section.title}</div>
              <div className="ai-discover-list">
                {section.items.map((agent) => (
                  <DiscoverAgentCard
                    key={agent.agentId}
                    agent={agent}
                    onClick={() => { onOpenAgentChat(agent) }}
                  />
                ))}
              </div>
            </div>
          ) : null
        ))}
      </div>
    </div>
  )
}

function resolveLibrarySpaceName(
  spaces: KnowledgeSpaceOption[],
  selectedSpaceId: string,
): string {
  return spaces.find((item) => item.id === selectedSpaceId)?.name ?? ''
}

function getDisplayName(): string {
  try {
    const rawUserInfo = localStorage.getItem('userInfo')

    if (rawUserInfo) {
      const userInfo = JSON.parse(rawUserInfo) as Record<string, unknown>
      const displayName = userInfo.realname ?? userInfo.name ?? userInfo.username ?? userInfo.nickname

      if (displayName) {
        return String(displayName)
      }
    }
  } catch {
    // ignore
  }

  return '用户'
}

function isImageFile(url: string, filename: string): boolean {
  const target = `${filename} ${url}`.toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].some((suffix) => target.includes(suffix))
}

function renderDrawerIcon(type: string) {
  switch (type) {
    case 'new':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    case 'library':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6.5C5 5.67 5.67 5 6.5 5h2.2c.46 0 .9.21 1.19.57l1.22 1.56c.28.36.72.57 1.18.57H17.5c.83 0 1.5.67 1.5 1.5v8.3c0 .83-.67 1.5-1.5 1.5h-11c-.83 0-1.5-.67-1.5-1.5z" />
          <path d="M9 5v14" />
        </svg>
      )
    case 'skills':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
          <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
          <path d="m8.5 11.5 4 4" />
        </svg>
      )
    case 'discover':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="6.5" />
          <path d="M4 13.5c2.5-1.2 4.87-1.8 8-1.8 3.12 0 5.5.6 8 1.8" />
        </svg>
      )
    default:
      return null
  }
}

export default function AIPage({ onClose }: { onClose: () => void }) {
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showPlusSheet, setShowPlusSheet] = useState(false)
  const [showSkillsPage, setShowSkillsPage] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showLibraryPage, setShowLibraryPage] = useState(false)
  const [showSidebarLibrary, setShowSidebarLibrary] = useState(false)
  const [sidebarLibraryTab, setSidebarLibraryTab] = useState<'all' | 'starred'>('all')
  const [showDiscoverPage, setShowDiscoverPage] = useState(false)
  const [showMySkillsPage, setShowMySkillsPage] = useState(false)
  const [mySkillsTab, setMySkillsTab] = useState<'added' | 'created'>('added')
  const [showCreateSkillSheet, setShowCreateSkillSheet] = useState(false)
  const [showCreateSkillChat, setShowCreateSkillChat] = useState(false)
  const [libraryTab, setLibraryTab] = useState<'personal' | 'org'>('personal')
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([])
  const [selectedOrgSpaceId, setSelectedOrgSpaceId] = useState('')
  const [showOrgSpacePicker, setShowOrgSpacePicker] = useState(false)
  const [featureCards, setFeatureCards] = useState<CommandPromptItem[]>(fallbackFeatureCards)
  const [skillSearchValue, setSkillSearchValue] = useState('')
  const [debouncedSkillSearchValue, setDebouncedSkillSearchValue] = useState('')
  const [mySkillSearchValue, setMySkillSearchValue] = useState('')
  const [officialSkills, setOfficialSkills] = useState<SkillSummaryItem[]>([])
  const [communitySkills, setCommunitySkills] = useState<SkillSummaryItem[]>([])
  const [addedSkills, setAddedSkills] = useState<SkillSummaryItem[]>([])
  const [createdSkills, setCreatedSkills] = useState<SkillSummaryItem[]>([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [skillsError, setSkillsError] = useState('')
  const [mySkillsLoading, setMySkillsLoading] = useState(false)
  const [mySkillsError, setMySkillsError] = useState('')
  const [visibleAgents, setVisibleAgents] = useState<DiscoverAgentItem[]>([])
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState('')
  const [librarySearchValue, setLibrarySearchValue] = useState('')
  const [debouncedLibrarySearchValue, setDebouncedLibrarySearchValue] = useState('')
  const [knowledgeSpaces, setKnowledgeSpaces] = useState<KnowledgeSpaceOption[]>([])
  const [libraryFiles, setLibraryFiles] = useState<LibraryResourceFile[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState('')

  const {
    activeAgent,
    canSend,
    draftAttachments,
    inputValue,
    isLoadingSessions,
    isResponding,
    isStopping,
    messages,
    activateAgent,
    clearActiveAgent,
    openSession,
    removeDraftAttachment,
    removeSession,
    requestError,
    routeSessionId,
    selectedArtifact,
    sessions,
    setDraftAttachments,
    setActiveToolType,
    setInputValue,
    setSelectedArtifact,
    startNewChat,
    stopResponding,
    submitPrompt,
  } = useAiChatRuntime()

  const displayName = useMemo(() => getDisplayName(), [])
  const currentUserId = useMemo(() => getChatUserId(), [])
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const hasConversation = messages.length > 0 || Boolean(routeSessionId)

  const menuItems = [
    { key: 'new', label: '新建' },
    { key: 'library', label: '库' },
    { key: 'skills', label: '技能' },
    { key: 'discover', label: '发现' },
  ]

  const builtInAgent = { id: 'partner', name: '建国', avatar: '建', color: '#E8734A' }
  const groupedDiscoverAgents = useMemo(() => groupVisibleAgents(visibleAgents, currentUserId), [currentUserId, visibleAgents])
  const customAgents = groupedDiscoverAgents.mine
  const visibleCustomAgents = showMore ? customAgents : customAgents.slice(0, 6)
  const plusCardItems = [
    { key: 'file', label: '图片 / 文件' },
    { key: 'doc', label: '资料库' },
  ]
  const plusListItems = [
    { key: 'skills', label: '技能' },
    { key: 'tools', label: '工具' },
  ]
  const fileMenuItems = [
    { key: 'album', label: '照片图库', icon: 'album' },
    { key: 'camera', label: '拍照', icon: 'camera' },
    { key: 'folder', label: '选取文件', icon: 'folder' },
  ]

  const openSkillsPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setSkillSearchValue('')
    setShowSkillsPage(true)
  }

  const openLibraryPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setShowOrgSpacePicker(false)
    setLibrarySearchValue('')
    setSelectedLibraryIds([])
    setShowLibraryPage(true)
  }

  const featuredSkills = useMemo(() => filterSkillItems(officialSkills, skillSearchValue).slice(0, 3), [officialSkills, skillSearchValue])
  const visibleCommunitySkills = useMemo(() => {
    const filteredOfficial = filterSkillItems(officialSkills, skillSearchValue)
    return mergeSkillItems(filteredOfficial, communitySkills)
  }, [communitySkills, officialSkills, skillSearchValue])
  const visibleManageSkills = useMemo(() => {
    const sourceList = mySkillsTab === 'added' ? addedSkills : createdSkills
    return filterSkillItems(sourceList, mySkillSearchValue)
  }, [addedSkills, createdSkills, mySkillSearchValue, mySkillsTab])
  const discoverSections = useMemo<Array<{
    key: AgentCategoryKey
    title: string
    items: DiscoverAgentItem[]
  }>>(() => ([
    { key: 'official', title: '官方智能体', items: groupedDiscoverAgents.official },
    { key: 'enterprise', title: '企业智能体', items: groupedDiscoverAgents.enterprise },
    { key: 'collaboration', title: '协作智能体', items: groupedDiscoverAgents.collaboration },
    { key: 'mine', title: '我的智能体', items: groupedDiscoverAgents.mine },
  ]), [groupedDiscoverAgents])
  const selectedOrgSpaceName = useMemo(() => resolveLibrarySpaceName(knowledgeSpaces, selectedOrgSpaceId), [knowledgeSpaces, selectedOrgSpaceId])
  const visibleLibraryItems = libraryFiles

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const commands = await fetchCommands()

        if (cancelled) {
          return
        }

        const nextCards = mapCommandsToPromptItems(commands.best_practices)
        setFeatureCards(nextCards.length > 0 ? nextCards : fallbackFeatureCards)
      } catch (error) {
        console.warn('[ai-page] 加载最佳实践失败：', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSkillSearchValue(skillSearchValue.trim())
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [skillSearchValue])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedLibrarySearchValue(librarySearchValue.trim())
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [librarySearchValue])

  useEffect(() => {
    if (!showSkillsPage) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      setSkillsLoading(true)
      setSkillsError('')

      try {
        const [nextOfficialSkills, nextCommunitySkills] = await Promise.all([
          fetchOfficialSkills(controller.signal),
          debouncedSkillSearchValue
            ? searchClawhubSkills(debouncedSkillSearchValue, { signal: controller.signal })
            : fetchClawhubSkills({ limit: 20, signal: controller.signal }),
        ])

        setOfficialSkills(nextOfficialSkills)
        setCommunitySkills(nextCommunitySkills)
      } catch (error) {
        if (!controller.signal.aborted) {
          setSkillsError(error instanceof Error ? error.message : '技能列表加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setSkillsLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [debouncedSkillSearchValue, showSkillsPage])

  useEffect(() => {
    if (!showMySkillsPage) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      setMySkillsLoading(true)
      setMySkillsError('')

      try {
        const [nextAddedSkills, nextCreatedSkills] = await Promise.all([
          fetchAddedSkills(controller.signal),
          fetchCreatedSkills(controller.signal),
        ])

        setAddedSkills(nextAddedSkills)
        setCreatedSkills(nextCreatedSkills)
      } catch (error) {
        if (!controller.signal.aborted) {
          setMySkillsError(error instanceof Error ? error.message : '我的技能加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setMySkillsLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [showMySkillsPage])

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      setDiscoverLoading(true)
      setDiscoverError('')

      try {
        setVisibleAgents(await listVisibleAgents({ limit: 100, skip: 0, signal: controller.signal }))
      } catch (error) {
        if (!controller.signal.aborted) {
          setDiscoverError(error instanceof Error ? error.message : '智能体列表加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setDiscoverLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!showLibraryPage) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      try {
        const nextSpaces = await fetchKnowledgeSpaces(controller.signal)
        setKnowledgeSpaces(nextSpaces)

        if (!selectedOrgSpaceId && nextSpaces.length > 0) {
          setSelectedOrgSpaceId(nextSpaces[0].id)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLibraryError(error instanceof Error ? error.message : '知识空间加载失败')
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [selectedOrgSpaceId, showLibraryPage])

  useEffect(() => {
    if (!showLibraryPage) {
      return
    }

    if (libraryTab === 'org' && !selectedOrgSpaceId) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      setLibraryLoading(true)
      setLibraryError('')

      try {
        const nextFiles = await fetchLibraryFiles({
          scope: libraryTab,
          keyword: debouncedLibrarySearchValue,
          knowledgeSpaceOwnerId: libraryTab === 'org' ? selectedOrgSpaceId : undefined,
          signal: controller.signal,
        })

        setLibraryFiles(nextFiles)
        setSelectedLibraryIds((current) => current.filter((itemId) => nextFiles.some((file) => file.nodeId === itemId)))
      } catch (error) {
        if (!controller.signal.aborted) {
          setLibraryError(error instanceof Error ? error.message : '资料库文件加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLibraryLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [debouncedLibrarySearchValue, libraryTab, selectedOrgSpaceId, showLibraryPage])

  const applyFeatureCard = (card: CommandPromptItem) => {
    setInputValue(card.template)
    setActiveToolType(card.skillName)
    setDraftAttachments(card.attachments)
  }

  const applySkillItem = (skill: SkillSummaryItem) => {
    setInputValue(buildSkillInitialPrompt(skill))
    setActiveToolType(skill.skillName || null)
    setShowPlusSheet(false)
    setShowSkillsPage(false)
    setShowMySkillsPage(false)
  }

  const openAgentChat = async (agent: DiscoverAgentItem) => {
    try {
      await ensureAgentUsageLog(agent.agentId)
    } catch (error) {
      console.warn('[ai-page] 补写智能体使用记录失败：', error)
    }

    activateAgent(buildAgentContext(agent))
    startNewChat({ keepAgent: true })
    setShowDiscoverPage(false)
    setShowDrawer(false)
  }

  const addSelectedLibraryItemsToDraft = () => {
    const nextAttachments: ChatAttachment[] = visibleLibraryItems
      .filter((item) => selectedLibraryIds.includes(item.nodeId))
      .map((item) => ({
        id: `library-${item.nodeId}`,
        kind: 'resource' as const,
        name: item.fileName,
        status: 'completed' as const,
        resourceId: item.resourceId,
      }))

    if (nextAttachments.length > 0) {
      setDraftAttachments((current) => {
        const knownResourceIds = new Set(current.map((attachment) => attachment.resourceId).filter(Boolean))
        return [...current, ...nextAttachments.filter((attachment) => !knownResourceIds.has(attachment.resourceId))]
      })
    }

    setSelectedLibraryIds([])
    setShowLibraryPage(false)
  }

  const toggleLibraryItem = (id: string) => {
    setSelectedLibraryIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    )
  }

  function renderFileMenuIcon(type: string) {
    switch (type) {
      case 'album':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 15-4.5-4.5L9 18" />
          </svg>
        )
      case 'camera':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 8.5h3l1.5-2h6l1.5 2h3A1.5 1.5 0 0 1 21 10v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-7A2 2 0 0 1 4.5 8.5z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )
      case 'folder':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l1.5 2H19A1.5 1.5 0 0 1 20.5 9.5v7A1.5 1.5 0 0 1 19 18H5A1.5 1.5 0 0 1 3.5 16.5z" />
          </svg>
        )
      default:
        return null
    }
  }

  function renderLibraryFileIcon(type: string) {
    switch (type) {
      case 'pdf':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3.5h6l4 4v13A1.5 1.5 0 0 1 15.5 22h-8A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="13 3.5 13 8 17 8" />
          </svg>
        )
      case 'html':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3.5h6l4 4v13A1.5 1.5 0 0 1 16.5 22h-9A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="14 3.5 14 8 18 8" />
            <path d="m9.5 13 2-2-2-2" />
            <path d="m14.5 9-2 4" />
            <path d="m14.5 13-2 2 2 2" />
          </svg>
        )
      case 'ppt':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="6" width="15" height="12" />
            <path d="M8 18v2" />
            <path d="M16 18v2" />
            <path d="M8.5 9.5h4.5v5H8.5z" />
          </svg>
        )
      case 'doc':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3.5h6l4 4v13A1.5 1.5 0 0 1 15.5 22h-8A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="13 3.5 13 8 17 8" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="15.5" x2="15" y2="15.5" />
          </svg>
        )
      default:
        return null
    }
  }

  const sidebarLibraryItems = [
    { id: 1, name: 'rainbow-infographic-demo', source: '飞书 aily', type: 'unknown', starred: false },
    { id: 2, name: '功能清单', source: '建国', type: 'doc', starred: false },
    { id: 3, name: '功能清单', source: '建国', type: 'diamond', starred: false },
    { id: 4, name: 'personal_analysis', source: '飞书 aily', type: 'unknown', starred: false },
    { id: 5, name: '人生赛道规划.md', source: '飞书 aily', type: 'doc', starred: true },
    { id: 6, name: '个人分析报告.md', source: '飞书 aily', type: 'doc', starred: true },
    { id: 7, name: '个人信息图.html', source: '飞书 aily', type: 'html', starred: false },
    { id: 8, name: '2026年3月29日-4月4日AI行业重点资...', source: '飞书 aily', type: 'doc', starred: false },
    { id: 9, name: 'images', source: '飞书 aily', type: 'image', starred: false },
    { id: 10, name: 'feishu_aily_presentation', source: '飞书 aily', type: 'lock', starred: false },
    { id: 11, name: '水彩绘效率：飞书Aily助力技术研发工作...', source: '飞书 aily', type: 'ppt', starred: false },
    { id: 12, name: 'AI赋能职教事业部建设方案', source: '建国', type: 'doc', starred: false },
    { id: 13, name: 'AI赋能职教技术架构.png', source: '飞书 aily', type: 'image', starred: false },
  ]

  function renderSidebarLibraryFileIcon(type: string) {
    switch (type) {
      case 'doc':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3.5h6l4 4v13A1.5 1.5 0 0 1 15.5 22h-8A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="13 3.5 13 8 17 8" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="15.5" x2="15" y2="15.5" />
          </svg>
        )
      case 'html':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9.5 13-2-2 2-2" />
            <path d="m14.5 9 2 2-2 2" />
            <line x1="12" y1="15" x2="12" y2="9" />
          </svg>
        )
      case 'ppt':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="6" width="15" height="12" />
            <path d="M8 18v2" />
            <path d="M16 18v2" />
            <path d="M8.5 9.5h4v5H8.5z" />
          </svg>
        )
      case 'image':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 15-4.5-4.5L9 18" />
          </svg>
        )
      case 'diamond':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.5l8.5 8.5-8.5 8.5L3.5 11z" />
          </svg>
        )
      case 'lock':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        )
      case 'unknown':
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        )
    }
  }

  function getSidebarFileIconBg(type: string) {
    switch (type) {
      case 'doc': return '#4A7CFF'
      case 'html': return '#8c8f96'
      case 'ppt': return '#FF8A34'
      case 'image': return '#FF8A34'
      case 'diamond': return '#7B49F1'
      case 'lock': return '#8c8f96'
      default: return '#c4c7cc'
    }
  }

  return (
    <div className="ai-page">
      {/* 背景 */}
      <div className="ai-page-bg" />

      {/* 顶部导航 */}
      <div className="ai-page-header">
        <div className="ai-page-menu" onClick={() => setShowDrawer(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
        <div className="ai-page-header-right">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
          <div className="ai-page-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>
      </div>

      {!hasConversation ? (
        <>
          <div className="ai-page-welcome">
            <h1>Hi <DisplayName userId={currentUserId} fallback={displayName} />，有什么可以帮你的？</h1>
            <div className="ai-page-practice-header">
              <span className="ai-page-practice-title">全部最佳实践</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div className="ai-page-cards">
            {featureCards.map((card, index) => (
              <button className="ai-card" key={card.id} type="button" onClick={() => applyFeatureCard(card)}>
                <div className="ai-card-icon" style={{ background: getFeatureCardColor(index) }}>{card.icon}</div>
                <div className="ai-card-text">
                  <span className="ai-card-label1">{card.title}</span>
                  <span className="ai-card-label2">{card.summary}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <AiConversationThread
          messages={messages}
          onSelectArtifact={setSelectedArtifact}
          routeSessionId={routeSessionId}
          scrollRef={scrollerRef}
        />
      )}

      {/* 底部输入区 */}
      <div className="ai-page-bottom">
        {requestError && (
          <div className="ai-page-error-banner">{requestError}</div>
        )}
        {activeAgent && (
          <button className="ai-page-active-agent-chip" type="button" onClick={clearActiveAgent}>
            <span className="ai-page-active-agent-label">当前智能体</span>
            <span className="ai-page-active-agent-name">{activeAgent.agentName}</span>
            <span className="ai-page-active-agent-remove">关闭</span>
          </button>
        )}
        {draftAttachments.length > 0 && (
          <div className="ai-page-draft-attachments">
            {draftAttachments.map((attachment) => (
              <button
                className="ai-page-draft-chip"
                key={attachment.id}
                type="button"
                onClick={() => removeDraftAttachment(attachment.id)}
              >
                <span className="ai-page-draft-chip-name">{attachment.name}</span>
                <span className="ai-page-draft-chip-status">
                  {attachment.kind === 'resource' ? '资料库' : attachment.status}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="ai-input-bar">
          <div className="ai-input-plus" onClick={() => { setShowFileMenu(false); setShowPlusSheet(true) }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <input
            className="ai-input-field"
            placeholder="提个问题，或让我创作、分析任意内容"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()

                if (isResponding) {
                  void stopResponding()
                } else if (canSend) {
                  void submitPrompt()
                }
              }
            }}
          />
          <button
            className="ai-input-mic"
            type="button"
            disabled={Boolean((!canSend && !isResponding) || isStopping)}
            onClick={() => {
              if (isResponding) {
                void stopResponding()
                return
              }

              if (canSend) {
                void submitPrompt()
              }
            }}
          >
            {isResponding ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="7" width="10" height="10" rx="1.5" />
              </svg>
            ) : inputValue.trim() ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="12" y2="5" />
                <line x1="12" y1="5" x2="19" y2="12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>
        <p className="ai-page-disclaimer">使用国内合规模型并严格遵循权限隔离，保障企业数据安全</p>
      </div>

      {showDrawer && (
        <div className="ai-drawer-overlay" onClick={() => setShowDrawer(false)}>

          <div className="ai-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ai-drawer-body">
              <div className="ai-drawer-profile">
                <img
                  alt={BRAND_NAME}
                  className="ai-drawer-profile-avatar"
                  src={LUCKY_AVATAR_URL}
                />
                <div className="ai-drawer-profile-name">{BRAND_NAME}</div>
              </div>

              <div className="ai-drawer-menu">
                {menuItems.map((item) => (
                  <div className={`ai-drawer-menu-item ${(item.key === 'library' && showSidebarLibrary) || (item.key === 'new' && !showSidebarLibrary && !showDiscoverPage && !showSkillsPage) || (item.key === 'discover' && showDiscoverPage) || (item.key === 'skills' && showSkillsPage) ? 'is-highlighted' : ''}`} key={item.key} onClick={() => {
                    if (item.key === 'library') {
                      setShowSidebarLibrary(true)
                      setShowDiscoverPage(false)
                      setShowSkillsPage(false)
                      setShowDrawer(false)
                    }
                    if (item.key === 'new') {
                      startNewChat()
                      setShowSidebarLibrary(false)
                      setShowDiscoverPage(false)
                      setShowSkillsPage(false)
                      setShowDrawer(false)
                    }
                    if (item.key === 'discover') {
                      setShowDiscoverPage(true)
                      setShowSidebarLibrary(false)
                      setShowSkillsPage(false)
                      setShowDrawer(false)
                    }
                    if (item.key === 'skills') {
                      setShowSkillsPage(true)
                      setShowSidebarLibrary(false)
                      setShowDiscoverPage(false)
                      setShowDrawer(false)
                    }
                  }}>
                    <span className="ai-drawer-menu-icon">{renderDrawerIcon(item.key)}</span>
                    <span className="ai-drawer-menu-label">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="ai-drawer-section">
                <div className="ai-drawer-section-title">智能伙伴</div>
                <div className="ai-drawer-agent-item">
                  <div className="ai-drawer-agent-avatar" style={{ background: builtInAgent.color }}>
                    {builtInAgent.avatar}
                  </div>
                  <span className="ai-drawer-agent-name">{builtInAgent.name}</span>
                </div>
              </div>

              <div className="ai-drawer-section">
                <div className="ai-drawer-section-title">自定义智能体</div>
                {visibleCustomAgents.map((agent) => (
                  <button
                    className="ai-drawer-agent-item"
                    key={agent.agentId}
                    type="button"
                    onClick={() => { void openAgentChat(agent) }}
                  >
                    <div
                      className="ai-drawer-agent-avatar"
                      style={agent.avatarUrl ? {
                        backgroundImage: `url(${agent.avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: 'transparent',
                      } : { backgroundColor: '#4A7CFF' }}
                    >
                      {!agent.avatarUrl && getAgentAvatarLetter(agent.agentName)}
                    </div>
                    <span className="ai-drawer-agent-name">{agent.agentName}</span>
                  </button>
                ))}

                {!showMore && customAgents.length > visibleCustomAgents.length && (
                  <button className="ai-drawer-more" type="button" onClick={() => setShowMore(true)}>
                    更多
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 会话历史记录 */}
              <div className="ai-drawer-section">
                <div className="ai-drawer-section-title">最近对话</div>
                {isLoadingSessions ? (
                  <div className="ai-drawer-chat-empty">正在刷新会话…</div>
                ) : sessions.length === 0 ? (
                  <div className="ai-drawer-chat-empty">还没有历史会话</div>
                ) : (
                  sessions.map((session) => (
                    <button
                      className={`ai-drawer-chat-item ${routeSessionId === session.session_id ? 'is-active' : ''}`}
                      key={session.session_id}
                      type="button"
                      onClick={() => {
                        openSession(session.session_id)
                        setShowDrawer(false)
                      }}
                    >
                      <div className="ai-drawer-chat-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <span className="ai-drawer-chat-title">{session.session_name?.trim() || '话题'}</span>
                      <span
                        className="ai-drawer-chat-delete"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void removeSession(session.session_id)
                        }}
                      >
                        删除
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="ai-drawer-footer">
              <div className="ai-drawer-footer-divider">- -</div>
              <div className="ai-drawer-quota">
                <div className="ai-drawer-quota-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3 1.7 4.7L18 9.4l-3.5 3 1.1 4.6L12 14.8 8.4 17l1.1-4.6L6 9.4l4.3-1.7z" />
                  </svg>
                  <span>可用额度：781</span>
                </div>
                <span className="ai-drawer-quota-action">续费</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPlusSheet && (
        <div className="ai-plus-sheet-overlay" onClick={() => { setShowFileMenu(false); setShowPlusSheet(false) }}>
          <div className="ai-plus-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ai-plus-sheet-handle" />

            <div className="ai-plus-sheet-grid">
              {showFileMenu && (
                <div className="ai-file-menu">
                  {fileMenuItems.map((item) => (
                    <button className="ai-file-menu-item" key={item.key} type="button">
                      <span className="ai-file-menu-label">{item.label}</span>
                      <span className="ai-file-menu-icon">{renderFileMenuIcon(item.icon)}</span>
                    </button>
                  ))}
                </div>
              )}
              {plusCardItems.map((item) => (
                <button
                  className="ai-plus-sheet-card"
                  key={item.key}
                  type="button"
                  onClick={
                    item.key === 'file'
                      ? () => setShowFileMenu((value) => !value)
                      : openLibraryPage
                  }
                >
                  <span className="ai-plus-sheet-card-icon">
                    {item.key === 'file' ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 3 14 8 19 8" />
                        <path d="M12 11v6" />
                        <path d="M9 14h6" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 4.5h8.5L19 8v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1.5-1.5z" />
                        <polyline points="15.5 4.5 15.5 8 19 8" />
                        <line x1="9" y1="12" x2="15" y2="12" />
                        <line x1="9" y1="15.5" x2="15" y2="15.5" />
                      </svg>
                    )}
                  </span>
                  <span className="ai-plus-sheet-card-label">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="ai-plus-sheet-list">
              {plusListItems.map((item) => (
                <button
                  className="ai-plus-sheet-row"
                  key={item.key}
                  type="button"
                  onClick={item.key === 'skills' ? openSkillsPage : () => setShowFileMenu(false)}
                >
                  <span className="ai-plus-sheet-row-left">
                    <span className="ai-plus-sheet-row-icon">
                      {item.key === 'skills' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                          <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                          <path d="m8.5 11.5 4 4" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="6" cy="18" r="2" />
                          <circle cx="18" cy="18" r="2" />
                          <circle cx="12" cy="7" r="2" />
                          <path d="M8 17l2.6-7.2" />
                          <path d="M16 17l-2.6-7.2" />
                          <path d="M8 18h8" />
                        </svg>
                      )}
                    </span>
                    <span className="ai-plus-sheet-row-label">{item.label}</span>
                  </span>
                  <span className="ai-plus-sheet-row-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSkillsPage && (
        <div className="ai-skill-community-page">
          {/* Header */}
          <div className="ai-skill-community-header">
            <div className="ai-skill-community-menu" onClick={() => setShowDrawer(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-skill-community-title">技能社区</div>
            <div className="ai-skill-community-actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" onClick={() => setShowCreateSkillSheet(true)} style={{ cursor: 'pointer' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onClick={() => setShowMySkillsPage(true)} style={{ cursor: 'pointer' }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.54 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.54 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.54a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 15 4.54a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>

          <div className="ai-skill-community-content">
            <div className="ai-skill-community-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="ai-inline-search-input"
                placeholder="搜索技能名称、描述或标签"
                value={skillSearchValue}
                onChange={(event) => setSkillSearchValue(event.target.value)}
              />
            </div>

            <div className="ai-skill-community-banner">
              <div className="ai-skill-community-banner-content">
                <div className="ai-skill-community-banner-title">
                  <span className="ai-skill-community-banner-highlight">你的技能</span>值得被更多人复用
                </div>
                <div className="ai-skill-community-banner-desc">将沉淀的的工作技能，直接发布到aily SkillHub，让好技能不被埋没</div>
                <div className="ai-skill-community-banner-link">了解详情 &gt;</div>
              </div>
              <div className="ai-skill-community-banner-img">
                <div className="ai-skill-community-banner-card">Skill</div>
              </div>
            </div>

            <div className="ai-skill-community-section-header">
              <div className="ai-skill-community-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16l-2 10H6z" />
                  <path d="m9 12 2.2 2.2L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                官方精选
              </div>
              <button className="ai-skill-community-refresh" type="button" onClick={() => setSkillSearchValue('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6" />
                  <path d="M2.5 12a9.5 9.5 0 0 1 16.5-6.5L21.5 8" />
                  <path d="M2.5 22v-6h6" />
                  <path d="M21.5 12a9.5 9.5 0 0 1-16.5 6.5L2.5 16" />
                </svg>
                换一换
              </button>
            </div>

            <div className="ai-skill-community-cards">
              {skillsLoading ? <div className="ai-data-status">技能加载中…</div> : null}
              {!skillsLoading && skillsError ? <div className="ai-data-status">{skillsError}</div> : null}
              {!skillsLoading && !skillsError && featuredSkills.length === 0 ? <div className="ai-data-status">暂无精选技能</div> : null}
              {!skillsLoading && !skillsError && featuredSkills.map((skill, index) => (
                <button className="ai-skill-community-card" key={skill.id} type="button" onClick={() => applySkillItem(skill)}>
                  <div className="ai-skill-community-card-header">
                    <div className="ai-skill-community-card-icon" style={{ background: getFeatureCardColor(index) }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                        <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                        <path d="m8.5 11.5 4 4" />
                      </svg>
                    </div>
                    <div className="ai-skill-community-card-title">{skill.title}</div>
                  </div>
                  <div className="ai-skill-community-card-desc">{skill.description || '暂无描述'}</div>
                  <div className="ai-skill-community-card-footer">
                    <div className="ai-skill-community-card-tags">
                      {getSkillCardTags(skill).map((tag) => (
                        <span className="ai-skill-community-card-tag" key={tag}>{tag}</span>
                      ))}
                    </div>
                    <span className="ai-skill-community-card-count">{skill.countLabel || skill.source}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="ai-skill-community-all-skills">
              <div className="ai-skill-community-all-skills-header">
                <div className="ai-skill-community-all-skills-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                    <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                    <path d="m8.5 11.5 4 4" />
                  </svg>
                  全部技能
                </div>
                <div className="ai-skill-community-filter">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.46z" />
                  </svg>
                  {debouncedSkillSearchValue ? '搜索结果' : '全部列表'}
                </div>
              </div>
              <div className="ai-skill-community-all-list">
                {!skillsLoading && !skillsError && visibleCommunitySkills.length === 0 ? <div className="ai-data-status">暂无技能数据</div> : null}
                {!skillsLoading && !skillsError && visibleCommunitySkills.map((skill, index) => (
                  <button className="ai-skill-community-all-item" key={skill.id} type="button" onClick={() => applySkillItem(skill)}>
                    <div className="ai-skill-community-all-icon" style={{ background: getFeatureCardColor(index) }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                        <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                        <path d="m8.5 11.5 4 4" />
                      </svg>
                    </div>
                    <div className="ai-skill-community-all-body">
                      <div className="ai-skill-community-all-title-row">
                        <span className="ai-skill-community-all-title">{skill.title}</span>
                        <div className="ai-skill-community-all-tags">
                          {getSkillCardTags(skill).map((tag) => (
                            <span className="ai-skill-community-all-tag" key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="ai-skill-community-all-desc">{skill.description || '暂无描述'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 创建技能底部弹层 */}
          {showCreateSkillSheet && (
            <div className="ai-skill-create-sheet-overlay" onClick={() => setShowCreateSkillSheet(false)}>
              <div className="ai-skill-create-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="ai-skill-create-sheet-handle" />
                <div className="ai-skill-create-sheet-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                    <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                    <path d="m8.5 11.5 4 4" />
                  </svg>
                </div>
                <div className="ai-skill-create-sheet-title">使用对话创建</div>
                <div className="ai-skill-create-sheet-desc">通过对话构建个人使用的技能</div>
                <button className="ai-skill-create-sheet-btn" type="button" onClick={() => { setShowCreateSkillSheet(false); setShowCreateSkillChat(true) }}>去创建</button>
                <div className="ai-skill-create-sheet-tip">如需上传本地文件，请前往电脑端操作</div>
              </div>
            </div>
          )}
        </div>
      )}

      {showLibraryPage && (
        <div className="ai-library-page">
          <div className="ai-library-header">
            <div className="ai-library-title">选择资料</div>
            <button className="ai-library-close" type="button" onClick={() => setShowLibraryPage(false)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="ai-library-tabs">
            <button
              className={`ai-library-tab ${libraryTab === 'personal' ? 'is-active' : ''}`}
              type="button"
              onClick={() => {
                setLibraryTab('personal')
                setShowOrgSpacePicker(false)
              }}
            >
              个人资料库
            </button>
            <button
              className={`ai-library-tab ${libraryTab === 'org' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setLibraryTab('org')}
            >
              组织资料库
            </button>
          </div>

          {libraryTab === 'org' && (
            <button className="ai-library-space-trigger" type="button" onClick={() => setShowOrgSpacePicker(true)}>
              <span className="ai-library-space-label">当前空间</span>
              <span className="ai-library-space-value">{selectedOrgSpaceName || '请选择知识空间'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          <div className="ai-library-toolbar">
            <div className="ai-library-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="ai-inline-search-input"
                placeholder="搜索文件名"
                value={librarySearchValue}
                onChange={(event) => setLibrarySearchValue(event.target.value)}
              />
            </div>
            <div className="ai-library-selected">已选 {selectedLibraryIds.length}</div>
          </div>

          <div className="ai-library-list">
            {libraryLoading ? <div className="ai-data-status">资料库加载中…</div> : null}
            {!libraryLoading && libraryError ? <div className="ai-data-status">{libraryError}</div> : null}
            {!libraryLoading && !libraryError && visibleLibraryItems.length === 0 ? <div className="ai-data-status">暂无可引用文件</div> : null}
            {visibleLibraryItems.map((item) => {
              const checked = selectedLibraryIds.includes(item.nodeId)
              return (
                <button className="ai-library-item" key={item.nodeId} type="button" onClick={() => toggleLibraryItem(item.nodeId)}>
                  <span className={`ai-library-checkbox ${checked ? 'is-checked' : ''}`}>
                    {checked && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className={`ai-library-file-icon type-${item.fileType}`}>{renderLibraryFileIcon(item.fileType)}</span>
                  <span className="ai-library-item-content">
                    <span className="ai-library-item-name">{item.fileName}</span>
                    <span className="ai-library-item-meta">
                      <span>{item.createBy || '未知来源'}</span>
                      <span>{item.createTime || '-'}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="ai-library-footer">
            <button className="ai-library-footer-btn" type="button" onClick={() => setShowLibraryPage(false)}>取消</button>
            <button
              className="ai-library-footer-btn is-primary"
              disabled={selectedLibraryIds.length === 0}
              type="button"
              onClick={addSelectedLibraryItemsToDraft}
            >
              添加
            </button>
          </div>

          {showOrgSpacePicker && (
            <div className="ai-library-space-overlay" onClick={() => setShowOrgSpacePicker(false)}>
              <div className="ai-library-space-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="ai-library-space-sheet-handle" />
                <div className="ai-library-space-sheet-title">选择空间</div>
                <div className="ai-library-space-list">
                  {knowledgeSpaces.map((space) => (
                    <button
                      className={`ai-library-space-item ${selectedOrgSpaceId === space.id ? 'is-active' : ''}`}
                      key={space.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrgSpaceId(space.id)
                        setShowOrgSpacePicker(false)
                      }}
                    >
                      <span>{space.name}</span>
                      {selectedOrgSpaceId === space.id && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* 侧边栏库全屏页 */}
      {showSidebarLibrary && (
        <div className="ai-sidebar-library-page">
          <div className="ai-sidebar-library-header">
            <div className="ai-sidebar-library-menu" onClick={() => setShowDrawer(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-sidebar-library-tabs">
              <button
                className={`ai-sidebar-library-tab ${sidebarLibraryTab === 'all' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSidebarLibraryTab('all')}
              >
                全部产物
              </button>
              <button
                className={`ai-sidebar-library-tab ${sidebarLibraryTab === 'starred' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSidebarLibraryTab('starred')}
              >
                收藏夹
              </button>
            </div>
            <div className="ai-sidebar-library-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <div className="ai-sidebar-library-list">
            {sidebarLibraryItems
              .filter((item) => (sidebarLibraryTab === 'starred' ? item.starred : true))
              .map((item) => (
                <div className="ai-sidebar-library-item" key={item.id}>
                  <div
                    className="ai-sidebar-library-item-icon"
                    style={{ background: getSidebarFileIconBg(item.type) }}
                  >
                    {renderSidebarLibraryFileIcon(item.type)}
                  </div>
                  <div className="ai-sidebar-library-item-body">
                    <div className="ai-sidebar-library-item-name">{item.name}</div>
                    <div className="ai-sidebar-library-item-source">{item.source}</div>
                  </div>
                  <div className="ai-sidebar-library-item-more">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 发现全屏页 */}
      {showDiscoverPage && (
        <DiscoverPage
          discoverLoading={discoverLoading}
          discoverError={discoverError}
          discoverSections={discoverSections}
          onOpenAgentChat={openAgentChat}
          onOpenDrawer={() => setShowDrawer(true)}
          onClose={() => setShowDiscoverPage(false)}
        />
      )}

      {/* 我的技能页 */}
      {showMySkillsPage && (
        <div className="ai-my-skills-page">
          <div className="ai-my-skills-header">
            <div className="ai-my-skills-back" onClick={() => setShowMySkillsPage(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div className="ai-my-skills-tabs">
              <button
                className={`ai-my-skills-tab ${mySkillsTab === 'added' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setMySkillsTab('added')}
              >
                我添加的
              </button>
              <button
                className={`ai-my-skills-tab ${mySkillsTab === 'created' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setMySkillsTab('created')}
              >
                我创建的
              </button>
            </div>
            <div className="ai-my-skills-actions">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 3H2l8 9.46V19l4 2v-8.46z" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.54 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.54 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.54a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 15 4.54a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>

          <div className="ai-my-skills-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="ai-inline-search-input"
              placeholder="搜索"
              value={mySkillSearchValue}
              onChange={(event) => setMySkillSearchValue(event.target.value)}
            />
          </div>

          <div className="ai-my-skills-list">
            {mySkillsLoading ? <div className="ai-data-status">我的技能加载中…</div> : null}
            {!mySkillsLoading && mySkillsError ? <div className="ai-data-status">{mySkillsError}</div> : null}
            {!mySkillsLoading && !mySkillsError && visibleManageSkills.length === 0 ? <div className="ai-data-status">暂无技能数据</div> : null}
            {!mySkillsLoading && !mySkillsError && visibleManageSkills.map((skill, index) => (
              <div className="ai-my-skill-card" key={skill.id}>
                <div className="ai-my-skill-card-header">
                  <div className="ai-my-skill-card-icon" style={{ background: getFeatureCardColor(index) }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                      <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                      <path d="m8.5 11.5 4 4" />
                    </svg>
                  </div>
                  <div className="ai-my-skill-card-title">{skill.title}</div>
                  <span className="ai-my-skill-card-badge">{skill.source === 'created' ? '我创建的' : '已添加'}</span>
                  <div className="ai-my-skill-card-more">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </div>
                </div>
                <div className="ai-my-skill-card-desc">{skill.description || '暂无描述'}</div>
                <div className="ai-my-skill-card-meta">
                  <div className="ai-my-skill-card-avatars">
                    <div className="ai-my-skill-card-avatar" style={{ background: '#E8734A' }}>{skill.title.slice(0, 1) || '技'}</div>
                    <div className="ai-my-skill-card-avatar" style={{ background: '#7A95FF', marginLeft: '-6px' }}>{(skill.skillName || skill.title).slice(0, 1) || '能'}</div>
                  </div>
                  <span>{skill.skillName ? `技能标识 ${skill.skillName}` : '未设置 skill_name'}</span>
                </div>
                <button className="ai-my-skill-card-btn" type="button" onClick={() => applySkillItem(skill)}>立即使用</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 创建技能对话页 */}
      {showCreateSkillChat && (
        <div className="ai-create-skill-chat-page">
          <div className="ai-create-skill-chat-header">
            <div className="ai-create-skill-chat-menu" onClick={() => setShowDrawer(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-create-skill-chat-actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
              <div className="ai-create-skill-chat-close" onClick={() => setShowCreateSkillChat(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </div>

          <div className="ai-create-skill-chat-content">
            <div className="ai-create-skill-chat-welcome">
              <h1>Hi <DisplayName userId={currentUserId} fallback={displayName} />，有什么可以帮你的？</h1>
              <div className="ai-create-skill-chat-practice">
                <span>全部最佳实践</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div className="ai-create-skill-chat-cards">
              <div className="ai-create-skill-chat-card">
                <div className="ai-create-skill-chat-card-icon" style={{ background: '#FF8C00' }}>🎁</div>
                <div className="ai-create-skill-chat-card-text">
                  <span>领取新人免费体验礼包</span>
                </div>
              </div>
              <div className="ai-create-skill-chat-card">
                <div className="ai-create-skill-chat-card-icon" style={{ background: '#8E8E93' }}>📄</div>
                <div className="ai-create-skill-chat-text">
                  <span>解读Harness</span>
                  <span>Engineering</span>
                </div>
              </div>
              <div className="ai-create-skill-chat-card">
                <div className="ai-create-skill-chat-card-icon" style={{ background: '#5AC8FA' }}>⭐</div>
                <div className="ai-create-skill-chat-text">
                  <span>影视飓风同款</span>
                  <span>落地行动建…</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-create-skill-chat-bottom">
            <div className="ai-create-skill-chat-actions">
              <div className="ai-create-skill-chat-action">创建图片 PPT</div>
              <div className="ai-create-skill-chat-action">创建网页 PPT</div>
              <div className="ai-create-skill-chat-action">写云文档</div>
              <div className="ai-create-skill-chat-action">…</div>
            </div>
            <div className="ai-create-skill-chat-input-bar">
              <div className="ai-create-skill-chat-plus">+</div>
              <div className="ai-create-skill-chat-input-field">
                帮我使用 <span className="ai-create-skill-chat-highlight">AI 生成技能</span> 创建一个技能。请先问我这个技能可以做什么。
              </div>
              <div className="ai-create-skill-chat-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <line x1="5" y1="12" x2="12" y2="5" />
                  <line x1="12" y1="5" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            <p className="ai-create-skill-chat-disclaimer">使用国内合规模型并严格遵循权限隔离，保障企业数据安全</p>
          </div>
        </div>
      )}

      {selectedArtifact && (
        <div className="ai-artifact-overlay" onClick={() => setSelectedArtifact(null)}>
          <section className="ai-artifact-panel" onClick={(event) => event.stopPropagation()}>
            <div className="ai-artifact-panel-head">
              <div>
                <div className="ai-artifact-panel-title">{selectedArtifact.artifact.filename}</div>
                <div className="ai-artifact-panel-subtitle">{selectedArtifact.artifact.type}</div>
              </div>
              <button className="ai-artifact-close" type="button" onClick={() => setSelectedArtifact(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="ai-artifact-panel-body">
              {isImageFile(selectedArtifact.artifact.url, selectedArtifact.artifact.filename) ? (
                <img
                  alt={selectedArtifact.artifact.filename}
                  className="ai-artifact-image"
                  src={resolveArtifactPreviewUrl(selectedArtifact.sessionId, selectedArtifact.artifact)}
                />
              ) : (
                <iframe
                  className="ai-artifact-frame"
                  src={resolveArtifactPreviewUrl(selectedArtifact.sessionId, selectedArtifact.artifact)}
                  title={selectedArtifact.artifact.filename}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
