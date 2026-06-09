import { authorizedFetch, buildAiApiUrl } from '../utils/request'

const CLASSROOM_GENERATE_PATH = '/api/v1/openmaic/classroom/generate'

export interface ClassroomGenerateResponse {
  task_id?: string
  status?: string
  progress?: number
  stage?: string
  message?: string
  result?: {
    classroom_id?: string
    classroom_url?: string
    scenes_count?: number
    stage?: string
    message?: string
  }
  error_code?: string | null
  error_message?: string | null
  created_at?: string
  updated_at?: string
  completed_at?: string | null
  failed_at?: string | null
}

export interface ClassroomPreviewState {
  statusLabel: string
  detail: string
  classroomUrl: string
  tone: 'ready' | 'pending' | 'error'
}

export function resolveClassroomPreviewState(result: ClassroomGenerateResponse): ClassroomPreviewState {
  const stage = (result.stage || result.status || '').trim().toLowerCase()
  const progress = typeof result.progress === 'number' ? `（${result.progress}%）` : ''
  const classroomUrl = result.result?.classroom_url?.trim() || ''

  if (stage === 'completed' && classroomUrl) {
    return {
      statusLabel: '已生成',
      detail: result.result?.message?.trim() || '课堂结果已生成，可以直接打开查看。',
      classroomUrl,
      tone: 'ready',
    }
  }

  if (stage === 'failed') {
    return {
      statusLabel: '生成失败',
      detail: result.error_message?.trim() || result.message?.trim() || '课堂生成失败，请稍后重试。',
      classroomUrl: '',
      tone: 'error',
    }
  }

  return {
    statusLabel: '生成中',
    detail: result.message?.trim() || `课堂结果仍在生成中${progress}，请稍后再试。`,
    classroomUrl,
    tone: 'pending',
  }
}

export async function fetchClassroomGenerateStatus(
  filePath: string,
  signal?: AbortSignal,
): Promise<ClassroomGenerateResponse> {
  const normalizedFilePath = filePath.trim()

  if (!normalizedFilePath) {
    throw new Error('缺少课堂结果路径参数')
  }

  const response = await authorizedFetch(
    buildAiApiUrl(`${CLASSROOM_GENERATE_PATH}/${encodeURIComponent(normalizedFilePath)}`),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(`查询课堂生成状态失败（HTTP ${response.status}）`)
  }

  return response.json() as Promise<ClassroomGenerateResponse>
}
