/**
 * Tests for requestParser.js
 */

import {
  parseJson,
  parseJsonOrThrow,
  parseQuery,
  parseQueryObject,
  validateRequired,
  validateEnum,
  validateRange,
  validateEmail,
  validateString,
  validateArray,
  validateBoolean,
  getPathParam,
  getOptionalPathParam,
} from '../requestParser';
import { ApiError, ERROR_CODES } from '../apiErrors';

// Helper to create mock request
function createMockRequest(body = null, contentType = 'application/json', url = 'https://example.com/api/test') {
  return {
    headers: {
      get: jest.fn((name) => {
        if (name === 'content-type') return contentType;
        return null;
      }),
    },
    text: jest.fn(() => Promise.resolve(body ? JSON.stringify(body) : '')),
    url,
  };
}

describe('JSON Body Parsing', () => {
  describe('parseJson', () => {
    it('should parse valid JSON body', async () => {
      const request = createMockRequest({ name: 'test', value: 42 });
      const result = await parseJson(request);

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should return default value for empty body', async () => {
      const request = createMockRequest(null);
      const result = await parseJson(request, { default: true });

      expect(result).toEqual({ default: true });
    });

    it('should return default value for invalid JSON', async () => {
      const request = {
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve('not valid json'),
      };
      const result = await parseJson(request, { fallback: true });

      expect(result).toEqual({ fallback: true });
    });

    it('should return default value for non-JSON content type', async () => {
      const request = createMockRequest({ data: 'test' }, 'text/plain');
      const result = await parseJson(request, { default: 'value' });

      expect(result).toEqual({ default: 'value' });
    });
  });

  describe('parseJsonOrThrow', () => {
    it('should parse valid JSON body', async () => {
      const request = {
        text: () => Promise.resolve(JSON.stringify({ name: 'test' })),
      };
      const result = await parseJsonOrThrow(request);

      expect(result).toEqual({ name: 'test' });
    });

    it('should throw on empty body', async () => {
      const request = { text: () => Promise.resolve('') };

      await expect(parseJsonOrThrow(request)).rejects.toThrow(ApiError);
      await expect(parseJsonOrThrow(request)).rejects.toThrow('Body richiesto');
    });

    it('should throw on invalid JSON', async () => {
      const request = { text: () => Promise.resolve('invalid json') };

      await expect(parseJsonOrThrow(request)).rejects.toThrow(ApiError);
      await expect(parseJsonOrThrow(request)).rejects.toThrow('JSON non valido');
    });
  });
});

describe('Query Parameter Parsing', () => {
  describe('parseQuery', () => {
    it('should return URLSearchParams', () => {
      const request = createMockRequest(null, null, 'https://example.com/api?page=1&limit=10');
      const params = parseQuery(request);

      expect(params.get('page')).toBe('1');
      expect(params.get('limit')).toBe('10');
    });
  });

  describe('parseQueryObject', () => {
    it('should return query params as object', () => {
      const request = createMockRequest(null, null, 'https://example.com/api?name=test&active=true');
      const obj = parseQueryObject(request);

      expect(obj).toEqual({ name: 'test', active: 'true' });
    });
  });
});

describe('Validation Utilities', () => {
  describe('validateRequired', () => {
    it('should pass when all fields present', () => {
      const data = { name: 'test', email: 'test@example.com', age: 25 };
      const result = validateRequired(data, ['name', 'email']);

      expect(result).toBe(data);
    });

    it('should throw when field is missing', () => {
      const data = { name: 'test' };

      expect(() => validateRequired(data, ['name', 'email'])).toThrow(ApiError);
      expect(() => validateRequired(data, ['name', 'email'])).toThrow('Campi obbligatori mancanti: email');
    });

    it('should throw when field is empty string', () => {
      const data = { name: '' };

      expect(() => validateRequired(data, ['name'])).toThrow('Campi obbligatori mancanti: name');
    });

    it('should throw when field is null', () => {
      const data = { name: null };

      expect(() => validateRequired(data, ['name'])).toThrow(ApiError);
    });

    it('should include all missing fields in error', () => {
      const data = {};

      try {
        validateRequired(data, ['name', 'email', 'age']);
      } catch (error) {
        expect(error.details.missing).toEqual(['name', 'email', 'age']);
      }
    });
  });

  describe('validateEnum', () => {
    it('should pass for valid enum value', () => {
      const result = validateEnum('active', ['active', 'inactive', 'pending'], 'status');

      expect(result).toBe('active');
    });

    it('should throw for invalid enum value', () => {
      expect(() => validateEnum('invalid', ['active', 'inactive'], 'status')).toThrow(ApiError);
      expect(() => validateEnum('invalid', ['active', 'inactive'], 'status')).toThrow('status deve essere uno di: active, inactive');
    });
  });

  describe('validateRange', () => {
    it('should pass for value in range', () => {
      expect(validateRange(3, 1, 5, 'power')).toBe(3);
      expect(validateRange(1, 1, 5, 'power')).toBe(1);
      expect(validateRange(5, 1, 5, 'power')).toBe(5);
    });

    it('should convert string to number', () => {
      expect(validateRange('3', 1, 5, 'power')).toBe(3);
    });

    it('should throw for value below range', () => {
      expect(() => validateRange(0, 1, 5, 'power')).toThrow('power deve essere tra 1 e 5');
    });

    it('should throw for value above range', () => {
      expect(() => validateRange(6, 1, 5, 'power')).toThrow('power deve essere tra 1 e 5');
    });

    it('should throw for non-numeric value', () => {
      expect(() => validateRange('abc', 1, 5, 'power')).toThrow('power deve essere un numero');
    });
  });

  describe('validateEmail', () => {
    it('should pass for valid email', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com');
      expect(validateEmail('user.name@domain.org')).toBe('user.name@domain.org');
    });

    it('should throw for invalid email', () => {
      expect(() => validateEmail('invalid')).toThrow('Formato email non valido');
      expect(() => validateEmail('missing@')).toThrow(ApiError);
      expect(() => validateEmail('@missing.com')).toThrow(ApiError);
    });

    it('should throw for empty email', () => {
      expect(() => validateEmail('')).toThrow(ApiError);
      expect(() => validateEmail(null)).toThrow(ApiError);
    });
  });

  describe('validateString', () => {
    it('should pass for valid string', () => {
      expect(validateString('hello', 'name')).toBe('hello');
    });

    it('should trim whitespace', () => {
      expect(validateString('  hello  ', 'name')).toBe('hello');
    });

    it('should throw for empty string', () => {
      expect(() => validateString('', 'name')).toThrow('name deve essere una stringa non vuota');
      expect(() => validateString('   ', 'name')).toThrow(ApiError);
    });

    it('should throw for non-string', () => {
      expect(() => validateString(123, 'name')).toThrow(ApiError);
      expect(() => validateString(null, 'name')).toThrow(ApiError);
    });
  });

  describe('validateArray', () => {
    it('should pass for valid array', () => {
      expect(validateArray([1, 2, 3], 'items')).toEqual([1, 2, 3]);
    });

    it('should pass for empty array when no minLength', () => {
      expect(validateArray([], 'items')).toEqual([]);
    });

    it('should throw for non-array', () => {
      expect(() => validateArray('not array', 'items')).toThrow('items deve essere un array');
      expect(() => validateArray({}, 'items')).toThrow(ApiError);
    });

    it('should throw when array too short', () => {
      expect(() => validateArray([1], 'items', 3)).toThrow('items deve contenere almeno 3 elementi');
    });
  });

  describe('validateBoolean', () => {
    it('should return true for truthy values', () => {
      expect(validateBoolean(true, 'active')).toBe(true);
      expect(validateBoolean('true', 'active')).toBe(true);
      expect(validateBoolean(1, 'active')).toBe(true);
      expect(validateBoolean('1', 'active')).toBe(true);
    });

    it('should return false for falsy values', () => {
      expect(validateBoolean(false, 'active')).toBe(false);
      expect(validateBoolean('false', 'active')).toBe(false);
      expect(validateBoolean(0, 'active')).toBe(false);
      expect(validateBoolean('0', 'active')).toBe(false);
    });

    it('should throw for invalid boolean', () => {
      expect(() => validateBoolean('yes', 'active')).toThrow('active deve essere un booleano');
      expect(() => validateBoolean(null, 'active')).toThrow(ApiError);
    });
  });
});

describe('Path Parameter Helpers', () => {
  describe('getPathParam', () => {
    it('should return path parameter', async () => {
      const context = { params: Promise.resolve({ id: '123' }) };
      const result = await getPathParam(context, 'id');

      expect(result).toBe('123');
    });

    it('should throw when parameter missing', async () => {
      const context = { params: Promise.resolve({}) };

      await expect(getPathParam(context, 'id')).rejects.toThrow(ApiError);
      await expect(getPathParam(context, 'id')).rejects.toThrow('Parametro id mancante');
    });
  });

  describe('getOptionalPathParam', () => {
    it('should return path parameter when present', async () => {
      const context = { params: Promise.resolve({ id: '123' }) };
      const result = await getOptionalPathParam(context, 'id');

      expect(result).toBe('123');
    });

    it('should return default when parameter missing', async () => {
      const context = { params: Promise.resolve({}) };
      const result = await getOptionalPathParam(context, 'id', 'default-id');

      expect(result).toBe('default-id');
    });

    it('should return null when no default provided', async () => {
      const context = { params: Promise.resolve({}) };
      const result = await getOptionalPathParam(context, 'id');

      expect(result).toBeNull();
    });
  });
});
