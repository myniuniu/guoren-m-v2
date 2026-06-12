import React, { useMemo, useState } from 'react';
import DisplayName from '../../../components/DisplayName';
import Avatar from './Avatar';
import type { GroupMemberState } from '../hooks/useGroupMembers';

interface GroupMembersSheetProps {
  visible: boolean;
  members: GroupMemberState[];
  currentUserRole: string;
  onClose: () => void;
  onAddMembers: () => void;
  onRemoveMember: (member: GroupMemberState) => void;
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 5L8 12L15 19"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function formatRoleText(role: string) {
  if (role === 'Owner') return '群主';
  if (role === 'Admin') return '管理员';
  return '成员';
}

function canManageMembers(currentUserRole: string) {
  return currentUserRole === 'Owner' || currentUserRole === 'Admin';
}

function canRemoveMember(currentUserRole: string, targetRole: string) {
  if (targetRole === 'Owner') return false;
  if (currentUserRole === 'Owner') return true;
  return currentUserRole === 'Admin' && targetRole === 'Member';
}

const GroupMembersSheet: React.FC<GroupMembersSheetProps> = ({
  visible,
  members,
  currentUserRole,
  onClose,
  onAddMembers,
  onRemoveMember,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredMembers = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return members;
    }

    return members.filter((member) => {
      return [
        member.nick,
        member.nameCard,
        member.userID,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedKeyword));
    });
  }, [members, searchKeyword]);

  if (!visible) {
    return null;
  }

  return (
    <div className="im-sheet-overlay im-sheet-overlay--app-shell im-sheet-overlay--top-layer im-sheet-overlay--page">
      <div className="im-sheet-panel im-sheet-panel--app-shell im-sheet-panel--page im-group-members-page">
        <div className="im-group-page-header">
          <button
            type="button"
            className="im-group-page-header__icon"
            aria-label="返回群成员"
            onClick={onClose}
          >
            <BackIcon />
          </button>
          <div className="im-group-page-header__title">群成员</div>
          {canManageMembers(currentUserRole) ? (
            <button
              type="button"
              className="im-group-page-header__action"
              aria-label="添加"
              onClick={onAddMembers}
            >
              添加
            </button>
          ) : (
            <div className="im-group-page-header__spacer" aria-hidden="true" />
          )}
        </div>

        <div className="im-group-members-page__body">
          <div className="im-contact-search im-group-members-page__search">
            <span className="im-contact-search__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              value={searchKeyword}
              className="im-contact-search__input"
              placeholder="搜索群成员"
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>

          <div className="im-group-members-list im-group-members-page__list">
            {filteredMembers.map((member) => (
              <div key={member.userID} className="im-group-members-list__item im-group-members-list__item--page">
                <div className="im-group-members-list__identity">
                  <Avatar
                    url={member.avatar || undefined}
                    name={member.nick || member.userID}
                    size={48}
                    className="im-group-members-list__avatar"
                  />
                  <div className="im-group-members-list__main">
                    <div className="im-group-members-list__name-row">
                      <DisplayName
                        userId={member.userID}
                        fallback={member.nick || member.userID}
                        className="im-group-members-list__name"
                      />
                      <span className="im-group-members-list__role">{formatRoleText(member.role)}</span>
                    </div>
                  </div>
                </div>

                {canRemoveMember(currentUserRole, member.role) ? (
                  <button
                    type="button"
                    className="im-group-members-list__remove"
                    aria-label={`移除${member.nick || member.userID}`}
                    onClick={() => onRemoveMember(member)}
                  >
                    移除
                  </button>
                ) : null}
              </div>
            ))}

            {filteredMembers.length === 0 ? (
              <div className="im-sheet-status">未找到匹配成员</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersSheet;
