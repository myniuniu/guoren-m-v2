/**
 * 登录页面组件
 *
 * 全屏登录页面，未鉴权时由 App.tsx 渲染，替代所有正常页面内容
 * 支持用户名密码登录 + 图形验证码
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './index.css';

export default function LoginPage() {
  const { login, getCaptcha } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = typeof location.state?.from === 'string' ? location.state.from : '/home';

  // 表单状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [checkKey, setCheckKey] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // 获取验证码的函数
  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    // 生成新的验证码 key，使用时间戳 + 随机数避免缓存
    const key = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setCheckKey(key);
    setCaptcha('');

    try {
      const imgBase64 = await getCaptcha(key);
      setCaptchaImage(imgBase64);
    } catch (err) {
      console.error('[登录页] 获取验证码失败:', err);
      setError('验证码加载失败，请点击图片重试');
    } finally {
      setCaptchaLoading(false);
    }
  }, [getCaptcha]);

  // 组件挂载时获取验证码
  useEffect(() => {
    fetchCaptcha();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 表单校验
  const validate = (): boolean => {
    if (!username.trim()) {
      setError('请输入用户名');
      return false;
    }
    if (!password) {
      setError('请输入密码');
      return false;
    }
    if (password.length < 6) {
      setError('密码至少 6 位字符');
      return false;
    }
    if (!captcha.trim()) {
      setError('请输入验证码');
      return false;
    }
    if (captcha.length !== 4) {
      setError('验证码为 4 位字符');
      return false;
    }
    return true;
  };

  // 登录提交
  const handleLogin = async () => {
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await login(username.trim(), password, captcha.trim(), checkKey);
      // 登录成功后按来源路由回跳，避免固定回首页。
      navigate(fromPath, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '网络异常，请稍后重试';
      setError(message);
      // 登录失败后刷新验证码
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // 回车键提交
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        handleLogin();
      }
    },
    [username, password, captcha, loading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="login-page">
      <div className="login-page-card">
        {/* 品牌区域 */}
        <div className="login-brand">
          <div className="login-brand-logo">
            {/* 果仁 Logo SVG - 简洁几何风格 */}
            <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="10" r="6" stroke="#fff" strokeWidth="2" fill="none" />
              <path d="M9 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="9" r="1" fill="#fff" />
              <circle cx="20" cy="9" r="1" fill="#fff" />
            </svg>
          </div>
          <h1 className="login-brand-title">果仁</h1>
          <p className="login-brand-subtitle">知识管理，从这里开始</p>
        </div>

        {/* 登录表单 */}
        <div className="login-form">
          {/* 错误提示 */}
          {error && <div className="login-error">{error}</div>}

          {/* 用户名 */}
          <div className="login-input-group">
            <input
              type="text"
              className="login-input"
              placeholder="请输入用户名/手机号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* 密码 */}
          <div className="login-input-group login-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? (
                // 眼睛开图标
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                // 眼睛关图标
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                </svg>
              )}
            </button>
          </div>

          {/* 验证码 */}
          <div className="login-input-group login-captcha-row">
            <input
              type="text"
              className="login-input"
              placeholder="请输入验证码"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4))}
              onKeyDown={handleKeyDown}
              maxLength={4}
              autoComplete="off"
            />
            {captchaLoading ? (
              <div className="login-captcha-img" style={{ background: '#f0f1f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="login-btn-spinner" style={{ borderTopColor: '#999', borderColor: 'rgba(0,0,0,0.1)' }} />
              </div>
            ) : (
              <img
                className="login-captcha-img"
                src={captchaImage}
                alt="验证码"
                onClick={fetchCaptcha}
                title="点击刷新验证码"
              />
            )}
          </div>

          {/* 登录按钮 */}
          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-btn-spinner" />
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>
        </div>

        {/* 底部协议 */}
        <div className="login-agreement">
          登录即表示同意
          <a href="#" onClick={(e) => e.preventDefault()}>用户协议</a>
          和
          <a href="#" onClick={(e) => e.preventDefault()}>隐私政策</a>
        </div>
      </div>
    </div>
  );
}
