import { getMobileQuickActions } from '../Navbar';
import { Home, Calendar, AlertCircle, Clock, Lightbulb } from 'lucide-react';

describe('getMobileQuickActions', () => {
  test('returns Home and Log when no devices enabled', () => {
    const navStructure = { devices: [] };
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('returns stove actions when stove is enabled', () => {
    const navStructure = {
      devices: [{ id: 'stove', name: 'Stufa' }]
    };
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(4);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/stove/scheduler', icon: Calendar, label: 'Orari' });
    expect(actions[2]).toEqual({ href: '/stove/errors', icon: AlertCircle, label: 'Errori' });
    expect(actions[3]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('returns thermostat actions when only thermostat is enabled', () => {
    const navStructure = {
      devices: [{ id: 'thermostat', name: 'Termostato' }]
    };
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(3);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/thermostat/schedule', icon: Calendar, label: 'Programmazione' });
    expect(actions[2]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('returns lights actions when only lights is enabled', () => {
    const navStructure = {
      devices: [{ id: 'lights', name: 'Luci' }]
    };
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(3);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/lights/scenes', icon: Lightbulb, label: 'Scene' });
    expect(actions[2]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('prioritizes stove over thermostat when both enabled', () => {
    const navStructure = {
      devices: [
        { id: 'thermostat', name: 'Termostato' },
        { id: 'stove', name: 'Stufa' }
      ]
    };
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(4);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/stove/scheduler', icon: Calendar, label: 'Orari' });
    expect(actions[2]).toEqual({ href: '/stove/errors', icon: AlertCircle, label: 'Errori' });
    expect(actions[3]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('prioritizes stove over lights when both enabled', () => {
    const navStructure = {
      devices: [
        { id: 'lights', name: 'Luci' },
        { id: 'stove', name: 'Stufa' }
      ]
    };
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(4);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/stove/scheduler', icon: Calendar, label: 'Orari' });
    expect(actions[2]).toEqual({ href: '/stove/errors', icon: AlertCircle, label: 'Errori' });
    expect(actions[3]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('prioritizes thermostat over lights when both enabled (no stove)', () => {
    const navStructure = {
      devices: [
        { id: 'lights', name: 'Luci' },
        { id: 'thermostat', name: 'Termostato' }
      ]
    };
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(3);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/thermostat/schedule', icon: Calendar, label: 'Programmazione' });
    expect(actions[2]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('returns maximum 4 items', () => {
    const navStructure = {
      devices: [
        { id: 'stove', name: 'Stufa' },
        { id: 'thermostat', name: 'Termostato' },
        { id: 'lights', name: 'Luci' }
      ]
    };
    const actions = getMobileQuickActions(navStructure);

    expect(actions.length).toBeLessThanOrEqual(4);
  });

  test('handles undefined devices array', () => {
    const navStructure = {};
    const actions = getMobileQuickActions(navStructure);

    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    expect(actions[1]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
  });

  test('Home is always first item', () => {
    const navStructures = [
      { devices: [] },
      { devices: [{ id: 'stove' }] },
      { devices: [{ id: 'thermostat' }] },
      { devices: [{ id: 'lights' }] }
    ];

    navStructures.forEach(navStructure => {
      const actions = getMobileQuickActions(navStructure);
      expect(actions[0]).toEqual({ href: '/', icon: Home, label: 'Home' });
    });
  });

  test('Log is always last item', () => {
    const navStructures = [
      { devices: [] },
      { devices: [{ id: 'stove' }] },
      { devices: [{ id: 'thermostat' }] },
      { devices: [{ id: 'lights' }] }
    ];

    navStructures.forEach(navStructure => {
      const actions = getMobileQuickActions(navStructure);
      expect(actions[actions.length - 1]).toEqual({ href: '/log', icon: Clock, label: 'Log' });
    });
  });
});
