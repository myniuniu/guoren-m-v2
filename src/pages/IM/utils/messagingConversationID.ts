const SDK_PREFIX_GROUP = 'GROUP';
const SDK_PREFIX_C2C = 'C2C';

/**
 * 把 SDK 会话 ID 转成镜像接口需要的 conversation_id。
 * 群聊去掉 GROUP 前缀，单聊把 peer 和 self 排序后拼成 min:max。
 */
export function toMirrorConversationID(
  sdkConversationID: string,
  selfUserID?: string,
): string {
  if (!sdkConversationID) return sdkConversationID;

  if (sdkConversationID.startsWith(SDK_PREFIX_GROUP)) {
    return sdkConversationID.slice(SDK_PREFIX_GROUP.length);
  }

  if (sdkConversationID.startsWith(SDK_PREFIX_C2C)) {
    const peerID = sdkConversationID.slice(SDK_PREFIX_C2C.length);
    if (!selfUserID) return peerID;
    const ids = [selfUserID, peerID].sort();
    return `${ids[0]}:${ids[1]}`;
  }

  return sdkConversationID;
}
