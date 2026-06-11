import { useMemo, useState } from 'react'
import './index.css'

type LibraryScope = 'personal' | 'org'
type LibraryEntryType = 'folder' | 'pdf' | 'doc' | 'ppt' | 'sheet' | 'image'
type SidebarFilter = 'all' | 'recent' | 'folder' | 'starred' | 'shared' | 'tag:AI' | 'tag:课程' | 'tag:教研'

interface LibraryEntry {
  id: string
  name: string
  type: LibraryEntryType
  scope: LibraryScope
  orgSpace?: string
  parentId: string | null
  updatedAt: string
  owner: string
  size?: string
  starred?: boolean
  shared?: boolean
  tags: string[]
}

const libraryEntries: LibraryEntry[] = [
  { id: 'p-folder-1', name: '教育信息化资料库', type: 'folder', scope: 'personal', parentId: null, updatedAt: '今天 09:18', owner: '我', starred: true, shared: false, tags: ['课程', '教研'] },
  { id: 'p-folder-2', name: '人工智能-教育', type: 'folder', scope: 'personal', parentId: null, updatedAt: '昨天 17:36', owner: '我', starred: true, shared: true, tags: ['AI', '课程'] },
  { id: 'p-folder-3', name: '模板作品集', type: 'folder', scope: 'personal', parentId: null, updatedAt: '06-01 12:08', owner: '我', starred: false, shared: false, tags: ['教研'] },
  { id: 'p-file-1', name: 'AI 自动化案例清单.pdf', type: 'pdf', scope: 'personal', parentId: null, updatedAt: '05-31 19:24', owner: '我', size: '2.3 MB', starred: true, shared: true, tags: ['AI'] },
  { id: 'p-file-2', name: '课堂评价指标库.xlsx', type: 'sheet', scope: 'personal', parentId: null, updatedAt: '05-30 15:10', owner: '我', size: '348 KB', starred: false, shared: false, tags: ['课程', '教研'] },
  { id: 'p-file-3', name: '果仁产品介绍.pptx', type: 'ppt', scope: 'personal', parentId: null, updatedAt: '05-28 09:05', owner: '我', size: '5.1 MB', starred: false, shared: true, tags: ['AI'] },
  { id: 'p-folder-2-folder-1', name: '课程智能体实验', type: 'folder', scope: 'personal', parentId: 'p-folder-2', updatedAt: '昨天 16:08', owner: '我', starred: true, shared: false, tags: ['AI', '课程'] },
  { id: 'p-folder-2-folder-1-folder-1', name: '多模态课堂观察', type: 'folder', scope: 'personal', parentId: 'p-folder-2-folder-1', updatedAt: '昨天 15:42', owner: '我', starred: false, shared: false, tags: ['AI', '课程'] },
  { id: 'p-folder-2-folder-1-folder-1-folder-1', name: '2026 春季试点', type: 'folder', scope: 'personal', parentId: 'p-folder-2-folder-1-folder-1', updatedAt: '昨天 15:18', owner: '我', starred: false, shared: false, tags: ['AI'] },
  { id: 'p-folder-2-folder-1-folder-1-folder-1-file-1', name: '课堂助教提示词手册.pdf', type: 'pdf', scope: 'personal', parentId: 'p-folder-2-folder-1-folder-1-folder-1', updatedAt: '昨天 15:05', owner: '我', size: '1.8 MB', starred: true, shared: false, tags: ['AI', '课程'] },
  { id: 'p-folder-1-file-1', name: '智慧教室建设方案.docx', type: 'doc', scope: 'personal', parentId: 'p-folder-1', updatedAt: '今天 10:02', owner: '我', size: '1.1 MB', starred: true, shared: false, tags: ['课程'] },
  { id: 'p-folder-1-file-2', name: '职业教育改革图谱.png', type: 'image', scope: 'personal', parentId: 'p-folder-1', updatedAt: '今天 09:46', owner: '我', size: '860 KB', starred: false, shared: false, tags: ['教研'] },
  { id: 'p-folder-2-file-1', name: '课程智能体能力框架.pdf', type: 'pdf', scope: 'personal', parentId: 'p-folder-2', updatedAt: '昨天 16:21', owner: '我', size: '3.6 MB', starred: true, shared: true, tags: ['AI', '课程'] },
  { id: 'o-folder-1', name: '课堂评价', type: 'folder', scope: 'org', orgSpace: '果仁集团', parentId: null, updatedAt: '今天 11:15', owner: '组织', starred: true, shared: true, tags: ['课程'] },
  { id: 'o-folder-2', name: '人工智能通识课', type: 'folder', scope: 'org', orgSpace: '果仁集团', parentId: null, updatedAt: '昨天 14:06', owner: '组织', starred: true, shared: true, tags: ['AI', '课程'] },
  { id: 'o-folder-3', name: '教研-数学', type: 'folder', scope: 'org', orgSpace: '教育研究院', parentId: null, updatedAt: '05-29 18:31', owner: '组织', starred: false, shared: true, tags: ['教研'] },
  { id: 'o-file-1', name: '组织资料库接入规范.pdf', type: 'pdf', scope: 'org', orgSpace: '果仁集团', parentId: null, updatedAt: '05-29 09:12', owner: '组织', size: '4.7 MB', starred: true, shared: true, tags: ['AI'] },
  { id: 'o-file-2', name: '空间协作流程说明.docx', type: 'doc', scope: 'org', orgSpace: '教务中心', parentId: null, updatedAt: '05-27 17:42', owner: '组织', size: '690 KB', starred: false, shared: true, tags: ['教研'] },
  { id: 'o-folder-1-file-1', name: '动物王国开大会.pptx', type: 'ppt', scope: 'org', orgSpace: '果仁集团', parentId: 'o-folder-1', updatedAt: '今天 08:42', owner: 'jinlf', size: '8.2 MB', starred: false, shared: true, tags: ['课程'] },
  { id: 'o-folder-1-file-2', name: '评课指标.pdf', type: 'pdf', scope: 'org', orgSpace: '果仁集团', parentId: 'o-folder-1', updatedAt: '今天 08:16', owner: 'jinlf', size: '2.8 MB', starred: true, shared: true, tags: ['课程', '教研'] },
  { id: 'o-folder-2-file-1', name: '课程资源清单.xlsx', type: 'sheet', scope: 'org', orgSpace: '果仁集团', parentId: 'o-folder-2', updatedAt: '昨天 13:28', owner: 'guoren-team', size: '412 KB', starred: false, shared: true, tags: ['AI', '课程'] },
  { id: 'o-folder-3-file-1', name: '沈阳故宫介绍.docx', type: 'doc', scope: 'org', orgSpace: '教育研究院', parentId: 'o-folder-3', updatedAt: '05-29 11:36', owner: 'jinlf', size: '1.7 MB', starred: false, shared: false, tags: ['教研'] },
]

const orgSpaces = ['果仁集团', '教育研究院', '教务中心']

const quickFilters: Array<{ key: SidebarFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'recent', label: '最近' },
  { key: 'folder', label: '文件夹' },
]

const filterSheetSections: Array<{
  title: string
  items: Array<{ key: SidebarFilter; label: string; dot?: string }>
}> = [
  {
    title: '收藏',
    items: [
      { key: 'starred', label: '已收藏', dot: '#ff5a5f' },
      { key: 'shared', label: '共享', dot: '#ffb020' },
    ],
  },
  {
    title: '标签',
    items: [
      { key: 'tag:AI', label: 'AI', dot: '#6a7dff' },
      { key: 'tag:课程', label: '课程', dot: '#4fb97a' },
      { key: 'tag:教研', label: '教研', dot: '#b073ff' },
    ],
  },
]

const filterLabelMap: Record<SidebarFilter, string> = {
  all: '全部',
  recent: '最近',
  folder: '文件夹',
  starred: '已收藏',
  shared: '共享',
  'tag:AI': 'AI',
  'tag:课程': '课程',
  'tag:教研': '教研',
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#b0b5bd">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

function FileTypeIcon({ type }: { type: LibraryEntryType }) {
  if (type === 'folder') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 7.5C3 6.12 4.12 5 5.5 5H9l1.8 2H18.5C19.88 7 21 8.12 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" fill="#5A9BFF" />
      </svg>
    )
  }

  const config: Record<Exclude<LibraryEntryType, 'folder'>, { bg: string; label: string }> = {
    pdf: { bg: '#FF5A5F', label: 'PDF' },
    doc: { bg: '#4A7CFF', label: 'DOC' },
    ppt: { bg: '#FF8A34', label: 'PPT' },
    sheet: { bg: '#25B864', label: 'XLS' },
    image: { bg: '#8D5BFF', label: 'IMG' },
  }

  const { bg, label } = config[type]

  return (
    <div className="library-file-icon" style={{ background: bg }}>
      {label}
    </div>
  )
}

function LibraryFilePreview({ file, onBack }: { file: LibraryEntry; onBack: () => void }) {
  return (
    <div className="library-file-preview-page" data-page-swipe-ignore="true">
      <div className="library-file-preview-topbar">
        <button className="library-icon-btn" data-app-back-button="true" type="button" onClick={onBack}>
          <BackIcon />
        </button>
        <div className="library-file-preview-topbar-title">{file.name}</div>
        <div className="library-icon-placeholder" />
      </div>

      <div className="library-file-preview-stage">
        <div className="library-file-preview-paper">
          <div className="library-file-preview-paper-header">
            <FileTypeIcon type={file.type} />
            <div className="library-file-preview-paper-title-wrap">
              <div className="library-file-preview-paper-title">{file.name}</div>
              <div className="library-file-preview-paper-meta">{file.owner} · {file.updatedAt} · {file.size ?? '文件'}</div>
            </div>
          </div>

          <div className="library-file-preview-paper-body">
            <div className="library-file-preview-paper-block">
              <div className="library-file-preview-paper-block-title">预览内容</div>
              <p>这里展示资料正文的预览内容，进入页面后直接沉浸式阅读，不再出现资料详情卡片。</p>
              <p>当前文件来自资料库，可继续按不同文件类型扩展更细的预览模板，例如 PDF、PPT、图片和表格。</p>
            </div>

            <div className="library-file-preview-paper-block">
              <div className="library-file-preview-paper-block-title">文件信息</div>
              <p>文件类型：{file.type.toUpperCase()}</p>
              <p>标签：{file.tags.join('、')}</p>
              <p>更新时间：{file.updatedAt}</p>
            </div>

            <div className="library-file-preview-paper-block">
              <div className="library-file-preview-paper-block-title">扩展说明</div>
              <p>如果后续接真实文件源，这里可以直接替换成对应的 PDF 画布、PPT 预览图集或图片查看器。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const [scope, setScope] = useState<LibraryScope>('personal')
  const [folderPath, setFolderPath] = useState<string[]>([])
  const [selectedFilter, setSelectedFilter] = useState<SidebarFilter>('all')
  const [selectedOrgSpace, setSelectedOrgSpace] = useState('果仁集团')
  const [keyword, setKeyword] = useState('')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showOrgSpaceSheet, setShowOrgSpaceSheet] = useState(false)
  const [previewFile, setPreviewFile] = useState<LibraryEntry | null>(null)
  const [actionTarget, setActionTarget] = useState<LibraryEntry | null>(null)
  const currentFolderId = folderPath[folderPath.length - 1] ?? null

  const currentFolder = useMemo(
    () => libraryEntries.find((item) => item.id === currentFolderId) ?? null,
    [currentFolderId]
  )

  const visibleItems = useMemo(
    () =>
      libraryEntries.filter((item) => {
        if (item.scope !== scope) return false
        if (scope === 'org' && item.orgSpace !== selectedOrgSpace) return false
        if (item.parentId !== currentFolderId) return false
        if (selectedFilter === 'recent' && !item.updatedAt.includes('今天') && !item.updatedAt.includes('昨天')) return false
        if (selectedFilter === 'folder' && item.type !== 'folder') return false
        if (selectedFilter === 'starred' && !item.starred) return false
        if (selectedFilter === 'shared' && !item.shared) return false
        if (selectedFilter.startsWith('tag:') && !item.tags.includes(selectedFilter.replace('tag:', ''))) return false
        if (!keyword.trim()) return true
        return item.name.toLowerCase().includes(keyword.trim().toLowerCase())
      }),
    [scope, currentFolderId, keyword, selectedFilter, selectedOrgSpace]
  )

  const currentTitle = currentFolder ? currentFolder.name : scope === 'personal' ? '个人资料库' : '组织资料库'
  const isQuickFilter = quickFilters.some((item) => item.key === selectedFilter)
  const handleInternalBack = () => {
    if (previewFile) {
      setPreviewFile(null)
      return
    }

    setFolderPath((current) => current.slice(0, -1))
  }

  if (previewFile) {
    return <LibraryFilePreview file={previewFile} onBack={handleInternalBack} />
  }

  const handleScopeChange = (nextScope: LibraryScope) => {
    setScope(nextScope)
    setFolderPath([])
    setSelectedFilter('all')
    setKeyword('')
    setShowFilterSheet(false)
    setShowOrgSpaceSheet(false)
    setPreviewFile(null)
  }

  const handleItemClick = (item: LibraryEntry) => {
    if (item.type === 'folder') {
      setFolderPath((current) => [...current, item.id])
      return
    }

    setPreviewFile(item)
  }

  const handleFilterChange = (filter: SidebarFilter, closeSheet = false) => {
    setSelectedFilter(filter)
    if (closeSheet) {
      setShowFilterSheet(false)
    }
  }

  return (
    <div className="library-page" data-page-swipe-ignore={currentFolder ? 'true' : undefined}>
      <div className="library-header">
        <div className="library-nav">
          {currentFolder ? (
            <button
              className="library-icon-btn"
              data-app-back-button="true"
              type="button"
              onClick={handleInternalBack}
            >
              <BackIcon />
            </button>
          ) : (
            <div className="library-icon-placeholder" />
          )}
          <div className="library-title-wrap">
            <div className="library-title">{currentTitle}</div>
            <div className="library-subtitle">{visibleItems.length} 项内容</div>
          </div>
          <button className="library-icon-btn" type="button" onClick={() => setShowFilterSheet(true)}>
            <FilterIcon />
          </button>
        </div>

        <div className={`library-scope-switch ${scope === 'personal' ? 'is-personal' : 'is-org'}`}>
          <button
            className={`library-scope-btn ${scope === 'personal' ? 'is-active' : ''}`}
            type="button"
            onClick={() => handleScopeChange('personal')}
          >
            个人资料库
          </button>
          <button
            className={`library-scope-btn ${scope === 'org' ? 'is-active' : ''}`}
            type="button"
            onClick={() => handleScopeChange('org')}
          >
            组织资料库
          </button>
        </div>

        {scope === 'org' && (
          <button className="library-org-space-trigger" type="button" onClick={() => setShowOrgSpaceSheet(true)}>
            <span className="library-org-space-value">{selectedOrgSpace}</span>
            <ChevronDownIcon />
          </button>
        )}

        <div className="library-search">
          <SearchIcon />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索资料名称"
          />
        </div>

        <div className="library-filter-row">
          {quickFilters.map((item) => (
            <button
              key={item.key}
              className={`library-filter-chip ${selectedFilter === item.key ? 'is-active' : ''}`}
              type="button"
              onClick={() => handleFilterChange(item.key)}
            >
              {item.label}
            </button>
          ))}
          <button
            className={`library-filter-chip library-filter-more ${!isQuickFilter ? 'is-active' : ''}`}
            type="button"
            onClick={() => setShowFilterSheet(true)}
          >
            收藏/标签
          </button>
        </div>

        {!isQuickFilter && (
          <div className="library-active-filter">
            <span className="library-active-filter-pill">{filterLabelMap[selectedFilter]}</span>
            <button className="library-active-filter-clear" type="button" onClick={() => handleFilterChange('all')}>
              清除
            </button>
          </div>
        )}
      </div>

      <div className="library-content">
        <div className="library-list">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => {
              const isFolder = item.type === 'folder'

              return (
                <div
                  key={item.id}
                  className="library-item"
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleItemClick(item)
                    }
                  }}
                >
                  <div className="library-item-main">
                    <FileTypeIcon type={item.type} />
                    <div className="library-item-body">
                      <div className="library-item-name">{item.name}</div>
                      <div className="library-item-meta">
                        {item.owner} · {item.updatedAt}
                      </div>
                    </div>
                  </div>
                  <div className="library-item-side">
                    <span className="library-item-side-text">{isFolder ? '文件夹' : item.size ?? item.type.toUpperCase()}</span>
                    <button
                      className="library-item-more"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActionTarget(item)
                      }}
                    >
                      <MoreIcon />
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="library-empty">
              <div className="library-empty-title">没有找到相关资料</div>
              <div className="library-empty-desc">试试更换关键字、切换资料库或筛选条件</div>
            </div>
          )}
        </div>
      </div>

      {showFilterSheet && (
        <div className="library-filter-sheet-overlay" onClick={() => setShowFilterSheet(false)}>
          <div className="library-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="library-filter-sheet-handle" />
            <div className="library-filter-sheet-title">收藏与标签</div>
            {filterSheetSections.map((section) => (
              <div className="library-filter-section" key={section.title}>
                <div className="library-filter-section-title">{section.title}</div>
                <div className="library-filter-section-options">
                  {section.items.map((item) => (
                    <button
                      key={item.key}
                      className={`library-sheet-option ${selectedFilter === item.key ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => handleFilterChange(item.key, true)}
                    >
                      {item.dot ? <span className="library-sheet-option-dot" style={{ background: item.dot }} /> : null}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="library-filter-reset" type="button" onClick={() => handleFilterChange('all', true)}>
              重置筛选
            </button>
          </div>
        </div>
      )}

      {showOrgSpaceSheet && (
        <div className="library-filter-sheet-overlay" onClick={() => setShowOrgSpaceSheet(false)}>
          <div className="library-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="library-filter-sheet-handle" />
            <div className="library-filter-sheet-title">选择组织空间</div>
            <div className="library-filter-section-options">
              {orgSpaces.map((space) => (
                <button
                  key={space}
                  className={`library-sheet-option ${selectedOrgSpace === space ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => {
                    setSelectedOrgSpace(space)
                    setFolderPath([])
                    setPreviewFile(null)
                    setShowOrgSpaceSheet(false)
                  }}
                >
                  <span>{space}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {actionTarget && (
        <div className="library-action-sheet-overlay" onClick={() => setActionTarget(null)}>
          <div className="library-action-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="library-action-sheet-item" type="button" onClick={() => setActionTarget(null)}>分享</button>
            <button className="library-action-sheet-item" type="button" onClick={() => setActionTarget(null)}>重命名</button>
            <button className="library-action-sheet-item" type="button" onClick={() => setActionTarget(null)}>下载</button>
            <button className="library-action-sheet-item" type="button" onClick={() => setActionTarget(null)}>收藏</button>
            <button className="library-action-sheet-item" type="button" onClick={() => setActionTarget(null)}>更多操作</button>
            <button className="library-action-sheet-item danger" type="button" onClick={() => setActionTarget(null)}>删除</button>
            <div className="library-action-sheet-gap" />
            <button className="library-action-sheet-item cancel" type="button" onClick={() => setActionTarget(null)}>取消</button>
          </div>
        </div>
      )}
    </div>
  )
}
