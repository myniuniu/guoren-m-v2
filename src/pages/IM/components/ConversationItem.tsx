/**
 * 单条会话行组件
 * 头像 + 标题 + 消息摘要 + 时间 + 未读角标
 */

import React from 'react';
import { Badge } from 'antd-mobile';
import { formatConversationTime } from '../utils/formatTime';
import type { MergedConversation } from '../hooks/useConversationList';
import { useDisplayName } from '../utils/displayNameHooks';

interface ConversationItemProps {
  conversation: MergedConversation;
  onClick?: (conversation: MergedConversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onClick }) => {
  const { title, avatar, last_msg_preview, last_msg_time, unread_count, conversation_id } = conversation;

  // 从会话 ID 提取对方 userID，用于 displayName 查询
  let targetUserID: string | undefined;
  if (conversation.type === 'c2c' || conversation.type === 'ai_c2c') {
    const convId = conversation_id;
    if (convId.startsWith('C2C')) {
      const after = convId.slice(3);
      targetUserID = after.startsWith('#') ? after.slice(1) : after;
    }
  }

  const displayName = useDisplayName(targetUserID, title);
  // 群聊保持原有 title，C2C 私聊使用 displayName
  const finalTitle = (conversation.type === 'c2c' || conversation.type === 'ai_c2c') ? displayName : title;

  const avatarText = finalTitle ? finalTitle[0] : '?';

  // 会话列表头像统一蓝色背景
  const avatarBg = '#4A7CFF';

  return (
    <div className="im-conversation-item" onClick={() => onClick?.(conversation)}>
      {/* 头像 */}
      <div className="im-conversation-avatar">
        {avatar ? (
          <img src={avatar} alt={finalTitle} className="im-conversation-avatar-img" />
        ) : (
          <div className="im-conversation-avatar-default" style={{ background: avatarBg }}>
            {avatarText}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="im-conversation-content">
          <div className="im-conversation-header">
            <span className="im-conversation-title">{finalTitle}</span>
            <span className="im-conversation-time">{formatConversationTime(last_msg_time)}</span>
          </div>
          <div className="im-conversation-footer">
            <span className="im-conversation-preview">{last_msg_preview || '暂无消息'}</span>
            {unread_count > 0 && (
              <Badge content={unread_count > 99 ? '99+' : unread_count} className="im-conversation-badge" />
            )}
          </div>
        </div>
    </div>
  );
};

export default ConversationItem;
