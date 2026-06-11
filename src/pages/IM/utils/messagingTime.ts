const BEIJING_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/;

/**
 * 镜像层返回的是北京时间字符串，但没有显式时区后缀。
 * 这里统一按 +08:00 解析成秒级时间戳，避免浏览器自己乱判时区。
 */
export function apiTimeToSeconds(value: string | null | undefined): number {
  if (!value) return 0;

  const normalizedValue = String(value).trim();
  if (!normalizedValue || !BEIJING_TIME_PATTERN.test(normalizedValue)) {
    return 0;
  }

  const isoLikeValue = `${normalizedValue.replace(' ', 'T')}+08:00`;
  const ms = Date.parse(isoLikeValue);
  if (Number.isNaN(ms)) return 0;

  return Math.floor(ms / 1000);
}
