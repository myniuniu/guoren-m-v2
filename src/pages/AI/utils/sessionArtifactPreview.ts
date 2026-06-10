import type { LibraryPageFileType } from '../../../services/library'
import {
  AI_COURSE_REVIEW_SKILL_NAME,
  buildCourseReviewArtifactPath,
  isCourseReviewArtifact,
} from '../../../services/courseReviewArtifact.ts'

type SessionArtifactPreviewItem = {
  type: string
  filename: string
  url: string
  skill_name?: string
}

function isImageArtifact(url: string, filename: string): boolean {
  const target = `${filename} ${url}`.toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].some((suffix) => target.includes(suffix))
}

export function normalizeSessionArtifactPreviewFilePath(artifact: SessionArtifactPreviewItem): string {
  const normalizedUrl = artifact.url.trim()

  if (!normalizedUrl) {
    return ''
  }

  if (isCourseReviewArtifact(normalizedUrl)) {
    return normalizedUrl
  }

  if (artifact.skill_name === AI_COURSE_REVIEW_SKILL_NAME) {
    return buildCourseReviewArtifactPath(normalizedUrl)
  }

  return normalizedUrl
}

export function normalizeSessionArtifactPreviewFileType(
  artifact: SessionArtifactPreviewItem,
): Exclude<LibraryPageFileType, 'all'> {
  if (artifact.type === 'classroom') {
    return 'classroom'
  }

  if (isCourseReviewArtifact(normalizeSessionArtifactPreviewFilePath(artifact))) {
    return 'review'
  }

  if (artifact.type === 'image' || isImageArtifact(artifact.url, artifact.filename)) {
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
