/**
 * 路由表定义
 *
 * 路由层级设计：
 * - /           → 重定向到 /home
 * - /home       → 首页
 * - /space      → 空间列表
 * - /space/:spaceId → 空间详情
 * - /library    → 资料库
 * - /im         → IM 聊天
 * - /ai         → AI 助手
 * - /login      → 登录页（无需鉴权）
 * - *           → 未匹配路由 → 重定向到 /home
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loading from '../components/Loading'

/**
 * 鉴权守卫：未登录时自动跳转到登录页
 * 登录成功后回到之前访问的页面
 */
export function AuthGuard() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // 未登录，重定向到登录页，并记住当前路径
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

/**
 * 登录页守卫：已登录时自动跳转到首页
 */
export function LoginGuard() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
