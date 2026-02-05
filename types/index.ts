/**
 * Pannello Stufa - Shared Type Definitions
 *
 * Usage:
 *   import type { StoveState, ApiResponse } from '@/types';
 *   import { isApiSuccess } from '@/types';
 *
 * Or import from specific subdirectories:
 *   import type { StoveState } from '@/types/firebase';
 *   import type { ApiResponse } from '@/types/api';
 */

// Firebase data structure types
export * from './firebase';

// API response/error types
export * from './api';
