/**
 * @jest-environment node
 *
 * Tests for POST /api/netatmo/switchhomeschedule
 * Switches active heating schedule via proxy + writes userSelectedScheduleId to Firebase.
 */

import { POST } from '@/app/api/netatmo/switchhomeschedule/route';
import { proxySwitchHomeSchedule } from '@/lib/netatmoProxy';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  badRequest: (msg: string) => ({ ok: false, error: msg, status: 400 }),
  parseJsonOrThrow: async (req: any) => req.json(),
  validateRequired: (value: any, fieldName: string) => {
    if (value === undefined || value === null || value === '') {
      const err = new Error(`Campo obbligatorio mancante: ${fieldName}`);
      (err as any).status = 400;
      throw err;
    }
    return value;
  },
}));

const mockProxySwitchHomeSchedule = proxySwitchHomeSchedule as jest.MockedFunction<typeof proxySwitchHomeSchedule>;
const mockAdminDbSet = adminDbSet as jest.MockedFunction<typeof adminDbSet>;
const mockGetEnvironmentPath = getEnvironmentPath as jest.MockedFunction<typeof getEnvironmentPath>;

const session = { user: { sub: 'user-123', email: 'user@test.com' } };

const callPOST = (body: Record<string, unknown>) =>
  (POST as unknown as (req: unknown, ctx: unknown, sess: unknown) => Promise<unknown>)(
    { json: async () => body },
    undefined,
    session
  );

describe('POST /api/netatmo/switchhomeschedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentPath.mockImplementation((path: string) => `test/${path}`);
    mockAdminDbSet.mockResolvedValue(undefined as any);
    mockProxySwitchHomeSchedule.mockResolvedValue({ status: 'ok', time_exec: 0.1, time_server: 1700000000 });
  });

  it('should call proxy with home_id and schedule_id, write to Firebase, return success', async () => {
    const result = await callPOST({ home_id: 'home-1', schedule_id: 'schedule-2' });

    expect(mockProxySwitchHomeSchedule).toHaveBeenCalledWith({
      home_id: 'home-1',
      schedule_id: 'schedule-2',
    });
    expect(mockAdminDbSet).toHaveBeenCalledWith(
      'test/netatmo/userSelectedScheduleId',
      'schedule-2'
    );
    expect((result as any).ok).toBe(true);
    expect((result as any).data).toMatchObject({
      success: true,
      scheduleId: 'schedule-2',
      message: 'Schedule cambiato con successo',
    });
  });

  it('should return badRequest when schedule_id is missing', async () => {
    await expect(callPOST({ home_id: 'home-1' })).rejects.toThrow('Campo obbligatorio mancante: schedule_id');
    expect(mockProxySwitchHomeSchedule).not.toHaveBeenCalled();
    expect(mockAdminDbSet).not.toHaveBeenCalled();
  });

  it('should return badRequest when home_id is missing', async () => {
    await expect(callPOST({ schedule_id: 'schedule-2' })).rejects.toThrow('Campo obbligatorio mancante: home_id');
    expect(mockProxySwitchHomeSchedule).not.toHaveBeenCalled();
    expect(mockAdminDbSet).not.toHaveBeenCalled();
  });

  it('should propagate proxy error and NOT call adminDbSet', async () => {
    const { ApiError, ERROR_CODES, HTTP_STATUS } = await import('@/lib/core/apiErrors');
    mockProxySwitchHomeSchedule.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Proxy down', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );

    await expect(callPOST({ home_id: 'home-1', schedule_id: 'schedule-2' })).rejects.toThrow('Proxy down');
    expect(mockAdminDbSet).not.toHaveBeenCalled();
  });

  it('should write userSelectedScheduleId to the correct Firebase path', async () => {
    await callPOST({ home_id: 'home-1', schedule_id: 'sched-abc' });

    // Verify the path passed to adminDbSet contains 'userSelectedScheduleId'
    const [path] = mockAdminDbSet.mock.calls[0]!;
    expect(path).toContain('userSelectedScheduleId');
    // Verify the scheduleId value is written
    const [, value] = mockAdminDbSet.mock.calls[0]!;
    expect(value).toBe('sched-abc');
  });
});
