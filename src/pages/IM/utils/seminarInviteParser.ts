/**
 * 研讨会邀请消息的统一识别逻辑（TEXT 入口）
 *
 * 核心信号：消息文本里携带 meeting-app 的入会链接（含 roomId 参数）。
 * 不再依赖具体的中文开头模板，这样后端任何模板的研讨会通知，
 * 只要带这种入会链接就能被识别。
 */

export interface SeminarInviteData {
  roomId: string;
  roomName: string;
  startTimeText: string;
  endTimeText: string;
  joinUrl: string;
}

// 在文本里找 meeting-app 入会链接
export function findMeetingJoinUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]*meeting-app[^\s]*roomId=[^\s]+/);
  return match ? match[0] : null;
}

// 从 meeting-app 入会链接里解析房间信息
export function parseMeetingJoinUrl(url: string): {
  roomId: string;
  roomName: string;
  startTimeText: string;
  endTimeText: string;
} | null {
  try {
    // hash 路由，把 # 后面的 query 拿出来
    const hashIdx = url.indexOf('#');
    const queryStr = hashIdx >= 0 ? url.slice(hashIdx + 1) : url;
    const qIdx = queryStr.indexOf('?');
    if (qIdx < 0) return null;
    const params = new URLSearchParams(queryStr.slice(qIdx + 1));

    const roomId = params.get('roomId') || '';
    if (!roomId) return null;

    const roomName = decodeURIComponent(params.get('roomName') || '').trim();
    const startTs = Number(params.get('scheduleStartTime') || 0);
    const endTs = Number(params.get('scheduleEndTime') || 0);

    return {
      roomId,
      roomName,
      startTimeText: formatScheduleTime(startTs),
      endTimeText: formatScheduleTime(endTs),
    };
  } catch {
    return null;
  }
}

// 时间戳是秒级，转成 yyyy-MM-dd HH:mm
function formatScheduleTime(ts: number): string {
  if (!ts || Number.isNaN(ts)) return '';
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 从 SDK Message 里取一段可用于解析的纯文本
export function extractMessagePlainText(message: any): string {
  const payloadText = typeof message?.payload?.text === 'string' ? message.payload.text.trim() : '';
  if (payloadText) return payloadText;

  return typeof message?.messageForShow === 'string' ? message.messageForShow.trim() : '';
}

// 主入口：判断这条消息是不是研讨会邀请/创建通知
export function parseSeminarInvite(message: any): SeminarInviteData | null {
  if (message?.from !== '@RBT#message') return null;

  const source = extractMessagePlainText(message);
  if (!source) return null;

  const joinUrl = findMeetingJoinUrl(source);
  if (!joinUrl) return null;

  const parsed = parseMeetingJoinUrl(joinUrl);
  if (!parsed) return null;

  let roomName = parsed.roomName;
  if (!roomName) {
    const titleFallback = source.match(/【([^】]+)】/);
    roomName = titleFallback ? titleFallback[1].trim() : '';
  }

  return {
    roomId: parsed.roomId,
    roomName: roomName || '研讨会',
    startTimeText: parsed.startTimeText,
    endTimeText: parsed.endTimeText,
    joinUrl,
  };
}
