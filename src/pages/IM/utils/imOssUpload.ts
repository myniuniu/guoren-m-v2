/**
 * OSS 预签名上传工具
 * 图片/文件/视频先上传到阿里云 OSS，获取永久 URL 后再以 CustomMessage 发送
 *
 * 预签名请求走 jeecg-boot Java 服务
 * bucket 选择通过 env 配置
 */

import { requestOssSignUrl } from '../api/messagingApi';

const OSS_BUCKET_OTHER = import.meta.env.VITE_OSS_BUCKET_OTHER || 'guoren-files-hb-test';
const OSS_BUCKET_VIDEO = import.meta.env.VITE_OSS_BUCKET_VIDEO || 'guoren-vod-hb-test';

export type ImOssUploadAssetType = 'file' | 'video';

export interface UploadImOssAssetInput {
  conversationID: string;
  assetType: ImOssUploadAssetType;
  file: File;
  onProgress?: (percent: number) => void;
}

export interface UploadImOssAssetResult {
  url: string;
  bucketName: string;
  objectKey: string;
}

/** 从文件名提取扩展名 */
function pickExt(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx < 0 || idx === fileName.length - 1) return 'bin';
  return fileName.slice(idx + 1).toLowerCase();
}

/** 随机片段 */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** 根据 assetType 选择 bucket */
function resolveBucketName(assetType: ImOssUploadAssetType): string {
  return assetType === 'video' ? OSS_BUCKET_VIDEO : OSS_BUCKET_OTHER;
}

/** 构造 objectKey */
export function buildImOssAssetObjectKey(
  conversationID: string,
  assetType: ImOssUploadAssetType,
  file: File,
): string {
  const safeConversationID = encodeURIComponent(String(conversationID || '').trim() || 'default');
  const ext = pickExt(file.name || '');
  const folder = assetType === 'video' ? 'video' : 'other';
  return `im-assets/${folder}/${safeConversationID}/${Date.now()}_${randomSuffix()}.${ext}`;
}

/** PUT 文件到 OSS，支持进度回调 */
function putFileToOss(
  signedUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`上传失败(HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('上传网络错误'));
    xhr.send(file);
  });
}

/** IM 附件上传入口 */
export async function uploadImAssetToOss(
  input: UploadImOssAssetInput,
): Promise<UploadImOssAssetResult> {
  const bucket = resolveBucketName(input.assetType);
  const objectKey = buildImOssAssetObjectKey(input.conversationID, input.assetType, input.file);
  const contentType = input.file.type || 'application/octet-stream';

  // 调用 messagingApi 中统一的预签名请求
  const signedUrl = await requestOssSignUrl(bucket, objectKey, contentType);
  await putFileToOss(signedUrl, input.file, contentType, input.onProgress);

  // 永久 URL = 签名 URL 去掉查询参数
  return {
    url: signedUrl.split('?')[0],
    bucketName: bucket,
    objectKey,
  };
}