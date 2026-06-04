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

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<TaskTab>('mine')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [tasks, setTasks] = useState(taskGroups)

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

  return (
    <div className="calendar-page">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-header-left">
          <div className="calendar-avatar" />
        </div>
        <div className="calendar-header-title">任务</div>
        <div className="calendar-header-right">
          <button className="calendar-icon-btn"><SearchIcon /></button>
          <button className="calendar-icon-btn"><SettingsIcon /></button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="calendar-tabs">
        <button
          className={`calendar-tab-btn ${activeTab === 'mine' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          我负责的
        </button>
        <button
          className={`calendar-tab-btn ${activeTab === 'followed' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('followed')}
        >
          我关注的
        </button>
      </div>

      {/* Task list */}
      <div className="calendar-content">
        {tasks.map(group => {
          const isCollapsed = collapsedGroups.has(group.id)
          return (
            <div className="calendar-group" key={group.id}>
              <div className="calendar-group-header" onClick={() => toggleGroup(group.id)}>
                <CollapseIcon open={!isCollapsed} />
                <span className="calendar-group-name">{group.name}</span>
                <span className="calendar-group-count">{group.tasks.length}</span>
                <button className="calendar-group-more"><GroupMoreIcon /></button>
              </div>
              {!isCollapsed && (
                <div className="calendar-group-tasks">
                  {group.tasks.map(task => (
                    <div className={`calendar-task-item ${task.done ? 'is-done' : ''}`} key={task.id}>
                      <button
                        className={`calendar-task-check ${task.done ? 'is-checked' : ''}`}
                        onClick={() => toggleTaskDone(group.id, task.id)}
                      >
                        {task.done && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <div className="calendar-task-body">
                        <div className="calendar-task-title">{task.title}</div>
                        <div className="calendar-task-due" style={{ color: task.done ? '#999' : task.dueColor }}>
                          {task.dueDate}
                        </div>
                      </div>
                      <div className="calendar-task-assignee" style={{ background: task.assigneeColor }}>
                        {task.assignee.charAt(0)}
                      </div>
                    </div>
                  ))}
                  <div className="calendar-add-task">
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
      <button className="calendar-fab">
        <AddTaskIcon />
      </button>
    </div>
  )
}