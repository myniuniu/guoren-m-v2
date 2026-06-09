import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import { getChatUserId } from './chat/api'

const KNOWLEDGE_SPACE_PATH = '/res/knowledgeSpace/optionList'
const RESOURCE_TREE_PATH = '/res/node/tree'
const RESOURCE_NODE_ADD_PATH = '/res/node/add'
const LIBRARY_PAGE_PATH = '/api/v1/files/library'
const LIBRARY_PREVIEW_PATH = '/api/v1/chat/files/preview'

export interface KnowledgeSpaceOption {
  id: string
  name: string
}

export interface LibraryResourceFile {
  nodeId: string
  resourceId: string
  fileName: string
  fileExt: string
  fileType: 'pdf' | 'html' | 'ppt' | 'doc'
  fileSize: number | null
  createBy: string
  createTime: string
}

export type LibraryPageAgentType = 'all' | 'personal' | 'general' | 'custom'

export type LibraryPageFileType = 'all' | 'document' | 'image' | 'video' | 'audio' | 'other' | 'classroom' | 'review' | 'whiteboard'

export interface LibraryPageFileItem {
  fileId: string
  fileName: string
  agentName: string
  fileType: Exclude<LibraryPageFileType, 'all'>
  filePath: string
  createdAt: string
  sessionId: string
  agentId: string | null
  skillName: string | null
}

export interface LibraryFileDetail extends LibraryPageFileItem {
  fileUrl: string
  sizeBytes: number | null
}

export interface LibraryTreeNode {
  nodeId: string
  title: string
  fileName: string
  fileExt: string
  fileSize: number | null
  createBy: string
  createTime: string
  resourceId: string
  ossKey: string
  playUrl: string
  aiParseState: number | null
  nodeType: number | null
  children: LibraryTreeNode[]
}

type KnowledgeSpaceResponse = {
  success?: boolean
  code?: number | string
  message?: string
  msg?: string
  result?: Array<{
    id?: string
    spaceName?: string
  }>
}

type RawTreeNode = {
  id?: string | number
  type?: number
  title?: string | null
  fileName?: string | null
  fileExt?: string | null
  fileSize?: number | null
  ossKey?: string | null
  playUrl?: string | null
  refDriveId?: string | null
  aiParseState?: number | null
  createBy?: string | null
  createTime?: string | null
  children?: RawTreeNode[] | null
}

type ResourceTreeResponse = {
  success?: boolean
  code?: number | string
  message?: string
  msg?: string
  result?: RawTreeNode[]
}

type RawLibraryPageFileItem = {
  file_id?: string
  file_name?: string
  agent_name?: string
  file_type?: string
  file_path?: string
  created_at?: string
  session_id?: string
  agent_id?: string | null
  skill_name?: string | null
}

type LibraryPageResponse = {
  success?: boolean
  code?: number | string
  message?: string
  msg?: string
  files?: RawLibraryPageFileItem[]
}

type LibraryDetailResponse = {
  success?: boolean
  code?: number | string
  message?: string
  msg?: string
  file_id?: string
  file_name?: string
  agent_name?: string
  file_type?: string
  file_path?: string
  created_at?: string
  session_id?: string
  agent_id?: string | null
  skill_name?: string | null
  file_url?: string
  size_bytes?: number | null
}

type SaveLibraryResourcePayload = {
  parentId: '0'
  scope: 1 | 2
  knowledgeSpaceOwnerId: string
  domain: 2
  type: 2 | 21 | 22
  sourceNodeId: ''
  taskId: string
  title: string
  sortOrder: 0
  ownerUserId: string
  document?: {
    ossBucket: string
    ossKey: string
    fileName: string
    fileExt: string
    fileSize: number
    md5: string
  }
}

type SaveLibraryResourceResponse = {
  success?: boolean
  code?: string | number
  message?: string
  msg?: string
  result?: string
}

function readLocalStorage(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() ?? ''
  } catch {
    return ''
  }
}

function getLibraryOwnerUserId(): string {
  const ownerUserId = readLocalStorage('SUPERSONIC_USERNAME')

  if (!ownerUserId) {
    throw new Error('当前缺少用户名，暂时无法加载个人资料库')
  }

  return ownerUserId
}

function inferLibraryFileType(fileName: string, fileExt: string): LibraryResourceFile['fileType'] {
  const normalizedExt = fileExt.toLowerCase() || fileName.split('.').pop()?.toLowerCase() || ''

  if (normalizedExt === 'pdf') {
    return 'pdf'
  }

  if (normalizedExt === 'html' || normalizedExt === 'htm') {
    return 'html'
  }

  if (['ppt', 'pptx', 'key'].includes(normalizedExt)) {
    return 'ppt'
  }

  return 'doc'
}

function getFileExt(fileName: string): string {
  return fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : ''
}

function parseOssResourceInfo(fileUrl: string) {
  const normalizedFileUrl = fileUrl.trim()

  if (!normalizedFileUrl) {
    throw new Error('缺少文件地址，无法保存到资料库')
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(normalizedFileUrl)
  } catch {
    throw new Error('文件地址不是有效的 OSS 链接，无法保存到资料库')
  }

  const ossBucket = parsedUrl.hostname.split('.')[0] ?? ''
  const ossKey = parsedUrl.pathname.replace(/^\/+/, '')

  if (!ossBucket || !ossKey) {
    throw new Error('无法从文件地址解析 OSS 信息')
  }

  const ossFileName = ossKey.split('/').pop() ?? ''
  const fileExt = getFileExt(ossKey) || getFileExt(ossFileName)
  const md5Candidate = ossFileName.includes('.') ? ossFileName.slice(0, ossFileName.lastIndexOf('.')) : ''
  const md5 = /^[a-f0-9]{32}$/i.test(md5Candidate) ? md5Candidate : ''

  return {
    ossBucket,
    ossKey,
    fileExt,
    md5,
  }
}

function buildSaveLibraryPayload(
  detail: LibraryFileDetail,
  ownerUserId: string,
  scope: 1 | 2,
  knowledgeSpaceOwnerId?: string,
  fileName?: string,
): SaveLibraryResourcePayload {
  const title = (fileName || detail.fileName).trim()

  if (!title) {
    throw new Error('缺少文件名称，无法保存到资料库')
  }

  if (detail.fileType === 'whiteboard') {
    throw new Error('当前 H5 还没接白板结果保存回资料库')
  }

  if (detail.fileType === 'classroom' || detail.fileType === 'review') {
    const filePath = detail.filePath.trim()

    if (!filePath) {
      throw new Error('缺少结果路径参数，无法保存到资料库')
    }

    return {
      parentId: '0',
      scope,
      knowledgeSpaceOwnerId: scope === 2 ? (knowledgeSpaceOwnerId?.trim() || '') : '',
      domain: 2,
      type: detail.fileType === 'review' ? 22 : 21,
      sourceNodeId: '',
      taskId: filePath,
      title,
      sortOrder: 0,
      ownerUserId,
    }
  }

  const fileUrl = (detail.fileUrl || detail.filePath).trim()
  const fileInfo = parseOssResourceInfo(fileUrl)

  return {
    parentId: '0',
    scope,
    knowledgeSpaceOwnerId: scope === 2 ? (knowledgeSpaceOwnerId?.trim() || '') : '',
    domain: 2,
    type: 2,
    sourceNodeId: '',
    taskId: '',
    title,
    sortOrder: 0,
    ownerUserId,
    document: {
      ossBucket: fileInfo.ossBucket,
      ossKey: fileInfo.ossKey,
      fileName: title,
      fileExt: fileInfo.fileExt,
      fileSize: detail.sizeBytes ?? 0,
      md5: fileInfo.md5,
    },
  }
}

function flattenResourceTree(
  nodes: RawTreeNode[] | null | undefined,
  output: LibraryResourceFile[],
): void {
  if (!Array.isArray(nodes)) {
    return
  }

  nodes.forEach((node) => {
    const hasChildren = Boolean(node.children?.length)
    const isParsedFile = node.type !== 20 && !hasChildren && node.aiParseState === 2
    const fileName = node.title || node.fileName || ''
    const resourceId = node.refDriveId ?? ''

    if (isParsedFile && fileName && resourceId) {
      output.push({
        nodeId: String(node.id ?? ''),
        resourceId,
        fileName,
        fileExt: (node.fileExt ?? '').toLowerCase(),
        fileType: inferLibraryFileType(fileName, node.fileExt ?? ''),
        fileSize: node.fileSize ?? null,
        createBy: node.createBy ?? '',
        createTime: node.createTime ?? '',
      })
    }

    if (node.children?.length) {
      flattenResourceTree(node.children, output)
    }
  })
}

function normalizeLibraryTreeNodes(nodes: RawTreeNode[] | null | undefined): LibraryTreeNode[] {
  if (!Array.isArray(nodes)) {
    return []
  }

  return nodes.map((node) => ({
    nodeId: String(node.id ?? ''),
    title: node.title?.trim() || node.fileName?.trim() || '',
    fileName: node.fileName?.trim() || node.title?.trim() || '',
    fileExt: (node.fileExt ?? '').toLowerCase(),
    fileSize: node.fileSize ?? null,
    createBy: node.createBy ?? '',
    createTime: node.createTime ?? '',
    resourceId: node.refDriveId?.trim() || '',
    ossKey: node.ossKey?.trim() || '',
    playUrl: node.playUrl?.trim() || '',
    aiParseState: typeof node.aiParseState === 'number' ? node.aiParseState : null,
    nodeType: typeof node.type === 'number' ? node.type : null,
    children: normalizeLibraryTreeNodes(node.children),
  }))
}

export async function fetchKnowledgeSpaces(signal?: AbortSignal): Promise<KnowledgeSpaceOption[]> {
  const response = await authorizedFetch(KNOWLEDGE_SPACE_PATH, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('获取知识空间列表失败')
  }

  const payload = (await response.json()) as KnowledgeSpaceResponse

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '获取知识空间列表失败')
  }

  if (!Array.isArray(payload.result)) {
    return []
  }

  return payload.result.flatMap((item) => {
    if (!item?.id || !item.spaceName) {
      return []
    }

    return [{
      id: item.id,
      name: item.spaceName,
    }]
  })
}

export async function fetchLibraryFiles(
  options: {
    scope: 'personal' | 'org'
    keyword?: string
    knowledgeSpaceOwnerId?: string
    signal?: AbortSignal
  },
): Promise<LibraryResourceFile[]> {
  const params: Record<string, string> = {
    domain: '2',
  }

  if (options.scope === 'personal') {
    params.scope = '1'
    params.ownerUserId = getLibraryOwnerUserId()
  } else {
    if (!options.knowledgeSpaceOwnerId?.trim()) {
      throw new Error('组织资料库必须先选择知识空间')
    }

    params.scope = '2'
    params.knowledgeSpaceOwnerId = options.knowledgeSpaceOwnerId.trim()
  }

  if (options.keyword?.trim()) {
    params.title = options.keyword.trim()
  }

  const searchParams = new URLSearchParams(params)
  const response = await authorizedFetch(`${RESOURCE_TREE_PATH}?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error('获取资料库文件失败')
  }

  const payload = (await response.json()) as ResourceTreeResponse

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '获取资料库文件失败')
  }

  const files: LibraryResourceFile[] = []
  flattenResourceTree(payload.result, files)

  return files
}

export async function fetchLibraryTreeNodes(
  options: {
    scope: 'personal' | 'org'
    knowledgeSpaceOwnerId?: string
    signal?: AbortSignal
  },
): Promise<LibraryTreeNode[]> {
  const params: Record<string, string> = {
    domain: '2',
  }

  if (options.scope === 'personal') {
    params.scope = '1'
    params.ownerUserId = getLibraryOwnerUserId()
  } else {
    if (!options.knowledgeSpaceOwnerId?.trim()) {
      throw new Error('组织资料库必须先选择知识空间')
    }

    params.scope = '2'
    params.knowledgeSpaceOwnerId = options.knowledgeSpaceOwnerId.trim()
  }

  const searchParams = new URLSearchParams(params)
  const response = await authorizedFetch(`${RESOURCE_TREE_PATH}?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error('获取资料库树失败')
  }

  const payload = (await response.json()) as ResourceTreeResponse

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '获取资料库树失败')
  }

  return normalizeLibraryTreeNodes(payload.result)
}

function normalizeLibraryPageFileType(type: string): Exclude<LibraryPageFileType, 'all'> {
  if (type === 'image' || type === 'video' || type === 'audio' || type === 'classroom' || type === 'review' || type === 'whiteboard') {
    return type
  }

  if (type === 'document') {
    return 'document'
  }

  return 'other'
}

function normalizeLibraryPageFile(item: RawLibraryPageFileItem): LibraryPageFileItem | null {
  if (!item.file_id || !item.file_name || !item.session_id) {
    return null
  }

  return {
    fileId: item.file_id,
    fileName: item.file_name,
    agentName: item.agent_name?.trim() || '未命名来源',
    fileType: normalizeLibraryPageFileType(item.file_type ?? ''),
    filePath: item.file_path?.trim() || '',
    createdAt: item.created_at?.trim() || '',
    sessionId: item.session_id,
    agentId: item.agent_id?.trim() || null,
    skillName: item.skill_name?.trim() || null,
  }
}

export async function fetchLibraryPageFiles(options: {
  agentType: LibraryPageAgentType
  fileType: LibraryPageFileType
  keyword?: string
  signal?: AbortSignal
}): Promise<LibraryPageFileItem[]> {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法加载资料库')
  }

  const params: Record<string, string> = {
    user_id: userId,
  }

  if (options.agentType !== 'all') {
    params.agent_type = options.agentType
  }

  if (options.fileType !== 'all') {
    params.file_type = options.fileType
  }

  if (options.keyword?.trim()) {
    params.keyword = options.keyword.trim()
  }

  const response = await authorizedFetch(buildAiApiUrl(LIBRARY_PAGE_PATH, params), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`获取资料库主列表失败（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as LibraryPageResponse

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '获取资料库主列表失败')
  }

  return (payload.files ?? [])
    .map(normalizeLibraryPageFile)
    .filter((item): item is LibraryPageFileItem => item !== null)
}

export async function fetchLibraryFileDetail(fileId: string, signal?: AbortSignal): Promise<LibraryFileDetail> {
  const response = await authorizedFetch(buildAiApiUrl(`${LIBRARY_PAGE_PATH}/${encodeURIComponent(fileId)}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`获取资料文件详情失败（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as LibraryDetailResponse
  const normalized = normalizeLibraryPageFile(payload)

  if (!normalized) {
    throw new Error('资料文件详情字段不完整')
  }

  return {
    ...normalized,
    fileUrl: payload.file_url?.trim() || '',
    sizeBytes: typeof payload.size_bytes === 'number' ? payload.size_bytes : null,
  }
}

export function buildLibraryPreviewUrl(fileUrl: string): string {
  return buildAiApiUrl(LIBRARY_PREVIEW_PATH, {
    url: fileUrl,
  })
}

export async function fetchLibraryPreviewContent(fileUrl: string, signal?: AbortSignal): Promise<string> {
  const response = await authorizedFetch(buildLibraryPreviewUrl(fileUrl), {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`获取资料文件预览失败（HTTP ${response.status}）`)
  }

  return response.text()
}

function parseOssResourceInfoFromTreeNode(node: LibraryTreeNode) {
  const normalizedPlayUrl = node.playUrl.trim()
  const normalizedOssKey = node.ossKey.trim()

  if (!normalizedPlayUrl && !normalizedOssKey) {
    throw new Error('当前节点缺少文件地址，无法保存到资料库')
  }

  let parsedUrl: URL | null = null

  if (normalizedPlayUrl) {
    try {
      parsedUrl = new URL(normalizedPlayUrl)
    } catch {
      throw new Error('当前节点文件地址无效，无法保存到资料库')
    }
  }

  const ossBucket = parsedUrl?.hostname.split('.')[0] ?? ''
  const ossKey = normalizedOssKey || parsedUrl?.pathname.replace(/^\/+/, '') || ''

  if (!ossBucket || !ossKey) {
    throw new Error('当前节点缺少完整 OSS 信息，无法保存到资料库')
  }

  const ossFileName = ossKey.split('/').pop() ?? ''
  const fileExt = node.fileExt || getFileExt(ossKey) || getFileExt(ossFileName)
  const md5Candidate = ossFileName.includes('.') ? ossFileName.slice(0, ossFileName.lastIndexOf('.')) : ''
  const md5 = /^[a-f0-9]{32}$/i.test(md5Candidate) ? md5Candidate : ''

  return {
    ossBucket,
    ossKey,
    fileExt,
    md5,
  }
}

function buildSaveLibraryTreePayload(
  node: LibraryTreeNode,
  ownerUserId: string,
  scope: 1 | 2,
  knowledgeSpaceOwnerId?: string,
  fileName?: string,
): SaveLibraryResourcePayload {
  const title = (fileName || node.fileName || node.title).trim()

  if (!title) {
    throw new Error('缺少文件名称，无法保存到资料库')
  }

  if (node.nodeType === 20 || node.children.length > 0) {
    throw new Error('当前节点不是文件，无法保存到资料库')
  }

  const fileInfo = parseOssResourceInfoFromTreeNode(node)

  return {
    parentId: '0',
    scope,
    knowledgeSpaceOwnerId: scope === 2 ? (knowledgeSpaceOwnerId?.trim() || '') : '',
    domain: 2,
    type: 2,
    sourceNodeId: '',
    taskId: '',
    title,
    sortOrder: 0,
    ownerUserId,
    document: {
      ossBucket: fileInfo.ossBucket,
      ossKey: fileInfo.ossKey,
      fileName: title,
      fileExt: fileInfo.fileExt,
      fileSize: node.fileSize ?? 0,
      md5: fileInfo.md5,
    },
  }
}

async function saveLibraryTreeNodeCore(options: {
  node: LibraryTreeNode
  fileName?: string
  scope: 1 | 2
  knowledgeSpaceOwnerId?: string
  signal?: AbortSignal
}): Promise<string> {
  const ownerUserId = getLibraryOwnerUserId()

  if (options.scope === 2 && !options.knowledgeSpaceOwnerId?.trim()) {
    throw new Error('保存到组织资料库前必须先选择知识空间')
  }

  const payload = buildSaveLibraryTreePayload(
    options.node,
    ownerUserId,
    options.scope,
    options.knowledgeSpaceOwnerId,
    options.fileName,
  )
  const response = await authorizedFetch(RESOURCE_NODE_ADD_PATH, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`保存到资料库失败（HTTP ${response.status}）`)
  }

  const result = (await response.json()) as SaveLibraryResourceResponse

  if (result.success === false) {
    throw new Error(result.message || result.msg || '保存到资料库失败')
  }

  return result.result?.trim() || ''
}

export async function saveLibraryTreeNodeToPersonalResource(
  node: LibraryTreeNode,
  fileName?: string,
  signal?: AbortSignal,
): Promise<string> {
  return saveLibraryTreeNodeCore({
    node,
    fileName,
    scope: 1,
    signal,
  })
}

export async function saveLibraryTreeNodeToOrganizationResource(
  node: LibraryTreeNode,
  knowledgeSpaceOwnerId: string,
  fileName?: string,
  signal?: AbortSignal,
): Promise<string> {
  return saveLibraryTreeNodeCore({
    node,
    fileName,
    scope: 2,
    knowledgeSpaceOwnerId,
    signal,
  })
}

async function saveLibraryFileToResourceCore(options: {
  fileId: string
  fileName?: string
  scope: 1 | 2
  knowledgeSpaceOwnerId?: string
  signal?: AbortSignal
}): Promise<string> {
  const ownerUserId = getLibraryOwnerUserId()

  if (options.scope === 2 && !options.knowledgeSpaceOwnerId?.trim()) {
    throw new Error('保存到组织资料库前必须先选择知识空间')
  }

  const detail = await fetchLibraryFileDetail(options.fileId, options.signal)
  const payload = buildSaveLibraryPayload(
    detail,
    ownerUserId,
    options.scope,
    options.knowledgeSpaceOwnerId,
    options.fileName,
  )
  const response = await authorizedFetch(RESOURCE_NODE_ADD_PATH, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`保存到资料库失败（HTTP ${response.status}）`)
  }

  const result = (await response.json()) as SaveLibraryResourceResponse

  if (result.success === false) {
    throw new Error(result.message || result.msg || '保存到资料库失败')
  }

  return result.result?.trim() || ''
}

export async function saveLibraryFileToPersonalResource(
  fileId: string,
  fileName?: string,
  signal?: AbortSignal,
): Promise<string> {
  return saveLibraryFileToResourceCore({
    fileId,
    fileName,
    scope: 1,
    signal,
  })
}

export async function saveLibraryFileToOrganizationResource(
  fileId: string,
  knowledgeSpaceOwnerId: string,
  fileName?: string,
  signal?: AbortSignal,
): Promise<string> {
  return saveLibraryFileToResourceCore({
    fileId,
    fileName,
    scope: 2,
    knowledgeSpaceOwnerId,
    signal,
  })
}
