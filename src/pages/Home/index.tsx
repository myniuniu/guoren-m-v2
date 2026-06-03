import { useState } from 'react'
import { SearchBar, Badge, Tabs } from 'antd-mobile'
import { SearchOutline, BellOutline, FilterOutline } from 'antd-mobile-icons'
import FileList from './FileList'
import './index.css'

// 自定义图标 - 扫描/同步图标
function SyncIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('recent')

  return (
    <div className="home">
      {/* Header */}
      <div className="home-header">
        <div className="header-top">
          <div className="avatar-wrap">
            <div className="avatar">
              <img src="/assets/果仁头像-手机.png" alt="avatar" />
            </div>
            <span className="online-dot" />
          </div>
          <div className="search-wrap">
            <SearchBar
              placeholder="搜索"
              style={{
                '--border-radius': '22px',
                '--background': '#f3f3f3',
                '--height': '38px',
                '--placeholder-color': '#999',
                '--padding-left': '12px',
              }}
              icon={<SearchOutline fontSize={16} color="#999" />}
            />
            <div className="sync-icon">
              <SyncIcon />
            </div>
          </div>
          <div className="bell-wrap">
            <Badge content="1" style={{ '--right': '-2px', '--top': '0px' }}>
              <BellOutline fontSize={24} color="#333" />
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="tabs-section">
        <div className="tabs-inner">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{
              '--active-line-color': 'transparent',
              '--active-title-color': '#000',
              '--title-font-size': '15px',
              '--content-padding': '0',
            }}
          >
            <Tabs.Tab key="recent" title={<span className={activeTab === 'recent' ? 'tab-active' : 'tab-normal'}>最近</span>} />
            <Tabs.Tab key="quick" title={<span className={activeTab === 'quick' ? 'tab-active' : 'tab-normal'}>快速访问</span>} />
            <Tabs.Tab key="fav" title={<span className={activeTab === 'fav' ? 'tab-active' : 'tab-normal'}>收藏</span>} />
          </Tabs>
        </div>
        <div className="filter-btn">
          <FilterOutline fontSize={18} color="#666" />
        </div>
      </div>

      {/* File List */}
      <div className="file-list-container">
        <FileList />
      </div>

    </div>
  )
}
