import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchClassroomGenerateStatus, resolveClassroomPreviewState, type ClassroomPreviewState } from '../../../services/classroom'
import { fetchCourseReviewResult, resolveCourseReviewPreviewPayload, type CourseReviewPreviewPayload } from '../../../services/courseReview'
import {
  fetchLibraryFileDetail,
  fetchLibraryPreviewContent,
  type LibraryFileDetail,
  type LibraryPageFileItem,
} from '../../../services/library'
import './AiSidebarLibraryPage.css'

type AiLibraryFilePreviewProps = {
  selectedFile: LibraryPageFileItem
  initialDetail?: LibraryFileDetail | null
  showOpenSessionLink?: boolean
  onBack: () => void
  onOpenSession: (sessionId: string) => void
}

type LibraryPreviewLanguage = 'html' | 'markdown' | 'text' | 'json' | null

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function isHtmlPreviewFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return ['html', 'htm'].includes(ext)
}

function isMarkdownPreviewFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return ['md', 'markdown'].includes(ext)
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

function resolveDocumentPreviewLanguage(detail: LibraryFileDetail): LibraryPreviewLanguage {
  if (isHtmlPreviewFile(detail.fileName)) {
    return 'html'
  }

  if (isMarkdownPreviewFile(detail.fileName)) {
    return 'markdown'
  }

  return 'text'
}

export default function AiLibraryFilePreview({
  selectedFile,
  initialDetail = null,
  showOpenSessionLink = true,
  onBack,
  onOpenSession,
}: AiLibraryFilePreviewProps) {
  const [previewDetail, setPreviewDetail] = useState<LibraryFileDetail | null>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [previewLanguage, setPreviewLanguage] = useState<LibraryPreviewLanguage>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [classroomPreview, setClassroomPreview] = useState<ClassroomPreviewState | null>(null)
  const [reviewPreview, setReviewPreview] = useState<CourseReviewPreviewPayload | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      setPreviewLoading(true)
      setPreviewError('')
      setPreviewContent('')
      setPreviewLanguage(null)
      setPreviewDetail(initialDetail)
      setClassroomPreview(null)
      setReviewPreview(null)

      try {
        const detail = initialDetail ?? await fetchLibraryFileDetail(selectedFile.fileId, controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setPreviewDetail(detail)

        // 对齐 PC：课堂和评课先走各自的结果接口，普通文档再走通用预览接口。
        if (detail.fileType === 'classroom') {
          const classroomResult = await fetchClassroomGenerateStatus(detail.filePath, controller.signal)
          const resolvedClassroomPreview = resolveClassroomPreviewState(classroomResult)

          if (!controller.signal.aborted) {
            setClassroomPreview(resolvedClassroomPreview)
          }

          if (resolvedClassroomPreview.tone !== 'ready' || !resolvedClassroomPreview.classroomUrl) {
            return
          }

          const nextContent = await fetchLibraryPreviewContent(resolvedClassroomPreview.classroomUrl, controller.signal)

          if (!controller.signal.aborted) {
            setPreviewContent(nextContent)
            setPreviewLanguage('html')
          }

          return
        }

        if (detail.fileType === 'review') {
          const reviewResult = await fetchCourseReviewResult(detail.filePath, controller.signal)

          if (controller.signal.aborted) {
            return
          }

          const resolvedReviewPreview = resolveCourseReviewPreviewPayload(reviewResult)
          setReviewPreview(resolvedReviewPreview)

          if (resolvedReviewPreview.pendingMessage) {
            return
          }

          if (resolvedReviewPreview.externalUrl) {
            const nextContent = await fetchLibraryPreviewContent(resolvedReviewPreview.externalUrl, controller.signal)

            if (!controller.signal.aborted) {
              setPreviewContent(nextContent)
              setPreviewLanguage(resolvedReviewPreview.language)
            }

            return
          }

          setPreviewContent(resolvedReviewPreview.content)
          setPreviewLanguage(resolvedReviewPreview.language)
          return
        }

        if (isImageFile(detail) || !detail.fileUrl) {
          return
        }

        const nextContent = await fetchLibraryPreviewContent(detail.fileUrl, controller.signal)

        if (!controller.signal.aborted) {
          setPreviewContent(nextContent)

          if (detail.fileType === 'document') {
            setPreviewLanguage(resolveDocumentPreviewLanguage(detail))
          } else {
            setPreviewLanguage(isHtmlPreviewFile(detail.fileName) ? 'html' : 'text')
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
  }, [initialDetail, selectedFile.fileId])

  const previewFile = previewDetail ?? null
  const previewName = previewFile?.fileName || selectedFile.fileName
  const canViewSession = useMemo(() => {
    return showOpenSessionLink && Boolean(selectedFile.sessionId) && !isImSession(selectedFile.sessionId)
  }, [selectedFile.sessionId, showOpenSessionLink])
  const showImage = previewFile ? isImageFile(previewFile) : false
  const showHtml = previewLanguage === 'html' && previewContent.trim().length > 0
  const showMarkdown = previewLanguage === 'markdown' && previewContent.trim().length > 0
  const showText = (previewLanguage === 'text' || previewLanguage === 'json') && previewContent.trim().length > 0
  const showClassroom = previewFile?.fileType === 'classroom' && classroomPreview !== null
  const showReviewPending = previewFile?.fileType === 'review' && Boolean(reviewPreview?.pendingMessage)

  return (
    <div className="ai-library-hub-page">
      <div className="ai-library-hub-preview-topbar">
        <button className="ai-library-hub-header-btn" type="button" onClick={onBack}>
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
        <div className="ai-library-file-preview-layout">
          <div className="ai-library-file-preview-content">
            {previewLoading && !previewFile ? <div className="ai-library-hub-empty">文件详情加载中...</div> : null}
            {previewError ? <div className="ai-library-hub-empty">{previewError}</div> : null}
            {!previewLoading && !previewError && previewFile && previewFile.fileType === 'classroom' && !showClassroom ? (
              <div className="ai-library-hub-empty">课堂结果暂时没有可展示内容。</div>
            ) : null}
            {!previewLoading && !previewError && showClassroom && classroomPreview && classroomPreview.tone !== 'ready' ? (
              <div className="ai-library-hub-status-card">
                <div className={`ai-library-hub-status-badge is-${classroomPreview.tone}`}>{classroomPreview.statusLabel}</div>
                <div className="ai-library-hub-status-desc">{classroomPreview.detail}</div>
              </div>
            ) : null}
            {!previewLoading && !previewError && showReviewPending ? (
              <div className="ai-library-hub-empty">{reviewPreview?.pendingMessage}</div>
            ) : null}
            {!previewLoading && !previewError && previewFile && !previewFile.fileUrl && previewFile.fileType === 'document' ? (
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
            {!previewLoading && !previewError && showHtml ? (
              <iframe
                className="ai-library-hub-frame-preview"
                sandbox="allow-same-origin allow-scripts allow-forms"
                srcDoc={previewContent}
                title={previewName}
              />
            ) : null}
            {!previewLoading && !previewError && showMarkdown ? (
              <div className="ai-library-hub-markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {previewContent}
                </ReactMarkdown>
              </div>
            ) : null}
            {!previewLoading && !previewError && showText ? (
              <pre className="ai-library-hub-text-preview">{previewContent}</pre>
            ) : null}
            {!previewLoading && !previewError && previewFile && !showImage && !showHtml && !showMarkdown && !showText && !showClassroom && !showReviewPending ? (
              <div className="ai-library-hub-empty">当前文件暂时没有可展示的文档预览。</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
