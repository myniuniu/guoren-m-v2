/**
 * 研讨会邀请卡片（对齐PC端样式）
 */

import React, { useState } from 'react';
import { type SeminarInviteCustomData, resolveSeminarInviteInviterUserId } from '../utils/seminarInviteCustomMessage';
import { useDisplayName, useDisplayNamePrefetch, useDisplayNameLookup } from '../utils/displayNameHooks';

export interface SeminarInviteCardProps {
  invite: SeminarInviteCustomData;
}

function formatSeminarScheduleTime(timestamp?: number | string): string {
  if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    if (!trimmed) return '--';
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(trimmed)) return trimmed;
    const numericValue = Number(trimmed);
    if (!Number.isFinite(numericValue)) return trimmed;
    timestamp = numericValue;
  }

  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return '--';

  const normalizedTimestamp = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
  const date = new Date(normalizedTimestamp);
  if (Number.isNaN(date.getTime())) return '--';

  const padTimePart = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${padTimePart(date.getMonth() + 1)}-${padTimePart(date.getDate())} ${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`;
}

export function openSeminarInviteJoinUrl(joinUrl: string): void {
  const targetUrl = String(joinUrl || '').trim();
  if (!targetUrl) return;
  if (typeof window === 'undefined' || typeof window.open !== 'function') return;
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

function getSeminarInviteAttendeeCount(joinUrl: string): number | undefined {
  try {
    const url = new URL(joinUrl);
    const scheduleAttendees = url.searchParams.get('scheduleAttendees') || '';
    if (!scheduleAttendees) return undefined;
    const attendeeList = scheduleAttendees
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return attendeeList.length > 0 ? attendeeList.length : undefined;
  } catch {
    return undefined;
  }
}

function getSeminarInviteAttendeeUserIds(joinUrl: string): string[] {
  try {
    const url = new URL(joinUrl);
    const scheduleAttendees = url.searchParams.get('scheduleAttendees') || '';
    if (!scheduleAttendees) return [];
    return scheduleAttendees
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const SeminarInviteCard: React.FC<SeminarInviteCardProps> = ({ invite }) => {
  const inviterUserId = resolveSeminarInviteInviterUserId(invite);
  const [showAttendees, setShowAttendees] = useState(false);

  // 使用 displayName 替换邀请人 userID
  const inviterName = useDisplayName(inviterUserId, inviterUserId);

  const handleOpen = () => openSeminarInviteJoinUrl(invite.joinUrl || '');
  const handleToggleAttendees = () => setShowAttendees((prev) => !prev);

  const attendeeCount = getSeminarInviteAttendeeCount(invite.joinUrl || '');
  const attendeeUserIds = getSeminarInviteAttendeeUserIds(invite.joinUrl || '');

  // 获取 lookup 函数，用于参会人员姓名的同步查询
  const lookupName = useDisplayNameLookup();

  // 只在展开时预热参会人员姓名
  useDisplayNamePrefetch(showAttendees ? attendeeUserIds : []);

  return (
    <div className="im-seminar-card">
      <div className="im-seminar-card__header">
        <div className="im-seminar-card__header-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4.5 17C4.5 14.7909 6.29086 13 8.5 13H9.5C11.7091 13 13.5 14.7909 13.5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10.5 17C10.5 14.7909 12.2909 13 14.5 13H15.5C17.7091 13 19.5 14.7909 19.5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div className="im-seminar-card__header-title">研讨会邀请</div>
      </div>

      <div className="im-seminar-card__body">
        <div className="im-seminar-card__title">{invite.roomName || '未命名研讨会'}</div>

        <div className="im-seminar-card__sender">
          <div className="im-seminar-card__sender-avatar">{inviterName ? inviterName.slice(0, 1) : '?'}</div>
          <div className="im-seminar-card__sender-main">
            <div className="im-seminar-card__sender-label">邀请人</div>
            <div className="im-seminar-card__sender-name">{inviterName || '未知'}</div>
          </div>
          {attendeeCount ? (
            <>
              <div className="im-seminar-card__attendee-chip">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="14" height="14">
                  <circle cx="8" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="16" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5 17C5 15.067 6.567 13.5 8.5 13.5H9.5C11.433 13.5 13 15.067 13 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M13 17C13.155 15.477 14.438 14.3 15.97 14.3H16.03C17.562 14.3 18.845 15.477 19 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span>{attendeeCount} 人参会</span>
              </div>
              <button
                type="button"
                className="im-seminar-card__view-attendees"
                onClick={handleToggleAttendees}
              >
                {showAttendees ? '收起' : '查看'}
              </button>
            </>
          ) : null}
        </div>

        {showAttendees && attendeeUserIds.length > 0 ? (
          <div className="im-seminar-card__attendee-list">
            {attendeeUserIds.map((userID) => {
              const name = lookupName(userID, userID);
              return (
                <div key={userID} className="im-seminar-card__attendee-item">
                  <div className="im-seminar-card__attendee-item-avatar">
                    {name ? name.slice(0, 1) : '?'}
                  </div>
                  <span className="im-seminar-card__attendee-item-name">{name}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="im-seminar-card__schedule">
          <div className="im-seminar-card__schedule-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7.8V12.2L14.8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="im-seminar-card__schedule-label">时间</div>
          <div className="im-seminar-card__schedule-value">
            {formatSeminarScheduleTime(invite.scheduleStartTime)}
            <span className="im-seminar-card__schedule-sep">至</span>
            {formatSeminarScheduleTime(invite.scheduleEndTime)}
          </div>
        </div>

        <button
          type="button"
          className="im-seminar-card__action"
          onClick={handleOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M10.8 13.2L13.2 10.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M9.1 15.9L7.6 17.4C6.163 18.837 3.837 18.837 2.4 17.4C0.963001 15.963 0.963001 13.637 2.4 12.2L5.6 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.9 8.1L16.4 6.6C17.837 5.163 20.163 5.163 21.6 6.6C23.037 8.037 23.037 10.363 21.6 11.8L18.4 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>立即入会</span>
        </button>
      </div>
    </div>
  );
};

export default SeminarInviteCard;
