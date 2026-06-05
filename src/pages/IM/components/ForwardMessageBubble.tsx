/**
 * 转发消息富渲染气泡
 *
 * 职责：把解析器拿到的 segments 按类型渲染成：
 * - 图片：缩略图（点击全屏预览）
 * - 视频：受控 video 标签
 * - 文件：文件卡片 + 下载链接
 * - 纯文本：原样显示
 */

import React from 'react';
import DOMPurify from 'dompurify';
import type { ForwardMessageParseResult, ForwardSegment } from '../utils/forwardMessageParser';
import { openImagePreviewOverlay } from '../utils/imagePreview';

interface ForwardMessageBubbleProps {
  parsed: ForwardMessageParseResult;
}

function sanitizeForwardHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'p', 'span', 'br', 'strong', 'em', 'u',
      'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'data-mention-id', 'data-attachment-id', 'contenteditable'],
    ALLOW_DATA_ATTR: false,
  });
}

function renderSegment(seg: ForwardSegment, index: number): React.ReactNode {
  switch (seg.type) {
    case 'image':
      return (
        <img
          key={`img-${index}`}
          src={seg.url}
          alt={seg.label || ''}
          className="im-forward-segment-image"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (seg.url) openImagePreviewOverlay(seg.url);
          }}
          draggable={false}
          loading="lazy"
        />
      );
    case 'video':
      return (
        <video
          key={`video-${index}`}
          src={seg.url}
          className="im-forward-segment-video"
          controls
          preload="metadata"
        />
      );
    case 'file': {
      const ext = (seg.extension || 'file').slice(0, 4).toUpperCase();
      return (
        <a
          key={`file-${index}`}
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="im-forward-segment-file"
        >
          <span className="im-forward-segment-file__icon">{ext}</span>
          <span className="im-forward-segment-file__main">
            <span className="im-forward-segment-file__name" title={seg.label || seg.url}>
              {seg.label || seg.url}
            </span>
            <span className="im-forward-segment-file__hint">点击下载</span>
          </span>
        </a>
      );
    }
    case 'html': {
      const safeHtml = sanitizeForwardHtml(seg.html || '');
      return (
        <div
          key={`html-${index}`}
          className="im-forward-segment-html"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
          onClick={(event) => {
            const target = event.target as HTMLElement | null;
            if (target && target.tagName === 'IMG') {
              const src = (target as HTMLImageElement).getAttribute('src');
              if (src) {
                event.preventDefault();
                event.stopPropagation();
                openImagePreviewOverlay(src);
              }
            }
          }}
        />
      );
    }
    case 'text':
    default:
      return (
        <div key={`text-${index}`} className="im-forward-segment-text">
          {seg.text}
        </div>
      );
  }
}

const ForwardMessageBubble: React.FC<ForwardMessageBubbleProps> = ({ parsed }) => {
  const { sourceName, leadingComment, segments } = parsed;

  let displayComment = leadingComment;
  let displaySegments = segments;
  if (!displayComment && segments.length > 0 && segments[0].type === 'text') {
    const firstText = segments[0].text || '';
    const m = /^\s*\[留言\]\s*([\s\S]*?)(?:\n\n+|$)/.exec(firstText);
    if (m) {
      displayComment = m[1].trim();
      const rest = firstText.slice(m[0].length);
      if (rest.trim()) {
        displaySegments = [{ ...segments[0], text: rest }, ...segments.slice(1)];
      } else {
        displaySegments = segments.slice(1);
      }
    }
  }

  return (
    <div className="im-forward-bubble">
      {displayComment && <div className="im-forward-bubble__comment">{displayComment}</div>}
      <div className="im-forward-bubble__card">
        <div className="im-forward-bubble__header">
          转发自「{sourceName || '未知来源'}」
        </div>
        {displaySegments.map((seg, idx) => renderSegment(seg, idx))}
      </div>
    </div>
  );
};

export default ForwardMessageBubble;
