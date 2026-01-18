import { describe, it, expect } from 'vitest';
import { validateDomain, validateLimit } from '../../../src/popup/utils/validation';

describe('validation', () => {
  describe('validateDomain', () => {
    it('should validate a simple domain', () => {
      expect(validateDomain('example.com')).toBe(true);
    });

    it('should validate a domain with subdomain', () => {
      expect(validateDomain('www.example.com')).toBe(true);
    });

    it('should validate a domain with multiple subdomains', () => {
      expect(validateDomain('subdomain.example.com')).toBe(true);
    });

    it('should validate a domain with www prefix', () => {
      expect(validateDomain('www.youtube.com')).toBe(true);
    });

    it('should reject invalid domain format', () => {
      expect(validateDomain('not-a-domain')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateDomain('')).toBe(false);
    });

    it('should reject domain without TLD', () => {
      expect(validateDomain('example')).toBe(false);
    });

    it('should validate domain with hyphens', () => {
      expect(validateDomain('example-site.com')).toBe(true);
    });
  });

  describe('validateLimit', () => {
    it('should validate a positive number', () => {
      expect(validateLimit('60')).toBe(true);
    });

    it('should validate a single digit', () => {
      expect(validateLimit('1')).toBe(true);
    });

    it('should validate a large number', () => {
      expect(validateLimit('9999')).toBe(true);
    });

    it('should reject zero', () => {
      expect(validateLimit('0')).toBe(false);
    });

    it('should reject negative number', () => {
      expect(validateLimit('-10')).toBe(false);
    });

    it('should reject non-numeric string', () => {
      expect(validateLimit('abc')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateLimit('')).toBe(false);
    });

    it('should reject decimal number', () => {
      expect(validateLimit('60.5')).toBe(false);
    });
  });
});
