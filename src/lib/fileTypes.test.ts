import { describe, it, expect } from 'vitest';
import {
  getFileCategory,
  getExtension,
  isImage,
  isVideo,
  isAudio,
  isDocument,
  isPreviewable,
  matchesAllowedExtensions,
} from './fileTypes';

describe('getExtension', () => {
  it('lowercases and keeps the dot', () => {
    expect(getExtension('photo.JPG')).toBe('.jpg');
    expect(getExtension('VID.MP4')).toBe('.mp4');
  });
  it('returns empty string when no extension', () => {
    expect(getExtension('README')).toBe('');
    expect(getExtension('.gitignore')).toBe(''); // leading dot only → no ext
  });
});

describe('getFileCategory', () => {
  it.each([
    ['.jpg', 'image'],
    ['.jpeg', 'image'],
    ['.png', 'image'],
    ['.gif', 'image'],
    ['.webp', 'image'],
    ['.svg', 'image'],
    ['.bmp', 'image'],
    ['.ico', 'image'],
    ['.avif', 'image'],
    ['.mp4', 'video'],
    ['.mov', 'video'],
    ['.webm', 'video'],
    ['.mkv', 'video'],
    ['.mp3', 'audio'],
    ['.wav', 'audio'],
    ['.flac', 'audio'],
    ['.pdf', 'document'],
    ['.doc', 'document'],
    ['.docx', 'document'],
    ['.xlsx', 'document'],
    ['.pptx', 'document'],
    ['.txt', 'document'],
    ['.md', 'document'],
  ])('maps %s → %s', (ext, expected) => {
    expect(getFileCategory(`file${ext}`)).toBe(expected);
  });

  it('returns "other" for unknown extensions', () => {
    expect(getFileCategory('file.zip')).toBe('other');
    expect(getFileCategory('file.exe')).toBe('other');
  });

  it('returns "other" for no-extension files', () => {
    expect(getFileCategory('README')).toBe('other');
  });
});

describe('category predicates', () => {
  it('classifies correctly', () => {
    expect(isImage('photo.jpg')).toBe(true);
    expect(isVideo('clip.mp4')).toBe(true);
    expect(isAudio('song.mp3')).toBe(true);
    expect(isDocument('doc.pdf')).toBe(true);
    expect(isPreviewable('photo.jpg')).toBe(true);
    expect(isPreviewable('clip.mp4')).toBe(true);
    expect(isPreviewable('song.mp3')).toBe(true);
    expect(isPreviewable('doc.pdf')).toBe(true);
    expect(isPreviewable('bundle.zip')).toBe(false);
  });
});

describe('matchesAllowedExtensions', () => {
  const allowed = ['.jpg', '.png', '.pdf'];

  it('matches case-insensitively', () => {
    expect(matchesAllowedExtensions('A.JPG', allowed)).toBe(true);
    expect(matchesAllowedExtensions('a.Png', allowed)).toBe(true);
  });
  it('rejects non-matching', () => {
    expect(matchesAllowedExtensions('a.mp4', allowed)).toBe(false);
    expect(matchesAllowedExtensions('README', allowed)).toBe(false);
  });
});
