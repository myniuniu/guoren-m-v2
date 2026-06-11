import type { CSSProperties } from 'react'

export type AiNameAvatarTone = 'white' | 'blue' | 'green' | 'orange'

type AiNameAvatarProps = {
  name?: string
  avatarUrl?: string | null
  tone: AiNameAvatarTone
  className: string
  imageClassName: string
  ariaLabel?: string
}

const AI_NAME_AVATAR_FALLBACK_STYLES: Record<AiNameAvatarTone, CSSProperties> = {
  white: {
    background: '#ffffff',
    color: '#1f2329',
    border: '1px solid #e5e7eb',
    boxShadow: 'none',
  },
  blue: {
    background: '#2795F5',
    color: '#ffffff',
    border: 'none',
    boxShadow: 'none',
  },
  green: {
    background: '#43C473',
    color: '#ffffff',
    border: 'none',
    boxShadow: 'none',
  },
  orange: {
    background: '#F56C27',
    color: '#ffffff',
    border: 'none',
    boxShadow: 'none',
  },
}

export function getAiNameAvatarLetter(name?: string): string {
  return name?.trim().charAt(0).toUpperCase() || '智'
}

export function normalizeAiAvatarUrl(avatarUrl?: string | null): string | null {
  const trimmedAvatarUrl = avatarUrl?.trim()

  if (!trimmedAvatarUrl) {
    return null
  }

  if (trimmedAvatarUrl.toLowerCase() === 'example') {
    return null
  }

  if (
    trimmedAvatarUrl.toLowerCase() === 'example.com'
    || trimmedAvatarUrl.toLowerCase().startsWith('example.com/')
  ) {
    return null
  }

  try {
    const parsedUrl = new URL(trimmedAvatarUrl)
    const hostname = parsedUrl.hostname.toLowerCase()

    if (hostname === 'example.com' || hostname.endsWith('.example.com')) {
      return null
    }
  } catch {
    return trimmedAvatarUrl
  }

  return trimmedAvatarUrl
}

export function AiNameAvatar({
  name,
  avatarUrl,
  tone,
  className,
  imageClassName,
  ariaLabel,
}: AiNameAvatarProps) {
  const normalizedAvatarUrl = normalizeAiAvatarUrl(avatarUrl)
  const resolvedAriaLabel = ariaLabel || `${name || '智能体'}头像`

  return (
    <div
      aria-label={resolvedAriaLabel}
      className={className}
      data-tone={tone}
      role="img"
      style={normalizedAvatarUrl ? undefined : AI_NAME_AVATAR_FALLBACK_STYLES[tone]}
    >
      {normalizedAvatarUrl ? (
        <img alt="" className={imageClassName} src={normalizedAvatarUrl} />
      ) : (
        <span>{getAiNameAvatarLetter(name)}</span>
      )}
    </div>
  )
}
