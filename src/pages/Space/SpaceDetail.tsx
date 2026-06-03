import { useState } from 'react'
import './SpaceDetail.css'

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

interface SpaceDetailProps {
  space: SpaceItem
  onBack: () => void
}

interface ContentItem {
  id: number
  name: string
  type: 'page' | 'folder' | 'voice' | 'emoji' | 'pdf'
  hasArrow?: boolean
}

const contentItems: ContentItem[] = [
  { id: 1, name: '空间主页', type: 'page', hasArrow: true },
  { id: 2, name: 'XX考试', type: 'folder', hasArrow: true },
  { id: 3, name: 'XX课程', type: 'folder', hasArrow: true },
  { id: 4, name: '333', type: 'folder', hasArrow: true },
  { id: 5, name: 'erttt', type: 'folder', hasArrow: true },
  { id: 6, name: '语音速记_2026-02-12', type: 'voice' },
  { id: 7, name: '语音速记_2026-01-23', type: 'voice' },
  { id: 8, name: '111112', type: 'emoji' },
  { id: 9, name: '技术部+航标技术岗AI赋能报告', type: 'pdf' },
]

// 返回图标
function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

// 成员图标
function MembersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <text x="19" y="8" fontSize="7" fill="#333" fontWeight="bold">6</text>
    </svg>
  )
}

// 分享图标
function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

// 菜单图标
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

// 搜索图标
function SearchIcon2() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// 文件图标组件
function ItemIcon({ type }: { type: ContentItem['type'] }) {
  switch (type) {
    case 'page':
      return (
        <div className="item-icon item-icon-page">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#4CAF50" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )
    case 'folder':
      return (
        <div className="item-icon item-icon-folder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#42A5F5">
            <path d="M2 6C2 4.89543 2.89543 4 4 4H9L11 6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6Z" />
          </svg>
        </div>
      )
    case 'voice':
      return (
        <div className="item-icon item-icon-voice">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="4" fill="#4A90D9" />
            <path d="M8 8h8M8 12h6M8 16h7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )
    case 'emoji':
      return (
        <div className="item-icon item-icon-emoji">
          <span style={{ fontSize: 20 }}>🦉</span>
        </div>
      )
    case 'pdf':
      return (
        <div className="item-icon item-icon-pdf">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="4" fill="#E53935" />
            <text x="12" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">A</text>
          </svg>
        </div>
      )
  }
}

// 展开箭头
function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

// 底部工具栏图标
function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function AIAskIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12a4 4 0 0 1 4-4M12 16a4 4 0 0 0 4-4" />
      <circle cx="12" cy="12" r="1" fill="#333" />
    </svg>
  )
}

function DocCountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 7h8M8 12h6M8 17h7" />
    </svg>
  )
}

// 添加资料面板图标
function WechatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M8.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM13.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="#333" />
      <path d="M21 12.5C21 17.19 16.97 21 12 21c-1.5 0-2.91-.35-4.16-.97L3 21l1.2-3.35C2.83 16.17 2 14.4 2 12.5 2 7.81 6.03 4 11 4h1c4.97 0 9 3.81 9 8.5z" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" />
    </svg>
  )
}

function AddDocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8h8M8 12h5" />
      <circle cx="16" cy="16" r="4" fill="#fff" stroke="#333" strokeWidth="1.5" />
      <path d="M16 14v4M14 16h4" />
    </svg>
  )
}

function NewNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ClipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.5 8.5L15.5 15.5" />
      <path d="M15 2l7 7-9.5 9.5a5 5 0 0 1-7-7L15 2z" />
    </svg>
  )
}

function PasteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  )
}

function MoreMethodIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

// 文件预览页组件
function FilePreview({ file, onBack }: { file: any, onBack: () => void }) {
  // 根据图示，这是一个文档类型（或空间主页）的预览
  // 包含顶部背景图、标题区、作者信息、富文本正文（支持折叠块）
  
  return (
    <div className="file-preview-page">
      <div className="detail-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'transparent' }}>
        <div className="detail-header-left" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
        <div className="detail-header-right">
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="file-preview-banner">
        {/* 这里用 CSS 画一个类似图示的渐变背景 */}
      </div>

      <div className="file-preview-content-area">
        <div className="file-preview-icon-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        
        <h1 className="file-preview-title">{file.name || '空间主页'}</h1>
        
        <div className="file-preview-meta">
          <span>张洪磊 创建</span>
          <span className="divider">|</span>
          <span className="icon-text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            214
          </span>
          <span className="icon-text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            10
          </span>
        </div>

        <div className="file-preview-body">
          <p className="file-preview-greeting">👋 欢迎来到空间～</p>
          <p className="file-preview-text">
            这里是团队的公告板，也是你的个人灵感墙。无论是项目里程碑，还是迸发的奇思妙想，都可以在这里记录和分享。
          </p>
          <p className="file-preview-text">9222~29229</p>

          <div className="file-preview-block">
            <div className="file-preview-block-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              <span>⭐ 空间简介</span>
            </div>
            <div className="file-preview-block-content">
              <div className="quote-line"></div>
              <p>这里可以介绍空间的主要内容和适用人群。</p>
            </div>
          </div>

          <div className="file-preview-block">
            <div className="file-preview-block-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              <span>📢 空间公告</span>
            </div>
            <div className="file-preview-block-content">
              <div className="quote-line" style={{borderColor: '#3b82f6'}}></div>
              <p>这里可以同步空间的最新进展和项目待办。</p>
            </div>
          </div>

          <div className="file-preview-block">
            <div className="file-preview-block-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              <span>📌 常用链接</span>
            </div>
            <div className="file-preview-block-content">
              <div className="quote-line" style={{borderColor: '#3b82f6'}}></div>
              <p>这里可以粘贴常用文档和链接，方便快速访问。</p>
            </div>
          </div>
        </div>
      </div>

      {/* 右下角编辑按钮 */}
      <button className="file-preview-edit-fab">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span>编辑</span>
      </button>
    </div>
  )
}

// 目录详情页组件
function DirectoryDetail({ dir, onBack, onFileClick }: { dir: any, onBack: () => void, onFileClick: (file: any) => void }) {
  return (
    <div className="directory-detail-page">
      <div className="detail-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#fff' }}>
        <div className="detail-header-left" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <div className="detail-header-right">
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="directory-header-info">
        <div className="directory-icon-large">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 10C4 7.79086 5.79086 6 8 6H18.5858C19.6466 6 20.6639 6.42143 21.4142 7.17157L24.8284 10.5858C25.5786 11.3359 26.5959 11.7574 27.6569 11.7574H40C42.2091 11.7574 44 13.5482 44 15.7574V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V10Z" fill="#3b82f6"/>
          </svg>
        </div>
        <div className="directory-meta">
          <div className="directory-title">{dir.title}</div>
          <div className="directory-subtitle">3个文件 <span className="divider">|</span> 0个文件夹</div>
        </div>
      </div>

      <div className="directory-add-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>添加资料</span>
      </div>

      <div className="directory-list">
        <div className="directory-list-title">名称</div>
        
        <div className="directory-item" onClick={() => onFileClick({ name: '课程主页' })}>
          <div className="directory-item-icon">😎</div>
          <div className="directory-item-info">
            <div className="directory-item-name">课程主页</div>
            <div className="directory-item-meta">张洪磊 所有 <span className="divider">|</span> 2月2日 编辑</div>
          </div>
          <button className="directory-item-more" onClick={e => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#B0B0B0">
              <circle cx="12" cy="4" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="20" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="directory-item" onClick={() => onFileClick({ name: '课程介绍' })}>
          <div className="directory-item-icon">🏔️</div>
          <div className="directory-item-info">
            <div className="directory-item-name">课程介绍</div>
            <div className="directory-item-meta">张洪磊 所有 <span className="divider">|</span> 2月28日 编辑</div>
          </div>
          <button className="directory-item-more" onClick={e => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#B0B0B0">
              <circle cx="12" cy="4" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="20" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="directory-item" onClick={() => onFileClick({ name: '果仁家族.mp4' })}>
          <div className="directory-item-icon" style={{ background: '#E8F0FE', borderRadius: '8px', padding: '6px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" fill="#3b82f6" stroke="none"></polygon>
            </svg>
          </div>
          <div className="directory-item-info">
            <div className="directory-item-name">果仁家族.mp4</div>
            <div className="directory-item-meta">张洪磊 所有 <span className="divider">|</span> 1月27日 编辑</div>
          </div>
          <button className="directory-item-more" onClick={e => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#B0B0B0">
              <circle cx="12" cy="4" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="20" r="1.5" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

export default function SpaceDetail({ space, onBack }: SpaceDetailProps) {
  const name = space.name
  const contentCount = space.contentCount
  const isNew = space.contentCount === 0 // 简化判断
  const [activeTab, setActiveTab] = useState('list') // list, result
  const [showMenu, setShowMenu] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('默认助手')
  const [currentDir, setCurrentDir] = useState<any>(null) // 控制是否显示目录详情页
  const [previewFile, setPreviewFile] = useState<any>(null) // 控制是否显示文件预览页

  if (previewFile) {
    return <FilePreview file={previewFile} onBack={() => setPreviewFile(null)} />
  }

  if (currentDir) {
    return <DirectoryDetail dir={currentDir} onBack={() => setCurrentDir(null)} onFileClick={(file) => setPreviewFile(file)} />
  }

  const agents = [
    { id: 1, name: '默认助手', icon: '🤖', color: '#4A90D9' },
    { id: 2, name: '研发专家', icon: '💻', color: '#E8734A' },
    { id: 3, name: '文档分析师', icon: '📊', color: '#50C878' },
    { id: 4, name: '创意写手', icon: '✍️', color: '#9B59B6' },
    { id: 5, name: '知识管理师', icon: '📚', color: '#F39C12' },
  ]

  const isEmpty = contentCount === 0

  return (
    <div className="space-detail">
      {/* 顶部导航 */}
      <div className="detail-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'transparent' }}>
        <div className="detail-header-left" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <div className="detail-header-right">
          <button className="icon-btn" onClick={() => setShowMembers(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </button>
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setShowMenu(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* 封面Banner */}
      <div className="space-detail-cover" style={{ background: `linear-gradient(135deg, ${space.coverColor} 0%, #FFF0D4 100%)` }}>
        <div className="space-detail-cover-stars">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', top: 20, left: 20, opacity: 0.5 }}>
            <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" fill="white" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', bottom: 30, right: 30, opacity: 0.3 }}>
            <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* 内容区 */}
      <div className="detail-body">
        {/* 标题区 */}
        <div className="space-detail-info">
          <h1 className="detail-title">{name}</h1>
          <div className="detail-subtitle">
            <span>{space.owner} 创建</span>
            <span className="detail-dot">·</span>
            <span>共{contentCount}个内容</span>
            <span className="detail-desc-link">简介 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></span>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          <div className="detail-tab active">资料列表</div>
          <div className="detail-tab">创作结果</div>
          <div className="detail-tab-search">
            <SearchIcon2 />
          </div>
        </div>

        {/* 添加资料按钮 */}
        <div className="add-material-btn" onClick={() => setShowAddPanel(true)}>
          <span>＋</span>
          <span>添加资料</span>
        </div>

        {/* 内容列表或空状态 */}
        {isEmpty ? (
          <div className="detail-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="detail-empty-text">添加文件或链接，AI将从此处学习，为你所用</p>
          </div>
        ) : (
          <div className="detail-content-list">
            {contentItems.map((item) => (
              <div className="detail-content-item" key={item.id} onClick={() => {
                if (item.type === 'folder') {
                  setCurrentDir({ title: item.name });
                } else {
                  setPreviewFile(item);
                }
              }}>
                {item.hasArrow && (
                  <div className="item-arrow">
                    <ArrowIcon />
                  </div>
                )}
                <ItemIcon type={item.type} />
                <span className="item-name">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="detail-bottom-bar">
        <div className="bottom-bar-grid">
          <GridIcon />
        </div>
        <div className="bottom-bar-ai" onClick={() => setShowAIPanel(true)}>
          <AIAskIcon />
          <span>基于{contentCount}篇资料问问AI</span>
        </div>
        <div className="bottom-bar-count">
          <DocCountIcon />
          <span>15</span>
        </div>
      </div>
      {/* 添加资料弹出面板 */}
      {showAddPanel && (
        <>
          <div className="add-panel-mask" onClick={() => setShowAddPanel(false)} />
          <div className="add-panel">
            <div className="add-panel-header">
              <span className="add-panel-title">添加资料</span>
              <div className="add-panel-close" onClick={() => setShowAddPanel(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <div className="add-panel-main">
              <div className="add-panel-row">
                <div className="add-panel-card">
                  <WechatIcon />
                  <span>微信文件</span>
                </div>
                <div className="add-panel-card">
                  <PhoneIcon />
                  <span>手机文件</span>
                </div>
              </div>
            </div>
            <div className="add-panel-section">
              <div className="add-panel-section-title">其他方式</div>
              <div className="add-panel-grid">
                <div className="add-panel-option">
                  <AddDocIcon />
                  <span>添加已有文档</span>
                </div>
                <div className="add-panel-option">
                  <NewNoteIcon />
                  <span>新建笔记</span>
                </div>
                <div className="add-panel-option">
                  <ClipIcon />
                  <span>网页文章剪存</span>
                </div>
                <div className="add-panel-option">
                  <PasteIcon />
                  <span>粘贴文本</span>
                </div>
                <div className="add-panel-option">
                  <MoreMethodIcon />
                  <span>更多方式</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* 问问AI全屏面板 */}
      {showAIPanel && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-panel-minimize" onClick={() => setShowHistory(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-panel-title">
              <div className="ai-agent-selector" onClick={() => setShowAgentPicker(true)}>
                <span className="ai-agent-icon">{agents.find(a => a.name === selectedAgent)?.icon}</span>
                <span className="ai-agent-name">{selectedAgent}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div className="ai-panel-header-right">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="12" y1="8" x2="12" y2="14" />
                <line x1="9" y1="11" x2="15" y2="11" />
              </svg>
              <div className="ai-panel-close" onClick={() => setShowAIPanel(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </div>
          <div className="ai-panel-body">
            <h2 className="ai-panel-welcome">Hi，欢迎对空间提问</h2>
            <p className="ai-panel-desc">基于个人空间的15篇资料，你或许想知道</p>
            <div className="ai-panel-suggestions">
              <div className="ai-suggestion-item">AI原生研发流水线有何优势？</div>
              <div className="ai-suggestion-item">OpenSpec规范语言的定义是什么？</div>
              <div className="ai-suggestion-item">果仁空间如何构建协同生态？</div>
            </div>
          </div>
          <div className="ai-panel-input-bar">
            <div className="ai-input-wrap">
              <AIAskIcon />
              <span className="ai-input-placeholder">基于15篇资料问问AI</span>
            </div>
            <div className="ai-input-count">
              <DocCountIcon />
              <span>{contentCount}</span>
            </div>
          </div>
        </div>
      )}
      {/* 智能体选择弹窗 */}
      {showAgentPicker && (
        <>
          <div className="agent-picker-mask" onClick={() => setShowAgentPicker(false)} />
          <div className="agent-picker">
            <div className="agent-picker-title">选择智能体</div>
            <div className="agent-picker-list">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`agent-picker-item ${selectedAgent === agent.name ? 'active' : ''}`}
                  onClick={() => { setSelectedAgent(agent.name); setShowAgentPicker(false) }}
                >
                  <div className="agent-picker-icon" style={{ background: agent.color }}>{agent.icon}</div>
                  <span className="agent-picker-name">{agent.name}</span>
                  {selectedAgent === agent.name && (
                    <svg className="agent-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* 历史会话面板 */}
      {showHistory && (
        <div className="history-panel">
          <div className="history-panel-header">
            <div className="history-back" onClick={() => setShowHistory(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div className="history-panel-title">历史会话</div>
            <div className="history-panel-header-right">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="history-close" onClick={() => { setShowHistory(false); setShowAIPanel(false) }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </div>
          <div className="history-list">
            <div className="history-item">重庆赛区AI评审标准</div>
            <div className="history-item">生成HTML简介预览</div>
            <div className="history-item">生成概要文档</div>
            <div className="history-item">传统研发流程痛点</div>
            <div className="history-item">陕西赛区作品淘汰原因</div>
            <div className="history-item">自我介绍</div>
            <div className="history-item">统计结果查询</div>
            <div className="history-item">OpenSpec治理方法</div>
            <div className="history-item">果仁空间核心逻辑</div>
          </div>
        </div>
      )}
      {/* 空间成员管理全屏页 */}
      {showMembers && (
        <div className="members-page">
          <div className="members-header">
            <div className="members-back" onClick={() => setShowMembers(false)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div className="members-title">空间成员管理</div>
          </div>
          <div className="members-body">
            {/* 空间权限 */}
            <div className="members-section">
              <div className="members-section-title">空间权限</div>
              <div className="members-permission-row">
                <div className="members-permission-select">
                  <span>指定人</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div className="members-permission-btn">权限设置</div>
              </div>
            </div>
            {/* 空间成员 */}
            <div className="members-section">
              <div className="members-section-title">空间成员 · 6</div>
              <div className="members-action-row">
                <div className="members-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>添加成员</span>
                </div>
                <div className="members-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>邀请成员加入</span>
                </div>
              </div>
              <div className="members-list">
                <div className="members-item">
                  <div className="members-avatar" style={{ background: '#4A90D9' }}>张</div>
                  <div className="members-info">
                    <span className="members-name">张洪磊</span>
                    <span className="members-role">空间所有者</span>
                  </div>
                </div>
                <div className="members-item">
                  <div className="members-avatar" style={{ background: '#E8734A' }}>李</div>
                  <div className="members-info">
                    <span className="members-name">李明</span>
                    <span className="members-role">可编辑</span>
                  </div>
                </div>
                <div className="members-item">
                  <div className="members-avatar" style={{ background: '#50C878' }}>王</div>
                  <div className="members-info">
                    <span className="members-name">王芳</span>
                    <span className="members-role">可编辑</span>
                  </div>
                </div>
                <div className="members-item">
                  <div className="members-avatar" style={{ background: '#9B59B6' }}>赵</div>
                  <div className="members-info">
                    <span className="members-name">赵强</span>
                    <span className="members-role">可编辑</span>
                  </div>
                </div>
                <div className="members-item">
                  <div className="members-avatar" style={{ background: '#F39C12' }}>陈</div>
                  <div className="members-info">
                    <span className="members-name">陈静</span>
                    <span className="members-role">可编辑</span>
                  </div>
                </div>
                <div className="members-item">
                  <div className="members-avatar" style={{ background: '#1ABC9C' }}>刘</div>
                  <div className="members-info">
                    <span className="members-name">刘洋</span>
                    <span className="members-role">可编辑</span>
                  </div>
                </div>
              </div>
              <div className="members-view-all">查看全部空间成员</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
