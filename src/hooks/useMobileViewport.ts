import { useEffect } from 'react'

const APP_VIEWPORT_HEIGHT_VAR = '--app-viewport-height'

function resolveViewportHeight(): number {
  if (typeof window === 'undefined') {
    return 0
  }

  const visualViewport = window.visualViewport

  if (visualViewport) {
    return Math.round(visualViewport.height)
  }

  return Math.round(window.innerHeight)
}

export function useMobileViewport(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const rootStyle = document.documentElement.style

    // 软键盘、地址栏和横竖屏变化都会影响可见视口高度，这里统一收口成 CSS 变量。
    const syncViewportHeight = () => {
      const nextHeight = resolveViewportHeight()

      if (nextHeight > 0) {
        rootStyle.setProperty(APP_VIEWPORT_HEIGHT_VAR, `${nextHeight}px`)
      }
    }

    syncViewportHeight()

    const visualViewport = window.visualViewport

    window.addEventListener('resize', syncViewportHeight)
    window.addEventListener('orientationchange', syncViewportHeight)
    visualViewport?.addEventListener('resize', syncViewportHeight)
    visualViewport?.addEventListener('scroll', syncViewportHeight)

    return () => {
      window.removeEventListener('resize', syncViewportHeight)
      window.removeEventListener('orientationchange', syncViewportHeight)
      visualViewport?.removeEventListener('resize', syncViewportHeight)
      visualViewport?.removeEventListener('scroll', syncViewportHeight)
      rootStyle.removeProperty(APP_VIEWPORT_HEIGHT_VAR)
    }
  }, [])
}
