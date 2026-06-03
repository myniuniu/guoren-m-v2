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
    { id: 1, name: '建国', avatar: '建', color: '#E8734A' },
    { id: 2, name: '创新产品设计专家', avatar: '创', color: '#7A95FF' },
    { id: 3, name: 'vibe coding 必备的资深 UI', avatar: 'UI', color: '#4FB7B3' },
    { id: 4, name: '修图小助手，相册中不再有废片！', avatar: '修', color: '#F0A35E' },
    { id: 5, name: '财报解读专家', avatar: '财', color: '#5E94E8' },
    { id: 6, name: '运营达人', avatar: '运', color: '#C68CE5' },
    { id: 7, name: '学习公社6.0答疑助手', avatar: '学', color: '#6FA8FF' },
    { id: 8, name: '会议纪要助手', avatar: '会', color: '#4FC3A1' },
    { id: 9, name: '短视频脚本达人', avatar: '短', color: '#F08080' },
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
      tags: ['项目管理', '工作复盘', '飞书协作'],
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
      title: 'aily 写作',
      subtitle: 'aily-writer',
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
    { id: 1, name: 'rainbow-infographic-demo', source: '飞书 aily', type: 'unknown', starred: false },
    { id: 2, name: '功能清单', source: '建国', type: 'doc', starred: false },
    { id: 3, name: '功能清单', source: '建国', type: 'diamond', starred: false },
    { id: 4, name: 'personal_analysis', source: '飞书 aily', type: 'unknown', starred: false },
    { id: 5, name: '人生赛道规划.md', source: '飞书 aily', type: 'doc', starred: true },
    { id: 6, name: '个人分析报告.md', source: '飞书 aily', type: 'doc', starred: true },
    { id: 7, name: '个人信息图.html', source: '飞书 aily', type: 'html', starred: false },
    { id: 8, name: '2026年3月29日-4月4日AI行业重点资...', source: '飞书 aily', type: 'doc', starred: false },
    { id: 9, name: 'images', source: '飞书 aily', type: 'image', starred: false },
    { id: 10, name: 'feishu_aily_presentation', source: '飞书 aily', type: 'lock', starred: false },
    { id: 11, name: '水彩绘效率：飞书Aily助力技术研发工作...', source: '飞书 aily', type: 'ppt', starred: false },
    { id: 12, name: 'AI赋能职教事业部建设方案', source: '建国', type: 'doc', starred: false },
    { id: 13, name: 'AI赋能职教技术架构.png', source: '飞书 aily', type: 'image', starred: false },
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
          <div className="ai-drawer-close" onClick={() => setShowDrawer(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <div className="ai-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ai-drawer-body">
              <div className="ai-drawer-profile">
                <div className="ai-drawer-profile-avatar">A</div>
                <div className="ai-drawer-profile-name">飞书 aily</div>
              </div>

              <div className="ai-drawer-menu">
                {menuItems.map((item, index) => (
                  <div className={`ai-drawer-menu-item ${index === 0 ? 'is-highlighted' : ''}`} key={item.key} onClick={() => {
                    if (item.key === 'library') {
                      setShowSidebarLibrary(true)
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
                  <div className="ai-drawer-agent-item" key={agent.id}>
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
        <div className="ai-skills-page">
          <div className="ai-skills-header">
            <div className="ai-skills-header-spacer" />
            <div className="ai-skills-title">技能</div>
            <button className="ai-skills-close" type="button" onClick={() => setShowSkillsPage(false)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="ai-skills-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.65" y2="16.65" />
            </svg>
            <span>搜索</span>
          </div>

          <div className="ai-skills-list">
            {skillItems.map((item) => (
              <div className="ai-skill-item" key={item.id}>
                <div className="ai-skill-item-icon" style={{ background: item.color }}>
                  {renderSkillItemIcon(item.icon)}
                </div>
                <div className="ai-skill-item-content">
                  <div className="ai-skill-item-top">
                    <span className="ai-skill-item-title">{item.title}</span>
                    <div className="ai-skill-item-tags">
                      {item.tags.map((tag) => (
                        <span className="ai-skill-item-tag" key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="ai-skill-item-subtitle">{item.subtitle}</div>
                  <div className="ai-skill-item-description">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
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
            <div className="ai-sidebar-library-menu" onClick={() => setShowSidebarLibrary(false)}>
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
                  <div className="ai-sidebar-library-item-more">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <circle cx="12" cy="5" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="12" cy="19" r="1.8" />
                    </svg>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
