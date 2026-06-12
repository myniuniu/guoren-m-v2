/**
 * 会话列表主页面
 * 顶部视觉结构对齐 master 的消息页，会话数据和点击逻辑继续走当前分支
 */

import React, { useCallback, useMemo, useState } from 'react';
import { SearchBar, PullToRefresh, Empty, SwipeAction, SpinLoading } from 'antd-mobile';
import { SearchOutline } from 'antd-mobile-icons';
import { useConversationList } from '../hooks/useConversationList';
import ConversationItem from './ConversationItem';
import type { MergedConversation } from '../hooks/useConversationList';
import { useDisplayName } from '../utils/displayNameHooks';
import { buildNameAvatarLines } from '../utils/nameAvatar';
import GroupCreateSheet from './GroupCreateSheet';
import SingleChatCreateSheet from './SingleChatCreateSheet';

interface ConversationListPageProps {
  onConversationClick?: (conversation: MergedConversation) => void;
}

type ConversationFilterKey = 'message' | 'unread' | 'pinned';
type ChannelAvatarTone = 'peach' | 'blue' | 'lilac';

const conversationFilters: Array<{ key: ConversationFilterKey; label: string }> = [
  { key: 'message', label: '消息' },
  { key: 'unread', label: '未读' },
  { key: 'pinned', label: '置顶' },
];

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function MenuLinesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#474c54" strokeWidth="2.2" strokeLinecap="round">
      <path d="M7 6.5h10" />
      <path d="M5 12h8" />
      <path d="M7 17.5h10" />
    </svg>
  );
}

const filledAvatarTones: ChannelAvatarTone[] = ['peach', 'blue', 'lilac'];

function extractConversationUserID(conversation: MergedConversation) {
  if (conversation.type !== 'c2c' && conversation.type !== 'ai_c2c') {
    return undefined;
  }

  const convId = conversation.conversation_id;
  if (!convId.startsWith('C2C')) {
    return undefined;
  }

  const after = convId.slice(3);
  return after.startsWith('#') ? after.slice(1) : after;
}

function pickAvatarTone(seed: string, tones: readonly ChannelAvatarTone[]) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return tones[hash % tones.length];
}

function PinnedConversationChip({
  conversation,
  onClick,
}: {
  conversation: MergedConversation;
  onClick?: (conversation: MergedConversation) => void;
}) {
  const targetUserID = extractConversationUserID(conversation);
  const displayName = useDisplayName(targetUserID, conversation.title);
  const finalTitle =
    conversation.type === 'c2c' || conversation.type === 'ai_c2c' ? displayName : conversation.title;
  const isGroupConversation = conversation.type === 'group' || conversation.type === 'community';
  const avatarTone = isGroupConversation
    ? null
    : pickAvatarTone(conversation.conversation_id || finalTitle, filledAvatarTones);
  const avatarLines = buildNameAvatarLines(finalTitle, isGroupConversation ? 'group' : 'person');

  return (
    <button
      className="im-message-channel-item"
      type="button"
      onClick={() => onClick?.(conversation)}
      aria-label={finalTitle}
    >
      {conversation.avatar ? (
        <div className="im-message-chip-avatar is-image">
          <img src={conversation.avatar} alt={finalTitle} />
        </div>
      ) : (
        <div className={`im-message-chip-avatar ${isGroupConversation ? 'is-group-generated' : `is-filled-${avatarTone}`}`}>
          {isGroupConversation ? (
            <div className="im-message-chip-avatar-stack">
              {avatarLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ) : (
            <span className="im-message-chip-avatar-single">{avatarLines[0]?.slice(0, 1) || '?'}</span>
          )}
        </div>
      )}
      <span className="im-message-channel-label">{finalTitle}</span>
    </button>
  );
}

const ConversationListPage: React.FC<ConversationListPageProps> = ({ onConversationClick }) => {
  const {
    pinnedConversations,
    normalConversations,
    status,
    error,
    searchKeyword,
    setSearchKeyword,
    refresh,
    pinConversation,
    markConversationRead,
    removeConversation,
  } = useConversationList();
  const [activeFilter, setActiveFilter] = useState<ConversationFilterKey>('message');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showSingleChatSheet, setShowSingleChatSheet] = useState(false);
  const [groupCreateMode, setGroupCreateMode] = useState<'group' | 'community' | null>(null);

  const handleConversationOpen = useCallback((conversation: MergedConversation) => {
    const nextConversation = conversation.unread_count > 0
      ? { ...conversation, unread_count: 0 }
      : conversation;

    if (conversation.unread_count > 0) {
      void markConversationRead(conversation);
    }

    onConversationClick?.(nextConversation);
  }, [markConversationRead, onConversationClick]);

  // 渲染会话项，带左滑操作
  const renderConversationItem = (conversation: MergedConversation) => {
    const isPinned = conversation.pinned;

    return (
      <SwipeAction
        key={conversation.conversation_id}
        rightActions={[
          {
            key: 'pin',
            text: isPinned ? '取消置顶' : '置顶',
            color: '#4A7CFF',
            onClick: () => {
              pinConversation(conversation.conversation_id, !isPinned);
            },
          },
          {
            key: 'delete',
            text: '删除',
            color: '#ff4d4f',
            onClick: () => {
              removeConversation(conversation.conversation_id);
            },
          },
        ]}
      >
        <ConversationItem conversation={conversation} onClick={handleConversationOpen} />
      </SwipeAction>
    );
  };

  const visibleConversations = useMemo(() => {
    const visiblePinned =
      activeFilter === 'unread'
        ? pinnedConversations.filter((conversation) => conversation.unread_count > 0)
        : pinnedConversations;

    const visibleNormal =
      activeFilter === 'unread'
        ? normalConversations.filter((conversation) => conversation.unread_count > 0)
        : activeFilter === 'pinned'
        ? []
        : normalConversations;

    if (activeFilter === 'pinned') {
      return visiblePinned;
    }

    return [...visiblePinned, ...visibleNormal];
  }, [activeFilter, normalConversations, pinnedConversations]);

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
      {showCreateMenu ? (
        <div className="im-create-menu-overlay" onClick={() => setShowCreateMenu(false)}>
          <div className="im-create-menu" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="im-create-menu__item"
              onClick={() => {
                setShowCreateMenu(false);
                setShowSingleChatSheet(true);
              }}
            >
              新建单聊
            </button>
            <button
              type="button"
              className="im-create-menu__item"
              onClick={() => {
                setShowCreateMenu(false);
                setGroupCreateMode('group');
              }}
            >
              新建群聊
            </button>
            <button
              type="button"
              className="im-create-menu__item"
              onClick={() => {
                setShowCreateMenu(false);
                setGroupCreateMode('community');
              }}
            >
              新建社群
            </button>
          </div>
        </div>
      ) : null}

      <div className="im-message-shell">
        <div className="im-page-inset im-message-titlebar">
          <h1 className="im-message-title">消息</h1>
          <div className="im-message-profile-actions">
            <button
              className="im-message-header-button"
              type="button"
              aria-label="搜索会话"
              onClick={() => setShowSearchBar((current) => !current)}
            >
              <SearchIcon />
            </button>
            <button
              className="im-message-header-button"
              type="button"
              aria-label="新建会话"
              onClick={() => setShowCreateMenu((current) => !current)}
            >
              <PlusCircleIcon />
            </button>
          </div>
        </div>

        {(showSearchBar || searchKeyword) && (
          <div className="im-page-inset im-conversation-list-search">
            <SearchBar
              placeholder="搜索会话"
              value={searchKeyword}
              onChange={setSearchKeyword}
              icon={<SearchOutline fontSize={16} color="#999" />}
              style={{
                '--border-radius': '20px',
                '--background': '#eff1f5',
                '--height': '38px',
                '--placeholder-color': '#98a0ad',
                '--padding-left': '12px',
              }}
            />
          </div>
        )}

        {pinnedConversations.length > 0 && (
          <div className="im-message-channel-scroll">
            {pinnedConversations.map((conversation) => (
              <PinnedConversationChip
                key={conversation.conversation_id}
                conversation={conversation}
                onClick={handleConversationOpen}
              />
            ))}
          </div>
        )}

        <div className="im-page-inset im-message-filter-row">
          <button className="im-message-filter-menu" type="button" aria-label="会话菜单">
            <MenuLinesIcon />
          </button>

          <div className="im-message-filter-segment">
            {conversationFilters.map((filter) => (
              <button
                key={filter.key}
                className={`im-message-filter-tab ${activeFilter === filter.key ? 'is-active' : ''}`}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="im-conversation-scroll-region">
        <PullToRefresh onRefresh={refresh}>
          <div className="im-conversation-list-content">
            {visibleConversations.length > 0 ? (
              <div className="im-conversation-flat-list">{visibleConversations.map(renderConversationItem)}</div>
            ) : (
              <div className="im-conversation-empty">
                <Empty
                  description={activeFilter === 'unread' ? '暂无未读会话' : activeFilter === 'pinned' ? '暂无置顶会话' : '暂无消息'}
                  image={
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  }
                />
                              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      <SingleChatCreateSheet
        visible={showSingleChatSheet}
        onClose={() => setShowSingleChatSheet(false)}
        onConversationCreated={onConversationClick}
      />

      <GroupCreateSheet
        visible={groupCreateMode !== null}
        mode={groupCreateMode || 'group'}
        onClose={() => setGroupCreateMode(null)}
        onConversationCreated={onConversationClick}
      />
    </div>
  );
};

export default ConversationListPage;
