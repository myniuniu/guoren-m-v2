import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Toast } from 'antd-mobile'
import {
  fetchClawhubSkillDetail,
  fetchOfficialSkillDetail,
  type SkillSource,
  type SkillDetailItem,
  type SkillSummaryItem,
} from '../../../services/skills'
import './AiSkillDetailPage.css'

type AiSkillDetailPageProps = {
  actionLoading: boolean
  onAction: (skill: SkillSummaryItem) => void
  onBack: () => void
  skill: SkillSummaryItem
}

type DetailTabKey = 'intro' | 'version'

function getSkillSourceLabel(source: SkillSource): string {
  if (source === 'clawhub') {
    return 'ClawHub'
  }

  if (source === 'created') {
    return '我创建的'
  }

  if (source === 'added') {
    return '我添加的'
  }

  return '官方推荐'
}

function buildCreatedSkillDetail(skill: SkillSummaryItem): SkillDetailItem {
  const resolvedSkillName = skill.skillName || skill.id

  return {
    skillName: resolvedSkillName,
    title: skill.title,
    description: skill.description || '',
    source: 'created',
    skillType: 'custom',
    skillMarkdown: skill.description || '',
    template: skill.template || '',
    placeholders: [],
    configFields: [],
    tags: skill.tags,
    owner: '',
    version: '',
    downloads: 0,
    stars: 0,
    summary: skill.description || '',
  }
}

function getSkillBadgeLetter(skill: SkillSummaryItem, detail: SkillDetailItem | null): string {
  const base = detail?.title || skill.title || skill.skillName || skill.id
  return base.trim().charAt(0).toUpperCase() || 'S'
}

function formatLargeCount(value: number): string {
  if (value >= 10000) {
    const formatted = Math.round((value / 1000)) / 10
    return `${formatted}w`
  }

  return String(value)
}

function buildMetaItems(skill: SkillSummaryItem, detail: SkillDetailItem | null) {
  if (!detail) {
    return []
  }

  const sourceLabel = getSkillSourceLabel(skill.source)

  if (skill.source === 'clawhub') {
    return [
      { label: '开发者', value: detail.owner || '未知' },
      { label: '来源', value: sourceLabel },
      { label: '添加次数', value: formatLargeCount(detail.downloads) },
      { label: '收藏次数', value: formatLargeCount(detail.stars) },
    ]
  }

  if (skill.source === 'created') {
    return [
      { label: '来源', value: sourceLabel },
      { label: '技能类型', value: detail.skillType || 'custom' },
      { label: '配置项', value: String(detail.configFields.length) },
      { label: '标签数', value: String(detail.tags.length) },
    ]
  }

  return [
    { label: '来源', value: sourceLabel },
    { label: '技能类型', value: detail.skillType || 'official' },
    { label: '配置项', value: String(detail.configFields.length) },
    { label: '模板变量', value: String(detail.placeholders.length) },
  ]
}

function buildSceneCards(skill: SkillSummaryItem, detail: SkillDetailItem | null) {
  const textSource = [detail?.description || '', detail?.summary || '', skill.description || '']
    .join('。')
    .split(/[。；]/)
    .map((item) => item.trim())
    .filter(Boolean)

  const tags = detail?.tags?.filter(Boolean) ?? []

  return [
    {
      title: tags[0] || '适用场景',
      description: textSource[0] || '适合在技能社区里快速了解这个技能能处理什么类型的问题。',
    },
    {
      title: tags[1] || '使用方式',
      description: textSource[1] || '先查看技能说明和示例提示词，再根据当前任务决定添加或直接使用。',
    },
  ]
}

function buildExamplePrompts(skill: SkillSummaryItem, detail: SkillDetailItem | null) {
  if (detail?.placeholders.length) {
    return detail.placeholders.map((placeholder) => ({
      title: placeholder,
      content: (detail.template || skill.template || '').replace(`/${placeholder}`, `【${placeholder}】`),
    }))
  }

  return [{
    title: skill.title,
    content: detail?.template || skill.template || `基于 ${skill.title} 帮我完成当前任务`,
  }]
}

export default function AiSkillDetailPage({
  actionLoading,
  onAction,
  onBack,
  skill,
}: AiSkillDetailPageProps) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('intro')
  const [detail, setDetail] = useState<SkillDetailItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (skill.source === 'created') {
      setLoading(false)
      setError('')
      setDetail(buildCreatedSkillDetail(skill))
      return
    }

    const controller = new AbortController()

    void (async () => {
      setLoading(true)
      setError('')
      setDetail(null)

      try {
        const nextDetail = skill.source === 'clawhub'
          ? await fetchClawhubSkillDetail(skill.skillName || skill.id, controller.signal)
          : await fetchOfficialSkillDetail(skill.skillName || skill.id, controller.signal)

        if (!controller.signal.aborted) {
          setDetail(nextDetail)
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : '获取技能详情失败')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      controller.abort()
    }
  }, [skill.id, skill.skillName, skill.source])

  const metaItems = useMemo(() => buildMetaItems(skill, detail), [detail, skill])
  const sceneCards = useMemo(() => buildSceneCards(skill, detail), [detail, skill])
  const examplePrompts = useMemo(() => buildExamplePrompts(skill, detail), [detail, skill])
  const actionLabel = skill.isSelected || skill.source === 'added' || skill.source === 'created' ? '使用' : '添加'

  const handleCopyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      Toast.show({ content: '已复制示例提示词' })
    } catch {
      Toast.show({ content: '复制失败，请稍后重试' })
    }
  }

  return (
    <div className="ai-skill-detail-page">
      <div className="ai-skill-detail-header">
        <button className="ai-skill-detail-back" type="button" onClick={onBack} aria-label="返回技能社区">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="ai-skill-detail-header-spacer" />
      </div>

      <div className="ai-skill-detail-content">
        {loading ? <div className="ai-skill-detail-status">技能详情加载中…</div> : null}
        {!loading && error ? <div className="ai-skill-detail-status">{error}</div> : null}

        {!loading && !error ? (
          <div className="ai-skill-detail-body">
            <section className="ai-skill-detail-hero">
              <div className="ai-skill-detail-hero-badge">
                <span>{getSkillBadgeLetter(skill, detail)}</span>
              </div>
              <div className="ai-skill-detail-hero-main">
                <div className="ai-skill-detail-hero-title-row">
                  <h1>{detail?.title || skill.title}</h1>
                  {(detail?.tags.length ? detail.tags : skill.tags).slice(0, 2).map((tag) => (
                    <span className="ai-skill-detail-tag" key={tag}>{tag}</span>
                  ))}
                </div>
                <p>{detail?.description || skill.description || '暂无技能描述'}</p>
              </div>
            </section>

            <section className="ai-skill-detail-meta">
              <div className="ai-skill-detail-meta-grid">
                {metaItems.map((item) => (
                  <div className="ai-skill-detail-meta-item" key={item.label}>
                    <div className="ai-skill-detail-meta-value">{item.value}</div>
                    <div className="ai-skill-detail-meta-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="ai-skill-detail-tabs">
              <button
                className={`ai-skill-detail-tab ${activeTab === 'intro' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setActiveTab('intro')}
              >
                技能介绍
              </button>
              <button
                className={`ai-skill-detail-tab ${activeTab === 'version' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setActiveTab('version')}
              >
                版本记录
              </button>
            </div>

            {activeTab === 'intro' ? (
              <>
                <section className="ai-skill-detail-section">
                  <h2>使用场景</h2>
                  <div className="ai-skill-detail-scene-grid">
                    {sceneCards.map((scene) => (
                      <article className="ai-skill-detail-scene-card" key={scene.title}>
                        <h3>{scene.title}</h3>
                        <p>{scene.description}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="ai-skill-detail-section">
                  <h2>技能介绍</h2>
                  <div className="ai-skill-detail-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {detail?.skillMarkdown || detail?.description || skill.description || '暂无技能说明'}
                    </ReactMarkdown>
                  </div>
                </section>

                <section className="ai-skill-detail-section">
                  <h2>示例提示词</h2>
                  <div className="ai-skill-detail-example-list">
                    {examplePrompts.map((item) => (
                      <article className="ai-skill-detail-example-item" key={item.title}>
                        <div className="ai-skill-detail-example-head">
                          <div className="ai-skill-detail-example-title">{item.title}</div>
                          <button
                            className="ai-skill-detail-copy"
                            type="button"
                            onClick={() => void handleCopyPrompt(item.content)}
                            aria-label="复制示例提示词"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </div>
                        <div className="ai-skill-detail-example-content">{item.content}</div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section className="ai-skill-detail-section">
                <h2>版本记录</h2>
                <div className="ai-skill-detail-version-card">
                  <div className="ai-skill-detail-version-item">
                    <span className="ai-skill-detail-version-label">当前版本</span>
                    <span className="ai-skill-detail-version-value">{detail?.version || '暂无版本号'}</span>
                  </div>
                  <div className="ai-skill-detail-version-item">
                    <span className="ai-skill-detail-version-label">技能来源</span>
                    <span className="ai-skill-detail-version-value">{getSkillSourceLabel(skill.source)}</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>

      <div className="ai-skill-detail-footer">
        <button
          className="ai-skill-detail-action"
          disabled={loading || Boolean(error) || actionLoading}
          type="button"
          onClick={() => onAction(skill)}
        >
          {actionLoading ? '处理中...' : actionLabel}
        </button>
      </div>
    </div>
  )
}
