import { describe, it, expect } from 'vitest';
import {
  minutesToHoursMinutes,
  formatMinutes,
  parseTimeString,
  formatTimeRange,
} from '../../../src/popup/utils/timeFormat';

describe('timeFormat utilities', () => {
  describe('minutesToHoursMinutes', () => {
    it('should convert minutes to hours and minutes', () => {
      expect(minutesToHoursMinutes(0)).toEqual({ hours: 0, minutes: 0 });
      expect(minutesToHoursMinutes(30)).toEqual({ hours: 0, minutes: 30 });
      expect(minutesToHoursMinutes(60)).toEqual({ hours: 1, minutes: 0 });
      expect(minutesToHoursMinutes(90)).toEqual({ hours: 1, minutes: 30 });
      expect(minutesToHoursMinutes(150)).toEqual({ hours: 2, minutes: 30 });
      expect(minutesToHoursMinutes(1440)).toEqual({ hours: 24, minutes: 0 });
    });

    it('should round minutes correctly', () => {
      expect(minutesToHoursMinutes(30.7)).toEqual({ hours: 0, minutes: 31 });
      expect(minutesToHoursMinutes(90.3)).toEqual({ hours: 1, minutes: 30 });
    });
  });

  describe('formatMinutes', () => {
    it('should format minutes only', () => {
      expect(formatMinutes(0)).toBe('0m');
      expect(formatMinutes(30)).toBe('30m');
      expect(formatMinutes(59)).toBe('59m');
    });

    it('should format hours only', () => {
      expect(formatMinutes(60)).toBe('1h');
      expect(formatMinutes(120)).toBe('2h');
      expect(formatMinutes(180)).toBe('3h');
    });

    it('should format hours and minutes', () => {
      expect(formatMinutes(90)).toBe('1h 30m');
      expect(formatMinutes(150)).toBe('2h 30m');
      expect(formatMinutes(125)).toBe('2h 5m');
    });
  });

  describe('parseTimeString', () => {
    it('should parse plain number as minutes', () => {
      expect(parseTimeString('0')).toBeNull();
      expect(parseTimeString('30')).toBe(30);
      expect(parseTimeString('60')).toBe(60);
      expect(parseTimeString('150')).toBe(150);
    });

    it('should parse hours only format', () => {
      expect(parseTimeString('2h')).toBe(120);
      expect(parseTimeString('1h')).toBe(60);
      expect(parseTimeString('0h')).toBeNull();
    });

    it('should parse minutes only format', () => {
      expect(parseTimeString('30m')).toBe(30);
      expect(parseTimeString('0m')).toBeNull();
      expect(parseTimeString('59m')).toBe(59);
    });

    it('should parse hours and minutes format', () => {
      expect(parseTimeString('2h 30m')).toBe(150);
      expect(parseTimeString('1h 30m')).toBe(90);
      expect(parseTimeString('2h30m')).toBe(150);
      expect(parseTimeString('1h 5m')).toBe(65);
    });

    it('should handle case insensitive input', () => {
      expect(parseTimeString('2H 30M')).toBe(150);
      expect(parseTimeString('2H')).toBe(120);
      expect(parseTimeString('30M')).toBe(30);
    });

    it('should reject invalid formats', () => {
      expect(parseTimeString('')).toBeNull();
      expect(parseTimeString('abc')).toBeNull();
      expect(parseTimeString('h')).toBeNull();
      expect(parseTimeString('m')).toBeNull();
      expect(parseTimeString('2h 70m')).toBeNull(); // minutes >= 60
      expect(parseTimeString('2h 60m')).toBeNull(); // minutes >= 60
      expect(parseTimeString('-5m')).toBeNull();
      expect(parseTimeString('2.5h')).toBeNull();
    });

    it('should handle whitespace', () => {
      expect(parseTimeString('  2h 30m  ')).toBe(150);
      expect(parseTimeString('2h  30m')).toBe(150);
    });
  });

  describe('formatTimeRange', () => {
    it('should format time range correctly', () => {
      expect(formatTimeRange(30, 60)).toBe('30m / 1h');
      expect(formatTimeRange(90, 120)).toBe('1h 30m / 2h');
      expect(formatTimeRange(150, 180)).toBe('2h 30m / 3h');
      expect(formatTimeRange(0, 60)).toBe('0m / 1h');
    });
  });
});
