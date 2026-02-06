/**
 * Schedules API Client
 *
 * Client-side wrapper for schedule write operations (Admin SDK server-side).
 * All operations require authentication (handled by API routes).
 */

/** Schedule metadata */
export interface ScheduleMetadata {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  intervalCount?: number;
}

/** Schedule with full data */
export interface Schedule extends ScheduleMetadata {
  slots: Record<string, unknown[]>;
}

/** API error response */
interface ApiError {
  error?: string;
}

/**
 * Get all schedules (metadata only)
 */
export async function getAllSchedules(): Promise<ScheduleMetadata[]> {
  const response = await fetch('/api/schedules', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json() as ApiError;
    throw new Error(error.error || 'Failed to fetch schedules');
  }

  return response.json();
}

/**
 * Get specific schedule by ID
 */
export async function getScheduleById(scheduleId: string): Promise<Schedule> {
  const response = await fetch(`/api/schedules/${scheduleId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch schedule');
  }

  return response.json();
}

/**
 * Create new schedule
 */
export async function createSchedule(name: string, copyFromId: string | null = null): Promise<Schedule> {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      copyFromId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create schedule');
  }

  return response.json();
}

/**
 * Update schedule
 */
export async function updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule> {
  const response = await fetch(`/api/schedules/${scheduleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update schedule');
  }

  return response.json();
}

/**
 * Delete schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete schedule');
  }

  return response.json();
}

/**
 * Get active schedule ID
 */
export async function getActiveScheduleId(): Promise<string> {
  const response = await fetch('/api/schedules/active', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch active schedule ID');
  }

  const data = await response.json() as { activeScheduleId: string };
  return data.activeScheduleId;
}

/**
 * Set active schedule
 */
export async function setActiveSchedule(scheduleId: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/schedules/active', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set active schedule');
  }

  return response.json();
}
