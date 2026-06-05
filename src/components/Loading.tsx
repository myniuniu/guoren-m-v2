/**
 * 全屏加载组件
 * 页面初始化或异步加载时显示
 */

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
      background: '#f8f9fb',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid #e8ecf1',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
