import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dialog, Switch, Toast } from 'antd-mobile'
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
  fetchKnowledgeSpaces,
  fetchLibraryFiles,
  type KnowledgeSpaceOption,
  type LibraryFileDetail,
  type LibraryPageFileItem,
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
  addOfficialSkill,
  buildSkillDisplayName,
  buildSkillInitialPrompt,
  deleteCreatedSkill,
  fetchAddedSkills,
  fetchClawhubSkills,
  fetchCreatedSkills,
  fetchUserSkills,
  fetchOfficialSkills,
  installClawhubSkill,
  removeAddedSkill,
  searchClawhubSkills,
  type SkillSummaryItem,
} from '../../services/skills'
import { viewCustomAgent, type CustomAgentDetail } from '../../services/customAgents'
import { AiConversationThread } from './components/AiConversationThread'
import {
  AiAgentConfigPage,
  createEmptyAiAgentConfigDraft,
  type AiAgentConfigDraft,
  type AiAgentPublishSuccessPayload,
} from './components/AiAgentConfigPage'
import { AiAgentUsageList } from './components/AiAgentUsageList'
import { AiCustomAgentConversationPage } from './components/AiCustomAgentConversationPage'
import { AiCustomAgentDetailSheet } from './components/AiCustomAgentDetailSheet'
import AiCommandsPage, { type AiCommandsPageTabKey } from './components/AiCommandsPage'
import { AiConversationHeaderActions } from './components/AiConversationHeaderActions'
import { AiCreateAgentModal } from './components/AiCreateAgentModal'
import { AiDiscoverPage } from './components/AiDiscoverPage'
import { AiDrawerSessionGroup } from './components/AiDrawerSessionGroup'
import AiLibraryFilePreview from './components/AiLibraryFilePreview'
import { AiManageSkillCard } from './components/AiManageSkillCard'
import { AI_DRAWER_MENU_ITEMS, renderAiDrawerMenuIcon } from './components/AiDrawerMenuIcons'
import { AiNameAvatar } from './components/AiNameAvatar'
import AiSidebarLibraryPage from './components/AiSidebarLibraryPage'
import AiSkillDetailPage from './components/AiSkillDetailPage'
import { resolveArtifactPreviewUrl, useAiChatRuntime, type ActiveAgentContext } from './hooks/useAiChatRuntime'
import {
  normalizeSessionArtifactPreviewFilePath,
  normalizeSessionArtifactPreviewFileType,
} from './utils/sessionArtifactPreview'
import {
  MAX_LOCAL_DOCUMENT_ATTACHMENTS,
  planLocalFilesForUpload,
} from './utils/localUploadPolicy'
import { filterSkillItems, getSkillCardTags } from './utils/skillDisplay'
import AppComposerInput from '../../components/AppComposerInput'
import DisplayName from '../../components/DisplayName'
import { APP_ROUTE_PATHS } from '../../routes'
import '../Library/index.css'
import './index.css'

const LUCKY_AVATAR_URL = 'https://guoren-skills-hb-test.oss-cn-beijing.aliyuncs.com/system/images/avatar/73799dbfdc2c495c8c0e1d86ffd2bf23.png'
const BRAND_NAME = 'lucky'
const AUTO_SCROLL_RESUME_THRESHOLD = 48

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
const SKILL_COMMUNITY_PAGE_SIZE = 10
const SKILL_CREATOR_TOOL_TYPE = 'skill-creator'
const SKILL_CREATOR_INITIAL_PROMPT = '/skill-creator 帮我创建一个技能：/技能描述'

function getFeatureCardColor(index: number): string {
  return featureCardColors[index % featureCardColors.length]
}

function isScrollerNearBottom(scroller: HTMLDivElement): boolean {
  return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= AUTO_SCROLL_RESUME_THRESHOLD
}

function buildAgentContextFromDetail(detail: CustomAgentDetail): ActiveAgentContext {
  return {
    agentId: detail.agent_id,
    agentName: detail.agent_name,
    description: detail.description,
  }
}

function buildAgentUsageLogEntry(
  agentId: string,
  userId: string,
  agentName: string,
  avatarUrl: string | null,
): AgentUsageLog {
  return {
    agentId,
    userId,
    agentName,
    avatarUrl,
    usedAt: new Date().toISOString(),
  }
}

function buildCustomAgentConversationQuestions(detail: CustomAgentDetail) {
  return detail.preset_questions.map((item, index) => ({
    id: `custom-agent-question-${detail.agent_id}-${index}`,
    question: item.question,
    instruction: item.instruction?.trim() || item.question,
  }))
}

function buildCustomAgentDetailSkills(detail: CustomAgentDetail) {
  return detail.enabled_skills.map((skill, index) => ({
    id: skill.skill_name || `custom-agent-skill-${detail.agent_id}-${index}`,
    title: skill.chinese_name?.trim() || skill.skill_name,
    description: skill.description?.trim() || '',
  }))
}

function buildConfigDraftFromCustomAgentDetail(detail: CustomAgentDetail): AiAgentConfigDraft {
  return createEmptyAiAgentConfigDraft({
    agentName: detail.agent_name,
    description: detail.description,
    instruction: detail.agent_prompt,
    webSearchEnabled: detail.enable_web_search === true,
    publishScope: detail.publish_scope ?? (detail.is_public ? 'public' : 'private'),
    selectedUsers: Array.isArray(detail.authorized_user_ids)
      ? detail.authorized_user_ids.map((userId) => ({
          id: userId,
          realname: userId,
        }))
      : [],
    selectedSkills: detail.enabled_skills.map((skill, index) => ({
      id: skill.skill_name || `custom-agent-skill-${index}`,
      skillName: skill.skill_name,
      title: skill.chinese_name?.trim() || skill.skill_name,
      description: skill.description?.trim() || '',
      source: 'added',
      tags: [],
    })),
    knowledgeSpaces: detail.knowledge_spaces.map((space) => ({
      id: space.id,
      name: space.spaceName,
    })),
    presetQuestions: detail.preset_questions.map((item, index) => ({
      id: `custom-agent-preset-${detail.agent_id}-${index}`,
      category: item.category,
      question: item.question,
      instruction: item.instruction?.trim() || item.question,
    })),
  })
}

function buildDetailFromConfigDraft(
  detail: CustomAgentDetail | null,
  draft: AiAgentConfigDraft,
  payload: AiAgentPublishSuccessPayload,
): CustomAgentDetail {
  return {
    agent_id: payload.agentId,
    creator_user_id: detail?.creator_user_id ?? '',
    agent_name: payload.agentName,
    description: payload.description,
    avatar_url: payload.avatarUrl,
    agent_prompt: draft.instruction.trim(),
    enabled_skills: draft.selectedSkills.map((skill) => ({
      skill_name: skill.skillName,
      chinese_name: skill.title,
      description: skill.description,
      source: skill.source,
    })),
    knowledge_spaces: draft.knowledgeSpaces.map((space) => ({
      id: space.id,
      spaceName: space.name,
    })),
    preset_questions: draft.presetQuestions.map((item) => ({
      category: item.category,
      question: item.question,
      instruction: item.instruction,
    })),
    enable_web_search: draft.webSearchEnabled === true,
    is_active: detail?.is_active ?? true,
    is_public: draft.publishScope === 'public',
    publish_scope: draft.publishScope,
    authorized_user_ids: draft.publishScope === 'specified'
      ? draft.selectedUsers.map((user) => user.id)
      : [],
    created_at: detail?.created_at ?? '',
    updated_at: new Date().toISOString(),
  }
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

type PartnerWorkspaceFileKey = 'SOUL.md' | 'USER.md' | 'IDENTITY.md'

const PARTNER_WORKSPACE_FIELDS: Array<{ label: PartnerWorkspaceFileKey; field: keyof PartnerConfig }> = [
  { label: 'SOUL.md', field: 'soulContent' },
  { label: 'USER.md', field: 'userContent' },
  { label: 'IDENTITY.md', field: 'identityContent' },
]

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
  const normalizedFilePath = normalizeSessionArtifactPreviewFilePath(artifact)
  const fileType = normalizeSessionArtifactPreviewFileType(artifact)
  const previewUrl = artifact.url.startsWith('http')
    ? artifact.url
    : (sessionId ? resolveArtifactPreviewUrl(sessionId, artifact) : '')
  const item: LibraryPageFileItem = {
    fileId: `artifact:${sessionId ?? 'local'}:${artifact.filename}:${artifact.url}`,
    fileName: artifact.filename,
    agentName: artifact.skill_name || '会话结果',
    fileType,
    filePath: normalizedFilePath,
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

export default function AIPage({ onClose }: { onClose: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isPartnerRoute = location.pathname === APP_ROUTE_PATHS.partner
  const [showDrawer, setShowDrawer] = useState(false)
  const [showPlusSheet, setShowPlusSheet] = useState(false)
  const [showSkillsPage, setShowSkillsPage] = useState(false)
  const [showSkillSelectorPage, setShowSkillSelectorPage] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showLibraryPage, setShowLibraryPage] = useState(false)
  const [showSidebarLibrary, setShowSidebarLibrary] = useState(false)
  const [showDiscoverPage, setShowDiscoverPage] = useState(false)
  const [showCustomAgentConversationPage, setShowCustomAgentConversationPage] = useState(false)
  const [showAgentConfigPage, setShowAgentConfigPage] = useState(false)
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false)
  const [showCommandsPage, setShowCommandsPage] = useState(false)
  const [commandsPageTab, setCommandsPageTab] = useState<AiCommandsPageTabKey>('best-practice')
  const [showMySkillsPage, setShowMySkillsPage] = useState(false)
  const [mySkillsTab, setMySkillsTab] = useState<'added' | 'created'>('added')
  const [showCreateSkillSheet, setShowCreateSkillSheet] = useState(false)
  const [libraryTab, setLibraryTab] = useState<'personal' | 'org'>('personal')
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([])
  const [selectedOrgSpaceId, setSelectedOrgSpaceId] = useState('')
  const [showOrgSpacePicker, setShowOrgSpacePicker] = useState(false)
  const [featureCards, setFeatureCards] = useState<CommandPromptItem[]>(fallbackFeatureCards)
  const [commandsData, setCommandsData] = useState<CommandsData>(EMPTY_COMMANDS_DATA)
  const [commandsLoading, setCommandsLoading] = useState(false)
  const [commandsError, setCommandsError] = useState('')
  const [skillSearchValue, setSkillSearchValue] = useState('')
  const [featuredGroupIndex, setFeaturedGroupIndex] = useState(0)
  const [clawhubGroupIndex, setClawhubGroupIndex] = useState(0)
  const [skillSelectorSearchValue, setSkillSelectorSearchValue] = useState('')
  const [debouncedSkillSearchValue, setDebouncedSkillSearchValue] = useState('')
  const [mySkillSearchValue, setMySkillSearchValue] = useState('')
  const [officialSkills, setOfficialSkills] = useState<SkillSummaryItem[]>([])
  const [communitySkills, setCommunitySkills] = useState<SkillSummaryItem[]>([])
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<SkillSummaryItem | null>(null)
  const [skillDetailReturnTarget, setSkillDetailReturnTarget] = useState<'community' | 'my-skills'>('community')
  const [skillActionLoadingId, setSkillActionLoadingId] = useState<string | null>(null)
  const [removeSkillLoadingId, setRemoveSkillLoadingId] = useState<string | null>(null)
  const [deleteTargetManageSkill, setDeleteTargetManageSkill] = useState<SkillSummaryItem | null>(null)
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
  const [filePickerMode, setFilePickerMode] = useState<'all' | 'image'>('all')
  const [showPartnerSettings, setShowPartnerSettings] = useState(false)
  const [partnerConfig, setPartnerConfig] = useState<PartnerConfig | null>(null)
  const [partnerDraft, setPartnerDraft] = useState<PartnerConfig | null>(null)
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [partnerError, setPartnerError] = useState('')
  const [partnerSaving, setPartnerSaving] = useState(false)
  const [partnerAvatarUploading, setPartnerAvatarUploading] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(true)
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null)
  const [agentConfigDraft, setAgentConfigDraft] = useState<AiAgentConfigDraft>(() => createEmptyAiAgentConfigDraft())
  const [agentConfigMode, setAgentConfigMode] = useState<'create' | 'edit'>('create')
  const [agentConfigAgentId, setAgentConfigAgentId] = useState('')
  const [agentConfigAvatarUrl, setAgentConfigAvatarUrl] = useState<string | null>(null)
  const [agentConfigReturnTarget, setAgentConfigReturnTarget] = useState<'default' | 'custom-conversation' | 'main-conversation'>('default')
  const [customAgentConversationDetail, setCustomAgentConversationDetail] = useState<CustomAgentDetail | null>(null)
  const [customAgentConversationLoading, setCustomAgentConversationLoading] = useState(false)
  const [customAgentConversationError, setCustomAgentConversationError] = useState('')
  const [currentConversationCustomAgentDetail, setCurrentConversationCustomAgentDetail] = useState<CustomAgentDetail | null>(null)
  const [showCurrentConversationCustomAgentDetailSheet, setShowCurrentConversationCustomAgentDetailSheet] = useState(false)

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
  const autoScrollEnabledRef = useRef(true)
  const lastRouteSessionIdRef = useRef<string | null>(routeSessionId)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const partnerAvatarInputRef = useRef<HTMLInputElement | null>(null)
  const uploadAbortControllersRef = useRef<Map<string, AbortController>>(new Map())
  const customAgentConversationAbortRef = useRef<AbortController | null>(null)
  const currentConversationCustomAgentAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!localBannerMessage) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setLocalBannerMessage('')
    }, 4000)

    return () => window.clearTimeout(timer)
  }, [localBannerMessage])

  const hasConversation = messages.length > 0 || Boolean(routeSessionId)
  const currentRouteSession = useMemo(() => (
    routeSessionId ? sessions.find((session) => session.session_id === routeSessionId) ?? null : null
  ), [routeSessionId, sessions])
  const groupedSessions = useMemo(() => groupChatSessionsByTime(sessions), [sessions])
  const hasGroupedSessions = groupedSessions.today.length > 0
    || groupedSessions.within7Days.length > 0
    || groupedSessions.beyond7Days.length > 0
  // 单次会话的本地文档解析上限要跨轮次累计，不能只看当前输入框草稿。
  const currentConversationAttachments = useMemo(() => (
    [
      ...messages.flatMap((message) => message.attachments),
      ...draftAttachments,
    ]
  ), [draftAttachments, messages])

  const builtInAgent = useMemo(() => {
    const agentName = partnerConfig?.agentName?.trim() || '建国'

    return {
      id: 'partner',
      name: agentName,
      avatarUrl: partnerConfig?.avatarUrl?.trim() || '',
    }
  }, [partnerConfig])
  const headerTitle = currentRouteSession?.session_name?.trim() || ''
  const customAgentConversationHeaderTitle = currentRouteSession?.session_name?.trim()
    || customAgentConversationDetail?.agent_name
    || activeAgent?.agentName
    || ''
  const currentConversationCustomAgentId = currentRouteSession?.agent_id?.trim() || activeAgent?.agentId || ''
  const currentConversationCustomAgentName = currentConversationCustomAgentDetail?.agent_name
    || currentRouteSession?.agent_info?.agent_name?.trim()
    || activeAgent?.agentName
    || ''
  const currentConversationCustomAgentAvatarUrl = currentConversationCustomAgentDetail?.avatar_url
    || currentRouteSession?.agent_info?.avatar_url
    || null
  const currentConversationCustomAgentDescription = currentConversationCustomAgentDetail?.description
    || activeAgent?.description
    || ''
  const groupedDiscoverAgents = useMemo(() => groupVisibleAgents(visibleAgents, currentUserId), [currentUserId, visibleAgents])
  const customAgentConversationQuestions = useMemo(() => (
    customAgentConversationDetail ? buildCustomAgentConversationQuestions(customAgentConversationDetail) : []
  ), [customAgentConversationDetail])
  const currentConversationCustomAgentQuestions = useMemo(() => (
    currentConversationCustomAgentDetail ? buildCustomAgentConversationQuestions(currentConversationCustomAgentDetail) : []
  ), [currentConversationCustomAgentDetail])
  const currentConversationCustomAgentSkills = useMemo(() => (
    currentConversationCustomAgentDetail ? buildCustomAgentDetailSkills(currentConversationCustomAgentDetail) : []
  ), [currentConversationCustomAgentDetail])
  const canEditCustomAgentConversation = useMemo(() => (
    Boolean(customAgentConversationDetail && customAgentConversationDetail.creator_user_id === currentUserId)
  ), [currentUserId, customAgentConversationDetail])
  const canEditCurrentConversationCustomAgent = useMemo(() => (
    Boolean(currentConversationCustomAgentDetail && currentConversationCustomAgentDetail.creator_user_id === currentUserId)
  ), [currentConversationCustomAgentDetail, currentUserId])
  const isAiMainPageVisible = !showDrawer
    && !showSidebarLibrary
    && !showDiscoverPage
    && !showCustomAgentConversationPage
    && !showSkillsPage
    && !showMySkillsPage
    && !showSkillSelectorPage
    && !showLibraryPage
    && !showAgentConfigPage
    && !showCreateAgentModal
    && !showCommandsPage
    && !showPartnerSettings
    && !selectedArtifact
  const canShowCurrentConversationCustomAgentActions = Boolean(currentConversationCustomAgentId)
    && isAiMainPageVisible
    && !showCustomAgentConversationPage
  const canDeleteCurrentSession = Boolean(currentRouteSession) && !isPartnerRoute && isAiMainPageVisible
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
    { key: 'folder', label: '选取文件', icon: 'folder' },
  ]

  const openSkillsPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setSkillSearchValue('')
    setSelectedSkillDetail(null)
    setShowSidebarLibrary(false)
    setShowDiscoverPage(false)
    setShowMySkillsPage(false)
    setShowSkillSelectorPage(false)
    setShowAgentConfigPage(false)
    setShowCreateAgentModal(false)
    setShowDrawer(false)
    setShowSkillsPage(true)
  }

  const handleCreateSkillByChat = () => {
    setShowCreateSkillSheet(false)
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setShowSkillsPage(false)
    setShowMySkillsPage(false)
    setShowSkillSelectorPage(false)
    setShowAgentConfigPage(false)
    setShowCreateAgentModal(false)
    setSelectedSkillDetail(null)
    setInputValue(SKILL_CREATOR_INITIAL_PROMPT)
    setActiveToolType(SKILL_CREATOR_TOOL_TYPE)
    setSelectedSkillName(SKILL_CREATOR_TOOL_TYPE)
  }

  const openSkillSelectorPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setSkillSelectorSearchValue('')
    setShowAgentConfigPage(false)
    setShowCreateAgentModal(false)
    setShowSkillSelectorPage(true)
  }

  const openLibraryPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setShowOrgSpacePicker(false)
    setLibrarySearchValue('')
    setSelectedLibraryIds([])
    setShowAgentConfigPage(false)
    setShowCreateAgentModal(false)
    setShowLibraryPage(true)
  }

  const openSidebarLibraryPage = () => {
    setShowDrawer(false)
    setShowDiscoverPage(false)
    setShowSkillsPage(false)
    setShowMySkillsPage(false)
    setShowAgentConfigPage(false)
    setShowCreateAgentModal(false)
    setShowSidebarLibrary(true)
  }

  // 从抽屉切回会话页时，需要把当前全屏页一起收起，否则视觉上会停留在原页面。
  const closeNavigationOverlays = () => {
    setShowDrawer(false)
    setShowSidebarLibrary(false)
    setShowDiscoverPage(false)
    setShowCustomAgentConversationPage(false)
    setShowSkillsPage(false)
    setShowMySkillsPage(false)
    setShowSkillSelectorPage(false)
    setShowLibraryPage(false)
    setShowAgentConfigPage(false)
    setShowCreateAgentModal(false)
  }

  const openPartnerPage = () => {
    setShowDrawer(false)
    setShowDiscoverPage(false)
    setShowCustomAgentConversationPage(false)
    setShowSkillsPage(false)
    setShowSidebarLibrary(false)
    setShowAgentConfigPage(false)
    setShowCreateAgentModal(false)
    clearActiveAgent()
    startNewChat()
    navigate(APP_ROUTE_PATHS.partner)
  }

  useEffect(() => {
    return () => {
      customAgentConversationAbortRef.current?.abort()
      currentConversationCustomAgentAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!canShowCurrentConversationCustomAgentActions) {
      setShowCurrentConversationCustomAgentDetailSheet(false)
    }
  }, [canShowCurrentConversationCustomAgentActions])

  useEffect(() => {
    currentConversationCustomAgentAbortRef.current?.abort()

    if (!currentConversationCustomAgentId || !canShowCurrentConversationCustomAgentActions) {
      setCurrentConversationCustomAgentDetail(null)
      return undefined
    }

    if (currentConversationCustomAgentDetail?.agent_id === currentConversationCustomAgentId) {
      return undefined
    }

    const controller = new AbortController()
    currentConversationCustomAgentAbortRef.current = controller

    void viewCustomAgent(currentConversationCustomAgentId, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) {
          setCurrentConversationCustomAgentDetail(detail)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setCurrentConversationCustomAgentDetail(null)
          console.warn('[ai-page] 当前会话智能体详情加载失败：', error)
        }
      })

    return () => {
      controller.abort()
    }
  }, [
    canShowCurrentConversationCustomAgentActions,
    currentConversationCustomAgentDetail?.agent_id,
    currentConversationCustomAgentId,
  ])

  const openAgentConfigPage = (
    initialDraft?: Partial<AiAgentConfigDraft>,
    options: {
      mode?: 'create' | 'edit'
      agentId?: string
      avatarUrl?: string | null
      returnTarget?: 'default' | 'custom-conversation' | 'main-conversation'
    } = {},
  ) => {
    setAgentConfigDraft(createEmptyAiAgentConfigDraft(initialDraft))
    setAgentConfigMode(options.mode ?? 'create')
    setAgentConfigAgentId(options.agentId ?? '')
    setAgentConfigAvatarUrl(options.avatarUrl ?? null)
    setAgentConfigReturnTarget(options.returnTarget ?? 'default')
    setShowCreateAgentModal(false)
    setShowAgentConfigPage(true)
  }

  const refreshVisibleAgents = useCallback(async (signal?: AbortSignal) => {
    setDiscoverLoading(true)
    setDiscoverError('')

    try {
      setVisibleAgents(await listVisibleAgents({ limit: 100, skip: 0, signal }))
    } catch (error) {
      if (!signal?.aborted) {
        setDiscoverError(error instanceof Error ? error.message : '智能体列表加载失败')
      }
    } finally {
      if (!signal?.aborted) {
        setDiscoverLoading(false)
      }
    }
  }, [])

  const refreshAgentUsageLogs = useCallback(async (signal?: AbortSignal) => {
    setAgentUsageLogsLoading(true)
    setAgentUsageLogsError('')

    try {
      setAgentUsageLogs(await getAgentUsageLogs(signal))
    } catch (error) {
      if (!signal?.aborted) {
        setAgentUsageLogs([])
        setAgentUsageLogsError(error instanceof Error ? error.message : '智能体使用记录加载失败')
      }
    } finally {
      if (!signal?.aborted) {
        setAgentUsageLogsLoading(false)
      }
    }
  }, [])

  const handleAgentPublishSuccess = useCallback(async (payload: AiAgentPublishSuccessPayload) => {
    let createdUsageLog = false

    try {
      createdUsageLog = await ensureAgentUsageLog(payload.agentId)
    } catch (error) {
      console.warn('[ai-page] 发布后补写智能体使用记录失败：', error)
    }

    setAgentUsageLogs((current) => {
      const nextEntry = buildAgentUsageLogEntry(
        payload.agentId,
        currentUserId,
        payload.agentName,
        payload.avatarUrl || null,
      )

      if (createdUsageLog || !current.some((item) => item.agentId === payload.agentId)) {
        return [nextEntry, ...current.filter((item) => item.agentId !== payload.agentId)]
      }

      return current.map((item) => item.agentId === payload.agentId ? nextEntry : item)
    })

    setVisibleAgents((current) => current.map((item) => (
      item.agentId === payload.agentId
        ? {
            ...item,
            agentName: payload.agentName,
            description: payload.description,
            avatarUrl: payload.avatarUrl || null,
          }
        : item
    )))

    activateAgent({
      agentId: payload.agentId,
      agentName: payload.agentName,
      description: payload.description,
    })

    if (agentConfigReturnTarget === 'custom-conversation') {
      setShowAgentConfigPage(false)
      setAgentConfigReturnTarget('default')

      if (payload.mode === 'edit') {
        setCustomAgentConversationDetail((current) => buildDetailFromConfigDraft(current, agentConfigDraft, payload))
        setLocalBannerMessage('智能体已保存。')
      } else {
        setLocalBannerMessage('智能体已发布，可继续对话。')
        void openCustomAgentConversation({
          agentId: payload.agentId,
        })
      }

      void refreshVisibleAgents()

      if (showDrawer) {
        void refreshAgentUsageLogs()
      }

      return
    }

    if (agentConfigReturnTarget === 'main-conversation') {
      const nextDetail = buildDetailFromConfigDraft(currentConversationCustomAgentDetail, agentConfigDraft, payload)

      setShowAgentConfigPage(false)
      setAgentConfigReturnTarget('default')
      setShowCurrentConversationCustomAgentDetailSheet(false)
      setCurrentConversationCustomAgentDetail(nextDetail)
      setLocalBannerMessage(payload.mode === 'edit' ? '智能体已更新。' : '智能体已发布，可继续对话。')

      if (payload.mode === 'create') {
        startNewChat({ keepAgent: true })
      }

      void refreshVisibleAgents()

      if (showDrawer) {
        void refreshAgentUsageLogs()
      }

      return
    }

    startNewChat({ keepAgent: true })
    setShowCreateAgentModal(false)
    setShowAgentConfigPage(false)
    setAgentConfigReturnTarget('default')
    setLocalBannerMessage(payload.mode === 'edit' ? '智能体已更新。' : '智能体已发布，可继续对话。')

    void refreshVisibleAgents()

    if (showDrawer) {
      void refreshAgentUsageLogs()
    }
  }, [
    activateAgent,
    agentConfigDraft,
    agentConfigReturnTarget,
    currentConversationCustomAgentDetail,
    currentUserId,
    refreshAgentUsageLogs,
    refreshVisibleAgents,
    showDrawer,
    startNewChat,
  ])

  const openLocalFilePicker = (mode: 'all' | 'image') => {
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

    if (validFiles.length === 0) {
      return
    }

    const { filesToUpload, exceededParsedLimit } = planLocalFilesForUpload(validFiles, currentConversationAttachments)

    if (filesToUpload.length === 0) {
      if (exceededParsedLimit) {
        setLocalBannerMessage(`单次对话最多解析 ${MAX_LOCAL_DOCUMENT_ATTACHMENTS} 个本地文档，超出的文档已忽略。`)
      }
      return
    }

    if (exceededParsedLimit) {
      setLocalBannerMessage(`单次对话最多解析 ${MAX_LOCAL_DOCUMENT_ATTACHMENTS} 个本地文档，超出的文档已忽略。`)
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
    setShowPartnerSettings(true)
  }

  const closePartnerSettings = () => {
    if (partnerSaving || partnerAvatarUploading) {
      return
    }

    setShowPartnerSettings(false)
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

    if (!partnerDraft.agentName.trim()) {
      setPartnerError('请先填写伙伴名称')
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

  const filteredOfficialSkills = useMemo(() => {
    return filterSkillItems(officialSkills, skillSearchValue)
  }, [officialSkills, skillSearchValue])
  const featuredSkills = useMemo(() => {
    const startIndex = featuredGroupIndex * SKILL_COMMUNITY_PAGE_SIZE

    return filteredOfficialSkills.slice(startIndex, startIndex + SKILL_COMMUNITY_PAGE_SIZE)
  }, [featuredGroupIndex, filteredOfficialSkills])
  const filteredClawhubSkills = useMemo(() => {
    return filterSkillItems(communitySkills, skillSearchValue)
  }, [communitySkills, skillSearchValue])
  const visibleClawhubSkills = useMemo(() => {
    const startIndex = clawhubGroupIndex * SKILL_COMMUNITY_PAGE_SIZE

    return filteredClawhubSkills.slice(startIndex, startIndex + SKILL_COMMUNITY_PAGE_SIZE)
  }, [clawhubGroupIndex, filteredClawhubSkills])
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
    { key: 'collaboration', title: '共创', items: groupedDiscoverAgents.collaboration },
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
    const totalGroups = Math.ceil(filteredOfficialSkills.length / SKILL_COMMUNITY_PAGE_SIZE)

    if (totalGroups === 0) {
      if (featuredGroupIndex !== 0) {
        setFeaturedGroupIndex(0)
      }
      return
    }

    if (featuredGroupIndex >= totalGroups) {
      setFeaturedGroupIndex(0)
    }
  }, [featuredGroupIndex, filteredOfficialSkills.length])

  useEffect(() => {
    const totalGroups = Math.ceil(filteredClawhubSkills.length / SKILL_COMMUNITY_PAGE_SIZE)

    if (totalGroups === 0) {
      if (clawhubGroupIndex !== 0) {
        setClawhubGroupIndex(0)
      }
      return
    }

    if (clawhubGroupIndex >= totalGroups) {
      setClawhubGroupIndex(0)
    }
  }, [clawhubGroupIndex, filteredClawhubSkills.length])

  useEffect(() => {
    setFeaturedGroupIndex(0)
    setClawhubGroupIndex(0)
  }, [skillSearchValue])

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
    const scroller = scrollerRef.current

    if (!scroller || !autoScrollEnabledRef.current) {
      return
    }

    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    const scroller = scrollerRef.current

    if (!scroller) {
      return
    }

    // 用户主动把列表滚离底部后，暂停流式回复的自动跟随；滚回到底部再恢复。
    const handleScroll = () => {
      autoScrollEnabledRef.current = isScrollerNearBottom(scroller)
    }

    scroller.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scroller.removeEventListener('scroll', handleScroll)
    }
  }, [routeSessionId])

  useEffect(() => {
    if (lastRouteSessionIdRef.current !== routeSessionId) {
      autoScrollEnabledRef.current = true
      lastRouteSessionIdRef.current = routeSessionId
    }
  }, [routeSessionId])

  useEffect(() => {
    if (messages.length === 0) {
      autoScrollEnabledRef.current = true
    }
  }, [messages.length])

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

  const handleRefreshFeatured = useCallback(() => {
    const totalGroups = Math.ceil(filteredOfficialSkills.length / SKILL_COMMUNITY_PAGE_SIZE)

    if (totalGroups > 1) {
      setFeaturedGroupIndex((current) => (current + 1) % totalGroups)
    }
  }, [filteredOfficialSkills.length])

  const handleRefreshClawhub = useCallback(() => {
    const totalGroups = Math.ceil(filteredClawhubSkills.length / SKILL_COMMUNITY_PAGE_SIZE)

    if (totalGroups > 1) {
      setClawhubGroupIndex((current) => (current + 1) % totalGroups)
    }
  }, [filteredClawhubSkills.length])

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
    void refreshAgentUsageLogs(controller.signal)

    return () => {
      controller.abort()
    }
  }, [refreshAgentUsageLogs, showDrawer])

  useEffect(() => {
    const controller = new AbortController()
    void refreshVisibleAgents(controller.signal)

    return () => {
      controller.abort()
    }
  }, [refreshVisibleAgents])

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
    setSelectedSkillDetail(null)
  }

  const openOfficialSkillDetail = (skill: SkillSummaryItem) => {
    setSkillDetailReturnTarget('community')
    setSelectedSkillDetail({
      ...skill,
      source: 'official',
    })
  }

  const openClawhubSkillDetail = (skill: SkillSummaryItem) => {
    setSkillDetailReturnTarget('community')
    setSelectedSkillDetail({
      ...skill,
      source: 'clawhub',
    })
  }

  const openManageSkillDetail = (skill: SkillSummaryItem) => {
    setShowMySkillsPage(false)
    setSkillDetailReturnTarget('my-skills')
    setSelectedSkillDetail({
      ...skill,
      isSelected: true,
    })
  }

  const closeSkillDetailPage = () => {
    setSelectedSkillDetail(null)

    if (skillDetailReturnTarget === 'my-skills') {
      setShowMySkillsPage(true)
    }

    setSkillDetailReturnTarget('community')
  }

  const markSkillSelected = (skill: SkillSummaryItem) => {
    const resolvedSkillName = skill.skillName || skill.id

    const applySelection = (items: SkillSummaryItem[]) => items.map((item) => {
      const currentSkillName = item.skillName || item.id

      if (currentSkillName !== resolvedSkillName) {
        return item
      }

      return {
        ...item,
        isSelected: true,
      }
    })

    setOfficialSkills(applySelection)
    setCommunitySkills(applySelection)
    setAddedSkills(applySelection)
    setUserSkills(applySelection)
    setSelectedSkillDetail((current) => {
      if (!current) {
        return current
      }

      const currentSkillName = current.skillName || current.id

      if (currentSkillName !== resolvedSkillName) {
        return current
      }

      return {
        ...current,
        isSelected: true,
      }
    })
  }

  const handleSkillDetailAction = async (skill: SkillSummaryItem) => {
    if (skillActionLoadingId === skill.id) {
      return
    }

    if (skill.isSelected) {
      applySkillItem(skill)
      return
    }

    const resolvedSkillName = skill.skillName || skill.id

    if (!resolvedSkillName) {
      return
    }

    setSkillActionLoadingId(skill.id)

    try {
      if (skill.source === 'clawhub') {
        await installClawhubSkill(resolvedSkillName)
      } else {
        await addOfficialSkill(resolvedSkillName)
      }

      markSkillSelected({
        ...skill,
        isSelected: true,
      })
      Toast.show({ content: '添加成功' })
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '添加技能失败' })
    } finally {
      setSkillActionLoadingId(null)
    }
  }

  const handleRemoveManageSkill = async (skill: SkillSummaryItem) => {
    if (removeSkillLoadingId === skill.id) {
      return
    }

    const resolvedSkillName = skill.skillName || skill.id

    if (!resolvedSkillName) {
      return
    }

    setRemoveSkillLoadingId(skill.id)

    try {
      if (skill.source === 'created') {
        await deleteCreatedSkill(resolvedSkillName)
        setCreatedSkills(await fetchCreatedSkills())
      } else {
        await removeAddedSkill(resolvedSkillName)
        setAddedSkills(await fetchAddedSkills())
      }
    } finally {
      setRemoveSkillLoadingId(null)
    }
  }

  const openDeleteManageSkillDialog = (skill: SkillSummaryItem) => {
    setDeleteTargetManageSkill(skill)
  }

  const closeDeleteManageSkillDialog = () => {
    if (removeSkillLoadingId) {
      return
    }

    setDeleteTargetManageSkill(null)
  }

  const confirmDeleteManageSkill = async () => {
    const skill = deleteTargetManageSkill

    if (!skill) {
      return
    }

    try {
      setMySkillsError('')
      await handleRemoveManageSkill(skill)
      setDeleteTargetManageSkill(null)
    } catch (error) {
      setMySkillsError(error instanceof Error ? error.message : skill.source === 'created' ? '删除技能失败' : '移除技能失败')
    }
  }

  const openCustomAgentConversation = async (
    params: {
      agentId: string
    },
  ) => {
    customAgentConversationAbortRef.current?.abort()
    const controller = new AbortController()
    customAgentConversationAbortRef.current = controller

    closeNavigationOverlays()
    setShowCustomAgentConversationPage(true)
    setCustomAgentConversationLoading(true)
    setCustomAgentConversationError('')
    setCustomAgentConversationDetail(null)

    let createdUsageLog = false

    try {
      const detail = await viewCustomAgent(params.agentId, controller.signal)

      if (!detail) {
        throw new Error('没有获取到智能体详情')
      }

      try {
        createdUsageLog = await ensureAgentUsageLog(detail.agent_id)
      } catch (error) {
        console.warn('[ai-page] 补写智能体使用记录失败：', error)
      }

      setAgentUsageLogs((current) => {
        const nextEntry = buildAgentUsageLogEntry(
          detail.agent_id,
          currentUserId,
          detail.agent_name,
          detail.avatar_url || null,
        )

        if (createdUsageLog || !current.some((item) => item.agentId === detail.agent_id)) {
          return [nextEntry, ...current.filter((item) => item.agentId !== detail.agent_id)]
        }

        return current.map((item) => item.agentId === detail.agent_id ? nextEntry : item)
      })

      setCustomAgentConversationDetail(detail)
      activateAgent(buildAgentContextFromDetail(detail))
      startNewChat({ keepAgent: true })
    } catch (error) {
      if (!controller.signal.aborted) {
        setCustomAgentConversationError(error instanceof Error ? error.message : '智能体详情加载失败')
      }
    } finally {
      if (!controller.signal.aborted) {
        setCustomAgentConversationLoading(false)
      }
    }
  }

  const openAgentChat = async (agent: DiscoverAgentItem) => {
    await openCustomAgentConversation({
      agentId: agent.agentId,
    })
  }

  const closeCustomAgentConversation = () => {
    customAgentConversationAbortRef.current?.abort()
    setShowCustomAgentConversationPage(false)
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setCustomAgentConversationDetail(null)
    setCustomAgentConversationError('')
    setCustomAgentConversationLoading(false)
    startNewChat()
  }

  const openCustomAgentConfigFromConversation = () => {
    if (!customAgentConversationDetail) {
      return
    }

    openAgentConfigPage(buildConfigDraftFromCustomAgentDetail(customAgentConversationDetail), {
      mode: 'edit',
      agentId: customAgentConversationDetail.agent_id,
      avatarUrl: customAgentConversationDetail.avatar_url || null,
      returnTarget: 'custom-conversation',
    })
  }

  const openCloneCurrentConversationCustomAgent = () => {
    if (!currentConversationCustomAgentDetail) {
      return
    }

    setShowCurrentConversationCustomAgentDetailSheet(false)
    openAgentConfigPage(buildConfigDraftFromCustomAgentDetail(currentConversationCustomAgentDetail), {
      mode: 'create',
      avatarUrl: currentConversationCustomAgentDetail.avatar_url || null,
      returnTarget: 'main-conversation',
    })
  }

  const openCurrentConversationCustomAgentConfig = () => {
    if (!currentConversationCustomAgentDetail) {
      return
    }

    setShowCurrentConversationCustomAgentDetailSheet(false)
    openAgentConfigPage(buildConfigDraftFromCustomAgentDetail(currentConversationCustomAgentDetail), {
      mode: 'edit',
      agentId: currentConversationCustomAgentDetail.agent_id,
      avatarUrl: currentConversationCustomAgentDetail.avatar_url || null,
      returnTarget: 'main-conversation',
    })
  }

  const startCurrentConversationWithCustomAgent = () => {
    setShowCurrentConversationCustomAgentDetailSheet(false)
    startNewChat({ keepAgent: true })
  }

  const openAgentUsageLogChat = (agent: AgentUsageLog) => {
    void openCustomAgentConversation({
      agentId: agent.agentId,
    })
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
        {headerTitle ? <div className="ai-page-header-title">{headerTitle}</div> : <div className="ai-page-header-spacer" />}
        <AiConversationHeaderActions
          showCustomAgentMoreAction={canShowCurrentConversationCustomAgentActions}
          showDeleteSessionAction={!canShowCurrentConversationCustomAgentActions && canDeleteCurrentSession}
          onClose={onClose}
          onDeleteSession={() => {
            if (!currentRouteSession) {
              return
            }

            openDeleteSessionDialog(currentRouteSession)
          }}
          onOpenCustomAgentDetail={() => setShowCurrentConversationCustomAgentDetailSheet(true)}
        />
      </div>

      {!hasConversation ? (
        <>
          <div className="ai-page-welcome">
            {isPartnerRoute ? (
              <>
                <h1>{builtInAgent.name} 已经准备好了</h1>
                <div className="ai-page-partner-intro">
                  <AiNameAvatar
                    ariaLabel={`${builtInAgent.name}头像`}
                    avatarUrl={builtInAgent.avatarUrl}
                    className="ai-page-partner-avatar"
                    imageClassName="ai-page-partner-avatar-image"
                    name={builtInAgent.name}
                    tone="white"
                  />
                  <div className="ai-page-partner-copy">
                    <div className="ai-page-partner-title">有想法就告诉我，我们一起把事情推进</div>
                    <div className="ai-page-partner-desc">你可以直接发问题、草稿或资料，我会陪你一起梳理思路、补全内容，再继续往下做。</div>
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
        {requestError ? <div className="ai-page-error-banner">{requestError}</div> : null}
        {!requestError && localBannerMessage ? <div className="ai-page-notice-banner">{localBannerMessage}</div> : null}
        {draftAttachments.length > 0 && (
          <div className="ai-page-draft-attachments">
            {draftAttachments.map((attachment) => (
              <div className="ai-page-draft-chip" key={attachment.id}>
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
                <button
                  aria-label={`${attachment.name} 删除附件`}
                  className="ai-page-draft-chip-remove"
                  type="button"
                  onClick={() => handleRemoveDraftAttachment(attachment.id)}
                >
                  x
                </button>
              </div>
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
          note="AI 生成内容可能有误，请核实重要信息"
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
          className="ai-hidden-file-input"
          multiple
          onChange={handleLocalFileChange}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {showCurrentConversationCustomAgentDetailSheet && currentConversationCustomAgentId ? (
        <AiCustomAgentDetailSheet
          agentName={currentConversationCustomAgentName}
          avatarUrl={currentConversationCustomAgentAvatarUrl}
          canEdit={canEditCurrentConversationCustomAgent}
          configuredSkills={currentConversationCustomAgentSkills}
          creatorUserId={currentConversationCustomAgentDetail?.creator_user_id || ''}
          description={currentConversationCustomAgentDescription}
          publishedAt={currentConversationCustomAgentDetail?.created_at || ''}
          questions={currentConversationCustomAgentQuestions}
          onClose={() => setShowCurrentConversationCustomAgentDetailSheet(false)}
          onOpenClone={openCloneCurrentConversationCustomAgent}
          onOpenEdit={openCurrentConversationCustomAgentConfig}
          onStartConversation={startCurrentConversationWithCustomAgent}
        />
      ) : null}

      {showPartnerSettings && (
        <div className="ai-partner-settings-overlay" onClick={closePartnerSettings}>
          <div className="ai-partner-settings-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="ai-partner-settings-handle" />
            <div className="ai-partner-settings-head">
              <div aria-hidden="true" className="ai-partner-settings-head-spacer" />
              <div className="ai-partner-settings-head-title">基础信息</div>
              <button className="ai-partner-settings-close" disabled={partnerSaving || partnerAvatarUploading} type="button" onClick={closePartnerSettings}>
                关闭
              </button>
            </div>

            {partnerLoading ? <div className="ai-partner-settings-status">配置加载中...</div> : null}
            {partnerError ? <div className="ai-partner-settings-status is-error">{partnerError}</div> : null}

            <div className="ai-partner-settings-body">
              <div className="ai-partner-settings-avatar-card">
                <AiNameAvatar
                  ariaLabel={`${partnerDraft?.agentName || builtInAgent.name}头像`}
                  avatarUrl={partnerDraft?.avatarUrl}
                  className="ai-partner-settings-avatar-preview"
                  imageClassName="ai-partner-settings-avatar-preview-image"
                  name={partnerDraft?.agentName || builtInAgent.name || '建'}
                  tone="white"
                />
                <div className="ai-partner-settings-avatar-meta">
                  <div className="ai-partner-settings-avatar-title">伙伴头像</div>
                  <div className="ai-partner-settings-avatar-desc">支持直接上传图片，保存后会同步更新伙伴头像。</div>
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
                <span className="ai-partner-settings-field-label">
                  伙伴名称
                  <span className="ai-partner-settings-label-required">*</span>
                </span>
                <input
                  className="ai-partner-settings-input"
                  disabled={partnerSaving || partnerAvatarUploading}
                  type="text"
                  value={partnerDraft?.agentName ?? builtInAgent.name}
                  onChange={(event) => updatePartnerDraftField('agentName', event.target.value)}
                />
              </label>
              {PARTNER_WORKSPACE_FIELDS.map(({ field, label }) => (
                <label className="ai-partner-settings-field" key={label}>
                  <span>{label}</span>
                  <textarea
                    className="ai-partner-settings-textarea"
                    disabled={partnerSaving}
                    value={partnerDraft?.[field] ?? ''}
                    onChange={(event) => updatePartnerDraftField(field, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="ai-partner-settings-actions">
              <button className="ai-partner-settings-btn" disabled={partnerSaving || partnerAvatarUploading} type="button" onClick={closePartnerSettings}>
                取消
              </button>
              <button className="ai-partner-settings-btn is-primary" disabled={partnerSaving || partnerLoading || partnerAvatarUploading || !partnerDraft?.agentName.trim()} type="button" onClick={() => { void savePartnerSettings() }}>
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
                  {AI_DRAWER_MENU_ITEMS.map((item) => (
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
                      <span className="ai-drawer-menu-icon">{renderAiDrawerMenuIcon(item.key)}</span>
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
                      <AiNameAvatar
                        ariaLabel={`${builtInAgent.name}头像`}
                        avatarUrl={builtInAgent.avatarUrl}
                        className="ai-drawer-agent-avatar"
                        imageClassName="ai-drawer-agent-avatar-image"
                        name={builtInAgent.name}
                        tone="white"
                      />
                      <span className="ai-drawer-agent-name">{builtInAgent.name}</span>
                    </button>
                  </div>

                  <div className="ai-drawer-section">
                    <div className="ai-drawer-section-title">自定义智能体</div>
                    <AiAgentUsageList
                      agents={agentUsageLogs}
                      error={agentUsageLogsError}
                      loading={agentUsageLogsLoading}
                      removingAgentIds={removingAgentIds}
                      onDeleteAgent={openDeleteAgentUsageDialog}
                      onOpenAgent={openAgentUsageLogChat}
                    />
                  </div>

                  <div className="ai-drawer-section">
                    <div className="ai-drawer-section-title">最近对话</div>
                    {isLoadingSessions ? (
                      <div className="ai-drawer-chat-empty">正在刷新会话…</div>
                    ) : !hasGroupedSessions ? (
                      <div className="ai-drawer-chat-empty">还没有历史会话</div>
                    ) : (
                      <>
                        <AiDrawerSessionGroup
                          activeSessionId={routeSessionId}
                          items={groupedSessions.today}
                          removingSessionIds={removingSessionIds}
                          title="今天"
                          onOpenSession={(sessionId) => {
                            openSession(sessionId)
                            closeNavigationOverlays()
                          }}
                        />
                        <AiDrawerSessionGroup
                          activeSessionId={routeSessionId}
                          items={groupedSessions.within7Days}
                          removingSessionIds={removingSessionIds}
                          title="7天内"
                          onOpenSession={(sessionId) => {
                            openSession(sessionId)
                            closeNavigationOverlays()
                          }}
                        />
                        <AiDrawerSessionGroup
                          activeSessionId={routeSessionId}
                          items={groupedSessions.beyond7Days}
                          removingSessionIds={removingSessionIds}
                          title="7天外"
                          onOpenSession={(sessionId) => {
                            openSession(sessionId)
                            closeNavigationOverlays()
                          }}
                        />
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
        <>
          {selectedSkillDetail ? (
            <AiSkillDetailPage
              actionLoading={skillActionLoadingId === selectedSkillDetail.id}
              onAction={handleSkillDetailAction}
              onBack={closeSkillDetailPage}
              skill={selectedSkillDetail}
            />
          ) : (
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
                  <div className="ai-skill-community-section-title">官方精选</div>
                  <button className="ai-skill-community-refresh" type="button" onClick={handleRefreshFeatured}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6" />
                      <path d="M2.5 12a9.5 9.5 0 0 1 16.5-6.5L21.5 8" />
                      <path d="M2.5 22v-6h6" />
                      <path d="M21.5 12a9.5 9.5 0 0 1-16.5 6.5L2.5 16" />
                    </svg>
                    换一换
                  </button>
                </div>

                <div className="ai-skill-community-featured-list">
                  {skillsLoading ? <div className="ai-data-status">技能加载中…</div> : null}
                  {!skillsLoading && skillsError ? <div className="ai-data-status">{skillsError}</div> : null}
                  {!skillsLoading && !skillsError && featuredSkills.length === 0 ? <div className="ai-data-status">暂无精选技能</div> : null}
                  {!skillsLoading && !skillsError && featuredSkills.map((skill) => (
                    <button className="ai-skill-community-featured-item" key={skill.id} type="button" onClick={() => openOfficialSkillDetail(skill)}>
                      <AiNameAvatar
                        ariaLabel={`${skill.title}头像`}
                        className="ai-skill-community-all-icon"
                        imageClassName="ai-skill-community-all-icon-image"
                        name={skill.title}
                        tone="blue"
                      />
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

                <div className="ai-skill-community-all-skills">
                  <div className="ai-skill-community-all-skills-header">
                    <div className="ai-skill-community-all-skills-title">ClawHub</div>
                    <button className="ai-skill-community-refresh" type="button" onClick={handleRefreshClawhub}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6" />
                        <path d="M2.5 12a9.5 9.5 0 0 1 16.5-6.5L21.5 8" />
                        <path d="M2.5 22v-6h6" />
                        <path d="M21.5 12a9.5 9.5 0 0 1-16.5 6.5L2.5 16" />
                      </svg>
                      换一换
                    </button>
                  </div>
                  <div className="ai-skill-community-all-list">
                    {!skillsLoading && !skillsError && filteredClawhubSkills.length === 0 ? <div className="ai-data-status">暂无 ClawHub 技能</div> : null}
                    {!skillsLoading && !skillsError && visibleClawhubSkills.map((skill) => (
                      <button className="ai-skill-community-all-item" key={skill.id} type="button" onClick={() => openClawhubSkillDetail(skill)}>
                        <AiNameAvatar
                          ariaLabel={`${skill.title}头像`}
                          className="ai-skill-community-all-icon"
                          imageClassName="ai-skill-community-all-icon-image"
                          name={skill.title}
                          tone="blue"
                        />
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
            </div>
          )}

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
                <button className="ai-skill-create-sheet-btn" type="button" onClick={handleCreateSkillByChat}>去创建</button>
                <div className="ai-skill-create-sheet-tip">如需上传本地文件，请前往电脑端操作</div>
              </div>
            </div>
          )}
        </>
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
          onOpenDrawer={() => setShowDrawer(true)}
          onOpenSession={(sessionId) => {
            setShowSidebarLibrary(false)
            openSession(sessionId)
          }}
        />
      )}

      {/* 发现全屏页 */}
      {showDiscoverPage && (
        <AiDiscoverPage
          discoverLoading={discoverLoading}
          discoverError={discoverError}
          discoverSections={discoverSections}
          onOpenAgentChat={openAgentChat}
          onOpenCreateAgent={() => setShowCreateAgentModal(true)}
          onOpenDrawer={() => setShowDrawer(true)}
        />
      )}

      {showCustomAgentConversationPage && (
        <AiCustomAgentConversationPage
          agentName={customAgentConversationDetail?.agent_name || activeAgent?.agentName || ''}
          headerTitle={customAgentConversationHeaderTitle}
          avatarUrl={customAgentConversationDetail?.avatar_url || null}
          canEdit={canEditCustomAgentConversation}
          canSubmit={canSend}
          description={customAgentConversationDetail?.description || activeAgent?.description || ''}
          error={customAgentConversationError}
          inputValue={inputValue}
          isResponding={isResponding}
          isStopping={isStopping}
          loading={customAgentConversationLoading}
          messages={messages}
          questions={customAgentConversationQuestions}
          requestError={requestError}
          onBack={closeCustomAgentConversation}
          onInputChange={setInputValue}
          onOpenEdit={openCustomAgentConfigFromConversation}
          onPlusClick={() => {
            setShowFileMenu(false)
            setShowPlusSheet(true)
          }}
          onSelectArtifact={setSelectedArtifact}
          onStop={stopResponding}
          onSubmit={(promptOverride) => submitPrompt(promptOverride, undefined, undefined, {
            enableWebSearch: customAgentConversationDetail?.enable_web_search === true,
          })}
          onSuggestionClick={setInputValue}
        />
      )}

      {showAgentConfigPage && (
        <AiAgentConfigPage
          agentId={agentConfigAgentId || undefined}
          avatarUrl={agentConfigAvatarUrl}
          draft={agentConfigDraft}
          mode={agentConfigMode}
          onBack={() => setShowAgentConfigPage(false)}
          onClose={agentConfigReturnTarget === 'custom-conversation' || agentConfigReturnTarget === 'main-conversation'
            ? () => setShowAgentConfigPage(false)
            : undefined}
          onDraftChange={setAgentConfigDraft}
          onPublishSuccess={handleAgentPublishSuccess}
        />
      )}

      <AiCreateAgentModal
        visible={showCreateAgentModal}
        onClose={() => setShowCreateAgentModal(false)}
        onUseTemplate={openAgentConfigPage}
      />

      {showSkillSelectorPage && (
        <div className="ai-chat-skill-picker-page">
          <div className="ai-chat-skill-picker-header">
            <div className="ai-chat-skill-picker-header-spacer" />
            <div className="ai-chat-skill-picker-title">技能</div>
            <div className="ai-chat-skill-picker-header-spacer" />
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
            {!userSkillsLoading && !userSkillsError && visibleSelectableSkills.map((skill) => {
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
                  <AiNameAvatar
                    ariaLabel={`${skill.title}头像`}
                    className="ai-chat-skill-picker-item-icon"
                    imageClassName="ai-chat-skill-picker-item-icon-image"
                    name={skill.title}
                    tone="blue"
                  />

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
            <div className="ai-my-skills-actions" />
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

          <div className={`ai-my-skills-list ${!mySkillsLoading && !mySkillsError && visibleManageSkills.length === 0 ? 'is-empty' : ''}`}>
            {mySkillsLoading ? <div className="ai-data-status">我的技能加载中…</div> : null}
            {!mySkillsLoading && mySkillsError ? <div className="ai-data-status">{mySkillsError}</div> : null}
            {!mySkillsLoading && !mySkillsError && visibleManageSkills.length === 0 ? <div className="ai-data-status">暂无技能数据</div> : null}
            {!mySkillsLoading && !mySkillsError && visibleManageSkills.map((skill) => (
              <AiManageSkillCard
                key={skill.id}
                loading={removeSkillLoadingId === skill.id}
                skill={skill}
                onDelete={openDeleteManageSkillDialog}
                onOpenDetail={openManageSkillDetail}
                onUse={applySkillItem}
              />
            ))}
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

      <Dialog
        visible={Boolean(deleteTargetManageSkill)}
        content="确认删除后将无法恢复，是否继续？"
        closeOnAction={false}
        closeOnMaskClick={!removeSkillLoadingId}
        onClose={closeDeleteManageSkillDialog}
        actions={[
          [
            {
              key: 'cancel-manage-skill-delete',
              text: '取消',
              disabled: Boolean(removeSkillLoadingId),
              style: { color: '#1f2329' },
              onClick: closeDeleteManageSkillDialog,
            },
            {
              key: 'confirm-manage-skill-delete',
              text: removeSkillLoadingId ? '删除中...' : '删除',
              bold: true,
              disabled: Boolean(removeSkillLoadingId),
              style: { color: '#1f2329' },
              onClick: confirmDeleteManageSkill,
            },
          ],
        ]}
      />
    </div>
  )
}
