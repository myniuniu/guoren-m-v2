/**
 * 时间格式化工具
 * 处理消息时间的显示（今天、昨天、日期）
 */

const MS_PER_DAY = 86400000;

/**
 * 格式化会话列表时间
 * @param dateStr ISO 时间字符串
 * @returns 格式化后的时间字符串
 */
export function formatConversationTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 今天
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // 昨天
  const yesterday = new Date(now.getTime() - MS_PER_DAY);
  if (isSameDay(date, yesterday)) {
    return '昨天';
  }

  // 本周内
  if (diff < 7 * MS_PER_DAY) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }

  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  // 跨年
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 格式化聊天窗口时间（时间分割线）
 * @param dateStr ISO 时间字符串
 * @returns 格式化后的时间字符串
 */
export function formatMessageTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();

  // 今天
  if (isSameDay(date, now)) {
    return `今天 ${formatTime(date)}`;
  }

  // 昨天
  const yesterday = new Date(now.getTime() - MS_PER_DAY);
  if (isSameDay(date, yesterday)) {
    return `昨天 ${formatTime(date)}`;
  }

  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${formatTime(date)}`;
  }

  // 跨年
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${formatTime(date)}`;
}

/**
 * 判断是否同一天
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * 格式化为 HH:mm
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
