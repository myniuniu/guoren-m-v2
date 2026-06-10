import { authorizedFetch, buildApiUrl } from '../utils/request'

const SQUARE_CATEGORY_MODULES_PATH = '/res/squareCategory/modules'
const SQUARE_AUDIT_APPLY_PATH = '/res/squareAudit/user/apply'

export interface SquareCategory {
  value: number
  name: string
  hasSubCategory: boolean
  subCategories: Array<{
    id: string
    name: string
    sortOrder: number
  }>
}

type SquareCategoryModulesResponse = {
  success?: boolean
  code?: number | string
  message?: string
  msg?: string
  result?: unknown
}

type SquareAuditApplyPayload = {
  sourceType: number
  sourceNodeId: string
  squareCategory: number
  squareSubCategoryId: string
  applyReason: string
  sourceNodeTitle: string
  sourceNodeType: number
}

type SquareAuditApplyResponse = {
  success?: boolean
  code?: number | string
  message?: string
  msg?: string
  result?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeText(value: unknown): string {
  return String(value || '').trim()
}

function normalizeSquareCategories(result: unknown): SquareCategory[] {
  if (!Array.isArray(result)) {
    return []
  }

  return result.flatMap((item) => {
    const record = isRecord(item) ? item : {}
    const value = Number(record.value)
    const name = normalizeText(record.name)

    if (!name || Number.isNaN(value)) {
      return []
    }

    const rawSubCategories = Array.isArray(record.subCategories) ? record.subCategories : []

    return [{
      value,
      name,
      hasSubCategory: Boolean(record.hasSubCategory),
      subCategories: rawSubCategories.flatMap((subItem) => {
        const subRecord = isRecord(subItem) ? subItem : {}
        const id = normalizeText(subRecord.id)
        const subName = normalizeText(subRecord.name)

        if (!id || !subName) {
          return []
        }

        return [{
          id,
          name: subName,
          sortOrder: Number(subRecord.sortOrder) || 0,
        }]
      }),
    }]
  })
}

export async function fetchSquareCategoryModules(signal?: AbortSignal): Promise<SquareCategory[]> {
  const requestUrl = buildApiUrl(SQUARE_CATEGORY_MODULES_PATH)
  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`获取研习社分类失败：${response.status}`)
  }

  const payload = await response.json() as SquareCategoryModulesResponse

  if (payload.success === false) {
    throw new Error(payload.message || payload.msg || '获取研习社分类失败')
  }

  return normalizeSquareCategories(payload.result)
}

export async function applySquareAudit(
  payload: SquareAuditApplyPayload,
  signal?: AbortSignal,
): Promise<SquareAuditApplyResponse> {
  const requestUrl = buildApiUrl(SQUARE_AUDIT_APPLY_PATH)
  const response = await authorizedFetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })

  const result = await response.json() as SquareAuditApplyResponse

  if (!response.ok) {
    throw new Error(result.message || result.msg || '提交研习社申请失败')
  }

  if (result.success === false) {
    throw new Error(result.message || result.msg || '提交研习社申请失败')
  }

  return result
}
