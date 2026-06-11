/**
 * 聊天窗口主页面
 * NavBar（头像+名称+返回）+ 消息列表 + 底部输入区
 */

import React, { useEffect, useRef } from 'react';
import { NavBar, SpinLoading, Empty } from 'antd-mobile';
import { useMessageList } from '../hooks/useMessageList';
import MessageBubble from './MessageBubble';
import Avatar from './Avatar';
import MessageInputBar from './MessageInputBar';
import { formatMessageTime } from '../utils/formatTime';
import type { MergedConversation } from '../hooks/useConversationList';
import { useDisplayName } from '../utils/displayNameHooks';

interface ChatPageProps {
  conversation: MergedConversation;
  onBack: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ conversation, onBack }) => {
  const {
    messages,
    status,
    error,
    hasMore,
    loadMore,
    sendTextMessage,
    sendImageMessage,
    sendAssetMessage,
    revokeMessage,
    resendMessage,
  } = useMessageList({
    conversationID: conversation.conversation_id,
    conversationType: conversation.type,
    targetUserID: extractTargetUserID(conversation),
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // 提取对方 userID，用于 displayName 查询
  const targetUserID = extractTargetUserID(conversation);
  const displayName = useDisplayName(targetUserID, conversation.title);

  // 进入聊天页面时隐藏底部导航栏，退出时恢复
  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.classList.add('im-chat-view');
    }
    return () => {
      if (appContainer) {
        appContainer.classList.remove('im-chat-view');
      }
    };
  }, []);

  // 新消息到达时自动滚到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // 处理上拉加载
  const handleScroll = () => {
    if (!scrollRef.current || !hasMore || status === 'loading') return;
    if (scrollRef.current.scrollTop < 50) {
      loadMore();
    }
  };

  // 判断是否需要显示时间分割线（相邻消息间隔 > 5 分钟）
  const shouldShowTimeDivider = (index: number) => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (!prev.time || !curr.time) return false;
    return curr.time - prev.time > 300;
  };

  // loading 状态
  if (status === 'loading' && messages.length === 0) {
    return (
      <div className="im-chat-page">
        <NavBar onBack={onBack} className="im-chat-navbar">
          <div className="im-chat-navbar-title">{displayName}</div>
        </NavBar>
        <div className="im-chat-loading">
          <SpinLoading color="primary" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // error 状态
  if (status === 'error' && messages.length === 0) {
    return (
      <div className="im-chat-page">
        <NavBar onBack={onBack} className="im-chat-navbar">
          <div className="im-chat-navbar-title">{displayName}</div>
        </NavBar>
        <div className="im-chat-error">
          <Empty description={error || '加载失败'} />
          <button className="im-chat-retry-btn" onClick={loadMore}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="im-chat-page">
      {/* 顶部导航 */}
      <NavBar onBack={onBack} className="im-chat-navbar">
        <div className="im-chat-navbar-title">{displayName}</div>
      </NavBar>

      {/* 消息列表 */}
      <div className="im-chat-messages" ref={scrollRef} onScroll={handleScroll}>
        {hasMore && status !== 'loading' && (
          <div className="im-chat-load-more" onClick={loadMore}>
            加载更多消息
          </div>
        )}
        {status === 'loading' && hasMore && (
          <div className="im-chat-load-more-loading">
            <SpinLoading style={{ width: 16 }} />
          </div>
        )}

        {messages.map((msg, index) => (
          <React.Fragment key={msg.id}>
            {shouldShowTimeDivider(index) && (
              <div className="im-chat-time-divider">
                {formatMessageTime(msg.time ? new Date(msg.time * 1000).toISOString() : null)}
              </div>
            )}
            {/* 系统消息和撤回消息不显示头像 */}
            {msg.category === 'system' || msg.isRecalled ? (
              <MessageBubble
                message={msg}
                onResend={resendMessage}
                onRevoke={revokeMessage}
              />
            ) : (
              <div className={`im-msg-with-avatar ${msg.fromMe ? 'im-msg-with-avatar--right' : 'im-msg-with-avatar--left'}`}>
                {/* 对方消息（C2C 中即对话对方），直接用对话 displayName */}
                {!msg.fromMe && (
                  <MessageSenderAvatar
                    url={msg.avatar}
                    userID={msg.from}
                    conversation={conversation}
                    conversationDisplayName={displayName}
                  />
                )}
                <MessageBubble
                  message={msg}
                  onResend={resendMessage}
                  onRevoke={revokeMessage}
                />
                {/* 自己的消息也统一走发送人 displayName，避免继续显示用户 ID */}
                {msg.fromMe && <MessageSenderAvatar url={msg.avatar} userID={msg.from} conversation={conversation} />}
              </div>
            )}
          </React.Fragment>
        ))}

        {messages.length === 0 && (
          <div className="im-chat-empty">
            <Empty description="暂无消息，开始聊天吧" />
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <MessageInputBar
        onSendText={sendTextMessage}
        onSendImage={sendImageMessage}
        onSendAsset={sendAssetMessage}
      />
    </div>
  );
};

/** 从会话 ID 中提取目标用户 ID
 * SDK 会话 ID 格式（已由 useConversationList 统一转换）：
 *   C2C 私聊: C2C@RBT#userID 或 C2C#userID 或 C2CuserID
 *   GROUP 群聊: GROUP@TGS#groupID 或 GROUPgroupID
 * 发送消息时 to 参数需要纯 userID（含前缀如 @RBT#）
 */
function extractTargetUserID(conversation: MergedConversation): string {
  const convId = conversation.conversation_id;

  // C2C 私聊: 去掉 "C2C" 前缀，再去掉前导 #（如果有的话）
  if (convId.startsWith('C2C')) {
    const afterC2C = convId.slice(3);
    return afterC2C.startsWith('#') ? afterC2C.slice(1) : afterC2C;
  }

  // GROUP 群聊: 去掉 "GROUP" 前缀
  if (convId.startsWith('GROUP')) {
    return convId.slice(5);
  }

  return '';
}

export default ChatPage;

function resolveAvatarDisplayName(
  userID: string,
  conversation: MergedConversation,
  conversationDisplayName?: string,
): string {
  if (!userID) {
    return conversationDisplayName || '';
  }

  if (conversation.type === 'group' || conversation.type === 'community') {
    return userID;
  }

  return conversationDisplayName || userID;
}

function MessageSenderAvatar({
  url,
  userID,
  conversation,
  conversationDisplayName,
}: {
  url?: string;
  userID: string;
  conversation: MergedConversation;
  conversationDisplayName?: string;
}) {
  const fallbackName = resolveAvatarDisplayName(userID, conversation, conversationDisplayName);
  const displayName = useDisplayName(userID, fallbackName);

  return <Avatar url={url} name={displayName || fallbackName || userID} />;
}
