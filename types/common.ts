/**
 * Shared type definitions used across multiple API modules
 * (registry, rooms, automations).
 */

/** Paginated response wrapper from HA proxy API */
export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}
