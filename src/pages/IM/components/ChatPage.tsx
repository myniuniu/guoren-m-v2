/**
 * 聊天窗口主页面
 * NavBar（头像+名称+返回）+ 消息列表 + 底部输入区
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavBar, SpinLoading, Empty } from 'antd-mobile';
import TencentCloudChat from '@tencentcloud/lite-chat';
import { useMessageList } from '../hooks/useMessageList';
import MessageBubble from './MessageBubble';
import Avatar from './Avatar';
import MessageInputBar from './MessageInputBar';
import { formatMessageTime } from '../utils/formatTime';
import type { MergedConversation } from '../hooks/useConversationList';
import { useDisplayName } from '../utils/displayNameHooks';
import { useGroupMembers, type GroupMemberState } from '../hooks/useGroupMembers';
import GroupSettingsSheet from './GroupSettingsSheet';
import GroupMembersSheet from './GroupMembersSheet';
import ContactPickerSheet from './ContactPickerSheet';
import type { OrgUserItem } from '../../../services/aiOrgMembers';
import { getChatInstance } from '../hooks/useIMLogin';
import { updateConversationState } from '../api/messagingApi';
import { uploadImAssetToOss } from '../utils/imOssUpload';

interface ChatPageProps {
  conversation: MergedConversation;
  onBack: () => void;
  onConversationPatch?: (patch: Partial<MergedConversation>) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ conversation, onBack, onConversationPatch }) => {
  const [conversationState, setConversationState] = useState(conversation);
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
    conversationID: conversationState.conversation_id,
    conversationType: conversationState.type,
    targetUserID: extractTargetUserID(conversationState),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedAddUsers, setSelectedAddUsers] = useState<OrgUserItem[]>([]);

  // 提取对方 userID，用于 displayName 查询
  const targetUserID = extractTargetUserID(conversationState);
  const rawDisplayName = useDisplayName(targetUserID, conversationState.title);
  const groupID = useMemo(() => extractGroupID(conversationState), [conversationState]);
  const isGroupConversation = conversationState.type === 'group' || conversationState.type === 'community';
  const displayName = isGroupConversation ? conversationState.title : rawDisplayName;
  const {
    groupProfile,
    members,
    currentUserRole,
    addMembers,
    removeMembers,
    updateGroupProfile,
  } = useGroupMembers(groupID);

  useEffect(() => {
    setConversationState(conversation);
  }, [conversation]);

  const applyConversationPatch = (patch: Partial<MergedConversation>) => {
    setConversationState((prev) => ({ ...prev, ...patch }));
    onConversationPatch?.(patch);
  };

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
      <NavBar
        onBack={onBack}
        className="im-chat-navbar"
        right={isGroupConversation ? (
          <button
            type="button"
            className="im-chat-navbar-action"
            aria-label="群设置"
            onClick={() => setShowGroupSettings(true)}
          >
            群设置
          </button>
        ) : null}
      >
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
                    conversation={conversationState}
                    conversationDisplayName={displayName}
                  />
                )}
                <MessageBubble
                  message={msg}
                  onResend={resendMessage}
                  onRevoke={revokeMessage}
                />
                {/* 自己的消息也统一走发送人 displayName，避免继续显示用户 ID */}
                {msg.fromMe && <MessageSenderAvatar url={msg.avatar} userID={msg.from} conversation={conversationState} />}
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

      <GroupSettingsSheet
        visible={showGroupSettings}
        conversation={conversationState}
        groupProfile={groupProfile}
        members={members}
        muted={conversationState.muted}
        onClose={() => setShowGroupSettings(false)}
        onOpenMembers={() => {
          setShowGroupSettings(false);
          setShowGroupMembers(true);
        }}
        onAddMembers={() => {
          setShowGroupSettings(false);
          setShowAddMembers(true);
        }}
        onToggleMute={async (nextMuted: boolean) => {
          if (!groupID) {
            throw new Error('群组不存在');
          }

          const chat = getChatInstance();
          if (!chat) {
            throw new Error('IM 未连接');
          }

          await chat.setMessageRemindType({
            groupID,
            messageRemindType: nextMuted
              ? TencentCloudChat.TYPES.MSG_REMIND_ACPT_NOT_NOTE
              : TencentCloudChat.TYPES.MSG_REMIND_ACPT_AND_NOTE,
          });
          await updateConversationState(conversationState.conversation_id, { muted: nextMuted });
          applyConversationPatch({ muted: nextMuted });
        }}
        onUpdateGroupName={async (name: string) => {
          await updateGroupProfile({ name });
          applyConversationPatch({ title: name });
        }}
        onUpdateGroupAvatar={async (file: File) => {
          const uploadResult = await uploadImAssetToOss({
            conversationID: conversationState.conversation_id,
            assetType: 'file',
            file,
          });
          await updateGroupProfile({ avatar: uploadResult.url });
          applyConversationPatch({ avatar: uploadResult.url });
        }}
      />

      <GroupMembersSheet
        visible={showGroupMembers}
        members={members}
        currentUserRole={currentUserRole}
        onClose={() => setShowGroupMembers(false)}
        onAddMembers={() => setShowAddMembers(true)}
        onRemoveMember={(member: GroupMemberState) => {
          void removeMembers([member.userID]);
        }}
      />

      <ContactPickerSheet
        visible={showAddMembers}
        title="添加成员"
        selectedUsers={selectedAddUsers}
        multiple
        disabledUserIDs={members.map((member) => member.userID)}
        confirmText="确认添加成员"
        onClose={() => {
          setShowAddMembers(false);
          setSelectedAddUsers([]);
        }}
        onSelectedUsersChange={setSelectedAddUsers}
        onConfirm={async (users) => {
          await addMembers(users.map((user) => user.id));
          setSelectedAddUsers([]);
          setShowAddMembers(false);
        }}
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

function extractGroupID(conversation: MergedConversation): string | null {
  if (conversation.type !== 'group' && conversation.type !== 'community') {
    return null;
  }

  if (conversation.conversation_id.startsWith('GROUP')) {
    return conversation.conversation_id.slice(5);
  }

  return conversation.conversation_id || null;
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
