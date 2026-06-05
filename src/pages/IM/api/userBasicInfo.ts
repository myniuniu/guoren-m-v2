/**
 * 用户基本信息查询 API
 * 根据 userID 查询用户的 name/realname/avatar
 * 接口地址: GET /sys/user/getBasicInfo?id={userID}
 */

// API 基础地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * 获取当前用户鉴权信息
 */
function getAuthInfo(): { token: string; tenantId: string } | null {
  try {
    const token = localStorage.getItem('SUPERSONIC_TOKEN');
    const userInfoStr = localStorage.getItem('userInfo');
    if (!token || !userInfoStr) return null;
    const userInfo = JSON.parse(userInfoStr);
    return {
      token,
      tenantId: String(userInfo.loginTenantId || ''),
    };
  } catch {
    return null;
  }
}

export interface UserBasicInfo {
  userID: string;
  displayName: string;
  username?: string;
  avatar: string | null;
}

/**
 * 根据 userID 查询用户基本信息
 * @param userID 用户 ID
 * @returns 用户基本信息
 */
export async function fetchUserBasicInfo(userID: string): Promise<UserBasicInfo | null> {
  if (!userID || userID.startsWith('@TGS#') || userID.startsWith('@RBT#')) {
    return null;
  }

  const auth = getAuthInfo();
  if (!auth) {
    return null;
  }

  try {
    const url = `${BASE_URL}/sys/user/getBasicInfo?id=${encodeURIComponent(userID)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Access-Token': auth.token,
        'X-Tenant-Id': auth.tenantId,
      },
    });

    const data: any = await response.json();

    const result = data?.result || data;
    if (!result) return null;

    const displayName = String(result?.name || result?.realname || '').trim();
    if (!displayName) return null;

    return {
      userID: String(result?.id || userID),
      displayName,
      username: String(result?.username || '').trim() || undefined,
      avatar: result?.avatar ?? null,
    };
  } catch (err) {
    console.warn(`[DisplayName] 查询用户 ${userID} 基本信息失败:`, err);
    return null;
  }
}
