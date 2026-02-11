import { withAuthAndErrorHandler, success } from '@/lib/core';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { DailyStats, AnalyticsPeriod, CalibrationSettings } from '@/types/analytics';
import { estimatePelletConsumption } from '@/lib/pelletEstimationService';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // Parse period from query params (default 30)
  const periodParam = request.nextUrl.searchParams.get('period');
  const period: AnalyticsPeriod = periodParam === '7' ? 7 : periodParam === '90' ? 90 : 30;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  // Read all daily stats from Firebase
  const statsPath = getEnvironmentPath('analyticsStats/daily');
  const allStats = await adminDbGet(statsPath) as Record<string, DailyStats> | null;

  if (!allStats) {
    return success({
      period,
      days: [],
      totals: { totalHours: 0, totalKg: 0, totalCost: 0, automationPercentage: 0 },
    });
  }

  // Filter stats within date range
  const startKey = startDate.toISOString().split('T')[0]!;
  const endKey = endDate.toISOString().split('T')[0]!;

  const filteredDays = Object.values(allStats)
    .filter(stat => stat.date >= startKey && stat.date <= endKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Read user calibration settings
  const userId = session.user.sub;
  const calibrationPath = getEnvironmentPath(`users/${userId}/analyticsSettings`);
  const calibration = await adminDbGet(calibrationPath) as CalibrationSettings | null;
  const calibrationFactor = calibration?.pelletCalibrationFactor ?? 1.0;
  const pelletCostPerKg = calibration?.pelletCostPerKg ?? 0.50;

  // Calculate period totals
  let totalHours = 0;
  let totalAutomationHours = 0;
  let totalManualHours = 0;

  for (const day of filteredDays) {
    totalHours += day.totalHours;
    totalAutomationHours += day.automationHours;
    totalManualHours += day.manualHours;
  }

  // Recalculate pellet with user calibration
  const allUsage = filteredDays.flatMap(day =>
    Object.entries(day.byPowerLevel).map(([level, hours]) => ({
      powerLevel: parseInt(level),
      hours,
    }))
  );
  const pelletEstimate = estimatePelletConsumption(allUsage, calibrationFactor, pelletCostPerKg);

  const automationPercentage = totalHours > 0
    ? parseFloat(((totalAutomationHours / totalHours) * 100).toFixed(1))
    : 0;

  return success({
    period,
    days: filteredDays,
    totals: {
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalKg: pelletEstimate.totalKg,
      totalCost: pelletEstimate.costEstimate,
      automationPercentage,
    },
    calibration: calibration ? {
      factor: calibrationFactor,
      lastDate: calibration.lastCalibrationDate,
      costPerKg: pelletCostPerKg,
    } : null,
  });
});
