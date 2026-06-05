/**
 * 转发消息解析工具
 *
 * 社群帖子支持转发到普通群聊/单聊，转发时会把帖子内容拼成：
 *   `[转发自「${groupName}」] ${postContent}`
 * 然后作为一条普通 TIM 文本消息发出去。
 *
 * 本工具将这种"转发文本"解析成结构化 segments，方便渲染层分别展示。
 */

export type ForwardSegmentType = 'text' | 'image' | 'video' | 'file' | 'html';

export interface ForwardSegment {
  type: ForwardSegmentType;
  /** type === 'text' 时承载原始文字 */
  text?: string;
  /** type === 'html' 时承载 HTML 字符串 */
  html?: string;
  /** type !== 'text' / 'html' 时承载资源 URL */
  url?: string;
  /** 文件/视频的展示名称 */
  label?: string;
  /** 文件扩展名，供文件卡片展示 */
  extension?: string;
}

export interface ForwardMessageParseResult {
  /** 是否命中转发消息格式 */
  isForwarded: boolean;
  /** 转发来源名，未命中时为空 */
  sourceName: string;
  /** 用户在转发时追加的留言（可能为空） */
  leadingComment: string;
  /** 解析后按顺序排列的富内容段 */
  segments: ForwardSegment[];
  /** 原始文本，用于兜底 */
  rawText: string;
}

/** 业务 OSS / CDN 域名白名单 */
const TRUSTED_HOST_SUFFIXES: string[] = [
  '.oss-cn-beijing.aliyuncs.com',
  '.grtcloud.net',
];

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'ogg', 'm4v', 'mkv'];

/** 兼容两种写法：标准格式 / 带留言格式 */
const FORWARD_PREFIX_REGEX = /\[转发自「([^」]*)」\]\s*/;
const LEADING_COMMENT_REGEX = /^\[留言\]\s*([\s\S]*?)\n\n/;

function getExtensionFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const dot = pathname.lastIndexOf('.');
    if (dot < 0 || dot === pathname.length - 1) return '';
    return pathname.slice(dot + 1).toLowerCase();
  } catch {
    return '';
  }
}

function isTrustedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    return TRUSTED_HOST_SUFFIXES.some((suffix) => u.host.endsWith(suffix));
  } catch {
    return false;
  }
}

function classifySegmentType(url: string): ForwardSegmentType {
  const ext = getExtensionFromUrl(url);
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  return 'file';
}

function extractDefaultLabel(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  } catch {
    return '';
  }
}

function splitInlineSegments(input: string): ForwardSegment[] {
  const segments: ForwardSegment[] = [];
  if (!input) return segments;

  const mediaRegex = /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = mediaRegex.exec(input)) !== null) {
    const [full, bang, label, url] = match;
    const start = match.index;

    if (start > lastIndex) {
      const chunk = input.slice(lastIndex, start);
      if (chunk) segments.push({ type: 'text', text: chunk });
    }

    if (!isTrustedUrl(url)) {
      segments.push({ type: 'text', text: full });
    } else {
      let type: ForwardSegmentType;
      if (bang === '!') {
        type = classifySegmentType(url);
      } else {
        type = classifySegmentType(url);
      }

      const displayLabel = label.trim() || extractDefaultLabel(url);
      const ext = getExtensionFromUrl(url);

      segments.push({
        type,
        url,
        label: displayLabel,
        extension: ext,
      });
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < input.length) {
    const rest = input.slice(lastIndex);
    if (rest) segments.push({ type: 'text', text: rest });
  }

  return mergeAdjacentText(segments);
}

function mergeAdjacentText(segments: ForwardSegment[]): ForwardSegment[] {
  const result: ForwardSegment[] = [];
  for (const seg of segments) {
    const last = result[result.length - 1];
    if (seg.type === 'text' && last?.type === 'text') {
      last.text = `${last.text || ''}${seg.text || ''}`;
    } else {
      result.push({ ...seg });
    }
  }
  return result.filter((seg) => {
    if (seg.type !== 'text') return true;
    return !!seg.text && seg.text.trim().length > 0;
  });
}

function looksLikeHtml(input: string): boolean {
  if (!input) return false;
  return /<\s*(div|p|span|br|img|a|strong|em|u|ul|ol|li|h[1-6]|blockquote)\b[^>]*>/i.test(input);
}

export function parseForwardMessage(rawText: string): ForwardMessageParseResult {
  const base: ForwardMessageParseResult = {
    isForwarded: false,
    sourceName: '',
    leadingComment: '',
    segments: [],
    rawText: rawText || '',
  };

  if (!rawText || typeof rawText !== 'string') {
    return base;
  }

  let remaining = rawText;
  let leadingComment = '';

  const leadingMatch = LEADING_COMMENT_REGEX.exec(remaining);
  if (leadingMatch) {
    leadingComment = leadingMatch[1].trim();
    remaining = remaining.slice(leadingMatch[0].length);
  }

  const forwardMatch = FORWARD_PREFIX_REGEX.exec(remaining);
  if (!forwardMatch || forwardMatch.index !== 0) {
    return base;
  }

  const sourceName = forwardMatch[1] || '';
  const body = remaining.slice(forwardMatch[0].length);

  let segments: ForwardSegment[];
  if (looksLikeHtml(body)) {
    segments = [{ type: 'html', html: body }];
  } else {
    segments = splitInlineSegments(body);
  }

  return {
    isForwarded: true,
    sourceName,
    leadingComment,
    segments,
    rawText,
  };
}
