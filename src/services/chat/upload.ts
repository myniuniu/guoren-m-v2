import { authorizedFetch, buildAiApiUrl, buildApiUrl } from '../../utils/request'
import { getChatUserId } from './api'
import { resolveChatParseTaskState } from './parseTaskState'
import type { ChatAttachment } from './types'

const OSS_SIGN_PATH = '/open/aliyun/oss/v1/temp/url'
const CHAT_FILE_UPLOAD_PATH = '/api/v1/agent/files/upload'
const PARSE_TASK_PATH = '/api/v1/parse'
const DEFAULT_UPLOAD_BUCKET = import.meta.env.VITE_OSS_BUCKET_OTHER || 'guoren-files-hb-test'
const DEFAULT_CONTENT_TYPE = 'application/octet-stream'
const DEFAULT_POLL_INTERVAL_MS = 1500
const DEFAULT_MAX_POLL_ATTEMPTS = 120

export const ALLOWED_CHAT_UPLOAD_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'markdown', 'csv', 'json', 'html',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg',
  'mp4', 'mov', 'avi', 'mkv',
] as const

type ChatFileParseSubmitResponse = {
  success?: boolean
  code?: string | number
  message?: string
  msg?: string
  data?: {
    task_id?: string
    resource_id?: string
  }
}

type ChatFileParseTaskResponse = {
  task_id?: string
  resource_id?: string
  status?: string
  progress?: number | null
  result?: unknown
  error?: string | null
  completed_at?: string | null
  failed_at?: string | null
}

type UploadChatFileOptions = {
  signal?: AbortSignal
  onProgress?: (progress: number) => void
  onStatusChange?: (attachment: ChatAttachment) => void
}

function buildRandomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function getChatUploadFileExtension(fileName: string): string {
  const segments = fileName.split('.')
  return segments.length > 1 ? segments.pop()?.toLowerCase() ?? '' : ''
}

function buildObjectKey(file: File): string {
  const safeName = file.name.replace(/\s+/g, '_')
  return `agent_input/${Date.now()}_${buildRandomSuffix()}_${safeName}`
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('请求已取消', 'AbortError'))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function isChatParseDocumentFile(fileName: string): boolean {
  const ext = getChatUploadFileExtension(fileName)
  return new Set([
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'markdown', 'csv', 'json', 'html',
  ]).has(ext)
}

export function isAllowedChatUploadFile(fileName: string): boolean {
  return ALLOWED_CHAT_UPLOAD_EXTENSIONS.includes(getChatUploadFileExtension(fileName) as (typeof ALLOWED_CHAT_UPLOAD_EXTENSIONS)[number])
}

export function createPendingChatAttachment(file: File): ChatAttachment {
  return {
    id: `upload-${Date.now()}-${buildRandomSuffix()}`,
    kind: 'uploaded',
    name: file.name,
    status: 'uploading',
    objectKey: buildObjectKey(file),
  }
}

async function requestUploadSignedUrl(file: File, objectKey: string, signal?: AbortSignal): Promise<string> {
  const response = await authorizedFetch(buildApiUrl(OSS_SIGN_PATH), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketName: DEFAULT_UPLOAD_BUCKET,
      objectKey,
      method: 'PUT',
      headers: {
        'Content-Type': file.type || DEFAULT_CONTENT_TYPE,
      },
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`获取上传地址失败（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as {
    success?: boolean
    message?: string
    msg?: string
    result?: string
  }

  if (!payload.success || !payload.result) {
    throw new Error(payload.message || payload.msg || '获取上传地址失败')
  }

  return payload.result
}

async function putFileToOss(
  file: File,
  signedUrl: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || DEFAULT_CONTENT_TYPE)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }

      onProgress?.(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }

      reject(new Error(`文件上传失败（HTTP ${xhr.status}）`))
    }

    xhr.onerror = () => {
      reject(new Error('文件上传失败，网络异常'))
    }

    const onAbort = () => {
      xhr.abort()
      reject(new DOMException('请求已取消', 'AbortError'))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener('abort', onAbort, { once: true })
    xhr.send(file)
  })
}

async function submitParseTask(
  fileName: string,
  url: string,
  signal?: AbortSignal,
): Promise<{ taskId: string; resourceId: string | null }> {
  const userId = getChatUserId()

  if (!userId) {
    throw new Error('当前缺少用户 ID，暂时无法提交文档解析任务')
  }

  const response = await authorizedFetch(buildAiApiUrl(CHAT_FILE_UPLOAD_PATH), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      file_name: fileName,
      url,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`提交文档解析任务失败（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as ChatFileParseSubmitResponse
  const taskId = payload.data?.task_id?.trim()

  if (!payload.success || !taskId) {
    throw new Error(payload.message || payload.msg || '提交文档解析任务失败')
  }

  return {
    taskId,
    resourceId: payload.data?.resource_id?.trim() || null,
  }
}

async function pollParseTaskUntilCompleted(
  taskId: string,
  signal?: AbortSignal,
): Promise<{ resourceId: string | null }> {
  for (let attempt = 0; attempt < DEFAULT_MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await authorizedFetch(buildAiApiUrl(`${PARSE_TASK_PATH}/${encodeURIComponent(taskId)}`), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    })

    if (!response.ok) {
      throw new Error(`查询文档解析状态失败（HTTP ${response.status}）`)
    }

    const payload = (await response.json()) as ChatFileParseTaskResponse
    const taskState = resolveChatParseTaskState(payload)

    if (taskState.phase === 'completed') {
      return {
        resourceId: taskState.resourceId,
      }
    }

    if (taskState.phase === 'failed') {
      throw new Error(taskState.error || '文档解析失败')
    }

    if (attempt < DEFAULT_MAX_POLL_ATTEMPTS - 1) {
      await sleep(DEFAULT_POLL_INTERVAL_MS, signal)
    }
  }

  throw new Error('文档解析超时，请稍后重试')
}

export async function uploadPendingChatFile(
  pendingAttachment: ChatAttachment,
  file: File,
  options: UploadChatFileOptions = {},
): Promise<ChatAttachment> {
  const signedUrl = await requestUploadSignedUrl(file, pendingAttachment.objectKey ?? buildObjectKey(file), options.signal)

  await putFileToOss(file, signedUrl, options.onProgress, options.signal)

  const uploadedAttachment: ChatAttachment = {
    ...pendingAttachment,
    status: 'completed',
    objectKey: pendingAttachment.objectKey,
    url: signedUrl.split('?')[0],
  }

  if (!isChatParseDocumentFile(file.name)) {
    return uploadedAttachment
  }

  const submittedTask = await submitParseTask(file.name, uploadedAttachment.url ?? '', options.signal)
  const parsingAttachment: ChatAttachment = {
    ...uploadedAttachment,
    status: 'parsing',
    resourceId: submittedTask.resourceId ?? undefined,
  }

  options.onStatusChange?.(parsingAttachment)

  const completedTask = await pollParseTaskUntilCompleted(submittedTask.taskId, options.signal)

  return {
    ...uploadedAttachment,
    status: 'completed',
    resourceId: completedTask.resourceId ?? submittedTask.resourceId ?? undefined,
  }
}

export async function uploadChatFile(
  file: File,
  options: UploadChatFileOptions = {},
): Promise<ChatAttachment> {
  const pendingAttachment = createPendingChatAttachment(file)
  return uploadPendingChatFile(pendingAttachment, file, options)
}
