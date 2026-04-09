export interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  last_execution_at?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface AutomationCreate {
  name: string;
  description?: string | null;
  enabled?: boolean;
}

export interface AutomationUpdate {
  name?: string;
  description?: string | null;
  enabled?: boolean;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  status: 'success' | 'failure' | 'running';
  started_at: string;
  duration_ms?: number | null;
  error_message?: string | null;
}
