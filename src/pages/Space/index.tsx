import { useEffect, useRef, useState } from 'react'
import './index.css'
import SpaceDetail from './SpaceDetail'

interface SpaceItem {
  id: number
  name: string
  owner: string
  members?: number
  isPrivate: boolean
  contentCount: number
  coverColor: string
  coverType: 'gradient' | 'image'
}

const spaces: SpaceItem[] = [
  { id: 1, name: '个人空间', owner: '我', members: 6, isPrivate: false, contentCount: 42, coverColor: '#87CEEB', coverType: 'gradient' },
  { id: 2, name: '教育干部网院AI助手建设实践', owner: '我', isPrivate: true, contentCount: 1, coverColor: '#A8C8E8', coverType: 'image' },
  { id: 3, name: '无标题空间', owner: '我', isPrivate: true, contentCount: 0, coverColor: '#708090', coverType: 'image' },
  { id: 4, name: '虚拟教研室赋能职业教育革新', owner: '我', isPrivate: true, contentCount: 6, coverColor: '#4682B4', coverType: 'gradient' },
  { id: 5, name: '无标题空间', owner: '我', isPrivate: true, contentCount: 0, coverColor: '#66CDAA', coverType: 'gradient' },
  { id: 6, name: '2026AI趋势与创作者经济变革', owner: '我', isPrivate: true, contentCount: 4, coverColor: '#3CB371', coverType: 'gradient' },
  { id: 7, name: '个人空间', owner: 'Echo', members: 2, isPrivate: false, contentCount: 21, coverColor: '#CD5C5C', coverType: 'image' },
  { id: 8, name: 'AI时代程序员招聘新标准聚焦实战', owner: '我', isPrivate: true, contentCount: 1, coverColor: '#B0C4DE', coverType: 'image' },
  { id: 9, name: '111', owner: '我', isPrivate: true, contentCount: 1, coverColor: '#8FBC8F', coverType: 'image' },
  { id: 10, name: '郭1', owner: '我', isPrivate: true, contentCount: 0, coverColor: '#4169E1', coverType: 'gradient' },
]

// 封面色块组件
function CoverImage({ item }: { item: SpaceItem }) {
  const gradients: Record<string, string> = {
    '#87CEEB': 'linear-gradient(135deg, #87CEEB 0%, #B0E0E6 50%, #F0F8FF 100%)',
    '#A8C8E8': 'linear-gradient(135deg, #A8C8E8 0%, #D4E6F1 100%)',
    '#708090': 'linear-gradient(135deg, #708090 0%, #B0C4DE 100%)',
    '#4682B4': 'linear-gradient(135deg, #4682B4 0%, #87CEEB 50%, #B0E0E6 100%)',
    '#66CDAA': 'linear-gradient(135deg, #66CDAA 0%, #98FB98 50%, #F0FFF0 100%)',
    '#3CB371': 'linear-gradient(135deg, #3CB371 0%, #66CDAA 50%, #98FB98 100%)',
    '#CD5C5C': 'linear-gradient(135deg, #CD5C5C 0%, #F08080 50%, #FFE4E1 100%)',
    '#B0C4DE': 'linear-gradient(135deg, #B0C4DE 0%, #E0F0FF 100%)',
    '#8FBC8F': 'linear-gradient(135deg, #8FBC8F 0%, #98FB98 50%, #F5F5DC 100%)',
    '#4169E1': 'linear-gradient(135deg, #4169E1 0%, #6495ED 50%, #B0C4DE 100%)',
  }

  return (
    <div
      className="space-cover"
      style={{ background: gradients[item.coverColor] || item.coverColor }}
    />
  )
}

// 竖三点图标
function MoreVertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#B0B0B0">
      <circle cx="12" cy="4" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="20" r="1.5" />
    </svg>
  )
}

// 搜索图标
function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// 筛选图标 (带右侧横线的漏斗)
function FilterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="20 3 4 3 10 10.46 10 21 14 17 14 10.46 20 3" />
      <line x1="17" y1="14" x2="23" y2="14" />
      <line x1="18" y1="18" x2="22" y2="18" />
    </svg>
  )
}

// 新建空间FAB图标
function NewSpaceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

export default function SpacePage() {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [tempNewSpace, setTempNewSpace] = useState<SpaceItem | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false) // 列表项更多操作菜单
  const [filterSource, setFilterSource] = useState('all') // all, created, joined
  const [filterSort, setFilterSort] = useState('recent_view') // recent_view, recent_edit, created_time
  const [isListScrolling, setIsListScrolling] = useState(false)
  const scrollTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current)
      }
    }
  }, [])

  const activeSpace = tempNewSpace || (selectedSpaceId ? spaces.find(s => s.id.toString() === selectedSpaceId) : null)

  if (activeSpace) {
    return <SpaceDetail space={activeSpace} onBack={() => {
      setSelectedSpaceId(null)
      setTempNewSpace(null)
    }} />
  }

  const handleCreateSpace = () => {
    const newSpaceData: SpaceItem = {
      id: Date.now(),
      name: '无标题空间',
      owner: '张洪磊',
      isPrivate: true,
      contentCount: 0,
      coverColor: '#A8C8E8', // 对应图示渐变背景色
      coverType: 'gradient'
    }
    setTempNewSpace(newSpaceData)
  }

  const handleListScroll = () => {
    setIsListScrolling(true)

    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current)
    }

    scrollTimerRef.current = window.setTimeout(() => {
      setIsListScrolling(false)
      scrollTimerRef.current = null
    }, 500)
  }

  return (
    <div className="space-page">
      {/* 顶部导航栏 */}
      <div className="space-header">
        <div className="space-header-left">
          {/* 移除返回箭头 */}
        </div>
        <div className="space-header-title">空间</div>
        <div className="space-header-right">
          <button className="icon-btn"><SearchIcon /></button>
          <button className="icon-btn" style={{ marginLeft: 2 }} onClick={() => setShowFilter(true)}><FilterIcon /></button>
        </div>
      </div>

      {/* 空间列表 */}
      <div className={`space-list ${isListScrolling ? 'is-scrolling' : ''}`} onScroll={handleListScroll}>
        {spaces.map((item) => (
          <div key={item.id} className="space-item" onClick={() => setSelectedSpaceId(item.id.toString())}>
            <CoverImage item={item} />
            <div className="space-info">
              <div className="space-name">{item.name}</div>
              <div className="space-meta">
                <span className="space-owner">{item.owner}</span>
                <span className="space-dot">·</span>
                {item.isPrivate && (
                  <svg className="space-lock" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {!item.isPrivate && item.members && (
                  <svg className="space-users" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                <span>{item.isPrivate ? '私密' : `${item.members}个成员`}</span>
                <span className="space-dot">·</span>
                <span>{item.contentCount}个内容</span>
              </div>
            </div>
            <button className="space-more-btn" onClick={(e) => {
              e.stopPropagation();
              setShowActionMenu(true);
            }}>
              <MoreVertIcon />
            </button>
          </div>
        ))}
      </div>

      {/* 悬浮新建按钮 */}
      <button className="space-fab" onClick={handleCreateSpace}>
        <NewSpaceIcon />
      </button>

      {/* 列表项更多操作菜单面板 */}
      {showActionMenu && (
        <div className="space-action-menu-overlay" onClick={() => setShowActionMenu(false)}>
          <div className="space-action-menu-panel" onClick={e => e.stopPropagation()}>
            <button className="space-action-menu-item" onClick={() => setShowActionMenu(false)}>分享</button>
            <button className="space-action-menu-item" onClick={() => setShowActionMenu(false)}>添加到快速访问</button>
            <button className="space-action-menu-item" onClick={() => setShowActionMenu(false)}>重命名</button>
            <button className="space-action-menu-item danger" onClick={() => setShowActionMenu(false)}>删除</button>
            <div className="space-action-menu-divider"></div>
            <button className="space-action-menu-item cancel" onClick={() => setShowActionMenu(false)}>取消</button>
          </div>
        </div>
      )}

      {/* 筛选面板 */}
      {showFilter && (
        <div className="space-filter-overlay" onClick={() => setShowFilter(false)}>
          <div className="space-filter-panel" onClick={e => e.stopPropagation()}>
            <div className="space-filter-header">
              <div className="space-filter-title">筛选</div>
              <button className="space-filter-close" onClick={() => setShowFilter(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="space-filter-content">
              <div className="space-filter-section">
                <div className="space-filter-label">来源</div>
                <div className="space-filter-options">
                  <button className={`space-filter-option ${filterSource === 'all' ? 'active' : ''}`} onClick={() => setFilterSource('all')}>全部</button>
                  <button className={`space-filter-option ${filterSource === 'created' ? 'active' : ''}`} onClick={() => setFilterSource('created')}>我创建的</button>
                  <button className={`space-filter-option ${filterSource === 'joined' ? 'active' : ''}`} onClick={() => setFilterSource('joined')}>我加入的</button>
                </div>
              </div>
              
              <div className="space-filter-section">
                <div className="space-filter-label">排序</div>
                <div className="space-filter-options">
                  <button className={`space-filter-option ${filterSort === 'recent_view' ? 'active' : ''}`} onClick={() => setFilterSort('recent_view')}>最近查看</button>
                  <button className={`space-filter-option ${filterSort === 'recent_edit' ? 'active' : ''}`} onClick={() => setFilterSort('recent_edit')}>最近编辑</button>
                  <button className={`space-filter-option ${filterSort === 'created_time' ? 'active' : ''}`} onClick={() => setFilterSort('created_time')}>创建时间</button>
                </div>
              </div>
            </div>
            
            <div className="space-filter-footer">
              <button className="space-filter-btn-reset" onClick={() => {
                setFilterSource('all')
                setFilterSort('recent_view')
              }}>重置</button>
              <button className="space-filter-btn-confirm" onClick={() => setShowFilter(false)}>完成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
