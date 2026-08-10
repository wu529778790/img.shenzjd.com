/**
 * File-type utilities centralized so every layer (upload, listing, rendering,
 * link generation) shares one source of truth for "what kind of file is this".
 *
 * Framework-free on purpose — importable by both unit tests and client components.
 */

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'other';

const EXT_MAP: Record<FileCategory, string[]> = {
  image: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.bmp', '.ico', '.tif', '.tiff', '.avif',
  ],
  video: [
    '.mp4', '.mov', '.webm', '.mkv', '.avi', '.ogv', '.m4v',
  ],
  audio: [
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.oga',
  ],
  document: [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.md', '.csv', '.epub',
  ],
  other: [],
};

/** Flat lookup built once from EXT_MAP. */
const LOOKUP: Record<string, FileCategory> = {};
for (const [cat, exts] of Object.entries(EXT_MAP) as [FileCategory, string[]][]) {
  for (const ext of exts) {
    LOOKUP[ext] = cat;
  }
}

/** Lowercased extension including the leading dot, or '' if none. */
export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.toLowerCase().slice(dot) : '';
}

export function getFileCategory(fileName: string): FileCategory {
  const ext = getExtension(fileName);
  return ext ? (LOOKUP[ext] ?? 'other') : 'other';
}

export const isImage = (name: string): boolean => getFileCategory(name) === 'image';
export const isVideo = (name: string): boolean => getFileCategory(name) === 'video';
export const isAudio = (name: string): boolean => getFileCategory(name) === 'audio';
export const isDocument = (name: string): boolean => getFileCategory(name) === 'document';

/**
 * 该文件是否应转换为 WebP 格式。
 *
 * 排除项（即使开启"转换为 WebP"也不转换）：
 * - .svg — 矢量图：转 WebP 会被 Canvas 光栅化，输出分辨率固定（无显式宽高时
 *   常为 0 或 300×150），放大必模糊；且会被填成白色背景，丢失透明
 * - .gif — 动图：Canvas 只能截取第一帧，动画会丢失
 * - .webp — 已是 WebP，无需再转
 */
export function shouldConvertToWebp(fileName: string): boolean {
  const ext = getExtension(fileName);
  return !['.svg', '.gif', '.webp'].includes(ext);
}

export function isPreviewable(name: string): boolean {
  const c = getFileCategory(name);
  return c === 'image' || c === 'video' || c === 'audio' || c === 'document';
}

/**
 * 允许展示的文件扩展名（内置白名单，过滤掉 dotfiles / 非媒体文件）。
 * 图片、视频、音频、文档 / 压缩包直接支持，无需用户配置。
 */
export const ALLOWED_EXTENSIONS: readonly string[] = [
  // 图片
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif',
  // 视频
  '.mp4', '.mov', '.webm', '.mkv', '.avi', '.ogv', '.m4v',
  // 音频
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.oga',
  // 文档 / 压缩包
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv', '.epub',
  '.zip', '.rar', '.7z', '.tar', '.gz',
]

/** 扩展名 → 标准 MIME，用于 react-dropzone 的 accept 映射。 */
export const MIME_BY_EXT: Readonly<Record<string, string>> = {
  // 文档
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.epub': 'application/epub+zip',
  // 压缩包
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
}

/** True when the file's extension is in the allowed list (case-insensitive). */
export function matchesAllowedExtensions(fileName: string, allowed: readonly string[]): boolean {
  const ext = getExtension(fileName);
  if (!ext) return false;
  const lower = new Set(allowed.map((e) => e.toLowerCase()));
  return lower.has(ext);
}
