import { describe, it, expect } from 'vitest';
import {
  IMAGE_GRID_CONFIG,
  BULK_DELETE_CONFIG,
  SEARCH_CONFIG,
  DIRECTORY_CONFIG,
  navLinks,
  socialLinks,
} from './constants';

describe('IMAGE_GRID_CONFIG', () => {
  it('should have valid initial load count', () => {
    expect(IMAGE_GRID_CONFIG.INITIAL_LOAD_COUNT).toBeGreaterThan(0);
    expect(IMAGE_GRID_CONFIG.INITIAL_LOAD_COUNT).toBe(8);
  });

  it('should have valid batch size', () => {
    expect(IMAGE_GRID_CONFIG.BATCH_SIZE).toBeGreaterThan(0);
    expect(IMAGE_GRID_CONFIG.BATCH_SIZE).toBe(8);
  });

  it('should have matching breakpoints with Tailwind defaults', () => {
    expect(IMAGE_GRID_CONFIG.BREAKPOINTS.sm).toBe(640);
    expect(IMAGE_GRID_CONFIG.BREAKPOINTS.md).toBe(768);
    expect(IMAGE_GRID_CONFIG.BREAKPOINTS.lg).toBe(1024);
    expect(IMAGE_GRID_CONFIG.BREAKPOINTS.xl).toBe(1280);
  });

  it('should have increasing column counts for wider screens', () => {
    const { COLUMNS } = IMAGE_GRID_CONFIG;
    expect(COLUMNS.mobile).toBeLessThan(COLUMNS.desktop);
    expect(COLUMNS.desktop).toBeLessThan(COLUMNS.wide);
  });

  it('should have valid preview config', () => {
    expect(IMAGE_GRID_CONFIG.PREVIEW.MAX_IMAGES).toBeGreaterThan(0);
    expect(IMAGE_GRID_CONFIG.PREVIEW.MAX_IMAGES).toBe(100);
  });
});

describe('BULK_DELETE_CONFIG', () => {
  it('should have small batch size to avoid rate limiting', () => {
    expect(BULK_DELETE_CONFIG.BATCH_SIZE).toBeGreaterThan(0);
    expect(BULK_DELETE_CONFIG.BATCH_SIZE).toBeLessThanOrEqual(5);
    expect(BULK_DELETE_CONFIG.BATCH_SIZE).toBe(3);
  });

  it('should have reasonable delay between batches', () => {
    expect(BULK_DELETE_CONFIG.BATCH_DELAY_MS).toBeGreaterThanOrEqual(300);
    expect(BULK_DELETE_CONFIG.BATCH_DELAY_MS).toBeLessThanOrEqual(2000);
    expect(BULK_DELETE_CONFIG.BATCH_DELAY_MS).toBe(500);
  });
});

describe('SEARCH_CONFIG', () => {
  it('should have reasonable debounce time', () => {
    expect(SEARCH_CONFIG.DEBOUNCE_MS).toBeGreaterThanOrEqual(100);
    expect(SEARCH_CONFIG.DEBOUNCE_MS).toBeLessThanOrEqual(500);
    expect(SEARCH_CONFIG.DEBOUNCE_MS).toBe(200);
  });
});

describe('DIRECTORY_CONFIG', () => {
  it('should have reasonable directory limits', () => {
    expect(DIRECTORY_CONFIG.MAX_DIRECTORIES).toBeGreaterThan(10);
    expect(DIRECTORY_CONFIG.MAX_DIRECTORIES).toBe(50);
  });
});

describe('navLinks', () => {
  it('should have valid link structure', () => {
    navLinks.forEach((link) => {
      expect(link).toHaveProperty('name');
      expect(link).toHaveProperty('href');
      expect(link.href).toMatch(/^https?:\/\//);
    });
  });

  it('should include self link', () => {
    const selfLink = navLinks.find((l) => l.href.includes('img.shenzjd.com'));
    expect(selfLink).toBeDefined();
  });

  it('should have unique hrefs', () => {
    const hrefs = navLinks.map((l) => l.href);
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });
});

describe('socialLinks', () => {
  it('should have valid social link structure', () => {
    socialLinks.forEach((link) => {
      expect(link).toHaveProperty('name');
      expect(link).toHaveProperty('href');
      expect(link).toHaveProperty('icon');
      expect(link.href).toMatch(/^https?:\/\//);
    });
  });

  it('should include GitHub link', () => {
    const github = socialLinks.find((l) => l.icon === 'github');
    expect(github).toBeDefined();
    expect(github?.href).toContain('github.com');
  });
});
