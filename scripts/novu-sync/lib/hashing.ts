import { createHash } from "node:crypto";
import type { WorkflowJson, LayoutJson } from "./types.js";

export function hashWorkflow(wf: WorkflowJson): string {
  const copy = { ...wf, dashboardHash: undefined };
  return hashJson(copy);
}

export function hashLayout(layout: LayoutJson): string {
  const copy = { ...layout, dashboardHash: undefined };
  return hashJson(copy);
}

export function hashJson(data: unknown): string {
  const json = JSON.stringify(data, Object.keys(data as object).sort());
  return createHash("sha256").update(json).digest("hex").slice(0, 12);
}
