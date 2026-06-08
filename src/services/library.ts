import { authorizedFetch } from '../utils/request'

const KNOWLEDGE_SPACE_PATH = '/res/knowledgeSpace/optionList'
const RESOURCE_TREE_PATH = '/res/node/tree'

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
