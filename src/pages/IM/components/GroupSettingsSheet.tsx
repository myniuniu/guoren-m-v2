import React, { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';
import type { MergedConversation } from '../hooks/useConversationList';
import type { GroupMemberState, GroupProfileState } from '../hooks/useGroupMembers';

interface GroupSettingsSheetProps {
  visible: boolean;
  conversation: MergedConversation;
  groupProfile: GroupProfileState | null;
  members: GroupMemberState[];
  currentMember: GroupMemberState | null;
  muted: boolean;
  onClose: () => void;
  onOpenMembers: () => void;
  onToggleMute: (nextMuted: boolean) => Promise<void> | void;
  onUpdateGroupName: (name: string) => Promise<void> | void;
  onUpdateNameCard: (nameCard: string) => Promise<void> | void;
  onUpdateGroupAvatar?: (file: File) => Promise<void> | void;
}

type EditTarget = 'group-name' | 'group-name-card' | null;

const PREVIEW_MEMBER_LIMIT = 6;

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

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function resolveEditTitle(target: EditTarget) {
  if (target === 'group-name') {
    return '修改群名称';
  }
  if (target === 'group-name-card') {
    return '修改群昵称';
  }
  return '';
}

const GroupSettingsSheet: React.FC<GroupSettingsSheetProps> = ({
  visible,
  conversation,
  groupProfile,
  members,
  currentMember,
  muted,
  onClose,
  onOpenMembers,
  onToggleMute,
  onUpdateGroupName,
  onUpdateNameCard,
  onUpdateGroupAvatar,
}) => {
  const [activeEditTarget, setActiveEditTarget] = useState<EditTarget>(null);
  const [draftValue, setDraftValue] = useState('');
  const [savingTarget, setSavingTarget] = useState<EditTarget>(null);
  const [isMuteSaving, setIsMuteSaving] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const groupName = groupProfile?.name || conversation.title;
  const groupAvatar = groupProfile?.avatar || conversation.avatar || undefined;
  const memberNum = groupProfile?.memberNum || members.length;
  const currentNameCard = currentMember?.nameCard?.trim() || '';
  const previewMembers = useMemo(() => members.slice(0, PREVIEW_MEMBER_LIMIT), [members]);
  const canSubmitEdit = draftValue.trim().length > 0;

  useEffect(() => {
    if (!visible) {
      setActiveEditTarget(null);
      setDraftValue('');
      setSavingTarget(null);
      setIsMuteSaving(false);
      setIsAvatarSaving(false);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const openEditDialog = (target: Exclude<EditTarget, null>) => {
    setActiveEditTarget(target);
    setDraftValue(target === 'group-name' ? groupName : currentNameCard);
  };

  const closeEditDialog = () => {
    if (savingTarget) {
      return;
    }
    setActiveEditTarget(null);
    setDraftValue('');
  };

  const handleSaveEdit = async () => {
    const trimmedValue = draftValue.trim();
    if (!trimmedValue || !activeEditTarget) {
      return;
    }

    setSavingTarget(activeEditTarget);
    try {
      if (activeEditTarget === 'group-name') {
        await onUpdateGroupName(trimmedValue);
      } else {
        await onUpdateNameCard(trimmedValue);
      }
      setActiveEditTarget(null);
      setDraftValue('');
    } finally {
      setSavingTarget(null);
    }
  };

  const handleMuteChange = async () => {
    if (isMuteSaving) {
      return;
    }
    setIsMuteSaving(true);
    try {
      await onToggleMute(!muted);
    } finally {
      setIsMuteSaving(false);
    }
  };

  const handleAvatarInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUpdateGroupAvatar || isAvatarSaving) {
      return;
    }

    setIsAvatarSaving(true);
    try {
      await onUpdateGroupAvatar(file);
    } finally {
      setIsAvatarSaving(false);
    }
  };

  return (
    <div className="im-sheet-overlay im-sheet-overlay--app-shell im-sheet-overlay--top-layer im-sheet-overlay--page">
      <div className="im-sheet-panel im-sheet-panel--app-shell im-sheet-panel--page im-group-settings-page">
        <div className="im-group-page-header">
          <button
            type="button"
            className="im-group-page-header__icon"
            aria-label="返回群设置"
            onClick={onClose}
          >
            <BackIcon />
          </button>
          <div className="im-group-page-header__title">设置</div>
          <div className="im-group-page-header__spacer" aria-hidden="true" />
        </div>

        <div className="im-group-settings-page__body">
          <section className="im-group-settings-card im-group-settings-card--profile">
            <div className="im-group-settings-profile">
              <div className="im-group-settings-profile__avatar-wrap">
                <Avatar
                  url={groupAvatar}
                  name={groupName}
                  variant="group"
                  size={64}
                  className="im-group-settings-profile__avatar"
                />
                {onUpdateGroupAvatar ? (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="im-group-settings-profile__avatar-input"
                      onChange={handleAvatarInputChange}
                    />
                    <button
                      type="button"
                      className="im-group-settings-profile__avatar-action"
                      aria-label="修改群头像"
                      disabled={isAvatarSaving}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {isAvatarSaving ? '上传中' : '更换头像'}
                    </button>
                  </>
                ) : null}
              </div>

              <div className="im-group-settings-profile__main">
                <div className="im-group-settings-profile__name">{groupName}</div>
                <div className="im-group-settings-profile__meta">成员 {memberNum} 人</div>
              </div>
            </div>
          </section>

          <section className="im-group-settings-card">
            <button
              type="button"
              className="im-group-settings-section-head"
              aria-label="查看群成员"
              onClick={onOpenMembers}
            >
              <span className="im-group-settings-section-head__label">群成员</span>
              <span className="im-group-settings-section-head__value">{memberNum}</span>
            </button>

            <div className="im-group-settings-members-preview">
              {previewMembers.map((member) => (
                <button
                  key={member.userID}
                  type="button"
                  className="im-group-settings-members-preview__item"
                  aria-label={`查看${member.nick || member.userID}`}
                  onClick={onOpenMembers}
                >
                  <Avatar
                    url={member.avatar || undefined}
                    name={member.nick || member.userID}
                    size={42}
                    className="im-group-settings-members-preview__avatar"
                  />
                </button>
              ))}

              <button
                type="button"
                className="im-group-settings-members-preview__add"
                aria-label="添加成员"
                onClick={onOpenMembers}
              >
                <PlusIcon />
              </button>
            </div>
          </section>

          <section className="im-group-settings-card im-group-settings-card--rows">
            <button
              type="button"
              className="im-group-settings-row"
              aria-label="编辑群名称"
              onClick={() => openEditDialog('group-name')}
            >
              <span className="im-group-settings-row__label">群名称</span>
              <span className="im-group-settings-row__value">
                <span className="im-group-settings-row__value-text">{groupName}</span>
                <ChevronRightIcon />
              </span>
            </button>

            <button
              type="button"
              className="im-group-settings-row"
              aria-label="编辑群昵称"
              onClick={() => openEditDialog('group-name-card')}
            >
              <span className="im-group-settings-row__label">群昵称</span>
              <span className="im-group-settings-row__value">
                <span className="im-group-settings-row__value-text">
                  {currentNameCard || '未设置'}
                </span>
                <ChevronRightIcon />
              </span>
            </button>

            <label className="im-group-settings-row im-group-settings-row--switch">
              <span className="im-group-settings-row__label">消息免打扰</span>
              <span className="im-group-settings-row__value">
                <input
                  type="checkbox"
                  className="im-group-settings-switch-input"
                  aria-label="消息免打扰"
                  checked={muted}
                  disabled={isMuteSaving}
                  onChange={handleMuteChange}
                />
                <span className="im-group-settings-switch" aria-hidden="true" />
              </span>
            </label>
          </section>
        </div>

        {activeEditTarget ? (
          <div className="im-group-edit-dialog-backdrop" onClick={closeEditDialog}>
            <div
              className="im-group-edit-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="im-group-edit-dialog__title">{resolveEditTitle(activeEditTarget)}</div>
              <input
                value={draftValue}
                className="im-group-edit-dialog__input"
                aria-label={activeEditTarget === 'group-name' ? '群名称输入框' : '群昵称输入框'}
                placeholder={activeEditTarget === 'group-name' ? '请输入群名称' : '请输入群昵称'}
                onChange={(event) => setDraftValue(event.target.value)}
              />
              <div className="im-group-edit-dialog__actions">
                <button
                  type="button"
                  className="im-group-edit-dialog__action is-secondary"
                  aria-label="取消编辑"
                  onClick={closeEditDialog}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="im-group-edit-dialog__action is-primary"
                  aria-label={activeEditTarget === 'group-name' ? '保存群名称' : '保存群昵称'}
                  disabled={!canSubmitEdit || savingTarget === activeEditTarget}
                  onClick={() => {
                    void handleSaveEdit();
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GroupSettingsSheet;
