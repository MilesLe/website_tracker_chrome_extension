import { describe, it, expect } from 'vitest';
import { getFaviconUrl, getDomainInitial } from '../../../src/popup/utils/favicon';

describe('favicon utilities', () => {
  describe('getFaviconUrl', () => {
    it('should generate correct Google Favicon API URL', () => {
      const url = getFaviconUrl('example.com');
      expect(url).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32');
    });

    it('should use custom size when provided', () => {
      const url = getFaviconUrl('example.com', 64);
      expect(url).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=64');
    });

    it('should encode domain name properly', () => {
      const url = getFaviconUrl('example.com');
      expect(url).toContain('domain=example.com');
    });
  });

  describe('getDomainInitial', () => {
    it('should return first letter of domain in uppercase', () => {
      expect(getDomainInitial('example.com')).toBe('E');
      expect(getDomainInitial('youtube.com')).toBe('Y');
    });

    it('should handle domains with www prefix', () => {
      expect(getDomainInitial('www.example.com')).toBe('E');
    });

    it('should handle domains with protocol', () => {
      expect(getDomainInitial('https://example.com')).toBe('E');
      expect(getDomainInitial('http://www.example.com')).toBe('E');
    });

    it('should handle empty string', () => {
      expect(getDomainInitial('')).toBe('?');
    });

    it('should handle single character domain', () => {
      expect(getDomainInitial('a.com')).toBe('A');
    });
  });
});
