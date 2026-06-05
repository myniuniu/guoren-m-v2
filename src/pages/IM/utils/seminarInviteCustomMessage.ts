/**
 * 研讨会邀请消息解析（CUSTOM 入口）
 *
 * 设计原则：卡片识别和左侧会话列表预览必须用同一份 parser，
 * 避免两边识别条件漂移导致"卡片渲染了/预览没文案"或反过来的情况。
 */

export interface SeminarInviteCustomData {
  type?: string;
  joinUrl?: string;
  roomId?: string;
  roomName?: string;
  ownerId?: string;
  senderUserId?: string;
  scheduleStartTime?: number;
  scheduleEndTime?: number;
  memberCount?: number;
}

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function toSafeTimestamp(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toSafeInteger(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const normalizedValue = Math.trunc(parsed);
  return normalizedValue > 0 ? normalizedValue : undefined;
}

export function parseSeminarInviteCustomPayload(payloadData: unknown): SeminarInviteCustomData | null {
  if (!payloadData) return null;

  try {
    const data = typeof payloadData === 'string' ? JSON.parse(payloadData) : payloadData;
    const joinUrl = normalizeText((data as Record<string, unknown>)?.joinUrl);
    if (normalizeText((data as Record<string, unknown>)?.type) !== 'seminar_invite' || !joinUrl) {
      return null;
    }

    return {
      type: 'seminar_invite',
      joinUrl,
      roomId: normalizeText((data as Record<string, unknown>)?.roomId),
      roomName: normalizeText((data as Record<string, unknown>)?.roomName),
      ownerId: normalizeText((data as Record<string, unknown>)?.ownerId),
      senderUserId: normalizeText((data as Record<string, unknown>)?.sender),
      scheduleStartTime: toSafeTimestamp((data as Record<string, unknown>)?.scheduleStartTime),
      scheduleEndTime: toSafeTimestamp((data as Record<string, unknown>)?.scheduleEndTime),
      memberCount: toSafeInteger((data as Record<string, unknown>)?.memberCount),
    };
  } catch {
    return null;
  }
}

export function parseSeminarInviteCustomMessage(message: any): SeminarInviteCustomData | null {
  // 转发后的研讨会邀请发送人会变成当前用户，不能再依赖 @RBT#message 判断。
  // 只要 payload 结构命中 seminar_invite，就按原业务卡片渲染。
  return parseSeminarInviteCustomPayload(message?.payload?.data);
}

export function getSeminarInviteSearchParams(joinUrl: string): URLSearchParams {
  const mergedParams = new URLSearchParams();

  try {
    const url = new URL(joinUrl);
    url.searchParams.forEach((value, key) => {
      mergedParams.set(key, value);
    });

    const hash = url.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex >= 0) {
      const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
      hashParams.forEach((value, key) => {
        mergedParams.set(key, value);
      });
    }
  } catch {
    return mergedParams;
  }

  return mergedParams;
}

export function resolveSeminarInviteInviterUserId(invite: {
  senderUserId?: string;
  ownerId?: string;
  joinUrl?: string;
}): string {
  const senderUserId = normalizeText(invite?.senderUserId);
  if (senderUserId) return senderUserId;

  const ownerUserId = normalizeText(invite?.ownerId);
  if (ownerUserId) return ownerUserId;

  return normalizeText(getSeminarInviteSearchParams(normalizeText(invite?.joinUrl)).get('userId'));
}

export function buildSeminarInviteCardViewModel(
  invite: {
    roomName?: string;
    senderUserId?: string;
    ownerId?: string;
    joinUrl?: string;
  },
): {
  title: string;
  inviterUserId: string;
} {
  const title = normalizeText(invite?.roomName) || '未命名研讨会';
  const inviterUserId = resolveSeminarInviteInviterUserId(invite);

  return {
    title,
    inviterUserId,
  };
}
