import { useEffect, useRef, useState } from 'react'
import './index.css'

type TaskTab = 'mine' | 'followed'
type TaskDrawerPrimaryKey = TaskTab | 'updates' | 'feishu'
type TaskCollectionKey =
  | 'all'
  | 'created'
  | 'assigned'
  | 'completed'
  | 'updates'
  | 'feishu'
  | 'list-guoren-630'
  | 'list-scenario-training'
  | 'list-guoren-mvp'
  | 'list-ai-training'

type TaskCollectionId = TaskCollectionKey | `custom-${string}`

type TaskDrawerChecklistItem = {
  key: TaskCollectionId
  label: string
}

type TaskDrawerChecklistGroup = {
  id: string
  label: string
  items: TaskDrawerChecklistItem[]
}

type DrawerCreateKind = 'checklist' | 'group'

type TaskAssigneeBadge =
  | {
      kind: 'image'
      name: string
      avatar: string
    }
  | {
      kind: 'text'
      name: string
      text: string
      background: string
      color?: string
    }
  | {
      kind: 'count'
      label: string
    }

type TaskGroup = {
  id: string
  name: string
  countLabel?: string
  showAddRow?: boolean
  showDividerAfter?: boolean
  tasks: TaskItem[]
}

type TaskItem = {
  id: string
  title: string
  done: boolean
  dueDate?: string
  dueColor?: string
  assignees: TaskAssigneeBadge[]
}

type TaskCollectionItem = {
  id: string
  title: string
  done: boolean
  meta: string
  metaIcon?: 'comment' | 'progress'
  metaValue?: string
  assignees: TaskAssigneeBadge[]
}

type TaskCollectionView = {
  label: string
  items: TaskCollectionItem[]
}

type TaskDetailDateChoice = 'today' | 'tomorrow' | 'other'

type TaskDetailSourceRef =
  | {
      kind: 'group'
      groupId: string
    }
  | {
      kind: 'collection'
      collectionKey: TaskCollectionId
    }
  | {
      kind: 'checklist'
      checklistKey: TaskCollectionId
      groupId: string
    }

type TaskDetailState = {
  id: string
  title: string
  done: boolean
  sourceRef: TaskDetailSourceRef
  sourceText: string
  noteLabel: string
  assigneeBadge: TaskAssigneeBadge
  assigneeName: string
  groupName: string
  dateChoice: TaskDetailDateChoice
  commentTime: string
}

type TaskScheduleReminder = 'none' | 'at_due' | '5m_before'

type TaskScheduleSelection = {
  date: Date | null
  hasSpecificTime: boolean
  reminder: TaskScheduleReminder
}

const taskAvatarSrc = '/assets/果仁头像-手机.png'

const createImageBadge = (name: string, avatar = taskAvatarSrc): TaskAssigneeBadge => ({
  kind: 'image',
  name,
  avatar,
})

const createTextBadge = (name: string, text: string, background: string, color = '#fff'): TaskAssigneeBadge => ({
  kind: 'text',
  name,
  text,
  background,
  color,
})

const createCountBadge = (label: string): TaskAssigneeBadge => ({
  kind: 'count',
  label,
})

const dogBadge = createImageBadge('张洪磊')
const qinSongBadge = createTextBadge('秦松', '秦松', 'linear-gradient(135deg, #54b76d 0%, #47a6bf 100%)')
const myBadge = createTextBadge('我', '我', 'linear-gradient(135deg, #5b73ff 0%, #8794ff 100%)')
const plusTwoBadge = createCountBadge('+2')
const linFengBadge = createTextBadge('林峰', '林峰', 'linear-gradient(135deg, #3f71ff 0%, #6287ff 100%)')
const teacherBadge = createTextBadge('教研', '教研', 'linear-gradient(135deg, #8b6a4b 0%, #c39b74 100%)')

const initialTaskViews: Record<TaskTab, TaskGroup[]> = {
  mine: [
    {
      id: 'requirements',
      name: '需求',
      showAddRow: true,
      showDividerAfter: true,
      tasks: [],
    },
    {
      id: 'default',
      name: '默认分组',
      countLabel: '80',
      tasks: [
        { id: 'm-1', title: '检查新的 appld', done: false, assignees: [dogBadge] },
        { id: 'm-2', title: '确认标签是否需相关人员在管理平台维护', done: false, assignees: [dogBadge] },
        { id: 'm-3', title: '创建四月份加班统计表', done: false, assignees: [dogBadge] },
        { id: 'm-4', title: '解决访问问题并指导前端（田宇@果仁 2026-04-01 18:40）', done: false, assignees: [dogBadge] },
        { id: 'm-5', title: 'Ai原生培训原型', done: false, assignees: [dogBadge] },
        { id: 'm-6', title: '下载doc pdf 方案调整', done: false, assignees: [qinSongBadge, plusTwoBadge] },
        { id: 'm-7', title: '来源有些打不开，参考文献是外国网址', done: false, assignees: [qinSongBadge, dogBadge] },
        { id: 'm-8', title: 'deerflow 无法暂停', done: false, assignees: [qinSongBadge, dogBadge] },
        { id: 'm-9', title: '封装为技能（智能体）', done: false, assignees: [dogBadge] },
        { id: 'm-10', title: 'AI生成笔记纳入到课程预处理流程中，作为agent的内置技能（针对课程没有对应ppt的...', done: false, assignees: [] },
      ],
    },
  ],
  followed: [
    {
      id: 'follow-up',
      name: '跟进',
      showAddRow: true,
      showDividerAfter: true,
      tasks: [],
    },
    {
      id: 'followed-default',
      name: '默认分组',
      countLabel: '18',
      tasks: [
        { id: 'f-1', title: '课程案例更新状态同步', done: false, assignees: [qinSongBadge, dogBadge] },
        { id: 'f-2', title: '确认资料库权限同步方案', done: false, assignees: [dogBadge] },
        { id: 'f-3', title: 'AI 应用市场接入排期跟进', done: false, assignees: [myBadge] },
        { id: 'f-4', title: '知识库目录重构评审', done: false, assignees: [qinSongBadge, plusTwoBadge] },
      ],
    },
  ],
}

const taskDrawerPrimaryItems: Array<{ key: TaskDrawerPrimaryKey; label: string; count?: string }> = [
  { key: 'mine', label: '我负责的', count: '81' },
  { key: 'followed', label: '我关注的', count: '755' },
  { key: 'updates', label: '动态' },
  { key: 'feishu', label: '来自飞书项目' },
]

const taskDrawerQuickAccessItems: Array<{ key: TaskCollectionKey; label: string }> = [
  { key: 'all', label: '全部任务' },
  { key: 'created', label: '我创建的' },
  { key: 'assigned', label: '我分配的' },
  { key: 'completed', label: '已完成' },
]

const initialTaskDrawerListItems: TaskDrawerChecklistItem[] = [
  { key: 'list-guoren-630', label: '果仁-6.30' },
  { key: 'list-scenario-training', label: '场景-培训项目' },
  { key: 'list-guoren-mvp', label: '果仁-mvp版本（3.31）' },
  { key: 'list-ai-training', label: '果仁-人工智能通识培训（4.30）' },
]

const initialTaskDrawerChecklistGroups: TaskDrawerChecklistGroup[] = [
  { id: 'drawer-group-default', label: '', items: initialTaskDrawerListItems },
]

const allTaskCollectionItems: TaskCollectionItem[] = [
  { id: 'all-1', title: '更换模型（7月下线）', done: true, meta: '7月31日 截止', assignees: [dogBadge] },
  { id: 'all-2', title: '与田宇沟通研习社事宜', done: true, meta: '6月3日 截止', assignees: [dogBadge] },
  { id: 'all-3', title: '在线笔记解析功能：增加「最后解析时间」字段', done: true, meta: '6月1日 截止', assignees: [dogBadge] },
  { id: 'all-4', title: '5月5日来赶进度', done: true, meta: '5月5日 截止', assignees: [dogBadge] },
  { id: 'all-5', title: '规划五月工作安排', done: true, meta: '5月4日 截止', assignees: [dogBadge] },
  { id: 'all-6', title: '【待办】参加工作布置会', done: true, meta: '4月8日 16:30 截止', assignees: [dogBadge] },
  { id: 'all-7', title: '【技术分享】在线文档实现逻辑', done: true, meta: '4月7日 5:30 截止', assignees: [dogBadge] },
  { id: 'all-8', title: 'diffy + ragflow', done: true, meta: '2025年4月27日 - 2025年4月27日', metaIcon: 'comment', metaValue: '1', assignees: [linFengBadge] },
  { id: 'all-9', title: 'QT20244839 家长听书-《天天向上-有办法的父母，会写作业的孩子》', done: true, meta: '2024年11月9日 - 2024年11月29日', metaIcon: 'progress', metaValue: '0/1', assignees: [teacherBadge, dogBadge] },
]

const initialTaskCollectionViews: Record<string, TaskCollectionView> = {
  all: {
    label: '全部任务',
    items: allTaskCollectionItems,
  },
  created: {
    label: '我创建的',
    items: allTaskCollectionItems.slice(0, 5),
  },
  assigned: {
    label: '我分配的',
    items: [allTaskCollectionItems[1], allTaskCollectionItems[2], allTaskCollectionItems[5], allTaskCollectionItems[8]],
  },
  completed: {
    label: '已完成',
    items: allTaskCollectionItems.slice(0, 7),
  },
  updates: {
    label: '动态',
    items: [allTaskCollectionItems[0], allTaskCollectionItems[2], allTaskCollectionItems[7]],
  },
  feishu: {
    label: '来自飞书项目',
    items: [allTaskCollectionItems[1], allTaskCollectionItems[3], allTaskCollectionItems[6]],
  },
  'list-guoren-630': {
    label: '果仁-6.30',
    items: [allTaskCollectionItems[0], allTaskCollectionItems[4], allTaskCollectionItems[7]],
  },
  'list-scenario-training': {
    label: '场景-培训项目',
    items: [allTaskCollectionItems[2], allTaskCollectionItems[5], allTaskCollectionItems[8]],
  },
  'list-guoren-mvp': {
    label: '果仁-mvp版本（3.31）',
    items: [allTaskCollectionItems[1], allTaskCollectionItems[3], allTaskCollectionItems[6]],
  },
  'list-ai-training': {
    label: '果仁-人工智能通识培训（4.30）',
    items: [allTaskCollectionItems[4], allTaskCollectionItems[5], allTaskCollectionItems[8]],
  },
}

const taskScheduleWeekdayLabels = ['日', '一', '二', '三', '四', '五', '六']
const taskScheduleMinuteOptions = [0, 15, 30, 45]
const taskScheduleTimeCellHeight = 64
const taskScheduleDefaultHour = 18
const taskScheduleDefaultMinute = 0
const taskScheduleDefaultReminder: TaskScheduleReminder = 'none'
const taskScheduleReminderOptions: Array<{ value: Exclude<TaskScheduleReminder, 'none'>; label: string }> = [
  { value: 'at_due', label: '任务截止时' },
  { value: '5m_before', label: '截止前 5 分钟' },
]

const createCalendarDay = (year: number, month: number, date: number) => new Date(year, month, date)

const addCalendarDays = (date: Date, amount: number) => createCalendarDay(date.getFullYear(), date.getMonth(), date.getDate() + amount)

const getDefaultScheduleDate = () => addCalendarDays(new Date(), 1)

const formatTaskScheduleMonthLabel = (date: Date) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`

const formatTaskScheduleShortLabel = (date: Date) => `${date.getMonth() + 1}月${date.getDate()}日`

const formatTaskScheduleDetailLabel = (date: Date, hasSpecificTime: boolean) => (
  hasSpecificTime ? `${formatTaskScheduleShortLabel(date)} ${formatTaskScheduleTimeLabel(date.getHours(), date.getMinutes())}` : formatTaskScheduleShortLabel(date)
)

const formatTaskScheduleFullLabel = (date: Date) => `${date.getMonth() + 1}月${date.getDate()}日 周${taskScheduleWeekdayLabels[date.getDay()]}`

const formatTaskScheduleTimeLabel = (hour: number, minute: number) => `${hour}:${String(minute).padStart(2, '0')}`

const withTaskScheduleTime = (date: Date, hour: number, minute: number) => {
  const next = new Date(date)
  next.setHours(hour, minute, 0, 0)
  return next
}

const formatTaskScheduleReminderLabel = (reminder: TaskScheduleReminder) => {
  if (reminder === 'at_due') return '任务截止时'
  if (reminder === '5m_before') return '截止前 5 分钟'
  return '不提醒'
}

const isSameCalendarDate = (left: Date, right: Date) => (
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()
)

const buildTaskScheduleCalendarDays = (viewDate: Date) => {
  const monthStart = createCalendarDay(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const calendarStart = addCalendarDays(monthStart, -monthStart.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = addCalendarDays(calendarStart, index)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
      isSaturday: date.getDay() === 6,
    }
  })
}

const buildTaskDetailSourceText = (title: string) => {
  if (title === '检查新的 appld') {
    return '来源：果仁群，王海鸥 @我\n消息：更换了新的appld，再看\n看in时间：2026-05-14 14:26'
  }

  if (title === '更换模型（7月下线）') {
    return '来源：项目群，模型改造同步\n消息：更换模型预计 7 月下线\n时间：2026-05-14 14:26'
  }

  return `来源：任务同步，系统消息\n消息：${title}\n时间：2026-05-14 14:26`
}

const pickDetailAssigneeBadge = (assignees: TaskAssigneeBadge[]) => assignees.find((badge) => badge.kind !== 'count') ?? dogBadge

const getTaskAssigneeName = (badge: TaskAssigneeBadge) => {
  if (badge.kind === 'count') return '未分配'
  return badge.name
}

const getDetailDateChoice = (dueText?: string) => {
  if (!dueText) return 'today'
  if (dueText.includes('明天')) return 'tomorrow'
  if (dueText.includes('今天')) return 'today'
  return 'other'
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.6" />
      <line x1="20" y1="20" x2="16.4" y2="16.4" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.15" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function TaskMenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <line x1="7" y1="6.5" x2="17" y2="6.5" />
      <line x1="7" y1="12" x2="15" y2="12" />
      <line x1="7" y1="17.5" x2="17" y2="17.5" />
    </svg>
  )
}

function TaskFilterIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="8" x2="19" y2="8" />
      <circle cx="15" cy="8" r="2.2" />
      <line x1="5" y1="16" x2="19" y2="16" />
      <circle cx="9" cy="16" r="2.2" />
    </svg>
  )
}

function TaskChipCloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

function TaskMetaCommentIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.2 7.1h11.6a2.1 2.1 0 0 1 2.1 2.1v6.2a2.1 2.1 0 0 1-2.1 2.1H12l-4 3v-3H6.2a2.1 2.1 0 0 1-2.1-2.1V9.2a2.1 2.1 0 0 1 2.1-2.1Z" />
    </svg>
  )
}

function TaskMetaProgressIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8.5h8.5" />
      <path d="M8 12h6.5" />
      <path d="M8 15.5h5" />
      <rect x="4.5" y="5" width="15" height="14" rx="2.2" />
    </svg>
  )
}

function DetailBackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  )
}

function DetailBookmarkIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4.5h10a1.8 1.8 0 0 1 1.8 1.8v13.2l-6.8-3.8-6.8 3.8V6.3A1.8 1.8 0 0 1 7 4.5Z" />
    </svg>
  )
}

function DetailShareIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 8.5 20 4" />
      <path d="M10 4h10v10" />
      <path d="M20 13.5V18a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2H11" />
    </svg>
  )
}

function DetailCopyIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="5" width="11" height="14" rx="2" />
      <path d="M5 16V8a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

function DetailMoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  )
}

function DetailSourceIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14" />
      <path d="M5 12h9" />
      <path d="M5 17h12" />
    </svg>
  )
}

function CommentAtIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.2 12.6V9.9a4.2 4.2 0 1 0-1.5 3.2" />
      <circle cx="11.1" cy="10.6" r="2.8" />
      <path d="M20 13.2v.6a7.8 7.8 0 1 1-3.2-6.3" />
    </svg>
  )
}

function CommentImageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="5.5" width="15" height="13" rx="2.2" />
      <circle cx="9.2" cy="10.2" r="1.4" />
      <path d="m7 16 3.3-3.3a1 1 0 0 1 1.4 0L14 15l1.6-1.6a1 1 0 0 1 1.4 0L19 15.4" />
    </svg>
  )
}

function CommentSendIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4.8 19 14.4-7L4.8 5l1.6 5.8L15 12 6.4 13.2 4.8 19Z" />
    </svg>
  )
}

function SchedulePlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function ScheduleClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.7v4.8l3.3 1.9" />
    </svg>
  )
}

function ScheduleBellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 15.8h11l-1.3-1.9V11a4.2 4.2 0 0 0-8.4 0v2.9l-1.3 1.9Z" />
      <path d="M10 18.2a2.2 2.2 0 0 0 4 0" />
    </svg>
  )
}

function ScheduleRepeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.6 7H17l-2.3-2.3" />
      <path d="M16.4 17H7l2.3 2.3" />
      <path d="M17 7a7 7 0 0 1 0 10" />
      <path d="M7 17a7 7 0 0 1 0-10" />
    </svg>
  )
}

function ScheduleMonthChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left' ? <path d="m14.5 6-6 6 6 6" /> : <path d="m9.5 6 6 6-6 6" />}
    </svg>
  )
}

function ScheduleRowChevronIcon({ direction = 'right' }: { direction?: 'right' | 'up' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'up' ? <path d="m6 15 6-6 6 6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  )
}

function DrawerMineIcon({ active }: { active: boolean }) {
  const tone = active ? '#4268ff' : '#787e88'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function DrawerFollowIcon({ active }: { active: boolean }) {
  const tone = active ? '#4268ff' : '#787e88'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4.5h10a1.8 1.8 0 0 1 1.8 1.8v13.2l-6.8-3.8-6.8 3.8V6.3A1.8 1.8 0 0 1 7 4.5Z" />
    </svg>
  )
}

function DrawerActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#787e88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3.4 2" />
    </svg>
  )
}

function DrawerFeishuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="15" rx="4" fill="#f4f5f8" stroke="#d8dce5" />
      <path d="M7 9.5h4.4a1.8 1.8 0 0 1 1.8 1.8V13H8.9A1.9 1.9 0 0 1 7 11.1Z" fill="#6ca6ff" />
      <path d="M12 9.5h3.1A1.9 1.9 0 0 1 17 11.4V13h-3.2A1.8 1.8 0 0 1 12 11.2Z" fill="#8a7dff" />
      <path d="M7 13.5h4.3a1.9 1.9 0 0 1 1.9 1.9V17H8.9A1.9 1.9 0 0 1 7 15.1Z" fill="#7f9dff" />
      <path d="M12.6 13.5H17v1.6a1.9 1.9 0 0 1-1.9 1.9h-2.5a1.8 1.8 0 0 1-1.8-1.8v-.1a1.7 1.7 0 0 1 1.8-1.6Z" fill="#5cd0c0" />
    </svg>
  )
}

function DrawerChecklistIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4.5h10a1.8 1.8 0 0 1 1.8 1.8v13.2l-6.8-3.8-6.8 3.8V6.3A1.8 1.8 0 0 1 7 4.5Z" />
      <path d="m9.4 9.3 1.4 1.4 2.8-2.8" />
    </svg>
  )
}

function renderTaskDrawerPrimaryIcon(key: TaskDrawerPrimaryKey, active: boolean) {
  if (key === 'mine') return <DrawerMineIcon active={active} />
  if (key === 'followed') return <DrawerFollowIcon active={active} />
  if (key === 'updates') return <DrawerActivityIcon />
  return <DrawerFeishuIcon />
}

function AddTaskIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function GroupMoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  )
}

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7f858f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
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
  badgeText?: string
}

const assigneeOptions: AssigneeOption[] = [
  { name: '张洪磊', color: '#7d8cff', avatar: taskAvatarSrc, badgeText: '张洪磊' },
  { name: '秦松', color: 'linear-gradient(135deg, #54b76d 0%, #47a6bf 100%)', badgeText: '秦松' },
  { name: '我', color: 'linear-gradient(135deg, #5b73ff 0%, #8794ff 100%)', badgeText: '我' },
  { name: '果仁', color: 'linear-gradient(135deg, #7e86c7 0%, #5c6ed8 100%)', badgeText: '果仁' },
]

const dueDateOptions = ['今天', '明天', '后天', '6月6日', '6月7日', '6月8日', '下周一', '无截止日期']

type GroupOption = {
  id: string
  name: string
}

const buildTaskBadge = (assignee: AssigneeOption): TaskAssigneeBadge => {
  if (assignee.avatar) {
    return createImageBadge(assignee.name, assignee.avatar)
  }

  return createTextBadge(
    assignee.name,
    assignee.badgeText ?? assignee.name.slice(0, 2),
    assignee.color,
  )
}

function renderAssigneeAvatar(assignee: AssigneeOption | undefined, name: string, color: string, className: string) {
  if (assignee?.avatar) {
    return <img className={className} src={assignee.avatar} alt={name} />
  }

  return (
    <div className={className} style={{ background: color }}>
      {((assignee?.badgeText ?? name) || '未').slice(0, 2)}
    </div>
  )
}

function renderTaskAssigneeBadge(badge: TaskAssigneeBadge, index: number) {
  if (badge.kind === 'image') {
    return (
      <span className="task-assignee-badge is-image" key={`${badge.name}-${index}`} style={{ zIndex: index + 1 }}>
        <img src={badge.avatar} alt={badge.name} />
      </span>
    )
  }

  if (badge.kind === 'count') {
    return (
      <span className="task-assignee-badge is-count" key={`${badge.label}-${index}`} style={{ zIndex: index + 1 }}>
        {badge.label}
      </span>
    )
  }

  return (
    <span
      className="task-assignee-badge is-text"
      key={`${badge.name}-${index}`}
      style={{ background: badge.background, color: badge.color ?? '#fff', zIndex: index + 1 }}
    >
      {badge.text}
    </span>
  )
}

function renderTaskCollectionMetaIcon(icon: TaskCollectionItem['metaIcon']) {
  if (icon === 'comment') return <TaskMetaCommentIcon />
  if (icon === 'progress') return <TaskMetaProgressIcon />
  return null
}

function renderTaskDetailBadgeAvatar(badge: TaskAssigneeBadge, className: string) {
  if (badge.kind === 'image') {
    return <img className={className} src={badge.avatar} alt={badge.name} />
  }

  if (badge.kind === 'count') {
    return <div className={`${className} is-count`}>{badge.label}</div>
  }

  return (
    <div className={className} style={{ background: badge.background, color: badge.color ?? '#fff' }}>
      {badge.text}
    </div>
  )
}

function TaskSchedulePage({
  initialDate,
  initialHasSpecificTime,
  initialReminder,
  onCancel,
  onSave,
}: {
  initialDate: Date | null
  initialHasSpecificTime: boolean
  initialReminder: TaskScheduleReminder
  onCancel: () => void
  onSave: (selection: TaskScheduleSelection) => void
}) {
  const fallbackDate = initialDate ?? getDefaultScheduleDate()
  const [selectedDate, setSelectedDate] = useState<Date | null>(fallbackDate)
  const [viewDate, setViewDate] = useState(createCalendarDay(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1))
  const [hasSpecificTime, setHasSpecificTime] = useState(initialHasSpecificTime)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState(initialHasSpecificTime ? fallbackDate.getHours() : taskScheduleDefaultHour)
  const [selectedMinute, setSelectedMinute] = useState(initialHasSpecificTime ? fallbackDate.getMinutes() : taskScheduleDefaultMinute)
  const [selectedReminder, setSelectedReminder] = useState<TaskScheduleReminder>(initialReminder)
  const [draftReminder, setDraftReminder] = useState<Exclude<TaskScheduleReminder, 'none'>>(
    initialReminder === 'none' ? 'at_due' : initialReminder,
  )
  const [isReminderPickerOpen, setIsReminderPickerOpen] = useState(false)
  const [hasReminderDraftChange, setHasReminderDraftChange] = useState(false)
  const hourWheelRef = useRef<HTMLDivElement | null>(null)
  const minuteWheelRef = useRef<HTMLDivElement | null>(null)
  const hourSnapTimeoutRef = useRef<number | null>(null)
  const minuteSnapTimeoutRef = useRef<number | null>(null)

  const calendarDays = buildTaskScheduleCalendarDays(viewDate)
  const timeLabel = formatTaskScheduleTimeLabel(selectedHour, selectedMinute)
  const hourOptions = Array.from({ length: 24 }, (_, index) => index)
  const selectedMinuteIndex = taskScheduleMinuteOptions.findIndex((minute) => minute === selectedMinute)
  const showTimeClear = hasSpecificTime && !isTimePickerOpen
  const reminderLabel = formatTaskScheduleReminderLabel(selectedReminder)
  const showReminderClear = selectedReminder !== 'none' && !isReminderPickerOpen
  const resolvedReminder = isReminderPickerOpen && hasReminderDraftChange ? draftReminder : selectedReminder

  useEffect(() => {
    if (!isTimePickerOpen || !hourWheelRef.current) return
    const targetTop = selectedHour * taskScheduleTimeCellHeight
    if (Math.abs(hourWheelRef.current.scrollTop - targetTop) > 1) {
      hourWheelRef.current.scrollTo({ top: targetTop, behavior: 'auto' })
    }
  }, [isTimePickerOpen, selectedHour])

  useEffect(() => {
    if (!isTimePickerOpen || !minuteWheelRef.current || selectedMinuteIndex < 0) return
    const targetTop = selectedMinuteIndex * taskScheduleTimeCellHeight
    if (Math.abs(minuteWheelRef.current.scrollTop - targetTop) > 1) {
      minuteWheelRef.current.scrollTo({ top: targetTop, behavior: 'auto' })
    }
  }, [isTimePickerOpen, selectedMinuteIndex])

  useEffect(() => {
    return () => {
      if (hourSnapTimeoutRef.current) window.clearTimeout(hourSnapTimeoutRef.current)
      if (minuteSnapTimeoutRef.current) window.clearTimeout(minuteSnapTimeoutRef.current)
    }
  }, [])

  const snapHourWheel = () => {
    if (!hourWheelRef.current) return
    const nextIndex = Math.max(0, Math.min(hourOptions.length - 1, Math.round(hourWheelRef.current.scrollTop / taskScheduleTimeCellHeight)))
    const nextHour = hourOptions[nextIndex]
    setSelectedHour(nextHour)
    hourWheelRef.current.scrollTo({ top: nextIndex * taskScheduleTimeCellHeight, behavior: 'smooth' })
  }

  const snapMinuteWheel = () => {
    if (!minuteWheelRef.current) return
    const nextIndex = Math.max(0, Math.min(taskScheduleMinuteOptions.length - 1, Math.round(minuteWheelRef.current.scrollTop / taskScheduleTimeCellHeight)))
    const nextMinute = taskScheduleMinuteOptions[nextIndex]
    setSelectedMinute(nextMinute)
    minuteWheelRef.current.scrollTo({ top: nextIndex * taskScheduleTimeCellHeight, behavior: 'smooth' })
  }

  const clearSpecificTime = () => {
    setHasSpecificTime(false)
    setIsTimePickerOpen(false)
    setSelectedHour(taskScheduleDefaultHour)
    setSelectedMinute(taskScheduleDefaultMinute)
    setSelectedReminder(taskScheduleDefaultReminder)
    setDraftReminder('at_due')
    setIsReminderPickerOpen(false)
    setHasReminderDraftChange(false)
  }

  const toggleReminderPicker = () => {
    if (isReminderPickerOpen) {
      if (hasReminderDraftChange) {
        setSelectedReminder(draftReminder)
      }
      setIsReminderPickerOpen(false)
      setHasReminderDraftChange(false)
      return
    }

    setDraftReminder(selectedReminder === 'none' ? 'at_due' : selectedReminder)
    setHasReminderDraftChange(false)
    setIsReminderPickerOpen(true)
  }

  const clearReminder = () => {
    setSelectedReminder(taskScheduleDefaultReminder)
    setDraftReminder('at_due')
    setIsReminderPickerOpen(false)
    setHasReminderDraftChange(false)
  }

  return (
    <div className="task-schedule-page">
      <div className="task-schedule-header">
        <button className="task-schedule-header-btn" type="button" onClick={onCancel}>取消</button>
        <button
          className="task-schedule-header-btn is-save"
          type="button"
          onClick={() => onSave({
            date: selectedDate ? (hasSpecificTime ? withTaskScheduleTime(selectedDate, selectedHour, selectedMinute) : createCalendarDay(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
            )) : null,
            hasSpecificTime: selectedDate ? hasSpecificTime : false,
            reminder: selectedDate ? resolvedReminder : taskScheduleDefaultReminder,
          })}
        >
          保存
        </button>
      </div>

      <div className="task-schedule-topbar">
        <button className="task-schedule-start-cell" type="button">
          <span className="task-schedule-start-icon">
            <SchedulePlusIcon />
          </span>
          <span>开始时间</span>
        </button>

        <div className={`task-schedule-selection ${selectedDate ? 'has-value' : 'is-empty'}`}>
          <span className="task-schedule-selection-label">
            {selectedDate ? formatTaskScheduleFullLabel(selectedDate) : '选择结束时间'}
          </span>
          <button className="task-schedule-selection-clear" type="button" aria-label="清除结束时间" onClick={() => setSelectedDate(null)}>
            <ComposerCloseIcon />
          </button>
        </div>
      </div>

      <div className="task-schedule-month-panel">
        <div className="task-schedule-month-header">
          <div className="task-schedule-month-title">{formatTaskScheduleMonthLabel(viewDate)}</div>
          <div className="task-schedule-month-nav">
            <button
              className="task-schedule-month-nav-btn"
              type="button"
              aria-label="上个月"
              onClick={() => setViewDate(createCalendarDay(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            >
              <ScheduleMonthChevronIcon direction="left" />
            </button>
            <button
              className="task-schedule-month-nav-btn"
              type="button"
              aria-label="下个月"
              onClick={() => setViewDate(createCalendarDay(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            >
              <ScheduleMonthChevronIcon direction="right" />
            </button>
          </div>
        </div>

        <div className="task-schedule-weekdays">
          {taskScheduleWeekdayLabels.map((label, index) => (
            <div className={`task-schedule-weekday ${index === 6 ? 'is-saturday' : ''}`} key={label}>
              {label}
            </div>
          ))}
        </div>

        <div className="task-schedule-grid">
          {calendarDays.map((day) => {
            const isSelected = selectedDate ? isSameCalendarDate(selectedDate, day.date) : false

            return (
              <button
                className={[
                  'task-schedule-day',
                  day.isCurrentMonth ? '' : 'is-outside',
                  day.isSaturday ? 'is-saturday' : '',
                  isSelected ? 'is-selected' : '',
                ].filter(Boolean).join(' ')}
                key={day.key}
                type="button"
                onClick={() => setSelectedDate(day.date)}
              >
                <span className="task-schedule-day-number">{day.dayNumber}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="task-schedule-option-list">
        <div className={`task-schedule-option-row is-time-row ${isTimePickerOpen ? 'is-expanded' : ''} ${showTimeClear ? 'has-clear' : ''}`}>
          <button
            className="task-schedule-option-main"
            type="button"
            onClick={() => {
              setHasSpecificTime(true)
              setIsTimePickerOpen((current) => !current)
            }}
            >
              <span className="task-schedule-option-leading">
                <ScheduleClockIcon />
              </span>
              <span className="task-schedule-option-label">{hasSpecificTime ? timeLabel : '设置具体时间'}</span>
              {!showTimeClear && (
                <span className="task-schedule-option-trailing">
                  <ScheduleRowChevronIcon direction={isTimePickerOpen ? 'up' : 'right'} />
                </span>
              )}
          </button>

          {showTimeClear && (
            <button className="task-schedule-option-clear is-side" type="button" aria-label="清除具体时间" onClick={clearSpecificTime}>
              <ComposerCloseIcon />
            </button>
          )}
        </div>

        {isTimePickerOpen && (
          <div className="task-schedule-time-panel">
            <div className="task-schedule-time-wheel">
              <div
                className="task-schedule-time-column"
                ref={hourWheelRef}
                onScroll={() => {
                  if (hourSnapTimeoutRef.current) window.clearTimeout(hourSnapTimeoutRef.current)
                  hourSnapTimeoutRef.current = window.setTimeout(snapHourWheel, 100)
                }}
              >
                {hourOptions.map((hour) => (
                  <button
                    className={`task-schedule-time-cell ${selectedHour === hour ? 'is-active' : ''}`}
                    key={`hour-${hour}`}
                    type="button"
                    onClick={() => {
                      setSelectedHour(hour)
                      hourWheelRef.current?.scrollTo({ top: hour * taskScheduleTimeCellHeight, behavior: 'smooth' })
                    }}
                  >
                    {hour}
                  </button>
                ))}
              </div>

              <div
                className="task-schedule-time-column"
                ref={minuteWheelRef}
                onScroll={() => {
                  if (minuteSnapTimeoutRef.current) window.clearTimeout(minuteSnapTimeoutRef.current)
                  minuteSnapTimeoutRef.current = window.setTimeout(snapMinuteWheel, 100)
                }}
              >
                {taskScheduleMinuteOptions.map((minute) => (
                  <button
                    className={`task-schedule-time-cell ${selectedMinute === minute ? 'is-active' : ''}`}
                    key={`minute-${minute}`}
                    type="button"
                    onClick={() => {
                      setSelectedMinute(minute)
                      const minuteIndex = taskScheduleMinuteOptions.findIndex((value) => value === minute)
                      minuteWheelRef.current?.scrollTo({ top: minuteIndex * taskScheduleTimeCellHeight, behavior: 'smooth' })
                    }}
                  >
                    {String(minute).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="task-schedule-option-gap" />

        <div className={`task-schedule-option-row is-reminder-row ${isReminderPickerOpen ? 'is-expanded' : ''} ${showReminderClear ? 'has-clear' : ''}`}>
          <button className="task-schedule-option-main" type="button" onClick={toggleReminderPicker}>
            <span className="task-schedule-option-leading">
              <ScheduleBellIcon />
            </span>
            <span className="task-schedule-option-label">{reminderLabel}</span>
            {!showReminderClear && (
              <span className="task-schedule-option-trailing">
                <ScheduleRowChevronIcon direction={isReminderPickerOpen ? 'up' : 'right'} />
              </span>
            )}
          </button>

          {showReminderClear && (
            <button className="task-schedule-option-clear is-side" type="button" aria-label="清除提醒" onClick={clearReminder}>
              <ComposerCloseIcon />
            </button>
          )}
        </div>

        {isReminderPickerOpen && (
          <div className="task-schedule-reminder-panel">
            {taskScheduleReminderOptions.map((option) => (
              <button
                className={`task-schedule-reminder-choice ${draftReminder === option.value ? 'is-active' : ''}`}
                key={option.value}
                type="button"
                onClick={() => {
                  setDraftReminder(option.value)
                  setHasReminderDraftChange(true)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="task-schedule-option-gap" />

        <button className="task-schedule-option-row" type="button">
          <span className="task-schedule-option-leading">
            <ScheduleRepeatIcon />
          </span>
          <span className="task-schedule-option-label">不重复</span>
          <span className="task-schedule-option-trailing">
            <ScheduleRowChevronIcon />
          </span>
        </button>
      </div>
    </div>
  )
}

function TaskDetailPage({
  detail,
  onClose,
  onToggleDone,
}: {
  detail: TaskDetailState
  onClose: () => void
  onToggleDone: () => void
}) {
  const [dateChoice, setDateChoice] = useState<TaskDetailDateChoice>(detail.dateChoice)
  const [customDate, setCustomDate] = useState<Date | null>(() => (
    detail.dateChoice === 'other' ? getDefaultScheduleDate() : null
  ))
  const [hasCustomTime, setHasCustomTime] = useState(false)
  const [scheduleReminder, setScheduleReminder] = useState<TaskScheduleReminder>(taskScheduleDefaultReminder)
  const [commentValue, setCommentValue] = useState('')
  const [comments, setComments] = useState([
    { id: 'task-created', actor: '张洪磊', text: '创建了任务', time: detail.commentTime },
  ])
  const [showAssignee, setShowAssignee] = useState(true)
  const [showSchedulePage, setShowSchedulePage] = useState(false)

  const otherDateLabel = customDate ? formatTaskScheduleDetailLabel(customDate, hasCustomTime) : '其他时间'

  const handleSendComment = () => {
    if (!commentValue.trim()) return
    setComments(prev => [...prev, { id: `comment-${Date.now()}`, actor: '我', text: commentValue.trim(), time: '刚刚' }])
    setCommentValue('')
  }

  return (
    <div className="task-detail-page">
      <div className="task-detail-header">
        <button className="task-detail-header-btn is-back" type="button" aria-label="返回" onClick={onClose}>
          <DetailBackIcon />
        </button>

        <div className="task-detail-header-actions">
          <button className="task-detail-header-btn" type="button" aria-label="收藏">
            <DetailBookmarkIcon />
          </button>
          <button className="task-detail-header-btn" type="button" aria-label="分享">
            <DetailShareIcon />
          </button>
          <button className="task-detail-header-btn" type="button" aria-label="复制">
            <DetailCopyIcon />
          </button>
          <button className="task-detail-header-btn" type="button" aria-label="更多">
            <DetailMoreIcon />
          </button>
        </div>
      </div>

      <div className="task-detail-scroll">
        <div className="task-detail-title-row">
          <button
            className={`task-detail-check ${detail.done ? 'is-checked' : ''}`}
            type="button"
            aria-label={detail.done ? '标记为未完成' : '标记为完成'}
            onClick={onToggleDone}
          >
            {detail.done && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
          <div className={`task-detail-title ${detail.done ? 'is-done' : ''}`}>{detail.title}</div>
        </div>

        <div className="task-detail-source-row">
          <span className="task-detail-source-icon">
            <DetailSourceIcon />
          </span>
          <div className="task-detail-source-text">{detail.sourceText}</div>
        </div>

        <div className="task-detail-note-pill">{detail.noteLabel}</div>

        <div className="task-detail-form-row">
          <span className="task-detail-leading-icon">
            <ComposerPersonIcon />
          </span>

          {showAssignee && (
            <button className="task-detail-assignee-chip" type="button" onClick={() => setShowAssignee(false)}>
              {renderTaskDetailBadgeAvatar(detail.assigneeBadge, 'task-detail-assignee-avatar')}
              <span className="task-detail-assignee-name">{detail.assigneeName}</span>
              <span className="task-detail-assignee-close">
                <ComposerCloseIcon />
              </span>
            </button>
          )}

          <span className="task-detail-form-divider" />

          <button className="task-detail-group-trigger" type="button">
            <span>{detail.groupName}</span>
            <ChevronDownIcon color="#7d838d" />
          </button>
        </div>

        <div className="task-detail-form-row is-date-row">
          <span className="task-detail-leading-icon">
            <ComposerOtherDateIcon active={false} />
          </span>

          <div className="task-detail-date-pills">
            <button className={`task-detail-date-pill ${dateChoice === 'today' ? 'is-active is-today' : ''}`} type="button" onClick={() => setDateChoice('today')}>
              <ComposerTodayIcon active={dateChoice === 'today'} />
              <span>今天</span>
            </button>
            <button className={`task-detail-date-pill ${dateChoice === 'tomorrow' ? 'is-active is-tomorrow' : ''}`} type="button" onClick={() => setDateChoice('tomorrow')}>
              <ComposerTomorrowIcon active={dateChoice === 'tomorrow'} />
              <span>明天</span>
            </button>
            <button
              className={`task-detail-date-pill ${dateChoice === 'other' ? 'is-active is-other' : ''}`}
              type="button"
              onClick={() => setShowSchedulePage(true)}
            >
              <ComposerOtherDateIcon active={dateChoice === 'other'} />
              <span>{otherDateLabel}</span>
            </button>
          </div>
        </div>

        <button className="task-detail-action-row" type="button">
          <span className="task-detail-leading-icon">
            <ComposerChecklistIcon />
          </span>
          <span>添加至任务清单</span>
        </button>

        <button className="task-detail-action-row" type="button">
          <span className="task-detail-leading-icon">
            <ComposerSubtaskIcon />
          </span>
          <span>添加子任务</span>
        </button>

        <button className="task-detail-action-row" type="button">
          <span className="task-detail-leading-icon">
            <ComposerAttachmentIcon />
          </span>
          <span>添加附件</span>
        </button>

        <button className="task-detail-action-row" type="button">
          <span className="task-detail-leading-icon">
            <ComposerFollowerIcon />
          </span>
          <span>添加关注人</span>
        </button>

        <div className="task-detail-comments-section">
          <div className="task-detail-comments-title">评论</div>

          <div className="task-detail-comments-list">
            {comments.map(comment => (
              <div className="task-detail-comment-item" key={comment.id}>
                <span className="task-detail-comment-dot" />
                <div className="task-detail-comment-content">
                  <span className="task-detail-comment-actor">{comment.actor}</span>
                  <span className="task-detail-comment-text">{comment.text}</span>
                  <span className="task-detail-comment-time">{comment.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="task-detail-comment-bar">
        <input
          className="task-detail-comment-input"
          type="text"
          value={commentValue}
          onChange={(event) => setCommentValue(event.target.value)}
          placeholder="输入评论"
        />

        <div className="task-detail-comment-actions">
          <button className="task-detail-comment-icon-btn" type="button" aria-label="提及">
            <CommentAtIcon />
          </button>
          <button className="task-detail-comment-icon-btn" type="button" aria-label="图片">
            <CommentImageIcon />
          </button>
          <button className="task-detail-comment-icon-btn" type="button" aria-label="附件">
            <ComposerAttachmentIcon />
          </button>
          <button
            className={`task-detail-send-btn ${commentValue.trim() ? 'is-active' : ''}`}
            type="button"
            aria-label="发送评论"
            onClick={handleSendComment}
          >
            <CommentSendIcon active={Boolean(commentValue.trim())} />
          </button>
        </div>
      </div>

      {showSchedulePage && (
        <TaskSchedulePage
          initialDate={customDate ?? (dateChoice === 'today' ? getDefaultScheduleDate() : getDefaultScheduleDate())}
          initialHasSpecificTime={hasCustomTime}
          initialReminder={scheduleReminder}
          onCancel={() => setShowSchedulePage(false)}
          onSave={({ date, hasSpecificTime, reminder }) => {
            setCustomDate(date)
            setHasCustomTime(hasSpecificTime)
            setScheduleReminder(reminder)
            setDateChoice('other')
            setShowSchedulePage(false)
          }}
        />
      )}
    </div>
  )
}

function AddTaskSheet({
  onClose,
  onAdd,
  groupOptions,
  defaultGroupId,
}: {
  onClose: () => void
  onAdd: (task: TaskItem, groupId: string) => void
  groupOptions: GroupOption[]
  defaultGroupId: string
}) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('今天')
  const [assignee, setAssignee] = useState('张洪磊')
  const [assigneeColor, setAssigneeColor] = useState('#7d8cff')
  const [selectedGroup, setSelectedGroup] = useState(defaultGroupId)
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
  const activeGroupName = groupOptions.find(g => g.id === selectedGroup)?.name ?? groupOptions[0]?.name ?? '默认分组'
  const hasCustomDate = dueDate !== '今天' && dueDate !== '明天'
  const customDateLabel = hasCustomDate && dueDate !== '无截止日期' ? dueDate : '其他时间'

  const blurActiveField = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const handleSend = () => {
    if (!title.trim() || !selectedGroup) return
    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      dueDate: dueDate === '无截止日期' ? '' : `${dueDate} 截止`,
      dueColor: dueDate === '今天' ? '#4A7CFF' : dueDate === '明天' ? '#3CC2A3' : '#999',
      done: false,
      assignees: activeAssignee ? [buildTaskBadge(activeAssignee)] : [],
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
  const [taskViews, setTaskViews] = useState(initialTaskViews)
  const [taskCollections, setTaskCollections] = useState<Record<string, TaskCollectionView>>(initialTaskCollectionViews)
  const [drawerChecklistGroups, setDrawerChecklistGroups] = useState(initialTaskDrawerChecklistGroups)
  const [customChecklistGroups, setCustomChecklistGroups] = useState<Record<string, TaskGroup[]>>({})
  const [activeCollectionKey, setActiveCollectionKey] = useState<TaskCollectionId | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showTaskFilters, setShowTaskFilters] = useState(false)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskDetailState | null>(null)
  const [showDrawerCreateSheet, setShowDrawerCreateSheet] = useState(false)
  const [drawerCreateDialog, setDrawerCreateDialog] = useState<DrawerCreateKind | null>(null)
  const [drawerCreateName, setDrawerCreateName] = useState('')

  const visibleGroups = taskViews[activeTab]
  const activeCollection = activeCollectionKey ? taskCollections[activeCollectionKey] : null
  const activeChecklistGroups = activeCollectionKey ? customChecklistGroups[activeCollectionKey] ?? null : null
  const currentTaskGroups = activeChecklistGroups ?? visibleGroups
  const groupOptions = currentTaskGroups.map(group => ({ id: group.id, name: group.name }))
  const addTargetGroupId = currentTaskGroups.find(group => group.name === '默认分组')?.id ?? currentTaskGroups[0]?.id ?? ''
  const trimmedDrawerCreateName = drawerCreateName.trim()

  const handleDrawerPrimarySelect = (key: TaskDrawerPrimaryKey) => {
    if (key === 'mine' || key === 'followed') {
      setActiveTab(key)
      setActiveCollectionKey(null)
    } else {
      setActiveCollectionKey(key)
    }
    setShowDrawer(false)
  }

  const handleDrawerCollectionSelect = (key: TaskCollectionId) => {
    setActiveCollectionKey(key)
    setShowDrawer(false)
  }

  const clearActiveCollection = () => {
    setActiveCollectionKey(null)
  }

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
    setTaskViews(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(group => {
        if (group.id !== groupId) return group
        return {
          ...group,
          tasks: group.tasks.map(task => {
            if (task.id !== taskId) return task
            return { ...task, done: !task.done }
          }),
        }
      }),
    }))
  }

  const handleAddTask = (task: TaskItem, groupId: string) => {
    if (activeCollectionKey && activeChecklistGroups) {
      setCustomChecklistGroups(prev => ({
        ...prev,
        [activeCollectionKey]: prev[activeCollectionKey].map(group => (
          group.id === groupId ? { ...group, tasks: [...group.tasks, task] } : group
        )),
      }))
      return
    }

    if (activeCollectionKey && activeCollection) {
      setTaskCollections(prev => ({
        ...prev,
        [activeCollectionKey]: {
          ...prev[activeCollectionKey],
          items: [
            {
              id: task.id,
              title: task.title,
              done: task.done,
              meta: task.dueDate?.trim() || '',
              assignees: task.assignees,
            },
            ...prev[activeCollectionKey].items,
          ],
        },
      }))
      return
    }

    setTaskViews(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(group => {
        if (group.id !== groupId) return group
        return { ...group, tasks: [...group.tasks, task] }
      }),
    }))
  }

  const toggleCustomChecklistTaskDone = (checklistKey: TaskCollectionId, groupId: string, taskId: string) => {
    setCustomChecklistGroups(prev => ({
      ...prev,
      [checklistKey]: prev[checklistKey].map(group => {
        if (group.id !== groupId) return group
        return {
          ...group,
          tasks: group.tasks.map(task => (
            task.id === taskId ? { ...task, done: !task.done } : task
          )),
        }
      }),
    }))
  }

  const toggleCollectionTaskDone = (collectionKey: TaskCollectionId, taskId: string) => {
    setTaskCollections(prev => ({
      ...prev,
      [collectionKey]: {
        ...prev[collectionKey],
        items: prev[collectionKey].items.map(item => (
          item.id === taskId ? { ...item, done: !item.done } : item
        )),
      },
    }))
  }

  const openGroupTaskDetail = (group: TaskGroup, task: TaskItem) => {
    const assigneeBadge = pickDetailAssigneeBadge(task.assignees)
    setSelectedTaskDetail({
      id: task.id,
      title: task.title,
      done: task.done,
      sourceRef: { kind: 'group', groupId: group.id },
      sourceText: buildTaskDetailSourceText(task.title),
      noteLabel: '创建于建国：建国',
      assigneeBadge,
      assigneeName: getTaskAssigneeName(assigneeBadge),
      groupName: group.name,
      dateChoice: getDetailDateChoice(task.dueDate),
      commentTime: '5月14日 14:27',
    })
  }

  const openCollectionTaskDetail = (collectionKey: TaskCollectionId, task: TaskCollectionItem) => {
    const assigneeBadge = pickDetailAssigneeBadge(task.assignees)
    setSelectedTaskDetail({
      id: task.id,
      title: task.title,
      done: task.done,
      sourceRef: { kind: 'collection', collectionKey },
      sourceText: buildTaskDetailSourceText(task.title),
      noteLabel: '创建于建国：建国',
      assigneeBadge,
      assigneeName: getTaskAssigneeName(assigneeBadge),
      groupName: '默认分组',
      dateChoice: getDetailDateChoice(task.meta),
      commentTime: '5月14日 14:27',
    })
  }

  const openChecklistTaskDetail = (checklistKey: TaskCollectionId, group: TaskGroup, task: TaskItem) => {
    const assigneeBadge = pickDetailAssigneeBadge(task.assignees)
    setSelectedTaskDetail({
      id: task.id,
      title: task.title,
      done: task.done,
      sourceRef: { kind: 'checklist', checklistKey, groupId: group.id },
      sourceText: buildTaskDetailSourceText(task.title),
      noteLabel: '创建于建国：建国',
      assigneeBadge,
      assigneeName: getTaskAssigneeName(assigneeBadge),
      groupName: group.name,
      dateChoice: getDetailDateChoice(task.dueDate),
      commentTime: '5月14日 14:27',
    })
  }

  const handleDetailToggleDone = () => {
    if (!selectedTaskDetail) return

    if (selectedTaskDetail.sourceRef.kind === 'group') {
      toggleTaskDone(selectedTaskDetail.sourceRef.groupId, selectedTaskDetail.id)
    } else if (selectedTaskDetail.sourceRef.kind === 'checklist') {
      toggleCustomChecklistTaskDone(
        selectedTaskDetail.sourceRef.checklistKey,
        selectedTaskDetail.sourceRef.groupId,
        selectedTaskDetail.id,
      )
    } else {
      toggleCollectionTaskDone(selectedTaskDetail.sourceRef.collectionKey, selectedTaskDetail.id)
    }

    setSelectedTaskDetail(prev => (
      prev ? { ...prev, done: !prev.done } : prev
    ))
  }

  useEffect(() => {
    if (showDrawer) return
    setShowDrawerCreateSheet(false)
    setDrawerCreateDialog(null)
    setDrawerCreateName('')
  }, [showDrawer])

  useEffect(() => {
    if (showDrawer) {
      setShowTaskFilters(false)
    }
  }, [showDrawer])

  const openDrawerCreateDialog = (kind: DrawerCreateKind) => {
    setShowDrawerCreateSheet(false)
    setDrawerCreateDialog(kind)
    setDrawerCreateName('')
  }

  const closeDrawerCreateDialog = () => {
    setDrawerCreateDialog(null)
    setDrawerCreateName('')
  }

  const handleCreateDrawerEntity = () => {
    if (!trimmedDrawerCreateName || !drawerCreateDialog) return

    if (drawerCreateDialog === 'checklist') {
      const nextKey = `custom-${Date.now()}` as TaskCollectionId
      const nextItem: TaskDrawerChecklistItem = { key: nextKey, label: trimmedDrawerCreateName }
      const defaultGroupId = `${nextKey}-default`

      setDrawerChecklistGroups(prev => {
        if (prev.length === 0) {
          return [{ id: 'drawer-group-default', label: '', items: [nextItem] }]
        }

        return prev.map((group, index) => (
          index === prev.length - 1
            ? { ...group, items: [...group.items, nextItem] }
            : group
        ))
      })

      setTaskCollections(prev => ({
        ...prev,
        [nextKey]: {
          label: trimmedDrawerCreateName,
          items: [],
        },
      }))
      setCustomChecklistGroups(prev => ({
        ...prev,
        [nextKey]: [
          {
            id: defaultGroupId,
            name: '默认分组',
            showAddRow: true,
            tasks: [],
          },
        ],
      }))
      setActiveCollectionKey(nextKey)
      setShowDrawer(false)
    } else {
      setDrawerChecklistGroups(prev => [
        ...prev,
        {
          id: `drawer-group-${Date.now()}`,
          label: trimmedDrawerCreateName,
          items: [],
        },
      ])
    }

    closeDrawerCreateDialog()
  }

  const renderTaskGroupSection = (
    group: TaskGroup,
    onOpenTask: (task: TaskItem) => void,
    onToggleTask: (taskId: string) => void,
  ) => {
    const isCollapsed = collapsedGroups.has(group.id)

    return (
      <section className="task-group" key={group.id}>
        <div
          className="task-group-header"
          onClick={() => toggleGroup(group.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleGroup(group.id)
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="task-group-header-main">
            <CollapseIcon open={!isCollapsed} />
            <span className="task-group-name">{group.name}</span>
            {group.countLabel && <span className="task-group-count">{group.countLabel}</span>}
          </div>
          <button
            className="task-group-more"
            type="button"
            aria-label="更多"
            onClick={(event) => event.stopPropagation()}
          >
            <GroupMoreIcon />
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="task-group-panel">
              {group.showAddRow && (
                <button className="task-add-inline" type="button" onClick={() => setShowAddTask(true)}>
                  添加任务
                </button>
              )}

              {group.tasks.map(task => (
                <div
                  className={`task-item ${task.done ? 'is-done' : ''}`}
                  key={task.id}
                  onClick={() => onOpenTask(task)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onOpenTask(task)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <button
                    className={`task-check ${task.done ? 'is-checked' : ''}`}
                    type="button"
                    aria-label={task.done ? '标记为未完成' : '标记为完成'}
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggleTask(task.id)
                    }}
                  >
                    {task.done && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  <div className="task-body">
                    <div className="task-title">{task.title}</div>
                  </div>

                  {task.assignees.length > 0 && (
                    <div className="task-assignee-stack">
                      {task.assignees.map((badge, index) => renderTaskAssigneeBadge(badge, index))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {group.showDividerAfter && <div className="task-group-divider" />}
          </>
        )}
      </section>
    )
  }

  const isDrawerOpen = showDrawer

  return (
    <div className={`task-page ${isDrawerOpen ? 'is-drawer-open' : ''}`}>
      <div className="task-header">
        <div className="task-header-left">
          <img className="task-avatar" src={taskAvatarSrc} alt="任务头像" />
          <div className="task-header-title">任务</div>
        </div>
        <div className="task-header-right">
          <button className="task-icon-btn" type="button" aria-label="搜索">
            <SearchIcon />
          </button>
          <button className="task-icon-btn" type="button" aria-label="设置">
            <SettingsIcon />
          </button>
        </div>
      </div>

      <div className={`task-toolbar ${isDrawerOpen ? 'is-drawer-open' : ''}`}>
        <button className="task-menu-btn" type="button" aria-label="任务菜单" onClick={() => setShowDrawer((current) => !current)}>
          <TaskMenuIcon />
        </button>

        {!isDrawerOpen && (
          <>
            {activeCollection ? (
              <>
                <div className="task-toolbar-pill">
                  <span className="task-toolbar-pill-label">{activeCollection.label}</span>
                  <button className="task-toolbar-pill-clear" type="button" aria-label="清除当前分类" onClick={clearActiveCollection}>
                    <TaskChipCloseIcon />
                  </button>
                </div>
                <div className="task-toolbar-spacer" />
              </>
            ) : (
              <div className="task-tabs">
                <button
                  className={`task-tab-btn ${activeTab === 'mine' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('mine')}
                >
                  我负责的
                </button>
                <button
                  className={`task-tab-btn ${activeTab === 'followed' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('followed')}
                >
                  我关注的
                </button>
              </div>
            )}

            <button
              className={`task-filter-btn ${showTaskFilters ? 'is-active' : ''}`}
              type="button"
              aria-label="筛选"
              onClick={() => setShowTaskFilters((current) => !current)}
            >
              <TaskFilterIcon />
            </button>
          </>
        )}
      </div>

      {showTaskFilters && !isDrawerOpen && (
        <div className="task-filter-bar" aria-label="筛选选项">
          <button className="task-filter-chip" type="button">
            <span>未完成</span>
            <ChevronDownIcon color="#7f858f" />
          </button>
          <button className="task-filter-chip" type="button">
            <span>分组：自定义分组</span>
            <ChevronDownIcon color="#7f858f" />
          </button>
          <button className="task-filter-chip" type="button">
            <span>排序：拖拽自定义</span>
            <ChevronDownIcon color="#7f858f" />
          </button>
        </div>
      )}

      <div className="task-body-stage">
        <aside className="task-drawer-panel" aria-label="任务抽屉" aria-hidden={!isDrawerOpen}>
          <div className="task-drawer-scroll">
            <div className="task-drawer-primary">
              {taskDrawerPrimaryItems.map((item) => {
                const isActive = item.key === activeTab && activeCollectionKey === null
                  ? true
                  : activeCollectionKey === item.key
                return (
                  <button
                    className={`task-drawer-primary-item ${isActive ? 'is-active' : ''}`}
                    key={item.key}
                    type="button"
                    onClick={() => handleDrawerPrimarySelect(item.key)}
                  >
                    <span className="task-drawer-primary-icon">{renderTaskDrawerPrimaryIcon(item.key, isActive)}</span>
                    <span className="task-drawer-primary-label">{item.label}</span>
                    {item.count && <span className="task-drawer-primary-count">{item.count}</span>}
                  </button>
                )
              })}
            </div>

            <div className="task-drawer-divider" />

            <section className="task-drawer-section">
              <div className="task-drawer-section-header">
                <CollapseIcon open />
                <span className="task-drawer-section-title">快速访问</span>
              </div>

              <div className="task-drawer-quick-list">
                {taskDrawerQuickAccessItems.map((item) => (
                  <button
                    className={`task-drawer-quick-item ${activeCollectionKey === item.key ? 'is-active' : ''}`}
                    key={item.key}
                    type="button"
                    onClick={() => handleDrawerCollectionSelect(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="task-drawer-divider is-spaced" />

            <section className="task-drawer-section">
              <div className="task-drawer-section-header with-action">
                <span className="task-drawer-section-leading">
                  <span className="task-drawer-section-list-icon">
                    <DrawerChecklistIcon />
                  </span>
                  <span className="task-drawer-section-title">任务清单</span>
                </span>

	                <button
	                  className="task-drawer-add-btn"
	                  type="button"
	                  aria-label="添加任务清单"
	                  onClick={() => setShowDrawerCreateSheet(true)}
	                >
	                  +
	                </button>
	              </div>

	              <div className="task-drawer-list">
	                {drawerChecklistGroups.map((group) => (
	                  <div className="task-drawer-list-group" key={group.id}>
	                    {group.label && <div className="task-drawer-list-group-title">{group.label}</div>}

	                    {group.items.map((item) => (
	                      <button
	                        className={`task-drawer-list-item ${activeCollectionKey === item.key ? 'is-active' : ''}`}
	                        key={item.key}
	                        type="button"
	                        onClick={() => handleDrawerCollectionSelect(item.key)}
	                      >
	                        <span className="task-drawer-list-item-icon">
	                          <DrawerChecklistIcon />
	                        </span>
	                        <span className="task-drawer-list-item-name">{item.label}</span>
	                        <span className="task-drawer-list-item-more">
	                          <GroupMoreIcon />
	                        </span>
	                      </button>
	                    ))}
	                  </div>
	                ))}
	              </div>
	            </section>
	          </div>
	        </aside>

	        <div className={`task-main-shell ${isDrawerOpen ? 'is-drawer-open' : ''}`}>
	          <div className="task-content">
	            {activeCollection && !activeChecklistGroups ? (
	              <div className="task-collection-list">
	                {activeCollection.items.map(task => (
                  <div
                    className={`task-collection-item ${task.done ? 'is-done' : ''}`}
                    key={task.id}
                    onClick={() => activeCollectionKey && openCollectionTaskDetail(activeCollectionKey, task)}
                    onKeyDown={(event) => {
                      if ((event.key === 'Enter' || event.key === ' ') && activeCollectionKey) {
                        event.preventDefault()
                        openCollectionTaskDetail(activeCollectionKey, task)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <button
                      className={`task-collection-check ${task.done ? 'is-checked' : ''}`}
                      type="button"
                      aria-label={task.done ? '标记为未完成' : '标记为完成'}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (activeCollectionKey) {
                          toggleCollectionTaskDone(activeCollectionKey, task.id)
                        }
                      }}
                    >
                      {task.done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <div className="task-collection-body">
                      <div className="task-collection-title">{task.title}</div>
                      <div className="task-collection-meta">
                        <span>{task.meta}</span>
                        {task.metaIcon && task.metaValue && (
                          <span className="task-collection-meta-tail">
                            <span className="task-collection-meta-divider">|</span>
                            <span className="task-collection-meta-inline-icon">{renderTaskCollectionMetaIcon(task.metaIcon)}</span>
                            <span>{task.metaValue}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {task.assignees.length > 0 && (
                      <div className="task-assignee-stack is-collection">
                        {task.assignees.map((badge, index) => renderTaskAssigneeBadge(badge, index))}
                      </div>
                    )}
                  </div>
	                ))}
	              </div>
	            ) : currentTaskGroups.map(group => (
	              renderTaskGroupSection(
	                group,
	                (task) => {
	                  if (activeChecklistGroups && activeCollectionKey) {
	                    openChecklistTaskDetail(activeCollectionKey, group, task)
	                    return
	                  }
	                  openGroupTaskDetail(group, task)
	                },
	                (taskId) => {
	                  if (activeChecklistGroups && activeCollectionKey) {
	                    toggleCustomChecklistTaskDone(activeCollectionKey, group.id, taskId)
	                    return
	                  }
	                  toggleTaskDone(group.id, taskId)
	                },
	              )
	            ))}
	          </div>

          <button className="task-fab" type="button" aria-label="添加任务" onClick={() => setShowAddTask(true)}>
            <AddTaskIcon />
          </button>

          {isDrawerOpen && (
            <button className="task-main-scrim" type="button" aria-label="关闭任务菜单" onClick={() => setShowDrawer(false)} />
          )}
        </div>
      </div>

	      {showAddTask && (
	        <AddTaskSheet
	          onClose={() => setShowAddTask(false)}
          onAdd={handleAddTask}
          groupOptions={groupOptions.length > 0 ? groupOptions : [{ id: 'default', name: '默认分组' }]}
          defaultGroupId={addTargetGroupId || groupOptions[0]?.id || 'default'}
	        />
	      )}

	      {showDrawerCreateSheet && (
	        <div className="task-drawer-create-sheet-overlay" onClick={() => setShowDrawerCreateSheet(false)}>
	          <div className="task-drawer-create-sheet" onClick={(event) => event.stopPropagation()}>
	            <div className="task-drawer-create-sheet-group">
	              <button className="task-drawer-create-sheet-option" type="button" onClick={() => openDrawerCreateDialog('checklist')}>
	                新建任务清单
	              </button>
	              <button className="task-drawer-create-sheet-option" type="button" onClick={() => openDrawerCreateDialog('group')}>
	                新建清单分组
	              </button>
	            </div>

	            <button className="task-drawer-create-sheet-cancel" type="button" onClick={() => setShowDrawerCreateSheet(false)}>
	              取消
	            </button>
	          </div>
	        </div>
	      )}

	      {drawerCreateDialog && (
	        <div className="task-drawer-create-dialog-overlay" onClick={closeDrawerCreateDialog}>
	          <div className="task-drawer-create-dialog" onClick={(event) => event.stopPropagation()}>
	            <div className="task-drawer-create-dialog-title">
	              {drawerCreateDialog === 'checklist' ? '新建任务清单' : '新建清单分组'}
	            </div>

	            <div className="task-drawer-create-dialog-body">
	              <input
	                autoFocus
	                className="task-drawer-create-dialog-input"
	                type="text"
	                value={drawerCreateName}
	                onChange={(event) => setDrawerCreateName(event.target.value)}
	                onKeyDown={(event) => {
	                  if (event.key === 'Enter' && trimmedDrawerCreateName) {
	                    handleCreateDrawerEntity()
	                  }
	                }}
	                placeholder={drawerCreateDialog === 'checklist' ? '输入清单名称' : '输入分组名称'}
	              />
	            </div>

	            <div className="task-drawer-create-dialog-actions">
	              <button className="task-drawer-create-dialog-btn" type="button" onClick={closeDrawerCreateDialog}>
	                取消
	              </button>
	              <button
	                className="task-drawer-create-dialog-btn is-primary"
	                type="button"
	                disabled={!trimmedDrawerCreateName}
	                onClick={handleCreateDrawerEntity}
	              >
	                创建
	              </button>
	            </div>
	          </div>
	        </div>
	      )}

	      {selectedTaskDetail && (
	        <TaskDetailPage
          key={selectedTaskDetail.id}
          detail={selectedTaskDetail}
          onClose={() => setSelectedTaskDetail(null)}
          onToggleDone={handleDetailToggleDone}
        />
      )}
    </div>
  )
}
