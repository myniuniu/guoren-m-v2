/**
 * 单条会话行组件
 * 视觉对齐 master 消息列表，会话点击和标题解析继续沿用当前分支
 */

import React from 'react';
import { formatConversationTime } from '../utils/formatTime';
import type { MergedConversation } from '../hooks/useConversationList';
import { useDisplayName } from '../utils/displayNameHooks';
import DisplayName from '../../../components/DisplayName';

interface ConversationItemProps {
  conversation: MergedConversation;
  onClick?: (conversation: MergedConversation) => void;
}

const filledAvatarTones = ['peach', 'blue', 'lilac'] as const;
const outlineAvatarTones = ['olive', 'gold', 'green', 'violet', 'pink', 'teal'] as const;

function MutedBellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b1b4bc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 19a2.5 2.5 0 0 1-5 0" />
      <path d="M18 10.6a6 6 0 0 0-5-5.9" opacity="0.45" />
      <path d="M10.2 4.9A6 6 0 0 0 6 10.6c0 4-1.8 5.6-1.8 5.6H16" opacity="0.45" />
      <path d="m4 4 16 16" />
    </svg>
  );
}

function pickAvatarTone(seed: string, tones: readonly string[]) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return tones[hash % tones.length];
}

function buildAvatarLines(title: string) {
  const compactTitle = title.replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
  if (!compactTitle) return ['?'];
  if (compactTitle.length === 1) return [compactTitle];
  return [compactTitle.slice(0, 2), compactTitle.slice(2, 4)].filter(Boolean);
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
  const finalTitle = conversation.type === 'c2c' || conversation.type === 'ai_c2c' ? displayName : title;
  const conversationKindLabel = conversation.type === 'group' || conversation.type === 'community' ? '群聊' : null;
  const previewText = last_msg_preview || '暂无消息';
  const previewContent =
    conversationKindLabel && conversation.last_msg_from ? (
      <>
        <DisplayName userId={conversation.last_msg_from} fallback={conversation.last_msg_from} />
        {`: ${previewText}`}
      </>
    ) : (
      previewText
    );

  const isGroupConversation = conversation.type === 'group' || conversation.type === 'community';
  const avatarTone = isGroupConversation
    ? pickAvatarTone(conversation_id || finalTitle, outlineAvatarTones)
    : pickAvatarTone(conversation_id || finalTitle, filledAvatarTones);
  const avatarLines = buildAvatarLines(finalTitle);

  return (
    <div className="im-conversation-item" onClick={() => onClick?.(conversation)}>
      <div className="im-conversation-avatar-wrap">
        {avatar ? (
          <div className="im-conversation-avatar is-image">
            <img src={avatar} alt={finalTitle} className="im-conversation-avatar-img" />
          </div>
        ) : (
          <div className={`im-conversation-avatar ${isGroupConversation ? `is-outline-${avatarTone}` : `is-filled-${avatarTone}`}`}>
            {isGroupConversation ? (
              <div className="im-conversation-avatar-stack">
                {avatarLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            ) : (
              <span className="im-conversation-avatar-single">{avatarLines[0]?.slice(0, 1) || '?'}</span>
            )}
          </div>
        )}
      </div>

      <div className="im-conversation-content">
        <div className="im-conversation-header">
          <div className="im-conversation-title-line">
            <span className="im-conversation-title">{finalTitle}</span>
            {conversationKindLabel ? <span className="im-conversation-kind-tag">{conversationKindLabel}</span> : null}
          </div>
          <span className="im-conversation-time">{formatConversationTime(last_msg_time)}</span>
        </div>

        <div className="im-conversation-footer">
          <span className="im-conversation-preview">{previewContent}</span>
          <div className="im-conversation-side">
            {unread_count > 0 ? (
              <span className="im-conversation-unread-badge">{unread_count > 99 ? '99+' : unread_count}</span>
            ) : conversation.pinned ? (
              <span className="im-conversation-pinned-dot" aria-hidden="true" />
            ) : conversation.muted ? (
              <span className="im-conversation-muted-icon" aria-hidden="true">
                <MutedBellIcon />
              </span>
            ) : (
              <span className="im-conversation-side-placeholder" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
