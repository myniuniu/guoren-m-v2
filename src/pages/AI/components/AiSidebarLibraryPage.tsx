import { Toast } from 'antd-mobile'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchKnowledgeSpaces,
  fetchLibraryFileDetail,
  fetchLibraryFileDownloadUrl,
  fetchLibraryPageFiles,
  fetchLibraryPreviewContent,
  saveLibraryFileToOrganizationResource,
  saveLibraryFileToPersonalResource,
  type KnowledgeSpaceOption,
  type LibraryFileDetail,
  type LibraryPageFileItem,
  type LibraryPageFileType,
} from '../../../services/library'
import './AiSidebarLibraryPage.css'

type AiSidebarLibraryPageProps = {
  onClose: () => void
  onOpenDrawer: () => void
  onOpenSession: (sessionId: string) => void
}

type FilterMenuKey = 'source' | 'type'

const LAST_SELECTED_ORG_ID_KEY = 'LAST_SELECTED_ORG_ID'

const FILE_TYPE_FILTERS: Array<{ key: LibraryPageFileType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'document', label: '文档' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'audio', label: '音频' },
  { key: 'classroom', label: '课堂' },
  { key: 'review', label: '评课' },
  { key: 'whiteboard', label: '白板' },
  { key: 'other', label: '其他' },
]

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="12" cy="19" r="1.9" />
    </svg>
  )
}

function getFileTypeLabel(fileType: Exclude<LibraryPageFileType, 'all'>): string {
  if (fileType === 'document') return '文档'
  if (fileType === 'image') return '图片'
  if (fileType === 'video') return '视频'
  if (fileType === 'audio') return '音频'
  if (fileType === 'classroom') return '课堂'
  if (fileType === 'review') return '评课'
  if (fileType === 'whiteboard') return '白板'
  return '其他'
}

function getFileTypeBadge(fileType: Exclude<LibraryPageFileType, 'all'>): string {
  if (fileType === 'document') return 'DOC'
  if (fileType === 'image') return 'IMG'
  if (fileType === 'video') return 'VID'
  if (fileType === 'audio') return 'AUD'
  if (fileType === 'classroom') return 'CLS'
  if (fileType === 'review') return 'REV'
  if (fileType === 'whiteboard') return 'WBD'
  return 'FILE'
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

function isHtmlPreviewFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return ['html', 'htm'].includes(ext)
}

function isImageFile(detail: LibraryFileDetail): boolean {
  if (detail.fileType === 'image') {
    return true
  }

  const ext = detail.fileName.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

function isImSession(sessionId: string): boolean {
  return sessionId.includes('_im_')
}

function buildListMeta(item: LibraryPageFileItem): string {
  return [
    item.agentName || '未命名来源',
    getFileTypeLabel(item.fileType),
    formatDateTime(item.createdAt),
  ].join(' · ')
}

function triggerBrowserDownload(downloadUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = fileName
  link.rel = 'noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function AiSidebarLibraryPage({
  onClose,
  onOpenDrawer,
  onOpenSession,
}: AiSidebarLibraryPageProps) {
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState<LibraryPageFileType>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [openFilterMenu, setOpenFilterMenu] = useState<FilterMenuKey | null>(null)
  const [files, setFiles] = useState<LibraryPageFileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<LibraryPageFileItem | null>(null)
  const [previewDetail, setPreviewDetail] = useState<LibraryFileDetail | null>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [knowledgeSpaces, setKnowledgeSpaces] = useState<KnowledgeSpaceOption[]>([])
  const [actionTargetFile, setActionTargetFile] = useState<LibraryPageFileItem | null>(null)
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim())
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [keyword])

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      setLoading(true)
      setError('')

      try {
        // “库”对齐 PC 文件库接口：类型筛选走接口，来源筛选继续在当前结果集里本地收口。
        const nextFiles = await fetchLibraryPageFiles({
          agentType: 'all',
          fileType: fileTypeFilter,
          keyword: debouncedKeyword,
          signal: controller.signal,
        })

        if (controller.signal.aborted) {
          return
        }

        setFiles(nextFiles)
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setFiles([])
          setError(loadError instanceof Error ? loadError.message : '库文件加载失败')
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
  }, [debouncedKeyword, fileTypeFilter])

  const sourceOptions = useMemo(() => {
    return [
      'all',
      ...Array.from(new Set(files.map((item) => item.agentName).filter(Boolean))),
    ]
  }, [files])

  const sourceMenuOptions = useMemo(() => (
    sourceOptions.map((source) => ({
      value: source,
      label: source === 'all' ? '全部来源' : source,
    }))
  ), [sourceOptions])

  const typeMenuOptions = useMemo(() => (
    FILE_TYPE_FILTERS.map((filter) => ({
      value: filter.key,
      label: filter.label,
    }))
  ), [])

  useEffect(() => {
    if (!sourceOptions.includes(sourceFilter)) {
      setSourceFilter('all')
    }
  }, [sourceFilter, sourceOptions])

  const visibleFiles = useMemo(() => {
    if (sourceFilter === 'all') {
      return files
    }

    return files.filter((item) => item.agentName === sourceFilter)
  }, [files, sourceFilter])

  const loadKnowledgeSpaceOptions = async (): Promise<KnowledgeSpaceOption[]> => {
    const nextSpaces = await fetchKnowledgeSpaces()
    setKnowledgeSpaces(nextSpaces)
    return nextSpaces
  }

  const resolveOrganizationOwnerId = async (): Promise<string> => {
    let savedOrgId = ''

    try {
      savedOrgId = localStorage.getItem(LAST_SELECTED_ORG_ID_KEY)?.trim() || ''
    } catch {
      savedOrgId = ''
    }

    if (savedOrgId) {
      return savedOrgId
    }

    if (knowledgeSpaces[0]?.id) {
      return knowledgeSpaces[0].id
    }

    const nextSpaces = await loadKnowledgeSpaceOptions()
    return nextSpaces[0]?.id?.trim() || ''
  }

  const closeActionSheet = () => {
    if (actionLoadingKey) {
      return
    }

    setActionTargetFile(null)
  }

  const handleViewSession = (item: LibraryPageFileItem) => {
    if (!item.sessionId || isImSession(item.sessionId)) {
      return
    }

    setActionTargetFile(null)
    onOpenSession(item.sessionId)
  }

  const handleDownloadFile = async (item: LibraryPageFileItem) => {
    if (!item.filePath.trim()) {
      Toast.show({ content: '缺少文件路径，暂时无法下载' })
      return
    }

    try {
      setActionLoadingKey('download')
      const downloadUrl = await fetchLibraryFileDownloadUrl(item.filePath)
      triggerBrowserDownload(downloadUrl, item.fileName)
      setActionTargetFile(null)
      Toast.show({ content: '已开始下载' })
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '下载失败，请稍后重试' })
    } finally {
      setActionLoadingKey(null)
    }
  }

  const handleSaveToPersonalLibrary = async (item: LibraryPageFileItem) => {
    try {
      setActionLoadingKey('save-personal')
      await saveLibraryFileToPersonalResource(item.fileId, item.fileName)
      setActionTargetFile(null)
      Toast.show({ content: '添加到个人资料库成功' })
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '添加到个人资料库失败' })
    } finally {
      setActionLoadingKey(null)
    }
  }

  const handleSaveToOrganizationLibrary = async (item: LibraryPageFileItem) => {
    try {
      setActionLoadingKey('save-organization')
      const knowledgeSpaceOwnerId = await resolveOrganizationOwnerId()

      if (!knowledgeSpaceOwnerId) {
        throw new Error('缺少组织知识空间ID，无法添加到组织资料库')
      }

      await saveLibraryFileToOrganizationResource(item.fileId, knowledgeSpaceOwnerId, item.fileName)
      setActionTargetFile(null)
      Toast.show({ content: '添加到组织资料库成功' })
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '添加到组织资料库失败' })
    } finally {
      setActionLoadingKey(null)
    }
  }

  useEffect(() => {
    if (!selectedFile) {
      setPreviewDetail(null)
      setPreviewContent('')
      setPreviewError('')
      setPreviewLoading(false)
      return
    }

    const controller = new AbortController()

    void (async () => {
      setPreviewLoading(true)
      setPreviewError('')
      setPreviewContent('')
      setPreviewDetail(null)

      try {
        const detail = await fetchLibraryFileDetail(selectedFile.fileId, controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setPreviewDetail(detail)

        // 对齐 PC：非图片文件统一先走预览接口，避免直接把会话产物页 URL 当成 iframe 页面塞进来。
        if (detail.fileUrl && !isImageFile(detail)) {
          const nextContent = await fetchLibraryPreviewContent(detail.fileUrl, controller.signal)

          if (!controller.signal.aborted) {
            setPreviewContent(nextContent)
          }
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setPreviewError(loadError instanceof Error ? loadError.message : '文件详情加载失败')
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
  }, [selectedFile])

  if (selectedFile) {
    const previewFile = previewDetail ?? null
    const previewName = previewFile?.fileName || selectedFile.fileName
    const canViewSession = Boolean(selectedFile.sessionId) && !isImSession(selectedFile.sessionId)
    const showImage = previewFile ? isImageFile(previewFile) : false
    const showHtml = previewFile ? isHtmlPreviewFile(previewFile.fileName) : false
    const showText = Boolean(previewFile) && !showImage && !showHtml && Boolean(previewContent)

    return (
      <div className="ai-library-hub-page">
        <div className="ai-library-hub-preview-topbar">
          <button className="ai-library-hub-header-btn" type="button" onClick={() => setSelectedFile(null)}>
            <BackIcon />
          </button>
          <div className="ai-library-hub-preview-title">{previewName}</div>
          {canViewSession ? (
            <button
              className="ai-library-hub-link-btn"
              type="button"
              onClick={() => onOpenSession(selectedFile.sessionId)}
            >
              查看对话
            </button>
          ) : (
            <div className="ai-library-hub-header-spacer" />
          )}
        </div>

        <div className="ai-library-hub-preview-body">
          <div className="ai-library-hub-preview-card">
            <div className="ai-library-hub-preview-meta">
              <span>{selectedFile.agentName || '未命名来源'}</span>
              <span>{getFileTypeLabel(selectedFile.fileType)}</span>
              <span>{formatDateTime(selectedFile.createdAt)}</span>
              {previewFile ? <span>{formatFileSize(previewFile.sizeBytes)}</span> : null}
            </div>

            {previewLoading && !previewFile ? <div className="ai-library-hub-empty">文件详情加载中...</div> : null}
            {previewError ? <div className="ai-library-hub-empty">{previewError}</div> : null}
            {!previewLoading && !previewError && previewFile && !previewFile.fileUrl ? (
              <div className="ai-library-hub-empty">当前文件暂无可预览内容。</div>
            ) : null}
            {!previewLoading && !previewError && previewFile && showImage ? (
              <div className="ai-library-hub-image-wrap">
                <img
                  alt={previewName}
                  className="ai-library-hub-image"
                  decoding="async"
                  loading="lazy"
                  src={previewFile.fileUrl}
                />
              </div>
            ) : null}
            {!previewLoading && !previewError && previewFile && showText ? (
              <pre className="ai-library-hub-text-preview">{previewContent || '当前文件暂时没有可展示的文本预览。'}</pre>
            ) : null}
            {!previewLoading && !previewError && previewFile && showHtml ? (
              <iframe
                className="ai-library-hub-frame-preview"
                srcDoc={previewContent}
                title={previewName}
              />
            ) : null}
            {!previewLoading && !previewError && previewFile && showText ? (
              <pre className="ai-library-hub-text-preview">{previewContent}</pre>
            ) : null}
            {!previewLoading && !previewError && previewFile && !showImage && !showHtml && !showText ? (
              <div className="ai-library-hub-empty">当前文件暂时没有可展示的文档预览。</div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-library-hub-page">
      <div className="ai-library-hub-header">
        <button className="ai-library-hub-header-btn" type="button" onClick={onOpenDrawer}>
          <MenuIcon />
        </button>
        <div className="ai-library-hub-title">库</div>
        <button className="ai-library-hub-header-btn" type="button" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="ai-library-hub-toolbar">
        <label className="ai-library-hub-search">
          <SearchIcon />
          <input
            placeholder="搜索库文件"
            type="text"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setOpenFilterMenu(null)
            }}
          />
        </label>

        <div className="ai-library-hub-select-region">
          <div className="ai-library-hub-select-row">
            <div className={`ai-library-hub-select-cell ${openFilterMenu === 'source' ? 'is-open' : ''}`}>
              <button
                aria-expanded={openFilterMenu === 'source'}
                className={`ai-library-hub-select ${openFilterMenu === 'source' ? 'is-open' : ''}`}
                type="button"
                onClick={() => setOpenFilterMenu((current) => current === 'source' ? null : 'source')}
              >
                <span className="ai-library-hub-select-label">来源</span>
                <span className="ai-library-hub-select-value">{sourceFilter === 'all' ? '全部来源' : sourceFilter}</span>
              </button>

              {openFilterMenu === 'source' ? (
                <div className="ai-library-hub-select-menu">
                  <div className="ai-library-hub-select-menu-title">选择来源</div>
                  <div className="ai-library-hub-select-menu-list">
                    {sourceMenuOptions.map((option) => {
                      const selected = sourceFilter === option.value

                      return (
                        <button
                          className={`ai-library-hub-select-option ${selected ? 'is-active' : ''}`}
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSourceFilter(option.value)
                            setOpenFilterMenu(null)
                          }}
                        >
                          <span>{option.label}</span>
                          {selected ? <span className="ai-library-hub-select-option-mark">已选</span> : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`ai-library-hub-select-cell ${openFilterMenu === 'type' ? 'is-open' : ''}`}>
              <button
                aria-expanded={openFilterMenu === 'type'}
                className={`ai-library-hub-select ${openFilterMenu === 'type' ? 'is-open' : ''}`}
                type="button"
                onClick={() => setOpenFilterMenu((current) => current === 'type' ? null : 'type')}
              >
                <span className="ai-library-hub-select-label">类型</span>
                <span className="ai-library-hub-select-value">{typeMenuOptions.find((option) => option.value === fileTypeFilter)?.label ?? '全部'}</span>
              </button>

              {openFilterMenu === 'type' ? (
                <div className="ai-library-hub-select-menu">
                  <div className="ai-library-hub-select-menu-title">选择类型</div>
                  <div className="ai-library-hub-select-menu-list">
                    {typeMenuOptions.map((option) => {
                      const selected = fileTypeFilter === option.value

                      return (
                        <button
                          className={`ai-library-hub-select-option ${selected ? 'is-active' : ''}`}
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setFileTypeFilter(option.value as LibraryPageFileType)
                            setOpenFilterMenu(null)
                          }}
                        >
                          <span>{option.label}</span>
                          {selected ? <span className="ai-library-hub-select-option-mark">已选</span> : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="ai-library-hub-list">
        {loading ? <div className="ai-library-hub-empty">库文件加载中...</div> : null}
        {!loading && error ? <div className="ai-library-hub-empty">{error}</div> : null}
        {!loading && !error && visibleFiles.length === 0 ? <div className="ai-library-hub-empty">当前没有可展示的库文件。</div> : null}
        {!loading && !error && visibleFiles.map((item) => (
          <div className="ai-library-hub-item-row" key={item.fileId}>
            <button
              className="ai-library-hub-item ai-library-hub-item-main"
              type="button"
              onClick={() => setSelectedFile(item)}
            >
              <span className={`ai-library-hub-item-badge type-${item.fileType}`}>{getFileTypeBadge(item.fileType)}</span>
              <span className="ai-library-hub-item-body">
                <span className="ai-library-hub-item-name">{item.fileName}</span>
                <span className="ai-library-hub-item-meta">{buildListMeta(item)}</span>
              </span>
            </button>
            <button
              aria-label="更多操作"
              className="ai-library-hub-item-more"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setActionTargetFile(item)
              }}
            >
              <MoreIcon />
            </button>
          </div>
        ))}
      </div>

      {actionTargetFile ? (
        <div
          className="ai-library-hub-action-overlay"
          role="presentation"
          onClick={closeActionSheet}
        >
          <div
            className="ai-library-hub-action-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="库文件更多操作"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ai-library-hub-action-sheet-title">{actionTargetFile.fileName || '更多操作'}</div>
            <div className="ai-library-hub-action-sheet-meta">{buildListMeta(actionTargetFile)}</div>

            {isImSession(actionTargetFile.sessionId) ? null : (
              <button
                className="ai-library-hub-action-btn"
                disabled={Boolean(actionLoadingKey)}
                type="button"
                onClick={() => handleViewSession(actionTargetFile)}
              >
                查看对话
              </button>
            )}

            {actionTargetFile.fileType === 'document' ? (
              <button
                className="ai-library-hub-action-btn"
                disabled={Boolean(actionLoadingKey)}
                type="button"
                onClick={() => {
                  void handleDownloadFile(actionTargetFile)
                }}
              >
                {actionLoadingKey === 'download' ? '下载中...' : '下载'}
              </button>
            ) : null}

            <button
              className="ai-library-hub-action-btn"
              disabled={Boolean(actionLoadingKey)}
              type="button"
              onClick={() => {
                void handleSaveToPersonalLibrary(actionTargetFile)
              }}
            >
              {actionLoadingKey === 'save-personal' ? '处理中...' : '添加到个人资料库'}
            </button>

            <button
              className="ai-library-hub-action-btn"
              disabled={Boolean(actionLoadingKey)}
              type="button"
              onClick={() => {
                void handleSaveToOrganizationLibrary(actionTargetFile)
              }}
            >
              {actionLoadingKey === 'save-organization' ? '处理中...' : '添加到组织资料库'}
            </button>

            <button
              className="ai-library-hub-action-btn is-cancel"
              disabled={Boolean(actionLoadingKey)}
              type="button"
              onClick={closeActionSheet}
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AiSidebarLibraryPage
