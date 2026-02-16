/**
 * Calculates Pearson correlation coefficient between two datasets
 * @param xValues Array of x values
 * @param yValues Array of y values
 * @returns Correlation coefficient between -1 and +1, or 0 for invalid inputs
 */
export function calculatePearsonCorrelation(
  xValues: number[],
  yValues: number[]
): number {
  // Guard: empty arrays or mismatched lengths
  if (xValues.length === 0 || xValues.length !== yValues.length) {
    return 0;
  }

  // Guard: single element (denominator would be 0)
  if (xValues.length === 1) {
    return 0;
  }

  const n = xValues.length;

  // Calculate sums
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i]!, 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);

  // Pearson correlation formula:
  // r = [n*ΣXY - (ΣX)(ΣY)] / sqrt[(n*ΣX² - (ΣX)²)(n*ΣY² - (ΣY)²)]
  const numerator = n * sumXY - sumX * sumY;
  const denominatorX = n * sumX2 - sumX * sumX;
  const denominatorY = n * sumY2 - sumY * sumY;
  const denominator = Math.sqrt(denominatorX * denominatorY);

  // Guard: division by zero (constant values or no variance)
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}
