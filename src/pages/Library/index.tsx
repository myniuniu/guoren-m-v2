import { useEffect, useMemo, useState } from 'react'
import {
  fetchKnowledgeSpaces,
  fetchLibraryPreviewContent,
  fetchLibraryTreeNodes,
  type KnowledgeSpaceOption,
  type LibraryTreeNode,
} from '../../services/library'
import LibraryScopeTabs, { type LibraryScopeTabKey } from './components/LibraryScopeTabs'
import './index.css'

type LibraryDisplayType = 'folder' | 'document' | 'image' | 'video' | 'audio' | 'other'

type LibraryTreeListItem = LibraryTreeNode & {
  depth: number
  isFolder: boolean
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function isFolderNode(node: Pick<LibraryTreeNode, 'nodeType' | 'children'>): boolean {
  return node.nodeType === 20 || node.children.length > 0
}

function inferLibraryDisplayType(node: LibraryTreeListItem): LibraryDisplayType {
  if (node.isFolder) {
    return 'folder'
  }

  const ext = node.fileExt.toLowerCase() || node.fileName.split('.').pop()?.toLowerCase() || ''

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
    return 'image'
  }

  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'].includes(ext)) {
    return 'video'
  }

  if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(ext)) {
    return 'audio'
  }

  if (['pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'json', 'csv', 'html', 'htm', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
    return 'document'
  }

  return 'other'
}

function FileTypeIcon({ type }: { type: LibraryDisplayType }) {
  const config: Record<LibraryDisplayType, { bg: string; label: string }> = {
    folder: { bg: '#F59E0B', label: 'DIR' },
    document: { bg: '#4A7CFF', label: 'DOC' },
    image: { bg: '#FF8A34', label: 'IMG' },
    video: { bg: '#8D5BFF', label: 'VID' },
    audio: { bg: '#25B864', label: 'AUD' },
    other: { bg: '#8c8f96', label: 'FILE' },
  }

  const { bg, label } = config[type]

  return (
    <div className="library-file-icon" style={{ background: bg }}>
      {label}
    </div>
  )
}

function formatDateTime(value: string): string {
  if (!value) {
    return '时间未知'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/\//g, '-')
}

function formatFileSize(sizeBytes: number | null): string {
  if (!sizeBytes || sizeBytes <= 0) {
    return '未知大小'
  }

  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`
  }

  return `${sizeBytes} B`
}

function flattenTreeNodes(nodes: LibraryTreeNode[], depth = 0): LibraryTreeListItem[] {
  return nodes.flatMap((node) => {
    const current: LibraryTreeListItem = {
      ...node,
      depth,
      isFolder: isFolderNode(node),
    }

    return [current, ...flattenTreeNodes(node.children, depth + 1)]
  })
}

function isImageNode(node: LibraryTreeListItem): boolean {
  return inferLibraryDisplayType(node) === 'image'
}

function isTextPreviewNode(node: LibraryTreeListItem): boolean {
  const ext = node.fileExt.toLowerCase() || node.fileName.split('.').pop()?.toLowerCase() || ''
  return ['md', 'markdown', 'json', 'txt', 'csv', 'html', 'htm'].includes(ext)
}

function canPreviewNode(node: LibraryTreeListItem): boolean {
  return !node.isFolder && Boolean(node.playUrl.trim())
}

function buildNodeTitle(node: LibraryTreeListItem): string {
  return node.fileName || node.title || '未命名节点'
}

function buildNodeMeta(node: LibraryTreeListItem): string {
  const pieces = [
    node.createBy || '未知来源',
    formatDateTime(node.createTime),
    `解析状态 ${node.aiParseState ?? '-'}`,
  ]

  if (!node.isFolder) {
    pieces.push(formatFileSize(node.fileSize))
  }

  return pieces.join(' · ')
}

function LibraryNodePreview({
  node,
  content,
  error,
  loading,
  onBack,
}: {
  node: LibraryTreeListItem | null
  content: string
  error: string
  loading: boolean
  onBack: () => void
}) {
  const nodeType = node ? inferLibraryDisplayType(node) : 'other'

  return (
    <div className="library-file-preview-page">
      <div className="library-file-preview-topbar">
        <button className="library-icon-btn" type="button" onClick={onBack}>
          <BackIcon />
        </button>
        <div className="library-file-preview-topbar-title">{node ? buildNodeTitle(node) : '资料预览'}</div>
        <div className="library-icon-placeholder" />
      </div>

      <div className="library-file-preview-stage">
        <div className="library-file-preview-paper">
          {loading && !node ? <div className="library-empty">资料详情加载中...</div> : null}
          {error ? <div className="library-empty">{error}</div> : null}
          {node ? (
            <>
              <div className="library-file-preview-paper-header">
                <div className="library-file-preview-badge">
                  <FileTypeIcon type={nodeType} />
                </div>
                <div className="library-file-preview-paper-title-wrap">
                  <div className="library-file-preview-paper-title">{buildNodeTitle(node)}</div>
                  <div className="library-file-preview-paper-meta">{buildNodeMeta(node)}</div>
                </div>
              </div>

              <div className="library-file-preview-paper-body">
                {loading ? <div className="library-empty">预览内容加载中...</div> : null}
                {!loading && node.isFolder ? (
                  <div className="library-empty">
                    <div className="library-empty-title">当前节点是目录</div>
                    <div className="library-empty-desc">这里已经改成直接展示个人 / 组织资料库接口返回的原始节点，不再额外过滤。</div>
                  </div>
                ) : null}
                {!loading && !node.isFolder && !node.playUrl.trim() ? (
                  <div className="library-empty">
                    <div className="library-empty-title">当前节点暂无可预览内容</div>
                    <div className="library-empty-desc">接口没有返回可直接预览的文件地址。</div>
                  </div>
                ) : null}
                {!loading && canPreviewNode(node) && isImageNode(node) ? (
                  <div className="library-preview-image-wrap">
                    <img
                      alt={buildNodeTitle(node)}
                      className="library-preview-image"
                      decoding="async"
                      loading="lazy"
                      src={node.playUrl}
                    />
                  </div>
                ) : null}
                {!loading && canPreviewNode(node) && !isImageNode(node) && isTextPreviewNode(node) ? (
                  <pre className="library-preview-text">{content || '当前文件暂时没有可展示的文本预览。'}</pre>
                ) : null}
                {!loading && canPreviewNode(node) && !isImageNode(node) && !isTextPreviewNode(node) ? (
                  <iframe className="library-preview-frame" src={node.playUrl} title={buildNodeTitle(node)} />
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const [activeScope, setActiveScope] = useState<LibraryScopeTabKey>('personal')
  const [knowledgeSpaces, setKnowledgeSpaces] = useState<KnowledgeSpaceOption[]>([])
  const [knowledgeSpacesLoading, setKnowledgeSpacesLoading] = useState(false)
  const [knowledgeSpacesError, setKnowledgeSpacesError] = useState('')
  const [selectedKnowledgeSpaceId, setSelectedKnowledgeSpaceId] = useState('')
  const [items, setItems] = useState<LibraryTreeListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewNode, setPreviewNode] = useState<LibraryTreeListItem | null>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [showOrgSpacePicker, setShowOrgSpacePicker] = useState(false)

  const selectedKnowledgeSpaceName = useMemo(() => {
    return knowledgeSpaces.find((item) => item.id === selectedKnowledgeSpaceId)?.name ?? ''
  }, [knowledgeSpaces, selectedKnowledgeSpaceId])

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      setKnowledgeSpacesLoading(true)
      setKnowledgeSpacesError('')

      try {
        const nextSpaces = await fetchKnowledgeSpaces(controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setKnowledgeSpaces(nextSpaces)
        setSelectedKnowledgeSpaceId((current) => {
          if (nextSpaces.some((space) => space.id === current)) {
            return current
          }

          return nextSpaces[0]?.id ?? ''
        })
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setKnowledgeSpacesError(loadError instanceof Error ? loadError.message : '知识空间加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setKnowledgeSpacesLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (activeScope === 'org' && !selectedKnowledgeSpaceId) {
      setItems([])
      return
    }

    const controller = new AbortController()

    void (async () => {
      setLoading(true)
      setError('')

      try {
        const nextTree = await fetchLibraryTreeNodes({
          scope: activeScope,
          knowledgeSpaceOwnerId: activeScope === 'org' ? selectedKnowledgeSpaceId : undefined,
          signal: controller.signal,
        })

        if (controller.signal.aborted) {
          return
        }

        setItems(flattenTreeNodes(nextTree))
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setItems([])
          setError(loadError instanceof Error ? loadError.message : '资料库加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [activeScope, selectedKnowledgeSpaceId])

  useEffect(() => {
    if (!previewNode) {
      setPreviewLoading(false)
      setPreviewError('')
      setPreviewContent('')
      return
    }

    setPreviewError('')
    setPreviewContent('')

    if (!canPreviewNode(previewNode) || !isTextPreviewNode(previewNode)) {
      setPreviewLoading(false)
      return
    }

    const controller = new AbortController()

    void (async () => {
      setPreviewLoading(true)

      try {
        const nextContent = await fetchLibraryPreviewContent(previewNode.playUrl, controller.signal)

        if (!controller.signal.aborted) {
          setPreviewContent(nextContent)
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setPreviewError(loadError instanceof Error ? loadError.message : '资料预览加载失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [previewNode])

  if (previewNode) {
    return (
      <>
        <LibraryNodePreview
          content={previewContent}
          error={previewError}
          loading={previewLoading}
          node={previewNode}
          onBack={() => {
            setPreviewNode(null)
          }}
        />
      </>
    )
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <LibraryScopeTabs activeScope={activeScope} onScopeChange={setActiveScope} />

        {activeScope === 'org' ? (
          <button
            className="library-org-space-trigger"
            disabled={knowledgeSpacesLoading}
            type="button"
            onClick={() => setShowOrgSpacePicker(true)}
          >
            <span>知识空间</span>
            <span className="library-org-space-value">
              {knowledgeSpacesLoading ? '加载中...' : selectedKnowledgeSpaceName || '暂无知识空间'}
            </span>
          </button>
        ) : null}
      </div>

      <div className="library-content">
        <div className="library-list">
          {knowledgeSpacesError && activeScope === 'org' ? <div className="library-empty">{knowledgeSpacesError}</div> : null}
          {loading ? <div className="library-empty">资料库加载中...</div> : null}
          {!loading && error ? <div className="library-empty">{error}</div> : null}
          {!loading && !error && items.length === 0 ? (
            <div className="library-empty">
              <div className="library-empty-title">当前没有资料节点</div>
              <div className="library-empty-desc">页面现在直接展示接口返回的数据，如果这里为空，就说明接口当前确实没有返回内容。</div>
            </div>
          ) : null}
          {!loading && !error && items.map((item) => {
            const displayType = inferLibraryDisplayType(item)

            return (
              <button
                className="library-item"
                key={`${item.nodeId}-${item.depth}`}
                type="button"
                onClick={() => {
                  setPreviewNode(item)
                  setPreviewError('')
                  setPreviewContent('')
                }}
              >
                <div className="library-item-main" style={{ paddingLeft: `${item.depth * 18}px` }}>
                  <FileTypeIcon type={displayType} />
                  <div className="library-item-body">
                    <div className="library-item-name">{buildNodeTitle(item)}</div>
                    <div className="library-item-meta">{buildNodeMeta(item)}</div>
                  </div>
                </div>
                <div className="library-item-side">
                  <span className="library-item-side-text">{item.isFolder ? '目录' : displayType}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {activeScope === 'org' && showOrgSpacePicker ? (
        <div className="library-filter-sheet-overlay" onClick={() => setShowOrgSpacePicker(false)}>
          <div className="library-filter-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="library-filter-sheet-handle" />
            <div className="library-filter-sheet-title">选择知识空间</div>
            {knowledgeSpacesLoading ? <div className="library-empty">知识空间加载中...</div> : null}
            {!knowledgeSpacesLoading && knowledgeSpacesError ? <div className="library-empty">{knowledgeSpacesError}</div> : null}
            {!knowledgeSpacesLoading && !knowledgeSpacesError ? (
              <div className="library-org-save-options">
                {knowledgeSpaces.map((space) => (
                  <button
                    className={`library-sheet-option ${selectedKnowledgeSpaceId === space.id ? 'is-active' : ''}`}
                    key={space.id}
                    type="button"
                    onClick={() => {
                      setSelectedKnowledgeSpaceId(space.id)
                      setShowOrgSpacePicker(false)
                    }}
                  >
                    <span>{space.name}</span>
                    {selectedKnowledgeSpaceId === space.id ? <span>已选</span> : null}
                  </button>
                ))}
                {knowledgeSpaces.length === 0 ? <div className="library-empty">当前没有可用知识空间。</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
