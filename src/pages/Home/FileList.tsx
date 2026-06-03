interface FileItem {
  id: number
  name: string
  type: 'doc-blue' | 'doc-dark' | 'excel'
  size: string
  date: string
}

const files: FileItem[] = [
  { id: 1, name: '学习大纲：AI驱动的研发模式变革', type: 'doc-blue', size: '52.36KB', date: '05-22 07:20' },
  { id: 2, name: '空间主页', type: 'doc-blue', size: '4.56MB', date: '05-20 09:43' },
  { id: 3, name: '111111111111', type: 'doc-dark', size: '26.27KB', date: '05-19 13:30' },
  { id: 4, name: '无标题页面', type: 'doc-blue', size: '2.92KB', date: '05-18 09:47' },
  { id: 5, name: '中国教育干部网络学院人工智能助手建设方案', type: 'doc-dark', size: '1.09MB', date: '05-17 10:53' },
  { id: 6, name: '无标题页面', type: 'doc-blue', size: '740.00B', date: '05-02 19:14' },
  { id: 7, name: '大赛统计(2)', type: 'excel', size: '10.32MB', date: '04-25 14:23' },
  { id: 8, name: '语音速记_2026-01-23', type: 'doc-blue', size: '3.80KB', date: '04-24 15:34' },
  { id: 9, name: '会议纪要', type: 'doc-dark', size: '', date: '04-24 14:09' },
  { id: 10, name: '课程主页', type: 'doc-blue', size: '', date: '04-20 09:38' },
]

// 蓝色文档图标 - 带折角页面样式
function DocBlueIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="6" y="4" width="28" height="32" rx="3" fill="#E8F0FE" />
      <rect x="8" y="6" width="24" height="28" rx="2" fill="#4A90D9" />
      <path d="M22 6V14H30" fill="#3A7BC8" />
      <path d="M22 6L30 14V6H22Z" fill="#5DA0E8" opacity="0.5" />
      <path d="M13 19H27M13 23H24M13 27H25" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="12" y="10" width="6" height="4" rx="0.5" fill="white" opacity="0.6" />
    </svg>
  )
}

// 深蓝色/黑色文档图标
function DocDarkIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="6" y="4" width="28" height="32" rx="3" fill="#E3EBF6" />
      <rect x="8" y="6" width="24" height="28" rx="2" fill="#3B7DD8" />
      <path d="M22 6V14H30" fill="#2E6AB8" />
      <path d="M22 6L30 14V6H22Z" fill="#5DA0E8" opacity="0.5" />
      <path d="M13 19H27M13 23H22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// Excel/表格图标（绿色）
function ExcelIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="6" y="4" width="28" height="32" rx="3" fill="#E8F5E9" />
      <rect x="8" y="6" width="24" height="28" rx="2" fill="#4CAF50" />
      <path d="M22 6V14H30" fill="#388E3C" />
      <path d="M22 6L30 14V6H22Z" fill="#66BB6A" opacity="0.5" />
      <rect x="12" y="17" width="7" height="4" rx="0.5" fill="white" opacity="0.7" />
      <rect x="21" y="17" width="7" height="4" rx="0.5" fill="white" opacity="0.9" />
      <rect x="12" y="23" width="7" height="4" rx="0.5" fill="white" opacity="0.9" />
      <rect x="21" y="23" width="7" height="4" rx="0.5" fill="white" opacity="0.7" />
    </svg>
  )
}

function FileIcon({ type }: { type: FileItem['type'] }) {
  switch (type) {
    case 'doc-blue':
      return <DocBlueIcon />
    case 'doc-dark':
      return <DocDarkIcon />
    case 'excel':
      return <ExcelIcon />
  }
}

// 竖三点图标
function MoreVertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

export default function FileList() {
  return (
    <div className="file-list">
      {files.map((file) => (
        <div className="file-item" key={file.id}>
          <div className="file-icon">
            <FileIcon type={file.type} />
          </div>
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-meta">
              <span>我</span>
              {file.size && (
                <>
                  <span className="meta-dot">·</span>
                  <span>{file.size}</span>
                </>
              )}
              <span className="meta-dot">·</span>
              <span>{file.date}</span>
              <span className="meta-dot">·</span>
              <span className="meta-icon">👥</span>
            </div>
          </div>
          <div className="file-more">
            <MoreVertIcon />
          </div>
        </div>
      ))}
    </div>
  )
}
