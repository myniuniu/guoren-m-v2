import { useState } from 'react'
import './index.css'

interface HomeProps {
  onOpenAI: () => void
  elderMode: boolean
  onToggleElderMode: () => void
}

type HomeTabId = 'home' | 'discussion' | 'ai' | 'course' | 'article' | 'event'

type CommunityTab = {
  id: HomeTabId
  label: string
  count?: number
}

type TopicItem = {
  id: string
  author: string
  time: string
  tag: string
  title: string
  summary: string
  comments: number
  avatarTone: string
}

type WorkshopItem = {
  id: string
  author: string
  heat: string
  comments: number
  title: string
  tone: 'sand' | 'sage' | 'sky'
  emoji: string
}

type CourseItem = {
  id: string
  label: string
  labelTone: 'blue' | 'teal'
  title: string
  lessons: string
  milestone: string
  tone: 'honey' | 'mist'
  emoji: string
}

type CourseCatalogItem = {
  id: string
  provider: string
  coverHeadline: string
  coverFootnote: string
  title: string
  summary: string
  lessons: string
  milestone: string
  theme:
    | 'navy'
    | 'night'
    | 'plum'
    | 'ice'
    | 'mist'
    | 'violet'
    | 'azure'
    | 'coral'
    | 'gold'
    | 'lime'
    | 'mint'
    | 'blush'
  art: 'tilt' | 'ring' | 'poster' | 'badge' | 'orbit' | 'panels'
}

type DiscussionReply = {
  author: string
  content: string
}

type DiscussionPost = {
  id: string
  author: string
  time: string
  group: string
  groupMark: string
  groupTone: string
  title: string
  paragraphs: string[]
  extraReplies: number
  replyCount: number
  replies: DiscussionReply[]
  avatarTone: string
}

type RelatedGroup = {
  id: string
  name: string
  mark: string
  tone: string
  description: string
  members: string
}

const communityTabs: CommunityTab[] = [
  { id: 'home', label: '首页' },
  { id: 'discussion', label: '讨论区', count: 3 },
  { id: 'ai', label: 'AI 合集', count: 4 },
  { id: 'course', label: '课程', count: 38 },
  { id: 'article', label: '文章', count: 52 },
  { id: 'event', label: '活动', count: 2 },
]

const hotTopics: TopicItem[] = [
  {
    id: 'topic-1',
    author: '林社工',
    time: '1天前',
    tag: '#智慧助老共创群',
    title: '把“吃药提醒 + 家属通知”做成了大字板流程',
    summary: '80 岁的张阿姨第一次能自己完成反馈，准备继续把异常提醒接到社区值班群。',
    comments: 8,
    avatarTone: 'linear-gradient(135deg, #7da9ff 0%, #b5caff 100%)',
  },
  {
    id: 'topic-2',
    author: '周宁',
    time: '2天前',
    tag: '#银龄活动组织经验',
    title: '社区活动室接入大字版签到屏后',
    summary: '现场排队时间少了一半，家属代办入口也终于不再靠口头解释。',
    comments: 5,
    avatarTone: 'linear-gradient(135deg, #5cc3a5 0%, #9ee4d2 100%)',
  },
  {
    id: 'topic-3',
    author: '王医生',
    time: '3天前',
    tag: '#社区健康随访组',
    title: '异常先上报、正常自动归档的随访流程',
    summary: '志愿者只需要点三个按钮，老人和家属都更放心。',
    comments: 4,
    avatarTone: 'linear-gradient(135deg, #87baff 0%, #d0e1ff 100%)',
  },
]

const workshopItems: WorkshopItem[] = [
  {
    id: 'workshop-1',
    author: '顾阿姨',
    heat: '2.3k',
    comments: 5,
    title: '长者用药提醒台账',
    tone: 'sand',
    emoji: '💊',
  },
  {
    id: 'workshop-2',
    author: '周可',
    heat: '1.4k',
    comments: 3,
    title: '社区助餐报名表',
    tone: 'sage',
    emoji: '🧾',
  },
  {
    id: 'workshop-3',
    author: '王医生',
    heat: '980',
    comments: 2,
    title: '探访服务排班看板',
    tone: 'sky',
    emoji: '🗓️',
  },
]

const featuredCourses: CourseItem[] = [
  {
    id: 'course-1',
    label: '银龄课堂 · 回放',
    labelTone: 'blue',
    title: '零基础学会微信沟通、挂号与扫码出行',
    lessons: '3 节课',
    milestone: '36 里程',
    tone: 'honey',
    emoji: '🧑‍🏫',
  },
  {
    id: 'course-2',
    label: '实战课',
    labelTone: 'teal',
    title: '把微信支付、打车和线上买菜一次学会',
    lessons: '2 节课',
    milestone: '24 里程',
    tone: 'mist',
    emoji: '🧑‍🏫',
  },
]

const courseCatalogItems: CourseCatalogItem[] = [
  {
    id: 'catalog-1',
    provider: '银龄课堂',
    coverHeadline: '智能手机\n基础入门',
    coverFootnote: '从开机到微信',
    title: '智能手机基础入门：从开机、连网到添加家人微信',
    summary: '适合零基础长者，手把手练习常用按键、字体放大和语音输入。',
    lessons: '9 节课',
    milestone: '18 里程',
    theme: 'navy',
    art: 'tilt',
  },
  {
    id: 'catalog-2',
    provider: '银龄课堂',
    coverHeadline: '微信聊天与\n视频通话',
    coverFootnote: '和家人联系更轻松',
    title: '学会微信聊天、发语音和视频通话，不怕找不到孩子',
    summary: '覆盖建群、发定位、视频通话和常见误触处理，解决日常沟通问题。',
    lessons: '4 节课',
    milestone: '12 里程',
    theme: 'night',
    art: 'tilt',
  },
  {
    id: 'catalog-3',
    provider: '社区学堂',
    coverHeadline: '手机拍照与\n相册整理',
    coverFootnote: '记录日常生活',
    title: '手机拍照与相册整理：拍孙辈、拍花草、找照片都不难',
    summary: '从对焦、构图到删除重复照片，帮助长者真正把手机相册用起来。',
    lessons: '5 节课',
    milestone: '14 里程',
    theme: 'plum',
    art: 'ring',
  },
  {
    id: 'catalog-4',
    provider: '康养学堂',
    coverHeadline: '网上挂号与\n线上问诊',
    coverFootnote: '看病流程不慌',
    title: '网上挂号与线上问诊实操：看病、取号、复诊一步一步学',
    summary: '讲清医院小程序、医保电子凭证、线上问诊和家属协助的常见场景。',
    lessons: '4 节课',
    milestone: '12 里程',
    theme: 'ice',
    art: 'tilt',
  },
  {
    id: 'catalog-5',
    provider: '生活实用课',
    coverHeadline: '移动支付\n安全实操',
    coverFootnote: '买菜出行更方便',
    title: '移动支付安全实操：学会扫码付款，也学会防转账风险',
    summary: '覆盖付款码、扫一扫、银行卡绑定和密码安全，重点讲清防误操作。',
    lessons: '3 节课',
    milestone: '10 里程',
    theme: 'mist',
    art: 'panels',
  },
  {
    id: 'catalog-6',
    provider: '反诈课堂',
    coverHeadline: '防诈骗\n识别训练',
    coverFootnote: '守住养老钱',
    title: '长者防诈骗识别训练：保健品、中奖、冒充客服逐个辨别',
    summary: '用真实案例讲清高频骗局，帮助长者建立“先核实再转账”的习惯。',
    lessons: '4 节课',
    milestone: '12 里程',
    theme: 'violet',
    art: 'orbit',
  },
  {
    id: 'catalog-7',
    provider: '兴趣课堂',
    coverHeadline: '短视频剪辑\n轻松上手',
    coverFootnote: '学会拍也学会发',
    title: '短视频剪辑轻松上手：拍广场舞、配音乐、发给家人看',
    summary: '从拍摄、剪辑到添加字幕，适合想记录生活和分享作品的长者。',
    lessons: '6 节课',
    milestone: '16 里程',
    theme: 'azure',
    art: 'poster',
  },
  {
    id: 'catalog-8',
    provider: '智慧生活课',
    coverHeadline: '智能家居\n设备使用',
    coverFootnote: '血压计音箱都能连',
    title: '智能家居设备使用：血压计、语音音箱和门铃都能学会',
    summary: '教会长者连接常见家居设备，提升居家便利和安全感。',
    lessons: '4 节课',
    milestone: '12 里程',
    theme: 'ice',
    art: 'badge',
  },
  {
    id: 'catalog-9',
    provider: '书画课堂',
    coverHeadline: '书法基础\n慢练课程',
    coverFootnote: '适合零基础',
    title: '书法基础慢练课程：握笔、运笔到常用字临摹',
    summary: '节奏舒缓，适合退休后培养兴趣，兼顾手部训练与审美体验。',
    lessons: '8 节课',
    milestone: '20 里程',
    theme: 'azure',
    art: 'panels',
  },
  {
    id: 'catalog-10',
    provider: '健康运动课',
    coverHeadline: '健康养生\n科学运动',
    coverFootnote: '跟练更安全',
    title: '健康养生科学运动课：晨练、拉伸和膝肩保护一起学',
    summary: '结合医生建议设计动作节奏，适合中老年人日常居家锻炼。',
    lessons: '5 节课',
    milestone: '14 里程',
    theme: 'coral',
    art: 'poster',
  },
  {
    id: 'catalog-11',
    provider: '社区参与课',
    coverHeadline: '社区志愿服务\n数字协作',
    coverFootnote: '会报名也会签到',
    title: '社区志愿服务数字协作：会报名、会签到，也会看活动通知',
    summary: '帮助长者参与社区活动，学会查看通知、提交报名和完成签到。',
    lessons: '3 节课',
    milestone: '10 里程',
    theme: 'gold',
    art: 'ring',
  },
  {
    id: 'catalog-12',
    provider: '就医实用课',
    coverHeadline: '医保电子码与\n医院自助机',
    coverFootnote: '线下就医更省心',
    title: '医保电子码与医院自助机使用：挂号、缴费、取报告都能学',
    summary: '围绕医院大厅真实流程设计，帮助长者减少排队和问路压力。',
    lessons: '4 节课',
    milestone: '12 里程',
    theme: 'lime',
    art: 'panels',
  },
]

const discussionPosts: DiscussionPost[] = [
  {
    id: 'discussion-1',
    author: '林社工',
    time: '1天前',
    group: '智慧助老共创群',
    groupMark: '智',
    groupTone: 'linear-gradient(135deg, #295fe6 0%, #4c8dff 100%)',
    title: '想给社区长者做一个“吃药提醒 + 家属通知”小应用，大家有什么表单设计建议？',
    paragraphs: [
      '我们现在还在用纸质登记，护理员每次回访都要再抄一次，容易漏项。',
      '准备改成飞书表单 + 自动提醒：长者确认是否已服药，异常时同步通知家属和网格员。',
      '目前最纠结的是字段要不要控制在 5 个以内，以及字号、按钮大小怎么做更友好。',
      '如果大家做过适老化表单，欢迎直接贴模板或截图。',
    ],
    extraReplies: 3,
    replyCount: 8,
    replies: [
      { author: '周宁', content: '建议把“已服药/未服药”做成两个超大按钮，别让老人自己输入。' },
      { author: '王医生', content: '异常原因可以预设成 4 个选项，护理员补充备注即可。' },
      { author: '陈阿姨', content: '家属通知最好加一个“已知晓”回执，不然社区还得再电话。' },
    ],
    avatarTone: 'linear-gradient(135deg, #cfdcff 0%, #88aefb 100%)',
  },
  {
    id: 'discussion-2',
    author: '周宁',
    time: '2天前',
    group: '银龄活动组织群',
    groupMark: '银',
    groupTone: 'linear-gradient(135deg, #2f61df 0%, #5a91ff 100%)',
    title: '给社区活动室做了大字版签到屏，叔叔阿姨第一次就会用了',
    paragraphs: [
      '这次把签到页从 8 个字段减到 3 个：姓名、手机号后四位、是否需要接送。',
      '按钮高度统一到 56px，主按钮只保留“签到”和“找工作人员帮忙”两个动作。',
      '上线第一天，前台电话咨询量比上周少了三分之二。',
    ],
    extraReplies: 1,
    replyCount: 5,
    replies: [
      { author: '林社工', content: '这个“找工作人员帮忙”按钮太关键了，很多老人需要心理兜底。' },
    ],
    avatarTone: 'linear-gradient(135deg, #d6e3ff 0%, #92b2ff 100%)',
  },
  {
    id: 'discussion-3',
    author: '王医生',
    time: '3天前',
    group: '社区健康随访组',
    groupMark: '健',
    groupTone: 'linear-gradient(135deg, #2c6fda 0%, #67a8ff 100%)',
    title: '我们把高血压随访表改成了“异常先上报”模式，志愿者终于愿意用了',
    paragraphs: [
      '以前一张表要填完十几项，志愿者总担心自己填错，现在改成先判断异常，再补录详细内容。',
      '新流程上线后，异常上报更快，正常随访只需要 20 秒左右。',
    ],
    extraReplies: 2,
    replyCount: 4,
    replies: [
      { author: '刘护士', content: '建议再加一个“家属已联系”勾选项，交接班时会更清楚。' },
      { author: '周宁', content: '这种先判断再展开的写法很适合移动端，长者志愿者都不容易慌。' },
    ],
    avatarTone: 'linear-gradient(135deg, #dce8ff 0%, #99bbff 100%)',
  },
]

const relatedGroups: RelatedGroup[] = [
  {
    id: 'group-1',
    name: '智慧助老共创群',
    mark: '智',
    tone: 'linear-gradient(135deg, #1d4fe2 0%, #4d88ff 100%)',
    description: '社区工作者、养老机构运营者和数字化伙伴一起打磨银龄服务流程。',
    members: '1.2k',
  },
  {
    id: 'group-2',
    name: '银龄活动组织群',
    mark: '银',
    tone: 'linear-gradient(135deg, #245bda 0%, #5d95ff 100%)',
    description: '聚焦活动报名、签到、接送和志愿者排班等社区协作问题。',
    members: '860',
  },
]

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25A5.25 5.25 0 0 1 7.25 3 5.7 5.7 0 0 1 12 5.3 5.7 5.7 0 0 1 16.75 3 5.25 5.25 0 0 1 22 8.25c0 3.84-3.4 6.99-8.55 11.78z" />
    </svg>
  )
}

function FireIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.8 2.4c.18 2.54-.76 4.1-1.75 5.76-.97 1.6-1.98 3.25-1.98 5.76 0 1.42.82 3.68 3.09 3.68 2.41 0 3.34-2.05 3.34-4.06 0-1.39-.38-2.47-.9-3.43 1.82.99 3.64 3.13 3.64 6.08A6.24 6.24 0 0 1 12 22a6.25 6.25 0 0 1-6.25-6.25c0-3.18 1.72-5.28 3.35-7.31 1.34-1.67 2.62-3.25 2.87-6.04z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2.2a4.2 4.2 0 0 0-4.2-4.2H7.2A4.2 4.2 0 0 0 3 18.8V21" />
      <circle cx="10" cy="7.4" r="3.3" />
      <path d="M21 21v-2.2a4.2 4.2 0 0 0-2.8-3.96" />
      <path d="M14.8 4.25a3.3 3.3 0 0 1 0 6.3" />
    </svg>
  )
}

function PlatformMarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.2c0-1.22.98-2.2 2.2-2.2h5.7c.58 0 1.13.23 1.54.64l1.92 1.92a2.2 2.2 0 0 0 1.56.64h.88A2.2 2.2 0 0 1 20 10.4v7.4A2.2 2.2 0 0 1 17.8 20H6.2A2.2 2.2 0 0 1 4 17.8z" fill="#2C67FF" />
      <path d="M4.55 8.25a2.2 2.2 0 0 1 2.05-1.45h4.76c.54 0 1.06.2 1.45.57l1.76 1.68c.4.39.93.6 1.48.6h3.02A2.2 2.2 0 0 1 20 10.4v.72c-.27-.07-.56-.1-.84-.1h-3.12c-.74 0-1.45-.29-1.97-.8L12.3 8.52a2.2 2.2 0 0 0-1.53-.62H6.46c-.73 0-1.42.13-1.91.35z" fill="#86B0FF" />
      <path d="M8.2 10.1h7.9M8.2 13.1h5.3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function Home(props: HomeProps) {
  const { onOpenAI, elderMode } = props
  const [activeTab, setActiveTab] = useState<HomeTabId>('home')
  const isDiscussionView = activeTab === 'discussion'
  const isCourseView = activeTab === 'course'

  const handleTabChange = (tabId: HomeTabId) => {
    if (tabId === 'ai') {
      onOpenAI()
      return
    }

    setActiveTab(tabId)
  }

  return (
    <div className={`community-home ${elderMode ? 'community-home-elder' : ''} ${isDiscussionView ? 'community-home-discussion' : ''} ${isCourseView ? 'community-home-course' : ''}`}>
      <div className={`community-home-shell ${isDiscussionView ? 'community-home-shell-discussion' : ''} ${isCourseView ? 'community-home-shell-course' : ''}`}>
        {!isDiscussionView && !isCourseView && (
          <section className="community-hero-stack">
            <div className="community-hero-banner">
              <div className="community-hero-copy">
                <span className="community-hero-kicker">银龄共创空间</span>
                <h1 className="community-hero-title">老年社区</h1>
                <p className="community-hero-description">
                  围绕智慧助老、康养服务和社区陪伴的银龄共创空间
                </p>
              </div>

              <div className="community-hero-visual" aria-hidden="true">
                <span className="community-hero-figure">👵</span>
                <div className="community-hero-chip-group">
                  <span className="community-hero-chip">🤝</span>
                  <span className="community-hero-chip">🧑‍⚕️</span>
                  <span className="community-hero-chip">🤖</span>
                </div>
              </div>
            </div>

            <div className="community-side-card">
              <div className="community-side-top">
                <div>
                  <h2 className="community-side-title">老年社区</h2>
                  <div className="community-side-meta">
                    运营者：
                    <span className="community-side-operator">🌼 银龄服务组</span>
                  </div>
                </div>
                <span className="community-side-status">活跃中</span>
              </div>

              <div className="community-side-note">
                围绕智慧助老、康养服务和社区陪伴的银龄共创空间
              </div>

              <button className="community-follow-button" type="button">
                <HeartIcon />
                <span>已订阅（1.3万人订阅）</span>
              </button>
            </div>
          </section>
        )}

        <div className="community-tabs-wrap">
          <div className="community-tabs" aria-label="老年社区频道">
            {communityTabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  className={`community-tab ${isActive ? 'is-active' : ''}`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className="community-tab-count">({tab.count})</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {isDiscussionView ? (
          <div className="discussion-page">
            <section className="discussion-section">
              <div className="community-section-head">
                <h3 className="community-section-title">
                  全部帖子
                  <span className="discussion-count">({discussionPosts.length})</span>
                </h3>
              </div>

              <div className="discussion-post-list">
                {discussionPosts.map((post) => (
                  <article className="discussion-post-card" key={post.id}>
                    <div className="discussion-post-head">
                      <div className="discussion-post-avatar" style={{ background: post.avatarTone }}>
                        {post.author.slice(0, 1)}
                      </div>

                      <div className="discussion-post-head-body">
                        <div className="discussion-post-meta-line">
                          <span className="discussion-post-author">{post.author}</span>
                          <span className="topic-separator" />
                          <span className="discussion-post-time">{post.time}</span>
                          <span className="discussion-post-inline">在</span>
                          <span className="discussion-post-group-badge">
                            <span className="discussion-post-group-mark" style={{ background: post.groupTone }}>
                              {post.groupMark}
                            </span>
                            <span className="discussion-post-group-name">{post.group}</span>
                          </span>
                          <span className="discussion-post-inline">发布</span>
                        </div>
                      </div>
                    </div>

                    <h4 className="discussion-post-title">{post.title}</h4>

                    <div className="discussion-post-body">
                      {post.paragraphs.map((paragraph, index) => (
                        <p className="discussion-post-paragraph" key={`${post.id}-paragraph-${index}`}>
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {post.replies.length > 0 && (
                      <div className="discussion-reply-box">
                        <div className="discussion-reply-more">更多 {post.extraReplies} 条回复</div>
                        {post.replies.map((reply, index) => (
                          <div className="discussion-reply-item" key={`${post.id}-reply-${index}`}>
                            <span className="discussion-reply-author">{reply.author}：</span>
                            <span>{reply.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="discussion-post-footer">
                      <span className="discussion-post-metric">
                        <CommentIcon />
                        {post.replyCount} 条回复
                      </span>
                      <button className="discussion-post-action" type="button">
                        参与讨论
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="discussion-section">
              <div className="community-section-head">
                <h3 className="community-section-title">
                  相关群组
                  <span className="discussion-count">({relatedGroups.length})</span>
                </h3>
              </div>

              <div className="discussion-group-list">
                {relatedGroups.map((group) => (
                  <button
                    className="discussion-group-card"
                    key={group.id}
                    type="button"
                    onClick={() => setActiveTab('discussion')}
                  >
                    <div className="discussion-group-card-head">
                      <span className="discussion-group-icon" style={{ background: group.tone }}>
                        {group.mark}
                      </span>

                      <div className="discussion-group-card-copy">
                        <h4 className="discussion-group-name">{group.name}</h4>
                        <p className="discussion-group-description">{group.description}</p>
                      </div>
                    </div>

                    <div className="discussion-group-card-footer">
                      <span className="discussion-group-members">
                        <UsersIcon />
                        {group.members}
                      </span>
                      <span className="discussion-group-link">
                        前往
                        <ChevronRightIcon />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : isCourseView ? (
          <div className="course-page">
            <section className="course-page-head">
              <div>
                <h3 className="community-section-title">
                  全部课程
                  <span className="discussion-count">({communityTabs.find((tab) => tab.id === 'course')?.count})</span>
                </h3>
                <p className="course-page-subtitle">围绕智能手机、健康养生、兴趣成长和社区参与的银龄课程合集</p>
              </div>
            </section>

            <section className="course-catalog-grid">
              {courseCatalogItems.map((course) => (
                <button
                  className="course-catalog-card"
                  key={course.id}
                  type="button"
                >
                  <div className={`course-catalog-cover course-catalog-cover-${course.theme} course-catalog-cover-art-${course.art}`}>
                    <div className="course-catalog-cover-topline">
                      <span className="course-catalog-provider-mark">
                        <PlatformMarkIcon />
                      </span>
                      <span className="course-catalog-provider">{course.provider}</span>
                    </div>

                    <div className="course-catalog-cover-copy">
                      <h4 className="course-catalog-cover-title">{course.coverHeadline}</h4>
                      <p className="course-catalog-cover-footnote">{course.coverFootnote}</p>
                    </div>

                    <span className="course-catalog-cover-shape course-catalog-cover-shape-main" />
                    <span className="course-catalog-cover-shape course-catalog-cover-shape-sub" />
                    <span className="course-catalog-cover-emblem">
                      <PlatformMarkIcon />
                    </span>
                  </div>

                  <div className="course-catalog-body">
                    <h4 className="course-catalog-title">{course.title}</h4>
                    <p className="course-catalog-summary">{course.summary}</p>
                    <div className="course-catalog-meta">
                      <span className="course-catalog-meta-item">
                        <PlatformMarkIcon />
                        {course.lessons}
                      </span>
                      <span className="course-catalog-meta-item">{course.milestone}</span>
                    </div>
                  </div>
                </button>
              ))}
            </section>
          </div>
        ) : (
          <>
            <section className="community-section">
              <div className="community-section-head">
                <h3 className="community-section-title">正在热议</h3>
                <button
                  className="community-section-link"
                  type="button"
                  onClick={() => setActiveTab('discussion')}
                >
                  查看更多
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="topic-strip">
                {hotTopics.map((topic) => (
                  <button
                    key={topic.id}
                    className="topic-card"
                    type="button"
                    onClick={() => setActiveTab('discussion')}
                  >
                    <div className="topic-card-head">
                      <div className="topic-avatar" style={{ background: topic.avatarTone }}>
                        {topic.author.slice(0, 1)}
                      </div>

                      <div className="topic-author-block">
                        <div className="topic-author-row">
                          <span className="topic-author">{topic.author}</span>
                          <span className="topic-separator" />
                          <span className="topic-time">{topic.time}</span>
                        </div>
                        <span className="topic-tag">{topic.tag}</span>
                      </div>
                    </div>

                    <h4 className="topic-title">{topic.title}</h4>
                    <p className="topic-summary">{topic.summary}</p>

                    <div className="topic-footer">
                      <span className="topic-metric">
                        <CommentIcon />
                        {topic.comments}
                      </span>
                      <span className="topic-link">
                        查看详情
                        <ChevronRightIcon />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="community-section">
              <div className="community-section-head">
                <h3 className="community-section-title">AI 工坊</h3>
                <button className="community-section-link" type="button" onClick={onOpenAI}>
                  全部
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="workshop-strip">
                {workshopItems.map((item) => (
                  <button
                    key={item.id}
                    className="workshop-card"
                    type="button"
                    onClick={onOpenAI}
                  >
                    <div className="workshop-meta">
                      <span className="workshop-author-chip">
                        <span className="workshop-author-avatar">{item.author.slice(0, 1)}</span>
                        <span className="workshop-author">{item.author}</span>
                      </span>

                      <span className="workshop-metric">
                        <FireIcon />
                        {item.heat}
                      </span>
                      <span className="workshop-metric">
                        <CommentIcon />
                        {item.comments}
                      </span>
                    </div>

                    <div className="workshop-title">{item.title}</div>

                    <div className={`workshop-visual workshop-visual-${item.tone}`}>
                      <span className="workshop-visual-surface" />
                      <span className="workshop-visual-note" />
                      <span className="workshop-visual-emoji" aria-hidden="true">
                        {item.emoji}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="community-section">
              <div className="community-section-head">
                <h3 className="community-section-title">精选课程</h3>
                <button
                  className="community-section-link"
                  type="button"
                  onClick={() => setActiveTab('course')}
                >
                  全部
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="course-strip">
                {featuredCourses.map((course) => (
                  <button
                    key={course.id}
                    className="course-card"
                    type="button"
                    onClick={() => setActiveTab('course')}
                  >
                    <div className={`course-cover course-cover-${course.tone}`}>
                      <span className="course-cover-frame" />
                      <span className="course-cover-glow" />
                      <span className="course-cover-emoji" aria-hidden="true">
                        {course.emoji}
                      </span>
                    </div>

                    <div className="course-body">
                      <span className={`course-label course-label-${course.labelTone}`}>
                        {course.label}
                      </span>
                      <h4 className="course-title">{course.title}</h4>
                      <div className="course-meta">
                        <span>{course.lessons}</span>
                        <span>{course.milestone}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
