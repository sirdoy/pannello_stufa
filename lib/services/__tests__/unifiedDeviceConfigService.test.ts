/**
 * getUnifiedDeviceConfigAdmin — first-visit behaviour (new first-party users start
 * with no Firebase data at all).
 */
const store: Record<string, unknown> = {};
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(async (path: string) => store[path] ?? null),
  adminDbSet: jest.fn(async (path: string, value: unknown) => {
    store[path] = value;
  }),
}));
jest.mock('@/lib/firebase', () => ({ db: {} }));

import {
  getUnifiedDeviceConfigAdmin,
  getVisibleDashboardCards,
} from '../unifiedDeviceConfigService';
import { DEFAULT_DEVICE_ORDER } from '@/lib/devices/deviceTypes';

describe('getUnifiedDeviceConfigAdmin', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
  });

  it('gives a brand-new user every device visible and persists it', async () => {
    const config = await getUnifiedDeviceConfigAdmin('user:2');

    expect(config.devices.map((d) => d.id)).toEqual(DEFAULT_DEVICE_ORDER);
    expect(config.devices.every((d) => d.visible)).toBe(true);
    expect(getVisibleDashboardCards(config).length).toBeGreaterThan(0);
    expect(store['users/user:2/deviceConfig']).toEqual(config);
  });

  it('still migrates v1 data: only the old visible cards stay visible', async () => {
    store['users/u1/dashboardPreferences'] = { cardOrder: [{ id: 'stove', visible: true }] };
    store['devicePreferences/u1'] = { stove: true };

    const config = await getUnifiedDeviceConfigAdmin('u1');
    const visible = config.devices.filter((d) => d.visible).map((d) => d.id);
    expect(visible).toEqual(['stove']);
  });
});
