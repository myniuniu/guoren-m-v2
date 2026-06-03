import './index.css'

function IMPage() {
  return (
    <div className="im-page">
      <div className="im-placeholder">
        <div className="im-placeholder-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="10" x2="15" y2="10" />
            <line x1="12" y1="7" x2="12" y2="13" />
          </svg>
        </div>
        <div className="im-placeholder-title">即时通讯</div>
        <div className="im-placeholder-desc">IM 功能即将上线，敬请期待</div>
      </div>
    </div>
  )
}

export default IMPage