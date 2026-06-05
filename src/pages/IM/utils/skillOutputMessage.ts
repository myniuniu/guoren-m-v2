/**
 * 技能输出消息解析
 */

export type SkillOutputCardType = 'image' | 'file' | 'classroom' | 'review' | 'unknown';

export interface SkillOutputCardItem {
  skillName: string;
  type: SkillOutputCardType;
  filename: string;
  url: string;
  size?: number;
  isHtmlLike: boolean;
  isMarkdownLike: boolean;
}

export interface SkillOutputMessageParseResult {
  isSkillOutput: boolean;
  chatbotPlugin: number | null;
  src: number | null;
  items: SkillOutputCardItem[];
}

function parseSkillOutputPayloadData(message: Record<string, any>): Record<string, any> | null {
  const payloadData = message?.payload?.data;
  if (!payloadData) return null;

  try {
    return typeof payloadData === 'string' ? JSON.parse(payloadData) : payloadData;
  } catch {
    return null;
  }
}

export function truncateSkillOutputFilename(filename: string, maxLength: number = 24): string {
  const normalizedFilename = String(filename || '');
  if (normalizedFilename.length <= maxLength) return normalizedFilename;
  if (maxLength <= 4) return normalizedFilename.slice(0, maxLength);
  return `${normalizedFilename.slice(0, maxLength - 4)}....`;
}

export function resolveSkillOutputPreviewText(message: Record<string, any>): string {
  const data = parseSkillOutputPayloadData(message);
  const rawItems = Array.isArray(data?.skillOutputs) ? data.skillOutputs : [];

  const items = rawItems
    .map((item: any) => {
      const filename = String(item?.filename || '').trim();
      const type = normalizeSkillOutputType(item?.type);
      if (!filename) return null;
      return { filename, type };
    })
    .filter((item): item is { filename: string; type: SkillOutputCardType } => item !== null);

  if (items.length === 0) return '';

  if (items.length === 1) {
    const [item] = items;
    const typeLabel = item.type === 'image'
      ? '图片'
      : item.type === 'classroom'
        ? '课堂任务'
        : item.type === 'review'
          ? '评课报告'
          : '文件';
    return `[${typeLabel}] ${truncateSkillOutputFilename(item.filename)}`;
  }

  const firstType = items[0]?.type;
  const sameType = items.every((item) => item.type === firstType);
  if (sameType && firstType) {
    const typeLabel = firstType === 'image'
      ? '图片'
      : firstType === 'classroom'
        ? '课堂任务'
        : firstType === 'review'
          ? '评课报告'
          : '文件';
    return `[${typeLabel}] ${items.length} 项结果`;
  }

  return `[技能输出] ${items.length} 项结果`;
}

export function resolveSkillOutputNotificationText(message: Record<string, any>): string {
  // 转发后的 RBT 技能产物发送人会变成当前用户，不能再依赖 @RBT#message 判断。
  // 只要 payload 结构里有通知文本，就继续按技能产物卡片展示。
  const data = parseSkillOutputPayloadData(message);
  if (!data) return '';

  const rawText = data?.noticefaction_text ?? data?.notification_text ?? data?.notificationText ?? '';
  const notificationText = String(rawText || '').trim();
  if (!notificationText) return '';
  if (notificationText.startsWith('[通知]')) return notificationText;
  return `[通知] ${notificationText}`;
}

function normalizeSkillOutputType(rawType: unknown): SkillOutputCardType {
  if (rawType === 'image') return 'image';
  if (rawType === 'file') return 'file';
  if (rawType === 'classroom') return 'classroom';
  if (rawType === 'review') return 'review';
  return 'unknown';
}

function isHtmlLikeFilename(filename: string): boolean {
  return /\.(html?|HTML?)$/.test(filename);
}

function isMarkdownLikeFilename(filename: string): boolean {
  return /\.(md|markdown|MD|MARKDOWN)$/.test(filename);
}

export function parseSkillOutputMessage(message: Record<string, any>): SkillOutputMessageParseResult {
  const fallback: SkillOutputMessageParseResult = {
    isSkillOutput: false,
    chatbotPlugin: null,
    src: null,
    items: [],
  };

  if (String(message?.type || '') !== 'TIMCustomElem') return fallback;

  const payload = message?.payload;
  if (!payload?.data) return fallback;

  try {
    const data = typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data;
    const rawItems = Array.isArray(data?.skillOutputs) ? data.skillOutputs : [];
    const items = rawItems
      .map((item: any): SkillOutputCardItem | null => {
        const filename = String(item?.filename || '').trim();
        const url = String(item?.url || '').trim();
        if (!filename || !url) return null;

        return {
          skillName: String(item?.skill_name || ''),
          type: normalizeSkillOutputType(item?.type),
          filename,
          url,
          size: typeof item?.size === 'number' ? item.size : undefined,
          isHtmlLike: isHtmlLikeFilename(filename),
          isMarkdownLike: isMarkdownLikeFilename(filename),
        };
      })
      .filter((item): item is SkillOutputCardItem => item !== null);

    if (items.length === 0) {
      return {
        isSkillOutput: false,
        chatbotPlugin: typeof data?.chatbotPlugin === 'number' ? data.chatbotPlugin : null,
        src: typeof data?.src === 'number' ? data.src : null,
        items: [],
      };
    }

    return {
      isSkillOutput: true,
      chatbotPlugin: typeof data?.chatbotPlugin === 'number' ? data.chatbotPlugin : null,
      src: typeof data?.src === 'number' ? data.src : null,
      items,
    };
  } catch {
    return fallback;
  }
}

export function resolveSkillOutputOpenMode(
  item: Pick<SkillOutputCardItem, 'type' | 'filename' | 'url' | 'skillName'>,
): 'split-preview' | 'new-tab' | 'unsupported' {
  if (!String(item?.url || '').trim()) return 'unsupported';
  if (item.type === 'classroom') return 'new-tab';
  if (item.type === 'image') return 'split-preview';
  if (item.type === 'file') return 'split-preview';
  return 'unsupported';
}
