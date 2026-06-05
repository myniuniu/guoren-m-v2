import { useEffect, useMemo, useState } from 'react'
import Home from './pages/Home'
import SpacePage from './pages/Space'
import AIPage from './pages/AI'
import LibraryPage from './pages/Library'
import IMPage from './pages/IM'
import LoginPage from './pages/Login'
import { useAuth, type UserInfo } from './contexts/AuthContext'
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

function NotesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#333' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 3v6" />
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

function IMIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#333' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="12" y1="7" x2="12" y2="13" />
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
  { id: 1, name: '工作台', color: '#3CC2A3', type: 'grid' },
  { id: 2, name: '飞书 aily', color: '#C9B6F8', type: 'avatar' },
  { id: 3, name: '视频会议', color: '#4A7CFF', type: 'video' },
  { id: 4, name: '知识库', color: '#4A7CFF', type: 'knowledge' },
  { id: 5, name: '多维表格', color: '#7B49F1', type: 'diamond' },
  { id: 6, name: '假勤', color: '#FF8A00', type: 'person' },
  { id: 7, name: '通讯录', color: '#F5B400', type: 'contact' },
  { id: 8, name: '妙记', color: '#4D7CFE', type: 'note' },
  { id: 9, name: '发现', color: '#444', type: 'discover' },
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
  { key: 'space', label: '空间', icon: NotesIcon, source: 'system' },
  { key: 'im', label: 'IM', icon: IMIcon, source: 'system' },
  { key: 'library', label: '资料库', icon: LibraryIcon, source: 'system' },
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
  const { isAuthenticated, userInfo, logout } = useAuth()

  const [activeKey, setActiveKey] = useState('home')
  const [showAI, setShowAI] = useState(false)
  const [showMoreDrawer, setShowMoreDrawer] = useState(false)
  const [showMoreEdit, setShowMoreEdit] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [mainTabs, setMainTabs] = useState(defaultMainTabs)

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
    if (activeKey === 'ai' || activeKey === 'more') return
    if (!mainTabs.some((tab) => tab.key === activeKey) && mainTabs.length > 0) {
      setActiveKey(mainTabs[0].key)
    }
  }, [activeKey, mainTabs])

  const activeCustomTab = useMemo(
    () => mainTabs.find((tab) => tab.key === activeKey && tab.source === 'app'),
    [activeKey, mainTabs]
  )

  // 鉴权守卫：未登录时全屏渲染登录页，不渲染任何 app 内容
  // 使用条件渲染而非早期返回，确保所有 hooks 始终按相同顺序调用
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="app-container">
      {/* 左上角浮动头像按钮，仅在首页显示 */}
      {activeKey === 'home' && (
        <div className="profile-float-btn" onClick={() => setShowProfileMenu(true)}>
          {userInfo?.avatar ? (
            <img src={userInfo.avatar} alt="头像" className="profile-float-avatar-img" />
          ) : (
            <div className="profile-float-avatar-default">
              {(userInfo?.name || userInfo?.username || '?')[0]}
            </div>
          )}
        </div>
      )}

      <div className="app-content">
        {activeKey === 'home' && <Home />}
        {activeKey === 'space' && <SpacePage />}
        {activeKey === 'im' && <IMPage />}
        {activeKey === 'library' && <LibraryPage />}
        {activeKey === 'ai' && <PlaceholderPage title="AI" />}
        {activeCustomTab && <PlaceholderPage title={activeCustomTab.label} />}
      </div>
      <div className="app-bottom">
        <div className="bottom-tabs">
          <div className="tabs-group">
            {/* 滑动背景指示器 */}
            <div
              className="tab-slider"
              style={{
                width: `calc((100% - 8px) / ${mainTabs.length})`,
                transform: `translateX(${mainTabs.findIndex(t => t.key === activeKey) >= 0 ? mainTabs.findIndex(t => t.key === activeKey) * 100 : 0}%)`,
                opacity: mainTabs.findIndex(t => t.key === activeKey) >= 0 ? 1 : 0,
              }}
            />
            {mainTabs.map((tab) => {
              const isActive = activeKey === tab.key
              const Icon = tab.icon
              return (
                <div
                  key={tab.key}
                  className={`bottom-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.key)}
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

      {/* 更多抽屉 */}
      {showMoreDrawer && (
        <MoreDrawer onClose={() => setShowMoreDrawer(false)} onEdit={() => {
          setShowMoreDrawer(false)
          setShowMoreEdit(true)
        }} />
      )}

      {/* 更多编辑页面 */}
      {showMoreEdit && (
        <MoreEditPage
          onClose={() => setShowMoreEdit(false)}
          mainTabs={mainTabs}
          setMainTabs={setMainTabs}
        />
      )}

      {/* 个人菜单弹出层 */}
      {showProfileMenu && (
        <ProfileMenu
          userInfo={userInfo}
          onClose={() => setShowProfileMenu(false)}
          onLogout={() => { logout(); setShowProfileMenu(false); }}
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

/**
 * 个人菜单弹出组件
 * 点击左上角头像后弹出，显示操作选项
 */
function ProfileMenu({ onClose, onLogout }: {
  userInfo: UserInfo | null
  onClose: () => void
  onLogout: () => void
}) {
  return (
    <>
      {/* 全屏遮罩，点击关闭 */}
      <div className="profile-menu-overlay" onClick={onClose} />
      {/* 弹出卡片，absolute 定位相对于 app-container */}
      <div className="profile-menu-card" onClick={e => e.stopPropagation()}>
        <button className="profile-menu-item" type="button" onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          </svg>
          <span>切换登录</span>
        </button>
        <button className="profile-menu-item profile-menu-item-danger" type="button" onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </>
  )
}

function MoreDrawer({ onClose, onEdit }: { onClose: () => void, onEdit: () => void }) {
  const recentItems = [
    { id: 1, title: '飞书 aily', icon: 'avatar' },
    { id: 2, title: '花三年时间整理出的向量数据库最佳实践', icon: 'chat' },
    { id: 3, title: '审批', icon: 'approve' },
    { id: 4, title: '飞书妙搭｜轻量系统，AI搭建，现已支持 Open...', icon: 'build' },
  ]

  const apps = [
    { id: 1, name: '工作台', color: '#3CC2A3', type: 'grid' },
    { id: 2, name: '飞书 aily', color: '#C9B6F8', type: 'avatar' },
    { id: 3, name: '视频会议', color: '#4A7CFF', type: 'video' },
    { id: 4, name: '知识库', color: '#4A7CFF', type: 'knowledge' },
    { id: 5, name: '多维表格', color: '#7B49F1', type: 'diamond' },
    { id: 6, name: '假勤', color: '#FF8A00', type: 'person' },
    { id: 7, name: '通讯录', color: '#F5B400', type: 'contact' },
    { id: 8, name: '妙记', color: '#4D7CFE', type: 'note' },
    { id: 9, name: '发现', color: '#444', type: 'discover' },
  ]

  const renderAppGlyph = (type: string) => {
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
      default:
        return null
    }
  }

  return (
    <div className="more-drawer-overlay" onClick={onClose}>
      <div className="more-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="more-drawer-handle" />
        <div className="more-drawer-scroll">
          <div className="more-page-section-header">
            <span>最近使用</span>
            <button className="more-page-section-link" type="button">全部</button>
          </div>

          <div className="more-page-recent-list">
            {recentItems.map((item) => (
              <div className="more-page-recent-item" key={item.id}>
                <div className={`more-page-recent-icon type-${item.icon}`}>
                  {item.icon === 'chat' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 6.5h14a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H11l-4 3v-3H5a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3z" fill="#30C85A" />
                      <circle cx="9" cy="12" r="1" fill="#fff" />
                      <circle cx="12" cy="12" r="1" fill="#fff" />
                      <circle cx="15" cy="12" r="1" fill="#fff" />
                    </svg>
                  )}
                  {item.icon === 'approve' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7h16l-2 10H6z" fill="#FF8A00" />
                      <path d="m8 12 2.2 2.2L16 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.icon === 'build' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M6 12h12" stroke="#4A7CFF" strokeWidth="2.2" strokeLinecap="round" />
                      <path d="m12 6 6 6-6 6" stroke="#82A5FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="m12 6-6 6 6 6" stroke="#4A7CFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="more-page-recent-text">{item.title}</div>
              </div>
            ))}
          </div>

          <div className="more-page-section-header second">
            <span>更多</span>
            <button className="more-page-section-link" type="button" onClick={onEdit}>编辑</button>
          </div>

          <div className="more-page-app-grid">
            {apps.map((app) => (
              <div className="more-page-app-item" key={app.id}>
                <div className="more-page-app-icon" style={{ background: app.type === 'discover' ? '#fff' : `${app.color}18` }}>
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
        <div className="more-edit-section-desc">支持拖动排序。AI 常驻显示，不参与自定义，所以这里不展示</div>
        <div className="bottom-tabs">
          <div
            className="tabs-group more-edit-tabs-group"
            style={{ background: 'transparent', boxShadow: 'none' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropToMenu(e)}
          >
            {mainTabs.map((tab, index) => (
              <div
                key={tab.key}
                className={`bottom-tab-item preview more-edit-menu-item ${draggedKey === tab.key ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, tab)}
                onDragEnd={() => setDraggedKey(null)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropToMenu(e, index)}
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
