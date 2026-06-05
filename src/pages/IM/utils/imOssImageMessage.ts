/**
 * 图片消息 payload 构建/解析
 * businessID: im_oss_image
 * 图片走 OSS 上传后以 CustomMessage 发送
 */

export const IM_OSS_IMAGE_BUSINESS_ID = 'im_oss_image';

export interface ImOssImageMessageData {
  businessID: typeof IM_OSS_IMAGE_BUSINESS_ID;
  type: typeof IM_OSS_IMAGE_BUSINESS_ID;
  url: string;
  fileName: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface BuildImOssImageMessageInput {
  url: string;
  fileName: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface ParsedImOssImageMessage extends BuildImOssImageMessageInput {}

interface CustomMessagePayloadLike {
  data: string;
  description: string;
  extension: string;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function parsePayloadData(message: Record<string, any>): Record<string, any> | null {
  const rawData = message?.payload?.data;
  if (!rawData) return null;

  try {
    return typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  } catch {
    return null;
  }
}

/** 构建图片消息 payload */
export function buildImOssImageMessagePayload(
  input: BuildImOssImageMessageInput,
): CustomMessagePayloadLike {
  const data: ImOssImageMessageData = {
    businessID: IM_OSS_IMAGE_BUSINESS_ID,
    type: IM_OSS_IMAGE_BUSINESS_ID,
    url: String(input.url || '').trim(),
    fileName: String(input.fileName || '').trim(),
    ...(isFinitePositiveNumber(input.width) ? { width: input.width } : {}),
    ...(isFinitePositiveNumber(input.height) ? { height: input.height } : {}),
    ...(isFinitePositiveNumber(input.size) ? { size: input.size } : {}),
  };

  return {
    data: JSON.stringify(data),
    description: '[图片]',
    extension: IM_OSS_IMAGE_BUSINESS_ID,
  };
}

/** 解析图片消息 */
export function parseImOssImageMessage(
  message: Record<string, any>,
): ParsedImOssImageMessage | null {
  if (String(message?.type || '') !== 'TIMCustomElem') return null;

  const data = parsePayloadData(message);
  if (!data) return null;

  const businessID = String(data.businessID || '').trim();
  const type = String(data.type || '').trim();
  if (businessID !== IM_OSS_IMAGE_BUSINESS_ID && type !== IM_OSS_IMAGE_BUSINESS_ID) {
    return null;
  }

  const url = String(data.url || '').trim();
  const fileName = String(data.fileName || '').trim();
  if (!url) return null;

  return {
    url,
    fileName: fileName || 'image',
    width: isFinitePositiveNumber(data.width) ? data.width : undefined,
    height: isFinitePositiveNumber(data.height) ? data.height : undefined,
    size: isFinitePositiveNumber(data.size) ? data.size : undefined,
  };
}

/** 获取图片消息摘要文本 */
export function resolveImOssImagePreviewText(message: Record<string, any>): string {
  return parseImOssImageMessage(message) ? '[图片]' : '';
}