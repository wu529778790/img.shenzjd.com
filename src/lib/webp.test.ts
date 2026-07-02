import { describe, it, expect } from 'vitest';
import { getWebPUrl } from './webp';

describe('getWebPUrl', () => {
  describe('GitHub Raw URLs', () => {
    it('should append ?format=webp to plain GitHub Raw URL', () => {
      const url = 'https://raw.githubusercontent.com/user/repo/main/image.jpg';
      expect(getWebPUrl(url)).toBe(
        'https://raw.githubusercontent.com/user/repo/main/image.jpg?format=webp'
      );
    });

    it('should append &format=webp to URL with existing query params', () => {
      const url = 'https://raw.githubusercontent.com/user/repo/main/image.jpg?foo=bar';
      expect(getWebPUrl(url)).toBe(
        'https://raw.githubusercontent.com/user/repo/main/image.jpg?foo=bar&format=webp'
      );
    });

    it('should handle GitHub Raw PNG URLs', () => {
      const url = 'https://raw.githubusercontent.com/user/repo/main/photo.png';
      expect(getWebPUrl(url)).toBe(
        'https://raw.githubusercontent.com/user/repo/main/photo.png?format=webp'
      );
    });

    it('should handle nested paths in GitHub Raw URL', () => {
      const url = 'https://raw.githubusercontent.com/user/repo/main/images/2024/photo.jpg';
      expect(getWebPUrl(url)).toBe(
        'https://raw.githubusercontent.com/user/repo/main/images/2024/photo.jpg?format=webp'
      );
    });
  });

  describe('Non-image files (isImage = false)', () => {
    it('should return url unchanged for mp4 GitHub Raw', () => {
      const url = 'https://raw.githubusercontent.com/user/repo/main/clip.mp4';
      expect(getWebPUrl(url, false)).toBe(url);
    });

    it('should return url unchanged for pdf GitHub Raw', () => {
      const url = 'https://raw.githubusercontent.com/user/repo/main/report.pdf';
      expect(getWebPUrl(url, false)).toBe(url);
    });

    it('should add ?format=webp to ghproxy only when isImage=true', () => {
      const url = 'https://ghproxy.com/https://raw.githubusercontent.com/user/repo/main/image.jpg';
      expect(getWebPUrl(url, true)).toBe(`${url}?format=webp`);
      expect(getWebPUrl(url, false)).toBe(url);
    });
  });

  describe('Non-GitHub CDN URLs (should NOT modify)', () => {
    it('should not modify jsDelivr URLs', () => {
      const url = 'https://cdn.jsdelivr.net/gh/user/repo@main/image.jpg';
      expect(getWebPUrl(url)).toBe(url);
    });

    it('should not modify jsdmirror URLs', () => {
      const url = 'https://cdn.jsdmirror.com/gh/user/repo@main/image.jpg';
      expect(getWebPUrl(url)).toBe(url);
    });

    it('should not modify GitHub Pages URLs', () => {
      const url = 'https://user.github.io/repo/image.jpg';
      expect(getWebPUrl(url)).toBe(url);
    });

    it('should not modify statically URLs', () => {
      const url = 'https://cdn.statically.io/gh/user/repo/main/image.jpg';
      expect(getWebPUrl(url)).toBe(url);
    });

    it('should not modify gitmirror URLs', () => {
      const url = 'https://raw.gitmirror.com/user/repo/main/image.jpg';
      expect(getWebPUrl(url)).toBe(url);
    });

    it('should add WebP format to ghproxy URLs (proxies GitHub Raw)', () => {
      const url = 'https://ghproxy.com/https://raw.githubusercontent.com/user/repo/main/image.jpg';
      // ghproxy 代理 GitHub Raw，所以也支持动态 WebP 转换
      expect(getWebPUrl(url)).toBe(url + '?format=webp');
    });

    it('should not modify onmicrosoft URLs', () => {
      const url = 'https://jsd.onmicrosoft.cn/gh/user/repo@main/image.jpg';
      expect(getWebPUrl(url)).toBe(url);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(getWebPUrl('')).toBe('');
    });

    it('should handle URL with only query string', () => {
      expect(getWebPUrl('?test=1')).toBe('?test=1');
    });

    it('should handle GitHub Raw URL with branch named "raw"', () => {
      // 确保只检测 hostname，不是 path
      const url = 'https://raw.githubusercontent.com/user/repo/raw/image.jpg';
      expect(getWebPUrl(url)).toBe(
        'https://raw.githubusercontent.com/user/repo/raw/image.jpg?format=webp'
      );
    });
  });
});
