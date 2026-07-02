import { describe, it, expect } from 'vitest';
import { generateLink } from './link';

const baseOptions = {
  owner: 'testuser',
  repo: 'test-repo',
  branch: 'main',
  path: 'images/photo.jpg',
  fileName: 'photo.jpg',
};

describe('generateLink', () => {
  describe('GitHub CDN', () => {
    it('should generate raw GitHub URL with WebP format by default', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'github',
        format: 'url',
      });
      expect(result).toBe(
        'https://raw.githubusercontent.com/testuser/test-repo/main/images/photo.jpg?format=webp'
      );
    });

    it('should generate GitHub blob URL when useRaw is false', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'github',
        format: 'url',
        useRaw: false,
      });
      expect(result).toBe(
        'https://github.com/testuser/test-repo/blob/main/images/photo.jpg'
      );
    });
  });

  describe('jsDelivr CDN', () => {
    it('should generate correct jsDelivr URL', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdelivr',
        format: 'url',
      });
      expect(result).toBe(
        'https://cdn.jsdelivr.net/gh/testuser/test-repo@main/images/photo.jpg'
      );
    });
  });

  describe('jsDMirror CDN (default)', () => {
    it('should generate correct jsdmirror URL', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'url',
      });
      expect(result).toBe(
        'https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg'
      );
    });
  });

  describe('GitHub Pages CDN', () => {
    it('should generate correct GitHub Pages URL', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'github-pages',
        format: 'url',
      });
      expect(result).toBe(
        'https://testuser.github.io/test-repo/images/photo.jpg'
      );
    });
  });

  describe('Statically CDN', () => {
    it('should generate correct statically URL', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'statically',
        format: 'url',
      });
      expect(result).toBe(
        'https://cdn.statically.io/gh/testuser/test-repo/main/images/photo.jpg'
      );
    });
  });

  describe('jsd-onmicrosoft CDN', () => {
    it('should generate correct onmicrosoft URL', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsd-onmicrosoft',
        format: 'url',
      });
      expect(result).toBe(
        'https://jsd.onmicrosoft.cn/gh/testuser/test-repo@main/images/photo.jpg'
      );
    });
  });

  describe('GitMirror CDN', () => {
    it('should generate correct gitmirror URL', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'gitmirror',
        format: 'url',
      });
      expect(result).toBe(
        'https://raw.gitmirror.com/testuser/test-repo/main/images/photo.jpg'
      );
    });
  });

  describe('GhProxy CDN', () => {
    it('should generate correct ghproxy URL', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'ghproxy',
        format: 'url',
      });
      expect(result).toBe(
        'https://ghproxy.com/https://raw.githubusercontent.com/testuser/test-repo/main/images/photo.jpg'
      );
    });
  });

  describe('Link formats', () => {
    it('should generate Markdown format', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'markdown',
      });
      expect(result).toBe(
        '![photo.jpg](https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg)'
      );
    });

    it('should generate HTML format', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'html',
      });
      expect(result).toBe(
        '<img src="https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg" alt="photo.jpg" />'
      );
    });

    it('should generate BBCode format', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'bbcode',
      });
      expect(result).toBe(
        '[img]https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg[/img]'
      );
    });

    it('should generate plain URL format', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'url',
      });
      expect(result).toBe(
        'https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg'
      );
    });
  });

  describe('Non-image files (category !== "image")', () => {
    it('should not append ?format=webp for documents on github CDN', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'github',
        format: 'url',
        category: 'document',
      });
      expect(result).toBe(
        'https://raw.githubusercontent.com/testuser/test-repo/main/images/photo.jpg'
      );
    });

    it('should not append ?format=webp for videos on github CDN', () => {
      const result = generateLink({
        ...baseOptions,
        path: 'videos/clip.mp4',
        fileName: 'clip.mp4',
        cdn: 'github',
        format: 'url',
        category: 'video',
      });
      expect(result).not.toContain('?format=webp');
    });

    it('should emit markdown anchor (no !) for non-images', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'markdown',
        category: 'video',
      });
      expect(result).toBe(
        '[photo.jpg](https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg)'
      );
    });

    it('should emit <a> tag for non-image HTML format', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'html',
        category: 'document',
      });
      expect(result).toBe(
        '<a href="https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg" target="_blank" rel="noopener noreferrer">photo.jpg</a>'
      );
    });

    it('should emit [url=…]..[/url] for non-image BBCode format', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'jsdmirror',
        format: 'bbcode',
        category: 'audio',
      });
      expect(result).toBe(
        '[url=https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/photo.jpg]photo.jpg[/url]'
      );
    });

    it('should treat missing category as image (backward compat)', () => {
      const result = generateLink({
        ...baseOptions,
        cdn: 'github',
        format: 'url',
        // category intentionally omitted
      });
      expect(result).toContain('?format=webp');
    });
  });

describe('Edge cases', () => {
    it('should handle path with query parameters by cleaning them', () => {
      const result = generateLink({
        ...baseOptions,
        path: 'images/photo.jpg?format=webp',
        cdn: 'github',
        format: 'url',
      });
      // Should not duplicate ?format=webp
      expect(result).toBe(
        'https://raw.githubusercontent.com/testuser/test-repo/main/images/photo.jpg?format=webp'
      );
    });

    it('should handle special characters in path', () => {
      const result = generateLink({
        ...baseOptions,
        path: 'images/my photo (1).jpg',
        cdn: 'jsdmirror',
        format: 'url',
      });
      expect(result).toBe(
        'https://cdn.jsdmirror.com/gh/testuser/test-repo@main/images/my photo (1).jpg'
      );
    });

    it('should throw error for unsupported CDN', () => {
      expect(() =>
        generateLink({
          ...baseOptions,
          cdn: 'unsupported-cdn' as never,
          format: 'url',
        })
      ).toThrow('Unsupported CDN: unsupported-cdn');
    });
  });
});
