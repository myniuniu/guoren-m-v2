import { useState } from 'react'
import './index.css'

type TaskTab = 'mine' | 'followed'
type TaskGroup = {
  id: string
  name: string
  tasks: TaskItem[]
}

type TaskItem = {
  id: string
  title: string
  dueDate: string
  dueColor: string
  assignee: string
  assigneeColor: string
  done: boolean
}

const taskGroups: TaskGroup[] = [
  {
    id: 'g1',
    name: '需求',
    tasks: [
      { id: 't1', title: 'AI 课堂助手上线', dueDate: '昨天 截止', dueColor: '#FF5A5F', assignee: '张洪磊', assigneeColor: '#7d8cff', done: false },
      { id: 't2', title: '多维表格批量导入优化', dueDate: '6月1日 截止', dueColor: '#FF5A5F', assignee: 'jinlf', assigneeColor: '#ff8b8b', done: false },
      { id: 't3', title: 'lucky 集成对接', dueDate: '6月3日 截止', dueColor: '#FF8A34', assignee: '我', assigneeColor: '#7d8cff', done: false },
    ],
  },
  {
    id: 'g2',
    name: '默认分组 89',
    tasks: [
      { id: 't4', title: '审核教研模板提交', dueDate: '6月4日 截止', dueColor: '#4A7CFF', assignee: '我', assigneeColor: '#7d8cff', done: false },
      { id: 't5', title: '完成课件评审打分', dueDate: '6月5日 截止', dueColor: '#999', assignee: 'jinlf', assigneeColor: '#ff8b8b', done: false },
      { id: 't6', title: '整理知识库目录结构', dueDate: '6月6日 截止', dueColor: '#999', assignee: 'guoren-team', assigneeColor: '#3CC2A3', done: false },
    ],
  },
]

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function AddTaskIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function GroupMoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#B0B0B0">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronDownIcon({ color = '#8f949e' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ComposerMenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ba0a8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="6.5" x2="19" y2="6.5" />
      <line x1="5" y1="12" x2="14" y2="12" />
      <line x1="5" y1="17.5" x2="19" y2="17.5" />
    </svg>
  )
}

function ComposerPersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ba0a8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.75" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function ComposerTodayIcon({ active }: { active: boolean }) {
  const tone = active ? '#2f6bff' : '#7f8792'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.4" />
      <line x1="4.5" y1="9.5" x2="19.5" y2="9.5" />
      <line x1="9" y1="3.5" x2="9" y2="6.2" />
      <line x1="15" y1="3.5" x2="15" y2="6.2" />
      <rect x="8.1" y="12" width="7.8" height="5.2" rx="1.1" fill={active ? '#2f6bff' : 'none'} stroke={tone} />
    </svg>
  )
}

function ComposerTomorrowIcon({ active }: { active: boolean }) {
  const tone = active ? '#31b79d' : '#7f8792'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.4" />
      <line x1="4.5" y1="9.5" x2="19.5" y2="9.5" />
      <line x1="9" y1="3.5" x2="9" y2="6.2" />
      <line x1="15" y1="3.5" x2="15" y2="6.2" />
      <path d="M8.5 14.5h7" />
      <path d="m12 12.2 3 2.3-3 2.3" />
    </svg>
  )
}

function ComposerOtherDateIcon({ active }: { active: boolean }) {
  const tone = active ? '#5a6270' : '#7f8792'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.4" />
      <line x1="4.5" y1="9.5" x2="19.5" y2="9.5" />
      <line x1="9" y1="3.5" x2="9" y2="6.2" />
      <line x1="15" y1="3.5" x2="15" y2="6.2" />
      <rect x="8.3" y="12.2" width="7.4" height="4.9" rx="1.1" fill={active ? '#5a6270' : 'none'} stroke={tone} />
    </svg>
  )
}

function ComposerChecklistIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ba0a8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4.5" width="14" height="17" rx="2.2" />
      <path d="m9.5 8.7 1.8 1.8 3.6-3.5" />
    </svg>
  )
}

function ComposerSubtaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ba0a8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6.5h9" />
      <path d="M10 12h9" />
      <path d="M10 17.5h9" />
      <rect x="4.5" y="5" width="2.8" height="2.8" rx="0.8" />
      <rect x="4.5" y="10.5" width="2.8" height="2.8" rx="0.8" />
      <rect x="4.5" y="16" width="2.8" height="2.8" rx="0.8" />
    </svg>
  )
}

function ComposerAttachmentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ba0a8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 10.8-8.2 8.2a5.2 5.2 0 1 1-7.4-7.4l8.4-8.4a3.5 3.5 0 0 1 5 5l-8.3 8.3a1.9 1.9 0 0 1-2.7-2.7l7.5-7.5" />
    </svg>
  )
}

function ComposerFollowerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ba0a8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 4.5h9a1.8 1.8 0 0 1 1.8 1.8v13.2l-6.3-3.4-6.3 3.4V6.3a1.8 1.8 0 0 1 1.8-1.8Z" />
      <path d="M12 8.1v4.8" />
      <path d="M9.6 10.5H14.4" />
    </svg>
  )
}

function ComposerCloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3e434b" strokeWidth="2.1" strokeLinecap="round">
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

function KeyboardChevronIcon({ direction }: { direction: 'up' | 'down' }) {
  const rotation = direction === 'up' ? 'rotate(180 12 12)' : undefined
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m6 9 6 6 6-6" stroke="#c4c8cf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform={rotation} />
    </svg>
  )
}

type AssigneeOption = {
  name: string
  color: string
  avatar?: string
}

const formatGroupLabel = (name: string) => name.replace(/\s+\d+$/, '')

const groupOptions = taskGroups.map(g => ({ id: g.id, name: formatGroupLabel(g.name) }))

const assigneeOptions: AssigneeOption[] = [
  { name: '我', color: '#7d8cff' },
  { name: '张洪磊', color: '#7d8cff', avatar: '/assets/果仁头像-手机.png' },
  { name: 'jinlf', color: '#ff8b8b' },
  { name: 'guoren-team', color: '#3CC2A3' },
]

const dueDateOptions = ['今天', '明天', '后天', '6月6日', '6月7日', '6月8日', '下周一', '无截止日期']

function renderAssigneeAvatar(assignee: AssigneeOption | undefined, name: string, color: string, className: string) {
  if (assignee?.avatar) {
    return <img className={className} src={assignee.avatar} alt={name} />
  }

  return (
    <div className={className} style={{ background: color }}>
      {(name || '未').charAt(0)}
    </div>
  )
}

function AddTaskSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (task: TaskItem, groupId: string) => void }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('今天')
  const [assignee, setAssignee] = useState('张洪磊')
  const [assigneeColor, setAssigneeColor] = useState('#7d8cff')
  const [selectedGroup, setSelectedGroup] = useState('g2')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)
  const [showGroupPicker, setShowGroupPicker] = useState(false)
  const [showChecklistPicker, setShowChecklistPicker] = useState(false)
  const [selectedChecklists, setSelectedChecklists] = useState<Set<string>>(new Set())
  const [checklistSearch, setChecklistSearch] = useState('')
  const [showSubtaskPicker, setShowSubtaskPicker] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; done: boolean }>>([])

  const checklistOptions = [
    { id: 'cl1', name: 'Q2 季度目标追踪', color: '#FF8A34' },
    { id: 'cl2', name: '产品发布清单', color: '#4A7CFF' },
    { id: 'cl3', name: '日常待办', color: '#3CC2A3' },
    { id: 'cl4', name: '团队周会跟进', color: '#7B49F1' },
    { id: 'cl5', name: '上线验收清单', color: '#FF5A5F' },
    { id: 'cl6', name: '教研活动准备', color: '#F5B400' },
  ]

  const toggleChecklist = (id: string) => {
    setSelectedChecklists(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredChecklists = checklistOptions.filter(c =>
    !checklistSearch.trim() || c.name.toLowerCase().includes(checklistSearch.trim().toLowerCase())
  )

  const activeAssignee = assigneeOptions.find(opt => opt.name === assignee)
  const activeGroupName = groupOptions.find(g => g.id === selectedGroup)?.name ?? '默认分组'
  const hasCustomDate = dueDate !== '今天' && dueDate !== '明天'
  const customDateLabel = hasCustomDate && dueDate !== '无截止日期' ? dueDate : '其他时间'

  const blurActiveField = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const handleSend = () => {
    if (!title.trim()) return
    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      dueDate: dueDate === '无截止日期' ? '' : `${dueDate} 截止`,
      dueColor: dueDate === '今天' ? '#4A7CFF' : dueDate === '明天' ? '#3CC2A3' : '#999',
      assignee: assignee || '未分配',
      assigneeColor: assignee ? assigneeColor : '#c3c9d5',
      done: false,
    }
    onAdd(newTask, selectedGroup)
    onClose()
  }

  return (
    <div className="add-task-page">
      <div className="add-task-page-backdrop" onClick={onClose} />

      <div className="add-task-sheet-shell">
        <div className="add-task-sheet-shadow" />
        <div className="add-task-sheet-card">
          <div className="add-task-sheet-scroll">
            <div className="add-task-sheet-topbar">
              <button className="add-task-cancel-btn" onClick={onClose}>取消</button>
            </div>

            <div className="add-task-title-area">
              <input
                className="add-task-title-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="添加任务"
                autoFocus
              />
            </div>

            <div className="add-task-description-row">
              <span className="add-task-inline-icon"><ComposerMenuIcon /></span>
              <span className="add-task-description-text">添加描述</span>
            </div>

            <div className="add-task-assignee-row">
              <div className="add-task-assignee-group">
                <span className="add-task-inline-icon"><ComposerPersonIcon /></span>
                {assignee ? (
                  <div className="add-task-assignee-chip" onClick={() => setShowAssigneePicker(true)}>
                    {renderAssigneeAvatar(activeAssignee, assignee, assigneeColor, 'add-task-assignee-chip-avatar')}
                    <span className="add-task-assignee-chip-name">{assignee}</span>
                    <button
                      type="button"
                      className="add-task-assignee-chip-clear"
                      onClick={e => {
                        e.stopPropagation()
                        setAssignee('')
                        setAssigneeColor('#c3c9d5')
                      }}
                    >
                      <ComposerCloseIcon />
                    </button>
                  </div>
                ) : (
                  <button className="add-task-assignee-placeholder" onClick={() => setShowAssigneePicker(true)}>
                    选择负责人
                  </button>
                )}
              </div>

              <button className="add-task-group-trigger" onClick={() => setShowGroupPicker(true)}>
                <span>{activeGroupName}</span>
                <ChevronDownIcon />
              </button>
            </div>

            <div className="add-task-date-row">
              <button className={`add-task-date-pill ${dueDate === '今天' ? 'is-active is-today' : ''}`} onClick={() => setDueDate('今天')}>
                <ComposerTodayIcon active={dueDate === '今天'} />
                <span>今天</span>
              </button>
              <button className={`add-task-date-pill ${dueDate === '明天' ? 'is-active is-tomorrow' : ''}`} onClick={() => setDueDate('明天')}>
                <ComposerTomorrowIcon active={dueDate === '明天'} />
                <span>明天</span>
              </button>
              <button className={`add-task-date-pill ${hasCustomDate ? 'is-active is-other' : ''}`} onClick={() => setShowDatePicker(true)}>
                <ComposerOtherDateIcon active={hasCustomDate} />
                <span>{customDateLabel}</span>
              </button>
            </div>

            <div className="add-task-option-list">
              <button className="add-task-option-row" onClick={() => setShowChecklistPicker(true)}>
                <span className="add-task-option-icon"><ComposerChecklistIcon /></span>
                <span className="add-task-option-text">添加至任务清单</span>
              </button>

              <button className="add-task-option-row" onClick={() => setShowSubtaskPicker(true)}>
                <span className="add-task-option-icon"><ComposerSubtaskIcon /></span>
                <span className="add-task-option-text">添加子任务</span>
              </button>

              <div className="add-task-option-row">
                <span className="add-task-option-icon"><ComposerAttachmentIcon /></span>
                <span className="add-task-option-text">添加附件</span>
              </div>

              <div className="add-task-option-row">
                <span className="add-task-option-icon"><ComposerFollowerIcon /></span>
                <span className="add-task-option-text">添加关注人</span>
              </div>
            </div>
          </div>

          <div className="add-task-sheet-footer">
            <button className={`add-task-create-btn ${title.trim() ? 'is-active' : ''}`} onClick={handleSend}>
              创建
            </button>
          </div>
        </div>
      </div>

      <div className="add-task-keyboard-bar">
        <div className="add-task-keyboard-nav">
          <button className="add-task-keyboard-btn" onClick={blurActiveField}>
            <KeyboardChevronIcon direction="up" />
          </button>
          <button className="add-task-keyboard-btn" onClick={blurActiveField}>
            <KeyboardChevronIcon direction="down" />
          </button>
        </div>
        <button className="add-task-keyboard-done" onClick={blurActiveField}>完成</button>
      </div>

      {/* Checklist picker overlay */}
      {showChecklistPicker && (
        <div className="add-task-picker-overlay" onClick={() => setShowChecklistPicker(false)}>
          <div className="checklist-picker-panel" onClick={e => e.stopPropagation()}>
            <div className="add-task-picker-handle" />
            <div className="checklist-picker-header">
              <span className="checklist-picker-title">添加至任务清单</span>
              <button className="checklist-picker-confirm" onClick={() => setShowChecklistPicker(false)}>确定</button>
            </div>
            <div className="checklist-picker-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
              <input
                type="text"
                value={checklistSearch}
                onChange={e => setChecklistSearch(e.target.value)}
                placeholder="搜索任务清单"
              />
            </div>
            <div className="checklist-picker-list">
              {filteredChecklists.map(opt => (
                <div
                  key={opt.id}
                  className={`checklist-picker-item ${selectedChecklists.has(opt.id) ? 'is-checked' : ''}`}
                  onClick={() => toggleChecklist(opt.id)}
                >
                  <div className={`checklist-picker-check ${selectedChecklists.has(opt.id) ? 'is-checked' : ''}`}>
                    {selectedChecklists.has(opt.id) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="checklist-picker-item-icon" style={{ background: `${opt.color}18` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M9 11l3 3L22 4" stroke={opt.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" stroke={opt.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="checklist-picker-item-name">{opt.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtask picker overlay */}
      {showSubtaskPicker && (
        <div className="add-task-picker-overlay" onClick={() => setShowSubtaskPicker(false)}>
          <div className="subtask-picker-panel" onClick={e => e.stopPropagation()}>
            <div className="add-task-picker-handle" />
            <div className="subtask-picker-header">
              <span className="subtask-picker-title">添加子任务</span>
              <button className="checklist-picker-confirm" onClick={() => setShowSubtaskPicker(false)}>确定</button>
            </div>

            <div className="subtask-picker-body">
              {/* Input */}
              <div className="subtask-picker-input-row">
                <input
                  className="subtask-picker-input"
                  type="text"
                  value={subtaskInput}
                  onChange={e => setSubtaskInput(e.target.value)}
                  placeholder="子任务标题"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && subtaskInput.trim()) {
                      setSubtasks(prev => [...prev, { id: `st-${Date.now()}`, title: subtaskInput.trim(), done: false }])
                      setSubtaskInput('')
                    }
                  }}
                />
                <button
                  className={`subtask-picker-add-btn ${subtaskInput.trim() ? 'is-active' : ''}`}
                  onClick={() => {
                    if (!subtaskInput.trim()) return
                    setSubtasks(prev => [...prev, { id: `st-${Date.now()}`, title: subtaskInput.trim(), done: false }])
                    setSubtaskInput('')
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subtaskInput.trim() ? '#4A7CFF' : '#bbb'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Subtask list */}
              {subtasks.length > 0 && (
                <div className="subtask-picker-list">
                  {subtasks.map(st => (
                    <div className="subtask-picker-item" key={st.id}>
                      <button
                        className={`subtask-picker-check ${st.done ? 'is-checked' : ''}`}
                        onClick={() => setSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, done: !s.done } : s))}
                      >
                        {st.done && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <span className={`subtask-picker-item-name ${st.done ? 'is-done' : ''}`}>{st.title}</span>
                      <button className="subtask-picker-item-delete" onClick={() => setSubtasks(prev => prev.filter(s => s.id !== st.id))}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add more subtask hint */}
              <div className="subtask-picker-add-more">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>添加子任务</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date picker overlay */}
      {showDatePicker && (
        <div className="add-task-picker-overlay" onClick={() => setShowDatePicker(false)}>
          <div className="add-task-picker-panel" onClick={e => e.stopPropagation()}>
            <div className="add-task-picker-handle" />
            <div className="add-task-picker-title">选择截止日期</div>
            <div className="add-task-picker-list">
              {dueDateOptions.map(opt => (
                <button
                  key={opt}
                  className={`add-task-picker-item ${dueDate === opt ? 'is-active' : ''}`}
                  onClick={() => { setDueDate(opt); setShowDatePicker(false) }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assignee picker overlay */}
      {showAssigneePicker && (
        <div className="add-task-picker-overlay" onClick={() => setShowAssigneePicker(false)}>
          <div className="add-task-picker-panel" onClick={e => e.stopPropagation()}>
            <div className="add-task-picker-handle" />
            <div className="add-task-picker-title">选择负责人</div>
            <div className="add-task-picker-list">
              {assigneeOptions.map(opt => (
                <button
                  key={opt.name}
                  className={`add-task-picker-item ${assignee === opt.name ? 'is-active' : ''}`}
                  onClick={() => { setAssignee(opt.name); setAssigneeColor(opt.color); setShowAssigneePicker(false) }}
                >
                  {renderAssigneeAvatar(opt, opt.name, opt.color, 'add-task-picker-avatar')}
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Group picker overlay */}
      {showGroupPicker && (
        <div className="add-task-picker-overlay" onClick={() => setShowGroupPicker(false)}>
          <div className="add-task-picker-panel" onClick={e => e.stopPropagation()}>
            <div className="add-task-picker-handle" />
            <div className="add-task-picker-title">选择分组</div>
            <div className="add-task-picker-list">
              {groupOptions.map(opt => (
                <button
                  key={opt.id}
                  className={`add-task-picker-item ${selectedGroup === opt.id ? 'is-active' : ''}`}
                  onClick={() => { setSelectedGroup(opt.id); setShowGroupPicker(false) }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TaskPage() {
  const [activeTab, setActiveTab] = useState<TaskTab>('mine')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [tasks, setTasks] = useState(taskGroups)
  const [showAddTask, setShowAddTask] = useState(false)

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const toggleTaskDone = (groupId: string, taskId: string) => {
    setTasks(prev => prev.map(group => {
      if (group.id !== groupId) return group
      return {
        ...group,
        tasks: group.tasks.map(task => {
          if (task.id !== taskId) return task
          return { ...task, done: !task.done }
        }),
      }
    }))
  }

  const handleAddTask = (task: TaskItem, groupId: string) => {
    setTasks(prev => prev.map(group => {
      if (group.id !== groupId) return group
      return { ...group, tasks: [...group.tasks, task] }
    }))
  }

  return (
    <div className="task-page">
      {/* Header */}
      <div className="task-header">
        <div className="task-header-left">
          <div className="task-avatar" />
        </div>
        <div className="task-header-title">任务</div>
        <div className="task-header-right">
          <button className="task-icon-btn"><SearchIcon /></button>
          <button className="task-icon-btn"><SettingsIcon /></button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="task-tabs">
        <button
          className={`task-tab-btn ${activeTab === 'mine' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          我负责的
        </button>
        <button
          className={`task-tab-btn ${activeTab === 'followed' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('followed')}
        >
          我关注的
        </button>
      </div>

      {/* Task list */}
      <div className="task-content">
        {tasks.map(group => {
          const isCollapsed = collapsedGroups.has(group.id)
          return (
            <div className="task-group" key={group.id}>
              <div className="task-group-header" onClick={() => toggleGroup(group.id)}>
                <CollapseIcon open={!isCollapsed} />
                <span className="task-group-name">{group.name}</span>
                <span className="task-group-count">{group.tasks.length}</span>
                <button className="task-group-more"><GroupMoreIcon /></button>
              </div>
              {!isCollapsed && (
                <div className="task-group-tasks">
                  {group.tasks.map(task => (
                    <div className={`task-item ${task.done ? 'is-done' : ''}`} key={task.id}>
                      <button
                        className={`task-check ${task.done ? 'is-checked' : ''}`}
                        onClick={() => toggleTaskDone(group.id, task.id)}
                      >
                        {task.done && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <div className="task-body">
                        <div className="task-title">{task.title}</div>
                        <div className="task-due" style={{ color: task.done ? '#999' : task.dueColor }}>
                          {task.dueDate}
                        </div>
                      </div>
                      <div className="task-assignee" style={{ background: task.assigneeColor }}>
                        {task.assignee.charAt(0)}
                      </div>
                    </div>
                  ))}
                  <div className="task-add" onClick={() => setShowAddTask(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>添加任务</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <button className="task-fab" onClick={() => setShowAddTask(true)}>
        <AddTaskIcon />
      </button>

      {/* Add Task Sheet */}
      {showAddTask && (
        <AddTaskSheet onClose={() => setShowAddTask(false)} onAdd={handleAddTask} />
      )}
    </div>
  )
}
