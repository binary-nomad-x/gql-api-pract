// ─── On-disk local file models ─────────────────────────────────

export interface WorkflowStepJson {
  stepId: string;
  name: string;
  type: string;
  bodyFile?: string;
  template?: Record<string, unknown>;
  controls?: Record<string, unknown>;
}

export interface WorkflowJson {
  name: string;
  workflowId: string;
  slug: string;
  description?: string;
  tags?: string[];
  active?: boolean;
  steps: WorkflowStepJson[];
  payloadSchema?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  dashboardHash?: string;
}

export interface LayoutJson {
  name: string;
  layoutId: string;
  slug: string;
  description?: string;
  contentType?: string;
  variables?: Array<{ name: string; type: string; defaultValue?: string }>;
  isDefault?: boolean;
  bodyFile?: string;
  content?: string;
  dashboardHash?: string;
}

// ─── Novu v2 API response types ───────────────────────────────

export interface NovuApiWorkflow {
  _id: string;
  name: string;
  workflowId: string;
  slug: string;
  description?: string;
  tags?: string[];
  active: boolean;
  steps: NovuApiStep[];
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NovuApiStep {
  _id: string;
  name: string;
  type: string;
  template?: Record<string, unknown>;
  controls?: Record<string, unknown>;
}

export interface NovuApiLayout {
  _id: string;
  name: string;
  layoutId: string;
  slug: string;
  description?: string;
  contentType?: string;
  variables?: Array<{ name: string; type: string; defaultValue?: string }>;
  isDefault: boolean;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NovuApiListResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Sync results ─────────────────────────────────────────────

export type SyncAction = "create" | "update" | "delete" | "skip" | "error" | "noop";

export interface SyncResult {
  workflowId: string;
  action: SyncAction;
  detail?: string;
}

export interface SyncSummary {
  total: number;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: number;
  results: SyncResult[];
}
