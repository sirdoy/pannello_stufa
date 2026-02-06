/**
 * Scheduler Statistics Calculator
 * Provides metrics and insights for weekly schedule
 */

/**
 * Power labels with descriptions, percentages, and Tailwind gradient classes
 */
export const POWER_LABELS = {
  1: { text: 'Minima', percent: 20, gradient: 'from-blue-400 to-blue-500' },
  2: { text: 'Bassa', percent: 40, gradient: 'from-blue-500 to-yellow-400' },
  3: { text: 'Media', percent: 60, gradient: 'from-yellow-400 to-orange-400' },
  4: { text: 'Alta', percent: 80, gradient: 'from-orange-400 to-red-500' },
  5: { text: 'Massima', percent: 100, gradient: 'from-red-500 to-red-600' },
};

/**
 * Fan labels with descriptions and percentages
 */
export const FAN_LABELS = {
  1: { text: 'Minima', percent: 17 },
  2: { text: 'Bassa', percent: 33 },
  3: { text: 'Media', percent: 50 },
  4: { text: 'Alta', percent: 67 },
  5: { text: 'Molto Alta', percent: 83 },
  6: { text: 'Massima', percent: 100 },
};

/**
 * Calculate duration of a single interval in hours
 */
function getIntervalDuration(interval) {
  const [startH, startM] = interval.start.split(':').map(Number);
  const [endH, endM] = interval.end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return (endMinutes - startMinutes) / 60;
}

/**
 * Calculate comprehensive weekly statistics
 * @param {Object} schedule - Schedule object { day: intervals[] }
 * @returns {Object} Statistics object with various metrics
 */
export function calculateWeeklyStats(schedule) {
  const stats = {
    totalHours: 0,
    totalIntervals: 0,
    dailyHours: {},
    powerDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    fanDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    busiestDay: null,
    avgPerDay: 0,
    weekdaysTotal: 0,
    weekendTotal: 0,
  };

  const weekdays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
  const weekend = ['Sabato', 'Domenica'];

  // Calculate totals
  Object.entries(schedule).forEach(([day, intervals]) => {
    let dayTotal = 0;

    intervals.forEach(interval => {
      const duration = getIntervalDuration(interval);

      stats.totalHours += duration;
      stats.totalIntervals++;
      stats.powerDistribution[interval.power] += duration;
      stats.fanDistribution[interval.fan] += duration;

      dayTotal += duration;

      // Weekday vs weekend
      if (weekdays.includes(day)) {
        stats.weekdaysTotal += duration;
      } else if (weekend.includes(day)) {
        stats.weekendTotal += duration;
      }
    });

    stats.dailyHours[day] = dayTotal;
  });

  // Find busiest day
  if (Object.keys(stats.dailyHours).length > 0) {
    stats.busiestDay = Object.keys(stats.dailyHours)
      .reduce((a, b) => stats.dailyHours[a] > stats.dailyHours[b] ? a : b);
  }

  // Calculate average per day
  const daysWithIntervals = Object.values(stats.dailyHours).filter(h => h > 0).length;
  stats.avgPerDay = daysWithIntervals > 0 ? stats.totalHours / daysWithIntervals : 0;

  return stats;
}

/**
 * Get total hours for a specific day
 */
export function getDayTotalHours(intervals) {
  return intervals.reduce((sum, interval) => {
    return sum + getIntervalDuration(interval);
  }, 0);
}

/**
 * Get power level gradient color for visualization
 * @param {number} power - Power level (1-5)
 * @returns {string} CSS gradient string
 */
export function getPowerGradient(power) {
  const gradients = {
    1: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', // Blue
    2: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', // Green
    3: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', // Yellow
    4: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', // Orange
    5: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', // Red
  };
  return gradients[power] || gradients[2];
}

/**
 * Get power level badge classes
 */
export function getPowerBadgeClass(power) {
  const classes = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    2: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    3: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    4: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    5: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return classes[power] || classes[2];
}

/**
 * Get fan level badge classes
 */
export function getFanBadgeClass(fan) {
  const intensity = Math.ceil(fan / 2); // Group: V1-2=low, V3-4=med, V5-6=high
  const classes = {
    1: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    2: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    3: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  return classes[intensity] || classes[2];
}
