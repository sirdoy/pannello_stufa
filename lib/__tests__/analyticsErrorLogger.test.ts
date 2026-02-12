/**
 * Analytics Error Logger Unit Tests
 *
 * Tests for logComponentError function in analyticsEventLogger.
 */

import { logComponentError } from '../analyticsEventLogger';
import { adminDbSet } from '../firebaseAdmin';

// Mock Firebase Admin
jest.mock('../firebaseAdmin', () => ({
  adminDbSet: jest.fn(),
  adminDbGet: jest.fn(),
}));

// Mock environment helper
jest.mock('../environmentHelper', () => ({
  getEnvironmentPath: jest.fn((path: string) => `test-env/${path}`),
}));

const mockAdminDbSet = jest.mocked(adminDbSet);

describe('logComponentError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls logAnalyticsEvent with eventType component_error and source error_boundary', async () => {
    mockAdminDbSet.mockResolvedValueOnce(undefined);

    await logComponentError({
      component: 'TestComponent',
      message: 'Test error message',
    });

    expect(mockAdminDbSet).toHaveBeenCalledTimes(1);

    // Verify the event was written to Firebase with correct structure
    const [path, event] = mockAdminDbSet.mock.calls[0] ?? [];
    expect(path).toMatch(/test-env\/analyticsEvents\//);
    expect(event).toMatchObject({
      eventType: 'component_error',
      source: 'error_boundary',
      component: 'TestComponent',
      errorMessage: 'Test error message',
    });
    expect(event).toHaveProperty('timestamp');
    // Optional fields (errorStack, device) should not be present when undefined
    expect(event).not.toHaveProperty('errorStack');
    expect(event).not.toHaveProperty('device');
  });

  test('passes device, component, message, and stack fields correctly', async () => {
    mockAdminDbSet.mockResolvedValueOnce(undefined);

    await logComponentError({
      device: 'stove-main',
      component: 'PowerControls',
      message: 'Failed to update power',
      stack: 'Error: Failed\n  at PowerControls.tsx:42',
    });

    // Verify the event was written with all fields
    const [, event] = mockAdminDbSet.mock.calls[0] ?? [];
    expect(event).toMatchObject({
      eventType: 'component_error',
      source: 'error_boundary',
      component: 'PowerControls',
      errorMessage: 'Failed to update power',
      errorStack: 'Error: Failed\n  at PowerControls.tsx:42',
      device: 'stove-main',
    });
  });

  test('does not throw when logAnalyticsEvent rejects (fire-and-forget)', async () => {
    mockAdminDbSet.mockRejectedValueOnce(new Error('Firebase error'));

    // Should not throw
    await expect(
      logComponentError({
        component: 'TestComponent',
        message: 'Test error',
      })
    ).resolves.toBeUndefined();

    expect(mockAdminDbSet).toHaveBeenCalledTimes(1);
  });

  test('handles missing optional fields (device and stack)', async () => {
    mockAdminDbSet.mockResolvedValueOnce(undefined);

    await logComponentError({
      component: 'SimpleComponent',
      message: 'Simple error',
    });

    // Verify the event was written without optional fields
    const [, event] = mockAdminDbSet.mock.calls[0] ?? [];
    expect(event).toMatchObject({
      eventType: 'component_error',
      source: 'error_boundary',
      component: 'SimpleComponent',
      errorMessage: 'Simple error',
    });
    // Optional fields should not be present
    expect(event).not.toHaveProperty('errorStack');
    expect(event).not.toHaveProperty('device');
  });
});
