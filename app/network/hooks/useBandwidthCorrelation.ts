'use client';

import { useState, useCallback, useMemo } from 'react';
import { calculatePearsonCorrelation } from '@/lib/utils/pearsonCorrelation';
import type {
  CorrelationDataPoint,
  CorrelationInsight,
  CorrelationInsightLevel,
  CorrelationStatus,
  UseBandwidthCorrelationReturn,
} from '@/app/components/devices/network/types';

const MIN_CORRELATION_POINTS = 30;
const MAX_CORRELATION_POINTS = 2000;

/**
 * Hook for bandwidth-stove power correlation analysis
 *
 * Buffers paired bandwidth+power data points, computes Pearson correlation,
 * and generates human-readable insight text in Italian.
 *
 * Features:
 * - Minute-level timestamp alignment (prevents duplicate points from fast polling)
 * - Filters null power levels (stove off = no correlation point)
 * - Caps buffer at 2000 points (prevents memory growth)
 * - Returns 'stove-off' | 'collecting' | 'ready' status
 * - Maps correlation coefficient to 5 Italian insight levels
 */
export function useBandwidthCorrelation(): UseBandwidthCorrelationReturn {
  const [chartData, setChartData] = useState<CorrelationDataPoint[]>([]);

  /**
   * Add data point with minute-level timestamp alignment
   * Averages bandwidth and powerLevel when same minute already exists
   */
  const addDataPoint = useCallback(
    (bandwidth: number, powerLevel: number | null, timestamp: number) => {
      // Filter out stove-off data points
      if (powerLevel === null) {
        return;
      }

      // Round timestamp to nearest minute
      const roundedTime = Math.round(timestamp / 60000) * 60000;

      setChartData((prev) => {
        // Check if point already exists for this minute
        const existingIndex = prev.findIndex((p) => p.time === roundedTime);

        let updated: CorrelationDataPoint[];

        if (existingIndex !== -1) {
          // Average with existing point
          const existing = prev[existingIndex]!;
          updated = [...prev];
          updated[existingIndex] = {
            time: roundedTime,
            bandwidth: (existing.bandwidth + bandwidth) / 2,
            powerLevel: (existing.powerLevel + powerLevel) / 2,
          };
        } else {
          // Add new point
          updated = [
            ...prev,
            {
              time: roundedTime,
              bandwidth,
              powerLevel,
            },
          ];
        }

        // Cap buffer at MAX_CORRELATION_POINTS
        if (updated.length > MAX_CORRELATION_POINTS) {
          return updated.slice(-MAX_CORRELATION_POINTS);
        }

        return updated;
      });
    },
    []
  );

  /**
   * Compute correlation insight from chart data
   */
  const insight = useMemo<CorrelationInsight | null>(() => {
    if (chartData.length < MIN_CORRELATION_POINTS) {
      return null;
    }

    // Extract parallel arrays for Pearson calculation
    const bandwidthValues = chartData.map((p) => p.bandwidth);
    const powerLevelValues = chartData.map((p) => p.powerLevel);

    const coefficient = calculatePearsonCorrelation(
      bandwidthValues,
      powerLevelValues
    );

    // Map coefficient to insight level and description
    let level: CorrelationInsightLevel;
    let description: string;

    if (coefficient > 0.7) {
      level = 'strong-positive';
      description =
        'Correlazione forte positiva: la banda aumenta con la potenza della stufa';
    } else if (coefficient > 0.3) {
      level = 'moderate-positive';
      description =
        'Correlazione moderata: la banda tende ad aumentare con il riscaldamento';
    } else if (coefficient > -0.3) {
      level = 'none';
      description =
        'Nessuna correlazione significativa tra banda e riscaldamento';
    } else if (coefficient > -0.7) {
      level = 'moderate-negative';
      description =
        'Correlazione moderata: la banda tende a diminuire durante il riscaldamento';
    } else {
      level = 'strong-negative';
      description =
        'Correlazione forte negativa: la banda diminuisce con l\'aumento della potenza';
    }

    // Calculate active hours (assumes ~30s between measurements)
    const activeHours = (chartData.length * 30) / 3600;

    return {
      coefficient,
      level,
      description,
      dataPointCount: chartData.length,
      activeHours,
    };
  }, [chartData]);

  /**
   * Determine status based on data state
   */
  const status = useMemo<CorrelationStatus>(() => {
    if (chartData.length === 0) {
      return 'stove-off';
    }
    if (chartData.length < MIN_CORRELATION_POINTS) {
      return 'collecting';
    }
    return 'ready';
  }, [chartData.length]);

  return {
    chartData,
    insight,
    status,
    addDataPoint,
    pointCount: chartData.length,
    minPoints: MIN_CORRELATION_POINTS,
  };
}
