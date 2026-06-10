type AiAgentAvatarProps = {
  name?: string
  avatarUrl?: string | null
  className: string
  imageClassName: string
  ariaLabel?: string
}

function getAvatarLetter(name?: string): string {
  return name?.trim().charAt(0).toUpperCase() || '智'
}

function normalizeAgentAvatarUrl(avatarUrl?: string | null): string | null {
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

export function AiAgentAvatar({
  name,
  avatarUrl,
  className,
  imageClassName,
  ariaLabel,
}: AiAgentAvatarProps) {
  const normalizedAvatarUrl = normalizeAgentAvatarUrl(avatarUrl)
  const resolvedAriaLabel = ariaLabel || `${name || '智能体'}头像`

  if (normalizedAvatarUrl) {
    return (
      <div aria-label={resolvedAriaLabel} className={className} role="img">
        <img alt="" className={imageClassName} src={normalizedAvatarUrl} />
      </div>
    )
  }

  return (
    <div aria-label={resolvedAriaLabel} className={className} role="img">
      {getAvatarLetter(name)}
    </div>
  )
}
