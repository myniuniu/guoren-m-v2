/**
 * HMAC-SHA256 签名工具
 * 使用浏览器内置 Web Crypto API 实现，与后端 crypto-js 的 HMAC-SHA256 + Base64 输出保持一致
 * 无需新增任何第三方依赖
 */

// HMAC 签名参数，与后端约定一致
const ACCESS_KEY = '737e1b669aed466fb9ca2bc7cbb95122';
const SECRET_KEY = 'c46db29af279e900a1bde024c41be83e';
const HMAC_TIMESTAMP = '1684995439';

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 * 与 crypto-js 的 CryptoJS.enc.Base64 输出格式一致
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 使用 HMAC-SHA256 对数据进行签名，返回 Base64 编码的签名结果
 * @param data - 待签名的规范请求字符串
 * @param key - 签名密钥
 * @returns Base64 编码的 HMAC-SHA256 签名
 */
async function hmacSha256Base64(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const dataBytes = encoder.encode(data);

  // 导入 HMAC 密钥
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 执行签名
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);

  return arrayBufferToBase64(signature);
}

/**
 * 构建 HMAC 认证请求头
 * 根据请求 URL 和方法生成规范请求字符串，计算 HMAC 签名，返回完整的认证头对象
 * @param url - 完整请求 URL
 * @param method - HTTP 方法（GET/POST/PUT/DELETE）
 * @returns HMAC 认证相关的 HTTP 头键值对
 */
export async function buildHmacAuthHeaders(
  url: string,
  method: string
): Promise<Record<string, string>> {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;

  // 收集并按字母排序 query 参数
  const searchParams = urlObj.searchParams;
  const queryEntries: string[] = [];
  searchParams.forEach((value, key) => {
    // 跳过空值和 null
    if (value === 'undefined' || value === 'null' || value === '') {
      return;
    }
    queryEntries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });
  queryEntries.sort();
  const queryString = queryEntries.join('&');

  // 构建规范请求字符串
  // 格式：METHOD\npath\nqueryString\naccessKey\ndate\nReferer:origin/\n
  const date = new Date().toUTCString();
  const canonicalRequest =
    `${method.toUpperCase()}\n${pathname}\n${queryString}\n${ACCESS_KEY}\n${date}\nReferer:${window.location.origin}/\n`;

  // 计算签名
  const signature = await hmacSha256Base64(canonicalRequest, SECRET_KEY);

  return {
    'X-HMAC-DATE': date,
    'X-HMAC-ACCESS-KEY': ACCESS_KEY,
    'X-HMAC-SIGNATURE': signature,
    'X-HMAC-ALGORITHM': 'hmac-sha256',
    'X-HMAC-TIMESTAMP': HMAC_TIMESTAMP,
    'X-HMAC-SIGNED-HEADERS': 'Referer',
  };
}