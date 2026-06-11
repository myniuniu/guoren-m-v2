/**
 * 消息气泡组件
 * 根据 category 渲染不同类型：文本、图片(OSS)、文件(OSS)、视频(OSS)、撤回、系统消息
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { UnifiedMessage } from '../hooks/useMessageList';
import { openImagePreviewOverlay } from '../utils/imagePreview';
import { useDisplayName } from '../utils/displayNameHooks';
import SeminarInviteCard from './SeminarInviteCard';
import CalendarNotificationCard from './CalendarNotificationCard';
import ForwardMessageBubble from './ForwardMessageBubble';
import { truncateSkillOutputFilename, resolveSkillOutputOpenMode, type SkillOutputCardItem } from '../utils/skillOutputMessage';

interface MessageBubbleProps {
  message: UnifiedMessage;
  onResend?: (message: UnifiedMessage) => void;
  onRevoke?: (message: UnifiedMessage) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onResend, onRevoke: _onRevoke }) => {
  const { category, fromMe, isRecalled } = message;
  const groupTip = message.extraData?.groupTip;
  const groupTipOperatorName = useDisplayName(groupTip?.operatorUserID, groupTip?.operatorFallbackName);

  // 撤回消息
  if (isRecalled || category === 'recalled') {
    return (
      <div className={`im-msg-bubble im-msg-recalled ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <span className="im-msg-recalled-text">消息已被撤回</span>
      </div>
    );
  }

  // 系统消息
  if (category === 'system') {
    const systemText = groupTip?.type === 'group_create'
      ? `${groupTipOperatorName || groupTip?.operatorFallbackName || '有人'} 创建群聊`
      : message.text;

    return (
      <div className="im-msg-bubble im-msg-system">
        <span className="im-msg-system-text">{systemText}</span>
      </div>
    );
  }

  // 文本消息
  if (category === 'text') {
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <div className="im-msg-text">{message.text}</div>
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 流式AI回复
  if (category === 'stream_ai') {
    const streamText = message.extraData?.streamText || '';
    const isFinished = message.extraData?.streamIsFinished ?? true;
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <div className={`im-msg-markdown ${isFinished ? '' : 'im-msg-markdown--streaming'}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
        </div>
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 研讨会邀请
  if (category === 'seminar_invite' && message.extraData?.seminarInvite) {
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <SeminarInviteCard invite={message.extraData.seminarInvite} />
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 日历通知
  if (category === 'calendar_notification' && message.extraData?.calendarNotification) {
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <CalendarNotificationCard notification={message.extraData.calendarNotification} />
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 技能输出
  if (category === 'skill_output' && message.extraData?.skillOutput) {
    const skillOutput = message.extraData.skillOutput;
    const formatSkillOutputSize = (size?: number): string => {
      if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) return '';
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };
    const resolveSkillOutputOpenModeLabel = (item: SkillOutputCardItem): string => {
      if (item.type === 'image' || item.isHtmlLike) return '点击预览';
      if (item.type === 'classroom') return '打开查看';
      return '打开查看';
    };
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <div className="im-skill-output-wrapper">
          {skillOutput.items.map((item: SkillOutputCardItem) => (
            <button
              key={`${item.type}:${item.url}:${item.filename}`}
              type="button"
              className="im-skill-output-card"
              onClick={() => {
                const mode = resolveSkillOutputOpenMode(item);
                if (mode === 'split-preview' && item.type === 'image') {
                  openImagePreviewOverlay(item.url);
                } else if (mode !== 'unsupported') {
                  window.open(item.url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              <div className="im-skill-output-card__icon">
                {item.type === 'image' ? (
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L11 19l-2-2-4 4" />
                  </svg>
                ) : item.type === 'classroom' ? (
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </div>
              <div className="im-skill-output-card__body">
                <div className="im-skill-output-card__title" title={item.filename}>
                  {truncateSkillOutputFilename(item.filename)}
                </div>
                <div className="im-skill-output-card__meta">
                  <span>{item.type === 'image' ? '图片' : item.type === 'classroom' ? '课堂任务' : item.type === 'review' ? '评课报告' : '文件'}</span>
                  {item.size ? <span>· {formatSkillOutputSize(item.size)}</span> : null}
                </div>
              </div>
              <div className="im-skill-output-card__action">{resolveSkillOutputOpenModeLabel(item)}</div>
            </button>
          ))}
        </div>
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 转发消息
  if (category === 'forward' && message.extraData?.forwardParsed) {
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <ForwardMessageBubble parsed={message.extraData.forwardParsed} />
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 机器人 Markdown
  if (category === 'bot_markdown') {
    const mdText = message.extraData?.botMarkdownText || message.text || '';
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <div className="im-msg-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdText}</ReactMarkdown>
        </div>
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 图片消息（OSS）
  if (category === 'image') {
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <div className="im-msg-image-wrap">
          {message.imageUrl ? (
            <img
              src={message.imageUrl}
              alt={message.imageFileName || '图片'}
              className="im-msg-image"
              loading="lazy"
              onClick={() => {
                if (message.imageUrl) openImagePreviewOverlay(message.imageUrl);
              }}
            />
          ) : (
            <div className="im-msg-image-placeholder">[图片加载失败]</div>
          )}
        </div>
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 文件消息（OSS）
  if (category === 'file') {
    const ext = message.assetFileName ? message.assetFileName.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE' : 'FILE';
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <div className="im-msg-file-card" onClick={() => message.assetUrl && window.open(message.assetUrl, '_blank')}>
          <div className="im-msg-file-icon">
            <span style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#e6f4ff',
              color: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}>{ext}</span>
          </div>
          <div className="im-msg-file-info">
            <div className="im-msg-file-name">{message.assetFileName || '文件'}</div>
            <div className="im-msg-file-size">{formatFileSize(message.assetSize)}</div>
          </div>
          <div style={{ color: '#2563eb', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            下载文件
          </div>
        </div>
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 视频消息（OSS）
  if (category === 'video') {
    return (
      <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
        <div className="im-msg-video-card" onClick={() => message.assetUrl && window.open(message.assetUrl, '_blank')}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1677ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.5" />
            <polygon points="10,8 16,12 10,16" fill="#1677ff" stroke="none" />
          </svg>
          <div className="im-msg-video-name">{message.assetFileName || '视频'}</div>
          <div className="im-msg-video-size">{formatFileSize(message.assetSize)}</div>
          <div style={{ color: '#2563eb', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
            打开播放
          </div>
        </div>
        {renderStatus(message, onResend)}
      </div>
    );
  }

  // 兜底
  return (
    <div className={`im-msg-bubble ${fromMe ? 'im-msg-right' : 'im-msg-left'}`}>
      <div className="im-msg-text">{message.text || '[消息]'}</div>
      {renderStatus(message, onResend)}
    </div>
  );
};

/** 渲染发送状态标记 */
function renderStatus(message: UnifiedMessage, onResend?: (m: UnifiedMessage) => void) {
  if (!message.fromMe) return null;

  if (message.status === 'sending') {
    return <div className="im-msg-status im-msg-status-sending">...</div>;
  }

  if (message.status === 'fail') {
    return (
      <div className="im-msg-status im-msg-status-fail" onClick={() => onResend?.(message)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#DC2626">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" stroke="#fff" strokeWidth="2" />
          <line x1="9" y1="9" x2="15" y2="15" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return null;
}

/** 格式化文件大小 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

export default MessageBubble;
