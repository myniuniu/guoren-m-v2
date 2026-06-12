import React from 'react';
import type { GroupMemberState } from '../hooks/useGroupMembers';

interface GroupMemberActionSheetProps {
  visible: boolean;
  member: GroupMemberState | null;
  onClose: () => void;
  onConfirmRemove: (member: GroupMemberState) => void;
}

const GroupMemberActionSheet: React.FC<GroupMemberActionSheetProps> = ({
  visible,
  member,
  onClose,
  onConfirmRemove,
}) => {
  if (!visible || !member) {
    return null;
  }

  return (
    <div className="im-sheet-overlay" onClick={onClose}>
      <div className="im-sheet-panel" onClick={(event) => event.stopPropagation()}>
        <div className="im-sheet-header">
          <div className="im-sheet-title">成员操作</div>
          <button type="button" className="im-sheet-close" aria-label="关闭成员操作" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="im-sheet-body">
          <div className="im-sheet-status">你可以对 {member.nick} 执行移除操作。</div>
          <button type="button" className="im-sheet-danger" onClick={() => onConfirmRemove(member)}>
            移除成员
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMemberActionSheet;
