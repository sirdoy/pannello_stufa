/**
 * @jest-environment node
 */

import {
  estimatePelletConsumption,
  BASE_CONSUMPTION_RATES,
  DEFAULT_PELLET_COST_PER_KG,
} from '../pelletEstimationService';

describe('pelletEstimationService', () => {
  describe('BASE_CONSUMPTION_RATES', () => {
    it('exports consumption rates for all power levels', () => {
      expect(BASE_CONSUMPTION_RATES).toEqual({
        1: 0.6,
        2: 0.9,
        3: 1.2,
        4: 1.6,
        5: 2.0,
      });
    });
  });

  describe('DEFAULT_PELLET_COST_PER_KG', () => {
    it('exports default cost per kg', () => {
      expect(DEFAULT_PELLET_COST_PER_KG).toBe(0.5);
    });
  });

  describe('estimatePelletConsumption', () => {
    describe('basic calculations', () => {
      it('calculates consumption for single power level', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 3, hours: 2 },
        ]);

        expect(result.totalKg).toBe(2.4);
        expect(result.costEstimate).toBe(1.2);
        expect(result.dailyAverage).toBe(2.4);
        expect(result.byPowerLevel).toEqual({
          3: { hours: 2, kg: 2.4 },
        });
      });

      it('calculates consumption for multiple power levels', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 1, hours: 3 },
          { powerLevel: 5, hours: 1 },
        ]);

        expect(result.totalKg).toBe(3.8);
        expect(result.costEstimate).toBe(1.9);
        expect(result.dailyAverage).toBe(1.9);
        expect(result.byPowerLevel).toEqual({
          1: { hours: 3, kg: 1.8 },
          5: { hours: 1, kg: 2.0 },
        });
      });
    });

    describe('calibration factor', () => {
      it('applies calibration factor to consumption', () => {
        const result = estimatePelletConsumption(
          [{ powerLevel: 3, hours: 2 }],
          0.8
        );

        expect(result.totalKg).toBe(1.92);
        expect(result.costEstimate).toBe(0.96);
      });

      it('defaults calibration factor to 1.0', () => {
        const withoutCalibration = estimatePelletConsumption([
          { powerLevel: 3, hours: 2 },
        ]);
        const withDefaultCalibration = estimatePelletConsumption(
          [{ powerLevel: 3, hours: 2 }],
          1.0
        );

        expect(withoutCalibration.totalKg).toBe(withDefaultCalibration.totalKg);
      });

      it('applies calibration factor greater than 1', () => {
        const result = estimatePelletConsumption(
          [{ powerLevel: 3, hours: 2 }],
          1.2
        );

        expect(result.totalKg).toBe(2.88);
      });
    });

    describe('custom cost per kg', () => {
      it('uses custom cost per kg when provided', () => {
        const result = estimatePelletConsumption(
          [{ powerLevel: 3, hours: 1 }],
          1.0,
          0.7
        );

        expect(result.totalKg).toBe(1.2);
        expect(result.costEstimate).toBe(0.84);
      });

      it('defaults to DEFAULT_PELLET_COST_PER_KG', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 3, hours: 1 },
        ]);

        expect(result.costEstimate).toBe(0.6);
      });
    });

    describe('unknown power levels', () => {
      it('falls back to medium rate (1.2 kg/h) for unknown power level', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 6, hours: 2 },
        ]);

        expect(result.totalKg).toBe(2.4); // 1.2 * 2
        expect(result.byPowerLevel).toEqual({
          6: { hours: 2, kg: 2.4 },
        });
      });

      it('falls back for power level 0', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 0, hours: 1 },
        ]);

        expect(result.totalKg).toBe(1.2);
      });
    });

    describe('edge cases', () => {
      it('handles empty array', () => {
        const result = estimatePelletConsumption([]);

        expect(result.totalKg).toBe(0);
        expect(result.costEstimate).toBe(0);
        expect(result.dailyAverage).toBe(0);
        expect(result.byPowerLevel).toEqual({});
      });

      it('handles zero hours', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 3, hours: 0 },
        ]);

        expect(result.totalKg).toBe(0);
        expect(result.costEstimate).toBe(0);
      });

      it('rounds all numbers to 2 decimal places', () => {
        const result = estimatePelletConsumption(
          [{ powerLevel: 3, hours: 1.333 }],
          0.777
        );

        // 1.2 * 1.333 * 0.777 = 1.242... → 1.24
        expect(result.totalKg).toBe(1.24);
        expect(result.costEstimate).toBe(0.62); // 1.24 * 0.5
      });
    });

    describe('daily average calculation', () => {
      it('calculates daily average for single day', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 3, hours: 5 },
        ]);

        expect(result.dailyAverage).toBe(6.0);
      });

      it('calculates daily average for multiple days', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 3, hours: 5 },
          { powerLevel: 2, hours: 3 },
          { powerLevel: 4, hours: 2 },
        ]);

        // Total: (1.2*5) + (0.9*3) + (1.6*2) = 6 + 2.7 + 3.2 = 11.9
        // Daily average: 11.9 / 3 = 3.97
        expect(result.totalKg).toBe(11.9);
        expect(result.dailyAverage).toBe(3.97);
      });

      it('returns 0 for empty array to guard against NaN', () => {
        const result = estimatePelletConsumption([]);

        expect(result.dailyAverage).toBe(0);
        expect(Number.isNaN(result.dailyAverage)).toBe(false);
      });
    });

    describe('byPowerLevel breakdown', () => {
      it('aggregates multiple entries for same power level', () => {
        const result = estimatePelletConsumption([
          { powerLevel: 3, hours: 2 },
          { powerLevel: 3, hours: 3 },
          { powerLevel: 5, hours: 1 },
        ]);

        expect(result.byPowerLevel).toEqual({
          3: { hours: 5, kg: 6.0 },
          5: { hours: 1, kg: 2.0 },
        });
      });

      it('applies calibration factor to breakdown', () => {
        const result = estimatePelletConsumption(
          [
            { powerLevel: 1, hours: 2 },
            { powerLevel: 3, hours: 1 },
          ],
          0.8
        );

        expect(result.byPowerLevel).toEqual({
          1: { hours: 2, kg: 0.96 }, // 0.6 * 2 * 0.8
          3: { hours: 1, kg: 0.96 }, // 1.2 * 1 * 0.8
        });
      });
    });
  });
});
