type DisplayNameLookup = (userID: string, fallback?: string) => string;

const GROUP_TIP_MBR_JOIN = 1;
const GROUP_TIP_MBR_QUIT = 2;
const GROUP_TIP_MBR_KICKED_OUT = 3;
const GROUP_TIP_SET_ADMIN = 4;
const GROUP_TIP_CANCELED_ADMIN = 5;
const GROUP_TIP_GRP_PROFILE_UPDATED = 6;
const GROUP_TIP_MBR_PROFILE_UPDATED = 7;

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function dedupeTextList(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function resolveNameByUserID(userID: string, fallback: string, lookup: DisplayNameLookup): string {
  const normalizedUserID = normalizeText(userID);
  const normalizedFallback = normalizeText(fallback);
  if (!normalizedUserID) {
    return normalizedFallback;
  }

  return normalizeText(lookup(normalizedUserID, normalizedFallback || normalizedUserID))
    || normalizedFallback
    || normalizedUserID;
}

function collectMemberNames(message: any, lookup: DisplayNameLookup): string[] {
  const payload = message?.payload || {};
  const memberList = Array.isArray(payload?.memberList) ? payload.memberList : [];
  if (memberList.length > 0) {
    return dedupeTextList(
      memberList.map((member: any) => {
        const memberUserID = normalizeText(member?.userID);
        const memberFallback = normalizeText(member?.nick || memberUserID);
        return resolveNameByUserID(memberUserID, memberFallback, lookup);
      }),
    );
  }

  const userIDList = Array.isArray(payload?.userIDList) ? payload.userIDList : [];
  return dedupeTextList(
    userIDList.map((userID: string) => {
      const normalizedUserID = normalizeText(userID);
      return resolveNameByUserID(normalizedUserID, normalizedUserID, lookup);
    }),
  );
}

function buildGroupProfileUpdatedDisplayText(message: any, lookup: DisplayNameLookup): string {
  const payload = message?.payload || {};
  const newGroupProfile = payload?.newGroupProfile;
  if (!newGroupProfile || typeof newGroupProfile !== 'object') {
    return '';
  }

  const newOwnerID = normalizeText(newGroupProfile?.ownerID);
  if (!newOwnerID) {
    return '';
  }

  const memberList = Array.isArray(payload?.memberList) ? payload.memberList : [];
  const matchedMember = memberList.find((member: any) => normalizeText(member?.userID) === newOwnerID);
  const fallback = normalizeText(matchedMember?.nick || newOwnerID);
  const displayName = resolveNameByUserID(newOwnerID, fallback, lookup);
  if (!displayName) {
    return '';
  }

  return `${displayName} 成为新的群主`;
}

function resolveMemberProfileUpdatedMuteText(message: any, showName: string): string {
  const memberList = Array.isArray(message?.payload?.memberList) ? message.payload.memberList : [];
  const anyMuted = memberList.some((member: any) => Number(member?.muteTime) > 0);
  return anyMuted ? `群成员: ${showName} 被禁言` : `群成员: ${showName} 被取消禁言`;
}

/**
 * 按腾讯 IM 群提示 operationType 生成可读文案。
 * 这里只负责真正的群提示消息，不把 operationType 数字直接暴露到 UI。
 */
export function buildGroupTipDisplayText(message: any, lookup: DisplayNameLookup): string {
  const operationType = Number(message?.payload?.operationType);
  if (!Number.isFinite(operationType)) {
    return '';
  }

  if (operationType === GROUP_TIP_GRP_PROFILE_UPDATED) {
    return buildGroupProfileUpdatedDisplayText(message, lookup);
  }

  const memberNames = collectMemberNames(message, lookup);
  if (memberNames.length === 0) {
    return '';
  }

  const showName = memberNames.join('、');
  switch (operationType) {
    case GROUP_TIP_MBR_JOIN:
      return `${showName} 加入群组`;
    case GROUP_TIP_MBR_QUIT:
      return `群成员: ${showName} 退出群组`;
    case GROUP_TIP_MBR_KICKED_OUT:
      return `群成员: ${showName} 被踢出群组`;
    case GROUP_TIP_SET_ADMIN:
      return `群成员: ${showName} 成为管理员`;
    case GROUP_TIP_CANCELED_ADMIN:
      return `群成员: ${showName} 管理员身份被取消`;
    case GROUP_TIP_MBR_PROFILE_UPDATED:
      return resolveMemberProfileUpdatedMuteText(message, showName);
    default:
      return '';
  }
}
