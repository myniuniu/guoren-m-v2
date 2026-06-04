import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // 可以在这里提示用户有新版本
  },
  onOfflineReady() {
    // 离线就绪提示
  },
})
void updateSW // PWA 更新函数，由 vite-plugin-pwa 管理生命周期

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
