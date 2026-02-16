/**
 * LTTB (Largest Triangle Three Buckets) decimation algorithm
 *
 * Reduces time-series data to a target threshold while preserving visual peaks and valleys.
 * Based on Sveinn Steinarsson's 2013 algorithm.
 *
 * Algorithm:
 * 1. Always keep first and last points
 * 2. Divide remaining points into (threshold - 2) buckets
 * 3. For each bucket, select the point that forms the largest triangle area
 *    with the previous selected point and the average of the next bucket
 * 4. Triangle area formula: 0.5 * |((ax - cx)(by - ay)) - ((ax - bx)(cy - ay))|
 *    where a=previous selected, b=candidate, c=next bucket average
 *
 * Reference: https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf
 */

export interface TimeSeriesPoint {
  time: number;
  value: number;
}

export function decimateLTTB(data: TimeSeriesPoint[], threshold: number): TimeSeriesPoint[] {
  // Pass-through for small datasets
  if (data.length <= threshold) {
    return data;
  }

  // Edge cases
  if (threshold <= 0) {
    return [];
  }

  if (threshold === 1) {
    return data.length > 0 ? [data[0]] : [];
  }

  if (threshold === 2) {
    return [data[0], data[data.length - 1]];
  }

  const sampled: TimeSeriesPoint[] = [];

  // Always keep first point
  sampled.push(data[0]);

  // Bucket size for the middle points (excluding first and last)
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Index of the last selected point
  let selectedIndex = 0;

  // Process each bucket
  for (let i = 0; i < threshold - 2; i++) {
    // Calculate current bucket range
    const bucketStart = Math.floor(i * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Calculate average point of the NEXT bucket for triangle area calculation
    const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextBucketEnd = i < threshold - 3
      ? Math.floor((i + 2) * bucketSize) + 1
      : data.length; // Last bucket extends to end

    let avgTime = 0;
    let avgValue = 0;
    let nextBucketLength = 0;

    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      if (j < data.length) {
        avgTime += data[j].time;
        avgValue += data[j].value;
        nextBucketLength++;
      }
    }

    if (nextBucketLength > 0) {
      avgTime /= nextBucketLength;
      avgValue /= nextBucketLength;
    }

    // Find the point in current bucket with largest triangle area
    let maxArea = -1;
    let maxAreaIndex = bucketStart;

    const prevPoint = data[selectedIndex];

    for (let j = bucketStart; j < bucketEnd; j++) {
      if (j < data.length) {
        const point = data[j];

        // Calculate triangle area
        // Formula: 0.5 * |((ax - cx)(by - ay)) - ((ax - bx)(cy - ay))|
        // a = previous selected point
        // b = current candidate point
        // c = next bucket average
        const area = Math.abs(
          (prevPoint.time - avgTime) * (point.value - prevPoint.value) -
          (prevPoint.time - point.time) * (avgValue - prevPoint.value)
        ) * 0.5;

        if (area > maxArea) {
          maxArea = area;
          maxAreaIndex = j;
        }
      }
    }

    // Add the point with the largest triangle area
    sampled.push(data[maxAreaIndex]);
    selectedIndex = maxAreaIndex;
  }

  // Always keep last point
  sampled.push(data[data.length - 1]);

  return sampled;
}
