import { useEffect, useMemo, useState } from 'react'
import Home from './pages/Home'
import SpacePage from './pages/Space'
import AIPage from './pages/AI'
import LibraryPage from './pages/Library'
import CalendarPage from './pages/Calendar'
import TaskPage from './pages/Task'
import './App.css'

// 底部导航图标
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#333' : 'none'} stroke={active ? '#333' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" stroke={active ? '#333' : '#999'} fill={active ? '#555' : 'none'} />
    </svg>
  )
}

function LibraryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#333' : '#999'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 7.5c0-1.1.9-2 2-2h3.1c.54 0 1.05.26 1.36.69l1.03 1.42c.3.42.8.67 1.31.67h4.19c1.1 0 2 .9 2 2v6.22c0 1.1-.9 2-2 2H6.5c-1.1 0-2-.9-2-2z" />
      <path d="M4.5 9.5h15" />
    </svg>
  )
}

function TaskIcon({ active }: { active: boolean }) {
  const stroke = active ? '#333' : '#999'
  const fill = active ? '#4A7CFF' : '#fff'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12c0 7.18-5.82 12-12 12S0 16.18 0 9 4.82 0 9 0c2.05 0 3.95.65 5.5 1.75" stroke={stroke} strokeWidth="1.9" />
      <circle cx="12" cy="12" r="10" fill={fill} fillOpacity={active ? 0.08 : 0} stroke={stroke} strokeWidth="1.9" />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  const stroke = active ? '#333' : '#999'
  const fill = active ? '#4A7CFF' : 'none'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <rect x="7" y="13" width="3" height="3" rx="0.5" fill={fill} stroke={stroke} />
      <rect x="14" y="13" width="3" height="3" rx="0.5" fill={fill} stroke={stroke} />
    </svg>
  )
}

function MoreIcon({ active }: { active: boolean }) {
  const stroke = active ? '#333' : '#999'
  const fillBlue = active ? '#4A7CFF' : '#6E93FF'
  const fillGreen = active ? '#33C39B' : '#59D0AF'
  const fillOrange = active ? '#FF8A34' : '#FFA154'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="6" height="6" rx="1.5" fill={fillGreen} />
      <rect x="14" y="4" width="6" height="6" rx="1.5" fill="#FFC85A" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" fill={fillBlue} />
      <rect x="14" y="14" width="6" height="6" rx="1.5" fill={fillOrange} />
      <path d="M16.5 7h1" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 17h1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 16v2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 17h2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AIIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#222' : '#333'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    </svg>
  )
}

export const apps = [
  { id: 3, name: '日历', color: '#4A7CFF', type: 'calendar' },
  { id: 11, name: '空间', color: '#87CEEB', type: 'space' },
]

export const renderAppGlyph = (type: string) => {
  switch (type) {
    case 'grid':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" fill="#3CC2A3" />
          <rect x="13" y="3" width="8" height="8" fill="#5ED3B9" />
          <rect x="3" y="13" width="8" height="8" fill="#64D8C0" />
          <rect x="13" y="13" width="8" height="8" fill="#2EB99A" />
        </svg>
      )
    case 'avatar':
      return <div className="more-page-app-avatar" />
    case 'video':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="6" width="11" height="12" fill="#4A7CFF" />
          <path d="M16 9.2 20 7v10l-4-2.2z" fill="#6A95FF" />
        </svg>
      )
    case 'knowledge':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M5 5h14v14H5z" fill="#4A7CFF" opacity="0.2" />
          <path d="M7 7h4v10H7z" fill="#4A7CFF" />
          <path d="M13 7h4v3h-4z" fill="#6A95FF" />
          <path d="M13 11.5h4V17h-4z" fill="#4A7CFF" />
        </svg>
      )
    case 'diamond':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 3 21 12 12 21 3 12z" fill="#7B49F1" />
          <path d="M12 7.2 16.8 12 12 16.8 7.2 12z" fill="#fff" opacity="0.9" />
        </svg>
      )
    case 'person':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="4" fill="#fff" opacity="0.95" />
          <path d="M5 20a7 7 0 0 1 14 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'contact':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="8.5" r="4" fill="#F5B400" />
          <path d="M4 20a7 7 0 0 1 14 0" fill="#F5B400" />
          <path d="M18 9h3M19.5 7.5v3" stroke="#F5B400" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'note':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M5 16c3-1 4.5-2.7 5.5-6 1 3 2.5 4.6 5.5 5.5" stroke="#4D7CFE" strokeWidth="3" strokeLinecap="round" />
          <path d="M14 8c.8 2.1 2 3.3 4 4" stroke="#7A9DFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'discover':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M17.5 14v7M14 17.5h7" strokeLinecap="round" />
        </svg>
      )
    case 'library':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M4.5 7.5c0-1.1.9-2 2-2h3.1c.54 0 1.05.26 1.36.69l1.03 1.42c.3.42.8.67 1.31.67h4.19c1.1 0 2 .9 2 2v6.22c0 1.1-.9 2-2 2H6.5c-1.1 0-2-.9-2-2z" fill="#4A7CFF" />
          <path d="M4.5 9.5h15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'space':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="#87CEEB" />
          <path d="M3 9h18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 3v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'calendar':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" fill="#4A7CFF" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="6" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" />
          <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#fff" />
          <rect x="14" y="13" width="3" height="3" rx="0.5" fill="#fff" opacity="0.6" />
        </svg>
      )
    default:
      return null
  }
}

type TabItem = {
  key: string;
  label: string;
  icon?: React.FC<{active: boolean}>;
  appType?: string;
  color?: string;
  source?: 'system' | 'app';
};

const defaultMainTabs: TabItem[] = [
  { key: 'home', label: '首页', icon: HomeIcon, source: 'system' },
  { key: 'task', label: '任务', icon: TaskIcon, source: 'system' },
  { key: 'app-10', label: '资料库', appType: 'library', color: '#4A7CFF', source: 'app' },
  { key: 'more', label: '更多', icon: MoreIcon, source: 'system' },
]

const editableAppTabs: TabItem[] = apps.map((app) => ({
  key: `app-${app.id}`,
  label: app.name,
  appType: app.type,
  color: app.color,
  source: 'app',
}))

const allEditableTabs: TabItem[] = [...defaultMainTabs, ...editableAppTabs]

function App() {
  const [activeKey, setActiveKey] = useState('home')
  const [showAI, setShowAI] = useState(false)
  const [showMoreDrawer, setShowMoreDrawer] = useState(false)
  const [showMoreEdit, setShowMoreEdit] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mainTabs, setMainTabs] = useState(defaultMainTabs)
  const [elderMode, setElderMode] = useState(false)
  const [draggedTabKey, setDraggedTabKey] = useState<string | null>(null)

  const handleSelectApp = (appKey: string) => {
    setShowMoreDrawer(false)
    setActiveKey(appKey)
  }

  const handleTabChange = (key: string) => {
    if (key === 'more') {
      setShowMoreDrawer(true)
      return
    }
    setActiveKey(key)
    if (key === 'ai') {
      setShowAI(true)
    }
  }

  useEffect(() => {
    if (activeKey === 'ai' || activeKey === 'more' || activeKey.startsWith('app-')) return
    if (!mainTabs.some((tab) => tab.key === activeKey) && mainTabs.length > 0) {
      setActiveKey(mainTabs[0].key)
    }
  }, [activeKey, mainTabs])

  const activeCustomTab = useMemo(
    () => mainTabs.find((tab) => tab.key === activeKey && tab.source === 'app'),
    [activeKey, mainTabs]
  )

  return (
    <div className={`app-container ${elderMode ? 'elder-mode' : ''}`}>
      <div className="app-content">
        {activeKey === 'home' && <Home onOpenAI={() => setShowAI(true)} elderMode={elderMode} onToggleElderMode={() => setElderMode(!elderMode)} />}
        {activeKey === 'task' && <TaskPage />}
        {activeKey === 'calendar' && <CalendarPage />}
        {activeKey === 'space' && <SpacePage />}
        {activeKey === 'library' && <LibraryPage />}
        {activeKey === 'app-10' && <LibraryPage />}
        {activeKey === 'app-3' && <CalendarPage />}
        {activeKey === 'app-11' && <SpacePage />}
        {activeKey === 'ai' && <PlaceholderPage title="AI" />}
        {activeCustomTab && !['app-10', 'app-3', 'app-11'].includes(activeKey) && <PlaceholderPage title={activeCustomTab.label} />}
      </div>
      <div className="app-bottom">
        <div className="bottom-tabs">
          <div className="tabs-group">
            {/* 滑动背景指示器 */}
            <div
              className="tab-slider"
              style={{
                transform: `translateX(${(() => {
                  const idx = mainTabs.findIndex(t => t.key === activeKey)
                  if (idx >= 0) return idx * 100
                  // 更多子页面（app- 开头）时，滑块移到"更多"位置
                  if (activeKey.startsWith('app-')) {
                    const moreIdx = mainTabs.findIndex(t => t.key === 'more')
                    return moreIdx >= 0 ? moreIdx * 100 : 0
                  }
                  return 0
                })()}%)`,
                opacity: mainTabs.findIndex(t => t.key === activeKey) >= 0 || activeKey.startsWith('app-') ? 1 : 0,
              }}
            />
            {mainTabs.map((tab) => {
              const isActive = activeKey === tab.key || (tab.key === 'more' && activeKey.startsWith('app-'))
              const Icon = tab.icon
              const isFixed = tab.key === 'home'
              return (
                <div
                  key={tab.key}
                  className={`bottom-tab-item ${isActive ? 'active' : ''} ${draggedTabKey === tab.key ? 'dragging' : ''} ${isFixed ? 'tab-fixed' : ''}`}
                  onClick={() => handleTabChange(tab.key)}
                  draggable={!isFixed}
                  onDragStart={(e) => { if (!isFixed) { setDraggedTabKey(tab.key); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', tab.key) } }}
                  onDragEnd={() => setDraggedTabKey(null)}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (!draggedTabKey || draggedTabKey === tab.key) return
                    const fromIdx = mainTabs.findIndex(t => t.key === draggedTabKey)
                    const toIdx = mainTabs.findIndex(t => t.key === tab.key)
                    if (fromIdx < 0 || toIdx < 0) return
                    const next = [...mainTabs]
                    const [moved] = next.splice(fromIdx, 1)
                    next.splice(toIdx, 0, moved)
                    setMainTabs(next)
                    setDraggedTabKey(null)
                  }}
                >
                  <div className="tab-icon-wrap">
                    {Icon ? <Icon active={isActive} /> : (
                      <div className="more-page-app-icon" style={{ background: tab.appType === 'discover' ? '#fff' : `${tab.color}18`, width: 22, height: 22, transform: 'scale(0.85)' }}>
                        {renderAppGlyph(tab.appType!)}
                      </div>
                    )}
                  </div>
                  <span className={`tab-label ${isActive ? 'tab-label-active' : ''}`}>{tab.label}</span>
                </div>
              )
            })}
          </div>
          <div className={`ai-tab ${activeKey === 'ai' ? 'ai-tab-active' : ''}`} onClick={() => handleTabChange('ai')}>
            <AIIcon active={activeKey === 'ai'} />
            <span className="tab-label">AI</span>
          </div>
        </div>
      </div>

      {/* AI全屏页面 */}
      {showAI && (
        <AIPage onClose={() => {
          setShowAI(false)
          setActiveKey('home')
        }} />
      )}

      {/* 更多抽屉 — 只显示应用 */}
      {showMoreDrawer && (
        <MoreDrawer onClose={() => setShowMoreDrawer(false)} onEdit={() => {
          setShowMoreDrawer(false)
          setShowMoreEdit(true)
        }} onOpenSettings={() => {
          setShowMoreDrawer(false)
          setShowSettings(true)
        }} onSelectApp={handleSelectApp} />
      )}

      {/* 设置抽屉 */}
      {showSettings && (
        <SettingsDrawer onClose={() => setShowSettings(false)} elderMode={elderMode} onToggleElderMode={() => setElderMode(!elderMode)} />
      )}

      {/* 更多编辑页面 */}
      {showMoreEdit && (
        <MoreEditPage
          onClose={() => setShowMoreEdit(false)}
          mainTabs={mainTabs}
          setMainTabs={setMainTabs}
        />
      )}
    </div>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999', fontSize: 18 }}>
      {title}
    </div>
  )
}

// ===== 更多抽屉：只显示应用网格 + 设置入口 =====
function MoreDrawer({ onClose, onEdit, onOpenSettings, onSelectApp }: { onClose: () => void, onEdit: () => void, onOpenSettings: () => void, onSelectApp: (appKey: string) => void }) {
  const apps = [
    { id: 3, name: '日历', color: '#4A7CFF', type: 'calendar' },
    { id: 11, name: '空间', color: '#87CEEB', type: 'space' },
  ]

  const renderAppGlyph = (type: string) => {
    switch (type) {
      case 'calendar':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" fill="#4A7CFF" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" />
            <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#fff" />
            <rect x="14" y="13" width="3" height="3" rx="0.5" fill="#fff" opacity="0.6" />
          </svg>
        )
      case 'space':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#87CEEB" />
            <path d="M3 9h18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 3v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="more-drawer-overlay" onClick={onClose}>
      <div className="more-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="more-drawer-handle" />
        <div className="more-drawer-scroll">
          {/* 头部：标题 + 编辑 + 设置 */}
          <div className="more-page-section-header">
            <span>更多</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="more-page-section-link" type="button" onClick={onEdit}>编辑</button>
              <div className="more-settings-btn" onClick={onOpenSettings}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 应用网格 */}
          <div className="more-page-app-grid">
            {apps.map((app) => (
              <div className="more-page-app-item" key={app.id} onClick={() => onSelectApp(`app-${app.id}`)}>
                <div className="more-page-app-icon" style={{ background: `${app.color}18` }}>
                  {renderAppGlyph(app.type)}
                </div>
                <div className="more-page-app-name">{app.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== 设置抽屉：常用工具 + 设置中心 =====
function SettingsDrawer({ onClose, elderMode, onToggleElderMode }: { onClose: () => void, elderMode: boolean, onToggleElderMode: () => void }) {
  const tools = [
    { id: 't1', name: '字体大小', emoji: '🔤' },
    { id: 't2', name: '护眼模式', emoji: '👁️' },
    { id: 't3', name: '清理缓存', emoji: '🧹' },
    { id: 't4', name: '意见反馈', emoji: '💬' },
  ]

  const settings = [
    { id: 's1', name: '账号与隐私', emoji: '👤' },
    { id: 's2', name: '通知管理', emoji: '🔔' },
    { id: 's3', name: '关于我们', emoji: 'ℹ️' },
  ]

  return (
    <div className="more-drawer-overlay" onClick={onClose}>
      <div className="more-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="more-drawer-handle" />
        <div className="more-drawer-scroll">
          {/* 头部 */}
          <div className="more-page-section-header">
            <span>设置</span>
          </div>

          {/* 常用工具 */}
          <div className="more-page-section-header second">
            <span>常用工具</span>
          </div>
          <div className="more-page-tools-grid">
            {tools.map((t) => (
              <div className="more-page-tools-item" key={t.id}>
                <div className="more-page-tools-icon">{t.emoji}</div>
                <div className="more-page-tools-name">{t.name}</div>
              </div>
            ))}
          </div>

          {/* 设置中心 */}
          <div className="more-page-section-header second">
            <span>设置中心</span>
          </div>
          <div className="more-page-settings-list">
            <div className="more-page-settings-item" onClick={onToggleElderMode}>
              <span className="more-page-settings-emoji">👵</span>
              <span className="more-page-settings-name">老年模式</span>
              <span className={`more-page-settings-toggle ${elderMode ? 'toggle-on' : 'toggle-off'}`}>
                {elderMode ? '已开启' : '已关闭'}
              </span>
            </div>
            {settings.map((s) => (
              <div className="more-page-settings-item" key={s.id}>
                <span className="more-page-settings-emoji">{s.emoji}</span>
                <span className="more-page-settings-name">{s.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MoreEditPage({ onClose, mainTabs, setMainTabs }: { onClose: () => void, mainTabs: TabItem[], setMainTabs: (tabs: TabItem[]) => void }) {
  const [draggedKey, setDraggedKey] = useState<string | null>(null)

  const availableTabs = allEditableTabs.filter(
    (item) => !mainTabs.some((tab) => tab.key === item.key)
  )

  const draggedItem = allEditableTabs.find((item) => item.key === draggedKey) ?? null

  const handleDragStart = (e: React.DragEvent, item: TabItem) => {
    setDraggedKey(item.key)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.key)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropToMenu = (e: React.DragEvent, index?: number) => {
    e.preventDefault()
    if (!draggedItem) return

    const nextTabs = mainTabs.filter((tab) => tab.key !== draggedItem.key)
    const insertIndex = index === undefined ? nextTabs.length : Math.min(index, nextTabs.length)
    nextTabs.splice(insertIndex, 0, draggedItem)
    setMainTabs(nextTabs)
    setDraggedKey(null)
  }

  const handleDropToPool = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem) return
    if (mainTabs.some((tab) => tab.key === draggedItem.key)) {
      setMainTabs(mainTabs.filter((tab) => tab.key !== draggedItem.key))
    }
    setDraggedKey(null)
  }

  const renderEditableIcon = (item: TabItem) => {
    if (item.icon) {
      const Icon = item.icon
      return <Icon active={false} />
    }

    return (
      <div className="more-page-app-icon" style={{ background: item.appType === 'discover' ? '#fff' : `${item.color}18` }}>
        {renderAppGlyph(item.appType!)}
      </div>
    )
  }

  return (
    <div className="more-edit-page">
      <div className="more-edit-header">
        <div className="more-edit-title">更多</div>
        <button className="more-edit-done" onClick={onClose}>完成</button>
      </div>

      <div className="more-edit-content">
        <div
          className="more-edit-pool"
          onDragOver={handleDragOver}
          onDrop={handleDropToPool}
        >
          <div className="more-edit-section-title">备选区</div>
          <div className="more-edit-section-desc">拖到下方菜单区即可显示，底部图标也可以拖回这里收起</div>

          <div className="more-edit-grid">
            {availableTabs.map((item) => (
              <div
                key={item.key}
                className="more-edit-app-item"
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={() => setDraggedKey(null)}
              >
                {renderEditableIcon(item)}
                <div className="more-page-app-name">{item.label}</div>
              </div>
            ))}
          </div>

          {availableTabs.length === 0 && (
            <div className="more-edit-empty">当前没有可放入菜单的备选图标</div>
          )}
        </div>
      </div>

      <div className="more-edit-bottom-preview">
        <div className="more-edit-section-title">菜单区</div>
        <div className="more-edit-section-desc">首页和AI固定显示，不参与自定义。其他图标可拖动排序</div>
        <div className="bottom-tabs">
          <div
            className="tabs-group more-edit-tabs-group"
            style={{ background: 'transparent', boxShadow: 'none' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropToMenu(e)}
          >
            {/* 首页固定在最前面，不可拖动 */}
            <div className="bottom-tab-item preview more-edit-menu-item fixed">
              <div className="tab-icon-wrap" style={{ background: 'transparent' }}>{renderEditableIcon(mainTabs.find(t => t.key === 'home') || mainTabs[0])}</div>
              <span className="tab-label">{(mainTabs.find(t => t.key === 'home') || mainTabs[0]).label}</span>
              <span className="more-edit-fixed-tag">固定</span>
            </div>

            {/* 可拖动排序的中间 tabs */}
            {mainTabs.filter(tab => tab.key !== 'home').map((tab, index) => (
              <div
                key={tab.key}
                className={`bottom-tab-item preview more-edit-menu-item ${draggedKey === tab.key ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, tab)}
                onDragEnd={() => setDraggedKey(null)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropToMenu(e, index + 1)}
              >
                <div className="tab-icon-wrap" style={{ background: 'transparent' }}>{renderEditableIcon(tab)}</div>
                <span className="tab-label">{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App