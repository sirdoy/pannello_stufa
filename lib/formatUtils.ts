/**
 * Converts decimal hours to HH:MM format
 * @param {number} decimalHours - Hours in decimal format (e.g., 47.5)
 * @returns {string} Formatted string in HH:MM format (e.g., "47:30")
 */
export function formatHoursToHHMM(decimalHours: number | null | undefined): string {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) {
    return '0:00';
  }

  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  // Handle edge case where rounding gives 60 minutes
  if (minutes === 60) {
    return `${hours + 1}:00`;
  }

  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}
