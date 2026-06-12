import { authorizedFetch, buildAiApiUrl } from '../utils/request'
import {
  AI_COURSE_REVIEW_SKILL_NAME,
  COURSE_REVIEW_ARTIFACT_PREFIX,
  buildCourseReviewArtifactPath,
  isCourseReviewArtifact,
  normalizeCourseReviewTaskId,
  parseCourseReviewTaskId,
} from './courseReviewArtifact'

const COURSE_REVIEW_RESULT_PATH = '/api/v1/course_review/result'

export {
  AI_COURSE_REVIEW_SKILL_NAME,
  COURSE_REVIEW_ARTIFACT_PREFIX,
  buildCourseReviewArtifactPath,
  isCourseReviewArtifact,
  normalizeCourseReviewTaskId,
  parseCourseReviewTaskId,
}

export interface CourseReviewIndicator {
  name?: string
  report_oss_url?: string | null
  analysis_result?: unknown
  [key: string]: unknown
}

export interface CourseReviewResult {
  status?: string
  progress?: number
  stage?: string
  message?: string
  oss_url?: string | null
  report_oss_url?: string | null
  indicators?: CourseReviewIndicator[]
  html?: string
  content?: string
  markdown?: string
  report_html?: string
  report_markdown?: string
  report_content?: string
  file_url?: string
  url?: string
  report_url?: string
  filename?: string
  [key: string]: unknown
}

export interface CourseReviewPreviewPayload {
  content: string
  language: 'html' | 'markdown' | 'json'
  externalUrl?: string
  pendingMessage?: string
}

function isNonEmptyHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim())
}

function unwrapCourseReviewResult(data: unknown): CourseReviewResult | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const record = data as Record<string, unknown>

  if (record.data && typeof record.data === 'object') {
    return record.data as CourseReviewResult
  }

  if (record.result && typeof record.result === 'object') {
    return record.result as CourseReviewResult
  }

  return record as CourseReviewResult
}

export function extractCourseReviewReportOssUrls(result: CourseReviewResult): string[] {
  const urls: string[] = []

  if (isNonEmptyHttpUrl(result.oss_url)) {
    urls.push(result.oss_url.trim())
  }

  if (isNonEmptyHttpUrl(result.report_oss_url)) {
    urls.push(result.report_oss_url.trim())
  }

  if (Array.isArray(result.indicators)) {
    result.indicators.forEach((indicator) => {
      if (isNonEmptyHttpUrl(indicator?.report_oss_url)) {
        urls.push(indicator.report_oss_url.trim())
      }
    })
  }

  return urls
}

export function resolveCourseReviewPreviewPayload(result: CourseReviewResult): CourseReviewPreviewPayload {
  const reportUrls = extractCourseReviewReportOssUrls(result)

  if (reportUrls.length > 0) {
    return {
      content: '',
      language: 'html',
      externalUrl: reportUrls[0],
    }
  }

  const status = typeof result.status === 'string' ? result.status : ''

  if (status === 'processing' || status === 'pending' || status === 'queued') {
    const progress = typeof result.progress === 'number' ? `（${result.progress}%）` : ''

    return {
      content: '',
      language: 'html',
      pendingMessage: result.message?.trim() || `评课报告生成中${progress}，请稍后再试。`,
    }
  }

  const htmlContent = [result.html, result.report_html, result.content_html]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)

  if (htmlContent) {
    return {
      content: htmlContent,
      language: 'html',
    }
  }

  const markdownContent = [result.report_markdown, result.markdown, result.report_content, result.content]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)

  if (markdownContent) {
    return {
      content: markdownContent,
      language: 'markdown',
    }
  }

  const externalUrl = [result.file_url, result.url, result.report_url]
    .find((value): value is string => isNonEmptyHttpUrl(value))

  if (externalUrl) {
    return {
      content: '',
      language: 'html',
      externalUrl,
    }
  }

  return {
    content: JSON.stringify(result, null, 2),
    language: 'json',
  }
}

export async function fetchCourseReviewResult(
  taskId: string,
  signal?: AbortSignal,
): Promise<CourseReviewResult> {
  const normalizedTaskId = normalizeCourseReviewTaskId(taskId)

  if (!normalizedTaskId) {
    throw new Error('缺少评课任务 ID')
  }

  const response = await authorizedFetch(
    buildAiApiUrl(`${COURSE_REVIEW_RESULT_PATH}/${encodeURIComponent(normalizedTaskId)}`),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    },
  )

  if (!response.ok) {
    throw new Error('获取评课结果失败')
  }

  const payload = await response.json() as unknown
  const result = unwrapCourseReviewResult(payload)

  if (!result) {
    throw new Error('评课结果为空')
  }

  return result
}
