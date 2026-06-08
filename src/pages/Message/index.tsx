import { useEffect, useMemo, useState } from 'react'
import './index.css'

type MessageFilter = 'message' | 'unread' | 'marked'
type GroupMode = 'dialog' | 'topic'
type CreateGroupEntryKind = 'contact' | 'branch' | 'face'
type AvatarTone =
  | 'olive'
  | 'gold'
  | 'green'
  | 'violet'
  | 'pink'
  | 'teal'
  | 'blue'
  | 'lilac'
  | 'gray'
  | 'orange'
  | 'peach'
  | 'sky'
type AvatarIconName = 'meeting' | 'device' | 'team' | 'chevron' | 'person'

type AvatarSpec =
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'text'; lines: string[]; tone: AvatarTone; filled?: boolean }
  | { kind: 'icon'; icon: AvatarIconName; tone: AvatarTone; filled?: boolean }

type ChannelGroup = {
  id: string
  label: string
  avatar: AvatarSpec
}

type ConversationKind = 'default' | 'topic'

type ConversationItem = {
  id: string
  title: string
  preview: string
  time: string
  avatar: AvatarSpec
  unread: boolean
  marked: boolean
  badge?: string
  muted?: boolean
  status?: 'resolved'
  kind?: ConversationKind
  topicDetailId?: string
  labelTag?: string
}

type CreateGroupEntry = {
  id: string
  label: string
  kind: CreateGroupEntryKind
  tone?: string
}

type TopicFeedPost = {
  id: string
  author: string
  time: string
  avatarTone: 'pink' | 'green' | 'coffee'
  content: string
  link?: string
  detail?: string
  replyHeader?: string
  replies?: string[]
  reactions?: string[]
  subscribed?: boolean
}

type TopicConversationDetail = {
  id: string
  title: string
  badge: string
  posts: TopicFeedPost[]
}

const filterTabs: Array<{ id: MessageFilter; label: string }> = [
  { id: 'message', label: '消息' },
  { id: 'unread', label: '未读' },
  { id: 'marked', label: '标记' },
]

const createGroupPrimaryEntries: CreateGroupEntry[] = [
  { id: 'managed', label: '我管理的群组', kind: 'contact', tone: '#47b25b' },
  { id: 'external', label: '外部联系人', kind: 'contact', tone: '#5a6fff' },
  { id: 'internal', label: '组织内联系人', kind: 'contact', tone: '#2ea7f8' },
  { id: 'architecture', label: '架构组', kind: 'branch' },
  { id: 'rd', label: '研发组', kind: 'branch' },
]

const createGroupSecondaryEntries: CreateGroupEntry[] = [
  { id: 'face', label: '面对面建群', kind: 'face', tone: '#f2b320' },
]

const channelGroups: ChannelGroup[] = [
  {
    id: 'zhang',
    label: '张洪磊',
    avatar: { kind: 'image', src: '/assets/果仁头像-手机.png', alt: '张洪磊' },
  },
  {
    id: 'jianguo',
    label: '建国',
    avatar: { kind: 'text', lines: ['建'], tone: 'peach', filled: true },
  },
  {
    id: 'rd',
    label: '研发管理',
    avatar: { kind: 'text', lines: ['研发', '管理'], tone: 'olive' },
  },
  {
    id: 'devops',
    label: 'AI devOps',
    avatar: { kind: 'icon', icon: 'team', tone: 'gold' },
  },
  {
    id: 'backend',
    label: 'AI后端组',
    avatar: { kind: 'text', lines: ['AI后', '端组'], tone: 'green' },
  },
  {
    id: 'guoren',
    label: '果仁',
    avatar: { kind: 'text', lines: ['果仁'], tone: 'violet' },
  },
  {
    id: 'expand',
    label: '展开',
    avatar: { kind: 'icon', icon: 'chevron', tone: 'gray', filled: true },
  },
]

const conversations: ConversationItem[] = [
  {
    id: 'ai-recorder',
    title: '安克 AI 录音豆',
    preview: '设备未连接',
    time: '06:49',
    avatar: { kind: 'icon', icon: 'device', tone: 'lilac', filled: true },
    unread: true,
    marked: false,
  },
  {
    id: 'scheduler-alert',
    title: '海豚调度警告-测试',
    preview: "海豚调度警告-测试: `scheduler failed` projectCod...",
    time: '01:01',
    avatar: { kind: 'text', lines: ['海豚', '调度'], tone: 'pink' },
    badge: '771',
    unread: true,
    marked: true,
    muted: true,
  },
  {
    id: 'monitor-alert',
    title: '监控报警 6.0',
    preview: '阿里云 ttcdw6.0: DAS - 运维日报推送',
    time: '昨天',
    avatar: { kind: 'text', lines: ['报警'], tone: 'violet' },
    badge: '225',
    unread: true,
    marked: true,
    muted: true,
  },
  {
    id: 'pressure',
    title: '性能压测',
    preview: 'apaas 性能日报: 📈 apaas 性能监控日报',
    time: '昨天',
    avatar: { kind: 'text', lines: ['性能', '压测'], tone: 'teal' },
    unread: true,
    marked: false,
  },
  {
    id: 'wang',
    title: '王海鸥',
    preview: '他的问题解决了吗？',
    time: '6月6日',
    avatar: { kind: 'icon', icon: 'person', tone: 'peach', filled: true },
    unread: false,
    marked: true,
    status: 'resolved',
  },
  {
    id: 'guoren-chat',
    title: '果仁',
    preview: '王海鸥: 后端发版',
    time: '6月6日',
    avatar: { kind: 'text', lines: ['果仁'], tone: 'violet' },
    unread: false,
    marked: false,
  },
  {
    id: 'prd',
    title: 'GenAI 听海轩🌊',
    preview: '付烬: 大佬们好，想工作之余系统地学一下 Harness 工程...',
    time: '6月6日',
    avatar: { kind: 'icon', icon: 'team', tone: 'gold' },
    unread: false,
    marked: false,
    kind: 'topic',
    topicDetailId: 'genai-topic',
    labelTag: '话题',
  },
  {
    id: 'zhang-rk',
    title: '张容恺',
    preview: '收到，今天上午合一下接口字段。',
    time: '6月6日',
    avatar: { kind: 'text', lines: ['容恺'], tone: 'blue', filled: true },
    unread: false,
    marked: false,
  },
]

const topicConversationDetails: Record<string, TopicConversationDetail> = {
  'genai-topic': {
    id: 'genai-topic',
    title: 'GenAI 听海轩🌊',
    badge: '外部',
    posts: [
      {
        id: 'post-1',
        author: '付烬',
        time: '6月2日 15:53',
        avatarTone: 'pink',
        content:
          '大佬们好，想工作之余系统地学一下 Harness 工程，跪求有没有大佬有当初 Claude 泄露的五十万行代码的最早的源文件版本保存了一份，不是洗过一次的那个版本的，不胜感激。🤔',
        replyHeader: '查看更多 4 条回复',
        replies: ['付烬: [表情]', '付烬: @亦军(姜亦军) okok,感谢大佬'],
        reactions: ['👍', '🕊️'],
        subscribed: true,
      },
      {
        id: 'post-2',
        author: '用户 032139',
        time: '6月3日 10:44',
        avatarTone: 'green',
        content: '用 agent 去互联网爬虫 如何能合规？ 大家怎么做的？',
        replies: [
          '黄佳文: 爬虫有合规一说？',
          'ii 阿 狸，: 爬别怕，怕别爬，真想合规 外包出去 风险转移 大厂不怕你爬，各种加密等着你 但是涉及需要登陆后的 cookie 才...',
        ],
        subscribed: false,
      },
      {
        id: 'post-3',
        author: '代浩然',
        time: '6月3日 11:28',
        avatarTone: 'coffee',
        content: '',
        link: 'https://github.com/dhr613/langchain_checkpointer_mysql_without_binary.git',
        detail:
          '适配 mysql 的 checkpointer，将 checkpoint_na__ 修改为 varchar32 位代码做了简略，基本功能齐全。暂时用不到，所以没做...',
        subscribed: true,
      },
    ],
  },
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
}

function MenuLinesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#474c54" strokeWidth="2.2" strokeLinecap="round">
      <path d="M7 6.5h10" />
      <path d="M5 12h8" />
      <path d="M7 17.5h10" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function SingleChatActionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8.2" r="3" />
      <path d="M4.8 18a5.2 5.2 0 0 1 10.4 0" />
      <path d="M18 7.2v6.2" />
      <path d="M14.9 10.3h6.2" />
    </svg>
  )
}

function CreateGroupActionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.6" cy="8.8" r="2.5" />
      <circle cx="15.3" cy="10.2" r="2.1" />
      <path d="M4.8 17a4.4 4.4 0 0 1 7.6 0" />
      <path d="M13.2 17.2a3.9 3.9 0 0 1 5.8 0" />
      <path d="M18.7 4.9v3.4" />
      <path d="M17 6.6h3.4" />
    </svg>
  )
}

function FaceToFaceGroupIcon({ tone = '#f2b320' }: { tone?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.4" cy="9.2" r="2.3" />
      <circle cx="15.7" cy="9.2" r="2.3" />
      <path d="M4.6 18a4.6 4.6 0 0 1 7.6 0" />
      <path d="M11.8 18a4.6 4.6 0 0 1 7.6 0" />
    </svg>
  )
}

function PreviewVideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.8" y="5.5" width="11.8" height="13" rx="1.8" />
      <path d="m16.8 10 3.4-2.1v8.2l-3.4-2.1z" />
    </svg>
  )
}

function PreviewDotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18" cy="12" r="1.7" />
    </svg>
  )
}

function PreviewSmileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M9 10h.01M15 10h.01" />
      <path d="M8.3 14.1a5.3 5.3 0 0 0 7.4 0" />
    </svg>
  )
}

function PreviewAtIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M15.4 15.2c-.95.92-2.55 1.03-3.63.16-1.1-.88-1.27-2.52-.39-3.64.87-1.11 2.45-1.37 3.58-.58 1.1.77 1.51 2.31.86 3.49-.64 1.18-2.08 1.78-3.39 1.46" />
    </svg>
  )
}

function PreviewMicAIIcon() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 4.2a3 3 0 0 1 6 0v3.6a3 3 0 1 1-6 0Z" />
      <path d="M6.3 8.7a5.7 5.7 0 0 0 11.4 0" />
      <path d="M12 14.4v2.3" />
      <path d="M9.1 16.7h5.8" />
      <path d="M19.8 4.8h2.3M20.95 3.65v2.3" />
    </svg>
  )
}

function PreviewImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.2" y="5" width="15.6" height="14" rx="1.8" />
      <circle cx="9.1" cy="10" r="1.3" />
      <path d="m19.8 15.6-4.7-4.7-6.1 6.1" />
    </svg>
  )
}

function PreviewAaIcon() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3.8 14.4 3.1-9 3.1 9" />
      <path d="M5.2 10.6h3.4" />
      <path d="M14.2 14.2v-4.5a2.3 2.3 0 0 1 4.6 0v4.5" />
      <path d="M14.2 11.9h4.6" />
    </svg>
  )
}

function ContactGroupIcon({ tone }: { tone: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8.6" r="2.5" />
      <path d="M4.9 17a4.6 4.6 0 0 1 8.2 0" />
      <circle cx="16.6" cy="10.2" r="2.1" opacity="0.9" />
      <path d="M13.6 17.2a4 4 0 0 1 6 0" opacity="0.9" />
    </svg>
  )
}

function RightChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function GroupGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="10" r="3.1" fill="currentColor" opacity="0.95" />
      <circle cx="15.2" cy="10.8" r="2.5" fill="currentColor" opacity="0.7" />
      <path d="M4.7 17.2a4.8 4.8 0 0 1 8.6 0" fill="currentColor" />
      <path d="M12.1 17.5a3.85 3.85 0 0 1 6.2-1.8v1.8h-6.2Z" fill="currentColor" opacity="0.78" />
    </svg>
  )
}

function MeetingGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="5.4" width="11" height="12" rx="2.2" fill="currentColor" opacity="0.15" />
      <rect x="5.8" y="7" width="9.4" height="8.7" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.2 5.2v2.3M12.8 5.2v2.3M5.8 10h9.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.7 13.9a2.75 2.75 0 0 0 1.9-2.6 2.8 2.8 0 1 0-5.6 0c0 1 .53 1.87 1.32 2.36v1.23h2.4v-.98Z" fill="currentColor" />
      <path d="M15.4 17.5h1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function DeviceGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="7.1" y="4.8" width="9.8" height="14.6" rx="3.4" fill="#fff" opacity="0.95" />
      <path d="M9.2 6.8h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="1.1" fill="currentColor" />
      <path d="M7.1 8.7h9.8" stroke="currentColor" strokeWidth="1.3" opacity="0.35" />
    </svg>
  )
}

function PersonGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.4" r="3.2" fill="currentColor" opacity="0.95" />
      <path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ChevronGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

function MutedBellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b1b4bc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 19a2.5 2.5 0 0 1-5 0" />
      <path d="M18 10.6a6 6 0 0 0-5-5.9" opacity="0.45" />
      <path d="M10.2 4.9A6 6 0 0 0 6 10.6c0 4-1.8 5.6-1.8 5.6H16" opacity="0.45" />
      <path d="m4 4 16 16" />
    </svg>
  )
}

function ResolvedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.2" fill="#1db58d" opacity="0.16" />
      <circle cx="12" cy="12" r="7.2" stroke="#25b48f" strokeWidth="1.8" />
      <path d="m8.7 12 2.2 2.2 4.4-4.5" stroke="#25b48f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TopicMoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18" cy="12" r="1.7" />
    </svg>
  )
}

function TopicLikeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.4 10.4v8.1" />
      <path d="M10.6 10.4 13 5.7a2 2 0 0 1 3.8.9v3.8h2.2a1.8 1.8 0 0 1 1.8 2l-.7 5.3a2 2 0 0 1-2 1.7H10.6" />
      <path d="M4.2 10.4h3.2v9.8H4.2a1 1 0 0 1-1-1v-7.8a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function TopicCommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.2 6.3h13.6A1.9 1.9 0 0 1 20.7 8.2v7a1.9 1.9 0 0 1-1.9 1.9H11l-4.4 3v-3H5.2a1.9 1.9 0 0 1-1.9-1.9v-7a1.9 1.9 0 0 1 1.9-1.9Z" />
    </svg>
  )
}

function TopicShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9.2 14.8 8.6-8.6" />
      <path d="M13.1 6.2h4.7v4.7" />
      <path d="M18.1 11.2v5.1a1.9 1.9 0 0 1-1.9 1.9H7.1a1.9 1.9 0 0 1-1.9-1.9V7.2a1.9 1.9 0 0 1 1.9-1.9h5.1" />
    </svg>
  )
}

function TopicBookmarkIcon() {
  return (
    <svg width="19" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4.6h10a1.8 1.8 0 0 1 1.8 1.8v13.2L12 16l-6.8 3.6V6.4A1.8 1.8 0 0 1 7 4.6Z" />
    </svg>
  )
}

function FloatingPlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 6.2v11.6" />
      <path d="M6.2 12h11.6" />
    </svg>
  )
}

function AvatarGlyph({ icon }: { icon: AvatarIconName }) {
  switch (icon) {
    case 'meeting':
      return <MeetingGlyph />
    case 'device':
      return <DeviceGlyph />
    case 'team':
      return <GroupGlyph />
    case 'person':
      return <PersonGlyph />
    case 'chevron':
      return <ChevronGlyph />
    default:
      return null
  }
}

function MessageAvatar({ avatar, size = 'row', badge }: { avatar: AvatarSpec; size?: 'row' | 'chip'; badge?: string }) {
  const classNames = ['message-avatar', `message-avatar--${size}`]

  if (avatar.kind === 'image') {
    classNames.push('message-avatar--image')
  } else if (avatar.filled) {
    classNames.push(`message-avatar--filled-${avatar.tone}`)
  } else {
    classNames.push(`message-avatar--${avatar.tone}`)
  }

  return (
    <div className={classNames.join(' ')}>
      {avatar.kind === 'image' && <img src={avatar.src} alt={avatar.alt} />}
      {avatar.kind === 'text' && (
        <div className="message-avatar-stack">
          {avatar.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      )}
      {avatar.kind === 'icon' && <AvatarGlyph icon={avatar.icon} />}
      {badge && <span className="message-avatar-badge">{badge}</span>}
    </div>
  )
}

function TopicFeedAvatar({ tone }: { tone: TopicFeedPost['avatarTone'] }) {
  if (tone === 'green') {
    return (
      <div className={`topic-feed-avatar tone-${tone}`}>
        <PersonGlyph />
      </div>
    )
  }

  return (
    <div className={`topic-feed-avatar tone-${tone}`}>
      <span>{tone === 'pink' ? '付' : '代'}</span>
    </div>
  )
}

function GroupModePreviewCard({ mode }: { mode: GroupMode }) {
  const title = mode === 'dialog' ? '团队沟通群 (6)' : '新人报道'
  const messages =
    mode === 'dialog'
      ? [
          { id: 'm1', name: '杰森', tone: 'blue', text: '大家好，我是新来的同学，很高兴加入团队！' },
          { id: 'm2', name: '李毅', tone: 'gray', text: '欢迎欢迎！' },
          { id: 'm3', name: '迈克', tone: 'gray', text: '中午大家一起吃个饭吧，互相熟悉一下' },
          { id: 'm4', name: '艾米', tone: 'gray', text: '欢迎！之后如果工作方面有什么问题，随时在群里问～' },
        ]
      : [
          { id: 'm1', name: '杰森', tone: 'blue', text: '# 新人报道\n大家好，我是新来的同学，很高兴加入团队！' },
          { id: 'm2', name: '李毅', tone: 'gray', text: '# 欢迎\n欢迎欢迎！' },
          { id: 'm3', name: '迈克', tone: 'gray', text: '# 午餐\n中午大家一起吃个饭吧，互相熟悉一下' },
          { id: 'm4', name: '艾米', tone: 'gray', text: '# 提问\n之后如果工作方面有什么问题，随时在群里问～' },
        ]

  return (
    <div className="group-mode-preview-card">
      <div className="group-mode-preview-header">
        <ArrowLeftIcon />
        <div className="group-mode-preview-title">
          <span>{title}</span>
          <RightChevronIcon />
        </div>
        <div className="group-mode-preview-actions">
          <PreviewVideoIcon />
          <PreviewDotsIcon />
        </div>
      </div>

      <div className="group-mode-preview-messages">
        {messages.map((message, index) => (
          <div className="group-mode-preview-message" key={message.id}>
            <div className={`group-mode-preview-avatar avatar-${index + 1}`} />
            <div className="group-mode-preview-bubble-block">
              <div className="group-mode-preview-name">{message.name}</div>
              <div className={`group-mode-preview-bubble tone-${message.tone}`}>
                {message.text.split('\n').map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="group-mode-preview-composer">
        <div className="group-mode-preview-input">
          <span>{mode === 'dialog' ? '发给 团队沟通群' : '发给 # 新人报道'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4h5v5" />
            <path d="M20 14v6h-6" />
          </svg>
        </div>
        <div className="group-mode-preview-toolbar">
          <PreviewSmileIcon />
          <PreviewAtIcon />
          <PreviewMicAIIcon />
          <PreviewImageIcon />
          <PreviewAaIcon />
          <PlusCircleIcon />
        </div>
      </div>
    </div>
  )
}

function QuickActionMenu({
  onClose,
  onCreateGroup,
  onSingleChat,
}: {
  onClose: () => void
  onCreateGroup: () => void
  onSingleChat: () => void
}) {
  return (
    <>
      <button className="message-action-menu-backdrop" type="button" aria-label="关闭快捷菜单" onClick={onClose} />
      <div className="message-action-menu" onClick={(event) => event.stopPropagation()}>
        <button className="message-action-menu-item" type="button" onClick={onSingleChat}>
          <SingleChatActionIcon />
          <span>单聊</span>
        </button>
        <button className="message-action-menu-item" type="button" onClick={onCreateGroup}>
          <CreateGroupActionIcon />
          <span>创建群组</span>
        </button>
      </div>
    </>
  )
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'root' | 'mode'>('root')
  const [groupMode, setGroupMode] = useState<GroupMode>('dialog')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="message-modal-overlay" onClick={onClose}>
      <div className="create-group-sheet-stack" onClick={(event) => event.stopPropagation()}>
        <div className="create-group-sheet-layer create-group-sheet-layer-back" />
        <div className="create-group-sheet-layer create-group-sheet-layer-middle" />

        <div className="create-group-sheet">
          {view === 'root' ? (
            <>
              <div className="create-group-sheet-header">
                <button className="create-group-sheet-close" type="button" aria-label="关闭" onClick={onClose}>
                  <CloseIcon />
                </button>
                <h2 className="create-group-sheet-title">创建群组</h2>
                <button className="create-group-sheet-submit" type="button" onClick={onClose}>
                  创建
                </button>
              </div>

              <div className="create-group-sheet-scroll">
                <div className="create-group-sheet-search-wrap">
                  <label className="create-group-sheet-search">
                    <SearchIcon />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="搜索联系人、部门和我管理的群组"
                    />
                  </label>
                </div>

                <div className="create-group-sheet-section-label">选择联系人</div>

                <button className="create-group-sheet-row create-group-sheet-row-mode" type="button" onClick={() => setView('mode')}>
                  <span className="create-group-sheet-row-title">群模式</span>
                  <div className="create-group-sheet-row-end">
                    <span className="create-group-sheet-row-value">{groupMode === 'dialog' ? '对话' : '话题'}</span>
                    <RightChevronIcon />
                  </div>
                </button>

                <div className="create-group-sheet-gap" />

                <div className="create-group-sheet-list">
                  {createGroupPrimaryEntries.map((entry) => (
                    <button className="create-group-sheet-row" type="button" key={entry.id}>
                      <div className="create-group-sheet-row-main">
                        {entry.kind === 'contact' && <ContactGroupIcon tone={entry.tone!} />}
                        {entry.kind === 'branch' && <span className="create-group-sheet-branch-mark">└</span>}
                        <span className={entry.kind === 'branch' ? 'create-group-sheet-row-title branch' : 'create-group-sheet-row-title'}>
                          {entry.label}
                        </span>
                      </div>
                      <RightChevronIcon />
                    </button>
                  ))}
                </div>

                <div className="create-group-sheet-section-label">其它方式</div>

                <div className="create-group-sheet-list">
                  {createGroupSecondaryEntries.map((entry) => (
                    <button className="create-group-sheet-row" type="button" key={entry.id}>
                      <div className="create-group-sheet-row-main">
                        <FaceToFaceGroupIcon tone={entry.tone} />
                        <span className="create-group-sheet-row-title">{entry.label}</span>
                      </div>
                      <RightChevronIcon />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="group-mode-sheet-header">
                <button className="create-group-sheet-close back" type="button" aria-label="返回" onClick={() => setView('root')}>
                  <ArrowLeftIcon />
                </button>
                <h2 className="create-group-sheet-title group-mode-title">群模式</h2>
                <span className="group-mode-header-placeholder" />
              </div>

              <div className="group-mode-sheet-scroll">
                <div className="group-mode-sheet-top-gap" />

                <div className="group-mode-sheet-content">
                  <div className="group-mode-switch">
                    <button
                      className={`group-mode-switch-option ${groupMode === 'dialog' ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => setGroupMode('dialog')}
                    >
                      对话
                    </button>
                    <button
                      className={`group-mode-switch-option ${groupMode === 'topic' ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => setGroupMode('topic')}
                    >
                      话题
                    </button>
                  </div>

                  <div className="group-mode-description">
                    {groupMode === 'dialog' ? '根据发送的先后顺序展现信息内容' : '根据话题分类展现信息内容，便于多人并行讨论'}
                  </div>

                  <div className="group-mode-preview-wrap">
                    <GroupModePreviewCard mode={groupMode} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TopicFeedCard({ post }: { post: TopicFeedPost }) {
  return (
    <article className="topic-feed-card">
      <div className="topic-feed-card-header">
        <div className="topic-feed-card-author-block">
          <TopicFeedAvatar tone={post.avatarTone} />
          <div className="topic-feed-card-meta">
            <div className="topic-feed-card-author">{post.author}</div>
            <div className="topic-feed-card-time">{post.time}</div>
          </div>
        </div>

        <button className="topic-feed-card-more" type="button" aria-label="更多">
          <TopicMoreIcon />
        </button>
      </div>

      <div className="topic-feed-card-body">
        {post.link && (
          <a
            className="topic-feed-card-link"
            href={post.link}
            onClick={(event) => event.preventDefault()}
          >
            {post.link}
          </a>
        )}

        {post.content && <p className="topic-feed-card-copy">{post.content}</p>}
        {post.detail && <p className="topic-feed-card-detail">{post.detail}</p>}

        {(post.replyHeader || post.replies?.length) && (
          <div className="topic-feed-card-replies">
            {post.replyHeader && <div className="topic-feed-card-reply-header">{post.replyHeader}</div>}
            {post.replies?.map((reply) => (
              <div className="topic-feed-card-reply-line" key={reply}>
                {reply}
              </div>
            ))}
          </div>
        )}

        {post.reactions?.length ? (
          <div className="topic-feed-card-reactions">
            {post.reactions.map((reaction) => (
              <span className="topic-feed-card-reaction-chip" key={reaction}>
                {reaction}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="topic-feed-card-actions">
        <button className="topic-feed-card-action" type="button" aria-label="点赞">
          <TopicLikeIcon />
        </button>
        <button className="topic-feed-card-action" type="button" aria-label="评论">
          <TopicCommentIcon />
        </button>
        <button className="topic-feed-card-action" type="button" aria-label="转发">
          <TopicShareIcon />
        </button>
        <button className="topic-feed-card-action" type="button" aria-label="收藏">
          <TopicBookmarkIcon />
        </button>
      </div>
    </article>
  )
}

function TopicConversationPage({
  detail,
  onBack,
}: {
  detail: TopicConversationDetail
  onBack: () => void
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'subscribed'>('all')

  useEffect(() => {
    setActiveTab('all')

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [detail.id, onBack])

  const visiblePosts = useMemo(() => {
    if (activeTab === 'subscribed') {
      return detail.posts.filter((post) => post.subscribed)
    }

    return detail.posts
  }, [activeTab, detail.posts])

  return (
    <div className="topic-conversation-page">
      <div className="topic-conversation-header-shell">
        <div className="topic-conversation-header">
          <button className="topic-conversation-nav-button" type="button" aria-label="返回" onClick={onBack}>
            <ArrowLeftIcon />
          </button>

          <div className="topic-conversation-heading">
            <div className="topic-conversation-title-wrap">
              <h2 className="topic-conversation-title">{detail.title}</h2>
              <span className="topic-conversation-badge">{detail.badge}</span>
            </div>
          </div>

          <div className="topic-conversation-header-actions">
            <button className="topic-conversation-nav-button topic-conversation-more-button" type="button" aria-label="更多">
              <TopicMoreIcon />
            </button>
            <span className="topic-conversation-dot" />
          </div>
        </div>

        <div className="topic-conversation-tabs">
          <button
            className={`topic-conversation-tab ${activeTab === 'all' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActiveTab('all')}
          >
            全部
          </button>
          <button
            className={`topic-conversation-tab ${activeTab === 'subscribed' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActiveTab('subscribed')}
          >
            我订阅的
          </button>
        </div>
      </div>

      <div className="topic-conversation-feed">
        {visiblePosts.map((post) => (
          <TopicFeedCard key={post.id} post={post} />
        ))}

        {visiblePosts.length === 0 && <div className="topic-conversation-empty">当前没有订阅内容</div>}
      </div>

      <button className="topic-conversation-fab" type="button" aria-label="新建话题">
        <FloatingPlusIcon />
      </button>
    </div>
  )
}

function MessagePage() {
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('message')
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [activeTopicDetailId, setActiveTopicDetailId] = useState<string | null>(null)

  const visibleConversations = useMemo(() => {
    if (activeFilter === 'unread') {
      return conversations.filter((item) => item.unread)
    }

    if (activeFilter === 'marked') {
      return conversations.filter((item) => item.marked)
    }

    return conversations
  }, [activeFilter])

  const activeTopicDetail = activeTopicDetailId ? topicConversationDetails[activeTopicDetailId] ?? null : null

  const openConversation = (item: ConversationItem) => {
    if (item.kind !== 'topic' || !item.topicDetailId) {
      return
    }

    setShowQuickActions(false)
    setShowCreateGroupModal(false)
    setActiveTopicDetailId(item.topicDetailId)
  }

  return (
    <div className="message-page">
      <div className="message-page-scroll">
        <div className="message-top-shell">
          <div className="message-page-inset message-titlebar">
            <h1 className="message-page-title">消息</h1>
            <div className="message-profile-actions">
              <button className="message-header-button" type="button" aria-label="搜索">
                <SearchIcon />
              </button>
              <button
                className="message-header-button"
                type="button"
                aria-label="新建"
                aria-expanded={showQuickActions}
                onClick={() => setShowQuickActions((current) => !current)}
              >
                <PlusCircleIcon />
              </button>
              {showQuickActions && (
                <QuickActionMenu
                  onClose={() => setShowQuickActions(false)}
                  onSingleChat={() => setShowQuickActions(false)}
                  onCreateGroup={() => {
                    setShowQuickActions(false)
                    setShowCreateGroupModal(true)
                  }}
                />
              )}
            </div>
          </div>

          <div className="message-channel-scroll">
            {channelGroups.map((group) => (
              <button className="message-channel-item" type="button" key={group.id}>
                <MessageAvatar avatar={group.avatar} size="chip" />
                <span className="message-channel-label">{group.label}</span>
              </button>
            ))}
          </div>

          <div className="message-page-inset message-filter-row">
            <button className="message-filter-menu" type="button" aria-label="会话菜单">
              <MenuLinesIcon />
            </button>

            <div className="message-filter-segment">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`message-filter-tab ${activeFilter === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="message-content">
          <section className="message-schedule-card">
            <MessageAvatar avatar={{ kind: 'icon', icon: 'meeting', tone: 'orange', filled: true }} />
            <div className="message-schedule-copy">
              <div className="message-schedule-title">早会</div>
              <div className="message-schedule-time">08:45 - 09:00</div>
            </div>
          </section>

          <section className="message-list">
            {visibleConversations.map((item) => (
              <article
                className={`message-row ${item.kind === 'topic' ? 'is-clickable' : ''}`}
                key={item.id}
                onClick={() => openConversation(item)}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && item.kind === 'topic') {
                    event.preventDefault()
                    openConversation(item)
                  }
                }}
                role={item.kind === 'topic' ? 'button' : undefined}
                tabIndex={item.kind === 'topic' ? 0 : undefined}
              >
                <MessageAvatar avatar={item.avatar} badge={item.badge} />

                <div className="message-row-main">
                  <div className="message-row-title-line">
                    <div className="message-row-title">{item.title}</div>
                    {item.labelTag && <span className="message-row-topic-tag">{item.labelTag}</span>}
                  </div>
                  <div className={`message-row-preview ${item.status ? 'has-status' : ''}`}>
                    {item.status === 'resolved' && <ResolvedIcon />}
                    <span>{item.preview}</span>
                  </div>
                </div>

                <div className="message-row-side">
                  <div className="message-row-time">{item.time}</div>
                  {item.muted ? <MutedBellIcon /> : <span className="message-row-side-placeholder" />}
                </div>
              </article>
            ))}

            {visibleConversations.length === 0 && (
              <div className="message-empty">当前筛选下没有会话</div>
            )}
          </section>
        </div>
      </div>

      {activeTopicDetail && <TopicConversationPage detail={activeTopicDetail} onBack={() => setActiveTopicDetailId(null)} />}
      {showCreateGroupModal && <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />}
    </div>
  )
}

export default MessagePage
