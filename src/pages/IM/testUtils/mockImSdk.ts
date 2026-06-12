import { vi } from 'vitest';

export interface MockImChatInstance {
  getConversationProfile: ReturnType<typeof vi.fn>
  createGroup: ReturnType<typeof vi.fn>
  getGroupProfile: ReturnType<typeof vi.fn>
  getGroupMemberList: ReturnType<typeof vi.fn>
  addGroupMember: ReturnType<typeof vi.fn>
  deleteGroupMember: ReturnType<typeof vi.fn>
}

export function createMockImChat(): MockImChatInstance {
  return {
    getConversationProfile: vi.fn().mockResolvedValue({ data: {} }),
    createGroup: vi.fn().mockResolvedValue({
      data: {
        group: {
          groupID: '@TGS#group_1',
          type: 'GRP_WORK',
          name: '默认群聊',
        },
      },
    }),
    getGroupProfile: vi.fn().mockResolvedValue({
      data: {
        group: {
          groupID: '@TGS#group_1',
          name: '默认群聊',
          memberNum: 2,
        },
      },
    }),
    getGroupMemberList: vi.fn().mockResolvedValue({
      data: {
        memberList: [],
      },
    }),
    addGroupMember: vi.fn().mockResolvedValue({
      data: {
        successUserIDList: [],
        failureUserIDList: [],
      },
    }),
    deleteGroupMember: vi.fn().mockResolvedValue({
      data: {
        successUserIDList: [],
        failureUserIDList: [],
      },
    }),
  };
}
