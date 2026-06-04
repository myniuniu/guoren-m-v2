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
      { id: 't3', title: '飞书 aily 集成对接', dueDate: '6月3日 截止', dueColor: '#FF8A34', assignee: '我', assigneeColor: '#7d8cff', done: false },
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

const groupOptions = taskGroups.map(g => ({ id: g.id, name: g.name }))

function AddTaskSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (task: TaskItem, groupId: string) => void }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('6月6日')
  const [assignee, setAssignee] = useState('我')
  const [assigneeColor, setAssigneeColor] = useState('#7d8cff')
  const [selectedGroup, setSelectedGroup] = useState('g2')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)
  const [showGroupPicker, setShowGroupPicker] = useState(false)
  const [showChecklistPicker, setShowChecklistPicker] = useState(false)
  const [selectedChecklists, setSelectedChecklists] = useState<Set<string>>(new Set())
  const [checklistSearch, setChecklistSearch] = useState('')

  const dueDateOptions = ['今天', '明天', '后天', '6月6日', '6月7日', '6月8日', '下周一', '无截止日期']
  const assigneeOptions = [
    { name: '我', color: '#7d8cff' },
    { name: '张洪磊', color: '#7d8cff' },
    { name: 'jinlf', color: '#ff8b8b' },
    { name: 'guoren-team', color: '#3CC2A3' },
  ]

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

  const handleSend = () => {
    if (!title.trim()) return
    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      dueDate: dueDate === '无截止日期' ? '' : `${dueDate} 截止`,
      dueColor: '#999',
      assignee,
      assigneeColor,
      done: false,
    }
    onAdd(newTask, selectedGroup)
    onClose()
  }

  return (
    <div className="add-task-page">
      {/* Top nav bar */}
      <div className="add-task-nav">
        <button className="add-task-nav-back" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="add-task-nav-title">添加任务</span>
      </div>

      {/* Group context header */}
      <div className="add-task-group-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#4A7CFF">
          <path d="M3 7.5c0-1.1.9-2 2-2h3.1c.54 0 1.05.26 1.36.69l1.03 1.42c.3.42.8.67 1.31.67h4.19c1.1 0 2 .9 2 2v6.22c0 1.1-.9 2-2 2H5.5c-1.1 0-2-.9-2-2z" />
        </svg>
        <span className="add-task-group-header-name">
          {groupOptions.find(g => g.id === selectedGroup)?.name}
        </span>
      </div>

      {/* Form body */}
      <div className="add-task-form">
        {/* Task title input */}
        <div className="add-task-input-block">
          <input
            className="add-task-title-input"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="任务标题"
            autoFocus
          />
        </div>

        {/* 截止日期 */}
        <div className="add-task-field-row" onClick={() => setShowDatePicker(true)}>
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#4A7CFF" stroke="none" />
              <rect x="14" y="13" width="3" height="3" rx="0.5" fill="none" stroke="#4A7CFF" strokeWidth="0.8" />
            </svg>
          </div>
          <span className="add-task-field-label">截止日期</span>
          <span className="add-task-field-value">{dueDate}</span>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* 负责人 */}
        <div className="add-task-field-row" onClick={() => setShowAssigneePicker(true)}>
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </div>
          <span className="add-task-field-label">负责人</span>
          <div className="add-task-field-assignee-wrap">
            <div className="add-task-field-assignee-avatar" style={{ background: assigneeColor }}>
              {assignee.charAt(0)}
            </div>
            <span className="add-task-field-assignee-name">{assignee}</span>
          </div>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* 分组 */}
        <div className="add-task-field-row" onClick={() => setShowGroupPicker(true)}>
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 7.5c0-1.1.9-2 2-2h3.1c.54 0 1.05.26 1.36.69l1.03 1.42c.3.42.8.67 1.31.67h4.19c1.1 0 2 .9 2 2v6.22c0 1.1-.9 2-2 2H5.5c-1.1 0-2-.9-2-2z" fill="#4A7CFF" />
              <path d="M3 9.5h15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="add-task-field-label">分组</span>
          <span className="add-task-field-value">{groupOptions.find(g => g.id === selectedGroup)?.name}</span>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* 添加描述 */}
        <div className="add-task-field-row">
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="10" x2="20" y2="10" />
              <line x1="4" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <span className="add-task-field-label">添加描述</span>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* 添加至任务清单 */}
        <div className="add-task-field-row" onClick={() => setShowChecklistPicker(true)}>
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
            </svg>
          </div>
          <span className="add-task-field-label">添加至任务清单</span>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* 添加子任务 */}
        <div className="add-task-field-row">
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <span className="add-task-field-label">添加子任务</span>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* 添加附件 */}
        <div className="add-task-field-row">
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </div>
          <span className="add-task-field-label">添加附件</span>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* 添加关注人 */}
        <div className="add-task-field-row">
          <div className="add-task-field-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span className="add-task-field-label">添加关注人</span>
          <svg className="add-task-field-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* 发送 button */}
      <div className="add-task-bottom">
        <button className={`add-task-send-btn ${title.trim() ? 'is-active' : ''}`} onClick={handleSend}>
          发送
        </button>
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
                  <div className="add-task-picker-avatar" style={{ background: opt.color }}>{opt.name.charAt(0)}</div>
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