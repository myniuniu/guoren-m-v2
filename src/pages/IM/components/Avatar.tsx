import React from 'react';
import { buildNameAvatarLines, type NameAvatarVariant } from '../utils/nameAvatar';

interface AvatarProps {
  /** 头像图片 URL */
  url?: string;
  /** 用户名称（用于生成默认头像首字母） */
  name: string;
  /** 头像尺寸（像素） */
  size?: number;
  /** 文字头像模式 */
  variant?: NameAvatarVariant;
  /** 头像形状 */
  shape?: 'circle' | 'rounded';
  /** 额外类名 */
  className?: string;
}

/** 消息气泡旁的头像组件 */
const Avatar: React.FC<AvatarProps> = ({
  url,
  name,
  size = 36,
  variant = 'person',
  shape = 'circle',
  className = '',
}) => {
  const imageClassName = [
    'im-msg-avatar-img',
    shape === 'rounded' ? 'is-rounded' : '',
    className,
  ].filter(Boolean).join(' ');

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={imageClassName}
        style={{ width: size, height: size }}
      />
    );
  }

  const lines = buildNameAvatarLines(name, variant);
  const wrapperClassName = [
    'im-msg-avatar-default',
    variant === 'group' ? 'is-group' : '',
    shape === 'rounded' ? 'is-rounded' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClassName}
      style={{ width: size, height: size }}
    >
      {variant === 'group' ? (
        <span className="im-msg-avatar-default__stack" aria-hidden="true">
          {lines.map((line) => (
            <span key={line} className="im-msg-avatar-default__line">{line}</span>
          ))}
        </span>
      ) : (
        lines[0]
      )}
    </div>
  );
};

export default Avatar;
