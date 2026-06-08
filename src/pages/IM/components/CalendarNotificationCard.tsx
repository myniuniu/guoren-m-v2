/**
 * 日历通知卡片（对齐PC端样式）
 */

import React, { useState } from 'react';
import { Popup } from 'antd-mobile';
import {
  buildCalendarNotificationViewModel,
  type CalendarNotificationCustomData,
} from '../utils/calendarNotificationCustomMessage';
import { useDisplayName } from '../utils/displayNameHooks';

export interface CalendarNotificationCardProps {
  notification: CalendarNotificationCustomData;
}

const CalendarNotificationCard: React.FC<CalendarNotificationCardProps> = ({ notification }) => {
  const viewModel = buildCalendarNotificationViewModel(notification);
  const [detailOpen, setDetailOpen] = useState(false);

  // 使用 displayName 替换 actorName（userID -> 业务姓名）
  const actorName = useDisplayName(notification.actorId, notification.actorId);

  // 覆盖 viewModel 中的 actorName，用于所有显示位置
  const finalActorName = actorName || viewModel.actorName || viewModel.actorUserId;

  // 将 actionText 中的 userID 替换为 displayName
  const displayActionText = viewModel.actionText.replace(
    `@${notification.actorId}`,
    `@${finalActorName}`,
  );

  return (
    <>
      <div className={`im-calendar-card${viewModel.kind === 'calendar_shared' ? ' im-calendar-card--share' : ''}`}>
        <div className="im-calendar-card__header">
          <div className="im-calendar-card__header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <rect x="4" y="5" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 3.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 3.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="im-calendar-card__title">{viewModel.headerTitle}</div>
            <div className="im-calendar-card__subtitle">{displayActionText}</div>
          </div>
        </div>

        <div className="im-calendar-card__body">
          {viewModel.kind === 'event_invited' ? (
            <>
              <div className="im-calendar-card__row">
                <div className="im-calendar-card__row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 7.8V12.2L14.8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="im-calendar-card__row-text">
                  {viewModel.timeText || '时间待定'}
                </div>
              </div>
              <div className="im-calendar-card__row">
                <div className="im-calendar-card__row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <circle cx="8.5" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4.5 18C4.5 15.8 6.3 14 8.5 14H9.5C11.7 14 13.5 15.8 13.5 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M14 17.5C14.2 16.1 15.4 15 16.9 15H17.1C18.7 15 20 16.3 20 17.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="im-calendar-card__row-text">
                  <span>@我</span>
                  <span>@{finalActorName}</span>
                </div>
              </div>
              <button type="button" className="im-calendar-card__detail-link" onClick={() => setDetailOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>查看更多详情</span>
              </button>
            </>
          ) : viewModel.kind === 'calendar_reminder' ? (
            <>
              <div className="im-calendar-card__row">
                <div className="im-calendar-card__row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 7.8V12.2L14.8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="im-calendar-card__row-text">
                  {viewModel.timeText}
                </div>
              </div>
              <div className="im-calendar-card__section">
                <div className="im-calendar-card__section-title">日历名称</div>
                <div className="im-calendar-card__section-value">{viewModel.calendarName}</div>
              </div>
              <button type="button" className="im-calendar-card__detail-link" onClick={() => setDetailOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>查看更多详情</span>
              </button>
            </>
          ) : (
            <>
              <div className="im-calendar-card__share-text">
                <span>@{finalActorName}</span>
                <span>{viewModel.kind === 'calendar_shared' ? ' 给你开通了日历的订阅者权限' : ' 取消了对你的日历共享'}</span>
              </div>
              <div className="im-calendar-card__section">
                <div className="im-calendar-card__section-title">日历名称</div>
                <div className="im-calendar-card__section-value">{viewModel.calendarName}</div>
              </div>
              <div className="im-calendar-card__section">
                <div className="im-calendar-card__section-title">权限详情</div>
                <div className="im-calendar-card__section-value im-calendar-card__section-value--muted">
                  {viewModel.permissionText}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      <Popup
        visible={detailOpen}
        onMaskClick={() => setDetailOpen(false)}
        position="bottom"
        bodyStyle={{ height: '60vh', borderRadius: '16px 16px 0 0' }}
      >
        <div style={{ padding: '20px 16px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2329', marginBottom: 16, textAlign: 'center' }}>
            {viewModel.eventTitle || '日程详情'}
          </div>
          <div style={{ color: '#666', fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
            <p>日程详情功能即将上线</p>
            <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>当前仅展示基本信息</p>
          </div>
          <button
            type="button"
            onClick={() => setDetailOpen(false)}
            style={{
              width: '100%',
              marginTop: 24,
              padding: '12px',
              border: 'none',
              borderRadius: 10,
              background: '#4A7CFF',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            知道了
          </button>
        </div>
      </Popup>
    </>
  );
};

export default CalendarNotificationCard;
