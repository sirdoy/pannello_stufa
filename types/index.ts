/**
 * Pannello Stufa - Shared Type Definitions
 *
 * Usage:
 *   import type { StoveState, ApiResponse, ButtonBaseProps } from '@/types';
 *   import { isApiSuccess } from '@/types';
 *
 * Or import from specific subdirectories:
 *   import type { StoveState } from '@/types/firebase';
 *   import type { ApiResponse } from '@/types/api';
 *   import type { ButtonBaseProps } from '@/types/components';
 *   import type { AppConfig } from '@/types/config';
 */

// Firebase data structure types
export * from './firebase';

// API response/error types
export * from './api';

// Component prop types
export * from './components';

// Configuration types
export * from './config';
