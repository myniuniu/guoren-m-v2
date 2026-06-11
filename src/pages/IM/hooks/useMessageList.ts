/**
 * 消息列表数据管理 Hook
 * 历史消息对齐 PC 端，统一从镜像 API 拉取
 * 发送和实时消息仍然走 SDK，避免扩大本次改动范围
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import TencentCloudChat from '@tencentcloud/lite-chat';
import { getChatInstance } from './useIMLogin';
import { fetchMessages, type MessageItem } from '../api/messagingApi';
import { buildImOssImageMessagePayload } from '../utils/imOssImageMessage';
import { buildImOssAssetMessagePayload, type ImOssAssetType } from '../utils/imOssAssetMessage';
import { parseSeminarInviteCustomMessage, type SeminarInviteCustomData } from '../utils/seminarInviteCustomMessage';
import { parseCalendarNotificationCustomMessage, type CalendarNotificationCustomData } from '../utils/calendarNotificationCustomMessage';
import { parseSkillOutputMessage, type SkillOutputMessageParseResult } from '../utils/skillOutputMessage';
import { parseForwardMessage } from '../utils/forwardMessageParser';
import { parseSeminarInvite } from '../utils/seminarInviteParser';
import { resolveCustomMessageFallbackText } from '../utils/customMessageFallbackText';
import { uploadImAssetToOss } from '../utils/imOssUpload';
import { toMirrorConversationID } from '../utils/messagingConversationID';
import { apiTimeToSeconds } from '../utils/messagingTime';
import { parseGroupCreateTipInfo, type GroupCreateTipInfo } from '../utils/groupTipMessage';

/** 消息类型枚举 */
export type MessageCategory =
  | 'text' | 'image' | 'file' | 'video' | 'recalled' | 'system'
  | 'stream_ai' | 'seminar_invite' | 'calendar_notification'
  | 'skill_output' | 'forward' | 'bot_markdown';

/** 统一消息结构 */
export interface UnifiedMessage {
  id: string;
  category: MessageCategory;
  from: string;
  fromMe: boolean;
  time: number;
  rawMessage: any;
  text?: string;
  imageUrl?: string;
  imageFileName?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSize?: number;
  assetType?: ImOssAssetType;
  assetUrl?: string;
  assetFileName?: string;
  assetMimeType?: string;
  assetSize?: number;
  status: 'sending' | 'success' | 'fail';
  isRecalled: boolean;
  /** 发送者头像 URL */
  avatar?: string;
  /** 额外数据：根据 category 不同存储不同结构化数据 */
  extraData?: {
    // 流式AI
    streamText?: string;
    streamIsFinished?: boolean;
    // 研讨会邀请
    seminarInvite?: SeminarInviteCustomData;
    // 日历通知
    calendarNotification?: CalendarNotificationCustomData;
    // 技能输出
    skillOutput?: SkillOutputMessageParseResult;
    // 转发消息
    forwardParsed?: any;
    // 机器人 Markdown 原始文本
    botMarkdownText?: string;
    // 群提示
    groupTip?: GroupCreateTipInfo;
  };
}

export type MessageListStatus = 'idle' | 'loading' | 'success' | 'error';

function normalizeSdkUserID(userID: unknown): string {
  if (typeof userID === 'string') {
    return userID;
  }

  if (userID == null) {
    return '';
  }

  return String(userID);
}

function pickMirrorString(content: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    const value = content[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function pickMirrorNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function getMirrorMessageHead(message: MessageItem): MessageItem['msg_body'][number] | undefined {
  return Array.isArray(message.msg_body) ? message.msg_body[0] : undefined;
}

function getMirrorMessageContent(message: MessageItem): Record<string, any> {
  const content = getMirrorMessageHead(message)?.MsgContent;
  if (content && typeof content === 'object') {
    return content as Record<string, any>;
  }
  return {};
}

function parseMirrorCustomPayload(rawData: unknown): Record<string, any> | null {
  if (!rawData) return null;

  try {
    const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, any>;
  } catch {
    return null;
  }
}

function buildMirrorCustomMessageLike(message: MessageItem) {
  const content = getMirrorMessageContent(message);

  return {
    type: 'TIMCustomElem',
    from: message.from_account || '',
    messageForShow: message.text_preview || '',
    payload: {
      data: content.Data ?? content.data ?? '',
      description: content.Desc ?? content.description ?? '',
      extension: content.Ext ?? content.extension ?? '',
      text: message.text_preview || '',
    },
  };
}

function resolveMirrorImageInfo(content: Record<string, any>, fallbackName: string) {
  const imageInfoList = Array.isArray(content.ImageInfoArray)
    ? (content.ImageInfoArray as Array<Record<string, any>>)
    : [];

  const preferredImage =
    imageInfoList.find((item) => Number(item?.Type) === 1)
    || imageInfoList.find((item) => Number(item?.Type) === 3)
    || imageInfoList.find((item) => Number(item?.Type) === 2)
    || imageInfoList[0]
    || content;

  return {
    url: pickMirrorString(preferredImage, ['URL', 'Url', 'url', 'ImageUrl', 'imageUrl']),
    width: pickMirrorNumber(preferredImage.Width ?? content.Width),
    height: pickMirrorNumber(preferredImage.Height ?? content.Height),
    size: pickMirrorNumber(preferredImage.Size ?? content.Size ?? content.FileSize),
    showName: fallbackName,
  };
}

function buildMirrorBaseMessage(message: MessageItem, currentUserID: string) {
  const from = message.from_account || '';

  return {
    id: message.msg_id || '',
    from,
    fromMe: from === currentUserID,
    time: apiTimeToSeconds(message.send_time),
    rawMessage: message,
    avatar: '',
    status: 'success' as const,
    isRecalled: false,
  };
}

/** 把镜像消息 DTO 转成移动端详情页当前使用的统一结构 */
function parseMirrorMessage(message: MessageItem, currentUserID: string): UnifiedMessage {
  const baseMessage = buildMirrorBaseMessage(message, currentUserID);
  const headType = getMirrorMessageHead(message)?.MsgType || '';
  const content = getMirrorMessageContent(message);

  if (message.recalled) {
    return {
      ...baseMessage,
      category: 'recalled',
      isRecalled: true,
    };
  }

  if (headType === 'TIMTextElem' || message.msg_type === 'text') {
    const text = String(content.Text ?? message.text_preview ?? '');
    const forwardParsed = parseForwardMessage(text);
    if (forwardParsed.isForwarded) {
      return {
        ...baseMessage,
        category: 'forward',
        text: `[转发自「${forwardParsed.sourceName}」]`,
        extraData: {
          forwardParsed,
        },
      };
    }

    const seminarInvite = parseSeminarInvite({
      from: message.from_account,
      payload: { text },
      messageForShow: text,
    });
    if (seminarInvite) {
      return {
        ...baseMessage,
        category: 'seminar_invite',
        text: `[研讨会邀请] ${seminarInvite.roomName || '未命名研讨会'}`,
        extraData: {
          seminarInvite: {
            type: 'seminar_invite',
            joinUrl: seminarInvite.joinUrl,
            roomName: seminarInvite.roomName,
            scheduleStartTime: undefined,
            scheduleEndTime: undefined,
          } as SeminarInviteCustomData,
        },
      };
    }

    if (typeof message.from_account === 'string' && message.from_account.startsWith('@RBT#')) {
      return {
        ...baseMessage,
        category: 'bot_markdown',
        text,
        extraData: {
          botMarkdownText: text,
        },
      };
    }

    return {
      ...baseMessage,
      category: 'text',
      text,
    };
  }

  if (headType === 'TIMImageElem' || message.msg_type === 'image') {
    const imageInfo = resolveMirrorImageInfo(content, message.text_preview || '图片');
    return {
      ...baseMessage,
      category: 'image',
      imageUrl: imageInfo.url,
      imageFileName: imageInfo.showName || '图片',
      imageWidth: imageInfo.width,
      imageHeight: imageInfo.height,
      imageSize: imageInfo.size,
    };
  }

  if (headType === 'TIMFileElem' || message.msg_type === 'file') {
    return {
      ...baseMessage,
      category: 'file',
      assetType: 'file',
      assetUrl: pickMirrorString(content, ['URL', 'Url', 'url', 'DownloadUrl', 'FileUrl']),
      assetFileName: pickMirrorString(content, ['FileName', 'fileName', 'Name', 'name']) || message.text_preview || '附件',
      assetMimeType: pickMirrorString(content, ['FileType', 'fileType', 'ContentType', 'contentType']),
      assetSize: pickMirrorNumber(content.FileSize ?? content.Size),
    };
  }

  if (headType === 'TIMVideoFileElem' || message.msg_type === 'video') {
    return {
      ...baseMessage,
      category: 'video',
      assetType: 'video',
      assetUrl: pickMirrorString(content, ['VideoUrl', 'videoUrl', 'URL', 'Url', 'url']),
      assetFileName: pickMirrorString(content, ['FileName', 'fileName', 'Name', 'name']) || message.text_preview || '视频',
      assetMimeType: pickMirrorString(content, ['VideoType', 'videoType', 'FileType', 'fileType']),
      assetSize: pickMirrorNumber(content.VideoSize ?? content.FileSize ?? content.Size),
    };
  }

  if (
    headType === 'TIMGroupTipElem'
    || headType === 'TIMGroupSystemNoticeElem'
    || message.msg_type === 'group_system_notice'
    || message.msg_type === 'tip'
  ) {
    return {
      ...baseMessage,
      category: 'system',
      fromMe: false,
      text: message.text_preview || '[群通知]',
    };
  }

  if (headType === 'TIMCustomElem' || message.msg_type === 'custom') {
    const mirrorCustomMessage = buildMirrorCustomMessageLike(message);
    const rawData = mirrorCustomMessage.payload.data;
    const parsedData = parseMirrorCustomPayload(rawData);

    if (parsedData) {
      const groupCreateTip = parseGroupCreateTipInfo({
        parsedData,
        fromUserID: message.from_account,
        fallbackName: String(parsedData.showName || message.from_account || ''),
      });
      if (groupCreateTip) {
        return {
          ...baseMessage,
          category: 'system',
          text: '创建群聊',
          extraData: {
            groupTip: groupCreateTip,
          },
        };
      }

      const businessID = String(parsedData.businessID || parsedData.type || '').trim();

      if (businessID === 'im_oss_image') {
        return {
          ...baseMessage,
          category: 'image',
          imageUrl: String(parsedData.url || ''),
          imageFileName: String(parsedData.fileName || 'image'),
          imageWidth: pickMirrorNumber(parsedData.width),
          imageHeight: pickMirrorNumber(parsedData.height),
          imageSize: pickMirrorNumber(parsedData.size),
        };
      }

      if (businessID === 'im_oss_asset') {
        const assetType = parsedData.assetType === 'video' ? 'video' : 'file';
        return {
          ...baseMessage,
          category: assetType === 'video' ? 'video' : 'file',
          assetType,
          assetUrl: String(parsedData.url || ''),
          assetFileName: String(parsedData.fileName || '附件'),
          assetMimeType: String(parsedData.mimeType || ''),
          assetSize: pickMirrorNumber(parsedData.size),
        };
      }

      if (
        (parsedData.chatbotPlugin === 1 || parsedData.chatbotPlugin === 2)
        && Array.isArray(parsedData.chunks)
      ) {
        const streamText = parsedData.chunks.join('');
        return {
          ...baseMessage,
          category: 'stream_ai',
          text: streamText,
          extraData: {
            streamText,
            streamIsFinished: parsedData.isFinished === 1,
          },
        };
      }
    }

    const seminarInvite = parseSeminarInviteCustomMessage(mirrorCustomMessage);
    if (seminarInvite) {
      return {
        ...baseMessage,
        category: 'seminar_invite',
        text: `[研讨会邀请] ${seminarInvite.roomName || '未命名研讨会'}`,
        extraData: {
          seminarInvite,
        },
      };
    }

    const calendarNotification = parseCalendarNotificationCustomMessage(mirrorCustomMessage);
    if (calendarNotification) {
      return {
        ...baseMessage,
        category: 'calendar_notification',
        text: '[日历通知]',
        extraData: {
          calendarNotification,
        },
      };
    }

    const skillOutput = parseSkillOutputMessage(mirrorCustomMessage);
    if (skillOutput.isSkillOutput) {
      return {
        ...baseMessage,
        category: 'skill_output',
        text: '[技能输出]',
        extraData: {
          skillOutput,
        },
      };
    }

    return {
      ...baseMessage,
      category: 'text',
      text: resolveCustomMessageFallbackText(mirrorCustomMessage),
    };
  }

  return {
    ...baseMessage,
    category: 'text',
    text: message.text_preview || '[消息]',
  };
}

/** 从 SDK 消息对象解析为统一消息 */
function parseSDKMessage(msg: any, currentUserID: string): UnifiedMessage {
  // 撤回消息
  if (msg.isRevoked) {
    return {
      id: msg.ID || '',
      category: 'recalled',
      from: msg.from || '',
      fromMe: msg.from === currentUserID,
      time: msg.time || 0,
      rawMessage: msg,
      avatar: msg.avatar || '',
      status: 'success',
      isRecalled: true,
    };
  }

  // 文字消息
  if (msg.type === TencentCloudChat.TYPES.MSG_TEXT) {
    const text = msg.payload?.text || '';

    // 检测转发消息
    const forwardParsed = parseForwardMessage(text);
    if (forwardParsed.isForwarded) {
      return {
        id: msg.ID || '',
        category: 'forward',
        from: msg.from || '',
        fromMe: msg.from === currentUserID,
        time: msg.time || 0,
        rawMessage: msg,
        avatar: msg.avatar || '',
        text: `[转发自「${forwardParsed.sourceName}」]`,
        extraData: {
          forwardParsed,
        },
        status: 'success',
        isRecalled: false,
      };
    }

    // 研讨会邀请 TEXT 入口（正则提取 meeting-app 链接）
    const seminarInviteText = parseSeminarInvite(msg);
    if (seminarInviteText) {
      return {
        id: msg.ID || '',
        category: 'seminar_invite',
        from: msg.from || '',
        fromMe: msg.from === currentUserID,
        time: msg.time || 0,
        rawMessage: msg,
        avatar: msg.avatar || '',
        text: `[研讨会邀请] ${seminarInviteText.roomName || '未命名研讨会'}`,
        extraData: {
          seminarInvite: {
            type: 'seminar_invite',
            joinUrl: seminarInviteText.joinUrl,
            roomName: seminarInviteText.roomName,
            scheduleStartTime: undefined,
            scheduleEndTime: undefined,
          } as SeminarInviteCustomData,
        },
        status: 'success',
        isRecalled: false,
      };
    }

    // 机器人 Markdown 文本（@RBT# 开头）
    const isBot = typeof msg.from === 'string' && msg.from.startsWith('@RBT#');
    if (isBot) {
      return {
        id: msg.ID || '',
        category: 'bot_markdown',
        from: msg.from || '',
        fromMe: msg.from === currentUserID,
        time: msg.time || 0,
        rawMessage: msg,
        avatar: msg.avatar || '',
        text: text,
        extraData: {
          botMarkdownText: text,
        },
        status: 'success',
        isRecalled: false,
      };
    }

    return {
      id: msg.ID || '',
      category: 'text',
      from: msg.from || '',
      fromMe: msg.from === currentUserID,
      time: msg.time || 0,
      rawMessage: msg,
      avatar: msg.avatar || '',
      text: text,
      status: 'success',
      isRecalled: false,
    };
  }

  // 自定义消息（图片/文件/视频 via OSS）
  if (msg.type === TencentCloudChat.TYPES.MSG_CUSTOM) {
    // 尝试解析 OSS 图片消息
    const rawData = msg.payload?.data;
    let parsedData: Record<string, any> | null = null;
    try {
      parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch { /* 忽略 */ }

    if (parsedData) {
      const groupCreateTip = parseGroupCreateTipInfo({
        parsedData,
        fromUserID: msg.from || '',
        fallbackName: String(parsedData.showName || msg.nameCard || msg.nick || msg.from || ''),
      });
      if (groupCreateTip) {
        return {
          id: msg.ID || '',
          category: 'system',
          from: msg.from || '',
          fromMe: false,
          time: msg.time || 0,
          rawMessage: msg,
          avatar: '',
          text: '创建群聊',
          extraData: {
            groupTip: groupCreateTip,
          },
          status: 'success',
          isRecalled: false,
        };
      }

      const businessID = String(parsedData.businessID || parsedData.type || '').trim();

      // 图片消息
      if (businessID === 'im_oss_image') {
        return {
          id: msg.ID || '',
          category: 'image',
          from: msg.from || '',
          fromMe: msg.from === currentUserID,
          time: msg.time || 0,
          rawMessage: msg,
          avatar: msg.avatar || '',
          imageUrl: parsedData.url || '',
          imageFileName: parsedData.fileName || 'image',
          imageWidth: parsedData.width,
          imageHeight: parsedData.height,
          imageSize: parsedData.size,
          status: 'success',
          isRecalled: false,
        };
      }

      // 文件/视频消息
      if (businessID === 'im_oss_asset') {
        const assetType = parsedData.assetType === 'video' ? 'video' : 'file';
        return {
          id: msg.ID || '',
          category: assetType === 'video' ? 'video' : 'file',
          from: msg.from || '',
          fromMe: msg.from === currentUserID,
          time: msg.time || 0,
          rawMessage: msg,
          avatar: msg.avatar || '',
          assetType,
          assetUrl: parsedData.url || '',
          assetFileName: parsedData.fileName || '附件',
          assetMimeType: parsedData.mimeType,
          assetSize: parsedData.size,
          status: 'success',
          isRecalled: false,
        };
      }

      // 流式AI回复（chatbotPlugin=1 分片 / chatbotPlugin=2 整条）
      if (
        (parsedData.chatbotPlugin === 1 || parsedData.chatbotPlugin === 2) &&
        Array.isArray(parsedData.chunks)
      ) {
        const streamText = parsedData.chunks.join('');
        return {
          id: msg.ID || '',
          category: 'stream_ai',
          from: msg.from || '',
          fromMe: msg.from === currentUserID,
          time: msg.time || 0,
          rawMessage: msg,
          avatar: msg.avatar || '',
          text: streamText,
          extraData: {
            streamText,
            streamIsFinished: parsedData.isFinished === 1,
          },
          status: 'success',
          isRecalled: false,
        };
      }

      // 研讨会邀请（CUSTOM 入口）
      const seminarInvite = parseSeminarInviteCustomMessage({ payload: { data: rawData } });
      if (seminarInvite) {
        return {
          id: msg.ID || '',
          category: 'seminar_invite',
          from: msg.from || '',
          fromMe: msg.from === currentUserID,
          time: msg.time || 0,
          rawMessage: msg,
          avatar: msg.avatar || '',
          text: `[研讨会邀请] ${seminarInvite.roomName || '未命名研讨会'}`,
          extraData: {
            seminarInvite,
          },
          status: 'success',
          isRecalled: false,
        };
      }

      // 日历通知
      const calendarNotification = parseCalendarNotificationCustomMessage({ payload: { data: rawData } });
      if (calendarNotification) {
        return {
          id: msg.ID || '',
          category: 'calendar_notification',
          from: msg.from || '',
          fromMe: msg.from === currentUserID,
          time: msg.time || 0,
          rawMessage: msg,
          avatar: msg.avatar || '',
          text: '[日历通知]',
          extraData: {
            calendarNotification,
          },
          status: 'success',
          isRecalled: false,
        };
      }

      // 技能输出
      const skillOutput = parseSkillOutputMessage({ payload: { data: rawData }, type: 'TIMCustomElem' });
      if (skillOutput.isSkillOutput) {
        return {
          id: msg.ID || '',
          category: 'skill_output',
          from: msg.from || '',
          fromMe: msg.from === currentUserID,
          time: msg.time || 0,
          rawMessage: msg,
          avatar: msg.avatar || '',
          text: '[技能输出]',
          extraData: {
            skillOutput,
          },
          status: 'success',
          isRecalled: false,
        };
      }
    }

    // 其他自定义消息兜底
    const fallbackText = resolveCustomMessageFallbackText(msg);
    return {
      id: msg.ID || '',
      category: 'text',
      from: msg.from || '',
      fromMe: msg.from === currentUserID,
      time: msg.time || 0,
      rawMessage: msg,
      avatar: msg.avatar || '',
      text: fallbackText,
      status: 'success',
      isRecalled: false,
    };
  }

  // 系统消息/群提示
  if (msg.type === TencentCloudChat.TYPES.MSG_GRP_TIP || msg.type === TencentCloudChat.TYPES.MSG_GRP_SYS_NOTICE) {
    return {
      id: msg.ID || '',
      category: 'system',
      from: msg.from || '',
      fromMe: false,
      time: msg.time || 0,
      rawMessage: msg,
      avatar: msg.avatar || '',
      text: msg.payload?.text || msg.payload?.operationType || '[群通知]',
      status: 'success',
      isRecalled: false,
    };
  }

  // 未识别类型兜底
  return {
    id: msg.ID || '',
    category: 'text',
    from: msg.from || '',
    fromMe: msg.from === currentUserID,
    time: msg.time || 0,
    rawMessage: msg,
    avatar: msg.avatar || '',
    text: msg.payload?.text || msg.messageForShow || '[消息]',
    status: 'success',
    isRecalled: false,
  };
}

interface UseMessageListOptions {
  conversationID: string;
  conversationType: string;
  targetUserID?: string;
}

export function useMessageList(options: UseMessageListOptions) {
  const { conversationID, conversationType, targetUserID } = options;
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [status, setStatus] = useState<MessageListStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const nextCursorRef = useRef<string | undefined>(undefined);

  const getCurrentUserID = useCallback(() => {
    const chat = getChatInstance();
    return normalizeSdkUserID(chat?.getLoginUser?.());
  }, []);

  /** 从 localStorage 获取当前用户头像 */
  const getCurrentUserAvatar = useCallback(() => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        return userInfo.avatar || '';
      }
    } catch {
      // 忽略解析错误
    }
    return '';
  }, []);

  // 加载镜像历史消息，和 PC 端详情页保持一致
  const loadHistoryMessages = useCallback(async () => {
    if (!hasMore) return;
    setStatus('loading');
    setError(null);

    try {
      const chat = getChatInstance();
      const currentUserID = getCurrentUserID();
      const mirrorConversationID = toMirrorConversationID(conversationID, currentUserID);

      if (!chat) {
        setError('SDK 未就绪');
        setStatus('error');
        return;
      }

      const beforeCursor = nextCursorRef.current;
      const response = await fetchMessages(mirrorConversationID, beforeCursor, 50);
      const parsed = (response.items || [])
        .slice()
        .reverse()
        .map((item) => parseMirrorMessage(item, currentUserID));

      nextCursorRef.current =
        response.next_cursor === null || response.next_cursor === undefined
          ? undefined
          : String(response.next_cursor);

      if (beforeCursor) {
        // 翻页取到的是更老一段，插到现有列表前面
        setMessages((prev) => [...parsed, ...prev]);
      } else {
        setMessages(parsed);
      }

      setHasMore(Boolean(nextCursorRef.current));
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载消息失败');
      setStatus('error');
    }
  }, [conversationID, hasMore, getCurrentUserID]);

  useEffect(() => {
    setMessages([]);
    setStatus('idle');
    setError(null);
    setHasMore(true);
    nextCursorRef.current = undefined;
  }, [conversationID]);

  // 发送文字消息（SDK 原生通道）
  const sendTextMessage = useCallback(async (text: string) => {
    const chat = getChatInstance();
    if (!chat || !text.trim()) return;

    const currentUserID = getCurrentUserID();
    const convType = conversationType === 'group'
      ? TencentCloudChat.TYPES.CONV_GROUP
      : TencentCloudChat.TYPES.CONV_C2C;

    const sdkMsg = chat.createTextMessage({
      to: targetUserID || conversationID,
      conversationType: convType,
      payload: { text: text.trim() },
    });

    // optimistic 渲染
    const optimisticMsg: UnifiedMessage = {
      id: sdkMsg.ID || `sending_${Date.now()}`,
      category: 'text',
      from: currentUserID,
      fromMe: true,
      time: Math.floor(Date.now() / 1000),
      rawMessage: sdkMsg,
      avatar: getCurrentUserAvatar(),
      text: text.trim(),
      status: 'sending',
      isRecalled: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await chat.sendMessage(sdkMsg);
      const parsed = parseSDKMessage(sdkMsg, currentUserID);
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticMsg.id ? { ...parsed, status: 'success' } : m)
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticMsg.id ? { ...m, status: 'fail' } : m)
      );
      console.error('[IM] 文字消息发送失败:', err);
    }
  }, [targetUserID, conversationID, conversationType, getCurrentUserID]);

  // 发送图片消息（OSS + CustomMessage）
  const sendImageMessage = useCallback(async (file: File) => {
    const chat = getChatInstance();
    if (!chat) return;

    const currentUserID = getCurrentUserID();
    const convType = conversationType === 'group'
      ? TencentCloudChat.TYPES.CONV_GROUP
      : TencentCloudChat.TYPES.CONV_C2C;

    try {
      // 上传到 OSS
      const { url } = await uploadImAssetToOss({
        conversationID,
        assetType: 'file',
        file,
      });

      // 读取图片尺寸
      const size = await readImageSize(file);

      // 构建 payload
      const payload = buildImOssImageMessagePayload({
        url,
        fileName: file.name,
        width: size?.width,
        height: size?.height,
        size: file.size,
      });

      // 创建自定义消息
      const sdkMsg = chat.createCustomMessage({
        to: targetUserID || conversationID,
        conversationType: convType,
        payload,
      });

      // optimistic 渲染
      const optimisticMsg: UnifiedMessage = {
        id: sdkMsg.ID || `sending_${Date.now()}`,
        category: 'image',
        from: currentUserID,
        fromMe: true,
        time: Math.floor(Date.now() / 1000),
        rawMessage: sdkMsg,
        avatar: getCurrentUserAvatar(),
        imageUrl: url,
        imageFileName: file.name,
        imageWidth: size?.width,
        imageHeight: size?.height,
        imageSize: file.size,
        status: 'sending',
        isRecalled: false,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      await chat.sendMessage(sdkMsg);
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticMsg.id ? { ...m, status: 'success' } : m)
      );
    } catch (err) {
      console.error('[IM] 图片消息发送失败:', err);
      throw err;
    }
  }, [conversationID, conversationType, targetUserID, getCurrentUserID]);

  // 发送文件/视频消息（OSS + CustomMessage）
  const sendAssetMessage = useCallback(async (assetType: ImOssAssetType, file: File) => {
    const chat = getChatInstance();
    if (!chat) return;

    const currentUserID = getCurrentUserID();
    const convType = conversationType === 'group'
      ? TencentCloudChat.TYPES.CONV_GROUP
      : TencentCloudChat.TYPES.CONV_C2C;

    try {
      const { url } = await uploadImAssetToOss({
        conversationID,
        assetType,
        file,
      });

      const payload = buildImOssAssetMessagePayload({
        assetType,
        url,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });

      const sdkMsg = chat.createCustomMessage({
        to: targetUserID || conversationID,
        conversationType: convType,
        payload,
      });

      const optimisticMsg: UnifiedMessage = {
        id: sdkMsg.ID || `sending_${Date.now()}`,
        category: assetType === 'video' ? 'video' : 'file',
        from: currentUserID,
        fromMe: true,
        time: Math.floor(Date.now() / 1000),
        rawMessage: sdkMsg,
        avatar: getCurrentUserAvatar(),
        assetType,
        assetUrl: url,
        assetFileName: file.name,
        assetMimeType: file.type,
        assetSize: file.size,
        status: 'sending',
        isRecalled: false,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      await chat.sendMessage(sdkMsg);
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticMsg.id ? { ...m, status: 'success' } : m)
      );
    } catch (err) {
      console.error('[IM] 文件消息发送失败:', err);
      throw err;
    }
  }, [conversationID, conversationType, targetUserID, getCurrentUserID]);

  // 撤回消息
  const revokeMessage = useCallback(async (message: UnifiedMessage) => {
    const chat = getChatInstance();
    if (!chat) return;

    try {
      await chat.revokeMessage(message.rawMessage);
      setMessages((prev) =>
        prev.map((m) => m.id === message.id ? { ...m, isRecalled: true, category: 'recalled' } : m)
      );
    } catch (err) {
      console.error('[IM] 撤回失败:', err);
    }
  }, []);

  // 重发消息
  const resendMessage = useCallback(async (message: UnifiedMessage) => {
    const chat = getChatInstance();
    if (!chat) return;

    setMessages((prev) =>
      prev.map((m) => m.id === message.id ? { ...m, status: 'sending' } : m)
    );

    try {
      await chat.sendMessage(message.rawMessage);
      setMessages((prev) =>
        prev.map((m) => m.id === message.id ? { ...m, status: 'success' } : m)
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => m.id === message.id ? { ...m, status: 'fail' } : m)
      );
      console.error('[IM] 重发失败:', err);
    }
  }, []);

  // 监听 SDK 新消息到达
  useEffect(() => {
    const chat = getChatInstance();
    if (!chat) return;

    const currentUserID = normalizeSdkUserID(chat.getLoginUser?.());

    const handleNewMessage = (event: any) => {
      const newMsgs = event?.data || [];
      const parsed = newMsgs
        .filter((m: any) => m.conversationID === conversationID)
        .map((m: any) => parseSDKMessage(m, currentUserID));

      if (parsed.length > 0) {
        setMessages((prev) => [...prev, ...parsed]);
      }
    };

    const handleMessageRevoked = (event: any) => {
      const revokedMsgs = event?.data || [];
      const revokedIds = new Set(revokedMsgs.map((m: any) => m.ID));

      if (revokedIds.size > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            revokedIds.has(m.id) ? { ...m, isRecalled: true, category: 'recalled' } : m
          )
        );
      }
    };

    chat.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, handleNewMessage);
    chat.on(TencentCloudChat.EVENT.MESSAGE_REVOKED, handleMessageRevoked);

    return () => {
      chat.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, handleNewMessage);
      chat.off(TencentCloudChat.EVENT.MESSAGE_REVOKED, handleMessageRevoked);
    };
  }, [conversationID]);

  // 初始加载消息
  useEffect(() => {
    loadHistoryMessages();
  }, [loadHistoryMessages]);

  return {
    messages,
    status,
    error,
    hasMore,
    loadMore: loadHistoryMessages,
    sendTextMessage,
    sendImageMessage,
    sendAssetMessage,
    revokeMessage,
    resendMessage,
  };
}

/** 读取图片宽高 */
function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}
