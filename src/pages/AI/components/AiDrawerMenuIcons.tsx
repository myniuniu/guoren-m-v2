export type AiDrawerMenuIconKey = 'new' | 'library' | 'skills' | 'discover'

export const AI_DRAWER_MENU_ITEMS: Array<{ key: AiDrawerMenuIconKey; label: string }> = [
  { key: 'new', label: '新建' },
  { key: 'discover', label: '发现' },
  { key: 'library', label: '库' },
  { key: 'skills', label: '技能' },
]

type AiDrawerMenuIconProps = {
  size?: number
}

export function AiDrawerMenuNewIcon({ size = 18 }: AiDrawerMenuIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function AiDrawerMenuLibraryIcon({ size = 18 }: AiDrawerMenuIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 7.5c0-1.1.9-2 2-2h3.1c.54 0 1.05.26 1.36.69l1.03 1.42c.3.42.8.67 1.31.67h4.19c1.1 0 2 .9 2 2v6.22c0 1.1-.9 2-2 2H6.5c-1.1 0-2-.9-2-2z" />
      <path d="M4.5 9.5h15" />
    </svg>
  )
}

export function AiDrawerMenuSkillsIcon({ size = 18 }: AiDrawerMenuIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4.5a3 3 0 0 1 4.24 4.24l-1.42 1.42-4.24-4.24z" />
      <path d="M13.09 5.91 5.3 13.7a2 2 0 0 0 0 2.83l2.17 2.17a2 2 0 0 0 2.83 0l7.79-7.79" />
      <path d="m8.5 11.5 4 4" />
    </svg>
  )
}

export function AiDrawerMenuDiscoverIcon({ size = 18 }: AiDrawerMenuIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M17.5 14v7M14 17.5h7" />
    </svg>
  )
}

export function renderAiDrawerMenuIcon(type: AiDrawerMenuIconKey) {
  switch (type) {
    case 'new':
      return <AiDrawerMenuNewIcon />
    case 'library':
      return <AiDrawerMenuLibraryIcon />
    case 'skills':
      return <AiDrawerMenuSkillsIcon />
    case 'discover':
      return <AiDrawerMenuDiscoverIcon />
    default:
      return null
  }
}
