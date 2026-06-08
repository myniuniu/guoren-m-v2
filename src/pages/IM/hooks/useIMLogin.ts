/**
 * IM SDK 登录/登出/生命周期管理 Hook
 *
 * 封装 SDK 初始化、登录、事件监听、登出等完整链路
 * 通过 useRef 持有 SDK 实例，避免重复创建
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import TencentCloudChat from '@tencentcloud/lite-chat';
import { useAuth } from '../../../contexts/AuthContext';

// SDKAppID（从 public/config.yaml 读取，开发环境直接硬编码）
const SDKAPPID = 1600139526;

// 登录链路状态
export type LoginStatus = 'idle' | 'loading' | 'success' | 'error';
type ChatInstance = ReturnType<typeof TencentCloudChat.create>;

// SDK 实例引用（模块级，全局唯一）
let globalChatInstance: ChatInstance | null = null;

/**
 * 获取 userSig（从后端签发）
 * @param userID 用户 ID
 * @param token 登录 token
 */
async function getUserSig(userID: string, token: string): Promise<string> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${baseUrl}/sys/group/im/userSig?userId=${encodeURIComponent(userID)}`;

  const response = await fetch(url, {
    headers: {
      'X-Access-Token': token,
      'Accept': 'application/json, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`获取 IM userSig 失败 (HTTP ${response.status})`);
  }

  const payload = await response.json();

  const ok = payload?.success === true || String(payload?.code || '') === '200';
  const sig = ok ? String(payload?.result ?? '').trim() : '';

  if (!ok || !sig) {
    throw new Error('获取 IM userSig 失败，请检查后端签名接口返回');
  }

  return sig;
}

export function useIMLogin() {
  const { token, userInfo, isAuthenticated } = useAuth();
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<ChatInstance | null>(null);

  /**
   * 初始化并登录 SDK
   */
  const doLogin = useCallback(async () => {
    if (!isAuthenticated || !userInfo?.id || !token) {
      setError('用户未登录');
      setLoginStatus('error');
      return;
    }

    // 避免重复登录
    if (chatRef.current?.getLoginUser?.()) {
      setLoginStatus('success');
      return;
    }

    setLoginStatus('loading');
    setError(null);

    try {
      const userSig = await getUserSig(userInfo.id, token);

      // 创建 SDK 实例
      const chat = TencentCloudChat.create({ SDKAppID: SDKAPPID });
      chatRef.current = chat;
      globalChatInstance = chat;

      // 注册全局事件监听
      chat.on(TencentCloudChat.EVENT.SDK_READY, () => {
        console.log('[IM] SDK READY');
      });

      chat.on(TencentCloudChat.EVENT.SDK_NOT_READY, () => {
        console.log('[IM] SDK NOT READY');
      });

      chat.on(TencentCloudChat.EVENT.KICKED_OUT, () => {
        console.warn('[IM] 被踢下线');
        // 被踢下线后重置状态
        setLoginStatus('error');
        setError('账号已在其他设备登录');
      });

      // 执行登录
      await chat.login({ userID: userInfo.id, userSig });
      setLoginStatus('success');
    } catch (err) {
      console.error('[IM] 登录失败:', err);
      setError(err instanceof Error ? err.message : 'IM 登录失败');
      setLoginStatus('error');
    }
  }, [isAuthenticated, userInfo?.id, token]);

  /**
   * 登出 SDK
   */
  const doLogout = useCallback(async () => {
    try {
      if (chatRef.current) {
        await chatRef.current.logout();
        chatRef.current = null;
        globalChatInstance = null;
      }
    } catch (err) {
      console.error('[IM] 登出失败:', err);
    } finally {
      setLoginStatus('idle');
      setError(null);
    }
  }, []);

  /**
   * 监听登录态变化，自动登录/登出
   */
  useEffect(() => {
    if (isAuthenticated && userInfo?.id && token) {
      doLogin();
    } else {
      doLogout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userInfo?.id, token]);

  /**
   * 组件卸载时清理
   */
  useEffect(() => {
    return () => {
      // 页面卸载时不自动登出，保持 WebSocket 连接
      // 真正的登出由 AuthContext 的 logout 触发
    };
  }, []);

  return {
    chat: chatRef.current,
    loginStatus,
    error,
    doLogin,
    doLogout,
  };
}

/**
 * 获取全局 SDK 实例（供外部调用）
 */
export function getChatInstance(): ChatInstance | null {
  return globalChatInstance;
}
