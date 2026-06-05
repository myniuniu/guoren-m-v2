import React from 'react';

interface AvatarProps {
  /** 头像图片 URL */
  url?: string;
  /** 用户名称（用于生成默认头像首字母） */
  name: string;
  /** 头像尺寸（像素） */
  size?: number;
}

/** 消息气泡旁的头像组件 */
const Avatar: React.FC<AvatarProps> = ({ url, name, size = 36 }) => {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="im-msg-avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }

  // 无头像 URL 时，显示姓名首字母作为默认头像（保持原样，不转换大小写）
  const initial = name ? name.charAt(0) : '?';
  return (
    <div
      className="im-msg-avatar-default"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
};

export default Avatar;
