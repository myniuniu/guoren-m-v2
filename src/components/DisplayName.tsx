/**
 * DisplayName 组件
 * 根据 userId 查询并显示用户的 displayName
 * 底层使用 displayNameStore 的缓存机制，避免重复请求
 */

import { useDisplayName } from '../pages/IM/utils/displayNameHooks'

interface DisplayNameProps {
  /** 用户 ID */
  userId: string
  /** 查不到时的回退文字，默认显示 userId */
  fallback?: string
  /** 前缀，例如 @ */
  prefix?: string
  /** 自定义 className */
  className?: string
}

export default function DisplayName({ userId, fallback, prefix = '', className }: DisplayNameProps) {
  const name = useDisplayName(userId, fallback || userId)
  return <span className={className}>{prefix}{name}</span>
}
