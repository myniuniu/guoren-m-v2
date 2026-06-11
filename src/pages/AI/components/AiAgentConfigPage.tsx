import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toast } from 'antd-mobile'

import type { KnowledgeSpaceOption } from '../../../services/library'
import { fetchKnowledgeSpaces } from '../../../services/library'
import { applySquareAudit } from '../../../services/aiCommunity'
import type { AgentPublishScope } from '../../../services/agents'
import type { OrgUserItem } from '../../../services/aiOrgMembers'
import type { ChatMessage } from '../../../services/chat/types'
import { createCustomAgent, updateCustomAgent, uploadCustomAgentAvatar } from '../../../services/customAgents'
import {
  appendErrorToAssistantMessage,
  appendReasoningDeltaToMessages,
  appendTextDeltaToMessages,
  attachReferencesToMessages,
  attachSkillOutputToMessages,
  completeAssistantMessage,
  upsertToolCallInMessages,
} from '../../../services/chat/messageState'
import type { CustomAgentDebugRequest } from '../../../services/customAgentDebug'
import { streamCustomAgentDebug } from '../../../services/customAgentDebug'
import {
  fetchAddedSkills,
  fetchCustomAgentRecommendedSkills,
  fetchCreatedSkills,
  installClawhubSkill,
  type RecommendSkillsRequest,
  type SkillSummaryItem,
} from '../../../services/skills'
import { getSkillCardTags } from '../utils/skillDisplay'
import { AiAgentConversationPreview } from './AiAgentConversationPreview'
import { AiPublishSettings } from './AiPublishSettings'
import { AiSelectionSheet } from './AiSelectionSheet'

type AiAgentConfigTabKey = 'debug' | 'config'
type AiSkillSheetView = 'added' | 'created' | 'recommended'

export type AiAgentSelectedSkill = Pick<SkillSummaryItem, 'id' | 'skillName' | 'title' | 'description' | 'source' | 'tags'>

export type AiAgentPresetQuestion = {
  id: string
  category?: string
  question: string
  instruction: string
}

export type AiAgentConfigDraft = {
  agentName: string
  description: string
  instruction: string
  webSearchEnabled: boolean
  publishScope: AgentPublishScope
  selectedUsers: OrgUserItem[]
  selectedSkills: AiAgentSelectedSkill[]
  knowledgeSpaces: KnowledgeSpaceOption[]
  presetQuestions: AiAgentPresetQuestion[]
  isPublishingToCommunity: boolean
  communityCategoryId: string
  applyReason: string
}

type AiAgentConfigPageProps = {
  agentId?: string
  avatarUrl?: string | null
  draft: AiAgentConfigDraft
  mode?: 'create' | 'edit'
  onBack: () => void
  onClose?: () => void
  onDraftChange: (draft: AiAgentConfigDraft) => void
  onPublishSuccess?: (payload: AiAgentPublishSuccessPayload) => void | Promise<void>
}

export type AiAgentPublishSuccessPayload = {
  mode: 'create' | 'edit'
  agentId: string
  agentName: string
  description: string
  avatarUrl: string
}

export function createEmptyAiAgentConfigDraft(
  overrides: Partial<AiAgentConfigDraft> = {},
): AiAgentConfigDraft {
  return {
    agentName: overrides.agentName ?? '',
    description: overrides.description ?? '',
    instruction: overrides.instruction ?? '',
    webSearchEnabled: overrides.webSearchEnabled ?? false,
    publishScope: overrides.publishScope ?? 'private',
    selectedUsers: Array.isArray(overrides.selectedUsers) ? [...overrides.selectedUsers] : [],
    selectedSkills: Array.isArray(overrides.selectedSkills) ? [...overrides.selectedSkills] : [],
    knowledgeSpaces: Array.isArray(overrides.knowledgeSpaces) ? [...overrides.knowledgeSpaces] : [],
    presetQuestions: Array.isArray(overrides.presetQuestions) ? [...overrides.presetQuestions] : [],
    isPublishingToCommunity: overrides.isPublishingToCommunity ?? false,
    communityCategoryId: overrides.communityCategoryId ?? '',
    applyReason: overrides.applyReason ?? '',
  }
}

function createEmptyPresetQuestion(): AiAgentPresetQuestion {
  return {
    id: `preset-question-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    category: '默认',
    question: '',
    instruction: '',
  }
}

function getEmptyPresetQuestionIndexes(questions: AiAgentPresetQuestion[]): number[] {
  return questions
    .map((item, index) => (!item.question.trim() || !item.instruction.trim() ? index + 1 : null))
    .filter((value): value is number => value !== null)
}

function buildPublishPresetQuestions(questions: AiAgentPresetQuestion[]) {
  return questions.map((item) => ({
    category: item.category?.trim() || '默认',
    question: item.question.trim(),
    instruction: item.instruction.trim(),
  }))
}

function buildCreateAgentPayload(draft: AiAgentConfigDraft, avatarUrl: string) {
  return {
    agent_name: draft.agentName.trim(),
    agent_prompt: draft.instruction.trim(),
    avatar_url: avatarUrl,
    description: draft.description.trim(),
    enable_web_search: draft.webSearchEnabled === true,
    enabled_skills: draft.selectedSkills.map((skill) => ({
      skill_name: skill.skillName,
      chinese_name: skill.title,
      description: skill.description,
    })),
    is_public: draft.publishScope === 'public',
    publish_scope: draft.publishScope,
    authorized_user_ids: draft.publishScope === 'specified'
      ? draft.selectedUsers.map((user) => user.id)
      : [],
    community_category_id: draft.isPublishingToCommunity ? draft.communityCategoryId : undefined,
    preset_questions: buildPublishPresetQuestions(draft.presetQuestions),
    knowledge_spaces: draft.knowledgeSpaces.map((space) => ({
      id: space.id,
      spaceName: space.name,
    })),
  }
}

function buildUpdateAgentPayload(draft: AiAgentConfigDraft, avatarUrl: string) {
  return {
    agent_name: draft.agentName.trim(),
    description: draft.description.trim(),
    avatar_url: avatarUrl,
    agent_prompt: draft.instruction.trim(),
    enabled_skills: draft.selectedSkills.map((skill) => ({
      skill_name: skill.skillName,
    })),
    preset_questions: buildPublishPresetQuestions(draft.presetQuestions),
    knowledge_spaces: draft.knowledgeSpaces.map((space) => ({
      id: space.id,
      spaceName: space.name,
    })),
    enable_web_search: draft.webSearchEnabled === true,
    is_public: draft.publishScope === 'public',
    publish_scope: draft.publishScope,
    authorized_user_ids: draft.publishScope === 'specified'
      ? draft.selectedUsers.map((user) => user.id)
      : [],
    community_category_id: draft.isPublishingToCommunity ? draft.communityCategoryId : undefined,
  }
}

function normalizeSelectedSkill(skill: SkillSummaryItem): AiAgentSelectedSkill {
  return {
    id: skill.id,
    skillName: skill.skillName,
    title: skill.title,
    description: skill.description,
    source: skill.source,
    tags: skill.tags,
  }
}

function resolveSkillIdentity(skill: Pick<AiAgentSelectedSkill, 'id' | 'skillName'>): string {
  return skill.skillName.trim() || skill.id
}

function resolveSkillBadge(skill: AiAgentSelectedSkill): string {
  if (skill.source === 'created') {
    return '自建'
  }

  if (skill.source === 'clawhub') {
    return 'ClawHub'
  }

  return '已添加'
}

function buildDebugTimestamp(): string {
  return new Date().toISOString()
}

function buildDebugUserMessage(content: string): ChatMessage {
  return {
    id: `ai-agent-debug-user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'user',
    content,
    createdAt: buildDebugTimestamp(),
    sessionId: null,
    loading: false,
    reasoningContent: null,
    reasoningTimestamp: null,
    toolCalls: [],
    processingSteps: [],
    references: [],
    skillOutput: [],
    attachments: [],
  }
}

function buildDebugAssistantPlaceholder(): ChatMessage {
  return {
    id: `ai-agent-debug-assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'assistant',
    content: '',
    createdAt: buildDebugTimestamp(),
    sessionId: null,
    loading: true,
    reasoningContent: null,
    reasoningTimestamp: null,
    toolCalls: [],
    processingSteps: [],
    references: [],
    skillOutput: [],
    attachments: [],
  }
}

function buildDebugHistory(messages: ChatMessage[]): CustomAgentDebugRequest['history'] {
  return messages
    .filter((message) => message.role === 'user' || (message.role === 'assistant' && !message.loading))
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

function buildDebugPayload(
  draft: AiAgentConfigDraft,
  message: string,
  history: CustomAgentDebugRequest['history'],
): CustomAgentDebugRequest {
  const selectedSkills = Array.isArray(draft.selectedSkills) ? draft.selectedSkills : []
  const knowledgeSpaces = Array.isArray(draft.knowledgeSpaces) ? draft.knowledgeSpaces : []

  return {
    agent_name: draft.agentName,
    agent_prompt: draft.instruction,
    description: draft.description,
    message,
    history,
    enabled_skills: selectedSkills.map((skill) => ({
      skill_name: skill.skillName,
      chinese_name: skill.title,
      description: skill.description,
    })),
    knowledge_spaces: knowledgeSpaces.map((space) => ({
      id: space.id,
      spaceName: space.name,
    })),
    enable_web_search: draft.webSearchEnabled === true,
  }
}

function showValidationToast(content: string) {
  Toast.show({
    content,
    position: 'top',
  })
}

export function AiAgentConfigPage({
  agentId,
  avatarUrl = null,
  draft,
  mode = 'create',
  onBack,
  onClose,
  onDraftChange,
  onPublishSuccess,
}: AiAgentConfigPageProps) {
  const pageTitle = mode === 'edit' ? '编辑智能体' : '创建智能体'
  const [activeTab, setActiveTab] = useState<AiAgentConfigTabKey>('config')
  const [skillSheetView, setSkillSheetView] = useState<AiSkillSheetView>('added')
  const [debugInput, setDebugInput] = useState('')
  const [debugMessages, setDebugMessages] = useState<ChatMessage[]>([])
  const [debugRequestError, setDebugRequestError] = useState('')
  const [debugIsResponding, setDebugIsResponding] = useState(false)
  const [debugIsStopping, setDebugIsStopping] = useState(false)
  const [showSkillSheet, setShowSkillSheet] = useState(false)
  const [showKnowledgeSheet, setShowKnowledgeSheet] = useState(false)
  const [knowledgeSearchValue, setKnowledgeSearchValue] = useState('')
  const [addedSkillOptions, setAddedSkillOptions] = useState<AiAgentSelectedSkill[]>([])
  const [createdSkillOptions, setCreatedSkillOptions] = useState<AiAgentSelectedSkill[]>([])
  const [recommendedSkillOptions, setRecommendedSkillOptions] = useState<AiAgentSelectedSkill[]>([])
  const [knowledgeOptions, setKnowledgeOptions] = useState<KnowledgeSpaceOption[]>([])
  const [addedSkillsLoading, setAddedSkillsLoading] = useState(false)
  const [createdSkillsLoading, setCreatedSkillsLoading] = useState(false)
  const [recommendedSkillsLoading, setRecommendedSkillsLoading] = useState(false)
  const [knowledgeLoading, setKnowledgeLoading] = useState(false)
  const [addedSkillsError, setAddedSkillsError] = useState('')
  const [createdSkillsError, setCreatedSkillsError] = useState('')
  const [recommendedSkillsError, setRecommendedSkillsError] = useState('')
  const [knowledgeError, setKnowledgeError] = useState('')
  const [recommendedInstallingSkillId, setRecommendedInstallingSkillId] = useState('')
  const [agentAvatarUrl, setAgentAvatarUrl] = useState(avatarUrl?.trim() || '')
  const [agentAvatarUploading, setAgentAvatarUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [publishMessage, setPublishMessage] = useState('')
  const debugMessagesRef = useRef<ChatMessage[]>([])
  const debugAbortControllerRef = useRef<AbortController | null>(null)
  const debugActiveMessageIdRef = useRef<string | null>(null)
  const publishAbortControllerRef = useRef<AbortController | null>(null)
  const createdSkillsRequestedRef = useRef(false)
  const selectedUsers = Array.isArray(draft.selectedUsers) ? draft.selectedUsers : []
  const selectedSkills = Array.isArray(draft.selectedSkills) ? draft.selectedSkills : []
  const knowledgeSpaces = Array.isArray(draft.knowledgeSpaces) ? draft.knowledgeSpaces : []
  const presetQuestions = Array.isArray(draft.presetQuestions) ? draft.presetQuestions : []
  const webSearchEnabled = draft.webSearchEnabled === true

  const updateDraft = (patch: Partial<AiAgentConfigDraft>) => {
    if (publishStatus !== 'idle') {
      setPublishStatus('idle')
    }

    if (publishMessage) {
      setPublishMessage('')
    }

    onDraftChange({
      ...draft,
      ...patch,
    })
  }

  const syncDebugMessages = useCallback((messages: ChatMessage[]) => {
    debugMessagesRef.current = messages
    setDebugMessages(messages)
  }, [])

  useEffect(() => {
    debugMessagesRef.current = debugMessages
  }, [debugMessages])

  useEffect(() => {
    setAgentAvatarUrl(avatarUrl?.trim() || '')
  }, [avatarUrl])

  useEffect(() => {
    return () => {
      debugAbortControllerRef.current?.abort()
      debugAbortControllerRef.current = null
      debugActiveMessageIdRef.current = null
      publishAbortControllerRef.current?.abort()
      publishAbortControllerRef.current = null
    }
  }, [])

  const recommendSkillsPayload = useMemo<RecommendSkillsRequest>(() => ({
    agent_name: draft.agentName.trim(),
    description: draft.description.trim(),
    agent_prompt: draft.instruction.trim() || null,
  }), [draft.agentName, draft.description, draft.instruction])

  const handleAgentAvatarChange = useCallback(async (file: File) => {
    setAgentAvatarUploading(true)

    try {
      const uploadedUrl = await uploadCustomAgentAvatar(file)
      setAgentAvatarUrl(uploadedUrl)
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '头像上传失败，请重试' })
    } finally {
      setAgentAvatarUploading(false)
    }
  }, [])

  useEffect(() => {
    if (!showSkillSheet) {
      return
    }

    setSkillSheetView('added')
    createdSkillsRequestedRef.current = false
    setCreatedSkillOptions([])
    setCreatedSkillsError('')
    setRecommendedSkillOptions([])
    setRecommendedSkillsError('')

    const controller = new AbortController()

    async function loadSkillOptions() {
      setAddedSkillsLoading(true)
      setAddedSkillsError('')

      const addedSkillsResult = await Promise.allSettled([
        fetchAddedSkills(controller.signal),
      ])

      if (controller.signal.aborted) {
        return
      }

      const [addedSkillsState] = addedSkillsResult

      if (addedSkillsState.status === 'fulfilled') {
        setAddedSkillOptions(addedSkillsState.value.map((skill) => normalizeSelectedSkill(skill)))
        setAddedSkillsError('')
      } else {
        setAddedSkillOptions([])
        setAddedSkillsError(addedSkillsState.reason instanceof Error ? addedSkillsState.reason.message : '获取我添加的技能失败')
      }

      setAddedSkillsLoading(false)
    }

    void loadSkillOptions()

    return () => {
      controller.abort()
    }
  }, [showSkillSheet])

  useEffect(() => {
    if (!showSkillSheet || skillSheetView !== 'recommended') {
      return
    }

    const controller = new AbortController()

    async function loadRecommendedSkillOptions() {
      setRecommendedSkillsLoading(true)
      setRecommendedSkillsError('')

      try {
        const skills = await fetchCustomAgentRecommendedSkills(recommendSkillsPayload, controller.signal)

        if (!controller.signal.aborted) {
          setRecommendedSkillOptions(skills.map((skill) => normalizeSelectedSkill(skill)))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setRecommendedSkillOptions([])
          setRecommendedSkillsError(error instanceof Error ? error.message : '获取推荐技能失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setRecommendedSkillsLoading(false)
        }
      }
    }

    void loadRecommendedSkillOptions()

    return () => {
      controller.abort()
    }
  }, [recommendSkillsPayload, showSkillSheet, skillSheetView])

  useEffect(() => {
    if (!showSkillSheet || skillSheetView !== 'created' || createdSkillsRequestedRef.current) {
      return
    }

    createdSkillsRequestedRef.current = true
    const controller = new AbortController()

    async function loadCreatedSkillOptions() {
      setCreatedSkillsLoading(true)
      setCreatedSkillsError('')

      try {
        const skills = await fetchCreatedSkills(controller.signal)

        if (!controller.signal.aborted) {
          setCreatedSkillOptions(skills.map((skill) => normalizeSelectedSkill(skill)))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setCreatedSkillOptions([])
          setCreatedSkillsError(error instanceof Error ? error.message : '获取我创建的技能失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setCreatedSkillsLoading(false)
        }
      }
    }

    void loadCreatedSkillOptions()

    return () => {
      controller.abort()
    }
  }, [showSkillSheet, skillSheetView])

  useEffect(() => {
    if (!showKnowledgeSheet) {
      return
    }

    const controller = new AbortController()

    async function loadKnowledgeOptions() {
      setKnowledgeLoading(true)
      setKnowledgeError('')

      try {
        const spaces = await fetchKnowledgeSpaces(controller.signal)

        if (!controller.signal.aborted) {
          setKnowledgeOptions(spaces)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setKnowledgeOptions([])
          setKnowledgeError(error instanceof Error ? error.message : '获取知识空间列表失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setKnowledgeLoading(false)
        }
      }
    }

    void loadKnowledgeOptions()

    return () => {
      controller.abort()
    }
  }, [showKnowledgeSheet])

  const visibleKnowledgeOptions = useMemo(() => {
    const normalizedKeyword = knowledgeSearchValue.trim().toLowerCase()

    if (!normalizedKeyword) {
      return knowledgeOptions
    }

    return knowledgeOptions.filter((space) => (
      space.name.toLowerCase().includes(normalizedKeyword)
      || space.id.toLowerCase().includes(normalizedKeyword)
    ))
  }, [knowledgeOptions, knowledgeSearchValue])

  const isSkillSelected = useCallback((skill: Pick<AiAgentSelectedSkill, 'id' | 'skillName'>) => {
    const targetIdentity = resolveSkillIdentity(skill)
    return selectedSkills.some((item) => resolveSkillIdentity(item) === targetIdentity)
  }, [selectedSkills])

  const removeSelectedSkillByIdentity = useCallback((skill: Pick<AiAgentSelectedSkill, 'id' | 'skillName'>) => {
    const targetIdentity = resolveSkillIdentity(skill)

    updateDraft({
      selectedSkills: selectedSkills.filter((item) => resolveSkillIdentity(item) !== targetIdentity),
    })
  }, [selectedSkills, updateDraft])

  const handleToggleSkill = (targetSkill: AiAgentSelectedSkill) => {
    const targetIdentity = resolveSkillIdentity(targetSkill)
    const hasSelected = selectedSkills.some((item) => resolveSkillIdentity(item) === targetIdentity)

    updateDraft({
      selectedSkills: hasSelected
        ? selectedSkills.filter((item) => resolveSkillIdentity(item) !== targetIdentity)
        : [...selectedSkills, targetSkill],
    })
  }

  const handleToggleKnowledgeSpace = (spaceId: string) => {
    const targetSpace = knowledgeOptions.find((item) => item.id === spaceId)

    if (!targetSpace) {
      return
    }

    const hasSelected = knowledgeSpaces.some((item) => item.id === spaceId)

    updateDraft({
      knowledgeSpaces: hasSelected
        ? knowledgeSpaces.filter((item) => item.id !== spaceId)
        : [...knowledgeSpaces, targetSpace],
    })
  }

  const handleAddRecommendedSkill = useCallback(async (skillId: string) => {
    const targetSkill = recommendedSkillOptions.find((item) => item.id === skillId)

    if (!targetSkill || recommendedInstallingSkillId) {
      return
    }

    if (isSkillSelected(targetSkill)) {
      return
    }

    setRecommendedInstallingSkillId(targetSkill.id)

    try {
      if (targetSkill.source === 'clawhub') {
        await installClawhubSkill(targetSkill.skillName || targetSkill.id)
      }

      const normalizedSkill = { ...targetSkill }

      setAddedSkillOptions((currentSkills) => {
        if (currentSkills.some((item) => resolveSkillIdentity(item) === resolveSkillIdentity(normalizedSkill))) {
          return currentSkills
        }

        return [normalizedSkill, ...currentSkills]
      })

      updateDraft({
        selectedSkills: [...selectedSkills, normalizedSkill],
      })
      if (targetSkill.source === 'clawhub') {
        setSkillSheetView('added')
      }
      Toast.show({ content: `已添加 ${normalizedSkill.title}` })
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '添加技能失败' })
    } finally {
      setRecommendedInstallingSkillId('')
    }
  }, [isSkillSelected, recommendedInstallingSkillId, recommendedSkillOptions, selectedSkills, updateDraft])

  const activeSkillSheetOptions = skillSheetView === 'added'
    ? addedSkillOptions
    : createdSkillOptions
  const activeSkillSheetLoading = skillSheetView === 'added'
    ? addedSkillsLoading
    : createdSkillsLoading
  const activeSkillSheetError = skillSheetView === 'added'
    ? addedSkillsError
    : createdSkillsError
  const activeSkillSheetEmptyText = skillSheetView === 'added'
    ? '暂无我添加的技能'
    : '暂无我创建的技能'
  const renderSkillSheetItems = (
    items: AiAgentSelectedSkill[],
    options: {
      installFromRecommended?: boolean
    } = {},
  ) => (
    <div className="ai-selection-sheet-list">
      {items.map((skill) => {
        const checked = isSkillSelected(skill)
        const isInstalling = Boolean(options.installFromRecommended && recommendedInstallingSkillId === skill.id)
        const isClawhubSkill = skill.source === 'clawhub'

        return (
          <button
            aria-label={options.installFromRecommended && isClawhubSkill ? `${checked ? '已添加' : '添加'} ClawHub 技能 ${skill.title}` : undefined}
            aria-pressed={options.installFromRecommended ? undefined : checked}
            className={`ai-selection-sheet-item${checked ? ' is-selected' : ''}`}
            disabled={Boolean(options.installFromRecommended && (checked || isInstalling))}
            key={skill.id}
            type="button"
            onClick={() => {
              if (options.installFromRecommended) {
                void handleAddRecommendedSkill(skill.id)
                return
              }

              handleToggleSkill(skill)
            }}
          >
            <div className="ai-selection-sheet-item-main">
              <div className="ai-selection-sheet-item-title-row">
                <span className="ai-selection-sheet-item-title">{skill.title}</span>
                {isClawhubSkill ? <span className="ai-selection-sheet-item-badge">ClawHub</span> : null}
              </div>
              {skill.description ? <div className="ai-selection-sheet-item-desc">{skill.description}</div> : null}
              {getSkillCardTags(skill).length > 0 ? (
                <div className="ai-selection-sheet-item-tags">
                  {getSkillCardTags(skill).map((tag) => (
                    <span className="ai-selection-sheet-item-tag" key={`${skill.id}-${tag}`}>{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <span className="ai-selection-sheet-item-action">{checked ? '已添加' : isInstalling ? '添加中' : '添加'}</span>
          </button>
        )
      })}
    </div>
  )
  const visiblePresetQuestions = presetQuestions.filter((item) => item.question.trim())
  const canSubmitDebugPrompt = useMemo(() => {
    return Boolean(debugInput.trim()) && !debugIsResponding && !debugIsStopping
  }, [debugInput, debugIsResponding, debugIsStopping])

  const handleDebugSubmit = useCallback(async (promptOverride?: string) => {
    const prompt = (promptOverride ?? debugInput).trim()

    if (!prompt || debugIsResponding || debugIsStopping) {
      return
    }

    const controller = new AbortController()
    const userMessage = buildDebugUserMessage(prompt)
    const assistantMessage = buildDebugAssistantPlaceholder()
    const nextMessages = [...debugMessagesRef.current, userMessage, assistantMessage]
    const payload = buildDebugPayload(draft, prompt, buildDebugHistory(nextMessages))

    debugAbortControllerRef.current = controller
    debugActiveMessageIdRef.current = assistantMessage.id
    syncDebugMessages(nextMessages)
    setDebugInput('')
    setDebugRequestError('')
    setDebugIsStopping(false)
    setDebugIsResponding(true)

    try {
      await streamCustomAgentDebug(payload, controller.signal, {
        onTextDelta: (chunk) => {
          const activeMessageId = debugActiveMessageIdRef.current

          if (!activeMessageId) {
            return
          }

          const result = appendTextDeltaToMessages(
            debugMessagesRef.current,
            activeMessageId,
            chunk,
            buildDebugTimestamp(),
          )

          debugActiveMessageIdRef.current = result.activeMessageId
          syncDebugMessages(result.messages)
        },
        onReasoningDelta: (chunk) => {
          const activeMessageId = debugActiveMessageIdRef.current

          if (!activeMessageId) {
            return
          }

          syncDebugMessages(appendReasoningDeltaToMessages(
            debugMessagesRef.current,
            activeMessageId,
            chunk,
            buildDebugTimestamp(),
          ))
        },
        onToolStart: (toolCall) => {
          const activeMessageId = debugActiveMessageIdRef.current

          if (!activeMessageId) {
            return
          }

          syncDebugMessages(upsertToolCallInMessages(
            debugMessagesRef.current,
            activeMessageId,
            toolCall,
            buildDebugTimestamp(),
          ))
        },
        onToolEnd: (toolCall) => {
          const activeMessageId = debugActiveMessageIdRef.current

          if (!activeMessageId) {
            return
          }

          syncDebugMessages(upsertToolCallInMessages(
            debugMessagesRef.current,
            activeMessageId,
            toolCall,
            buildDebugTimestamp(),
          ))
        },
        onReferences: (references) => {
          const activeMessageId = debugActiveMessageIdRef.current

          if (!activeMessageId) {
            return
          }

          syncDebugMessages(attachReferencesToMessages(
            debugMessagesRef.current,
            activeMessageId,
            references,
          ))
        },
        onSkillOutput: (skillOutput) => {
          const activeMessageId = debugActiveMessageIdRef.current

          if (!activeMessageId) {
            return
          }

          syncDebugMessages(attachSkillOutputToMessages(
            debugMessagesRef.current,
            activeMessageId,
            skillOutput,
          ))
        },
        onComplete: () => {
          const activeMessageId = debugActiveMessageIdRef.current

          if (activeMessageId) {
            syncDebugMessages(completeAssistantMessage(debugMessagesRef.current, activeMessageId))
          }

          debugAbortControllerRef.current = null
          debugActiveMessageIdRef.current = null
          setDebugIsResponding(false)
          setDebugIsStopping(false)
        },
      })
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      const activeMessageId = debugActiveMessageIdRef.current
      const errorMessage = error instanceof Error ? error.message : '调试失败，请稍后重试'

      if (activeMessageId) {
        syncDebugMessages(appendErrorToAssistantMessage(
          debugMessagesRef.current,
          activeMessageId,
          '调试失败，请稍后重试',
        ))
      }

      debugAbortControllerRef.current = null
      debugActiveMessageIdRef.current = null
      setDebugRequestError(errorMessage)
      setDebugIsResponding(false)
      setDebugIsStopping(false)
    }
  }, [debugInput, debugIsResponding, debugIsStopping, draft, syncDebugMessages])

  const handleDebugStop = useCallback(() => {
    if (!debugIsResponding || debugIsStopping) {
      return
    }

    setDebugIsStopping(true)
    debugAbortControllerRef.current?.abort()
    debugAbortControllerRef.current = null

    const activeMessageId = debugActiveMessageIdRef.current

    if (activeMessageId) {
      syncDebugMessages(completeAssistantMessage(debugMessagesRef.current, activeMessageId))
    }

    debugActiveMessageIdRef.current = null
    setDebugIsResponding(false)
    setDebugIsStopping(false)
  }, [debugIsResponding, debugIsStopping, syncDebugMessages])

  const handlePublish = useCallback(async () => {
    const showPublishError = (message: string) => {
      setPublishMessage(message)
      showValidationToast(message)
      setPublishStatus('error')
    }

    if (publishing) {
      return
    }

    if (!draft.agentName.trim()) {
      showPublishError('请先填写基础信息中的名称')
      return
    }

    if (!draft.description.trim()) {
      showPublishError('请先填写基础信息中的简介')
      return
    }

    if (!draft.instruction.trim()) {
      showPublishError('请先填写指令中的系统提示词')
      return
    }

    const emptyIndexes = getEmptyPresetQuestionIndexes(presetQuestions)

    if (emptyIndexes.length > 0) {
      showPublishError(`问题${emptyIndexes.join('、')}的名称或指令不能为空，请填写完整后再发布`)
      return
    }

    if (draft.publishScope === 'specified' && selectedUsers.length === 0) {
      showPublishError('指定成员可见时，请至少选择 1 个成员')
      return
    }

    if (draft.isPublishingToCommunity && !draft.communityCategoryId) {
      showPublishError('申请发布到研习社时，请至少选择一个分类')
      return
    }

    if (mode === 'edit' && !agentId) {
      showPublishError('当前缺少智能体 ID，暂时无法更新')
      return
    }

    publishAbortControllerRef.current?.abort()
    const controller = new AbortController()
    publishAbortControllerRef.current = controller
    const normalizedAvatarUrl = agentAvatarUrl.trim()

    setPublishing(true)
    setPublishStatus('idle')
    setPublishMessage('')

    try {
      let publishedAgentId = agentId ?? ''
      let publishedAgentName = draft.agentName.trim()
      let publishedDescription = draft.description.trim()
      let publishedAvatarUrl = normalizedAvatarUrl

      if (mode === 'edit') {
        const updatedAgent = await updateCustomAgent(
          agentId!,
          buildUpdateAgentPayload(draft, normalizedAvatarUrl),
          controller.signal,
        )

        publishedAgentId = updatedAgent?.agent_id || agentId!
        publishedAgentName = updatedAgent?.agent_name || publishedAgentName
        publishedDescription = updatedAgent?.description || publishedDescription
        publishedAvatarUrl = updatedAgent?.avatar_url || publishedAvatarUrl
      } else {
        const result = await createCustomAgent(
          buildCreateAgentPayload(draft, normalizedAvatarUrl),
          controller.signal,
        )

        publishedAgentId = result.data?.agent_id?.trim() || ''

        if (!publishedAgentId) {
          throw new Error(result.msg || result.message || '发布失败')
        }
      }

      if (draft.isPublishingToCommunity && draft.communityCategoryId) {
        try {
          const communityApplyResult = await applySquareAudit({
            sourceType: 3,
            sourceNodeId: publishedAgentId,
            squareCategory: 3,
            squareSubCategoryId: draft.communityCategoryId,
            applyReason: draft.applyReason,
            sourceNodeTitle: publishedAgentName,
            sourceNodeType: 0,
          }, controller.signal)
          Toast.show({ content: communityApplyResult.message || communityApplyResult.msg || '研习社申请提交成功，请等待审核' })
        } catch (error) {
          console.error('提交研习社申请失败:', error)
          Toast.show({ content: error instanceof Error && error.message ? error.message : '智能体已发布成功，但研习社申请提交失败，请稍后重试' })
        }
      }

      setPublishMessage('')
      setPublishStatus('success')
      Toast.show({ content: mode === 'edit' ? '更新成功' : '智能体发布成功' })

      void Promise.resolve(onPublishSuccess?.({
        mode,
        agentId: publishedAgentId,
        agentName: publishedAgentName,
        description: publishedDescription,
        avatarUrl: publishedAvatarUrl,
      })).catch((error) => {
        console.warn('发布成功后的页面同步失败:', error)
      })
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      const errorMessage = error instanceof Error && error.message
        ? error.message
        : mode === 'edit' ? '更新失败，请重试' : '发布失败，请重试'

      setPublishMessage(errorMessage)
      setPublishStatus('error')
      Toast.show({ content: errorMessage })
    } finally {
      if (publishAbortControllerRef.current === controller) {
        publishAbortControllerRef.current = null
      }

      setPublishing(false)
    }
  }, [agentAvatarUrl, agentId, draft, mode, onPublishSuccess, presetQuestions, publishing, selectedUsers])

  const renderDebugTab = () => (
    <AiAgentConversationPreview
      description={draft.description}
      avatarUrl={agentAvatarUrl}
      avatarUploading={agentAvatarUploading}
      canSubmit={canSubmitDebugPrompt}
      configuredSkills={selectedSkills.map((skill) => ({
        id: skill.id,
        title: skill.title,
        description: skill.description,
      }))}
      inputValue={debugInput}
      isResponding={debugIsResponding}
      isStopping={debugIsStopping}
      messages={debugMessages}
      questions={visiblePresetQuestions}
      requestError={debugRequestError}
      agentName={draft.agentName || pageTitle}
      onInputChange={setDebugInput}
      onStop={handleDebugStop}
      onSubmit={handleDebugSubmit}
      onSuggestionClick={setDebugInput}
      onLockedWebSearchClick={() => {
        Toast.show({ content: '当前智能体未开启联网检索，无法配置' })
      }}
      onAvatarChange={handleAgentAvatarChange}
      onToggleWebSearch={() => updateDraft({ webSearchEnabled: !webSearchEnabled })}
      onProfileSave={(profile) => updateDraft({
        agentName: profile.agentName,
        description: profile.description,
      })}
      webSearchEnabled={webSearchEnabled}
      webSearchLocked={!webSearchEnabled}
    />
  )

  const renderConfigTab = () => (
    <div className="ai-agent-config-content">
      <section className="ai-agent-config-card">
        <AiPublishSettings
          actionLabel={mode === 'edit' ? '保存' : '发布'}
          applyReason={draft.applyReason}
          communityCategoryId={draft.communityCategoryId}
          publishMessage={publishMessage}
          isPublishingToCommunity={draft.isPublishingToCommunity}
          publishStatus={publishStatus}
          publishScope={draft.publishScope}
          publishing={publishing}
          selectedUsers={selectedUsers}
          onApplyReasonChange={(applyReason) => updateDraft({ applyReason })}
          onCommunityCategoryChange={(communityCategoryId) => updateDraft({ communityCategoryId })}
          onPublish={handlePublish}
          onPublishScopeChange={(publishScope) => updateDraft({ publishScope })}
          onPublishingToCommunityChange={(isPublishingToCommunity) => updateDraft({ isPublishingToCommunity })}
          onSelectedUsersChange={(selectedUsers) => updateDraft({ selectedUsers })}
        />
      </section>

      <section className="ai-agent-config-card">
        <div className="ai-agent-config-card-title">
          指令 <span className="ai-agent-config-required">*</span>
        </div>
        <label className="ai-agent-config-field">
          <span className="ai-agent-config-field-label">
            系统提示词 <span className="ai-agent-config-required">*</span>
          </span>
          <textarea
            className="ai-agent-config-textarea"
            maxLength={3000}
            placeholder="请输入智能体的角色设定、回答风格和边界要求"
            rows={8}
            value={draft.instruction}
            onChange={(event) => updateDraft({ instruction: event.target.value })}
          />
        </label>
      </section>

      <section className="ai-agent-config-card">
        <div className="ai-agent-config-section-head">
          <div className="ai-agent-config-card-title">Skills 服务</div>
          <button
            className="ai-agent-config-link-btn"
            type="button"
            onClick={() => setShowSkillSheet(true)}
          >
            添加
          </button>
        </div>

        {selectedSkills.length === 0 ? (
          <div className="ai-agent-config-empty">暂未添加 Skills 服务</div>
        ) : (
          <div className="ai-agent-skill-list">
            {selectedSkills.map((skill) => (
              <article className="ai-agent-skill-card" key={skill.id}>
                <div className="ai-agent-skill-card-top">
                  <div className="ai-agent-skill-card-title-row">
                    <span className="ai-agent-skill-card-title">{skill.title}</span>
                    <span className="ai-agent-skill-card-badge">{resolveSkillBadge(skill)}</span>
                  </div>
                  <button
                    aria-label={`移除${skill.title}`}
                    className="ai-agent-config-remove-btn"
                    type="button"
                    onClick={() => removeSelectedSkillByIdentity(skill)}
                  >
                    移除
                  </button>
                </div>
                <div className="ai-agent-skill-card-desc">{skill.description || '暂无描述'}</div>
                {skill.tags.length > 0 ? (
                  <div className="ai-agent-skill-card-tags">
                    {skill.tags.slice(0, 3).map((tag) => (
                      <span className="ai-agent-skill-card-tag" key={`${skill.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ai-agent-config-card">
        <div className="ai-agent-config-card-title">知识配置</div>
        <div className="ai-agent-config-toggle-row">
          <div className="ai-agent-config-toggle-meta">
            <div className="ai-agent-config-toggle-label">联网检索</div>
            <div className="ai-agent-config-toggle-desc">控制调试区是否允许调用联网能力。</div>
          </div>
          <button
            aria-checked={webSearchEnabled}
            className={`ai-agent-config-switch${webSearchEnabled ? ' is-active' : ''}`}
            role="switch"
            type="button"
            onClick={() => updateDraft({ webSearchEnabled: !webSearchEnabled })}
          >
            <span className="ai-agent-config-switch-track">
              <span className="ai-agent-config-switch-thumb" />
            </span>
          </button>
        </div>

        <button
          className="ai-agent-config-outline-btn"
          type="button"
          onClick={() => setShowKnowledgeSheet(true)}
        >
          关联知识空间
        </button>

        {knowledgeSpaces.length === 0 ? (
          <div className="ai-agent-config-empty">暂未关联知识空间</div>
        ) : (
          <div className="ai-agent-knowledge-list">
            {knowledgeSpaces.map((space) => (
              <div className="ai-agent-knowledge-item" key={space.id}>
                <span className="ai-agent-knowledge-name">{space.name}</span>
                <button
                  aria-label={`移除${space.name}`}
                  className="ai-agent-config-remove-btn"
                  type="button"
                  onClick={() => {
                    updateDraft({
                      knowledgeSpaces: knowledgeSpaces.filter((item) => item.id !== space.id),
                    })
                  }}
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ai-agent-config-card">
        <div className="ai-agent-config-section-head">
          <div className="ai-agent-config-card-title">对话配置</div>
          <button
            className="ai-agent-config-link-btn"
            type="button"
            onClick={() => {
              updateDraft({
                presetQuestions: [...presetQuestions, createEmptyPresetQuestion()],
              })
            }}
          >
            添加
          </button>
        </div>

        {presetQuestions.length === 0 ? (
          <div className="ai-agent-config-empty">暂未配置推荐问题</div>
        ) : (
          <div className="ai-agent-question-list">
            {presetQuestions.map((item, index) => (
              <article className="ai-agent-question-card" key={item.id}>
                <div className="ai-agent-question-card-head">
                  <div className="ai-agent-question-card-title">问题 {index + 1}</div>
                  <button
                    aria-label={`删除问题${index + 1}`}
                    className="ai-agent-config-remove-btn"
                    type="button"
                    onClick={() => {
                      updateDraft({
                        presetQuestions: presetQuestions.filter((question) => question.id !== item.id),
                      })
                    }}
                  >
                    移除
                  </button>
                </div>

                <label className="ai-agent-config-field">
                  <span className="ai-agent-config-field-label">名称</span>
                  <input
                    className="ai-agent-config-input"
                    maxLength={20}
                    placeholder="请输入推荐问题名称"
                    type="text"
                    value={item.question}
                    onChange={(event) => {
                      updateDraft({
                        presetQuestions: presetQuestions.map((question) => (
                          question.id === item.id ? { ...question, question: event.target.value } : question
                        )),
                      })
                    }}
                  />
                </label>

                <label className="ai-agent-config-field">
                  <span className="ai-agent-config-field-label">指令</span>
                  <textarea
                    className="ai-agent-config-textarea is-compact"
                    maxLength={200}
                    placeholder="请输入点击推荐问题后发送的具体指令"
                    rows={4}
                    value={item.instruction}
                    onChange={(event) => {
                      updateDraft({
                        presetQuestions: presetQuestions.map((question) => (
                          question.id === item.id ? { ...question, instruction: event.target.value } : question
                        )),
                      })
                    }}
                  />
                </label>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  )

  return (
    <div className="ai-agent-config-page">
      <div className="ai-agent-config-header">
        <button
          aria-label="返回发现页"
          className="ai-agent-config-back"
          type="button"
          onClick={onBack}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="ai-agent-config-tabs" role="tablist" aria-label={`${pageTitle}页签`}>
          <button
            aria-pressed={activeTab === 'debug'}
            className={`ai-agent-config-tab${activeTab === 'debug' ? ' is-active' : ''}`}
            type="button"
            onClick={() => setActiveTab('debug')}
          >
            测试与预览
          </button>
          <button
            aria-pressed={activeTab === 'config'}
            className={`ai-agent-config-tab${activeTab === 'config' ? ' is-active' : ''}`}
            type="button"
            onClick={() => setActiveTab('config')}
          >
            搭建
          </button>
        </div>
        {onClose ? (
          <button
            aria-label="关闭配置页并返回会话"
            className="ai-agent-config-close"
            type="button"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <div aria-hidden="true" className="ai-agent-config-header-spacer" />
        )}
      </div>

      {activeTab === 'debug' ? renderDebugTab() : renderConfigTab()}

      <AiSelectionSheet
        emptyText=""
        error=""
        items={[]}
        loading={false}
        searchPlaceholder=""
        searchValue=""
        selectedIds={selectedSkills.map((skill) => skill.id)}
        fixedHeight
        showSearch={false}
        title="选择 Skills 服务"
        visible={showSkillSheet}
        onClose={() => {
          setShowSkillSheet(false)
        }}
        onSearchChange={() => {}}
        onSelect={() => {}}
      >
        <div className="ai-selection-sheet-section">
          <div className="ai-selection-sheet-tabs" role="tablist" aria-label="技能分类">
            <button
              aria-pressed={skillSheetView === 'added'}
              className={`ai-selection-sheet-tab${skillSheetView === 'added' ? ' is-active' : ''}`}
              type="button"
              onClick={() => setSkillSheetView('added')}
            >
              我添加的
            </button>
            <button
              aria-pressed={skillSheetView === 'created'}
              className={`ai-selection-sheet-tab${skillSheetView === 'created' ? ' is-active' : ''}`}
              type="button"
              onClick={() => setSkillSheetView('created')}
            >
              我创建的
            </button>
            <button
              aria-pressed={skillSheetView === 'recommended'}
              className={`ai-selection-sheet-tab${skillSheetView === 'recommended' ? ' is-active' : ''}`}
              type="button"
              onClick={() => setSkillSheetView('recommended')}
            >
              技能推荐
            </button>
          </div>

          {skillSheetView === 'recommended' ? (
            <>
              {recommendedSkillsLoading ? <div className="ai-selection-sheet-status">加载中…</div> : null}
              {!recommendedSkillsLoading && recommendedSkillsError ? <div className="ai-selection-sheet-status is-error">{recommendedSkillsError}</div> : null}
              {!recommendedSkillsLoading && !recommendedSkillsError && recommendedSkillOptions.length === 0 ? (
                <div className="ai-selection-sheet-status">暂无推荐技能</div>
              ) : null}
              {!recommendedSkillsLoading && !recommendedSkillsError && recommendedSkillOptions.length > 0
                ? renderSkillSheetItems(recommendedSkillOptions, { installFromRecommended: true })
                : null}
            </>
          ) : (
            <>
              {activeSkillSheetLoading ? <div className="ai-selection-sheet-status">加载中…</div> : null}
              {!activeSkillSheetLoading && activeSkillSheetError ? <div className="ai-selection-sheet-status is-error">{activeSkillSheetError}</div> : null}
              {!activeSkillSheetLoading && !activeSkillSheetError && activeSkillSheetOptions.length === 0 ? (
                <div className="ai-selection-sheet-status">{activeSkillSheetEmptyText}</div>
              ) : null}
              {!activeSkillSheetLoading && !activeSkillSheetError && activeSkillSheetOptions.length > 0
                ? renderSkillSheetItems(activeSkillSheetOptions)
                : null}
            </>
          )}
        </div>
      </AiSelectionSheet>

      <AiSelectionSheet
        emptyText="暂无可用知识空间"
        error={knowledgeError}
        items={visibleKnowledgeOptions.map((space) => ({
          id: space.id,
          title: space.name,
          description: space.id,
        }))}
        loading={knowledgeLoading}
        searchPlaceholder="搜索知识空间"
        searchValue={knowledgeSearchValue}
        selectedIds={knowledgeSpaces.map((space) => space.id)}
        title="选择知识空间"
        visible={showKnowledgeSheet}
        onClose={() => {
          setShowKnowledgeSheet(false)
          setKnowledgeSearchValue('')
        }}
        onSearchChange={setKnowledgeSearchValue}
        onSelect={handleToggleKnowledgeSpace}
      />
    </div>
  )
}
