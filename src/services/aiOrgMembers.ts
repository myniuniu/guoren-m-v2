import { authorizedFetch, buildApiUrl } from '../utils/request'

const SEARCH_DEPART_AND_USER_PATH = '/sys/sysDepart/searchDepartAndUser'

export interface OrgDepartItem {
  id: string
  departName: string
}

export interface OrgUserItem {
  id: string
  realname: string
  avatar?: string
}

export interface SearchDepartAndUserResult {
  departs: OrgDepartItem[]
  users: OrgUserItem[]
}

type JeecgApiResponse = {
  result?: unknown
  message?: string
}

export const ROOT_ORG_DEPART: OrgDepartItem = {
  id: '',
  departName: '联系人',
}

function normalizeText(value: unknown): string {
  return String(value || '').trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeDepartAndUserResult(result: unknown): SearchDepartAndUserResult {
  const source = isRecord(result) ? result : {}
  const rawDeparts = Array.isArray(source.departs) ? source.departs : []
  const rawUsers = Array.isArray(source.users) ? source.users : []

  return {
    departs: rawDeparts
      .map((item) => {
        const record = isRecord(item) ? item : {}

        return {
          id: normalizeText(record.id),
          departName: normalizeText(record.departName),
        }
      })
      .filter((item) => Boolean(item.id && item.departName)),
    users: rawUsers
      .map((item) => {
        const record = isRecord(item) ? item : {}
        const avatar = normalizeText(record.avatar)

        return {
          id: normalizeText(record.id),
          realname: normalizeText(record.realname),
          ...(avatar ? { avatar } : {}),
        }
      })
      .filter((item) => Boolean(item.id && item.realname)),
  }
}

export function filterDepartAndUserResult(
  source: SearchDepartAndUserResult,
  keyword?: string,
): SearchDepartAndUserResult {
  const normalizedKeyword = normalizeText(keyword).toLowerCase()

  if (!normalizedKeyword) {
    return source
  }

  return {
    departs: source.departs.filter((item) => {
      const departName = normalizeText(item.departName).toLowerCase()
      const departId = normalizeText(item.id).toLowerCase()

      return departName.includes(normalizedKeyword) || departId.includes(normalizedKeyword)
    }),
    users: source.users.filter((item) => {
      const userName = normalizeText(item.realname).toLowerCase()
      const userId = normalizeText(item.id).toLowerCase()

      return userName.includes(normalizedKeyword) || userId.includes(normalizedKeyword)
    }),
  }
}

export async function searchDepartAndUser(
  departId?: string,
  signal?: AbortSignal,
): Promise<SearchDepartAndUserResult> {
  const normalizedDepartId = normalizeText(departId)
  const requestUrl = buildApiUrl(SEARCH_DEPART_AND_USER_PATH, normalizedDepartId ? {
    departId: normalizedDepartId,
  } : undefined)

  const response = await authorizedFetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`组织成员加载失败：${response.status}`)
  }

  const payload = await response.json() as JeecgApiResponse

  return normalizeDepartAndUserResult(payload.result)
}
