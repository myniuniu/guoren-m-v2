import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
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

type LibraryPathItem = {
  key: string
  folderId: string | null
  label: string
  current: boolean
  clickable: boolean
}

const initialLibraryEntries: LibraryEntry[] = [
  { id: 'p-folder-1', name: '教育信息化资料库', type: 'folder', scope: 'personal', parentId: null, updatedAt: '今天 09:18', owner: '我', starred: true, shared: false, tags: ['课程', '教研'] },
  { id: 'p-folder-2', name: '人工智能-教育', type: 'folder', scope: 'personal', parentId: null, updatedAt: '昨天 17:36', owner: '我', starred: true, shared: true, tags: ['AI', '课程'] },
  { id: 'p-folder-3', name: '模板作品集', type: 'folder', scope: 'personal', parentId: null, updatedAt: '06-01 12:08', owner: '我', starred: false, shared: false, tags: ['教研'] },
  { id: 'p-file-1', name: 'AI 自动化案例清单.pdf', type: 'pdf', scope: 'personal', parentId: null, updatedAt: '05-31 19:24', owner: '我', size: '2.3 MB', starred: true, shared: true, tags: ['AI'] },
  { id: 'p-file-2', name: '课堂评价指标库.xlsx', type: 'sheet', scope: 'personal', parentId: null, updatedAt: '05-30 15:10', owner: '我', size: '348 KB', starred: false, shared: false, tags: ['课程', '教研'] },
  { id: 'p-file-3', name: '果仁产品介绍.pptx', type: 'ppt', scope: 'personal', parentId: null, updatedAt: '05-28 09:05', owner: '我', size: '5.1 MB', starred: false, shared: true, tags: ['AI'] },
  { id: 'p-folder-2-folder-1', name: '课程智能体实验', type: 'folder', scope: 'personal', parentId: 'p-folder-2', updatedAt: '昨天 16:08', owner: '我', starred: true, shared: false, tags: ['AI', '课程'] },
  { id: 'p-folder-2-folder-2', name: '教师助手样例', type: 'folder', scope: 'personal', parentId: 'p-folder-2', updatedAt: '昨天 15:57', owner: '我', starred: false, shared: false, tags: ['AI'] },
  { id: 'p-folder-2-folder-1-folder-1', name: '多模态课堂观察', type: 'folder', scope: 'personal', parentId: 'p-folder-2-folder-1', updatedAt: '昨天 15:42', owner: '我', starred: false, shared: false, tags: ['AI', '课程'] },
  { id: 'p-folder-2-folder-1-folder-2', name: '问答助手测评', type: 'folder', scope: 'personal', parentId: 'p-folder-2-folder-1', updatedAt: '昨天 15:28', owner: '我', starred: false, shared: false, tags: ['AI'] },
  { id: 'p-folder-2-folder-1-folder-1-folder-1', name: '2026 春季试点', type: 'folder', scope: 'personal', parentId: 'p-folder-2-folder-1-folder-1', updatedAt: '昨天 15:18', owner: '我', starred: false, shared: false, tags: ['AI'] },
  { id: 'p-folder-2-folder-1-folder-1-folder-2', name: '2026 秋季回收', type: 'folder', scope: 'personal', parentId: 'p-folder-2-folder-1-folder-1', updatedAt: '昨天 14:56', owner: '我', starred: false, shared: false, tags: ['AI'] },
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

const addMaterialSections = [
  {
    title: '从应用中选择',
    items: [
      { key: 'lucky', label: 'Lucky', tone: 'orange', icon: 'gift' },
      { key: 'form', label: '表单', tone: 'blue', icon: 'form' },
      { key: 'bilibili', label: 'bilibili', tone: 'pink', icon: 'play' },
    ],
  },
  {
    title: '任务资源',
    items: [
      { key: 'task', label: '实训任务', tone: 'green', icon: 'flask' },
    ],
  },
  {
    title: '其它方式',
    items: [
      { key: 'clip', label: '网页剪存', tone: 'indigo', icon: 'clip' },
      { key: 'paste', label: '粘贴文本', tone: 'slate', icon: 'copy' },
      { key: 'whiteboard', label: '白板', tone: 'purple', icon: 'image' },
      { key: 'note', label: '笔记', tone: 'blue', icon: 'note' },
    ],
  },
] as const

function buildFolderPath(folderId: string, entries: LibraryEntry[]) {
  const path: string[] = []
  const visited = new Set<string>()
  let current = entries.find((item) => item.id === folderId && item.type === 'folder') ?? null

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    path.unshift(current.id)
    const parentId = current.parentId
    if (!parentId) break
    current = entries.find((item) => item.id === parentId && item.type === 'folder') ?? null
  }

  return path
}

function formatLibraryNow() {
  const now = new Date()
  const hours = `${now.getHours()}`.padStart(2, '0')
  const minutes = `${now.getMinutes()}`.padStart(2, '0')
  return `今天 ${hours}:${minutes}`
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}

function inferLibraryEntryType(fileName: string): LibraryEntryType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'doc'
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'ppt'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image'

  return 'doc'
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function UploadTrayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M4 15.5v2A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-2" />
    </svg>
  )
}

function MaterialShortcutIcon({
  icon,
}: {
  icon: (typeof addMaterialSections)[number]['items'][number]['icon']
}) {
  if (icon === 'gift') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C10.2 2 12 7 12 7Z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13.8 2 12 7 12 7Z" />
      </svg>
    )
  }

  if (icon === 'form') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M21 3 10 14" />
        <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
      </svg>
    )
  }

  if (icon === 'play') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7 16 12l7 5V7Z" />
        <rect x="1" y="5" width="15" height="14" rx="3" />
      </svg>
    )
  }

  if (icon === 'flask') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v7.3L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.3V2" />
        <path d="M8.5 2h7" />
        <path d="M7 15h10" />
      </svg>
    )
  }

  if (icon === 'clip') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6" />
        <path d="m15 18 3-3a4.2 4.2 0 0 0-6-6l-7 7a3 3 0 1 0 4.3 4.2L16 13" />
      </svg>
    )
  }

  if (icon === 'copy') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    )
  }

  if (icon === 'image') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.4" />
        <path d="m21 16-4.2-4.2a1.6 1.6 0 0 0-2.3 0L7 19" />
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
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

function NewFolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5C3 6.12 4.12 5 5.5 5H9l1.8 2H18.5C19.88 7 21 8.12 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <path d="M16.5 11.5v5" />
      <path d="M14 14h5" />
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

function LibraryFilePreview({
  file,
  onBack,
  pathItems,
  onJumpToFolder,
}: {
  file: LibraryEntry
  onBack: () => void
  pathItems: LibraryPathItem[]
  onJumpToFolder: (folderId: string | null) => void
}) {
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
              <div className="library-file-preview-path" data-page-swipe-ignore="true">
                {pathItems.map((item, index) => (
                  <div className="library-file-preview-path-segment" key={item.key}>
                    {item.clickable ? (
                      <button
                        className="library-file-preview-path-btn"
                        type="button"
                        onClick={() => onJumpToFolder(item.folderId)}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span className={`library-file-preview-path-text ${item.current ? 'is-current' : ''}`}>{item.label}</span>
                    )}
                    {index < pathItems.length - 1 ? <span className="library-file-preview-path-separator">/</span> : null}
                  </div>
                ))}
              </div>
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
  const [entries, setEntries] = useState<LibraryEntry[]>(() => initialLibraryEntries)
  const [scope, setScope] = useState<LibraryScope>('personal')
  const [folderPath, setFolderPath] = useState<string[]>([])
  const [selectedFilter, setSelectedFilter] = useState<SidebarFilter>('all')
  const [selectedOrgSpace, setSelectedOrgSpace] = useState('果仁集团')
  const [keyword, setKeyword] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false)
  const [isAddMaterialDragActive, setIsAddMaterialDragActive] = useState(false)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showOrgSpaceSheet, setShowOrgSpaceSheet] = useState(false)
  const [showCreateFolderSheet, setShowCreateFolderSheet] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderError, setNewFolderError] = useState('')
  const [previewFile, setPreviewFile] = useState<LibraryEntry | null>(null)
  const [actionTarget, setActionTarget] = useState<LibraryEntry | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const currentFolderId = folderPath[folderPath.length - 1] ?? null

  const rootPathLabel = scope === 'personal' ? '个人资料库' : selectedOrgSpace
  const folderPathEntries = useMemo(
    () =>
      folderPath
        .map((id) => entries.find((item) => item.id === id && item.type === 'folder') ?? null)
        .filter((item): item is LibraryEntry => item !== null),
    [entries, folderPath]
  )
  const currentFolder = useMemo(
    () => entries.find((item) => item.id === currentFolderId) ?? null,
    [currentFolderId, entries]
  )

  const visibleItems = useMemo(
    () =>
      entries.filter((item) => {
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
    [entries, scope, currentFolderId, keyword, selectedFilter, selectedOrgSpace]
  )

  const currentTitle = currentFolder ? currentFolder.name : scope === 'personal' ? '个人资料库' : '组织资料库'
  const pathItems = useMemo<LibraryPathItem[]>(
    () => [
      {
        key: 'root',
        folderId: null,
        label: rootPathLabel,
        current: folderPathEntries.length === 0,
        clickable: folderPathEntries.length > 0,
      },
      ...folderPathEntries.map((entry, index) => ({
        key: entry.id,
        folderId: entry.id,
        label: entry.name,
        current: index === folderPathEntries.length - 1,
        clickable: index !== folderPathEntries.length - 1,
      })),
    ],
    [folderPathEntries, rootPathLabel]
  )
  const previewPathItems = useMemo<LibraryPathItem[]>(
    () =>
      previewFile
        ? [
            ...pathItems.map((item) => ({ ...item, clickable: true })),
            {
              key: previewFile.id,
              folderId: null,
              label: previewFile.name,
              current: true,
              clickable: false,
            },
          ]
        : pathItems,
    [pathItems, previewFile]
  )
  const showHeaderPath = pathItems.length > 1
  const currentLocationLabel = pathItems.map((item) => item.label).join(' / ')
  useEffect(() => {
    if (!folderInputRef.current) {
      return
    }

    folderInputRef.current.setAttribute('webkitdirectory', '')
    folderInputRef.current.setAttribute('directory', '')
  }, [])

  const handleJumpToFolder = (folderId: string | null) => {
    setPreviewFile(null)
    if (folderId === null) {
      setFolderPath([])
      return
    }

    setFolderPath(buildFolderPath(folderId, entries))
  }
  const handleInternalBack = () => {
    if (previewFile) {
      setPreviewFile(null)
      return
    }

    setFolderPath((current) => current.slice(0, -1))
  }
  const handleToggleSearch = () => {
    if (showSearch) {
      setShowSearch(false)
      setKeyword('')
      return
    }

    setShowSearch(true)
  }
  const closeCreateFolderSheet = () => {
    setShowCreateFolderSheet(false)
    setNewFolderName('')
    setNewFolderError('')
  }
  const closeAddMaterialDialog = () => {
    setShowAddMaterialDialog(false)
    setIsAddMaterialDragActive(false)
  }
  const appendEntriesToLibrary = (nextEntries: LibraryEntry[]) => {
    if (nextEntries.length === 0) {
      return
    }

    setEntries((current) => [...nextEntries, ...current])
    setSelectedFilter('all')
    setKeyword('')
    closeAddMaterialDialog()
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
  const buildImportedFileEntries = (files: File[], parentId: string | null) =>
    files.map((file, index) => ({
      id: `file-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      type: inferLibraryEntryType(file.name),
      scope,
      orgSpace: scope === 'org' ? selectedOrgSpace : undefined,
      parentId,
      updatedAt: formatLibraryNow(),
      owner: '我',
      size: formatFileSize(file.size),
      starred: false,
      shared: false,
      tags: [],
    }))
  const buildImportedFolderEntries = (files: File[]) => {
    const stamp = Date.now()
    const nextEntries: LibraryEntry[] = []
    const folderIdMap = new Map<string, string>()

    files.forEach((file, index) => {
      const relativePath = file.webkitRelativePath || file.name
      const segments = relativePath.split('/').filter(Boolean)

      if (segments.length === 0) {
        return
      }

      const fileName = segments.pop() ?? file.name
      let parentId = currentFolderId
      let currentPath = ''

      segments.forEach((segment) => {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment
        const cachedFolderId = folderIdMap.get(currentPath)

        if (cachedFolderId) {
          parentId = cachedFolderId
          return
        }

        const folderId = `folder-import-${stamp}-${folderIdMap.size}-${Math.random().toString(36).slice(2, 6)}`
        folderIdMap.set(currentPath, folderId)
        nextEntries.push({
          id: folderId,
          name: segment,
          type: 'folder',
          scope,
          orgSpace: scope === 'org' ? selectedOrgSpace : undefined,
          parentId,
          updatedAt: formatLibraryNow(),
          owner: '我',
          starred: false,
          shared: false,
          tags: [],
        })
        parentId = folderId
      })

      nextEntries.push({
        id: `file-import-${stamp}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        name: fileName,
        type: inferLibraryEntryType(fileName),
        scope,
        orgSpace: scope === 'org' ? selectedOrgSpace : undefined,
        parentId,
        updatedAt: formatLibraryNow(),
        owner: '我',
        size: formatFileSize(file.size),
        starred: false,
        shared: false,
        tags: [],
      })
    })

    return nextEntries
  }
  const handleCreateFolder = () => {
    const nextName = newFolderName.trim()

    if (!nextName) {
      setNewFolderError('请输入文件夹名称')
      return
    }

    const hasDuplicate = entries.some((item) => {
      if (item.parentId !== currentFolderId) return false
      if (item.scope !== scope) return false
      if (scope === 'org' && item.orgSpace !== selectedOrgSpace) return false
      return item.name.trim() === nextName
    })

    if (hasDuplicate) {
      setNewFolderError('当前目录下已存在同名资料')
      return
    }

    const newEntry: LibraryEntry = {
      id: `folder-${Date.now()}`,
      name: nextName,
      type: 'folder',
      scope,
      orgSpace: scope === 'org' ? selectedOrgSpace : undefined,
      parentId: currentFolderId,
      updatedAt: formatLibraryNow(),
      owner: '我',
      starred: false,
      shared: false,
      tags: [],
    }

    setEntries((current) => [newEntry, ...current])
    setSelectedFilter('all')
    setKeyword('')
    closeCreateFolderSheet()
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
  const handleOpenAddMaterial = () => {
    setShowAddMaterialDialog(true)
  }
  const handleOpenMaterialFiles = () => {
    uploadInputRef.current?.click()
  }
  const handleOpenMaterialFolder = () => {
    folderInputRef.current?.click()
  }
  const handleMaterialFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    appendEntriesToLibrary(buildImportedFileEntries(files, currentFolderId))
    event.target.value = ''
  }
  const handleMaterialFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    appendEntriesToLibrary(buildImportedFolderEntries(files))
    event.target.value = ''
  }
  const handleAddMaterialDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isAddMaterialDragActive) {
      setIsAddMaterialDragActive(true)
    }
  }
  const handleAddMaterialDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const relatedTarget = event.relatedTarget as Node | null
    if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
      setIsAddMaterialDragActive(false)
    }
  }
  const handleAddMaterialDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsAddMaterialDragActive(false)
    const files = Array.from(event.dataTransfer.files ?? [])

    if (files.length === 0) {
      return
    }

    appendEntriesToLibrary(buildImportedFileEntries(files, currentFolderId))
  }

  if (previewFile) {
    return (
      <LibraryFilePreview
        file={previewFile}
        onBack={handleInternalBack}
        pathItems={previewPathItems}
        onJumpToFolder={handleJumpToFolder}
      />
    )
  }

  const handleScopeChange = (nextScope: LibraryScope) => {
    setScope(nextScope)
    setFolderPath([])
    setSelectedFilter('all')
    setKeyword('')
    setShowSearch(false)
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
            <div className={`library-title ${showHeaderPath ? 'is-path' : ''}`}>
              {showHeaderPath ? (
                <div className="library-title-path" data-page-swipe-ignore="true">
                  {pathItems.map((item, index) => (
                    <div className="library-title-path-segment" key={item.key}>
                      {item.clickable ? (
                        <button
                          className="library-title-path-btn"
                          type="button"
                          onClick={() => handleJumpToFolder(item.folderId)}
                        >
                          {item.label}
                        </button>
                      ) : (
                        <span className={`library-title-path-text ${item.current ? 'is-current' : ''}`}>{item.label}</span>
                      )}
                      {index < pathItems.length - 1 ? <span className="library-title-path-separator">/</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                currentTitle
              )}
            </div>
            <div className="library-subtitle">{visibleItems.length} 项内容</div>
          </div>
          <div className="library-nav-actions">
            <button
              className="library-icon-btn"
              type="button"
              onClick={() => {
                setShowCreateFolderSheet(true)
                setNewFolderName('')
                setNewFolderError('')
              }}
              aria-label="新建文件夹"
            >
              <NewFolderIcon />
            </button>
            <button
              className={`library-icon-btn ${showSearch ? 'is-active' : ''}`}
              type="button"
              onClick={handleToggleSearch}
              aria-label="搜索"
            >
              <SearchIcon />
            </button>
            <button
              className="library-icon-btn"
              type="button"
              onClick={() => setShowFilterSheet(true)}
              aria-label="收藏与标签"
            >
              <FilterIcon />
            </button>
          </div>
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

        {showSearch && (
          <div className="library-search-inline" data-page-swipe-ignore="true">
            <SearchIcon />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索资料名称"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="library-content">
        <button className="library-add-material" type="button" onClick={handleOpenAddMaterial}>
          <PlusIcon />
          <span>添加资料</span>
        </button>
        <input
          ref={uploadInputRef}
          className="library-file-input"
          type="file"
          multiple
          onChange={handleMaterialFileChange}
        />
        <input
          ref={folderInputRef}
          className="library-file-input"
          type="file"
          multiple
          onChange={handleMaterialFolderChange}
        />
        <div className="library-list" ref={listRef}>
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

      {showAddMaterialDialog && (
        <div className="library-add-dialog-overlay" onClick={closeAddMaterialDialog}>
          <div className="library-add-dialog" onClick={(e) => e.stopPropagation()}>
            <div
              className={`library-add-dialog-dropzone ${isAddMaterialDragActive ? 'is-dragover' : ''}`}
              onDragOver={handleAddMaterialDragOver}
              onDragEnter={handleAddMaterialDragOver}
              onDragLeave={handleAddMaterialDragLeave}
              onDrop={handleAddMaterialDrop}
            >
              <button className="library-add-dialog-close" type="button" onClick={closeAddMaterialDialog} aria-label="关闭">
                <CloseIcon />
              </button>
              <div className="library-add-dialog-dropzone-title">上传文件到资料库</div>
              <div className="library-add-dialog-dropzone-desc">
                支持上传文档、图片、音视频、压缩包等资料，也可以直接导入整个文件夹
              </div>
              <div className="library-add-dialog-upload-row">
                <div className="library-add-dialog-upload-visual">
                  <UploadTrayIcon />
                </div>
                <button className="library-add-dialog-upload-button" type="button" onClick={handleOpenMaterialFiles}>
                  <UploadTrayIcon />
                  <span>选择文件上传</span>
                </button>
              </div>
              <button className="library-add-dialog-folder-link" type="button" onClick={handleOpenMaterialFolder}>
                选择文件夹
              </button>
            </div>

            <div className="library-add-dialog-sections">
              {addMaterialSections.map((section) => (
                <div className="library-add-dialog-section" key={section.title}>
                  <div className="library-add-dialog-section-title">{section.title}</div>
                  <div className="library-add-dialog-chip-list">
                    {section.items.map((item) => (
                      <div className="library-add-dialog-chip" key={item.key}>
                        <span className={`library-add-dialog-chip-icon is-${item.tone}`}>
                          <MaterialShortcutIcon icon={item.icon} />
                        </span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateFolderSheet && (
        <div className="library-filter-sheet-overlay" onClick={closeCreateFolderSheet}>
          <div className="library-filter-sheet library-create-folder-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="library-filter-sheet-handle" />
            <div className="library-filter-sheet-title">新建文件夹</div>
            <div className="library-create-folder-location">保存到：{currentLocationLabel}</div>
            <div className="library-create-folder-field">
              <label className="library-create-folder-label" htmlFor="library-new-folder-name">
                文件夹名称
              </label>
              <input
                id="library-new-folder-name"
                className="library-create-folder-input"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value)
                  if (newFolderError) {
                    setNewFolderError('')
                  }
                }}
                placeholder="请输入文件夹名称"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateFolder()
                  }
                }}
              />
              {newFolderError ? <div className="library-create-folder-error">{newFolderError}</div> : null}
            </div>
            <div className="library-create-folder-actions">
              <button className="library-create-folder-action secondary" type="button" onClick={closeCreateFolderSheet}>
                取消
              </button>
              <button className="library-create-folder-action primary" type="button" onClick={handleCreateFolder}>
                创建
              </button>
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
