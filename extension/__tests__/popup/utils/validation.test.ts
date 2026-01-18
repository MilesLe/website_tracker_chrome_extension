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
    it('should validate a positive number (minutes)', () => {
      expect(validateLimit('60')).toBe(true);
      expect(validateLimit('1')).toBe(true);
      expect(validateLimit('9999')).toBe(true);
    });

    it('should validate hours only format', () => {
      expect(validateLimit('2h')).toBe(true);
      expect(validateLimit('1h')).toBe(true);
      expect(validateLimit('24h')).toBe(true);
    });

    it('should validate minutes only format', () => {
      expect(validateLimit('30m')).toBe(true);
      expect(validateLimit('1m')).toBe(true);
      expect(validateLimit('59m')).toBe(true);
    });

    it('should validate hours and minutes format', () => {
      expect(validateLimit('2h 30m')).toBe(true);
      expect(validateLimit('1h 30m')).toBe(true);
      expect(validateLimit('2h30m')).toBe(true);
      expect(validateLimit('1h 5m')).toBe(true);
    });

    it('should handle case insensitive input', () => {
      expect(validateLimit('2H 30M')).toBe(true);
      expect(validateLimit('2H')).toBe(true);
      expect(validateLimit('30M')).toBe(true);
    });

    it('should reject zero', () => {
      expect(validateLimit('0')).toBe(false);
      expect(validateLimit('0h')).toBe(false);
      expect(validateLimit('0m')).toBe(false);
    });

    it('should reject invalid formats', () => {
      expect(validateLimit('')).toBe(false);
      expect(validateLimit('abc')).toBe(false);
      expect(validateLimit('h')).toBe(false);
      expect(validateLimit('m')).toBe(false);
      expect(validateLimit('2h 70m')).toBe(false); // minutes >= 60
      expect(validateLimit('2h 60m')).toBe(false); // minutes >= 60
      expect(validateLimit('-5m')).toBe(false);
      expect(validateLimit('2.5h')).toBe(false);
    });
  });
});
