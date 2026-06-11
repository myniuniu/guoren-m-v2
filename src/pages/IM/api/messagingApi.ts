/**
 * 镜像 API 客户端
 * 对接 Python 服务的 IM 消息镜像层
 * 服务前缀: /api/v1/messaging
 * 鉴权方式: Query 参数 user_id + X-Access-Token 请求头
 */

import { handleUnauthorizedResponse } from '../../../utils/request';

// 镜像 API 基础地址（独立 Python 服务，不同于 jeecg-boot）
const MESSAGING_BASE_URL = import.meta.env.VITE_IM_MESSAGING_BASE_URL || '';
// jeecg-boot 基础地址（用于 OSS 预签名等需要走 Java 服务的接口）
const APP_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * 会话条目类型（镜像 API 返回格式）
 */
export interface ConversationItem {
  conversation_id: string;
  type: 'c2c' | 'ai_c2c' | 'group' | 'community';
  participants: string[] | null;
  group_id: string | null;
  topic_id: string | null;
  title: string;
  avatar: string | null;
  last_msg_id: string | null;
  last_msg_preview: string | null;
  last_msg_time: string | null;
  last_msg_from: string | null;
  pinned: boolean;
  pinned_at: string | null;
  muted: boolean;
  order_seq: number;
  unread_count?: number;
  last_read_msg_time: string | null;
}

/**
 * 消息条目类型（镜像 API 返回格式）
 */
export interface MessageItem {
  msg_id: string;
  conversation_id: string;
  conversation_type: string;
  msg_seq: number;
  from_account: string;
  to_account: string | null;
  group_id: string | null;
  topic_id: string | null;
  msg_type: string;
  msg_body: Array<{ MsgType: string; MsgContent: Record<string, any> }>;
  text_preview: string;
  send_time: string;
  recalled: boolean;
  recalled_at: string | null;
  recalled_by: string | null;
  forwarded_post_id: string | null;
  reply_to_msg_id: string | null;
  cloud_custom_data: string | null;
}

/**
 * 分页响应类型（镜像 API 格式）
 */
export interface PagedResponse<T> {
  items: T[];
  next_cursor: string | number | null;
}

/**
 * 获取当前用户鉴权信息
 */
function getAuthInfo(): { userId: string; tenantId: string; token: string } | null {
  try {
    const token = localStorage.getItem('SUPERSONIC_TOKEN');
    const userInfoStr = localStorage.getItem('userInfo');
    if (!token || !userInfoStr) return null;
    const userInfo = JSON.parse(userInfoStr);
    return {
      userId: String(userInfo.id || ''),
      tenantId: String(userInfo.loginTenantId || ''),
      token,
    };
  } catch {
    return null;
  }
}

/**
 * 镜像 API 统一请求方法
 * 鉴权: Query 参数 user_id + X-Access-Token 请求头
 * 响应格式: { code: 0, msg: "ok", data: {...} }
 */
async function messagingRequest<T = any>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, string>
): Promise<T> {
  const auth = getAuthInfo();
  if (!auth) {
    throw new Error('用户未登录，无法获取鉴权信息');
  }

  // 构建完整 URL
  const fullUrl = `${MESSAGING_BASE_URL}${path}`;
  const urlObj = new URL(fullUrl);
  // user_id 必传
  urlObj.searchParams.set('user_id', auth.userId);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Access-Token': auth.token,
    'X-Tenant-Id': auth.tenantId,
  };

  const response = await fetch(urlObj.toString(), {
    ...options,
    headers,
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    if (handleUnauthorizedResponse(response)) {
      throw new Error('Token失效，请重新登录!');
    }
    throw new Error(`响应解析失败，状态码: ${response.status}`);
  }

  if (handleUnauthorizedResponse(response, data)) {
    throw new Error(data?.message || data?.msg || 'Token失效，请重新登录!');
  }

  // 兼容两种镜像响应风格：
  // 1. 老格式：{ code: 0, msg: "ok", data: {...} }
  // 2. 现格式：{ success: true, code: "200", msg: "success", data: {...} }
  const bizCode = data?.code;
  const bizCodeNumber =
    typeof bizCode === 'string' || typeof bizCode === 'number'
      ? Number(bizCode)
      : Number.NaN;
  const isBusinessSuccess =
    bizCode === undefined ||
    bizCode === 0 ||
    bizCode === '0' ||
    data?.success === true ||
    (Number.isFinite(bizCodeNumber) && bizCodeNumber >= 200 && bizCodeNumber < 300);

  if (!isBusinessSuccess) {
    // 403 鉴权失败
    if (data?.code === 40300 || response.status === 403) {
      throw new Error(data?.msg || '无权访问该会话');
    }
    throw new Error(data?.msg || `请求失败，code: ${data?.code}`);
  }

  if (!response.ok) {
    throw new Error(`请求失败，状态码: ${response.status}`);
  }

  // 返回 data 字段（镜像 API 的业务数据在 data 中）
  return (data?.data ?? data) as T;
}

/**
 * 获取全量会话列表
 */
export async function fetchConversations(
  cursor?: string | number,
  limit: number = 50
): Promise<PagedResponse<ConversationItem>> {
  const params: Record<string, string> = {
    limit: String(limit),
  };
  if (cursor) {
    params.cursor = String(cursor);
  }

  const data = await messagingRequest<PagedResponse<ConversationItem>>(
    '/conversations',
    { method: 'GET' },
    params,
  );

  return {
    items: data?.items || [],
    next_cursor: data?.next_cursor ?? null,
  };
}

/**
 * 获取会话历史消息
 * 镜像 API 返回倒序（最新在前），前端需反转成正序展示
 */
export async function fetchMessages(
  conversationId: string,
  before?: string,
  limit: number = 50
): Promise<PagedResponse<MessageItem>> {
  const params: Record<string, string> = {
    limit: String(limit),
  };
  if (before) {
    params.before = before;
  }

  const data = await messagingRequest<PagedResponse<MessageItem>>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: 'GET' },
    params,
  );

  return {
    items: data?.items || [],
    next_cursor: data?.next_cursor ?? null,
  };
}

/**
 * 会话内搜索消息
 */
export async function searchMessages(
  conversationId: string,
  keyword: string,
  before?: string,
  limit: number = 50
): Promise<PagedResponse<MessageItem>> {
  const params: Record<string, string> = {
    q: keyword,
    limit: String(limit),
  };
  if (before) {
    params.before = before;
  }

  const data = await messagingRequest<PagedResponse<MessageItem>>(
    `/conversations/${encodeURIComponent(conversationId)}/messages/search`,
    { method: 'GET' },
    params,
  );

  return {
    items: data?.items || [],
    next_cursor: data?.next_cursor ?? null,
  };
}

/**
 * 更新会话状态（置顶/免打扰等，双写操作）
 * 先调 SDK 成功后再调此接口
 */
export async function updateConversationState(
  conversationId: string,
  updates: {
    pinned?: boolean;
    muted?: boolean;
    order_seq?: number;
    last_read_msg_time?: string;
  }
): Promise<ConversationItem> {
  return await messagingRequest<ConversationItem>(
    `/conversations/${encodeURIComponent(conversationId)}/state`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
  );
}

/**
 * 删除会话（软删除，双写操作）
 * 先调 SDK 成功后再调此接口
 */
export async function deleteConversation(conversationId: string): Promise<{ deleted: boolean }> {
  return await messagingRequest<{ deleted: boolean }>(
    `/conversations/${encodeURIComponent(conversationId)}`,
    { method: 'DELETE' },
  );
}

/**
 * 获取 OSS 预签名上传地址（走 jeecg-boot Java 服务）
 */
export async function requestOssSignUrl(
  bucketName: string,
  objectKey: string,
  contentType: string,
): Promise<string> {
  const auth = getAuthInfo();
  if (!auth) {
    throw new Error('用户未登录，无法上传附件');
  }

  const url = `${APP_BASE_URL}/open/aliyun/oss/v1/temp/url`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': auth.token,
      'x-tenant-id': auth.tenantId,
    },
    body: JSON.stringify({
      bucketName,
      objectKey,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    }),
  });

  if (handleUnauthorizedResponse(resp)) {
    throw new Error('Token失效，请重新登录!');
  }

  const data = await resp.json();
  if (handleUnauthorizedResponse(resp, data)) {
    throw new Error(data?.message || data?.msg || 'Token失效，请重新登录!');
  }

  if (!resp.ok) {
    throw new Error(`获取上传地址失败(HTTP ${resp.status})`);
  }

  if (!data?.success || !data?.result) {
    throw new Error(data?.message || '获取上传地址失败');
  }

  return data.result;
}
