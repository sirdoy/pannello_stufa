/**
 * @jest-environment node
 *
 * Tests for Geocoding API routes
 * Tests search and reverse geocoding functionality
 */

// Mock fetch for testing
global.fetch = jest.fn() as jest.Mock;

// Mock auth middleware
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (handler, name) => handler,
  success: (data) => ({
    status: 200,
    json: async () => ({ success: true, ...data }),
  }),
  badRequest: (message) => ({
    status: 400,
    json: async () => ({ success: false, error: message, code: 'VALIDATION_ERROR' }),
  }),
}));

describe('Geocoding Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/geocoding/search', () => {
    it('should return results for valid query', async () => {
      // Mock Open-Meteo response
      const mockOpenMeteoResponse = {
        results: [
          {
            id: 3173435,
            name: 'Milano',
            latitude: 45.4643,
            longitude: 9.1895,
            country: 'Italia',
            admin1: 'Lombardia',
            timezone: 'Europe/Rome',
          },
          {
            id: 3176219,
            name: 'Milano Marittima',
            latitude: 44.2833,
            longitude: 12.35,
            country: 'Italia',
            admin1: 'Emilia-Romagna',
            timezone: 'Europe/Rome',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpenMeteoResponse,
      });

      // Import the route handler
      const { GET } = await import('@/app/api/geocoding/search/route');

      // Create mock request
      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/search?q=Milano',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].name).toBe('Milano');
      expect(data.results[0].country).toBe('Italia');
      expect(data.results[0].latitude).toBe(45.4643);
      expect(data.results[0].longitude).toBe(9.1895);
    });

    it('should return 400 for missing query parameter', async () => {
      const { GET } = await import('@/app/api/geocoding/search/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/search',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Parametro 'q' richiesto");
    });

    it('should return 400 for query shorter than 3 characters', async () => {
      const { GET } = await import('@/app/api/geocoding/search/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/search?q=ab',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Inserisci almeno 3 caratteri');
    });

    it('should return empty results for no matches', async () => {
      // Mock Open-Meteo empty response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { GET } = await import('@/app/api/geocoding/search/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/search?q=xyzabc123',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toEqual([]);
    });

    it('should return empty results on API failure', async () => {
      // Mock API failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { GET } = await import('@/app/api/geocoding/search/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/search?q=Roma',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toEqual([]);
    });

    it('should call Open-Meteo API with correct parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const { GET } = await import('@/app/api/geocoding/search/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/search?q=Firenze',
      };

      await GET(mockRequest as any, {} as any);

      expect(global.fetch).toHaveBeenCalled();
      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('geocoding-api.open-meteo.com');
      expect(calledUrl).toContain('name=Firenze');
      expect(calledUrl).toContain('count=5');
      expect(calledUrl).toContain('language=it');
    });
  });
});

describe('Geocoding Reverse API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module to clear cached imports
    jest.resetModules();
  });

  describe('GET /api/geocoding/reverse', () => {
    it('should return city name for valid coordinates', async () => {
      // Mock forecast API response (first call)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          timezone: 'Europe/Rome',
          current: { temperature_2m: 15 },
        }),
      });

      // Mock city search response (second call)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Roma',
              country: 'Italia',
              admin1: 'Lazio',
              latitude: 41.9028,
              longitude: 12.4964,
            },
          ],
        }),
      });

      const { GET } = await import('@/app/api/geocoding/reverse/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/reverse?lat=41.9028&lon=12.4964',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.name).toBeDefined();
      expect(data.latitude).toBe(41.9028);
      expect(data.longitude).toBe(12.4964);
    });

    it('should return 400 for missing parameters', async () => {
      const { GET } = await import('@/app/api/geocoding/reverse/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/reverse',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Parametri 'lat' e 'lon' richiesti");
    });

    it('should return 400 for invalid coordinates (out of range)', async () => {
      const { GET } = await import('@/app/api/geocoding/reverse/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/reverse?lat=999&lon=999',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Coordinate non valide');
    });

    it('should return 400 for non-numeric coordinates', async () => {
      const { GET } = await import('@/app/api/geocoding/reverse/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/reverse?lat=abc&lon=def',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Coordinate non valide');
    });

    it('should return formatted coordinates as fallback on API failure', async () => {
      // Mock API failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { GET } = await import('@/app/api/geocoding/reverse/route');

      const mockRequest = {
        url: 'http://localhost:3000/api/geocoding/reverse?lat=45.4642&lon=9.19',
      };

      const response = await GET(mockRequest as any, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.name).toBeDefined();
      expect(data.latitude).toBe(45.4642);
      expect(data.longitude).toBe(9.19);
    });
  });
});
