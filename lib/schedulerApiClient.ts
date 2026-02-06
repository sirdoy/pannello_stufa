/**
 * Scheduler API Client
 *
 * Client-side wrapper per operazioni scheduler che usano Admin SDK server-side.
 * Sostituisce le chiamate dirette a schedulerService che richiedono WRITE.
 */

/**
 * Save schedule for a specific day
 * @param {string} day - Day name (e.g., "Lunedì")
 * @param {Array} schedule - Schedule intervals
 */
export async function saveSchedule(day, schedule) {
  const response = await fetch('/api/scheduler/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'saveSchedule',
      data: { day, schedule }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save schedule');
  }

  return response.json();
}

/**
 * Set scheduler mode (enable/disable)
 * @param {boolean} enabled - Enable or disable scheduler
 */
export async function setSchedulerMode(enabled) {
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
 * @param {string} returnToAutoAt - ISO timestamp when to return to auto
 */
export async function setSemiManualMode(returnToAutoAt) {
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
export async function clearSemiManualMode() {
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
