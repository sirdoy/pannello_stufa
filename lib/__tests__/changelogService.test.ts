import {
  saveVersionToFirebase,
  getChangelogFromFirebase,
  getLatestVersion,
  getVersionType,
  syncVersionHistoryToFirebase,
} from '../changelogService';
import { ref, set, get } from 'firebase/database';

// Mock Firebase
jest.mock('firebase/database');
jest.mock('../firebase', () => ({
  db: {},
}));

describe('changelogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveVersionToFirebase', () => {
    test('saves version to Firebase with correct path format', async () => {
      // ARRANGE
      const version = '1.2.3';
      const date = '2025-10-15';
      const changes = ['Fix bug', 'Add feature'];
      const type = 'minor';
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (set as jest.Mock).mockResolvedValue(undefined);
      const mockDate = new Date('2025-10-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // ACT
      await saveVersionToFirebase(version, date, changes, type);

      // ASSERT
      expect(ref).toHaveBeenCalledWith({}, 'changelog/1_2_3'); // Dots replaced with underscores
      expect(set).toHaveBeenCalledWith('mock-ref', {
        version: '1.2.3',
        date: '2025-10-15',
        changes,
        type: 'minor',
        timestamp: '2025-10-15T12:00:00.000Z',
      });
      expect(console.log).toHaveBeenCalledWith('Versione 1.2.3 salvata su Firebase');
    });

    test('uses default type "minor" when type not provided', async () => {
      // ARRANGE
      const version = '1.2.0';
      const date = '2025-10-15';
      const changes = ['Update'];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (set as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await saveVersionToFirebase(version, date, changes); // No type parameter

      // ASSERT
      expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
        type: 'minor',
      }));
    });

    test('handles Firebase error gracefully', async () => {
      // ARRANGE
      const version = '1.2.3';
      const date = '2025-10-15';
      const changes = ['Fix'];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (set as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      await saveVersionToFirebase(version, date, changes);

      // ASSERT
      expect(console.error).toHaveBeenCalledWith(
        'Errore nel salvataggio versione su Firebase:',
        expect.any(Error)
      );
    });
  });

  describe('getChangelogFromFirebase', () => {
    test('returns versions sorted by date (newest first)', async () => {
      // ARRANGE
      const mockData = {
        '1_0_0': {
          version: '1.0.0',
          date: '2025-09-01',
          changes: ['Initial release'],
          type: 'major',
        },
        '1_1_0': {
          version: '1.1.0',
          date: '2025-10-01',
          changes: ['New feature'],
          type: 'minor',
        },
        '1_1_1': {
          version: '1.1.1',
          date: '2025-10-15',
          changes: ['Bug fix'],
          type: 'patch',
        },
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => mockData,
      };
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getChangelogFromFirebase();

      // ASSERT
      expect(result).toHaveLength(3);
      expect(result[0].version).toBe('1.1.1'); // Most recent
      expect(result[1].version).toBe('1.1.0');
      expect(result[2].version).toBe('1.0.0'); // Oldest
    });

    test('returns empty array when no changelog exists', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getChangelogFromFirebase();

      // ASSERT
      expect(result).toEqual([]);
    });

    test('returns empty array on Firebase error', async () => {
      // ARRANGE
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getChangelogFromFirebase();

      // ASSERT
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Errore nel recupero changelog da Firebase:',
        expect.any(Error)
      );
    });

    test('handles single version correctly', async () => {
      // ARRANGE
      const mockData = {
        '1_0_0': {
          version: '1.0.0',
          date: '2025-10-01',
          changes: ['Release'],
          type: 'major',
        },
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => mockData,
      };
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getChangelogFromFirebase();

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0].version).toBe('1.0.0');
    });
  });

  describe('getLatestVersion', () => {
    test('returns most recent version', async () => {
      // ARRANGE
      const mockData = {
        '1_0_0': { version: '1.0.0', date: '2025-09-01' },
        '1_1_0': { version: '1.1.0', date: '2025-10-15' },
      };
      const mockSnapshot = {
        exists: () => true,
        val: () => mockData,
      };
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getLatestVersion();

      // ASSERT
      expect(result).toHaveProperty('version', '1.1.0');
      expect(result).toHaveProperty('date', '2025-10-15');
    });

    test('returns null when no versions exist', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getLatestVersion();

      // ASSERT
      expect(result).toBeNull();
    });

    test('returns null on error', async () => {
      // ARRANGE
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (get as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getLatestVersion();

      // ASSERT
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getVersionType', () => {
    test('returns "major" when major version increases', () => {
      // ARRANGE
      const currentVersion = '1.0.0';
      const newVersion = '2.0.0';

      // ACT
      const result = getVersionType(currentVersion, newVersion);

      // ASSERT
      expect(result).toBe('major');
    });

    test('returns "minor" when minor version increases', () => {
      // ARRANGE
      const currentVersion = '1.0.0';
      const newVersion = '1.1.0';

      // ACT
      const result = getVersionType(currentVersion, newVersion);

      // ASSERT
      expect(result).toBe('minor');
    });

    test('returns "patch" when patch version increases', () => {
      // ARRANGE
      const currentVersion = '1.0.0';
      const newVersion = '1.0.1';

      // ACT
      const result = getVersionType(currentVersion, newVersion);

      // ASSERT
      expect(result).toBe('patch');
    });

    test('returns "patch" by default when versions are equal', () => {
      // ARRANGE
      const currentVersion = '1.0.0';
      const newVersion = '1.0.0';

      // ACT
      const result = getVersionType(currentVersion, newVersion);

      // ASSERT
      expect(result).toBe('patch');
    });

    test('correctly identifies major when both minor and patch change', () => {
      // ARRANGE
      const currentVersion = '1.2.3';
      const newVersion = '2.0.0';

      // ACT
      const result = getVersionType(currentVersion, newVersion);

      // ASSERT
      expect(result).toBe('major');
    });

    test('correctly identifies minor when patch also changes', () => {
      // ARRANGE
      const currentVersion = '1.2.3';
      const newVersion = '1.3.0';

      // ACT
      const result = getVersionType(currentVersion, newVersion);

      // ASSERT
      expect(result).toBe('minor');
    });

    test('handles multi-digit version numbers', () => {
      // ARRANGE
      const currentVersion = '1.9.9';
      const newVersion = '1.10.0';

      // ACT
      const result = getVersionType(currentVersion, newVersion);

      // ASSERT
      expect(result).toBe('minor');
    });
  });

  describe('syncVersionHistoryToFirebase', () => {
    test('syncs all versions from VERSION_HISTORY array', async () => {
      // ARRANGE
      const versionHistory = [
        { version: '1.2.0', date: '2025-10-15', changes: ['Feature'] },
        { version: '1.1.0', date: '2025-10-01', changes: ['Update'] },
        { version: '1.0.0', date: '2025-09-01', changes: ['Initial'] },
      ];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (set as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await syncVersionHistoryToFirebase(versionHistory);

      // ASSERT
      expect(set).toHaveBeenCalledTimes(3);
      expect(console.log).toHaveBeenCalledWith('VERSION_HISTORY sincronizzato con Firebase');
    });

    test('assigns correct version types when syncing', async () => {
      // ARRANGE
      const versionHistory = [
        { version: '2.0.0', date: '2025-10-15', changes: ['Breaking'] },
        { version: '1.1.0', date: '2025-10-01', changes: ['Feature'] },
        { version: '1.0.1', date: '2025-09-15', changes: ['Fix'] },
        { version: '1.0.0', date: '2025-09-01', changes: ['Initial'] },
      ];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (set as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await syncVersionHistoryToFirebase(versionHistory);

      // ASSERT
      // Check that set was called with correct types
      const calls = (set as jest.Mock).mock.calls;
      // First version (2.0.0) should be major compared to 1.1.0
      expect(calls[0][1].type).toBe('major');
      // Second version (1.1.0) should be minor compared to 1.0.1
      expect(calls[1][1].type).toBe('minor');
      // Third version (1.0.1) should be patch compared to 1.0.0
      expect(calls[2][1].type).toBe('patch');
    });

    test('handles single version history', async () => {
      // ARRANGE
      const versionHistory = [
        { version: '1.0.0', date: '2025-10-01', changes: ['Initial'] },
      ];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (set as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await syncVersionHistoryToFirebase(versionHistory);

      // ASSERT
      expect(set).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledWith('mock-ref', expect.objectContaining({
        type: 'major', // Single version defaults to major
      }));
    });

    test('handles empty version history', async () => {
      // ARRANGE
      const versionHistory = [];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (set as jest.Mock).mockResolvedValue(undefined);

      // ACT
      await syncVersionHistoryToFirebase(versionHistory);

      // ASSERT
      expect(set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('VERSION_HISTORY sincronizzato con Firebase');
    });

    test('continues syncing even if one version fails', async () => {
      // ARRANGE
      const versionHistory = [
        { version: '1.2.0', date: '2025-10-15', changes: ['Feature'] },
        { version: '1.1.0', date: '2025-10-01', changes: ['Update'] },
        { version: '1.0.0', date: '2025-09-01', changes: ['Initial'] },
      ];
      (ref as jest.Mock).mockReturnValue('mock-ref');
      set
        .mockResolvedValueOnce() // First succeeds
        .mockRejectedValueOnce(new Error('Firebase error')) // Second fails
        .mockResolvedValueOnce(undefined); // Third succeeds

      // ACT
      await syncVersionHistoryToFirebase(versionHistory);

      // ASSERT
      expect(set).toHaveBeenCalledTimes(3);
      // Even with error, sync completes
      expect(console.log).toHaveBeenCalledWith('VERSION_HISTORY sincronizzato con Firebase');
    });

    test('logs error when sync fails completely', async () => {
      // ARRANGE
      const versionHistory = [
        { version: '1.0.0', date: '2025-10-01', changes: ['Initial'] },
      ];
      (ref as jest.Mock).mockImplementation(() => {
        throw new Error('Critical error');
      });

      // ACT
      await syncVersionHistoryToFirebase(versionHistory);

      // ASSERT
      expect(console.error).toHaveBeenCalled();
    });
  });
});
