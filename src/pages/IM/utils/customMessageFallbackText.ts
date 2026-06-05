/**
 * 自定义消息兜底文本提取
 */

const GENERIC_CUSTOM_MESSAGE_PATTERNS = [
  /^\[(Custom Message|Custom Messages|自定义消息)\]$/i,
  /^(Custom Message|Custom Messages|自定义消息)$/i,
];

function normalizeFallbackText(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null') return '';
    if (GENERIC_CUSTOM_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed))) return '';
    return trimmed;
  }

  if (value == null) return '';

  try {
    return JSON.stringify(value);
  } catch {
    return String(value || '').trim();
  }
}

export function resolveCustomMessageFallbackText(message: Record<string, any>): string {
  const payload = message?.payload || {};
  const candidates = [
    payload.data,
    payload.text,
    payload.description,
    payload.extension,
    message?.messageForShow,
  ];

  for (const candidate of candidates) {
    const text = normalizeFallbackText(candidate);
    if (text) return text;
  }

  return '[custom message]';
}
