/**
 * LoginGuard 组件
 * 登录状态守卫：展示 loading / error / success 三态
 * 包裹 IM 内容，根据 SDK 登录状态渲染不同 UI
 */

import React from 'react';
import { SpinLoading, ErrorBlock } from 'antd-mobile';
import type { LoginStatus } from '../hooks/useIMLogin';

interface LoginGuardProps {
  loginStatus: LoginStatus;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

const LoginGuard: React.FC<LoginGuardProps> = ({
  loginStatus,
  error,
  onRetry,
  children,
}) => {
  // loading 态：SDK 登录中
  if (loginStatus === 'loading' || loginStatus === 'idle') {
    return (
      <div className="im-login-guard im-login-guard--loading">
        <SpinLoading color="primary" />
        <p className="im-login-guard__text">连接中...</p>
      </div>
    );
  }

  // error 态：登录失败
  if (loginStatus === 'error') {
    return (
      <div className="im-login-guard im-login-guard--error">
        <ErrorBlock
          status="default"
          title="连接失败"
          description={error || '无法连接到 IM 服务，请检查网络后重试'}
        />
        {onRetry && (
          <button className="im-login-guard__retry" onClick={onRetry}>
            重新连接
          </button>
        )}
      </div>
    );
  }

  // success 态：正常渲染子内容
  return <>{children}</>;
};

export default LoginGuard;
