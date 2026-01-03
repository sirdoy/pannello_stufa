/**
 * Schedules API Client
 *
 * Client-side wrapper for schedule write operations (Admin SDK server-side).
 * All operations require authentication (handled by API routes).
 */

/**
 * Get all schedules (metadata only)
 * @returns {Promise<Array>} Array of schedule metadata
 */
export async function getAllSchedules() {
  const response = await fetch('/api/schedules', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch schedules');
  }

  return response.json();
}

/**
 * Get specific schedule by ID
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<Object>} Schedule object
 */
export async function getScheduleById(scheduleId) {
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
 * @param {string} name - Schedule name
 * @param {string} [copyFromId] - Optional: ID of schedule to copy from
 * @returns {Promise<Object>} Created schedule with ID
 */
export async function createSchedule(name, copyFromId = null) {
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
 * @param {string} scheduleId - Schedule ID
 * @param {Object} updates - Fields to update (name, slots, enabled)
 * @returns {Promise<Object>} Updated schedule
 */
export async function updateSchedule(scheduleId, updates) {
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
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<Object>} Success confirmation
 */
export async function deleteSchedule(scheduleId) {
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
 * @returns {Promise<string>} Active schedule ID
 */
export async function getActiveScheduleId() {
  const response = await fetch('/api/schedules/active', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch active schedule ID');
  }

  const data = await response.json();
  return data.activeScheduleId;
}

/**
 * Set active schedule
 * @param {string} scheduleId - Schedule ID to activate
 * @returns {Promise<Object>} Success confirmation
 */
export async function setActiveSchedule(scheduleId) {
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
