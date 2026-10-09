/**
 * Automations Proxy Client
 *
 * Thin wrapper around the shared HA proxy client.
 * No response transformation — all endpoints return data directly as-is.
 * Auth is handled by haGet/haPost/haPatch/haDelete via X-API-Key header.
 *
 * Endpoints:
 *   /api/v1/automations                      - GET list, POST create
 *   /api/v1/automations/{rule_id}            - GET single, PATCH update, DELETE
 *   /api/v1/automations/{rule_id}/history - GET execution history
 *   /api/v1/automations/{rule_id}/trigger  - POST run the actions now
 *   /api/v1/automations/{rule_id}/evaluate - POST dry-run the conditions
 *   /api/v1/automations/sensors            - GET sensors a condition can read
 */

import { haGet, haPost, haPatch, haDelete } from '@/lib/haClient';
import type { PaginatedResponse } from '@/types/common';
import type {
  AutomationRule,
  AutomationCreate,
  AutomationUpdate,
  AutomationExecution,
  TriggerResponse,
  EvaluateResponse,
  AutomationSensorsResponse,
} from '@/types/automations';

/** Get paginated list of automation rules */
async function getAutomations(params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<AutomationRule>> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  if (params?.offset !== undefined) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return haGet<PaginatedResponse<AutomationRule>>(
    `/api/v1/automations${query ? `?${query}` : ''}`
  );
}

/** Create a new automation rule */
async function createAutomation(body: AutomationCreate): Promise<AutomationRule> {
  return haPost<AutomationRule>('/api/v1/automations', body as unknown as Record<string, unknown>);
}

/** Get a single automation rule by ID */
async function getAutomation(ruleId: string): Promise<AutomationRule> {
  return haGet<AutomationRule>(`/api/v1/automations/${ruleId}`);
}

/** Update an automation rule */
async function updateAutomation(ruleId: string, body: AutomationUpdate): Promise<AutomationRule> {
  return haPatch<AutomationRule>(`/api/v1/automations/${ruleId}`, body as unknown as Record<string, unknown>);
}

/** Delete an automation rule */
async function deleteAutomation(ruleId: string): Promise<void> {
  return haDelete(`/api/v1/automations/${ruleId}`);
}

/** Get paginated execution history for an automation rule */
async function getExecutions(ruleId: string, params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<AutomationExecution>> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  if (params?.offset !== undefined) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return haGet<PaginatedResponse<AutomationExecution>>(
    `/api/v1/automations/${ruleId}/history${query ? `?${query}` : ''}`
  );
}

/** Run the saved rule's actions now, bypassing conditions and safety guards */
async function triggerAutomation(ruleId: string): Promise<TriggerResponse> {
  return haPost<TriggerResponse>(`/api/v1/automations/${ruleId}/trigger`, {});
}

/** Dry-run the saved rule's condition tree (no action runs, nothing is logged) */
async function evaluateAutomation(ruleId: string): Promise<EvaluateResponse> {
  return haPost<EvaluateResponse>(`/api/v1/automations/${ruleId}/evaluate`, {});
}

/** Sensors the engine can read in a condition, with name and current value (ROADMAP M70) */
async function getSensors(): Promise<AutomationSensorsResponse> {
  return haGet<AutomationSensorsResponse>('/api/v1/automations/sensors');
}

/** Automations proxy client */
export const automationsProxy = {
  getAutomations,
  createAutomation,
  getAutomation,
  updateAutomation,
  deleteAutomation,
  getExecutions,
  triggerAutomation,
  evaluateAutomation,
  getSensors,
};
