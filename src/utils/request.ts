/**
 * HTTP 请求封装模块
 *
 * 提供两层请求能力：
 * - signedFetch：仅做 HMAC 签名，用于登录、获取验证码等不需要 token 的接口
 * - apiRequest：HMAC + Token 注入 + 401 拦截，用于所有需要鉴权的接口
 *
 * 401 处理通过回调解耦，避免与 AuthContext 产生循环依赖
 */

import { buildHmacAuthHeaders } from './hmacSign';

// API 基础地址，从环境变量读取
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://test-guoren-api.grtcloud.net/jeecg-boot';
const AI_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || 'https://test-guoren-ai.grtcloud.net';

// 401 回调注册
type UnauthorizedCallback = () => void;
let onUnauthorized: UnauthorizedCallback | null = null;
let isLoggingOut = false;

interface StoredAuthInfo {
  token: string;
  tenantId: string;
}

function readStoredAuthInfo(): StoredAuthInfo | null {
  try {
    const token = localStorage.getItem('SUPERSONIC_TOKEN');
    const tenantId = localStorage.getItem('SUPERSONIC_TENANT_ID');

    if (!token || !tenantId) {
      return null;
    }

    return { token, tenantId };
  } catch {
    return null;
  }
}

function normalizeHeaders(headersInit?: HeadersInit): Record<string, string> {
  const headers = new Headers(headersInit);
  const normalized: Record<string, string> = {};

  headers.forEach((value, key) => {
    normalized[key] = value;
  });

  return normalized;
}

function buildAuthHeaders(): Record<string, string> {
  const auth = readStoredAuthInfo();

  if (!auth) {
    return {};
  }

  return {
    'X-Access-Token': auth.token,
    'X-Tenant-Id': auth.tenantId,
  };
}

function resolveRequestUrl(
  url: string,
  options: RequestInit = {}
): { finalUrl: string; body: BodyInit | null | undefined } {
  let finalUrl = buildUrl(url);
  let nextBody = options.body;

  if (typeof nextBody === 'string') {
    try {
      const bodyObj = JSON.parse(nextBody) as Record<string, unknown> & {
        params?: Record<string, string>;
      };

      if (bodyObj.params) {
        finalUrl = buildUrl(url, bodyObj.params);
        delete bodyObj.params;
        nextBody = JSON.stringify(bodyObj);
      }
    } catch {
      // body 不是 JSON，保持原样
    }
  }

  return {
    finalUrl,
    body: nextBody,
  };
}

/**
 * 注册 401 未授权回调
 * 由 AuthContext 在初始化时调用，传入 logout 函数
 */
export function setOnUnauthorized(callback: UnauthorizedCallback): void {
  onUnauthorized = callback;
}

/**
 * 判断是否是需要触发登出的错误码
 * 与后端约定的鉴权相关错误码
 */
function isAuthErrorCode(code: string | number): boolean {
  const authCodes = ['401', 'A0128', 'A0129', 'A0130', 'A0131', 'A0132', 'A0300'];
  return authCodes.includes(String(code));
}

/**
 * 拼接完整请求 URL
 */
function buildUrl(path: string, params?: Record<string, string>): string {
  const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  if (!params) return fullUrl;

  const urlObj = new URL(fullUrl);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.append(key, value);
  });
  return urlObj.toString();
}

function buildUrlWithBase(baseUrl: string, path: string, params?: Record<string, string>): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('http') ? path : `${normalizedBaseUrl}/${path.replace(/^\/+/, '')}`;

  if (!params) {
    return normalizedPath;
  }

  const urlObj = new URL(normalizedPath);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.append(key, value);
  });
  return urlObj.toString();
}

/**
 * 底层请求函数：仅做 HMAC 签名，不做 token 注入和 401 处理
 * 用于登录、获取验证码等不需要鉴权的接口
 */
export async function signedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const { finalUrl, body } = resolveRequestUrl(url, options);

  // 获取 HMAC 签名头
  const hmacHeaders = await buildHmacAuthHeaders(finalUrl, method);
  const optionHeaders = normalizeHeaders(options.headers);

  // 合并请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...optionHeaders,
    ...hmacHeaders,
  };

  return fetch(finalUrl, {
    ...options,
    method,
    body,
    headers,
    credentials: 'omit',
  });
}

/**
 * 导出统一 API URL 构造能力，给聊天 worker 和 service 复用。
 */
export function buildApiUrl(path: string, params?: Record<string, string>): string {
  return buildUrl(path, params);
}

/**
 * AI 服务基座，供聊天、指令、智能体等 /api/v1/* 接口显式使用。
 */
export function getAiApiBaseUrl(): string {
  return AI_BASE_URL.replace(/\/+$/, '');
}

/**
 * 使用 AI 服务基座拼接完整 URL。
 */
export function buildAiApiUrl(
  path: string,
  params?: Record<string, string>
): string {
  return buildUrlWithBase(getAiApiBaseUrl(), path, params);
}

/**
 * 使用指定基座拼接完整 URL。
 */
export function buildAbsoluteApiUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>
): string {
  return buildUrlWithBase(baseUrl, path, params);
}

/**
 * 生成带 HMAC、token 和 tenant 的完整请求头。
 * 聊天链路需要把这套头显式透传到 SharedWorker 里，不能依赖组件上下文。
 */
export async function buildAuthorizedHeaders(
  url: string,
  method: string,
  headersInit?: HeadersInit
): Promise<Record<string, string>> {
  const finalUrl = buildUrl(url);
  const hmacHeaders = await buildHmacAuthHeaders(finalUrl, method.toUpperCase());

  return {
    ...normalizeHeaders(headersInit),
    ...buildAuthHeaders(),
    ...hmacHeaders,
  };
}

/**
 * 带鉴权的底层 fetch。
 * 这个出口不解析 JSON，专门给 SSE、Blob、worker 桥接等需要原始 Response 的场景使用。
 */
export async function authorizedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const { finalUrl, body } = resolveRequestUrl(url, options);
  const headers = await buildAuthorizedHeaders(finalUrl, method, {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...normalizeHeaders(options.headers),
  });

  return fetch(finalUrl, {
    ...options,
    method,
    body,
    headers,
    credentials: 'omit',
  });
}

/**
 * 带鉴权的请求函数：HMAC + Token + 401 处理
 * 用于所有需要登录态的接口
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authorizedFetch(url, options);

  // 处理 HTTP 状态码 401
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('未授权，请重新登录');
  }

  // 解析响应体
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`响应解析失败，状态码: ${response.status}`);
  }

  // 处理响应体中的鉴权错误码
  if (data && isAuthErrorCode(data.code)) {
    handleUnauthorized();
    const errorMsg = data.message || data.msg || '登录状态已失效，请重新登录';
    throw new Error(errorMsg);
  }

  // 其他 HTTP 错误
  if (response.status !== 200) {
    const errorMsg = data?.message || data?.msg || `请求失败，状态码: ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

/**
 * 处理未授权：触发回调，防抖处理
 */
function handleUnauthorized(): void {
  if (isLoggingOut) return;
  isLoggingOut = true;

  if (onUnauthorized) {
    onUnauthorized();
  }

  // 防止重复触发
  setTimeout(() => {
    isLoggingOut = false;
  }, 2000);
}

/**
 * GET 请求便捷方法（带鉴权）
 */
export function get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
  const url = buildUrl(path, params);
  return apiRequest<T>(url, { method: 'GET' });
}

/**
 * POST 请求便捷方法（带鉴权）
 */
export function post<T = any>(path: string, data?: Record<string, unknown>): Promise<T> {
  const url = buildUrl(path);
  return apiRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 请求便捷方法（带鉴权）
 */
export function put<T = any>(path: string, data?: Record<string, unknown>): Promise<T> {
  const url = buildUrl(path);
  return apiRequest<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 请求便捷方法（带鉴权）
 */
export function del<T = any>(path: string, params?: Record<string, string>): Promise<T> {
  const url = buildUrl(path, params);
  return apiRequest<T>(url, { method: 'DELETE' });
}
