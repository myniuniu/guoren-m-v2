import { useState, useEffect, useRef } from 'react'
import { Badge } from 'antd-mobile'
import './index.css'

interface HomeProps {
  onOpenAI: () => void
  elderMode: boolean
  onToggleElderMode: () => void
}

// 判断当前时间段
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return '早安'
  if (hour < 18) return '午安'
  return '晚安'
}

function getGreetingSuffix() {
  const hour = new Date().getHours()
  if (hour < 12) return '开启今日学习'
  if (hour < 18) return '记得休息一下'
  return '睡前轻松学'
}

// SVG 图标组件
function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="1" width="6" height="12" rx="3" fill="#4A7CFF" fillOpacity="0.15" stroke="#4A7CFF" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="23" />
      <line x1="8" y2="23" x2="16" y1="23" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}


function AIAgentIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#4A7CFF" />
      <circle cx="20" cy="16" r="8" fill="#fff" opacity="0.9" />
      <circle cx="16" cy="14" r="2" fill="#4A7CFF" />
      <circle cx="24" cy="14" r="2" fill="#4A7CFF" />
      <path d="M17 19a4 4 0 0 0 6 0" stroke="#4A7CFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="14" y="28" width="12" height="4" rx="2" fill="#fff" opacity="0.5" />
      <line x1="10" y1="6" x2="6" y2="2" stroke="#4A7CFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="6" x2="34" y2="2" stroke="#4A7CFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LiveIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#FF8A34" />
      <circle cx="20" cy="18" r="10" fill="#fff" opacity="0.2" />
      <circle cx="20" cy="18" r="6" fill="#fff" opacity="0.9" />
      <rect x="14" y="29" width="12" height="3" rx="1.5" fill="#fff" opacity="0.5" />
    </svg>
  )
}

function EnrollIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#3CC2A3" />
      <rect x="10" y="8" width="20" height="24" rx="3" fill="#fff" opacity="0.9" />
      <line x1="14" y1="14" x2="26" y2="14" stroke="#3CC2A3" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="19" x2="22" y2="19" stroke="#3CC2A3" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="24" x2="26" y2="24" stroke="#3CC2A3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MyClassIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#7B49F1" />
      <rect x="10" y="6" width="20" height="14" rx="2" fill="#fff" opacity="0.9" />
      <circle cx="20" cy="13" r="3" fill="#7B49F1" />
      <rect x="14" y="24" width="12" height="10" rx="2" fill="#fff" opacity="0.7" />
    </svg>
  )
}

function PhoneLearnIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#E8F4FD" />
      <rect x="13" y="8" width="14" height="24" rx="3" fill="#4A7CFF" opacity="0.2" />
      <rect x="14" y="10" width="12" height="20" rx="2" fill="#4A7CFF" />
      <circle cx="20" cy="20" r="3" fill="#fff" />
    </svg>
  )
}

function InterestIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#FFF3E8" />
      <path d="M12 28 Q20 8 28 28" stroke="#FF8A34" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="20" r="2" fill="#FF8A34" />
    </svg>
  )
}

function HealthIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#E8F8F0" />
      <path d="M20 10 L20 30 M10 20 L30 20" stroke="#3CC2A3" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="20" r="10" stroke="#3CC2A3" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ArrowRightBlueIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

// 快捷功能数据
const quickActions = [
  { id: 'ai', title: 'AI智能助教', subtitle: '语音问答·陪读认字', color: '#4A7CFF', icon: 'ai' },
  { id: 'free', title: '今日免费课', subtitle: '2节直播', color: '#FF8A34', icon: 'live' },
  { id: 'enroll', title: '报名选课', subtitle: '线下+线上', color: '#3CC2A3', icon: 'enroll' },
  { id: 'myclass', title: '我的课堂', subtitle: '已购·收藏', color: '#7B49F1', icon: 'myclass' },
]

// 智能体场景卡片数据
const aiScenarios = [
  { id: 'phone', title: '学手机', desc: '微信、打车、挂号、网购手把手教', icon: 'phone' },
  { id: 'interest', title: '兴趣答疑', desc: '书法/国画/乐器问题随时问', icon: 'interest' },
  { id: 'health', title: '健康闲聊', desc: '养生咨询、防诈骗科普', icon: 'health' },
]

// 课程数据
const hotCourses = [
  { id: 'h1', title: '智能手机入门', hours: '8课时', time: '今日10:00 直播', free: true },
  { id: 'h2', title: '智能手机防骗指南', hours: '4课时', time: '今日14:00 直播', free: true },
  { id: 'h3', title: '广场舞基本功', hours: '6课时', time: '每周三 9:00', free: true },
  { id: 'h4', title: '智能手机拍照技巧', hours: '5课时', time: '每周五 10:00', free: true },
]

const systemCourses = [
  { id: 's1', title: '书法入门班', hours: '32课时', time: '3月开班', price: '¥199' },
  { id: 's2', title: '国画基础班', hours: '24课时', time: '4月开班', price: '¥159' },
  { id: 's3', title: '声乐启蒙班', hours: '20课时', time: '5月开班', price: '¥129' },
  { id: 's4', title: '智能手机系统课', hours: '16课时', time: '随报随学', price: '¥99' },
  { id: 's5', title: '养生保健班', hours: '20课时', time: '4月开班', price: '¥129' },
  { id: 's6', title: '短视频创作入门', hours: '12课时', time: '5月开班', price: '¥99' },
]

// 学科分类数据
const categories = [
  { id: 'c1', name: '智能手机', emoji: '📱' },
  { id: 'c2', name: '书画艺术', emoji: '🎨' },
  { id: 'c3', name: '声乐戏曲', emoji: '🎵' },
  { id: 'c4', name: '健康养生', emoji: '🌿' },
  { id: 'c5', name: '手工厨艺', emoji: '🧵' },
  { id: 'c6', name: '诗词文史', emoji: '📖' },
  { id: 'c7', name: '数码摄影', emoji: '📷' },
  { id: 'c8', name: '短视频', emoji: '🎬' },
]

// 便民服务数据
const publicServices = [
  { id: 'p1', name: '防电信诈骗科普', icon: '🛡️' },
  { id: 'p2', name: '社区老年活动报名', icon: '🏘️' },
  { id: 'p3', name: '就近老年学堂查询', icon: '📍' },
]

const lifeServices = [
  { id: 'l1', name: '体检预约', icon: '🏥' },
  { id: 'l2', name: '医保科普', icon: '📋' },
]

export default function Home({ onOpenAI, elderMode, onToggleElderMode }: HomeProps) {
  const [courseTab, setCourseTab] = useState<'hot' | 'system'>('hot')
  const [langMode, setLangMode] = useState<'mandarin' | 'dialect'>('mandarin')
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const installPromptRef = useRef<any>(null)
  const greeting = getGreeting()
  const greetingSuffix = getGreetingSuffix()

  // 检测是否已是 PWA 模式 & 捕获安装事件
  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    setIsStandalone(isStandaloneMode)

    const handler = (e: Event) => {
      e.preventDefault()
      installPromptRef.current = e
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallPWA = async () => {
    if (!installPromptRef.current) return
    installPromptRef.current.prompt()
    const { outcome } = await installPromptRef.current.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
    }
    installPromptRef.current = null
  }

  const renderQuickIcon = (type: string) => {
    switch (type) {
      case 'ai': return <AIAgentIcon />
      case 'live': return <LiveIcon />
      case 'enroll': return <EnrollIcon />
      case 'myclass': return <MyClassIcon />
      default: return null
    }
  }

  const renderScenarioIcon = (type: string) => {
    switch (type) {
      case 'phone': return <PhoneLearnIcon />
      case 'interest': return <InterestIcon />
      case 'health': return <HealthIcon />
      default: return null
    }
  }

  return (
    <div className={`home ${elderMode ? 'elder-mode' : ''}`}>
      {/* ===== 1. 顶部导航区 ===== */}
      <div className="home-header">
        <div className="header-row">
          <div className="header-left">
            <span className="header-logo">老年社区</span>
          </div>
          <div className="header-right">
            <Badge content="3" style={{ '--right': '-4px', '--top': '-2px' }}>
              <BellIcon />
            </Badge>
            <div className="header-user-icon" onClick={() => setShowUserMenu(!showUserMenu)}>
              <UserIcon />
            </div>
          </div>
        </div>

        {/* 语音搜课按钮 */}
        <div className="voice-search-btn">
          <MicIcon />
          <span>{langMode === 'mandarin' ? '按住说话搜课程' : '方言语音搜课程'}</span>
        </div>

        {/* PWA 安装提示 */}
        {canInstall && !isStandalone && (
          <div className="pwa-install-bar" onClick={handleInstallPWA}>
            <span className="pwa-install-icon">📱</span>
            <span className="pwa-install-text">添加到桌面，离线也能用</span>
            <button className="pwa-install-btn">一键安装</button>
          </div>
        )}
        {isStandalone && (
          <div className="pwa-installed-bar">
            <span className="pwa-install-icon">✅</span>
            <span className="pwa-install-text">已安装为桌面应用，离线可用</span>
          </div>
        )}

        {/* 温馨标语 */}
        <div className="greeting-row">
          <span className="greeting-text">{greeting}，{greetingSuffix}</span>
          <span className="greeting-hint">今日2节直播课</span>
        </div>

        {/* 用户头像下拉菜单 */}
        {showUserMenu && (<>
          <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)} />
          <div className="user-menu-dropdown">
            {/* 常用工具 */}
            <div className="user-menu-section-title">常用工具</div>
            <div className="user-menu-tools-grid">
              <div className="user-menu-tools-item">
                <span className="user-menu-tools-emoji">🔤</span>
                <span className="user-menu-tools-name">字体大小</span>
              </div>
              <div className="user-menu-tools-item">
                <span className="user-menu-tools-emoji">👁️</span>
                <span className="user-menu-tools-name">护眼模式</span>
              </div>
              <div className="user-menu-tools-item">
                <span className="user-menu-tools-emoji">🧹</span>
                <span className="user-menu-tools-name">清理缓存</span>
              </div>
              <div className="user-menu-tools-item">
                <span className="user-menu-tools-emoji">💬</span>
                <span className="user-menu-tools-name">意见反馈</span>
              </div>
            </div>

            {/* 设置中心 */}
            <div className="user-menu-section-title">设置中心</div>
            <div className="user-menu-settings-list">
              <div className="user-menu-settings-item" onClick={onToggleElderMode}>
                <span className="user-menu-settings-emoji">👵</span>
                <span className="user-menu-settings-name">老年模式</span>
                <span className={`user-menu-toggle-tag ${elderMode ? 'user-menu-toggle-tag-on' : 'user-menu-toggle-tag-off'}`}>
                  {elderMode ? '已开启' : '已关闭'}
                </span>
              </div>
              <div className="user-menu-settings-item">
                <span className="user-menu-settings-emoji">👤</span>
                <span className="user-menu-settings-name">账号与隐私</span>
                <ArrowRightIcon />
              </div>
              <div className="user-menu-settings-item">
                <span className="user-menu-settings-emoji">🔔</span>
                <span className="user-menu-settings-name">通知管理</span>
                <ArrowRightIcon />
              </div>
              <div className="user-menu-settings-item">
                <span className="user-menu-settings-emoji">ℹ️</span>
                <span className="user-menu-settings-name">关于我们</span>
                <ArrowRightIcon />
              </div>
            </div>
          </div>
        </>)}
      </div>

      {/* ===== 2. 核心快捷功能区 ===== */}
      <div className="home-quick-grid">
        {quickActions.map((item) => (
          <div
            key={item.id}
            className={`quick-item ${item.id === 'ai' ? 'quick-item-highlight' : ''}`}
            onClick={item.id === 'ai' ? onOpenAI : undefined}
          >
            <div className="quick-icon">{renderQuickIcon(item.icon)}</div>
            <div className="quick-title">{item.title}</div>
            <div className="quick-subtitle">{item.subtitle}</div>
          </div>
        ))}
      </div>

      {/* ===== 3. 智能体专属专区 ===== */}
      <div className="home-section">
        <div className="section-header">
          <span className="section-title">AI小助手 · 随身老年老师</span>
          <span className="section-more" onClick={onOpenAI}>查看更多 <ArrowRightBlueIcon /></span>
        </div>

        <div className="ai-scenarios">
          {aiScenarios.map((s) => (
            <div key={s.id} className="scenario-card" onClick={onOpenAI}>
              <div className="scenario-icon">{renderScenarioIcon(s.icon)}</div>
              <div className="scenario-title">{s.title}</div>
              <div className="scenario-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="ai-action-row">
          <button className="ai-chat-btn" onClick={onOpenAI}>{langMode === 'mandarin' ? '一键对话 AI 小助手' : '方言对话 AI 小助手'}</button>
          <div className="lang-toggle">
            <span className={`lang-tag ${langMode === 'mandarin' ? 'lang-tag-active' : ''}`} onClick={() => setLangMode('mandarin')}>普通话</span>
            <span className={`lang-tag ${langMode === 'dialect' ? 'lang-tag-active' : ''}`} onClick={() => setLangMode('dialect')}>方言</span>
          </div>
        </div>
      </div>

      {/* ===== 4. 课程推荐区 ===== */}
      <div className="home-section">
        <div className="section-header">
          <span className="section-title">课程推荐</span>
        </div>

        <div className="course-tabs">
          <span
            className={`course-tab ${courseTab === 'hot' ? 'course-tab-active' : ''}`}
            onClick={() => setCourseTab('hot')}
          >
            热门短期课
          </span>
          <span
            className={`course-tab ${courseTab === 'system' ? 'course-tab-active' : ''}`}
            onClick={() => setCourseTab('system')}
          >
            系统长期班
          </span>
        </div>

        <div className="course-list">
          {(courseTab === 'hot' ? hotCourses : systemCourses).map((c) => (
            <div key={c.id} className="course-card">
              <div className="course-card-color" style={{ background: courseTab === 'hot' ? '#4A7CFF' : '#7B49F1' }} />
              <div className="course-card-body">
                <div className="course-card-title">
                  {c.title}
                  {c.free && <span className="course-free-tag">免费</span>}
                </div>
                <div className="course-card-meta">
                  <span>{c.hours}</span>
                  <span className="meta-dot">·</span>
                  <span>{c.time}</span>
                  {c.price && <span className="meta-dot">·</span>}
                  {c.price && <span className="course-price">{c.price}</span>}
                </div>
              </div>
              <ArrowRightIcon />
            </div>
          ))}
        </div>
      </div>

      {/* ===== 5. 学科分类导航 ===== */}
      <div className="home-section">
        <div className="section-header">
          <span className="section-title">学科分类</span>
        </div>
        <div className="category-scroll">
          {categories.map((c) => (
            <div key={c.id} className="category-item">
              <span className="category-emoji">{c.emoji}</span>
              <span className="category-name">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 6. 便民配套服务 ===== */}
      <div className="home-section">
        <div className="section-header">
          <span className="section-title">便民服务</span>
        </div>

        <div className="service-block">
          <div className="service-block-title">公益板块</div>
          {publicServices.map((s) => (
            <div key={s.id} className="service-item">
              <span className="service-icon">{s.icon}</span>
              <span className="service-name">{s.name}</span>
              <ArrowRightIcon />
            </div>
          ))}
        </div>

        <div className="service-block">
          <div className="service-block-title">生活服务</div>
          {lifeServices.map((s) => (
            <div key={s.id} className="service-item">
              <span className="service-icon">{s.icon}</span>
              <span className="service-name">{s.name}</span>
              <ArrowRightIcon />
            </div>
          ))}
        </div>
      </div>

      {/* 底部留白（避免被底部导航遮挡） */}
      <div className="home-bottom-space" />
    </div>
  )
}