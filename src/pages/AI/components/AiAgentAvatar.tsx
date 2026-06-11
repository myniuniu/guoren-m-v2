import { AiNameAvatar, type AiNameAvatarTone } from './AiNameAvatar'

type AiAgentAvatarProps = {
  name?: string
  avatarUrl?: string | null
  tone?: AiNameAvatarTone
  className: string
  imageClassName: string
  ariaLabel?: string
}

export function AiAgentAvatar({
  name,
  avatarUrl,
  tone = 'white',
  className,
  imageClassName,
  ariaLabel,
}: AiAgentAvatarProps) {
  return (
    <AiNameAvatar
      ariaLabel={ariaLabel}
      avatarUrl={avatarUrl}
      className={className}
      imageClassName={imageClassName}
      name={name}
      tone={tone}
    />
  )
}
