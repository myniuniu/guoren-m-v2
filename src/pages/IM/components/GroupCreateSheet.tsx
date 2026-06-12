import React, { useEffect, useMemo, useState } from 'react';
import TencentCloudChat from '@tencentcloud/lite-chat';
import type { OrgUserItem } from '../../../services/aiOrgMembers';
import { getChatInstance } from '../hooks/useIMLogin';
import type { MergedConversation } from '../hooks/useConversationList';
import type { GroupCreateMode } from '../utils/groupAvatarPresets';
import Avatar from './Avatar';
import ContactPickerSheet from './ContactPickerSheet';

interface GroupCreateSheetProps {
  visible: boolean;
  mode: GroupCreateMode;
  onClose: () => void;
  onConversationCreated?: (conversation: MergedConversation) => void;
}

function buildDefaultGroupName(mode: GroupCreateMode, users: OrgUserItem[]) {
  const baseName = users.map((user) => user.realname).join('、');
  if (!baseName) {
    return mode === 'community' ? '新建社群' : '新建群聊';
  }
  return baseName.length > 18 ? `${baseName.slice(0, 18)}...` : baseName;
}

function getCurrentUserID(): string {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return String(userInfo?.id || '').trim();
  } catch {
    return '';
  }
}

const GroupCreateSheet: React.FC<GroupCreateSheetProps> = ({
  visible,
  mode,
  onClose,
  onConversationCreated,
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<OrgUserItem[]>([]);
  const currentUserID = getCurrentUserID();
  const displaySelectedCount = selectedUsers.length + (currentUserID ? 1 : 0);

  useEffect(() => {
    if (!visible) {
      setGroupName('');
      setSelectedUsers([]);
    }
  }, [visible]);

  const sheetTitle = mode === 'community' ? '创建社群' : '创建群聊';
  const nameLabel = mode === 'community' ? '社群名称' : '群聊名称';
  const trimmedGroupName = groupName.trim();
  const createDisabled = selectedUsers.length === 0 || !trimmedGroupName;
  const previewName = useMemo(() => {
    return groupName.trim() || buildDefaultGroupName(mode, selectedUsers);
  }, [groupName, mode, selectedUsers]);

  const handleConfirm = async (users: OrgUserItem[]) => {
    if (users.length === 0 || !trimmedGroupName) {
      return;
    }

    try {
      const chat = getChatInstance();
      if (!chat) {
        throw new Error('IM 未连接');
      }

      const nextName = trimmedGroupName;
      const createResult = await chat.createGroup({
        name: nextName,
        type: mode === 'community' ? TencentCloudChat.TYPES.GRP_COMMUNITY : TencentCloudChat.TYPES.GRP_WORK,
        memberList: users.map((user) => ({ userID: user.id })),
      });

      const group = createResult?.data?.group || {};
      const groupID = String(group.groupID || '');
      const conversationID = `GROUP${groupID}`;

      if (groupID) {
        await chat.getConversationProfile(conversationID);
      }

      onConversationCreated?.({
        conversation_id: conversationID,
        type: mode === 'community' ? 'community' : 'group',
        title: nextName,
        avatar: null,
        last_msg_preview: '',
        last_msg_time: null,
        last_msg_from: null,
        pinned: false,
        muted: false,
        order_seq: Date.now(),
        unread_count: 0,
        last_read_msg_time: null,
      });

      onClose();
    } catch (error) {
      console.error('[IM][GroupCreate] create group failed', {
        mode,
        groupName,
        selectedUserIDs: users.map((user) => user.id),
        error,
      });
    }
  };

  return (
    <ContactPickerSheet
      visible={visible}
      title={sheetTitle}
      selectedUsers={selectedUsers}
      multiple
      confirmText={sheetTitle}
      searchPlaceholder="搜索联系人、部门"
      hideFooter
      centerTitle
      disabledUserIDs={currentUserID ? [currentUserID] : []}
      disabledActionText="已添加"
      headerAction={{
        label: '创建',
        disabled: createDisabled,
        onClick: () => {
          void handleConfirm(selectedUsers);
        },
      }}
      onClose={onClose}
      onSelectedUsersChange={setSelectedUsers}
      onConfirm={handleConfirm}
    >
      <div className="im-group-create-config">
        <label className="im-group-create-field">
          <span className="im-group-create-field__label">
            <span>{nameLabel}</span>
            <span className="im-group-create-field__required" aria-hidden="true">*</span>
          </span>
          <input
            type="text"
            className="im-group-create-field__input"
            aria-label={nameLabel}
            aria-required="true"
            placeholder={mode === 'community' ? '给社群起个名字' : '给群聊起个名字'}
            required
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
          />
        </label>

        <div className="im-group-create-preview">
          <Avatar
            name={previewName}
            size={68}
            variant="group"
            className="im-group-create-preview__avatar"
          />
          <div className="im-group-create-preview__meta">
            <div className="im-group-create-preview__name">{previewName}</div>
            <div className="im-group-create-preview__count">已选 {displaySelectedCount} 人</div>
          </div>
        </div>

        <div className="im-group-create-section-title">选择联系人</div>
      </div>
    </ContactPickerSheet>
  );
};

export default GroupCreateSheet;
