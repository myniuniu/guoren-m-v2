export interface GroupAvatarPreset {
  id: string;
  label: string;
  url: string;
}

export type GroupCreateMode = 'group' | 'community';

const WORK_PRESETS: GroupAvatarPreset[] = [
  {
    id: 'work-1',
    label: '工作群头像 1',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=work-1&backgroundColor=b6e3f4',
  },
  {
    id: 'work-2',
    label: '工作群头像 2',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=work-2&backgroundColor=c0aede',
  },
  {
    id: 'work-3',
    label: '工作群头像 3',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=work-3&backgroundColor=d1d4f9',
  },
];

const COMMUNITY_PRESETS: GroupAvatarPreset[] = [
  {
    id: 'community-1',
    label: '社群头像 1',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=community-1&backgroundColor=ffd5dc',
  },
  {
    id: 'community-2',
    label: '社群头像 2',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=community-2&backgroundColor=ffdfbf',
  },
  {
    id: 'community-3',
    label: '社群头像 3',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=community-3&backgroundColor=fde68a',
  },
];

export function getGroupAvatarPresets(mode: GroupCreateMode): GroupAvatarPreset[] {
  return mode === 'community' ? COMMUNITY_PRESETS : WORK_PRESETS;
}

export function getDefaultGroupAvatar(mode: GroupCreateMode): string {
  return getGroupAvatarPresets(mode)[0]?.url || '';
}
