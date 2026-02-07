/**
 * Web Share Service Tests
 */

import {
  isShareSupported,
  share,
  shareStoveStatus,
  shareThermostatStatus,
  shareApp,
} from '../webShare';

describe('webShare', () => {
  describe('isShareSupported', () => {
    it('returns boolean', () => {
      const result = isShareSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('share', () => {
    beforeEach(() => {
      // Mock navigator.share
      navigator.share = jest.fn().mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calls navigator.share with data', async () => {
      const data = { title: 'Test', text: 'Hello' };
      await share(data);
      expect(navigator.share).toHaveBeenCalledWith(data);
    });

    it('returns true on success', async () => {
      const result = await share({ title: 'Test' });
      expect(result).toBe(true);
    });

    it('returns false when share is aborted', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      navigator.share = jest.fn().mockRejectedValue(abortError);

      const result = await share({ title: 'Test' });
      expect(result).toBe(false);
    });
  });

  describe('shareStoveStatus', () => {
    beforeEach(() => {
      navigator.share = jest.fn().mockResolvedValue(undefined);
    });

    it('formats stove status correctly', async () => {
      await shareStoveStatus({
        status: 'on',
        temperature: 21,
        power: 3,
      });

      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Stufa'),
          text: expect.stringContaining('Accesa'),
        })
      );
    });

    it('handles off status', async () => {
      await shareStoveStatus({
        status: 'off',
        temperature: 18,
      });

      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Spenta'),
        })
      );
    });
  });

  describe('shareThermostatStatus', () => {
    beforeEach(() => {
      navigator.share = jest.fn().mockResolvedValue(undefined);
    });

    it('formats thermostat status correctly', async () => {
      await shareThermostatStatus({
        temperature: 20,
        setpoint: 21,
        humidity: 45,
      });

      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Termostato'),
          text: expect.stringContaining('20°C'),
        })
      );
    });
  });

  describe('shareApp', () => {
    beforeEach(() => {
      navigator.share = jest.fn().mockResolvedValue(undefined);
    });

    it('shares app info', async () => {
      await shareApp();

      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Pannello Stufa',
        })
      );
    });
  });
});
