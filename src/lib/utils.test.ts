import { describe, it, expect } from 'vitest';
import { formatFileSize, cn } from './utils';

describe('formatFileSize', () => {
  it('should return "0 Bytes" for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes correctly', () => {
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(1023)).toBe('1023 Bytes');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 10)).toBe('10 KB');
    expect(formatFileSize(1024 * 100)).toBe('100 KB');
    expect(formatFileSize(1024 * 1023)).toBe('1023 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    expect(formatFileSize(1024 * 1024 * 10)).toBe('10 MB');
    expect(formatFileSize(1024 * 1024 * 100)).toBe('100 MB');
    expect(formatFileSize(1024 * 1024 * 5.25)).toBe('5.25 MB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
  });

  it('should round to 2 decimal places', () => {
    expect(formatFileSize(1024 + 103)).toBe('1.1 KB'); // 1127 bytes ≈ 1.1 KB
    expect(formatFileSize(1024 * 1024 + 1024 * 100)).toBe('1.1 MB');
  });

  it('should handle common image file sizes', () => {
    // 常见图片大小
    expect(formatFileSize(50 * 1024)).toBe('50 KB');       // 50 KB 缩略图
    expect(formatFileSize(200 * 1024)).toBe('200 KB');     // 200 KB 小图
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB'); // 1.5 MB 普通照片
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');   // 5 MB 高清照片
  });
});

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar')).toBe('foo');
    expect(cn('foo', true && 'bar')).toBe('foo bar');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined)).toBe('foo');
    expect(cn('foo', null)).toBe('foo');
    expect(cn(undefined, null)).toBe('');
  });

  it('should deduplicate Tailwind classes (last wins)', () => {
    // tailwind-merge 会合并冲突的 Tailwind 类
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('mt-2', 'mt-4')).toBe('mt-4');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['foo'], ['bar', 'baz'])).toBe('foo bar baz');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true }, { bar: true })).toBe('foo bar');
  });

  it('should handle mixed inputs', () => {
    expect(cn('base', { conditional: true }, undefined, 'final')).toBe('base conditional final');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn('', '')).toBe('');
  });
});
