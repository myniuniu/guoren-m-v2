import { useEffect, useMemo, useState } from 'react'

import {
  ROOT_ORG_DEPART,
  filterDepartAndUserResult,
  searchDepartAndUser,
  type OrgDepartItem,
  type OrgUserItem,
  type SearchDepartAndUserResult,
} from '../../../services/aiOrgMembers'

type AiOrgMemberPickerProps = {
  selectedUsers: OrgUserItem[]
  onChange: (users: OrgUserItem[]) => void
  onUsersLoaded?: (users: OrgUserItem[]) => void
}

const DEFAULT_AVATAR = 'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_21.png'

function getDisplayName(user: OrgUserItem): string {
  return user.realname || '成员'
}

function getAvatarLetter(name: string): string {
  const normalizedName = name.trim()

  return normalizedName ? normalizedName[0] : '成'
}

export function AiOrgMemberPicker({
  selectedUsers,
  onChange,
  onUsersLoaded,
}: AiOrgMemberPickerProps) {
  const [searchValue, setSearchValue] = useState('')
  const [memberSource, setMemberSource] = useState<SearchDepartAndUserResult>({ departs: [], users: [] })
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')
  const [contactBreadcrumb, setContactBreadcrumb] = useState<OrgDepartItem[]>([ROOT_ORG_DEPART])

  useEffect(() => {
    const controller = new AbortController()

    async function loadRootMembers() {
      setContactLoading(true)
      setContactError('')

      try {
        const result = await searchDepartAndUser(undefined, controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setMemberSource(result)
        onUsersLoaded?.(result.users)
        setContactBreadcrumb([ROOT_ORG_DEPART])
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setMemberSource({ departs: [], users: [] })
        setContactError(error instanceof Error ? error.message : '组织成员加载失败，请稍后重试')
      } finally {
        if (!controller.signal.aborted) {
          setContactLoading(false)
        }
      }
    }

    void loadRootMembers()

    return () => {
      controller.abort()
    }
  }, [onUsersLoaded])

  const filteredSource = useMemo(() => (
    filterDepartAndUserResult(memberSource, searchValue)
  ), [memberSource, searchValue])
  const selectedIds = useMemo(() => new Set(selectedUsers.map((user) => user.id)), [selectedUsers])

  const loadContactLevel = async (
    departId?: string,
    nextBreadcrumb: OrgDepartItem[] = [ROOT_ORG_DEPART],
  ) => {
    setContactLoading(true)
    setContactError('')

    try {
      const result = await searchDepartAndUser(departId)
      setMemberSource(result)
      onUsersLoaded?.(result.users)
      setContactBreadcrumb(nextBreadcrumb)
    } catch (error) {
      setMemberSource({ departs: [], users: [] })
      setContactError(error instanceof Error ? error.message : '组织成员加载失败，请稍后重试')
    } finally {
      setContactLoading(false)
    }
  }

  const toggleSelect = (user: OrgUserItem) => {
    if (!user.id) {
      return
    }

    const nextUsers = selectedIds.has(user.id)
      ? selectedUsers.filter((item) => item.id !== user.id)
      : [...selectedUsers, user]

    onChange(nextUsers)
  }

  return (
    <div className="ai-org-member-picker" data-testid="ai-org-member-picker">
      <div className="ai-org-member-picker-toolbar">
        <label className="ai-org-member-picker-search" htmlFor="ai-org-member-picker-search-input">
          <span className="ai-org-member-picker-search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            id="ai-org-member-picker-search-input"
            className="ai-org-member-picker-search-input"
            placeholder="搜索部门或成员"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </label>

        <div className="ai-org-member-picker-breadcrumb" aria-label="成员目录路径">
          {contactBreadcrumb.map((item, index) => {
            const isActive = index === contactBreadcrumb.length - 1
            const label = item.departName || '联系人'

            return (
              <span className="ai-org-member-picker-breadcrumb-item" key={`${item.id || 'root'}-${index}`}>
                {index > 0 ? <span className="ai-org-member-picker-breadcrumb-separator">/</span> : null}
                <button
                  className={`ai-org-member-picker-breadcrumb-btn${isActive ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => {
                    if (!isActive) {
                      void loadContactLevel(
                        item.id || undefined,
                        contactBreadcrumb.slice(0, index + 1),
                      )
                    }
                  }}
                >
                  {label}
                </button>
              </span>
            )
          })}
        </div>
      </div>

      <div className="ai-org-member-picker-selected">
        <div className="ai-org-member-picker-selected-header">已选 {selectedUsers.length} 人</div>
        <div className="ai-org-member-picker-selected-list" data-empty={selectedUsers.length === 0 ? 'true' : 'false'}>
          {selectedUsers.length === 0 ? (
            <div className="ai-org-member-picker-selected-empty">请至少选择 1 个成员后再发布</div>
          ) : (
            selectedUsers.map((user) => {
              const userName = getDisplayName(user)

              return (
                <div className="ai-org-member-picker-selected-item" key={user.id}>
                  <span className="ai-org-member-picker-selected-user">
                    <span className="ai-org-member-picker-avatar is-small">
                      {user.avatar ? <img alt="" src={user.avatar} /> : getAvatarLetter(userName)}
                    </span>
                    <span className="ai-org-member-picker-selected-name">{userName}</span>
                  </span>
                  <button
                    aria-label={`移除${userName}`}
                    className="ai-org-member-picker-remove-btn"
                    type="button"
                    onClick={() => toggleSelect(user)}
                  >
                    移除
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="ai-org-member-picker-list">
        {contactLoading ? (
          <div className="ai-org-member-picker-status">组织成员加载中…</div>
        ) : contactError ? (
          <div className="ai-org-member-picker-status is-error">{contactError}</div>
        ) : (
          <>
            {filteredSource.departs.length > 0 ? (
              <div className="ai-org-member-picker-section">
                <div className="ai-org-member-picker-section-title">部门</div>
                <div className="ai-org-member-picker-section-list">
                  {filteredSource.departs.map((depart) => (
                    <button
                      aria-label={depart.departName}
                      className="ai-org-member-picker-row"
                      key={depart.id}
                      type="button"
                      onClick={() => {
                        void loadContactLevel(depart.id, [...contactBreadcrumb, depart])
                      }}
                    >
                      <span className="ai-org-member-picker-row-main">
                        <span className="ai-org-member-picker-avatar">{getAvatarLetter(depart.departName)}</span>
                        <span className="ai-org-member-picker-row-name">{depart.departName}</span>
                      </span>
                      <span className="ai-org-member-picker-row-action">下级</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {filteredSource.users.length > 0 ? (
              <div className="ai-org-member-picker-section">
                <div className="ai-org-member-picker-section-title">成员</div>
                <div className="ai-org-member-picker-section-list">
                  {filteredSource.users.map((user) => {
                    const userName = getDisplayName(user)
                    const checked = selectedIds.has(user.id)

                    return (
                      <button
                        aria-label={userName}
                        aria-pressed={checked}
                        className={`ai-org-member-picker-row${checked ? ' is-selected' : ''}`}
                        key={user.id}
                        type="button"
                        onClick={() => toggleSelect(user)}
                      >
                        <span className="ai-org-member-picker-row-main">
                          <span className="ai-org-member-picker-avatar">
                            {user.avatar ? <img alt="" src={user.avatar || DEFAULT_AVATAR} /> : getAvatarLetter(userName)}
                          </span>
                          <span className="ai-org-member-picker-row-name">{userName}</span>
                        </span>
                        <span className="ai-org-member-picker-row-action">{checked ? '已选' : ''}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {filteredSource.departs.length === 0 && filteredSource.users.length === 0 ? (
              <div className="ai-org-member-picker-status">当前层级暂无可选成员</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
