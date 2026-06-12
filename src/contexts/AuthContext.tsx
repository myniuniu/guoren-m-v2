/**
 * 鉴权上下文
 *
 * 管理全局鉴权状态：登录、登出、Token 存储、用户信息管理
 * 通过 AuthProvider 包裹应用，所有子组件可通过 useAuth() 获取鉴权状态和方法
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { signedFetch, setOnUnauthorized } from '../utils/request';

// 后端 API 路径
const API_LOGIN = '/sys/login';
const API_RANDOM_IMAGE = (key: string) => `/sys/randomImage/${key}`;

// 用户信息类型
export interface UserInfo {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  email: string | null;
  loginTenantId: string;
}

// 登录响应类型
interface LoginApiResponse {
  code: number;
  message?: string;
  msg?: string;
  result?: {
    token: string;
    userInfo: {
      id: string;
      username: string;
      name?: string;
      avatar?: string | null;
      email?: string | null;
      loginTenantId: string;
    };
    tenantList?: Array<{ id: number; name: string }>;
  };
}

// 验证码响应类型
interface CaptchaApiResponse {
  code?: number;
  result?: string;
}

// AuthContext 值类型
interface AuthContextType {
  /** 是否已通过鉴权 */
  isAuthenticated: boolean;
  /** 当前登录 token */
  token: string | null;
  /** 当前用户信息 */
  userInfo: UserInfo | null;
  /** 登录方法 */
  login: (username: string, password: string, captcha: string, checkKey: string) => Promise<void>;
  /** 登出方法 */
  logout: () => void;
  /** 获取验证码图片（base64） */
  getCaptcha: (key: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * 从 localStorage 恢复鉴权状态
 */
function restoreAuthState(): { token: string | null; userInfo: UserInfo | null } {
  try {
    const token = localStorage.getItem('SUPERSONIC_TOKEN');
    const userInfoStr = localStorage.getItem('userInfo');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (token && userInfoStr && isLoggedIn) {
      const userInfo = JSON.parse(userInfoStr) as UserInfo;
      // 基本校验：确保必要字段存在
      if (userInfo.id && userInfo.loginTenantId) {
        return { token, userInfo };
      }
    }
  } catch {
    // 解析失败，清除可能损坏的数据
    clearAuthStorage();
  }
  return { token: null, userInfo: null };
}

/**
 * 清除 localStorage 中的鉴权数据
 */
function clearAuthStorage(): void {
  const keysToRemove = [
    'SUPERSONIC_TOKEN',
    'SUPERSONIC_USERNAME',
    'SUPERSONIC_ID',
    'SUPERSONIC_TENANT_ID',
    'SUPERSONIC_TENANT_NAME',
    'isLoggedIn',
    'userInfo',
  ];
  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // 忽略清除失败
    }
  });
}

/**
 * 保存用户信息到 localStorage
 */
function saveAuthData(token: string, userInfo: UserInfo, tenantList?: Array<{ id: number; name: string }>): void {
  localStorage.setItem('SUPERSONIC_TOKEN', token);
  localStorage.setItem('SUPERSONIC_USERNAME', userInfo.username);
  localStorage.setItem('SUPERSONIC_ID', userInfo.id);
  localStorage.setItem('SUPERSONIC_TENANT_ID', userInfo.loginTenantId);
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userInfo', JSON.stringify(userInfo));

  // 根据 loginTenantId 查找租户名称
  if (tenantList && tenantList.length > 0) {
    const tenant = tenantList.find((t) => t.id === Number(userInfo.loginTenantId));
    if (tenant?.name) {
      localStorage.setItem('SUPERSONIC_TENANT_NAME', tenant.name);
    }
  }
}

/**
 * AuthProvider 组件
 * 必须在应用最外层挂载，且应在 main.tsx 中包裹 App
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const initialState = restoreAuthState();
  const [token, setToken] = useState<string | null>(initialState.token);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(initialState.userInfo);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!initialState.token && !!initialState.userInfo
  );

  /**
   * 登出：清除所有鉴权状态
   * 由 401 回调或主动登出触发
   */
  const logout = useCallback(() => {
    setToken(null);
    setUserInfo(null);
    setIsAuthenticated(false);
    clearAuthStorage();
  }, []);

  // 注册 401 回调，在组件挂载时将 logout 注册到 request 模块
  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  /**
   * 登录
   * 调用后端登录接口，成功后保存 token 和用户信息
   */
  const login = useCallback(
    async (username: string, password: string, captcha: string, checkKey: string) => {
      // 先清除旧登录状态，确保每次登录都是全新 token
      clearAuthStorage();

      const response = await signedFetch(API_LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          loginOrgCode: '',
          captcha,
          checkKey,
        }),
      });

      const data: LoginApiResponse = await response.json();

      if (data.code === 200 && data.result?.token && data.result?.userInfo) {
        const { token: newToken, userInfo: rawUserInfo, tenantList } = data.result;

        // 构建标准用户信息对象
        const normalizedUserInfo: UserInfo = {
          id: String(rawUserInfo.id ?? ''),
          username: rawUserInfo.username ?? '',
          name: rawUserInfo.name || rawUserInfo.username || '',
          avatar: rawUserInfo.avatar || null,
          email: rawUserInfo.email || null,
          loginTenantId: String(rawUserInfo.loginTenantId ?? ''),
        };

        // 保存到 localStorage
        saveAuthData(newToken, normalizedUserInfo, tenantList);

        // 更新状态，触发 App 重新渲染
        setToken(newToken);
        setUserInfo(normalizedUserInfo);
        setIsAuthenticated(true);
      } else {
        // 登录失败，抛出服务器返回的错误信息
        const errorMsg = data.message || data.msg || '登录失败，请检查用户名和密码';
        throw new Error(errorMsg);
      }
    },
    []
  );

  /**
   * 获取验证码图片
   * @param key - 验证码标识（时间戳或 UUID）
   * @returns base64 编码的验证码图片
   */
  const getCaptcha = useCallback(async (key: string): Promise<string> => {
    const response = await signedFetch(API_RANDOM_IMAGE(key), { method: 'GET' });
    const data: CaptchaApiResponse = await response.json();

    if (!response.ok) {
      throw new Error('获取验证码失败');
    }

    if (data.result) {
      return data.result;
    }

    throw new Error('验证码数据为空');
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated,
    token,
    userInfo,
    login,
    logout,
    getCaptcha,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用鉴权上下文的 Hook
 * 必须在 AuthProvider 内部使用
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
}