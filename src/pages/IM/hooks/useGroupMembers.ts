import { useCallback, useEffect, useMemo, useState } from 'react';
import { getChatInstance } from './useIMLogin';

export interface GroupProfileState {
  groupID: string;
  name: string;
  avatar: string | null;
  memberNum: number;
}

export interface GroupMemberState {
  userID: string;
  nick: string;
  nameCard: string;
  avatar: string | null;
  role: 'Owner' | 'Admin' | 'Member' | string;
}

export type GroupMembersStatus = 'idle' | 'loading' | 'success' | 'error';

const ROLE_PRIORITY: Record<string, number> = {
  Owner: 3,
  Admin: 2,
  Member: 1,
};

function normalizeCount(value: unknown): number | null {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) {
    return null;
  }
  return count;
}

function resolveGroupMemberCount(profileRaw: any, memberRaw: any): number {
  const profileGroup = profileRaw?.data?.group || profileRaw?.data || profileRaw?.group || profileRaw || {};
  const profileCount = normalizeCount(
    profileGroup.memberNum ?? profileGroup.memberCount ?? profileGroup.member_count,
  );
  if (profileCount !== null) {
    return profileCount;
  }

  const memberData = memberRaw?.data || memberRaw || {};
  const memberCount = normalizeCount(
    memberData.totalMemberCount ?? memberData.memberNum ?? memberData.memberCount ?? memberData.member_count,
  );
  if (memberCount !== null) {
    return memberCount;
  }

  return 0;
}

function normalizeGroupProfile(raw: any, groupID: string, memberNum: number): GroupProfileState {
  const group = raw?.data?.group || raw?.data || raw?.group || raw || {};

  return {
    groupID: String(group.groupID || group.groupId || groupID || ''),
    name: String(group.name || group.groupName || groupID || ''),
    avatar: typeof group.avatar === 'string' && group.avatar ? group.avatar : null,
    memberNum,
  };
}

function normalizeGroupMembers(raw: any): GroupMemberState[] {
  const memberList = raw?.data?.memberList || raw?.memberList || [];

  return memberList
    .map((member: any) => ({
      userID: String(member.userID || member.userId || ''),
      nick: String(member.nick || member.name || member.userID || member.userId || ''),
      nameCard: String(member.nameCard || ''),
      avatar: typeof member.avatar === 'string' && member.avatar ? member.avatar : null,
      role: String(member.role || 'Member'),
    }))
    .filter((member: GroupMemberState) => Boolean(member.userID))
    .sort((left: GroupMemberState, right: GroupMemberState) => {
      return (ROLE_PRIORITY[right.role] || 0) - (ROLE_PRIORITY[left.role] || 0);
    });
}

export function useGroupMembers(groupID: string | null) {
  const [status, setStatus] = useState<GroupMembersStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [groupProfile, setGroupProfile] = useState<GroupProfileState | null>(null);
  const [members, setMembers] = useState<GroupMemberState[]>([]);

  const refresh = useCallback(async () => {
    if (!groupID) {
      setStatus('idle');
      setGroupProfile(null);
      setMembers([]);
      setError(null);
      return;
    }

    const chat = getChatInstance();
    if (!chat) {
      setStatus('error');
      setError('IM 未连接');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const [profileResult, memberResult] = await Promise.all([
        chat.getGroupProfile({ groupID }),
        chat.getGroupMemberList({ groupID, count: 100, offset: 0 }),
      ]);

      const memberNum = resolveGroupMemberCount(profileResult, memberResult);
      setGroupProfile(normalizeGroupProfile(profileResult, groupID, memberNum));
      setMembers(normalizeGroupMembers(memberResult));
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '群成员加载失败');
    }
  }, [groupID]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addMembers = useCallback(async (userIDList: string[]) => {
    if (!groupID || userIDList.length === 0) return;
    const chat = getChatInstance();
    if (!chat) {
      throw new Error('IM 未连接');
    }

    // 群成员变更依赖 SDK 实时能力，操作完成后统一刷新一次本地状态。
    await chat.addGroupMember({ groupID, userIDList });
    await refresh();
  }, [groupID, refresh]);

  const removeMembers = useCallback(async (userIDList: string[]) => {
    if (!groupID || userIDList.length === 0) return;
    const chat = getChatInstance();
    if (!chat) {
      throw new Error('IM 未连接');
    }

    // 群成员删除后需要重新拉一次群资料，避免顶部人数和成员列表不一致。
    await chat.deleteGroupMember({ groupID, userIDList });
    await refresh();
  }, [groupID, refresh]);

  const currentUserRole = useMemo(() => {
    const chat = getChatInstance();
    const currentUserID = chat?.getLoginUser?.();
    return members.find((member) => member.userID === currentUserID)?.role || 'Member';
  }, [members]);

  const currentMember = useMemo(() => {
    const chat = getChatInstance();
    const currentUserID = chat?.getLoginUser?.();
    return members.find((member) => member.userID === currentUserID) || null;
  }, [members]);

  const updateGroupProfile = useCallback(async (updates: {
    name?: string;
    avatar?: string;
    introduction?: string;
    notification?: string;
  }) => {
    if (!groupID) {
      throw new Error('群组不存在');
    }
    const chat = getChatInstance();
    if (!chat) {
      throw new Error('IM 未连接');
    }

    // 群资料更新后重新拉一次资料，保证顶部名称、头像和成员数一致。
    await chat.updateGroupProfile({
      groupID,
      ...updates,
    });
    await refresh();
  }, [groupID, refresh]);

  const updateSelfNameCard = useCallback(async (nameCard: string) => {
    if (!groupID) {
      throw new Error('群组不存在');
    }
    const chat = getChatInstance();
    if (!chat) {
      throw new Error('IM 未连接');
    }
    const currentUserID = chat.getLoginUser?.();
    if (!currentUserID) {
      throw new Error('当前用户未登录');
    }

    // 群昵称属于当前成员资料，更新后需要重新拉成员列表，避免设置页和成员页显示不一致。
    await chat.setGroupMemberNameCard({
      groupID,
      userID: currentUserID,
      nameCard,
    });
    await refresh();
  }, [groupID, refresh]);

  return {
    status,
    error,
    groupProfile,
    members,
    currentUserRole,
    currentMember,
    refresh,
    addMembers,
    removeMembers,
    updateGroupProfile,
    updateSelfNameCard,
  };
}
