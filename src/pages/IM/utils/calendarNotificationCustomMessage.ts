/**
 * 日历通知消息解析
 */

export type CalendarNotificationType = 'event_invited' | 'calendar_shared' | 'calendar_unshared' | 'calendar_reminder';

export interface CalendarNotificationCustomData {
  type: CalendarNotificationType;
  calendarId?: string;
  actorId?: string;
  eventId?: string;
  eventTitle?: string;
  calendarName?: string;
  eventStartUtc?: string;
  eventEndUtc?: string;
  eventStart?: string;
  notificationText?: string;
  role?: string;
  minutesBefore?: number;
}

export interface CalendarNotificationViewModel {
  kind: CalendarNotificationType;
  headerTitle: string;
  actionText: string;
  actorName: string;
  actorUserId: string;
  calendarName: string;
  eventTitle: string;
  timeText: string;
  permissionText: string;
  buttons: string[];
}

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function parsePayloadData(payloadData: unknown): Record<string, unknown> | null {
  if (!payloadData) return null;

  try {
    const data = typeof payloadData === 'string' ? JSON.parse(payloadData) : payloadData;
    if (!data || typeof data !== 'object') return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isSupportedCalendarNotificationType(type: string): type is CalendarNotificationType {
  return type === 'event_invited' || type === 'calendar_shared' || type === 'calendar_unshared' || type === 'calendar_reminder';
}

export function parseCalendarNotificationCustomPayload(payloadData: unknown): CalendarNotificationCustomData | null {
  const data = parsePayloadData(payloadData);
  if (!data) return null;

  const rawNotification = data.calendarNotification;
  if (!rawNotification || typeof rawNotification !== 'object') return null;

  const notification = rawNotification as Record<string, unknown>;
  const type = normalizeText(notification.type);
  if (!isSupportedCalendarNotificationType(type)) return null;

  return {
    type,
    calendarId: normalizeText(notification.calendarId),
    actorId: normalizeText(notification.actorId),
    eventId: normalizeText(notification.eventId),
    eventTitle: normalizeText(notification.eventTitle),
    calendarName: normalizeText(notification.calendarName),
    eventStartUtc: normalizeText(notification.eventStartUtc),
    eventEndUtc: normalizeText(notification.eventEndUtc),
    eventStart: normalizeText(notification.eventStart),
    notificationText: normalizeText(data.notificationText),
    role: normalizeText(notification.role),
    minutesBefore: typeof notification.minutesBefore === 'number' ? notification.minutesBefore : undefined,
  };
}

export function parseCalendarNotificationCustomMessage(message: any): CalendarNotificationCustomData | null {
  // 转发后的日历/日程通知发送人会变成当前用户，不能再依赖 @RBT# 判断。
  // 只要 payload 结构命中 calendarNotification，就按原业务卡片渲染。
  return parseCalendarNotificationCustomPayload(message?.payload?.data);
}

function parseCalendarTime(value: string | undefined): Date | null {
  const text = normalizeText(value);
  if (!text) return null;

  // 后端传入的格式形如 "2026-06-02 03:00:00+08:00"，这里补齐 ISO 里的 T，避免 Safari 解析失败。
  const normalized = text.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})([+-]\d{2}:\d{2})$/, '$1T$2$3');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatTimePart(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatCalendarNotificationRange(start?: string, end?: string): string {
  const startDate = parseCalendarTime(start);
  const endDate = parseCalendarTime(end);
  if (!startDate || !endDate) return '';

  return `${startDate.getMonth() + 1}月${startDate.getDate()}日 ${formatTimePart(startDate)} - ${formatTimePart(endDate)} (GMT+8)`;
}

export function buildCalendarNotificationViewModel(
  notification: CalendarNotificationCustomData,
): CalendarNotificationViewModel {
  const actorUserId = normalizeText(notification.actorId);
  const eventTitle = normalizeText(notification.eventTitle) || '未命名日程';
  const calendarName = normalizeText(notification.calendarName) || '未命名日历';

  if (notification.type === 'event_invited') {
    return {
      kind: 'event_invited',
      headerTitle: eventTitle,
      actionText: `@${actorUserId} 邀请你加入 日程`,
      actorName: actorUserId,
      actorUserId,
      calendarName,
      eventTitle,
      timeText: formatCalendarNotificationRange(notification.eventStartUtc, notification.eventEndUtc),
      permissionText: '',
      buttons: [],
    };
  }

  if (notification.type === 'calendar_reminder') {
    const eventStart = notification.eventStart;
    const startDate = eventStart ? parseCalendarTime(eventStart) : null;
    const startTimeText = startDate
      ? `${startDate.getMonth() + 1}月${startDate.getDate()}日 ${formatTimePart(startDate)}`
      : '时间待定';
    return {
      kind: 'calendar_reminder',
      headerTitle: eventTitle,
      actionText: '日程提醒',
      actorName: actorUserId,
      actorUserId,
      calendarName,
      eventTitle,
      timeText: startTimeText,
      permissionText: '',
      buttons: [],
    };
  }

  if (notification.type === 'calendar_shared') {
    return {
      kind: 'calendar_shared',
      headerTitle: '日历分享',
      actionText: `@${actorUserId} 给你开通了日历的订阅者权限`,
      actorName: actorUserId,
      actorUserId,
      calendarName,
      eventTitle: '',
      timeText: '',
      permissionText: '可查看所有日程详情',
      buttons: ['在日历中查看'],
    };
  }

  return {
    kind: 'calendar_unshared',
    headerTitle: '日历共享取消',
    actionText: `@${actorUserId} 取消了对你的日历共享`,
    actorName: actorUserId,
    actorUserId,
    calendarName,
    eventTitle: '',
    timeText: '',
    permissionText: '共享已取消',
    buttons: [],
  };
}
