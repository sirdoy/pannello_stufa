import { API_KEY, STUFA_API } from '../stoveApi';

describe('stoveApi', () => {
  const BASE_URL = 'https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json';

  describe('API_KEY', () => {
    test('is defined and is a valid UUID format', () => {
      expect(API_KEY).toBeDefined();
      expect(typeof API_KEY).toBe('string');
      expect(API_KEY).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('has expected value', () => {
      expect(API_KEY).toBe('bdb58f63-117e-4753-bb0f-0487f2f14e52');
    });
  });

  describe('STUFA_API endpoints', () => {
    describe('Control endpoints', () => {
      test('ignite endpoint is correctly formatted', () => {
        expect(STUFA_API.ignite).toBe(`${BASE_URL}/Ignit/${API_KEY}`);
        expect(STUFA_API.ignite).toContain('Ignit');
      });

      test('shutdown endpoint is correctly formatted', () => {
        expect(STUFA_API.shutdown).toBe(`${BASE_URL}/Shutdown/${API_KEY}`);
        expect(STUFA_API.shutdown).toContain('Shutdown');
      });
    });

    describe('Getter endpoints', () => {
      test('getStatus endpoint is correctly formatted', () => {
        expect(STUFA_API.getStatus).toBe(`${BASE_URL}/GetStatus/${API_KEY}`);
        expect(STUFA_API.getStatus).toContain('GetStatus');
      });

      test('getFan endpoint is correctly formatted', () => {
        expect(STUFA_API.getFan).toBe(`${BASE_URL}/GetFanLevel/${API_KEY}`);
        expect(STUFA_API.getFan).toContain('GetFanLevel');
      });

      test('getPower endpoint is correctly formatted', () => {
        expect(STUFA_API.getPower).toBe(`${BASE_URL}/GetPower/${API_KEY}`);
        expect(STUFA_API.getPower).toContain('GetPower');
      });

      test('getRoomTemperature endpoint is correctly formatted', () => {
        expect(STUFA_API.getRoomTemperature).toBe(`${BASE_URL}/GetRoomControlTemperature/${API_KEY}`);
        expect(STUFA_API.getRoomTemperature).toContain('GetRoomControlTemperature');
      });
    });

    describe('Setter endpoints (parameterized)', () => {
      describe('setFan', () => {
        test('is a function', () => {
          expect(typeof STUFA_API.setFan).toBe('function');
        });

        test('generates correct URL for fan level 1', () => {
          const result = STUFA_API.setFan(1);
          expect(result).toBe(`${BASE_URL}/SetFanLevel/${API_KEY};1`);
        });

        test('generates correct URL for fan level 6', () => {
          const result = STUFA_API.setFan(6);
          expect(result).toBe(`${BASE_URL}/SetFanLevel/${API_KEY};6`);
        });

        test('generates correct URL for all fan levels (1-6)', () => {
          for (let level = 1; level <= 6; level++) {
            const result = STUFA_API.setFan(level);
            expect(result).toBe(`${BASE_URL}/SetFanLevel/${API_KEY};${level}`);
            expect(result).toContain('SetFanLevel');
            expect(result).toContain(`;${level}`);
          }
        });

        test('accepts string parameter and generates correct URL', () => {
          const result = STUFA_API.setFan('3');
          expect(result).toBe(`${BASE_URL}/SetFanLevel/${API_KEY};3`);
        });
      });

      describe('setPower', () => {
        test('is a function', () => {
          expect(typeof STUFA_API.setPower).toBe('function');
        });

        test('generates correct URL for power level 0', () => {
          const result = STUFA_API.setPower(0);
          expect(result).toBe(`${BASE_URL}/SetPower/${API_KEY};0`);
        });

        test('generates correct URL for power level 5', () => {
          const result = STUFA_API.setPower(5);
          expect(result).toBe(`${BASE_URL}/SetPower/${API_KEY};5`);
        });

        test('generates correct URL for all power levels (0-5)', () => {
          for (let level = 0; level <= 5; level++) {
            const result = STUFA_API.setPower(level);
            expect(result).toBe(`${BASE_URL}/SetPower/${API_KEY};${level}`);
            expect(result).toContain('SetPower');
            expect(result).toContain(`;${level}`);
          }
        });

        test('accepts string parameter and generates correct URL', () => {
          const result = STUFA_API.setPower('4');
          expect(result).toBe(`${BASE_URL}/SetPower/${API_KEY};4`);
        });
      });
    });

    describe('Complete API structure', () => {
      test('has all expected properties', () => {
        expect(STUFA_API).toHaveProperty('ignite');
        expect(STUFA_API).toHaveProperty('shutdown');
        expect(STUFA_API).toHaveProperty('getStatus');
        expect(STUFA_API).toHaveProperty('getFan');
        expect(STUFA_API).toHaveProperty('getPower');
        expect(STUFA_API).toHaveProperty('getRoomTemperature');
        expect(STUFA_API).toHaveProperty('setFan');
        expect(STUFA_API).toHaveProperty('setPower');
      });

      test('has exactly 8 properties', () => {
        const keys = Object.keys(STUFA_API);
        expect(keys).toHaveLength(8);
      });

      test('all static endpoints start with base URL', () => {
        expect(STUFA_API.ignite).toContain(BASE_URL);
        expect(STUFA_API.shutdown).toContain(BASE_URL);
        expect(STUFA_API.getStatus).toContain(BASE_URL);
        expect(STUFA_API.getFan).toContain(BASE_URL);
        expect(STUFA_API.getPower).toContain(BASE_URL);
        expect(STUFA_API.getRoomTemperature).toContain(BASE_URL);
      });

      test('all static endpoints contain API_KEY', () => {
        expect(STUFA_API.ignite).toContain(API_KEY);
        expect(STUFA_API.shutdown).toContain(API_KEY);
        expect(STUFA_API.getStatus).toContain(API_KEY);
        expect(STUFA_API.getFan).toContain(API_KEY);
        expect(STUFA_API.getPower).toContain(API_KEY);
        expect(STUFA_API.getRoomTemperature).toContain(API_KEY);
      });

      test('parameterized functions generate URLs with base URL and API_KEY', () => {
        const fanUrl = STUFA_API.setFan(3);
        const powerUrl = STUFA_API.setPower(4);

        expect(fanUrl).toContain(BASE_URL);
        expect(fanUrl).toContain(API_KEY);
        expect(powerUrl).toContain(BASE_URL);
        expect(powerUrl).toContain(API_KEY);
      });
    });

    describe('URL format consistency', () => {
      test('all endpoints use HTTPS protocol', () => {
        expect(STUFA_API.ignite).toMatch(/^https:\/\//);
        expect(STUFA_API.shutdown).toMatch(/^https:\/\//);
        expect(STUFA_API.getStatus).toMatch(/^https:\/\//);
        expect(STUFA_API.getFan).toMatch(/^https:\/\//);
        expect(STUFA_API.getPower).toMatch(/^https:\/\//);
        expect(STUFA_API.getRoomTemperature).toMatch(/^https:\/\//);
      });

      test('all endpoints use same domain', () => {
        const domain = 'wsthermorossi.cloudwinet.it';
        expect(STUFA_API.ignite).toContain(domain);
        expect(STUFA_API.shutdown).toContain(domain);
        expect(STUFA_API.getStatus).toContain(domain);
        expect(STUFA_API.getFan).toContain(domain);
        expect(STUFA_API.getPower).toContain(domain);
        expect(STUFA_API.getRoomTemperature).toContain(domain);
      });

      test('all endpoints use /json path', () => {
        expect(STUFA_API.ignite).toContain('/json/');
        expect(STUFA_API.shutdown).toContain('/json/');
        expect(STUFA_API.getStatus).toContain('/json/');
        expect(STUFA_API.getFan).toContain('/json/');
        expect(STUFA_API.getPower).toContain('/json/');
        expect(STUFA_API.getRoomTemperature).toContain('/json/');
      });

      test('setter functions use semicolon separator for parameters', () => {
        const fanUrl = STUFA_API.setFan(3);
        const powerUrl = STUFA_API.setPower(4);

        expect(fanUrl).toContain(';3');
        expect(powerUrl).toContain(';4');
        expect(fanUrl.split(';').length).toBe(2);
        expect(powerUrl.split(';').length).toBe(2);
      });
    });
  });
});
