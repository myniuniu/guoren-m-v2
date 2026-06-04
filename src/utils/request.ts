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

// 401 回调注册
type UnauthorizedCallback = () => void;
let onUnauthorized: UnauthorizedCallback | null = null;
let isLoggingOut = false;

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

/**
 * 底层请求函数：仅做 HMAC 签名，不做 token 注入和 401 处理
 * 用于登录、获取验证码等不需要鉴权的接口
 */
export async function signedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const fullUrl = buildUrl(url);

  // 如果 options 中有 params（GET 请求），需要拼到 URL 上
  let finalUrl = fullUrl;
  if (options.body && typeof options.body === 'string') {
    try {
      const bodyObj = JSON.parse(options.body);
      if (bodyObj.params) {
        finalUrl = buildUrl(url, bodyObj.params);
        delete bodyObj.params;
        options.body = JSON.stringify(bodyObj);
      }
    } catch {
      // body 不是 JSON，保持原样
    }
  }

  // 获取 HMAC 签名头
  const hmacHeaders = await buildHmacAuthHeaders(finalUrl, method);

  // 合并请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...hmacHeaders,
  };

  return fetch(finalUrl, {
    ...options,
    method,
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
  // 先用 signedFetch 发起请求
  const response = await signedFetch(url, options);

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