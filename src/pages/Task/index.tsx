import { useState } from 'react'
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

const taskDrawerListItems: Array<{ key: TaskCollectionKey; label: string }> = [
  { key: 'list-guoren-630', label: '果仁-6.30' },
  { key: 'list-scenario-training', label: '场景-培训项目' },
  { key: 'list-guoren-mvp', label: '果仁-mvp版本（3.31）' },
  { key: 'list-ai-training', label: '果仁-人工智能通识培训（4.30）' },
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

const initialTaskCollectionViews: Record<TaskCollectionKey, TaskCollectionView> = {
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
  const [taskCollections, setTaskCollections] = useState(initialTaskCollectionViews)
  const [activeCollectionKey, setActiveCollectionKey] = useState<TaskCollectionKey | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)

  const visibleGroups = taskViews[activeTab]
  const activeCollection = activeCollectionKey ? taskCollections[activeCollectionKey] : null
  const groupOptions = visibleGroups.map(group => ({ id: group.id, name: group.name }))
  const addTargetGroupId = visibleGroups.find(group => group.name === '默认分组')?.id ?? visibleGroups[0]?.id ?? ''

  const handleDrawerPrimarySelect = (key: TaskDrawerPrimaryKey) => {
    if (key === 'mine' || key === 'followed') {
      setActiveTab(key)
      setActiveCollectionKey(null)
    } else {
      setActiveCollectionKey(key)
    }
    setShowDrawer(false)
  }

  const handleDrawerCollectionSelect = (key: TaskCollectionKey) => {
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
    setTaskViews(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(group => {
        if (group.id !== groupId) return group
        return { ...group, tasks: [...group.tasks, task] }
      }),
    }))
  }

  const toggleCollectionTaskDone = (collectionKey: TaskCollectionKey, taskId: string) => {
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

            <button className="task-filter-btn" type="button" aria-label="筛选">
              <TaskFilterIcon />
            </button>
          </>
        )}
      </div>

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

                <button className="task-drawer-add-btn" type="button" aria-label="添加任务清单">
                  +
                </button>
              </div>

              <div className="task-drawer-list">
                {taskDrawerListItems.map((item) => (
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
            </section>
          </div>
        </aside>

        <div className={`task-main-shell ${isDrawerOpen ? 'is-drawer-open' : ''}`}>
          <div className="task-content">
            {activeCollection ? (
              <div className="task-collection-list">
                {activeCollection.items.map(task => (
                  <div className={`task-collection-item ${task.done ? 'is-done' : ''}`} key={task.id}>
                    <button
                      className={`task-collection-check ${task.done ? 'is-checked' : ''}`}
                      type="button"
                      aria-label={task.done ? '标记为未完成' : '标记为完成'}
                      onClick={() => activeCollectionKey && toggleCollectionTaskDone(activeCollectionKey, task.id)}
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
            ) : visibleGroups.map(group => {
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
                          <div className={`task-item ${task.done ? 'is-done' : ''}`} key={task.id}>
                            <button
                              className={`task-check ${task.done ? 'is-checked' : ''}`}
                              type="button"
                              aria-label={task.done ? '标记为未完成' : '标记为完成'}
                              onClick={() => toggleTaskDone(group.id, task.id)}
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
            })}
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
    </div>
  )
}
