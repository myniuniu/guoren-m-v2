export const AI_COURSE_REVIEW_SKILL_NAME = 'ai-course-review'
export const COURSE_REVIEW_ARTIFACT_PREFIX = 'course-review://'

export function buildCourseReviewArtifactPath(taskId: string): string {
  return `${COURSE_REVIEW_ARTIFACT_PREFIX}${taskId.trim()}`
}

export function parseCourseReviewTaskId(rawValue: string): string | null {
  const normalizedValue = rawValue.trim()

  if (!normalizedValue.startsWith(COURSE_REVIEW_ARTIFACT_PREFIX)) {
    return null
  }

  const taskId = normalizedValue.slice(COURSE_REVIEW_ARTIFACT_PREFIX.length).trim()
  return taskId || null
}

export function isCourseReviewArtifact(rawValue: string): boolean {
  return Boolean(parseCourseReviewTaskId(rawValue))
}

export function normalizeCourseReviewTaskId(rawValue: string): string | null {
  const normalizedValue = rawValue.trim()

  if (!normalizedValue) {
    return null
  }

  // 资料库里的评课记录可能直接保存原始 taskId，这里同时兼容前缀路径和裸 taskId。
  return parseCourseReviewTaskId(normalizedValue) ?? normalizedValue
}
