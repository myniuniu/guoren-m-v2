export interface GroupCreateTipInfo {
  type: 'group_create';
  operatorUserID: string;
  operatorFallbackName: string;
}

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

/**
 * 解析 "创建群组" 这类自定义群提示消息。
 * 这里只接 businessID=group_create，别的自定义消息不在这里兜底。
 */
export function parseGroupCreateTipInfo(input: {
  parsedData: Record<string, any> | null | undefined;
  fromUserID?: string;
  fallbackName?: string;
}): GroupCreateTipInfo | null {
  const parsedData = input.parsedData;
  if (!parsedData || normalizeText(parsedData.businessID) !== 'group_create') {
    return null;
  }

  const operatorUserID = normalizeText(
    input.fromUserID || parsedData.userID || parsedData.opUser,
  );

  return {
    type: 'group_create',
    operatorUserID,
    operatorFallbackName: normalizeText(
      input.fallbackName || parsedData.showName || operatorUserID,
    ),
  };
}
