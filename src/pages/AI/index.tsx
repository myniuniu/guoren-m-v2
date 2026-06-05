import { useState } from 'react'
import './index.css'

const featureCards = [
  { icon: '🎁', label1: '领取新人免费体验', label2: '礼包', color: '#FF8C00' },
  { icon: '📄', label1: '解读Harness', label2: 'Engineering', color: '#8E8E93' },
  { icon: '⭐', label1: '影视飓风同款', label2: '落地行动建…', color: '#5AC8FA' },
]

function renderDrawerIcon(type: string) {
  switch (type) {
    case 'new':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    case 'library':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6.5C5 5.67 5.67 5 6.5 5h2.2c.46 0 .9.21 1.19.57l1.22 1.56c.28.36.72.57 1.18.57H17.5c.83 0 1.5.67 1.5 1.5v8.3c0 .83-.67 1.5-1.5 1.5h-11c-.83 0-1.5-.67-1.5-1.5z" />
          <path d="M9 5v14" />
        </svg>
      )
    case 'skills':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
          <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
          <path d="m8.5 11.5 4 4" />
        </svg>
      )
    case 'discover':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="6.5" />
          <path d="M4 13.5c2.5-1.2 4.87-1.8 8-1.8 3.12 0 5.5.6 8 1.8" />
        </svg>
      )
    default:
      return null
  }
}

export default function AIPage({ onClose }: { onClose: () => void }) {
  const [inputValue, setInputValue] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showPlusSheet, setShowPlusSheet] = useState(false)
  const [showSkillsPage, setShowSkillsPage] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showLibraryPage, setShowLibraryPage] = useState(false)
  const [showSidebarLibrary, setShowSidebarLibrary] = useState(false)
  const [sidebarLibraryTab, setSidebarLibraryTab] = useState<'all' | 'starred'>('all')
  const [sidebarLibraryActionTarget, setSidebarLibraryActionTarget] = useState<number | null>(null)
  const [showDiscoverPage, setShowDiscoverPage] = useState(false)
  const [showMySkillsPage, setShowMySkillsPage] = useState(false)
  const [mySkillsTab, setMySkillsTab] = useState<'added' | 'created'>('added')
  const [showCreateSkillSheet, setShowCreateSkillSheet] = useState(false)
  const [showCreateSkillChat, setShowCreateSkillChat] = useState(false)
  const [showAgentChat, setShowAgentChat] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  const [libraryTab, setLibraryTab] = useState<'personal' | 'org'>('personal')
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<number[]>([])
  const [selectedOrgSpace, setSelectedOrgSpace] = useState('课堂评价')
  const [showOrgSpacePicker, setShowOrgSpacePicker] = useState(false)

  const menuItems = [
    { key: 'new', label: '新建' },
    { key: 'library', label: '库' },
    { key: 'skills', label: '技能' },
    { key: 'discover', label: '发现' },
  ]

  const agents = [
    { id: 1, name: '建国', avatar: '建', color: '#E8734A', description: '智能伙伴，帮你处理各类日常任务' },
    { id: 2, name: '创新产品设计专家', avatar: '创', color: '#7A95FF', description: '专注于产品创新设计，提供从概念到落地的全流程支持' },
    { id: 3, name: 'vibe coding 必备的资深 UI', avatar: 'UI', color: '#4FB7B3', description: '资深 UI 设计专家，帮你快速产出高质量界面方案' },
    { id: 4, name: '修图小助手，相册中不再有废片！', avatar: '修', color: '#F0A35E', description: '智能修图助手，一键优化照片，让相册不留废片' },
    { id: 5, name: '财报解读专家', avatar: '财', color: '#5E94E8', description: '专业解读财报数据，帮你快速理解企业财务状况' },
    { id: 6, name: '运营达人', avatar: '运', color: '#C68CE5', description: '运营全流程支持，从策划到执行一站式搞定' },
    { id: 7, name: '学习公社6.0答疑助手', avatar: '学', color: '#6FA8FF', description: '基于产品知识库，为用户解答学习公社6.0相关问题' },
    { id: 8, name: '会议纪要助手', avatar: '会', color: '#4FC3A1', description: '自动生成会议纪要，帮你高效记录和跟进会议内容' },
    { id: 9, name: '短视频脚本达人', avatar: '短', color: '#F08080', description: '创作爆款短视频脚本，从选题到脚本一站式搞定' },
  ]

  const builtInAgent = agents[0]
  const customAgents = agents.slice(1)
  const visibleCustomAgents = showMore ? customAgents : customAgents.slice(0, 6)
  const plusCardItems = [
    { key: 'file', label: '图片 / 文件' },
    { key: 'doc', label: '资料库' },
  ]
  const plusListItems = [
    { key: 'skills', label: '技能' },
    { key: 'tools', label: '工具' },
  ]
  const fileMenuItems = [
    { key: 'album', label: '照片图库', icon: 'album' },
    { key: 'camera', label: '拍照', icon: 'camera' },
    { key: 'folder', label: '选取文件', icon: 'folder' },
  ]
  const orgSpaces = ['课堂评价', '人工智能通识课', '教研-数学', '高教-教研', '基教-教研', '知识空间-教学', '哈哈哈123', '知识空间001']
  const libraryItems = [
    {
      id: 1,
      scope: 'personal',
      name: '果仁产品第三方系统连接器规范.pdf',
      source: 'zhanghl',
      createdAt: '2026-04-28 16:35',
      type: 'pdf',
    },
    {
      id: 2,
      scope: 'personal',
      name: '数学_勾股定理互动课件.html',
      source: 'zhanghl',
      createdAt: '2026-05-07 09:36',
      type: 'html',
    },
    {
      id: 3,
      scope: 'personal',
      name: '果仁空间v3.pptx',
      source: 'zhanghl',
      createdAt: '2026-04-28 16:35',
      type: 'ppt',
    },
    {
      id: 4,
      scope: 'personal',
      name: '1111',
      source: 'zhanghl',
      createdAt: '2026-05-23 14:50',
      type: 'ppt',
    },
    {
      id: 5,
      scope: 'personal',
      name: '模型训练指南',
      source: 'zhanghl',
      createdAt: '2026-05-24 17:10',
      type: 'pdf',
    },
    {
      id: 6,
      scope: 'personal',
      name: '语文_小蝌蚪找妈妈',
      source: 'zhanghl',
      createdAt: '2026-05-25 14:57',
      type: 'html',
    },
    {
      id: 7,
      scope: 'org',
      name: '主会场第三场 midscene.js: AI 分享纪要',
      source: 'guoren-team',
      createdAt: '2026-05-05 08:00',
      type: 'doc',
      space: '课堂评价',
    },
    {
      id: 8,
      scope: 'org',
      name: '企业智能体知识库搭建模板',
      source: 'guoren-team',
      createdAt: '2026-05-11 19:40',
      type: 'pdf',
      space: '人工智能通识课',
    },
    {
      id: 9,
      scope: 'org',
      name: '组织资料库接入规范',
      source: 'guoren-team',
      createdAt: '2026-05-21 10:22',
      type: 'doc',
      space: '教研-数学',
    },
    {
      id: 10,
      scope: 'org',
      name: '动物王国开大会5M-测试',
      source: 'jinlf',
      createdAt: '2026-05-29 17:13',
      type: 'ppt',
      space: '课堂评价',
    },
    {
      id: 11,
      scope: 'org',
      name: '评课指标',
      source: 'jinlf',
      createdAt: '2026-05-29 17:01',
      type: 'pdf',
      space: '课堂评价',
    },
    {
      id: 12,
      scope: 'org',
      name: '动物王国开大会',
      source: 'jinlf',
      createdAt: '2026-05-29 15:28',
      type: 'ppt',
      space: '课堂评价',
    },
    {
      id: 13,
      scope: 'org',
      name: '沈阳故宫介绍',
      source: 'jinlf',
      createdAt: '2026-05-29 15:52',
      type: 'html',
      space: '课堂评价',
    },
    {
      id: 14,
      scope: 'org',
      name: 'course-mental-health',
      source: 'wangho',
      createdAt: '2026-05-29 17:19',
      type: 'pdf',
      space: '人工智能通识课',
    },
    {
      id: 15,
      scope: 'org',
      name: '小壁虎借尾巴',
      source: 'jinlf',
      createdAt: '2026-05-29 18:11',
      type: 'ppt',
      space: '课堂评价',
    },
  ]
  const skillItems = [
    {
      id: 1,
      title: '导演日记',
      subtitle: 'director-diary-suite',
      description: '影视飓风同款项目管理工作流一站式帮聊聊说“记录一下”沉淀拍摄日志，说“复盘”整理回顾。',
      tags: ['项目管理', '工作复盘', '协作'],
      color: '#111111',
      icon: 'record',
    },
    {
      id: 2,
      title: '课程顾问',
      subtitle: 'course-consultant',
      description: '专业的课程设计与开发技能，帮助教育工作者、培训师和有开课想法的人快速设计完整课程。',
      tags: ['教育', '规划', '文档'],
      color: '#3D7CFF',
      icon: 'skill',
    },
    {
      id: 3,
      title: '彩虹渐变信息图生成器',
      subtitle: 'rainbow-infographic',
      description: '将文章内容转化为柔和彩虹渐变风格的竖版信息图，适合展示知识点和视觉摘要。',
      tags: ['设计', '图像'],
      color: '#FFB21A',
      icon: 'skill',
    },
    {
      id: 4,
      title: '营销文案润色',
      subtitle: 'copy-editing',
      description: '用于编辑、审阅或优化现有营销文案，适用产品介绍、文案发布和投放场景。',
      tags: ['营销', '写作'],
      color: '#34C759',
      icon: 'doc',
    },
    {
      id: 5,
      title: '复杂任务规划',
      subtitle: 'using-superpowers',
      description: '当需要执行多步骤复杂任务时，可先梳理目标、步骤和依赖关系，再推进执行。',
      tags: ['工程规划', '编程', '规则'],
      color: '#5B4CFF',
      icon: 'check',
    },
    {
      id: 6,
      title: '客户研究分析',
      subtitle: 'customer-research',
      description: '采用多源研究方法，对信息来源进行优先级评估，并给出结构化研究结论。',
      tags: ['调研', '市场调研', '营销'],
      color: '#5A49F0',
      icon: 'person',
    },
    {
      id: 7,
      title: '社媒爆款策略',
      subtitle: 'social-content',
      description: '创作、排期、优化各平台社交内容，适合短帖、长文、社媒活动和选题规划。',
      tags: ['营销', '写作', '规划'],
      color: '#FF7A1A',
      icon: 'doc',
    },
    {
      id: 8,
      title: 'lucky 写作',
      subtitle: 'lucky-writer',
      description: '根据用户意图自动路由到对应文档创作子技能，覆盖工作汇报、调研分析和方案策划。',
      tags: ['写作', '文档', '产品'],
      color: '#FF7A1A',
      icon: 'note',
    },
    {
      id: 9,
      title: '用户工作画像',
      subtitle: 'personal-profile-generator',
      description: '基于多维用户信息分析个人画像，适合做用户洞察、需求聚类和角色定义。',
      tags: ['规划', '数据分析', '产品'],
      color: '#4E46E5',
      icon: 'person',
    },
  ]

  const discoverAgents = [
    { id: 1, title: '资深数据分析师', description: '具备精湛 SQL 查询能力和统计分析背景，可...', author: '张洪磊', chats: 0, avatar: '数', color: '#E8734A' },
    { id: 2, title: '社交网站封面图生成', description: '根据用户的社交网站文章或标题生成社交网站...', author: '杨金玮', chats: 3, avatar: '社', color: '#7A95FF' },
    { id: 3, title: '财报解读专家', description: '专注于解读财报，为用户提供专业的财报分析...', author: '张洪磊', chats: 1, avatar: '财', color: '#5E94E8' },
    { id: 4, title: '案例仿真场景生成智能体', description: '用于生成各种案例仿真场景，为用户提供多样...', author: '朱永', chats: 6, avatar: '案', color: '#4FB7B3' },
    { id: 5, title: '学习公社-亲子沟通案例仿真智能体', description: '您可以通过发起关于家庭教育的案例主题，与...', author: '朱永', chats: 62, avatar: '学', color: '#6FA8FF' },
    { id: 6, title: 'AI案例仿真智能体', description: '让用户通过发起具体教育场景主题，与AI进行...', author: '朱永', chats: 37, avatar: 'AI', color: '#C68CE5' },
    { id: 7, title: '学习公社6.0答疑助手', description: '基于产品知识库，为用户解答学习公社6.0相...', author: '朱永', chats: 7, avatar: '答', color: '#F0A35E' },
  ]

  const openSkillsPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setShowSkillsPage(true)
  }

  const openLibraryPage = () => {
    setShowPlusSheet(false)
    setShowFileMenu(false)
    setShowOrgSpacePicker(false)
    setShowLibraryPage(true)
  }

  const visibleLibraryItems = libraryItems.filter((item) => {
    if (item.scope !== libraryTab) return false
    if (libraryTab === 'org') return item.space === selectedOrgSpace
    return true
  })

  const toggleLibraryItem = (id: number) => {
    setSelectedLibraryIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    )
  }

  function renderFileMenuIcon(type: string) {
    switch (type) {
      case 'album':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 15-4.5-4.5L9 18" />
          </svg>
        )
      case 'camera':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 8.5h3l1.5-2h6l1.5 2h3A1.5 1.5 0 0 1 21 10v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-7A2 2 0 0 1 4.5 8.5z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )
      case 'folder':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l1.5 2H19A1.5 1.5 0 0 1 20.5 9.5v7A1.5 1.5 0 0 1 19 18H5A1.5 1.5 0 0 1 3.5 16.5z" />
          </svg>
        )
      default:
        return null
    }
  }

  function renderSkillItemIcon(type: string) {
    switch (type) {
      case 'record':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="#fff" />
          </svg>
        )
      case 'skill':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
            <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
            <path d="m8.5 11.5 4 4" />
          </svg>
        )
      case 'doc':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4.5h6.5L18 8v11a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V6A1.5 1.5 0 0 1 8.5 4.5z" />
            <polyline points="14.5 4.5 14.5 8 18 8" />
            <line x1="9.5" y1="12" x2="15" y2="12" />
            <line x1="9.5" y1="15.5" x2="15" y2="15.5" />
          </svg>
        )
      case 'check':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )
      case 'person':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a8 8 0 0 0-16 0" />
            <circle cx="12" cy="9" r="3.2" />
          </svg>
        )
      case 'note':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="4.5" width="10" height="15" rx="1.5" />
            <line x1="10" y1="9" x2="14" y2="9" />
            <line x1="10" y1="12.5" x2="14" y2="12.5" />
            <line x1="10" y1="16" x2="13" y2="16" />
          </svg>
        )
      default:
        return null
    }
  }

  function renderLibraryFileIcon(type: string) {
    switch (type) {
      case 'pdf':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3.5h6l4 4v13A1.5 1.5 0 0 1 15.5 22h-8A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="13 3.5 13 8 17 8" />
          </svg>
        )
      case 'html':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3.5h6l4 4v13A1.5 1.5 0 0 1 16.5 22h-9A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="14 3.5 14 8 18 8" />
            <path d="m9.5 13 2-2-2-2" />
            <path d="m14.5 9-2 4" />
            <path d="m14.5 13-2 2 2 2" />
          </svg>
        )
      case 'ppt':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="6" width="15" height="12" />
            <path d="M8 18v2" />
            <path d="M16 18v2" />
            <path d="M8.5 9.5h4.5v5H8.5z" />
          </svg>
        )
      case 'doc':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3.5h6l4 4v13A1.5 1.5 0 0 1 15.5 22h-8A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="13 3.5 13 8 17 8" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="15.5" x2="15" y2="15.5" />
          </svg>
        )
      default:
        return null
    }
  }

  const sidebarLibraryItems = [
    { id: 1, name: 'rainbow-infographic-demo', source: 'lucky', type: 'unknown', starred: false },
    { id: 2, name: '功能清单', source: '建国', type: 'doc', starred: false },
    { id: 3, name: '功能清单', source: '建国', type: 'diamond', starred: false },
    { id: 4, name: 'personal_analysis', source: 'lucky', type: 'unknown', starred: false },
    { id: 5, name: '人生赛道规划.md', source: 'lucky', type: 'doc', starred: true },
    { id: 6, name: '个人分析报告.md', source: 'lucky', type: 'doc', starred: true },
    { id: 7, name: '个人信息图.html', source: 'lucky', type: 'html', starred: false },
    { id: 8, name: '2026年3月29日-4月4日AI行业重点资...', source: 'lucky', type: 'doc', starred: false },
    { id: 9, name: 'images', source: 'lucky', type: 'image', starred: false },
    { id: 10, name: 'lucky_presentation', source: 'lucky', type: 'lock', starred: false },
    { id: 11, name: '水彩绘效率：Lucky助力技术研发工作...', source: 'lucky', type: 'ppt', starred: false },
    { id: 12, name: 'AI赋能职教事业部建设方案', source: '建国', type: 'doc', starred: false },
    { id: 13, name: 'AI赋能职教技术架构.png', source: 'lucky', type: 'image', starred: false },
  ]

  function renderSidebarLibraryFileIcon(type: string) {
    switch (type) {
      case 'doc':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3.5h6l4 4v13A1.5 1.5 0 0 1 15.5 22h-8A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5z" />
            <polyline points="13 3.5 13 8 17 8" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="15.5" x2="15" y2="15.5" />
          </svg>
        )
      case 'html':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9.5 13-2-2 2-2" />
            <path d="m14.5 9 2 2-2 2" />
            <line x1="12" y1="15" x2="12" y2="9" />
          </svg>
        )
      case 'ppt':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="6" width="15" height="12" />
            <path d="M8 18v2" />
            <path d="M16 18v2" />
            <path d="M8.5 9.5h4v5H8.5z" />
          </svg>
        )
      case 'image':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 15-4.5-4.5L9 18" />
          </svg>
        )
      case 'diamond':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.5l8.5 8.5-8.5 8.5L3.5 11z" />
          </svg>
        )
      case 'lock':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        )
      case 'unknown':
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        )
    }
  }

  function getSidebarFileIconBg(type: string) {
    switch (type) {
      case 'doc': return '#4A7CFF'
      case 'html': return '#8c8f96'
      case 'ppt': return '#FF8A34'
      case 'image': return '#FF8A34'
      case 'diamond': return '#7B49F1'
      case 'lock': return '#8c8f96'
      default: return '#c4c7cc'
    }
  }

  return (
    <div className="ai-page">
      {/* 背景 */}
      <div className="ai-page-bg" />

      {/* 顶部导航 */}
      <div className="ai-page-header">
        <div className="ai-page-menu" onClick={() => setShowDrawer(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
        <div className="ai-page-header-right">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
          <div className="ai-page-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>
      </div>

      {/* 欢迎语 + 全部最佳实践 */}
      <div className="ai-page-welcome">
        <h1>Hi 张洪磊，有什么可以帮你的？</h1>
        <div className="ai-page-practice-header">
          <span className="ai-page-practice-title">全部最佳实践</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* 功能卡片 */}
      <div className="ai-page-cards">
        {featureCards.map((card, i) => (
          <div className="ai-card" key={i}>
            <div className="ai-card-icon" style={{ background: card.color }}>{card.icon}</div>
            <div className="ai-card-text">
              <span className="ai-card-label1">{card.label1}</span>
              <span className="ai-card-label2">{card.label2}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 底部输入区 */}
      <div className="ai-page-bottom">
        <div className="ai-input-bar">
          <div className="ai-input-plus" onClick={() => { setShowFileMenu(false); setShowPlusSheet(true) }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <input
            className="ai-input-field"
            placeholder="提个问题，或让我创作、分析任意内容"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <div className="ai-input-mic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
        </div>
        <p className="ai-page-disclaimer">使用国内合规模型并严格遵循权限隔离，保障企业数据安全</p>
      </div>

      {showDrawer && (
        <div className="ai-drawer-overlay" onClick={() => setShowDrawer(false)}>

          <div className="ai-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ai-drawer-body">
              <div className="ai-drawer-profile">
                <div className="ai-drawer-profile-avatar">A</div>
                <div className="ai-drawer-profile-name">lucky</div>
              </div>

              <div className="ai-drawer-menu">
                {menuItems.map((item) => (
                  <div className={`ai-drawer-menu-item ${(item.key === 'library' && showSidebarLibrary) || (item.key === 'new' && !showSidebarLibrary && !showDiscoverPage && !showSkillsPage) || (item.key === 'discover' && showDiscoverPage) || (item.key === 'skills' && showSkillsPage) ? 'is-highlighted' : ''}`} key={item.key} onClick={() => {
                    if (item.key === 'library') {
                      setShowSidebarLibrary(true)
                      setShowDiscoverPage(false)
                      setShowSkillsPage(false)
                      setShowDrawer(false)
                    }
                    if (item.key === 'new') {
                      setShowSidebarLibrary(false)
                      setShowDiscoverPage(false)
                      setShowSkillsPage(false)
                      setShowDrawer(false)
                    }
                    if (item.key === 'discover') {
                      setShowDiscoverPage(true)
                      setShowSidebarLibrary(false)
                      setShowSkillsPage(false)
                      setShowDrawer(false)
                    }
                    if (item.key === 'skills') {
                      setShowSkillsPage(true)
                      setShowSidebarLibrary(false)
                      setShowDiscoverPage(false)
                      setShowDrawer(false)
                    }
                  }}>
                    <span className="ai-drawer-menu-icon">{renderDrawerIcon(item.key)}</span>
                    <span className="ai-drawer-menu-label">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="ai-drawer-section">
                <div className="ai-drawer-section-title">智能伙伴</div>
                <div className="ai-drawer-agent-item">
                  <div className="ai-drawer-agent-avatar" style={{ background: builtInAgent.color }}>
                    {builtInAgent.avatar}
                  </div>
                  <span className="ai-drawer-agent-name">{builtInAgent.name}</span>
                </div>
              </div>

              <div className="ai-drawer-section">
                <div className="ai-drawer-section-title">自定义智能体</div>
                {visibleCustomAgents.map((agent) => (
                  <div className="ai-drawer-agent-item" key={agent.id} onClick={() => { setSelectedAgentId(agent.id); setShowAgentChat(true); setShowDrawer(false) }}>
                    <div className="ai-drawer-agent-avatar" style={{ background: agent.color }}>
                      {agent.avatar}
                    </div>
                    <span className="ai-drawer-agent-name">{agent.name}</span>
                  </div>
                ))}

                {!showMore && customAgents.length > visibleCustomAgents.length && (
                  <button className="ai-drawer-more" type="button" onClick={() => setShowMore(true)}>
                    更多
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 会话历史记录 */}
              <div className="ai-drawer-section">
                <div className="ai-drawer-section-title">四月</div>
                {[
                  { id: 1, title: '阴天照片天空修晴天' },
                  { id: 2, title: '课程顾问技能演示' },
                  { id: 3, title: '彩虹信息图示例' },
                  { id: 4, title: '今日活动回顾' },
                  { id: 5, title: '班级纪律管理仿真场景' },
                  { id: 6, title: '身份询问' },
                ].map((chat) => (
                  <div className="ai-drawer-chat-item" key={chat.id}>
                    <div className="ai-drawer-chat-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="ai-drawer-chat-title">{chat.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-drawer-footer">
              <div className="ai-drawer-footer-divider">- -</div>
              <div className="ai-drawer-quota">
                <div className="ai-drawer-quota-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3 1.7 4.7L18 9.4l-3.5 3 1.1 4.6L12 14.8 8.4 17l1.1-4.6L6 9.4l4.3-1.7z" />
                  </svg>
                  <span>可用额度：781</span>
                </div>
                <span className="ai-drawer-quota-action">续费</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPlusSheet && (
        <div className="ai-plus-sheet-overlay" onClick={() => { setShowFileMenu(false); setShowPlusSheet(false) }}>
          <div className="ai-plus-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ai-plus-sheet-handle" />

            <div className="ai-plus-sheet-grid">
              {showFileMenu && (
                <div className="ai-file-menu">
                  {fileMenuItems.map((item) => (
                    <button className="ai-file-menu-item" key={item.key} type="button">
                      <span className="ai-file-menu-label">{item.label}</span>
                      <span className="ai-file-menu-icon">{renderFileMenuIcon(item.icon)}</span>
                    </button>
                  ))}
                </div>
              )}
              {plusCardItems.map((item) => (
                <button
                  className="ai-plus-sheet-card"
                  key={item.key}
                  type="button"
                  onClick={
                    item.key === 'file'
                      ? () => setShowFileMenu((value) => !value)
                      : openLibraryPage
                  }
                >
                  <span className="ai-plus-sheet-card-icon">
                    {item.key === 'file' ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 3 14 8 19 8" />
                        <path d="M12 11v6" />
                        <path d="M9 14h6" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 4.5h8.5L19 8v11a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1.5-1.5z" />
                        <polyline points="15.5 4.5 15.5 8 19 8" />
                        <line x1="9" y1="12" x2="15" y2="12" />
                        <line x1="9" y1="15.5" x2="15" y2="15.5" />
                      </svg>
                    )}
                  </span>
                  <span className="ai-plus-sheet-card-label">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="ai-plus-sheet-list">
              {plusListItems.map((item) => (
                <button
                  className="ai-plus-sheet-row"
                  key={item.key}
                  type="button"
                  onClick={item.key === 'skills' ? openSkillsPage : () => setShowFileMenu(false)}
                >
                  <span className="ai-plus-sheet-row-left">
                    <span className="ai-plus-sheet-row-icon">
                      {item.key === 'skills' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                          <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                          <path d="m8.5 11.5 4 4" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="6" cy="18" r="2" />
                          <circle cx="18" cy="18" r="2" />
                          <circle cx="12" cy="7" r="2" />
                          <path d="M8 17l2.6-7.2" />
                          <path d="M16 17l-2.6-7.2" />
                          <path d="M8 18h8" />
                        </svg>
                      )}
                    </span>
                    <span className="ai-plus-sheet-row-label">{item.label}</span>
                  </span>
                  <span className="ai-plus-sheet-row-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSkillsPage && (
        <div className="ai-skill-community-page">
          {/* Header */}
          <div className="ai-skill-community-header">
            <div className="ai-skill-community-menu" onClick={() => setShowDrawer(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-skill-community-title">技能社区</div>
            <div className="ai-skill-community-actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" onClick={() => setShowCreateSkillSheet(true)} style={{ cursor: 'pointer' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onClick={() => setShowMySkillsPage(true)} style={{ cursor: 'pointer' }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.54 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.54 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.54a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 15 4.54a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>

          <div className="ai-skill-community-content">
            {/* Search */}
            <div className="ai-skill-community-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
              <span>搜索技能名称、描述或标签</span>
            </div>

            {/* Banner */}
            <div className="ai-skill-community-banner">
              <div className="ai-skill-community-banner-content">
                <div className="ai-skill-community-banner-title">
                  <span className="ai-skill-community-banner-highlight">你的技能</span>值得被更多人复用
                </div>
                <div className="ai-skill-community-banner-desc">将沉淀的的工作技能，直接发布到lucky SkillHub，让好技能不被埋没</div>
                <div className="ai-skill-community-banner-link">了解详情 &gt;</div>
              </div>
              <div className="ai-skill-community-banner-img">
                <div className="ai-skill-community-banner-card">Skill</div>
              </div>
            </div>

            {/* Official Picks */}
            <div className="ai-skill-community-section-header">
              <div className="ai-skill-community-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16l-2 10H6z" />
                  <path d="m9 12 2.2 2.2L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                官方精选
              </div>
              <div className="ai-skill-community-refresh">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6" />
                  <path d="M2.5 12a9.5 9.5 0 0 1 16.5-6.5L21.5 8" />
                  <path d="M2.5 22v-6h6" />
                  <path d="M21.5 12a9.5 9.5 0 0 1-16.5 6.5L2.5 16" />
                </svg>
                换一换
              </div>
            </div>

            {/* Skill Cards */}
            <div className="ai-skill-community-cards">
              {[
                {
                  id: 1,
                  title: '社群运营群聊分析',
                  desc: '对指定群聊进行周期性消息分析，提取主要观点、热门话题、活跃用户，生成包含数据分析的总结报告。Use...',
                  tags: ['运营', '数据分析', '写作'],
                  count: '5.2k 次添加',
                  color: '#FFB21A',
                  icon: 'group',
                },
                {
                  id: 2,
                  title: '产品方案梳理',
                  desc: '在开发具体功能前梳理用户意图、需求与设计方案，通过分步提问的方式，将模糊的产品需求转为为清晰可交付的文...',
                  tags: ['产品', '文档', '规划'],
                  count: '1.6w 次添加',
                  color: '#4A7CFF',
                  icon: 'lightbulb',
                },
                {
                  id: 3,
                  title: 'AI 文本优化',
                  desc: '识别和去除 AI 生成文本的痕迹，使文字听起来更自然、更有人味',
                  tags: ['写作', '内容优化'],
                  count: '2.2w 次添加',
                  color: '#7B49F1',
                  icon: 'doc',
                },
              ].map((skill) => (
                <div className="ai-skill-community-card" key={skill.id}>
                  <div className="ai-skill-community-card-header">
                    <div className="ai-skill-community-card-icon" style={{ background: skill.color }}>
                      {skill.icon === 'group' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      )}
                      {skill.icon === 'lightbulb' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 14c.2-1 .8-1.8 1.5-2.5a5.5 5.5 0 0 0-9 0C7.8 12.2 8.3 13 8.5 14" />
                          <path d="M9 18h6" />
                          <path d="M10 22h4" />
                          <path d="M12 2v2" />
                          <path d="M12 8v2" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                      {skill.icon === 'doc' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <line x1="10" y1="9" x2="9" y2="9" />
                        </svg>
                      )}
                    </div>
                    <div className="ai-skill-community-card-title">{skill.title}</div>
                  </div>
                  <div className="ai-skill-community-card-desc">{skill.desc}</div>
                  <div className="ai-skill-community-card-footer">
                    <div className="ai-skill-community-card-tags">
                      {skill.tags.map((tag) => (
                        <span className="ai-skill-community-card-tag" key={tag}>{tag}</span>
                      ))}
                    </div>
                    <span className="ai-skill-community-card-count">{skill.count}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* All Skills */}
            <div className="ai-skill-community-all-skills">
              <div className="ai-skill-community-all-skills-header">
                <div className="ai-skill-community-all-skills-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                    <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                    <path d="m8.5 11.5 4 4" />
                  </svg>
                  全部技能
                </div>
                <div className="ai-skill-community-filter">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.46z" />
                  </svg>
                  筛选
                </div>
              </div>
              <div className="ai-skill-community-all-list">
                {[
                  {
                    id: 1,
                    title: 'AI生成技能',
                    desc: '帮助用户创建和更新技能，扩展 lucky 工作助手的...',
                    tags: ['工程研发', '编程'],
                    color: '#4CAF50',
                    icon: 'gear',
                  },
                  {
                    id: 2,
                    title: '群聊内容摘要',
                    desc: '基于群聊的智能摘要与洞察生成能力。从指定...',
                    tags: ['运营', '文档', '沟通'],
                    color: '#4A7CFF',
                    icon: 'chat',
                  },
                  {
                    id: 3,
                    title: '行业研究报告',
                    desc: '面向特定行业/赛道的系统性深度研究能力。从行...',
                    tags: ['研究', '调研', '文档'],
                    color: '#4A7CFF',
                    icon: 'book',
                  },
                  {
                    id: 4,
                    title: '前沿论文解读',
                    desc: '面向学术论文的原文级调研（Deep Research）...',
                    tags: ['研究', '调研', '写作'],
                    color: '#4A7CFF',
                    icon: 'academic',
                  },
                  {
                    id: 5,
                    title: '新闻总结',
                    desc: '根据用户指定的主题和时间范围，自动检索权威动...',
                    tags: ['文档', '调研', '写作'],
                    color: '#4A7CFF',
                    icon: 'news',
                  },
                  {
                    id: 6,
                    title: '工作周报',
                    desc: '基于生态的每周周报自动生成 Skill：从当周...',
                    tags: ['运营', '文档', '自动化'],
                    color: '#4A7CFF',
                    icon: 'briefcase',
                  },
                ].map((skill) => (
                  <div className="ai-skill-community-all-item" key={skill.id}>
                    <div className="ai-skill-community-all-icon" style={{ background: skill.color }}>
                      {skill.icon === 'gear' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.54 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.54 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.54a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 15 4.54a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      )}
                      {skill.icon === 'chat' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                      {skill.icon === 'book' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      )}
                      {skill.icon === 'academic' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      )}
                      {skill.icon === 'news' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <line x1="10" y1="9" x2="9" y2="9" />
                        </svg>
                      )}
                      {skill.icon === 'briefcase' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      )}
                    </div>
                    <div className="ai-skill-community-all-body">
                      <div className="ai-skill-community-all-title-row">
                        <span className="ai-skill-community-all-title">{skill.title}</span>
                        <div className="ai-skill-community-all-tags">
                          {skill.tags.map((tag) => (
                            <span className="ai-skill-community-all-tag" key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="ai-skill-community-all-desc">{skill.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 创建技能底部弹层 */}
          {showCreateSkillSheet && (
            <div className="ai-skill-create-sheet-overlay" onClick={() => setShowCreateSkillSheet(false)}>
              <div className="ai-skill-create-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="ai-skill-create-sheet-handle" />
                <div className="ai-skill-create-sheet-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                    <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                    <path d="m8.5 11.5 4 4" />
                  </svg>
                </div>
                <div className="ai-skill-create-sheet-title">使用对话创建</div>
                <div className="ai-skill-create-sheet-desc">通过对话构建个人使用的技能</div>
                <button className="ai-skill-create-sheet-btn" type="button" onClick={() => { setShowCreateSkillSheet(false); setShowCreateSkillChat(true) }}>去创建</button>
                <div className="ai-skill-create-sheet-tip">如需上传本地文件，请前往电脑端操作</div>
              </div>
            </div>
          )}
        </div>
      )}

      {showLibraryPage && (
        <div className="ai-library-page">
          <div className="ai-library-header">
            <div className="ai-library-title">选择资料</div>
            <button className="ai-library-close" type="button" onClick={() => setShowLibraryPage(false)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="ai-library-tabs">
            <button
              className={`ai-library-tab ${libraryTab === 'personal' ? 'is-active' : ''}`}
              type="button"
              onClick={() => {
                setLibraryTab('personal')
                setShowOrgSpacePicker(false)
              }}
            >
              个人资料库
            </button>
            <button
              className={`ai-library-tab ${libraryTab === 'org' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setLibraryTab('org')}
            >
              组织资料库
            </button>
          </div>

          {libraryTab === 'org' && (
            <button className="ai-library-space-trigger" type="button" onClick={() => setShowOrgSpacePicker(true)}>
              <span className="ai-library-space-label">当前空间</span>
              <span className="ai-library-space-value">{selectedOrgSpace}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          <div className="ai-library-toolbar">
            <div className="ai-library-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
              <span>搜索文件名</span>
            </div>
            <div className="ai-library-selected">已选 {selectedLibraryIds.length}</div>
          </div>

          <div className="ai-library-list">
            {visibleLibraryItems.map((item) => {
              const checked = selectedLibraryIds.includes(item.id)
              return (
                <button className="ai-library-item" key={item.id} type="button" onClick={() => toggleLibraryItem(item.id)}>
                  <span className={`ai-library-checkbox ${checked ? 'is-checked' : ''}`}>
                    {checked && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className={`ai-library-file-icon type-${item.type}`}>{renderLibraryFileIcon(item.type)}</span>
                  <span className="ai-library-item-content">
                    <span className="ai-library-item-name">{item.name}</span>
                    <span className="ai-library-item-meta">
                      <span>{item.source}</span>
                      <span>{item.createdAt}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="ai-library-footer">
            <button className="ai-library-footer-btn" type="button" onClick={() => setShowLibraryPage(false)}>取消</button>
            <button className="ai-library-footer-btn is-primary" type="button">添加</button>
          </div>

          {showOrgSpacePicker && (
            <div className="ai-library-space-overlay" onClick={() => setShowOrgSpacePicker(false)}>
              <div className="ai-library-space-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="ai-library-space-sheet-handle" />
                <div className="ai-library-space-sheet-title">选择空间</div>
                <div className="ai-library-space-list">
                  {orgSpaces.map((space) => (
                    <button
                      className={`ai-library-space-item ${selectedOrgSpace === space ? 'is-active' : ''}`}
                      key={space}
                      type="button"
                      onClick={() => {
                        setSelectedOrgSpace(space)
                        setShowOrgSpacePicker(false)
                      }}
                    >
                      <span>{space}</span>
                      {selectedOrgSpace === space && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* 侧边栏库全屏页 */}
      {showSidebarLibrary && (
        <div className="ai-sidebar-library-page">
          <div className="ai-sidebar-library-header">
            <div className="ai-sidebar-library-menu" onClick={() => setShowDrawer(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-sidebar-library-tabs">
              <button
                className={`ai-sidebar-library-tab ${sidebarLibraryTab === 'all' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSidebarLibraryTab('all')}
              >
                全部产物
              </button>
              <button
                className={`ai-sidebar-library-tab ${sidebarLibraryTab === 'starred' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSidebarLibraryTab('starred')}
              >
                收藏夹
              </button>
            </div>
            <div className="ai-sidebar-library-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <div className="ai-sidebar-library-list">
            {sidebarLibraryItems
              .filter((item) => (sidebarLibraryTab === 'starred' ? item.starred : true))
              .map((item) => (
                <div className="ai-sidebar-library-item" key={item.id}>
                  <div
                    className="ai-sidebar-library-item-icon"
                    style={{ background: getSidebarFileIconBg(item.type) }}
                  >
                    {renderSidebarLibraryFileIcon(item.type)}
                  </div>
                  <div className="ai-sidebar-library-item-body">
                    <div className="ai-sidebar-library-item-name">{item.name}</div>
                    <div className="ai-sidebar-library-item-source">{item.source}</div>
                  </div>
                  <div className="ai-sidebar-library-item-more" onClick={(e) => { e.stopPropagation(); setSidebarLibraryActionTarget(item.id) }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </div>
                </div>
              ))}
          </div>

          {/* 操作菜单 */}
          {sidebarLibraryActionTarget && (
            <div className="ai-sidebar-library-action-overlay" onClick={() => setSidebarLibraryActionTarget(null)}>
              <div className="ai-sidebar-library-action-sheet" onClick={(e) => e.stopPropagation()}>
                <button className="ai-sidebar-library-action-item" type="button" onClick={() => setSidebarLibraryActionTarget(null)}>分享</button>
                <button className="ai-sidebar-library-action-item" type="button" onClick={() => setSidebarLibraryActionTarget(null)}>重命名</button>
                <button className="ai-sidebar-library-action-item" type="button" onClick={() => setSidebarLibraryActionTarget(null)}>下载</button>
                <button className="ai-sidebar-library-action-item" type="button" onClick={() => setSidebarLibraryActionTarget(null)}>收藏</button>
                <button className="ai-sidebar-library-action-item" type="button" onClick={() => setSidebarLibraryActionTarget(null)}>更多操作</button>
                <button className="ai-sidebar-library-action-item danger" type="button" onClick={() => setSidebarLibraryActionTarget(null)}>删除</button>
                <div className="ai-sidebar-library-action-gap" />
                <button className="ai-sidebar-library-action-item cancel" type="button" onClick={() => setSidebarLibraryActionTarget(null)}>取消</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 发现全屏页 */}
      {showDiscoverPage && (
        <div className="ai-discover-page">
          <div className="ai-discover-header">
            <div className="ai-discover-header-menu" onClick={() => setShowDrawer(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-discover-header-title">发现</div>
            <div className="ai-discover-header-actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
              <div className="ai-discover-header-close" onClick={() => setShowDiscoverPage(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </div>

          <div className="ai-discover-content">
            <div className="ai-discover-section-title">企业智能体</div>
            <div className="ai-discover-list">
              {discoverAgents.map((agent) => (
                <div className="ai-discover-card" key={agent.id}>
                  <div className="ai-discover-card-avatar" style={{ background: agent.color }}>
                    {agent.avatar}
                  </div>
                  <div className="ai-discover-card-body">
                    <div className="ai-discover-card-title">{agent.title}</div>
                    <div className="ai-discover-card-desc">{agent.description}</div>
                    <div className="ai-discover-card-meta">
                      <span className="ai-discover-card-author">@{agent.author}</span>
                      <span className="ai-discover-card-chats">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {agent.chats}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 我的技能页 */}
      {showMySkillsPage && (
        <div className="ai-my-skills-page">
          <div className="ai-my-skills-header">
            <div className="ai-my-skills-back" onClick={() => setShowMySkillsPage(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div className="ai-my-skills-tabs">
              <button
                className={`ai-my-skills-tab ${mySkillsTab === 'added' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setMySkillsTab('added')}
              >
                我添加的
              </button>
              <button
                className={`ai-my-skills-tab ${mySkillsTab === 'created' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setMySkillsTab('created')}
              >
                我创建的
              </button>
            </div>
            <div className="ai-my-skills-actions">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 3H2l8 9.46V19l4 2v-8.46z" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.54 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.54 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.54a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 15 4.54a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>

          <div className="ai-my-skills-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.65" y2="16.65" />
            </svg>
            <span>搜索</span>
          </div>

          <div className="ai-my-skills-list">
            {[
              {
                id: 1,
                title: '导演日记',
                desc: '影视飓风同款项目管理工作流 —— 在群聊里说"记录一下"沉淀拍摄日志，说"复盘一下"自动生成阶段总结，让...',
                addedCount: 2,
                color: '#111111',
                icon: 'record',
              },
              {
                id: 2,
                title: '课程顾问',
                desc: '专业的课程设计与开发技能，帮助教育工作者、培训师和有开课想法的人快速设计完整课程体系。Use when user...',
                addedCount: 2,
                color: '#3D7CFF',
                icon: 'skill',
              },
              {
                id: 3,
                title: '彩虹渐变信息图生成器',
                desc: '将文章/文字内容转化为柔和彩虹渐变风格的竖版信息图（HTML格式，1080×1440px，3:4比例）。采用半透明...',
                addedCount: 2,
                color: '#FFB21A',
                icon: 'skill',
              },
              {
                id: 4,
                title: '营销文案润色',
                desc: '用于编辑、审阅或优化现有营销文案。当用户提及以下内容时适用：编辑文案、审阅文案、文案反馈、校对、润色、...',
                addedCount: 2,
                color: '#34C759',
                icon: 'doc',
                openSource: true,
              },
            ].map((skill) => (
              <div className="ai-my-skill-card" key={skill.id}>
                <div className="ai-my-skill-card-header">
                  <div className="ai-my-skill-card-icon" style={{ background: skill.color }}>
                    {skill.icon === 'record' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="8" />
                        <circle cx="12" cy="12" r="4" fill="#fff" />
                      </svg>
                    )}
                    {skill.icon === 'skill' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
                        <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
                        <path d="m8.5 11.5 4 4" />
                      </svg>
                    )}
                    {skill.icon === 'doc' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="9" y2="9" />
                      </svg>
                    )}
                  </div>
                  <div className="ai-my-skill-card-title">{skill.title}</div>
                  {skill.openSource && <span className="ai-my-skill-card-badge">开源</span>}
                  <div className="ai-my-skill-card-more">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </div>
                </div>
                <div className="ai-my-skill-card-desc">{skill.desc}</div>
                <div className="ai-my-skill-card-meta">
                  <div className="ai-my-skill-card-avatars">
                    <div className="ai-my-skill-card-avatar" style={{ background: '#E8734A' }}>A</div>
                    <div className="ai-my-skill-card-avatar" style={{ background: '#7A95FF', marginLeft: '-6px' }}>B</div>
                  </div>
                  <span>已添加到 {skill.addedCount} 个智能体</span>
                </div>
                <button className="ai-my-skill-card-btn" type="button">立即使用</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 创建技能对话页 */}
      {showCreateSkillChat && (
        <div className="ai-create-skill-chat-page">
          <div className="ai-create-skill-chat-header">
            <div className="ai-create-skill-chat-menu" onClick={() => setShowDrawer(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <div className="ai-create-skill-chat-actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
              <div className="ai-create-skill-chat-close" onClick={() => setShowCreateSkillChat(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </div>

          <div className="ai-create-skill-chat-content">
            <div className="ai-create-skill-chat-welcome">
              <h1>Hi 张洪磊，有什么可以帮你的？</h1>
              <div className="ai-create-skill-chat-practice">
                <span>全部最佳实践</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div className="ai-create-skill-chat-cards">
              <div className="ai-create-skill-chat-card">
                <div className="ai-create-skill-chat-card-icon" style={{ background: '#FF8C00' }}>🎁</div>
                <div className="ai-create-skill-chat-card-text">
                  <span>领取新人免费体验礼包</span>
                </div>
              </div>
              <div className="ai-create-skill-chat-card">
                <div className="ai-create-skill-chat-card-icon" style={{ background: '#8E8E93' }}>📄</div>
                <div className="ai-create-skill-chat-text">
                  <span>解读Harness</span>
                  <span>Engineering</span>
                </div>
              </div>
              <div className="ai-create-skill-chat-card">
                <div className="ai-create-skill-chat-card-icon" style={{ background: '#5AC8FA' }}>⭐</div>
                <div className="ai-create-skill-chat-text">
                  <span>影视飓风同款</span>
                  <span>落地行动建…</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-create-skill-chat-bottom">
            <div className="ai-create-skill-chat-actions">
              <div className="ai-create-skill-chat-action">创建图片 PPT</div>
              <div className="ai-create-skill-chat-action">创建网页 PPT</div>
              <div className="ai-create-skill-chat-action">写云文档</div>
              <div className="ai-create-skill-chat-action">…</div>
            </div>
            <div className="ai-create-skill-chat-input-bar">
              <div className="ai-create-skill-chat-plus">+</div>
              <div className="ai-create-skill-chat-input-field">
                帮我使用 <span className="ai-create-skill-chat-highlight">AI 生成技能</span> 创建一个技能。请先问我这个技能可以做什么。
              </div>
              <div className="ai-create-skill-chat-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <line x1="5" y1="12" x2="12" y2="5" />
                  <line x1="12" y1="5" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            <p className="ai-create-skill-chat-disclaimer">使用国内合规模型并严格遵循权限隔离，保障企业数据安全</p>
          </div>
        </div>
      )}

      {/* 智能体对话全屏页 */}
      {showAgentChat && selectedAgentId && (() => {
        const agent = agents.find(a => a.id === selectedAgentId)
        if (!agent) return null
        return (
          <div className="ai-agent-chat-page">
            <div className="ai-agent-chat-header">
              <div className="ai-agent-chat-back" onClick={() => { setShowAgentChat(false); setSelectedAgentId(null) }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </div>
              <div className="ai-agent-chat-title">{agent.name}</div>
              <div className="ai-agent-chat-header-actions">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
                <div className="ai-agent-chat-close" onClick={() => { setShowAgentChat(false); setSelectedAgentId(null) }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="ai-agent-chat-content">
              <div className="ai-agent-chat-avatar" style={{ background: agent.color }}>
                {agent.avatar}
              </div>
              <div className="ai-agent-chat-name">{agent.name}</div>
              <div className="ai-agent-chat-desc">{agent.description}</div>
              <button className="ai-agent-chat-start-btn" type="button">开始对话</button>
            </div>

            <div className="ai-agent-chat-bottom">
              <div className="ai-agent-chat-input-bar">
                <div className="ai-agent-chat-plus">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <input className="ai-agent-chat-input-field" placeholder="向 {agent.name} 提问…" />
                <div className="ai-agent-chat-send">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="none">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </div>
              </div>
              <p className="ai-agent-chat-disclaimer">使用国内合规模型并严格遵循权限隔离，保障企业数据安全</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
