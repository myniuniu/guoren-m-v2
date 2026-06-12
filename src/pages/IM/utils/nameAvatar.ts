export type NameAvatarVariant = 'person' | 'group';

function normalizeName(value: string): string {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
}

export function buildNameAvatarLines(name: string, variant: NameAvatarVariant = 'person'): string[] {
  const normalizedName = normalizeName(name);

  if (!normalizedName) {
    return ['?'];
  }

  if (variant === 'group') {
    const previewText = normalizedName.slice(0, 4);
    return [previewText.slice(0, 2), previewText.slice(2, 4)].filter(Boolean);
  }

  return [normalizedName.slice(0, 1)];
}
