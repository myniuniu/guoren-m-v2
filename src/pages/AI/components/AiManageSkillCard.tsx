import { DeleteOutline } from 'antd-mobile-icons'

import type { SkillSummaryItem } from '../../../services/skills'
import { AiNameAvatar } from './AiNameAvatar'

type AiManageSkillCardProps = {
  skill: SkillSummaryItem
  loading?: boolean
  onOpenDetail: (skill: SkillSummaryItem) => void
  onDelete: (skill: SkillSummaryItem) => void
  onUse: (skill: SkillSummaryItem) => void
}

export function AiManageSkillCard({
  skill,
  loading = false,
  onOpenDetail,
  onDelete,
  onUse,
}: AiManageSkillCardProps) {
  return (
    <div
      aria-label={`查看技能详情 ${skill.title}`}
      className="ai-my-skill-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(skill)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDetail(skill)
        }
      }}
    >
      <div className="ai-my-skill-card-header">
        <AiNameAvatar
          ariaLabel={`${skill.title}头像`}
          className="ai-my-skill-card-icon"
          imageClassName="ai-my-skill-card-icon-image"
          name={skill.title}
          tone="blue"
        />
        <div className="ai-my-skill-card-title">{skill.title}</div>
        <button
          aria-label="删除技能"
          className="ai-my-skill-card-remove"
          disabled={loading}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(skill)
          }}
        >
          <DeleteOutline aria-hidden="true" style={{ fontSize: 18 }} />
        </button>
      </div>
      <div className="ai-my-skill-card-desc">{skill.description || '暂无描述'}</div>
      <button
        aria-label="立即使用"
        className="ai-my-skill-card-btn"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onUse(skill)
        }}
      >
        立即使用
      </button>
    </div>
  )
}
