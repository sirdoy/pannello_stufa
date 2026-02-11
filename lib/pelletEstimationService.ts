/**
 * Pellet Consumption Estimation Service
 *
 * Calculates estimated pellet usage (kg) based on stove power level and runtime hours.
 * Includes user calibration factor to adjust for real-world variance.
 *
 * Pure function with well-defined I/O - no side effects.
 */

/**
 * Base consumption rates (kg/hour) per power level
 */
export const BASE_CONSUMPTION_RATES: Record<number, number> = {
  1: 0.6,  // Low
  2: 0.9,
  3: 1.2,  // Medium
  4: 1.6,
  5: 2.0,  // Max
};

/**
 * Default pellet cost per kg in EUR
 */
export const DEFAULT_PELLET_COST_PER_KG = 0.5;

/**
 * Input: Usage data for a time period
 */
export interface UsageDataPoint {
  powerLevel: number;
  hours: number;
}

/**
 * Output: Consumption estimate with breakdown
 */
export interface ConsumptionEstimate {
  totalKg: number;
  costEstimate: number;
  dailyAverage: number;
  byPowerLevel: Record<number, { hours: number; kg: number }>;
}

/**
 * Estimates pellet consumption based on usage data
 *
 * @param usageData - Array of power level and hours
 * @param calibrationFactor - User adjustment factor (default: 1.0)
 * @param pelletCostPerKg - Cost per kg in EUR (default: 0.50)
 * @returns Consumption estimate with totals and breakdown
 */
export function estimatePelletConsumption(
  usageData: UsageDataPoint[],
  calibrationFactor: number = 1.0,
  pelletCostPerKg: number = DEFAULT_PELLET_COST_PER_KG
): ConsumptionEstimate {
  // Handle empty array edge case
  if (usageData.length === 0) {
    return {
      totalKg: 0,
      costEstimate: 0,
      dailyAverage: 0,
      byPowerLevel: {},
    };
  }

  const byPowerLevel: Record<number, { hours: number; kg: number }> = {};
  let totalKg = 0;

  for (const dataPoint of usageData) {
    const { powerLevel, hours } = dataPoint;

    // Get consumption rate, fallback to medium (level 3) for unknown levels
    const rate = BASE_CONSUMPTION_RATES[powerLevel] ?? BASE_CONSUMPTION_RATES[3]!;

    // Calculate consumption with calibration
    const kg = rate * hours * calibrationFactor;

    // Round to 2 decimal places
    const kgRounded = parseFloat(kg.toFixed(2));

    // Accumulate total
    totalKg += kgRounded;

    // Update breakdown (aggregate multiple entries for same power level)
    if (!byPowerLevel[powerLevel]) {
      byPowerLevel[powerLevel] = { hours: 0, kg: 0 };
    }
    byPowerLevel[powerLevel].hours = parseFloat(
      (byPowerLevel[powerLevel].hours + hours).toFixed(2)
    );
    byPowerLevel[powerLevel].kg = parseFloat(
      (byPowerLevel[powerLevel].kg + kgRounded).toFixed(2)
    );
  }

  // Round total to 2 decimal places
  totalKg = parseFloat(totalKg.toFixed(2));

  // Calculate cost estimate
  const costEstimate = parseFloat((totalKg * pelletCostPerKg).toFixed(2));

  // Calculate daily average (guard against division by zero)
  const dailyAverage = parseFloat((totalKg / usageData.length).toFixed(2));

  return {
    totalKg,
    costEstimate,
    dailyAverage,
    byPowerLevel,
  };
}
