import {
  APP_VERSION,
  APP_AUTHOR,
  LAST_UPDATE,
  VERSION_HISTORY,
} from '../version';
import versionInfo from '../version';

describe('version', () => {
  describe('Constants', () => {
    test('APP_VERSION is defined and is a string', () => {
      expect(APP_VERSION).toBeDefined();
      expect(typeof APP_VERSION).toBe('string');
    });

    test('APP_VERSION follows semantic versioning format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      expect(APP_VERSION).toMatch(semverRegex);
    });

    test('APP_AUTHOR is defined and is a string', () => {
      expect(APP_AUTHOR).toBeDefined();
      expect(typeof APP_AUTHOR).toBe('string');
      expect(APP_AUTHOR).toBe('Federico Manfredi');
    });

    test('LAST_UPDATE is defined and is a valid date string', () => {
      expect(LAST_UPDATE).toBeDefined();
      expect(typeof LAST_UPDATE).toBe('string');
      const date = new Date(LAST_UPDATE);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  describe('VERSION_HISTORY', () => {
    test('is defined and is an array', () => {
      expect(VERSION_HISTORY).toBeDefined();
      expect(Array.isArray(VERSION_HISTORY)).toBe(true);
    });

    test('is not empty', () => {
      expect(VERSION_HISTORY.length).toBeGreaterThan(0);
    });

    test('each version entry has required fields', () => {
      VERSION_HISTORY.forEach((entry) => {
        expect(entry).toHaveProperty('version');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('changes');

        expect(typeof entry.version).toBe('string');
        expect(typeof entry.date).toBe('string');
        expect(Array.isArray(entry.changes)).toBe(true);
        // type is optional - only validate if present
        if (entry.type) {
          expect(typeof entry.type).toBe('string');
        }
      });
    });

    test('each version follows semantic versioning format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      VERSION_HISTORY.forEach((entry) => {
        expect(entry.version).toMatch(semverRegex);
      });
    });

    test('each version type is valid when present', () => {
      const validTypes = ['major', 'minor', 'patch'];
      VERSION_HISTORY.forEach((entry) => {
        // type is optional - only validate if present
        if (entry.type) {
          expect(validTypes).toContain(entry.type);
        }
      });
    });

    test('each date is a valid date string', () => {
      VERSION_HISTORY.forEach((entry) => {
        const date = new Date(entry.date);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    test('each changes array is not empty', () => {
      VERSION_HISTORY.forEach((entry) => {
        expect(entry.changes.length).toBeGreaterThan(0);
        entry.changes.forEach((change) => {
          expect(typeof change).toBe('string');
          expect(change.length).toBeGreaterThan(0);
        });
      });
    });

    test('first entry matches current APP_VERSION', () => {
      expect(VERSION_HISTORY[0]!.version).toBe(APP_VERSION);
    });

    test('first entry date matches LAST_UPDATE', () => {
      expect(VERSION_HISTORY[0]!.date).toBe(LAST_UPDATE);
    });
  });

  describe('versionInfo default export', () => {
    test('is defined and is an object', () => {
      expect(versionInfo).toBeDefined();
      expect(typeof versionInfo).toBe('object');
    });

    test('contains all required properties', () => {
      expect(versionInfo).toHaveProperty('version');
      expect(versionInfo).toHaveProperty('author');
      expect(versionInfo).toHaveProperty('lastUpdate');
      expect(versionInfo).toHaveProperty('history');
    });

    test('properties match exported constants', () => {
      expect(versionInfo.version).toBe(APP_VERSION);
      expect(versionInfo.author).toBe(APP_AUTHOR);
      expect(versionInfo.lastUpdate).toBe(LAST_UPDATE);
      expect(versionInfo.history).toBe(VERSION_HISTORY);
    });
  });

  describe('Version history ordering', () => {
    test('versions are in descending order by semantic version', () => {
      for (let i = 0; i < VERSION_HISTORY.length - 1; i++) {
        const current = VERSION_HISTORY[i]!.version.split('.').map(Number);
        const next = VERSION_HISTORY[i + 1]!.version.split('.').map(Number);

        // Compare major version
        if (current[0]! !== next[0]!) {
          expect(current[0]!).toBeGreaterThanOrEqual(next[0]!);
        }
        // If major is same, compare minor
        else if (current[1]! !== next[1]!) {
          expect(current[1]!).toBeGreaterThanOrEqual(next[1]!);
        }
        // If major and minor are same, compare patch
        else {
          expect(current[2]!).toBeGreaterThanOrEqual(next[2]!);
        }
      }
    });
  });
});
