import { describe, it, expect } from 'vitest';
import { toEpochMs, toDate, toBigInt, toInt } from '../src/services/offerIngestion.js';

describe('offerIngestion normalization helpers', () => {
  describe('toEpochMs', () => {
    it('returns null for null/undefined', () => {
      expect(toEpochMs(null)).toBeNull();
      expect(toEpochMs(undefined)).toBeNull();
    });

    it('converts seconds to ms when value < 1e11', () => {
      expect(toEpochMs(1_700_000_000)).toBe(1_700_000_000_000);
    });

    it('keeps milliseconds untouched when value is already ms', () => {
      expect(toEpochMs(1_700_000_000_000)).toBe(1_700_000_000_000);
    });

    it('converts microseconds (>1e14) to ms', () => {
      expect(toEpochMs(1_700_000_000_000_000)).toBe(1_700_000_000_000);
    });

    it('parses numeric strings', () => {
      expect(toEpochMs('1700000000000')).toBe(1_700_000_000_000);
    });

    it('returns null for non-finite values', () => {
      expect(toEpochMs('not-a-number')).toBeNull();
      expect(toEpochMs(NaN)).toBeNull();
    });
  });

  describe('toDate', () => {
    it('returns a Date when value is valid', () => {
      const d = toDate(1_700_000_000);
      expect(d).toBeInstanceOf(Date);
      expect(d?.getTime()).toBe(1_700_000_000_000);
    });

    it('returns null on invalid input', () => {
      expect(toDate(null)).toBeNull();
      expect(toDate('xyz')).toBeNull();
    });
  });

  describe('toBigInt', () => {
    it('returns BigInt for numbers', () => {
      expect(toBigInt(42)).toBe(42n);
    });

    it('truncates fractional parts', () => {
      expect(toBigInt(42.9)).toBe(42n);
    });

    it('returns null for invalid input', () => {
      expect(toBigInt(null)).toBeNull();
      expect(toBigInt('abc')).toBeNull();
    });
  });

  describe('toInt', () => {
    it('truncates a finite number to an integer', () => {
      expect(toInt(3.7)).toBe(3);
    });

    it('returns null for nullish or non-finite values', () => {
      expect(toInt(null)).toBeNull();
      expect(toInt(undefined)).toBeNull();
      expect(toInt(Infinity)).toBeNull();
    });
  });
});
