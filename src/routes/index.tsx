import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const APP_ROUTE_PATHS = {
  root: '/',
  home: '/home',
  space: '/space',
  library: '/library',
  im: '/im',
  ai: '/ai',
  partner: '/partner',
  login: '/login',
} as const

export function getPathByTabKey(tabKey: string): string {
  switch (tabKey) {
    case 'home':
      return APP_ROUTE_PATHS.home
    case 'space':
      return APP_ROUTE_PATHS.space
    case 'library':
      return APP_ROUTE_PATHS.library
    case 'im':
      return APP_ROUTE_PATHS.im
    case 'ai':
      return APP_ROUTE_PATHS.ai
    default:
      return `/apps/${tabKey}`
  }
}

export function getTabKeyByPathname(pathname: string): string {
  if (pathname.startsWith(`${APP_ROUTE_PATHS.space}/`)) {
    return 'space'
  }

  if (pathname.startsWith(APP_ROUTE_PATHS.space)) {
    return 'space'
  }

  if (pathname.startsWith(APP_ROUTE_PATHS.library)) {
    return 'library'
  }

  if (pathname.startsWith(APP_ROUTE_PATHS.im)) {
    return 'im'
  }

  if (pathname.startsWith(APP_ROUTE_PATHS.partner)) {
    return 'ai'
  }

  if (pathname.startsWith(APP_ROUTE_PATHS.ai)) {
    return 'ai'
  }

  if (pathname.startsWith('/apps/')) {
    return pathname.replace('/apps/', '').split('/')[0] || 'home'
  }

  return 'home'
}

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
    return <Navigate to={APP_ROUTE_PATHS.home} replace />
  }

  return <Outlet />
}
