import { useEffect, useMemo, useState } from 'react'

import type { AgentPublishScope } from '../../../services/agents'
import { fetchSquareCategoryModules, type SquareCategory } from '../../../services/aiCommunity'
import type { OrgUserItem } from '../../../services/aiOrgMembers'
import { AiOrgMemberPicker } from './AiOrgMemberPicker'

type AiPublishSettingsProps = {
  publishScope: AgentPublishScope
  selectedUsers: OrgUserItem[]
  isPublishingToCommunity: boolean
  communityCategoryId: string
  applyReason: string
  actionLabel?: string
  publishing?: boolean
  publishStatus?: 'idle' | 'success' | 'error'
  publishMessage?: string
  onPublishScopeChange: (scope: AgentPublishScope) => void
  onSelectedUsersChange: (users: OrgUserItem[]) => void
  onPublishingToCommunityChange: (enabled: boolean) => void
  onCommunityCategoryChange: (categoryId: string) => void
  onApplyReasonChange: (reason: string) => void
  onPublish?: () => void
}

const PUBLISH_SCOPE_OPTIONS: Array<{
  value: AgentPublishScope
  title: string
}> = [
  { value: 'public', title: '租户内公开' },
  { value: 'specified', title: '指定成员可见' },
  { value: 'private', title: '仅自己可见' },
]

function sortCategoryItems(categories: SquareCategory['subCategories']): SquareCategory['subCategories'] {
  return [...categories].sort((left, right) => left.sortOrder - right.sortOrder)
}

export function AiPublishSettings({
  publishScope,
  selectedUsers,
  isPublishingToCommunity,
  communityCategoryId,
  applyReason,
  actionLabel = '发布',
  publishing = false,
  publishStatus = 'idle',
  publishMessage = '',
  onPublishScopeChange,
  onSelectedUsersChange,
  onPublishingToCommunityChange,
  onCommunityCategoryChange,
  onApplyReasonChange,
  onPublish,
}: AiPublishSettingsProps) {
  const [communityCategories, setCommunityCategories] = useState<SquareCategory[]>([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityError, setCommunityError] = useState('')
  const smartAgentCategory = useMemo(() => (
    communityCategories.find((item) => item.value === 3) || null
  ), [communityCategories])
  const subCategories = useMemo(() => (
    smartAgentCategory ? sortCategoryItems(smartAgentCategory.subCategories) : []
  ), [smartAgentCategory])
  const actionLoadingLabel = `${actionLabel}中`
  const actionSuccessLabel = `${actionLabel}成功`
  const actionErrorLabel = `${actionLabel}失败`

  useEffect(() => {
    if (!isPublishingToCommunity) {
      return
    }

    const controller = new AbortController()

    async function loadCommunityCategories() {
      setCommunityLoading(true)
      setCommunityError('')

      try {
        const result = await fetchSquareCategoryModules(controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setCommunityCategories(result)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setCommunityCategories([])
        setCommunityError(error instanceof Error ? error.message : '获取研习社分类失败')
      } finally {
        if (!controller.signal.aborted) {
          setCommunityLoading(false)
        }
      }
    }

    void loadCommunityCategories()

    return () => {
      controller.abort()
    }
  }, [isPublishingToCommunity])

  return (
    <section className="ai-publish-settings">
      <div className="ai-publish-settings-header">
        <h3 className="ai-publish-settings-title">发布设置</h3>
        <button
          className={`ai-publish-settings-publish-btn${publishStatus !== 'idle' ? ` is-${publishStatus}` : ''}`}
          disabled={publishing}
          type="button"
          onClick={onPublish}
        >
          {publishing ? actionLoadingLabel : publishStatus === 'success' ? actionSuccessLabel : publishStatus === 'error' ? actionErrorLabel : actionLabel}
        </button>
      </div>

      {publishStatus === 'error' && publishMessage ? (
        <div className="ai-publish-settings-feedback is-error" role="alert">
          {publishMessage}
        </div>
      ) : null}

      <div className="ai-publish-settings-block">
        <div className="ai-publish-settings-label">可用范围</div>
        <div className="ai-publish-settings-options">
          {PUBLISH_SCOPE_OPTIONS.map((option) => (
            <button
              aria-pressed={publishScope === option.value}
              className={`ai-publish-settings-option${publishScope === option.value ? ' is-active' : ''}`}
              key={option.value}
              type="button"
              onClick={() => onPublishScopeChange(option.value)}
            >
              {option.title}
            </button>
          ))}
        </div>

        {publishScope === 'specified' ? (
          <div className="ai-publish-settings-member-panel">
            <AiOrgMemberPicker
              selectedUsers={selectedUsers}
              onChange={onSelectedUsersChange}
            />
          </div>
        ) : null}
      </div>

      <div className="ai-publish-settings-divider" />

      <div className="ai-publish-settings-block">
        <div className="ai-publish-settings-switch-row">
          <div className="ai-publish-settings-label">可选配置</div>
          <button
            aria-checked={isPublishingToCommunity}
            aria-label="申请发布到研习社"
            className={`ai-publish-settings-switch${isPublishingToCommunity ? ' is-active' : ''}`}
            role="switch"
            type="button"
            onClick={() => onPublishingToCommunityChange(!isPublishingToCommunity)}
          >
            <span className="ai-publish-settings-switch-track">
              <span className="ai-publish-settings-switch-thumb" />
            </span>
            <span className="ai-publish-settings-switch-label">申请发布到研习社</span>
          </button>
        </div>

        {isPublishingToCommunity ? (
          <div className="ai-publish-settings-community-panel">
            {communityLoading ? (
              <div className="ai-publish-settings-status">研习社分类加载中…</div>
            ) : communityError ? (
              <div className="ai-publish-settings-status is-error">{communityError}</div>
            ) : (
              <>
                <div className="ai-publish-settings-category-label">选择分类</div>
                {subCategories.length > 0 ? (
                  <div className="ai-publish-settings-category-grid">
                    {subCategories.map((item) => (
                      <button
                        aria-pressed={communityCategoryId === item.id}
                        className={`ai-publish-settings-category-btn${communityCategoryId === item.id ? ' is-active' : ''}`}
                        key={item.id}
                        type="button"
                        onClick={() => onCommunityCategoryChange(item.id)}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ai-publish-settings-status">暂无可用分类</div>
                )}

                <div className="ai-publish-settings-reason-label">申请原因</div>
                <div className="ai-publish-settings-reason-wrap">
                  <textarea
                    className="ai-publish-settings-reason-input"
                    maxLength={200}
                    placeholder="请输入申请发布到研习社的原因"
                    rows={4}
                    value={applyReason}
                    onChange={(event) => onApplyReasonChange(event.target.value)}
                  />
                  <div className="ai-publish-settings-reason-count">{applyReason.length}/200</div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
