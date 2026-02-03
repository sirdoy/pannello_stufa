'use client';

import { useState, useEffect } from 'react';

/**
 * useDebounce Hook - Ember Noir Design System
 *
 * Debounces a value by specified delay. Returns debounced value that updates
 * only after delay ms of no changes. Useful for search input to prevent
 * excessive API calls.
 *
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default 300ms)
 * @returns {any} Debounced value
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 *
 * useEffect(() => {
 *   if (debouncedQuery && debouncedQuery.length >= 3) {
 *     fetchCities(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear timeout if value or delay changes before timeout fires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
