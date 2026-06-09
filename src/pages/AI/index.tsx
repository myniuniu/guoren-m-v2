import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dialog, Switch } from 'antd-mobile'
import { GlobalOutline, SetOutline } from 'antd-mobile-icons'
import { fetchCommands, mapCommandsToPromptItems, type CommandApiItem, type CommandPromptItem, type CommandsData } from '../../services/commands'
import {
  deleteAgentUsageLog,
  ensureAgentUsageLog,
  getAgentUsageLogs,
  groupVisibleAgents,
  listVisibleAgents,
  type AgentCategoryKey,
  type AgentUsageLog,
  type DiscoverAgentItem,
} from '../../services/agents'
import {
  ALLOWED_CHAT_UPLOAD_EXTENSIONS,
  createPendingChatAttachment,
  isAllowedChatUploadFile,
  uploadPendingChatFile,
} from '../../services/chat/upload'
import { groupChatSessionsByTime } from '../../services/chat/session'
import type { ChatAttachment, ChatSession } from '../../services/chat/types'
import { getChatUserId } from '../../services/chat/api'
import {
  AI_COURSE_REVIEW_SKILL_NAME,
  parseCourseReviewTaskId,
} from '../../services/courseReview'
import {
  fetchKnowledgeSpaces,
  fetchLibraryFiles,
  type KnowledgeSpaceOption,
  type LibraryFileDetail,
  type LibraryPageFileItem,
  type LibraryPageFileType,
  type LibraryResourceFile,
} from '../../services/library'
import {
  fetchPartnerConfig,
  uploadPartnerAvatar,
  updatePartnerConfig,
  type PartnerConfig,
  type PartnerConfigUpdateField,
} from '../../services/partner'
import {
  buildSkillDisplayName,
  buildSkillInitialPrompt,
  fetchAddedSkills,
  fetchClawhubSkills,
  fetchCreatedSkills,
  fetchUserSkills,
  mergeSkillSummaryItems,
  fetchOfficialSkills,
  searchClawhubSkills,
  type SkillSummaryItem,
} from '../../services/skills'
import { AiConversationThread } from './components/AiConversationThread'
import AiCommandsPage, { type AiCommandsPageTabKey } from './components/AiCommandsPage'
import AiLibraryFilePreview from './components/AiLibraryFilePreview'
import AiSidebarLibraryPage from './components/AiSidebarLibraryPage'
import { resolveArtifactPreviewUrl, useAiChatRuntime, type ActiveAgentContext } from './hooks/useAiChatRuntime'
import { useDisplayNamePrefetch } from '../IM/utils/displayNameHooks'
import AppComposerInput from '../../components/AppComposerInput'
import DisplayName from '../../components/DisplayName'
import { APP_ROUTE_PATHS } from '../../routes'
import '../Library/index.css'
import './index.css'

const LUCKY_AVATAR_URL = 'https://guoren-skills-hb-test.oss-cn-beijing.aliyuncs.com/system/images/avatar/73799dbfdc2c495c8c0e1d86ffd2bf23.png'
const BRAND_NAME = 'lucky'
const MAX_CHAT_UPLOAD_FILES = 5

const fallbackFeatureCards: CommandPromptItem[] = [
  {
    id: 'fallback-1',
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

const EMPTY_COMMANDS_DATA: CommandsData = {
  official_commands: [],
  best_practices: [],
  my_commands: [],
}

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

function formatLibraryPickerDateTime(value: string): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/\//g, '-')
}

function resolveLibraryPickerBadge(file: LibraryResourceFile): { bg: string; label: string } {
  const normalizedExt = file.fileExt.toLowerCase() || file.fileName.split('.').pop()?.toLowerCase() || ''

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(normalizedExt)) {
    return { bg: '#FF8A34', label: 'IMG' }
  }

  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'].includes(normalizedExt)) {
    return { bg: '#8D5BFF', label: 'VID' }
  }

  if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(normalizedExt)) {
    return { bg: '#25B864', label: 'AUD' }
  }

  if (['ppt', 'pptx', 'key'].includes(normalizedExt)) {
    return { bg: '#FF8A34', label: 'PPT' }
  }

  if (normalizedExt === 'pdf') {
    return { bg: '#4A7CFF', label: 'PDF' }
  }

  if (normalizedExt === 'html' || normalizedExt === 'htm') {
    return { bg: '#8c8f96', label: 'HTML' }
  }

  return { bg: '#4A7CFF', label: 'DOC' }
}

function renderLibraryPickerFileBadge(file: LibraryResourceFile) {
  const { bg, label } = resolveLibraryPickerBadge(file)

  return (
    <div className="library-file-icon" style={{ background: bg }}>
      {label}
    </div>
  )
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

type PartnerSettingsPage = 'menu' | 'basic' | 'workspace'
type PartnerWorkspaceFileKey = 'SOUL.md' | 'USER.md' | 'IDENTITY.md'

function isCourseReviewPreviewArtifact(artifact: { type: string; skill_name?: string; url: string }): boolean {
  return artifact.type === 'review' || artifact.skill_name === AI_COURSE_REVIEW_SKILL_NAME || Boolean(parseCourseReviewTaskId(artifact.url))
}

function normalizeArtifactPreviewFileType(artifact: { type: string; skill_name?: string; url: string; filename: string }): Exclude<LibraryPageFileType, 'all'> {
  if (artifact.type === 'classroom') {
    return 'classroom'
  }

  if (isCourseReviewPreviewArtifact(artifact)) {
    return 'review'
  }

  if (artifact.type === 'image' || isImageFile(artifact.url, artifact.filename)) {
    return 'image'
  }

  if (artifact.type === 'video') {
    return 'video'
  }

  if (artifact.type === 'audio') {
    return 'audio'
  }

  if (artifact.type === 'whiteboard') {
    return 'whiteboard'
  }

  return 'document'
}

function buildArtifactPreviewEntry(
  selectedArtifact: {
    sessionId: string | null
    createdAt: string
    artifact: {
      type: string
      filename: string
      url: string
      size?: number
      skill_name?: string
    }
  } | null,
): { item: LibraryPageFileItem; detail: LibraryFileDetail } | null {
  if (!selectedArtifact) {
    return null
  }

  const { artifact, sessionId, createdAt } = selectedArtifact
  const fileType = normalizeArtifactPreviewFileType(artifact)
  const previewUrl = artifact.url.startsWith('http')
    ? artifact.url
    : (sessionId ? resolveArtifactPreviewUrl(sessionId, artifact) : '')
  const item: LibraryPageFileItem = {
    fileId: `artifact:${sessionId ?? 'local'}:${artifact.filename}:${artifact.url}`,
    fileName: artifact.filename,
    agentName: artifact.skill_name || '会话结果',
    fileType,
    filePath: artifact.url,
    createdAt,
    sessionId: sessionId ?? '',
    agentId: null,
    skillName: artifact.skill_name ?? null,
  }

  return {
    item,
    detail: {
      ...item,
      fileUrl: previewUrl,
      sizeBytes: artifact.size ?? null,
    },
  }
}

function getPartnerWorkspaceField(fileKey: PartnerWorkspaceFileKey): keyof PartnerConfig {
  switch (fileKey) {
    case 'SOUL.md':
      return 'soulContent'
    case 'USER.md':
      return 'userContent'
    case 'IDENTITY.md':
      return 'identityContent'
    default:
      return 'soulContent'
  }
}

function getPartnerWorkspaceValue(config: PartnerConfig | null, fileKey: PartnerWorkspaceFileKey): string {
  if (!config) {
    return ''
  }

  return config[getPartnerWorkspaceField(fileKey)] ?? ''
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
  const location = useLocation()
  const navigate = useNavigate()
  const isPartnerRoute = location.pathname === APP_ROUTE_PATHS.partner
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showPlusSheet, setShowPlusSheet] = useState(false)
  const [showSkillsPage, setShowSkillsPage] = useState(false)
  const [showSkillSelectorPage, setShowSkillSelectorPage] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showLibraryPage, setShowLibraryPage] = useState(false)
  const [showSidebarLibrary, setShowSidebarLibrary] = useState(false)
  const [showDiscoverPage, setShowDiscoverPage] = useState(false)
  const [showCommandsPage, setShowCommandsPage] = useState(false)
  const [commandsPageTab, setCommandsPageTab] = useState<AiCommandsPageTabKey>('best-practice')
  const [showMySkillsPage, setShowMySkillsPage] = useState(false)
  const [mySkillsTab, setMySkillsTab] = useState<'added' | 'created'>('added')
  const [showCreateSkillSheet, setShowCreateSkillSheet] = useState(false)
  const [showCreateSkillChat, setShowCreateSkillChat] = useState(false)
  const [libraryTab, setLibraryTab] = useState<'personal' | 'org'>('personal')
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([])
  const [selectedOrgSpaceId, setSelectedOrgSpaceId] = useState('')
  const [showOrgSpacePicker, setShowOrgSpacePicker] = useState(false)
  const [featureCards, setFeatureCards] = useState<CommandPromptItem[]>(fallbackFeatureCards)
  const [commandsData, setCommandsData] = useState<CommandsData>(EMPTY_COMMANDS_DATA)
  const [commandsLoading, setCommandsLoading] = useState(false)
  const [commandsError, setCommandsError] = useState('')
  const [skillSearchValue, setSkillSearchValue] = useState('')
  const [skillSelectorSearchValue, setSkillSelectorSearchValue] = useState('')
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
  const [userSkills, setUserSkills] = useState<SkillSummaryItem[]>([])
  const [userSkillsLoading, setUserSkillsLoading] = useState(false)
  const [userSkillsError, setUserSkillsError] = useState('')
  const [visibleAgents, setVisibleAgents] = useState<DiscoverAgentItem[]>([])
  const [agentUsageLogs, setAgentUsageLogs] = useState<AgentUsageLog[]>([])
  const [agentUsageLogsLoading, setAgentUsageLogsLoading] = useState(false)
  const [agentUsageLogsError, setAgentUsageLogsError] = useState('')
  const [deleteTargetAgent, setDeleteTargetAgent] = useState<AgentUsageLog | null>(null)
  const [deleteAgentUsageLoading, setDeleteAgentUsageLoading] = useState(false)
  const [removingAgentIds, setRemovingAgentIds] = useState<Set<string>>(new Set())
  const [deleteTargetSession, setDeleteTargetSession] = useState<ChatSession | null>(null)
  const [deleteSessionLoading, setDeleteSessionLoading] = useState(false)
  const [removingSessionIds, setRemovingSessionIds] = useState<Set<string>>(new Set())
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState('')
  const [librarySearchValue, setLibrarySearchValue] = useState('')
  const [debouncedLibrarySearchValue, setDebouncedLibrarySearchValue] = useState('')
  const [knowledgeSpaces, setKnowledgeSpaces] = useState<KnowledgeSpaceOption[]>([])
  const [libraryFiles, setLibraryFiles] = useState<LibraryResourceFile[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState('')
  const [localBannerMessage, setLocalBannerMessage] = useState('')
  const [filePickerMode, setFilePickerMode] = useState<'all' | 'image' | 'camera'>('all')
  const [showPartnerSettings, setShowPartnerSettings] = useState(false)
  const [partnerSettingsPage, setPartnerSettingsPage] = useState<PartnerSettingsPage>('menu')
  const [partnerWorkspaceFileKey, setPartnerWorkspaceFileKey] = useState<PartnerWorkspaceFileKey>('SOUL.md')
  const [partnerConfig, setPartnerConfig] = useState<PartnerConfig | null>(null)
  const [partnerDraft, setPartnerDraft] = useState<PartnerConfig | null>(null)
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [partnerError, setPartnerError] = useState('')
  const [partnerSaving, setPartnerSaving] = useState(false)
  const [partnerAvatarUploading, setPartnerAvatarUploading] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null)

  const {
    activeAgent,
    activeToolType,
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
  const artifactPreviewEntry = useMemo(() => buildArtifactPreviewEntry(selectedArtifact), [selectedArtifact])
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const partnerAvatarInputRef = useRef<HTMLInputElement | null>(null)
  const uploadAbortControllersRef = useRef<Map<string, AbortController>>(new Map())
  const hasConversation = messages.length > 0 || Boolean(routeSessionId)
  const groupedSessions = useMemo(() => groupChatSessionsByTime(sessions), [sessions])
  const hasGroupedSessions = groupedSessions.today.length > 0
    || groupedSessions.within7Days.length > 0
    || groupedSessions.beyond7Days.length > 0

  const menuItems = [
    { key: 'new', label: '新建' },
    { key: 'library', label: '库' },
    { key: 'skills', label: '技能' },
    { key: 'discover', label: '发现' },
  ]

  const builtInAgent = useMemo(() => {
    const agentName = partnerConfig?.agentName?.trim() || '建国'

    return {
      id: 'partner',
      name: agentName,
      avatar: agentName[0] || '建',
      avatarUrl: partnerConfig?.avatarUrl?.trim() || '',
      color: '#E8734A',
    }
  }, [partnerConfig])
  const groupedDiscoverAgents = useMemo(() => groupVisibleAgents(visibleAgents, currentUserId), [currentUserId, visibleAgents])
  const visibleAgentUsageLogs = showMore ? agentUsageLogs : agentUsageLogs.slice(0, 6)
  const plusCardItems = [
    { key: 'file', label: '图片 / 文件' },
    { key: 'doc', label: '资料库' },
  ]
  const plusListItems = [
    { key: 'skills', label: '技能' },
    { key: 'network', label: '联网' },
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
    setShowSidebarLibrary(false)
    setShowDiscoverPage(false)
    setShowMySkillsPage(false)
    setShowSkillSelectorPage(false)
    setShowDrawer(false)
    setShowSkillsPage(true)
  }

  const openSkillSelectorPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setSkillSelectorSearchValue('')
    setShowSkillSelectorPage(true)
  }

  const openLibraryPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setShowOrgSpacePicker(false)
    setLibrarySearchValue('')
    setSelectedLibraryIds([])
    setShowLibraryPage(true)
  }

  const openSidebarLibraryPage = () => {
    setShowDrawer(false)
    setShowDiscoverPage(false)
    setShowSkillsPage(false)
    setShowMySkillsPage(false)
    setShowSidebarLibrary(true)
  }

  const openPartnerPage = () => {
    setShowDrawer(false)
    setShowDiscoverPage(false)
    setShowSkillsPage(false)
    setShowSidebarLibrary(false)
    clearActiveAgent()
    startNewChat()
    navigate(APP_ROUTE_PATHS.partner)
  }

  const openLocalFilePicker = (mode: 'all' | 'image' | 'camera') => {
    setShowFileMenu(false)
    setShowPlusSheet(false)
    setFilePickerMode(mode)
    fileInputRef.current?.click()
  }

  const handleRemoveDraftAttachment = (attachmentId: string) => {
    const controller = uploadAbortControllersRef.current.get(attachmentId)

    if (controller) {
      controller.abort()
      uploadAbortControllersRef.current.delete(attachmentId)
    }

    removeDraftAttachment(attachmentId)
  }

  const handleLocalFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (selectedFiles.length === 0) {
      return
    }

    const validFiles = selectedFiles.filter((file) => {
      if (isAllowedChatUploadFile(file.name)) {
        return true
      }

      setLocalBannerMessage(`不支持 ${file.name}，当前只允许 ${ALLOWED_CHAT_UPLOAD_EXTENSIONS.join('、')}。`)
      return false
    })

    const availableSlots = Math.max(0, MAX_CHAT_UPLOAD_FILES - draftAttachments.length)

    if (availableSlots <= 0) {
      setLocalBannerMessage(`单次对话最多上传 ${MAX_CHAT_UPLOAD_FILES} 个文件，请先移除已有附件。`)
      return
    }

    const filesToUpload = validFiles.slice(0, availableSlots)

    if (filesToUpload.length < validFiles.length) {
      setLocalBannerMessage(`单次对话最多上传 ${MAX_CHAT_UPLOAD_FILES} 个文件，超出的文件已忽略。`)
    } else {
      setLocalBannerMessage('')
    }

    await Promise.all(filesToUpload.map(async (file) => {
      const pendingAttachment = createPendingChatAttachment(file)
      const controller = new AbortController()

      uploadAbortControllersRef.current.set(pendingAttachment.id, controller)
      setDraftAttachments((current) => [...current, pendingAttachment])

      try {
        const uploadedAttachment = await uploadPendingChatFile(pendingAttachment, file, {
          signal: controller.signal,
          onStatusChange(nextAttachment) {
            setDraftAttachments((current) => current.map((item) => item.id === nextAttachment.id ? nextAttachment : item))
          },
        })

        setDraftAttachments((current) => current.map((item) => item.id === pendingAttachment.id ? uploadedAttachment : item))
      } catch (error) {
        if (!controller.signal.aborted) {
          setLocalBannerMessage(error instanceof Error ? error.message : `${file.name} 上传失败`)
        }

        setDraftAttachments((current) => current.filter((item) => item.id !== pendingAttachment.id))
      } finally {
        uploadAbortControllersRef.current.delete(pendingAttachment.id)
      }
    }))
  }

  const updatePartnerDraftField = (field: keyof PartnerConfig, value: string) => {
    setPartnerDraft((current) => {
      const base = current ?? {
        agentName: builtInAgent.name,
        avatarUrl: builtInAgent.avatarUrl,
        soulContent: '',
        userContent: '',
        identityContent: '',
      }

      return {
        ...base,
        [field]: value,
      }
    })
  }

  const openPartnerSettings = () => {
    setPartnerSettingsPage('menu')
    setPartnerWorkspaceFileKey('SOUL.md')
    setShowPartnerSettings(true)
  }

  const closePartnerSettings = () => {
    if (partnerSaving || partnerAvatarUploading) {
      return
    }

    setShowPartnerSettings(false)
    setPartnerSettingsPage('menu')
    setPartnerWorkspaceFileKey('SOUL.md')
  }

  const handlePartnerAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    setPartnerAvatarUploading(true)
    setPartnerError('')

    try {
      const uploadedUrl = await uploadPartnerAvatar(file)
      updatePartnerDraftField('avatarUrl', uploadedUrl)
      setLocalBannerMessage('伙伴头像已上传，记得保存配置。')
    } catch (error) {
      setPartnerError(error instanceof Error ? error.message : '伙伴头像上传失败')
    } finally {
      setPartnerAvatarUploading(false)
    }
  }

  const savePartnerSettings = async () => {
    if (!partnerDraft || !partnerConfig) {
      return
    }

    const fieldsToUpdate: Array<{ field: PartnerConfigUpdateField; value: string }> = []

    if (partnerDraft.agentName.trim() !== partnerConfig.agentName.trim()) {
      fieldsToUpdate.push({ field: 'agent_name', value: partnerDraft.agentName.trim() })
    }

    if (partnerDraft.soulContent !== partnerConfig.soulContent) {
      fieldsToUpdate.push({ field: 'SOUL.md', value: partnerDraft.soulContent })
    }

    if (partnerDraft.userContent !== partnerConfig.userContent) {
      fieldsToUpdate.push({ field: 'USER.md', value: partnerDraft.userContent })
    }

    if (partnerDraft.identityContent !== partnerConfig.identityContent) {
      fieldsToUpdate.push({ field: 'IDENTITY.md', value: partnerDraft.identityContent })
    }

    if (partnerDraft.avatarUrl.trim() !== partnerConfig.avatarUrl.trim()) {
      fieldsToUpdate.push({ field: 'avatar_url', value: partnerDraft.avatarUrl.trim() })
    }

    if (fieldsToUpdate.length === 0) {
      setShowPartnerSettings(false)
      return
    }

    setPartnerSaving(true)
    setPartnerError('')

    try {
      for (const item of fieldsToUpdate) {
        await updatePartnerConfig(item.field, item.value)
      }

      setPartnerConfig(partnerDraft)
      setShowPartnerSettings(false)
      setLocalBannerMessage('智能伙伴配置已更新。')
    } catch (error) {
      setPartnerError(error instanceof Error ? error.message : '智能伙伴配置更新失败')
    } finally {
      setPartnerSaving(false)
    }
  }

  const featuredSkills = useMemo(() => filterSkillItems(officialSkills, skillSearchValue).slice(0, 3), [officialSkills, skillSearchValue])
  const visibleCommunitySkills = useMemo(() => {
    const filteredOfficial = filterSkillItems(officialSkills, skillSearchValue)
    return mergeSkillSummaryItems(filteredOfficial, communitySkills)
  }, [communitySkills, officialSkills, skillSearchValue])
  const visibleManageSkills = useMemo(() => {
    const sourceList = mySkillsTab === 'added' ? addedSkills : createdSkills
    return filterSkillItems(sourceList, mySkillSearchValue)
  }, [addedSkills, createdSkills, mySkillSearchValue, mySkillsTab])
  const visibleSelectableSkills = useMemo(() => {
    return filterSkillItems(userSkills, skillSelectorSearchValue)
  }, [skillSelectorSearchValue, userSkills])
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
  const draftResourceIds = useMemo(() => new Set(
    draftAttachments.flatMap((attachment) => attachment.resourceId ? [attachment.resourceId] : []),
  ), [draftAttachments])
  const fileInputAccept = filePickerMode === 'all'
    ? ALLOWED_CHAT_UPLOAD_EXTENSIONS.map((extension) => `.${extension}`).join(',')
    : 'image/*'

  useEffect(() => {
    if (!isPartnerRoute || !activeAgent) {
      return
    }

    clearActiveAgent()
  }, [activeAgent, clearActiveAgent, isPartnerRoute])

  const loadPartnerConfig = useCallback(async (signal?: AbortSignal) => {
    setPartnerLoading(true)
    setPartnerError('')

    try {
      const nextPartnerConfig = await fetchPartnerConfig(signal)

      if (signal?.aborted) {
        return
      }

      setPartnerConfig(nextPartnerConfig)
      setPartnerDraft(nextPartnerConfig)
    } catch (error) {
      if (!signal?.aborted) {
        setPartnerError(error instanceof Error ? error.message : '智能伙伴配置加载失败')
      }
    } finally {
      if (!signal?.aborted) {
        setPartnerLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    void loadPartnerConfig(controller.signal)

    return () => {
      controller.abort()
    }
  }, [loadPartnerConfig])

  useEffect(() => {
    return () => {
      uploadAbortControllersRef.current.forEach((controller) => controller.abort())
      uploadAbortControllersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (!selectedSkillName) {
      return
    }

    if (inputValue.includes(buildSkillDisplayName(selectedSkillName))) {
      return
    }

    setSelectedSkillName(null)
    setActiveToolType(null)
  }, [inputValue, selectedSkillName, setActiveToolType])

  useEffect(() => {
    if (activeToolType) {
      return
    }

    setSelectedSkillName(null)
  }, [activeToolType])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setCommandsLoading(true)
      setCommandsError('')

      try {
        const commands = await fetchCommands()

        if (cancelled) {
          return
        }

        setCommandsData(commands)
        const nextCards = mapCommandsToPromptItems(commands.best_practices)
        setFeatureCards(nextCards.length > 0 ? nextCards : fallbackFeatureCards)
      } catch (error) {
        if (!cancelled) {
          setCommandsError(error instanceof Error ? error.message : '指令内容加载失败')
        }
        console.warn('[ai-page] 加载最佳实践失败：', error)
      } finally {
        if (!cancelled) {
          setCommandsLoading(false)
        }
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
    if (!showSkillSelectorPage) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      setUserSkillsLoading(true)
      setUserSkillsError('')

      try {
        setUserSkills(await fetchUserSkills(controller.signal))
      } catch (error) {
        if (!controller.signal.aborted) {
          setUserSkills([])
          setUserSkillsError(error instanceof Error ? error.message : '技能列表加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setUserSkillsLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [showSkillSelectorPage])

  useEffect(() => {
    if (!showDrawer) {
      return
    }

    const controller = new AbortController()

    void (async () => {
      setAgentUsageLogsLoading(true)
      setAgentUsageLogsError('')

      try {
        setAgentUsageLogs(await getAgentUsageLogs(controller.signal))
      } catch (error) {
        if (!controller.signal.aborted) {
          setAgentUsageLogs([])
          setAgentUsageLogsError(error instanceof Error ? error.message : '智能体使用记录加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setAgentUsageLogsLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [showDrawer])

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
    setSelectedSkillName(null)
    setDraftAttachments(card.attachments)
  }

  const openCommandsPage = (tab: AiCommandsPageTabKey = 'best-practice') => {
    setCommandsPageTab(tab)
    setShowCommandsPage(true)
  }

  const applyCommandItem = (command: CommandApiItem) => {
    const nextCard = mapCommandsToPromptItems([command])[0]

    if (!nextCard) {
      return
    }

    applyFeatureCard(nextCard)
    setShowCommandsPage(false)
  }

  const applySkillItem = (skill: SkillSummaryItem) => {
    const resolvedSkillName = skill.skillName || skill.id

    setInputValue(buildSkillInitialPrompt({
      ...skill,
      skillName: resolvedSkillName,
    }))
    setActiveToolType(resolvedSkillName || null)
    setSelectedSkillName(resolvedSkillName || null)
    setShowPlusSheet(false)
    setShowSkillsPage(false)
    setShowMySkillsPage(false)
    setShowSkillSelectorPage(false)
  }

  const openAgentChat = async (agent: DiscoverAgentItem) => {
    let createdUsageLog = false

    try {
      createdUsageLog = await ensureAgentUsageLog(agent.agentId)
    } catch (error) {
      console.warn('[ai-page] 补写智能体使用记录失败：', error)
    }

    setAgentUsageLogs((current) => {
      const nextEntry: AgentUsageLog = {
        agentId: agent.agentId,
        userId: currentUserId,
        agentName: agent.agentName,
        avatarUrl: agent.avatarUrl,
        usedAt: new Date().toISOString(),
      }

      if (createdUsageLog || !current.some((item) => item.agentId === agent.agentId)) {
        return [nextEntry, ...current.filter((item) => item.agentId !== agent.agentId)]
      }

      return current.map((item) => item.agentId === agent.agentId ? {
        ...item,
        agentName: agent.agentName,
        avatarUrl: agent.avatarUrl,
      } : item)
    })

    activateAgent(buildAgentContext(agent))
    startNewChat({ keepAgent: true })
    setShowDiscoverPage(false)
    setShowDrawer(false)
  }

  const openAgentUsageLogChat = (agent: AgentUsageLog) => {
    const matchedAgent = visibleAgents.find((item) => item.agentId === agent.agentId)

    if (matchedAgent) {
      void openAgentChat(matchedAgent)
      return
    }

    activateAgent({
      agentId: agent.agentId,
      agentName: agent.agentName,
      description: '',
    })
    startNewChat({ keepAgent: true })
    setShowDiscoverPage(false)
    setShowDrawer(false)
  }

  const openDeleteAgentUsageDialog = (agent: AgentUsageLog) => {
    setDeleteTargetAgent(agent)
  }

  const closeDeleteAgentUsageDialog = () => {
    if (deleteAgentUsageLoading) {
      return
    }

    setDeleteTargetAgent(null)
  }

  const confirmDeleteAgentUsageLog = async () => {
    const agent = deleteTargetAgent

    if (!agent) {
      return
    }

    try {
      setDeleteAgentUsageLoading(true)
      setRemovingAgentIds((current) => new Set(current).add(agent.agentId))
      await deleteAgentUsageLog(agent.agentId)
      setAgentUsageLogs((current) => current.filter((item) => item.agentId !== agent.agentId))
      setDeleteTargetAgent(null)
    } catch (error) {
      setLocalBannerMessage(error instanceof Error ? error.message : '删除智能体使用记录失败')
    } finally {
      setDeleteAgentUsageLoading(false)
      setRemovingAgentIds((current) => {
        const next = new Set(current)
        next.delete(agent.agentId)
        return next
      })
    }
  }

  const openDeleteSessionDialog = (session: ChatSession) => {
    setDeleteTargetSession(session)
  }

  const closeDeleteSessionDialog = () => {
    if (deleteSessionLoading) {
      return
    }

    setDeleteTargetSession(null)
  }

  const confirmDeleteSession = async () => {
    const session = deleteTargetSession

    if (!session) {
      return
    }

    try {
      setDeleteSessionLoading(true)
      setRemovingSessionIds((current) => new Set(current).add(session.session_id))
      await removeSession(session.session_id)
      setDeleteTargetSession(null)
    } catch (error) {
      setLocalBannerMessage(error instanceof Error ? error.message : '删除会话失败')
    } finally {
      setDeleteSessionLoading(false)
      setRemovingSessionIds((current) => {
        const next = new Set(current)
        next.delete(session.session_id)
        return next
      })
    }
  }

  const renderDrawerSessionGroup = (title: '今天' | '7天内' | '7天外', items: ChatSession[]) => {
    if (items.length === 0) {
      return null
    }

    return (
      <div className="ai-drawer-chat-group" key={title}>
        <div className="ai-drawer-chat-group-title">{title}</div>
        {items.map((session) => (
          <div
            className={`ai-drawer-chat-row ${removingSessionIds.has(session.session_id) ? 'is-removing' : ''}`}
            key={session.session_id}
          >
            <button
              className={`ai-drawer-chat-item ${routeSessionId === session.session_id ? 'is-active' : ''}`}
              disabled={removingSessionIds.has(session.session_id)}
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
            </button>
            <button
              className="ai-drawer-chat-delete"
              disabled={removingSessionIds.has(session.session_id)}
              type="button"
              onClick={() => { openDeleteSessionDialog(session) }}
            >
              {removingSessionIds.has(session.session_id) ? '删除中' : '删除'}
            </button>
          </div>
        ))}
      </div>
    )
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

  return showCommandsPage ? (
    <AiCommandsPage
      activeTab={commandsPageTab}
      bestPractices={commandsData.best_practices}
      error={commandsError}
      loading={commandsLoading}
      myCommands={commandsData.my_commands}
      officialCommands={commandsData.official_commands}
      onApplyCommand={applyCommandItem}
      onBack={() => setShowCommandsPage(false)}
      onTabChange={setCommandsPageTab}
    />
  ) : (
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
        {isPartnerRoute ? <div className="ai-page-header-title">{builtInAgent.name}</div> : <div className="ai-page-header-spacer" />}
        <div className="ai-page-header-right">
          <button
            className="ai-page-header-action"
            type="button"
            onClick={() => {
              if (isPartnerRoute) {
                openPartnerSettings()
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
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
            {isPartnerRoute ? (
              <>
                <h1>{builtInAgent.name} 已经准备好了</h1>
                <div className="ai-page-partner-intro">
                  <div className="ai-page-partner-avatar">
                    {builtInAgent.avatarUrl ? (
                      <img
                        alt={builtInAgent.name}
                        decoding="async"
                        loading="lazy"
                        src={builtInAgent.avatarUrl}
                      />
                    ) : (
                      builtInAgent.avatar
                    )}
                  </div>
                  <div className="ai-page-partner-copy">
                    <div className="ai-page-partner-title">伙伴聊天和普通会话共用同一套流式链路</div>
                    <div className="ai-page-partner-desc">右上角可以改伙伴名称和人设文档，底部可以直接上传本地文件后发起对话。</div>
                  </div>
                </div>
                <button className="ai-page-partner-settings-entry" type="button" onClick={openPartnerSettings}>
                  打开伙伴设置
                </button>
              </>
            ) : (
              <>
                <h1>Hi <DisplayName userId={currentUserId} fallback={displayName} />，有什么可以帮你的？</h1>
                <div className="ai-page-practice-header" onClick={() => openCommandsPage()}>
                  <span className="ai-page-practice-title">全部最佳实践</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </>
            )}
          </div>

          {!isPartnerRoute ? (
            <div className="ai-page-cards">
              {featureCards.map((card, index) => (
                <button className="ai-card" key={card.id} type="button" onClick={() => applyFeatureCard(card)}>
                  <div
                    className={`ai-card-icon ${card.image ? 'has-image' : 'is-empty'}`}
                    style={card.image ? undefined : { background: getFeatureCardColor(index) }}
                  >
                    {card.image ? (
                      <img
                        alt={card.title}
                        className="ai-card-icon-image"
                        decoding="async"
                        loading="lazy"
                        src={card.image}
                      />
                    ) : null}
                  </div>
                  <div className="ai-card-text">
                    <span className="ai-card-label1">{card.title}</span>
                    <span className="ai-card-label2">{card.summary}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
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
        {(requestError || localBannerMessage) && (
          <div className="ai-page-error-banner">{requestError || localBannerMessage}</div>
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
                onClick={() => handleRemoveDraftAttachment(attachment.id)}
              >
                <span className="ai-page-draft-chip-name">{attachment.name}</span>
                <span className="ai-page-draft-chip-status">
                  {attachment.kind === 'resource'
                    ? '资料库'
                    : attachment.status === 'uploading'
                      ? '上传中'
                      : attachment.status === 'parsing'
                        ? '解析中'
                        : '已就绪'}
                </span>
              </button>
            ))}
          </div>
        )}
        <AppComposerInput
          actionAriaLabel="发送消息"
          canSubmit={canSend}
          className="ai-page-composer-input"
          inputAriaLabel="提问输入框"
          isResponding={isResponding}
          isStopping={isStopping}
          note="使用国内合规模型并严格遵循权限隔离，保障企业数据安全"
          placeholder="提个问题，或让我创作、分析任意内容"
          plusAriaLabel="打开更多操作"
          value={inputValue}
          onChange={setInputValue}
          onPlusClick={() => {
            setShowFileMenu(false)
            setShowPlusSheet(true)
          }}
          onStop={() => stopResponding()}
          onSubmit={(promptOverride) => submitPrompt(promptOverride, undefined, undefined, { enableWebSearch: webSearchEnabled })}
        />
        <input
          accept={fileInputAccept}
          capture={filePickerMode === 'camera' ? 'environment' : undefined}
          className="ai-hidden-file-input"
          multiple={filePickerMode !== 'camera'}
          onChange={handleLocalFileChange}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {showPartnerSettings && (
        <div className="ai-partner-settings-overlay" onClick={closePartnerSettings}>
          <div className="ai-partner-settings-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="ai-partner-settings-handle" />
            <div className="ai-partner-settings-head">
              <div className="ai-partner-settings-head-left">
                {partnerSettingsPage !== 'menu' ? (
                  <button
                    className="ai-partner-settings-back"
                    disabled={partnerSaving || partnerAvatarUploading}
                    type="button"
                    onClick={() => setPartnerSettingsPage('menu')}
                  >
                    返回
                  </button>
                ) : null}
                <div>
                  <div className="ai-partner-settings-title">
                    {partnerSettingsPage === 'basic' ? '基础信息' : partnerSettingsPage === 'workspace' ? '工作区' : '伙伴设置'}
                  </div>
                  <div className="ai-partner-settings-subtitle">
                    {partnerSettingsPage === 'basic'
                      ? '这里更新伙伴名称、头像和基础展示信息。'
                      : partnerSettingsPage === 'workspace'
                        ? '这里维护三份人设文档，聊天会直接复用这些配置。'
                        : '伙伴聊天和普通会话共用一套流式链路，设置拆到单独子页。'}
                  </div>
                </div>
              </div>
              <button className="ai-partner-settings-close" disabled={partnerSaving || partnerAvatarUploading} type="button" onClick={closePartnerSettings}>
                关闭
              </button>
            </div>

            {partnerLoading ? <div className="ai-partner-settings-status">配置加载中...</div> : null}
            {partnerError ? <div className="ai-partner-settings-status is-error">{partnerError}</div> : null}

            {partnerSettingsPage === 'menu' ? (
              <div className="ai-partner-settings-menu">
                <button className="ai-partner-settings-menu-item" type="button" onClick={() => setPartnerSettingsPage('basic')}>
                  <span className="ai-partner-settings-menu-title">基础信息</span>
                  <span className="ai-partner-settings-menu-desc">名称、头像和展示信息</span>
                </button>
                <button className="ai-partner-settings-menu-item" type="button" onClick={() => setPartnerSettingsPage('workspace')}>
                  <span className="ai-partner-settings-menu-title">工作区</span>
                  <span className="ai-partner-settings-menu-desc">SOUL.md / USER.md / IDENTITY.md</span>
                </button>
              </div>
            ) : null}

            {partnerSettingsPage === 'basic' ? (
              <div className="ai-partner-settings-body">
                <div className="ai-partner-settings-avatar-card">
                  <div className="ai-partner-settings-avatar-preview">
                    {partnerDraft?.avatarUrl ? (
                      <img alt={partnerDraft.agentName || builtInAgent.name} src={partnerDraft.avatarUrl} />
                    ) : (
                      <span>{(partnerDraft?.agentName || builtInAgent.name || '建')[0]}</span>
                    )}
                  </div>
                  <div className="ai-partner-settings-avatar-meta">
                    <div className="ai-partner-settings-avatar-title">伙伴头像</div>
                    <div className="ai-partner-settings-avatar-desc">支持直接上传图片，也可以继续手动填地址。</div>
                  </div>
                  <button
                    className="ai-partner-settings-upload-btn"
                    disabled={partnerSaving || partnerAvatarUploading}
                    type="button"
                    onClick={() => partnerAvatarInputRef.current?.click()}
                  >
                    {partnerAvatarUploading ? '上传中...' : '上传头像'}
                  </button>
                </div>
                <label className="ai-partner-settings-field">
                  <span>伙伴名称</span>
                  <input
                    className="ai-partner-settings-input"
                    disabled={partnerSaving || partnerAvatarUploading}
                    type="text"
                    value={partnerDraft?.agentName ?? builtInAgent.name}
                    onChange={(event) => updatePartnerDraftField('agentName', event.target.value)}
                  />
                </label>
                <label className="ai-partner-settings-field">
                  <span>头像地址</span>
                  <input
                    className="ai-partner-settings-input"
                    disabled={partnerSaving || partnerAvatarUploading}
                    type="text"
                    value={partnerDraft?.avatarUrl ?? builtInAgent.avatarUrl}
                    onChange={(event) => updatePartnerDraftField('avatarUrl', event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {partnerSettingsPage === 'workspace' ? (
              <div className="ai-partner-settings-body">
                <div className="ai-partner-settings-doc-tabs">
                  {(['SOUL.md', 'USER.md', 'IDENTITY.md'] as PartnerWorkspaceFileKey[]).map((fileKey) => (
                    <button
                      className={`ai-partner-settings-doc-tab ${partnerWorkspaceFileKey === fileKey ? 'is-active' : ''}`}
                      key={fileKey}
                      type="button"
                      onClick={() => setPartnerWorkspaceFileKey(fileKey)}
                    >
                      {fileKey}
                    </button>
                  ))}
                </div>
                <label className="ai-partner-settings-field">
                  <span>{partnerWorkspaceFileKey}</span>
                  <textarea
                    className="ai-partner-settings-textarea"
                    disabled={partnerSaving}
                    value={getPartnerWorkspaceValue(partnerDraft, partnerWorkspaceFileKey)}
                    onChange={(event) => updatePartnerDraftField(getPartnerWorkspaceField(partnerWorkspaceFileKey), event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <div className="ai-partner-settings-actions">
              <button className="ai-partner-settings-btn" disabled={partnerSaving || partnerAvatarUploading} type="button" onClick={closePartnerSettings}>
                {partnerSettingsPage === 'menu' ? '关闭' : '取消'}
              </button>
              <button className="ai-partner-settings-btn is-primary" disabled={partnerSaving || partnerLoading || partnerAvatarUploading} type="button" onClick={() => { void savePartnerSettings() }}>
                {partnerSaving ? '保存中...' : '保存'}
              </button>
            </div>
            <input
              accept="image/*"
              className="ai-hidden-file-input"
              onChange={handlePartnerAvatarFileChange}
              ref={partnerAvatarInputRef}
              type="file"
            />
          </div>
        </div>
      )}

      {showDrawer && (
        <div className="ai-drawer-overlay" onClick={() => setShowDrawer(false)}>

          <div className="ai-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ai-drawer-body">
              <div className="ai-drawer-fixed-section">
                <div className="ai-drawer-profile">
                  <img
                    alt={BRAND_NAME}
                    className="ai-drawer-profile-avatar"
                    decoding="async"
                    loading="lazy"
                    src={LUCKY_AVATAR_URL}
                  />
                  <div className="ai-drawer-profile-name">{BRAND_NAME}</div>
                </div>

                <div className="ai-drawer-menu">
                  {menuItems.map((item) => (
                    <div className={`ai-drawer-menu-item ${(item.key === 'library' && showSidebarLibrary) || (item.key === 'new' && !showSidebarLibrary && !showDiscoverPage && !showSkillsPage) || (item.key === 'discover' && showDiscoverPage) || (item.key === 'skills' && showSkillsPage) ? 'is-highlighted' : ''}`} key={item.key} onClick={() => {
                      if (item.key === 'library') {
                        openSidebarLibraryPage()
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
                        openSkillsPage()
                      }
                    }}>
                      <span className="ai-drawer-menu-icon">{renderDrawerIcon(item.key)}</span>
                      <span className="ai-drawer-menu-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ai-drawer-scroll-section">
                <div className="ai-drawer-unified-scroll">
                  <div className="ai-drawer-section">
                    <div className="ai-drawer-section-title">智能伙伴</div>
                    <button className="ai-drawer-agent-item" type="button" onClick={openPartnerPage}>
                      <div
                        className="ai-drawer-agent-avatar"
                        style={builtInAgent.avatarUrl ? {
                          backgroundImage: `url(${builtInAgent.avatarUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: 'transparent',
                        } : { background: builtInAgent.color }}
                      >
                        {!builtInAgent.avatarUrl && builtInAgent.avatar}
                      </div>
                      <span className="ai-drawer-agent-name">{builtInAgent.name}</span>
                    </button>
                  </div>

                  <div className="ai-drawer-section">
                    <div className="ai-drawer-section-title">自定义智能体</div>
                    {agentUsageLogsLoading ? (
                      <div className="ai-drawer-chat-empty">正在刷新智能体…</div>
                    ) : agentUsageLogsError ? (
                      <div className="ai-drawer-chat-empty">{agentUsageLogsError}</div>
                    ) : visibleAgentUsageLogs.length === 0 ? (
                      <div className="ai-drawer-chat-empty">还没有智能体使用记录</div>
                    ) : visibleAgentUsageLogs.map((agent) => (
                      <div className={`ai-drawer-agent-row ${removingAgentIds.has(agent.agentId) ? 'is-removing' : ''}`} key={agent.agentId}>
                        <button
                          className="ai-drawer-agent-item"
                          disabled={removingAgentIds.has(agent.agentId)}
                          type="button"
                          onClick={() => { openAgentUsageLogChat(agent) }}
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
                        <button
                          className="ai-drawer-agent-delete"
                          disabled={removingAgentIds.has(agent.agentId)}
                          type="button"
                          onClick={() => { openDeleteAgentUsageDialog(agent) }}
                        >
                          {removingAgentIds.has(agent.agentId) ? '删除中' : '删除'}
                        </button>
                      </div>
                    ))}

                    {!showMore && agentUsageLogs.length > visibleAgentUsageLogs.length && (
                      <button className="ai-drawer-more" type="button" onClick={() => setShowMore(true)}>
                        更多
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="ai-drawer-section">
                    <div className="ai-drawer-section-title">最近对话</div>
                    {isLoadingSessions ? (
                      <div className="ai-drawer-chat-empty">正在刷新会话…</div>
                    ) : !hasGroupedSessions ? (
                      <div className="ai-drawer-chat-empty">还没有历史会话</div>
                    ) : (
                      <>
                        {renderDrawerSessionGroup('今天', groupedSessions.today)}
                        {renderDrawerSessionGroup('7天内', groupedSessions.within7Days)}
                        {renderDrawerSessionGroup('7天外', groupedSessions.beyond7Days)}
                      </>
                    )}
                  </div>
                </div>
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
                    <button
                      className="ai-file-menu-item"
                      key={item.key}
                      type="button"
                      onClick={() => {
                        if (item.key === 'album') {
                          openLocalFilePicker('image')
                          return
                        }

                        if (item.key === 'camera') {
                          openLocalFilePicker('camera')
                          return
                        }

                        openLocalFilePicker('all')
                      }}
                    >
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
                item.key === 'skills' ? (
                  <button
                    className="ai-plus-sheet-row"
                    key={item.key}
                    type="button"
                    onClick={openSkillSelectorPage}
                  >
                    <span className="ai-plus-sheet-row-left">
                      <span className="ai-plus-sheet-row-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                          <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                          <path d="m8.5 11.5 4 4" />
                        </svg>
                      </span>
                      <span className="ai-plus-sheet-row-label">{item.label}</span>
                    </span>
                    <span className="ai-plus-sheet-row-arrow">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <div
                    className="ai-plus-sheet-row is-switch-row"
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setShowFileMenu(false)
                      setWebSearchEnabled((value) => !value)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setShowFileMenu(false)
                        setWebSearchEnabled((value) => !value)
                      }
                    }}
                  >
                    <span className="ai-plus-sheet-row-left">
                      <span className="ai-plus-sheet-row-icon">
                        <GlobalOutline fontSize={20} />
                      </span>
                      <span className="ai-plus-sheet-row-label">{item.label}</span>
                    </span>
                    <span
                      className="ai-plus-sheet-row-switch"
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                    >
                      <Switch
                        aria-label="联网查询开关"
                        checked={webSearchEnabled}
                        className="ai-plus-sheet-network-switch"
                        onChange={setWebSearchEnabled}
                      />
                    </span>
                  </div>
                )
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
              <button className="ai-skill-community-settings" type="button" onClick={() => setShowMySkillsPage(true)}>
                <SetOutline aria-hidden="true" style={{ fontSize: 20 }} />
              </button>
              <button className="ai-skill-community-close" type="button" onClick={() => setShowSkillsPage(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
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
        <div className="library-page ai-library-picker-page">
          <div className="library-header ai-library-picker-header">
            <div className="library-nav">
              <div className="library-icon-placeholder" />
              <div className="library-title-wrap">
                <div className="library-title">选择资料</div>
              </div>
              <button className="library-icon-btn ai-library-picker-close" type="button" onClick={() => setShowLibraryPage(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="library-scope-switch">
              <button
                className={`library-scope-btn ${libraryTab === 'personal' ? 'is-active' : ''}`}
                type="button"
                onClick={() => {
                  setLibraryTab('personal')
                  setShowOrgSpacePicker(false)
                }}
              >
                个人资料库
              </button>
              <button
                className={`library-scope-btn ${libraryTab === 'org' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setLibraryTab('org')}
              >
                组织资料库
              </button>
            </div>

            {libraryTab === 'org' ? (
              <button className="library-org-space-trigger" type="button" onClick={() => setShowOrgSpacePicker(true)}>
                <span>知识空间</span>
                <span className="library-org-space-value">{selectedOrgSpaceName || '请选择知识空间'}</span>
              </button>
            ) : null}

            <div className="ai-library-picker-toolbar">
              <div className="library-search">
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
              <div className="ai-library-picker-selected">已选 {selectedLibraryIds.length}</div>
            </div>
          </div>

          <div className="library-content ai-library-picker-content">
            <div className="library-list">
              {libraryLoading ? <div className="library-empty">资料库加载中...</div> : null}
              {!libraryLoading && libraryError ? <div className="library-empty">{libraryError}</div> : null}
              {!libraryLoading && !libraryError && visibleLibraryItems.length === 0 ? (
                <div className="library-empty">
                  <div className="library-empty-title">暂无可引用文件</div>
                  <div className="library-empty-desc">当前直接使用资料库接口返回的数据，没有额外做前端过滤。</div>
                </div>
              ) : null}
              {!libraryLoading && !libraryError && visibleLibraryItems.map((item) => {
                const checked = selectedLibraryIds.includes(item.nodeId)
                const isAlreadyAttached = draftResourceIds.has(item.resourceId)
                const metaText = isAlreadyAttached ? '已添加到当前会话' : item.createBy || '未知来源'

                return (
                  <button
                    className={`library-item ai-library-picker-item ${checked ? 'is-selected' : ''} ${isAlreadyAttached ? 'is-disabled' : ''}`}
                    disabled={isAlreadyAttached}
                    key={item.nodeId}
                    type="button"
                    onClick={() => {
                      if (!isAlreadyAttached) {
                        toggleLibraryItem(item.nodeId)
                      }
                    }}
                  >
                    <span className={`ai-library-picker-checkbox ${checked ? 'is-checked' : ''}`}>
                      {checked && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <div className="library-item-main">
                      {renderLibraryPickerFileBadge(item)}
                      <div className="library-item-body">
                        <div className="library-item-name">{item.fileName}</div>
                        <div className="library-item-meta">{metaText}</div>
                      </div>
                    </div>
                    <div className="library-item-side">
                      <span className="library-item-side-text">{formatLibraryPickerDateTime(item.createTime)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="ai-library-picker-footer">
            <button className="ai-library-picker-footer-btn" type="button" onClick={() => setShowLibraryPage(false)}>取消</button>
            <button
              className="ai-library-picker-footer-btn is-primary"
              disabled={selectedLibraryIds.length === 0}
              type="button"
              onClick={addSelectedLibraryItemsToDraft}
            >
              添加
            </button>
          </div>

          {showOrgSpacePicker ? (
            <div className="library-filter-sheet-overlay" onClick={() => setShowOrgSpacePicker(false)}>
              <div className="library-filter-sheet" onClick={(event) => event.stopPropagation()}>
                <div className="library-filter-sheet-handle" />
                <div className="library-filter-sheet-title">选择知识空间</div>
                <div className="library-org-save-options">
                  {knowledgeSpaces.map((space) => (
                    <button
                      className={`library-sheet-option ${selectedOrgSpaceId === space.id ? 'is-active' : ''}`}
                      key={space.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrgSpaceId(space.id)
                        setShowOrgSpacePicker(false)
                      }}
                    >
                      <span>{space.name}</span>
                      {selectedOrgSpaceId === space.id ? <span>已选</span> : null}
                    </button>
                  ))}
                  {knowledgeSpaces.length === 0 ? <div className="library-empty">当前没有可用知识空间。</div> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
      {/* 侧边栏库全屏页 */}
      {showSidebarLibrary && (
        <AiSidebarLibraryPage
          onClose={() => setShowSidebarLibrary(false)}
          onOpenDrawer={() => setShowDrawer(true)}
          onOpenSession={(sessionId) => {
            setShowSidebarLibrary(false)
            openSession(sessionId)
          }}
        />
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

      {showSkillSelectorPage && (
        <div className="ai-chat-skill-picker-page">
          <div className="ai-chat-skill-picker-header">
            <div className="ai-chat-skill-picker-header-spacer" />
            <div className="ai-chat-skill-picker-title">技能</div>
            <button className="ai-chat-skill-picker-close" type="button" onClick={() => setShowSkillSelectorPage(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="ai-chat-skill-picker-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="ai-inline-search-input"
              placeholder="搜索"
              value={skillSelectorSearchValue}
              onChange={(event) => setSkillSelectorSearchValue(event.target.value)}
            />
          </div>

          <div className="ai-chat-skill-picker-list">
            {userSkillsLoading ? <div className="ai-data-status">技能加载中…</div> : null}
            {!userSkillsLoading && userSkillsError ? <div className="ai-data-status">{userSkillsError}</div> : null}
            {!userSkillsLoading && !userSkillsError && visibleSelectableSkills.length === 0 ? <div className="ai-data-status">暂无可用技能</div> : null}
            {!userSkillsLoading && !userSkillsError && visibleSelectableSkills.map((skill, index) => {
              const resolvedSkillName = skill.skillName || skill.id
              const tags = getSkillCardTags(skill)
              const isActive = selectedSkillName === resolvedSkillName

              return (
                <button
                  className={`ai-chat-skill-picker-item ${isActive ? 'is-active' : ''}`}
                  key={skill.id}
                  type="button"
                  onClick={() => applySkillItem(skill)}
                >
                  <div className="ai-chat-skill-picker-item-icon" style={{ background: getFeatureCardColor(index) }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                      <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                      <path d="m8.5 11.5 4 4" />
                    </svg>
                  </div>

                  <div className="ai-chat-skill-picker-item-body">
                    <div className="ai-chat-skill-picker-item-top">
                      <span className="ai-chat-skill-picker-item-title">{skill.title}</span>
                      {tags.length > 0 ? (
                        <div className="ai-chat-skill-picker-item-tags">
                          {tags.map((tag) => (
                            <span className="ai-chat-skill-picker-item-tag" key={`${skill.id}-${tag}`}>{tag}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="ai-chat-skill-picker-item-name">{resolvedSkillName}</div>
                    <div className="ai-chat-skill-picker-item-desc">{skill.description || '暂无描述'}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
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
              <SetOutline aria-hidden="true" className="ai-my-skills-settings" style={{ fontSize: 20 }} />
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

      {selectedArtifact && artifactPreviewEntry ? (
        <AiLibraryFilePreview
          initialDetail={artifactPreviewEntry.detail}
          onBack={() => setSelectedArtifact(null)}
          onOpenSession={(sessionId) => {
            setSelectedArtifact(null)
            openSession(sessionId)
          }}
          selectedFile={artifactPreviewEntry.item}
          showOpenSessionLink={false}
        />
      ) : null}

      <Dialog
        visible={Boolean(deleteTargetAgent)}
        content="是否确认删除该智能体使用记录？"
        closeOnAction={false}
        closeOnMaskClick={!deleteAgentUsageLoading}
        onClose={closeDeleteAgentUsageDialog}
        actions={[
          [
            {
              key: 'cancel',
              text: '取消',
              disabled: deleteAgentUsageLoading,
              style: { color: '#1f2329' },
              onClick: closeDeleteAgentUsageDialog,
            },
            {
              key: 'delete',
              text: deleteAgentUsageLoading ? '删除中...' : '删除',
              bold: true,
              disabled: deleteAgentUsageLoading,
              style: { color: '#1f2329' },
              onClick: confirmDeleteAgentUsageLog,
            },
          ],
        ]}
      />

      <Dialog
        visible={Boolean(deleteTargetSession)}
        content="确认删除后将无法恢复，是否继续？"
        closeOnAction={false}
        closeOnMaskClick={!deleteSessionLoading}
        onClose={closeDeleteSessionDialog}
        actions={[
          [
            {
              key: 'cancel-session-delete',
              text: '取消',
              disabled: deleteSessionLoading,
              style: { color: '#1f2329' },
              onClick: closeDeleteSessionDialog,
            },
            {
              key: 'confirm-session-delete',
              text: deleteSessionLoading ? '删除中...' : '删除',
              bold: true,
              disabled: deleteSessionLoading,
              style: { color: '#1f2329' },
              onClick: confirmDeleteSession,
            },
          ],
        ]}
      />
    </div>
  )
}
