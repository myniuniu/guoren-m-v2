/**
 * 会话列表主页面
 * 搜索栏 + 置顶区/普通区 + 下拉刷新 + 空状态
 */

import React, { useState } from 'react';
import { SearchBar, PullToRefresh, Empty, SwipeAction, SpinLoading } from 'antd-mobile';
import { SearchOutline } from 'antd-mobile-icons';
import { useConversationList } from '../hooks/useConversationList';
import ConversationItem from './ConversationItem';
import type { MergedConversation } from '../hooks/useConversationList';

interface ConversationListPageProps {
  onConversationClick?: (conversation: MergedConversation) => void;
}

const ConversationListPage: React.FC<ConversationListPageProps> = ({ onConversationClick }) => {
  const {
    pinnedConversations,
    normalConversations,
    status,
    error,
    refreshing,
    searchKeyword,
    setSearchKeyword,
    refresh,
    pinConversation,
    removeConversation,
  } = useConversationList();

  const [actionKey, setActionKey] = useState<string | null>(null);

  // 计算总未读数
  const totalUnread = [...pinnedConversations, ...normalConversations].reduce(
    (sum, item) => sum + (item.unread_count || 0),
    0
  );

  // 渲染会话项，带左滑操作
  const renderConversationItem = (conversation: MergedConversation) => {
    const isPinned = conversation.pinned;

    return (
      <SwipeAction
        key={conversation.conversation_id}
        ref={(ref) => {
          // 当打开一个时关闭其他
          if (actionKey === conversation.conversation_id && ref) {
            // 自动关闭逻辑在 onAction 中处理
          }
        }}
        rightActions={[
          {
            key: 'pin',
            text: isPinned ? '取消置顶' : '置顶',
            color: '#4A7CFF',
            onClick: () => {
              pinConversation(conversation.conversation_id, !isPinned);
              setActionKey(null);
            },
          },
          {
            key: 'delete',
            text: '删除',
            color: '#ff4d4f',
            onClick: () => {
              removeConversation(conversation.conversation_id);
              setActionKey(null);
            },
          },
        ]}
        onActionsOpen={() => setActionKey(conversation.conversation_id)}
        onActionsClose={() => setActionKey(null)}
      >
        <ConversationItem
          conversation={conversation}
          onClick={onConversationClick}
        />
      </SwipeAction>
    );
  };

  // loading 状态
  if (status === 'loading' && pinnedConversations.length === 0 && normalConversations.length === 0) {
    return (
      <div className="im-conversation-list-page">
        <div className="im-conversation-list-loading">
          <SpinLoading color="primary" />
          <p className="im-conversation-list-loading-text">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (status === 'error') {
    return (
      <div className="im-conversation-list-page">
        <div className="im-conversation-list-error">
          <Empty
            description={error || '加载失败'}
            image={
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <button className="im-conversation-list-retry" onClick={refresh}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="im-conversation-list-page">
      {/* 搜索栏 */}
      <div className="im-conversation-list-search">
        <SearchBar
          placeholder="搜索会话"
          value={searchKeyword}
          onChange={setSearchKeyword}
          icon={<SearchOutline fontSize={16} color="#999" />}
          style={{
            '--border-radius': '22px',
            '--background': '#f3f3f3',
            '--height': '38px',
            '--placeholder-color': '#999',
            '--padding-left': '12px',
          }}
        />
      </div>

      {/* 会话列表 */}
      <PullToRefresh onRefresh={refresh}>
        <div className="im-conversation-list-content">
          {/* 置顶会话 */}
          {pinnedConversations.length > 0 && (
            <div className="im-conversation-section">
              <div className="im-conversation-section-header">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="3">
                  <line x1="12" y1="2" x2="12" y2="22" />
                </svg>
                <span>置顶</span>
              </div>
              <div className="im-conversation-section-list">
                {pinnedConversations.map(renderConversationItem)}
              </div>
            </div>
          )}

          {/* 普通会话 */}
          <div className="im-conversation-section">
            {normalConversations.length > 0 && pinnedConversations.length > 0 && (
              <div className="im-conversation-section-header">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                </svg>
                <span>全部</span>
              </div>
            )}
            <div className="im-conversation-section-list">
              {normalConversations.map(renderConversationItem)}
            </div>
          </div>

          {/* 空状态 */}
          {pinnedConversations.length === 0 && normalConversations.length === 0 && (
            <div className="im-conversation-empty">
              <Empty
                description="暂无会话"
                image={
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                }
              />
              <p className="im-conversation-empty-text">暂无会话，开始聊天吧</p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
};

export default ConversationListPage;
