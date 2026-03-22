/**
 * Scheduler API Client
 *
 * Client-side wrapper per operazioni scheduler che usano Admin SDK server-side.
 * Sostituisce le chiamate dirette a schedulerService che richiedono WRITE.
 */

/** Schedule interval */
export interface ScheduleInterval {
  start: string;
  end: string;
  power: number;
  fan: number;
}

/** API response */
interface ApiResponse {
  success: boolean;
  error?: string;
}

/**
 * Save schedule for a specific day
 */
export async function saveSchedule(day: string, schedule: ScheduleInterval[]): Promise<ApiResponse> {
  const response = await fetch('/api/scheduler/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'saveSchedule',
      data: { day, schedule }
    })
  });

  if (!response.ok) {
    const error = await response.json() as { error?: string };
    throw new Error(error.error || 'Failed to save schedule');
  }

  return response.json();
}

/**
 * Set scheduler mode (enable/disable)
 */
export async function setSchedulerMode(enabled: boolean): Promise<ApiResponse> {
  const response = await fetch('/api/scheduler/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'setSchedulerMode',
      data: { enabled }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set scheduler mode');
  }

  return response.json();
}

/**
 * Activate semi-manual mode
 */
export async function setSemiManualMode(returnToAutoAt: string): Promise<ApiResponse> {
  const response = await fetch('/api/scheduler/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'setSemiManualMode',
      data: { returnToAutoAt }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set semi-manual mode');
  }

  return response.json();
}

/**
 * Clear semi-manual mode (return to automatic)
 */
export async function clearSemiManualMode(): Promise<ApiResponse> {
  const response = await fetch('/api/scheduler/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'clearSemiManualMode',
      data: {}
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clear semi-manual mode');
  }

  return response.json();
}
