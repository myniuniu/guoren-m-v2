/**
 * 会话列表数据管理 Hook
 * 双通道拉取：SDK + 镜像 API，merge 去重后展示
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchConversations } from '../api/messagingApi';
import { getChatInstance } from './useIMLogin';
import TencentCloudChat from '@tencentcloud/lite-chat';
import { ensureDisplayNamesLoaded } from '../utils/displayNameStore';

// 合并后的会话数据
export interface MergedConversation {
  conversation_id: string;
  type: 'c2c' | 'ai_c2c' | 'group' | 'community';
  title: string;
  avatar: string | null;
  last_msg_preview: string;
  last_msg_time: string | null;
  last_msg_from: string | null;
  pinned: boolean;
  muted: boolean;
  order_seq: number;
  unread_count: number;
  last_read_msg_time: string | null;
}

export type ConversationStatus = 'idle' | 'loading' | 'success' | 'error';

export function useConversationList() {
  const [conversations, setConversations] = useState<MergedConversation[]>([]);
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 从 SDK 获取会话列表
  const getSDKConversations = useCallback(async (): Promise<MergedConversation[]> => {
    const chat = getChatInstance();
    if (!chat) return [];

    try {
      const result = await chat.getConversationList();
      const list = result?.data?.conversationList || [];

      return list.map((item: any) => {
        const convId = item.conversationID || '';
        const type = convId.startsWith('GROUP')
          ? 'group'
          : convId.startsWith('C2C')
          ? 'c2c'
          : 'community';

        return {
          conversation_id: convId,
          type: type as MergedConversation['type'],
          title: item.userProfile?.nick || item.groupProfile?.name || convId,
          avatar: item.userProfile?.avatar || item.groupProfile?.avatar || null,
          last_msg_preview: item.lastMessage?.messageForShow || '',
          last_msg_time: item.lastMessage?.lastTime
            ? new Date(item.lastMessage.lastTime * 1000).toISOString()
            : null,
          last_msg_from: item.lastMessage?.from || null,
          pinned: item.isPinned || false,
          muted: false,
          order_seq: item.orderKey || 0,
          unread_count: item.unreadCount || 0,
          last_read_msg_time: null,
        };
      });
    } catch {
      return [];
    }
  }, []);

  // 从镜像 API 获取会话列表
  const getMirrorConversations = useCallback(async (): Promise<MergedConversation[]> => {
    try {
      const response = await fetchConversations(undefined, 100);
      return response.items.map((item) => ({
        ...item,
        conversation_id: normalizeConversationID(item.conversation_id, item.type),
        unread_count: item.unread_count || 0,
      }));
    } catch {
      return [];
    }
  }, []);

  // Merge 去重：以镜像为基础，SDK 补充未读数和实时信息
  const mergeConversations = useCallback(
    (mirrorList: MergedConversation[], sdkList: MergedConversation[]): MergedConversation[] => {
      const map = new Map<string, MergedConversation>();

      // 先放入镜像数据
      mirrorList.forEach((item) => {
        map.set(item.conversation_id, { ...item });
      });

      // SDK 数据补充或覆盖
      sdkList.forEach((sdkItem) => {
        const existing = map.get(sdkItem.conversation_id);
        if (existing) {
          // 合并：SDK 的未读数、最后消息时间优先
          map.set(sdkItem.conversation_id, {
            ...existing,
            unread_count: sdkItem.unread_count || existing.unread_count,
            last_msg_preview: sdkItem.last_msg_preview || existing.last_msg_preview,
            last_msg_time: sdkItem.last_msg_time || existing.last_msg_time,
            pinned: sdkItem.pinned || existing.pinned,
          });
        } else {
          // SDK 有但镜像没有的会话（最近7天内的活跃会话）
          map.set(sdkItem.conversation_id, sdkItem);
        }
      });

      return Array.from(map.values());
    },
    []
  );

  // 拉取会话列表
  const loadConversations = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      // 并行拉取 SDK 和镜像数据
      const [sdkList, mirrorList] = await Promise.all([
        getSDKConversations(),
        getMirrorConversations(),
      ]);

      const merged = mergeConversations(mirrorList, sdkList);
      setConversations(merged);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载会话列表失败');
      setStatus('error');
    }
  }, [getSDKConversations, getMirrorConversations, mergeConversations]);

  // 下拉刷新
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  // 搜索过滤
  const filteredConversations = searchKeyword
    ? conversations.filter(
        (item) =>
          item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (item.last_msg_preview || '').toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : conversations;

  // 按置顶状态分组排序
  const pinnedConversations = filteredConversations
    .filter((item) => item.pinned)
    .sort((a, b) => b.order_seq - a.order_seq || (b.last_msg_time || '').localeCompare(a.last_msg_time || ''));

  const normalConversations = filteredConversations
    .filter((item) => !item.pinned)
    .sort((a, b) => (b.last_msg_time || '').localeCompare(a.last_msg_time || ''));

  // 初始加载
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 监听 SDK 会话列表更新事件
  useEffect(() => {
    const chat = getChatInstance();
    if (!chat) return;

    const handleConversationUpdate = () => {
      // 会话列表有更新时重新拉取
      loadConversations();
    };

    chat.on(TencentCloudChat.EVENT.CONVERSATION_LIST_UPDATED, handleConversationUpdate);

    return () => {
      chat.off(TencentCloudChat.EVENT.CONVERSATION_LIST_UPDATED, handleConversationUpdate);
    };
  }, [loadConversations]);

  // 收集所有 C2C 会话中的 userID 并预热 displayName 缓存
  useEffect(() => {
    const userIDs = conversations
      .map((c) => extractConversationUserID(c.conversation_id, c.type))
      .filter((id): id is string => Boolean(id));
    if (userIDs.length > 0) {
      ensureDisplayNamesLoaded(userIDs);
    }
  }, [conversations]);

  // 置顶/取消置顶
  const pinConversation = useCallback(
    async (conversationId: string, isPinned: boolean) => {
      setConversations((prev) =>
        prev.map((item) =>
          item.conversation_id === conversationId
            ? { ...item, pinned: isPinned, order_seq: isPinned ? Date.now() : 0 }
            : item
        )
      );

      // 同步 SDK
      try {
        const chat = getChatInstance();
        if (chat) {
          await chat.pinConversation({
            conversationID: conversationId,
            isPinned,
          });
        }
      } catch (err) {
        console.error('置顶失败:', err);
      }
    },
    []
  );

  // 删除会话
  const removeConversation = useCallback(async (conversationId: string) => {
    setConversations((prev) => prev.filter((item) => item.conversation_id !== conversationId));

    try {
      const chat = getChatInstance();
      if (chat) {
        await chat.deleteConversation(conversationId);
      }
    } catch (err) {
      console.error('删除会话失败:', err);
    }
  }, []);

  return {
    conversations: filteredConversations,
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
  };
}

/**
 * 将镜像 API 的 conversation_id 转换为 SDK 标准格式
 * 镜像 API 返回的格式和 SDK 内部格式不一致，需要在进入前端状态前统一转换。
 *
 * 转换规则：
 *   ai_c2c:  "userID:@RBT#botName"    → "C2C@RBT#botName"
 *   c2c:     "userID:targetUserID"      → "C2C#targetUserID"
 *   group:   "@TGS#groupID"           → "GROUP@TGS#groupID"
 */
function normalizeConversationID(
  rawConversationID: string,
  type: string
): string {
  // 已经是 SDK 格式，直接返回
  if (rawConversationID.startsWith('C2C') || rawConversationID.startsWith('GROUP')) {
    return rawConversationID;
  }

  // 群聊: @TGS#groupID → GROUP@TGS#groupID
  if (type === 'group' || rawConversationID.startsWith('@TGS#')) {
    return `GROUP${rawConversationID}`;
  }

  // AI C2C (机器人): userID:@RBT#botName → C2C@RBT#botName
  if (type === 'ai_c2c' && rawConversationID.includes('@RBT#')) {
    const match = rawConversationID.match(/@RBT#(.+)$/);
    if (match) return `C2C@RBT#${match[1]}`;
  }

  // 普通 C2C: userID:targetUserID → C2C#targetUserID
  if (type === 'c2c') {
    const parts = rawConversationID.split(':');
    if (parts.length >= 2) {
      return `C2C#${parts[parts.length - 1]}`;
    }
  }

  return rawConversationID;
}

/**
 * 从会话 ID 中提取目标用户 ID（用于 displayName 查询）
 * C2C 私聊: C2C@RBT#userID -> @RBT#userID
 *           C2C#userID     -> userID
 * 群聊: 返回 null（群聊不需要查 displayName）
 */
function extractConversationUserID(conversationId: string, type: string): string | null {
  if (type !== 'c2c' && type !== 'ai_c2c') return null;
  if (!conversationId.startsWith('C2C')) return null;
  const after = conversationId.slice(3);
  return after.startsWith('#') ? after.slice(1) : after;
}
