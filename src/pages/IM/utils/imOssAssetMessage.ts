/**
 * 文件/视频消息 payload 构建/解析
 * businessID: im_oss_asset
 * 文件/视频走 OSS 上传后以 CustomMessage 发送
 */

export const IM_OSS_ASSET_BUSINESS_ID = 'im_oss_asset';

export type ImOssAssetType = 'file' | 'video';

export interface ParsedImOssAssetMessage {
  assetType: ImOssAssetType;
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  snapshotUrl?: string;
  snapshotWidth?: number;
  snapshotHeight?: number;
}

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

/** 推断 assetType */
function resolveAssetType(data: Record<string, any>): ImOssAssetType {
  const rawAssetType = String(data?.assetType || '').trim().toLowerCase();
  if (rawAssetType === 'video') return 'video';
  if (rawAssetType === 'file') return 'file';

  const mimeType = String(data?.mimeType || '').trim().toLowerCase();
  if (mimeType.startsWith('video/')) return 'video';

  return 'file';
}

/** 解析文件/视频消息 */
export function parseImOssAssetMessage(
  message: Record<string, any>,
): ParsedImOssAssetMessage | null {
  if (String(message?.type || '') !== 'TIMCustomElem') return null;

  const data = parsePayloadData(message);
  if (!data) return null;

  const businessID = String(data.businessID || '').trim();
  const type = String(data.type || '').trim();
  if (businessID !== IM_OSS_ASSET_BUSINESS_ID && type !== IM_OSS_ASSET_BUSINESS_ID) {
    return null;
  }

  const url = String(data.url || '').trim();
  if (!url) return null;

  const fileName = String(data.fileName || data.filename || '').trim();

  return {
    assetType: resolveAssetType(data),
    url,
    fileName: fileName || '附件',
    mimeType: String(data.mimeType || '').trim() || undefined,
    size: isFinitePositiveNumber(data.size) ? data.size : undefined,
    snapshotUrl: String(data.snapshotUrl || '').trim() || undefined,
    snapshotWidth: isFinitePositiveNumber(data.snapshotWidth) ? data.snapshotWidth : undefined,
    snapshotHeight: isFinitePositiveNumber(data.snapshotHeight) ? data.snapshotHeight : undefined,
  };
}

/** 获取文件/视频消息摘要文本 */
export function resolveImOssAssetPreviewText(message: Record<string, any>): string {
  const parsed = parseImOssAssetMessage(message);
  if (!parsed) return '';
  return parsed.assetType === 'video' ? '[视频]' : '[文件]';
}

export interface BuildImOssAssetMessageInput {
  assetType: ImOssAssetType;
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  snapshotUrl?: string;
  snapshotWidth?: number;
  snapshotHeight?: number;
}

/** 构建文件/视频消息 payload */
export function buildImOssAssetMessagePayload(
  input: BuildImOssAssetMessageInput,
): CustomMessagePayloadLike {
  const data: Record<string, unknown> = {
    businessID: IM_OSS_ASSET_BUSINESS_ID,
    type: IM_OSS_ASSET_BUSINESS_ID,
    assetType: input.assetType,
    url: String(input.url || '').trim(),
    fileName: String(input.fileName || '').trim(),
  };

  if (input.mimeType) data.mimeType = String(input.mimeType).trim();
  if (isFinitePositiveNumber(input.size)) data.size = input.size;
  if (input.snapshotUrl) data.snapshotUrl = String(input.snapshotUrl).trim();
  if (isFinitePositiveNumber(input.snapshotWidth)) data.snapshotWidth = input.snapshotWidth;
  if (isFinitePositiveNumber(input.snapshotHeight)) data.snapshotHeight = input.snapshotHeight;

  return {
    data: JSON.stringify(data),
    description: input.assetType === 'video' ? '[视频]' : '[文件]',
    extension: IM_OSS_ASSET_BUSINESS_ID,
  };
}