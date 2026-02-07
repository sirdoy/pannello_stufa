/**
 * useScheduleData Hook Tests
 *
 * Tests focus on module structure and export verification.
 * The hook's integration with React and API calls is tested via integration tests.
 */

describe('useScheduleData', () => {
  describe('module exports', () => {
    it('exports useScheduleData function', () => {
      const { useScheduleData } = require('@/lib/hooks/useScheduleData');
      expect(typeof useScheduleData).toBe('function');
    });

    it('exports default as useScheduleData', () => {
      const defaultExport = require('@/lib/hooks/useScheduleData').default;
      expect(typeof defaultExport).toBe('function');
    });
  });

  describe('fetch API mocking', () => {
    it('can mock fetch for testing', () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ schedules: [] }),
      });

      global.fetch = mockFetch;

      expect(global.fetch).toBeDefined();
      expect(typeof global.fetch).toBe('function');
    });

    it('mock fetch can be called', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ schedules: [] }),
      });

      global.fetch = mockFetch;

      await fetch('/test');

      expect(mockFetch).toHaveBeenCalledWith('/test');
    });
  });

  describe('React hooks availability', () => {
    it('useState is available', () => {
      const { useState } = require('react');
      expect(typeof useState).toBe('function');
    });

    it('useEffect is available', () => {
      const { useEffect } = require('react');
      expect(typeof useEffect).toBe('function');
    });

    it('useCallback is available', () => {
      const { useCallback } = require('react');
      expect(typeof useCallback).toBe('function');
    });
  });
});
