import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { NovuApiClient, NovuApiError } from "@gql-prisma-api/lib/novu-api.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

const TEMPLATES_DIR = resolve(process.cwd(), "templates", "novu");
const WORKFLOWS_DIR = join(TEMPLATES_DIR, "workflows");
const LAYOUTS_DIR = join(TEMPLATES_DIR, "layouts");

export type TemplateType = "workflow" | "layout";

export interface TemplateSummary {
  type: TemplateType;
  slug: string;
  name: string;
  local: boolean;
  remote: boolean;
  synced: boolean;
}

export interface TemplateDetail {
  type: TemplateType;
  slug: string;
  name: string;
  local?: Record<string, unknown> | null;
  remote?: Record<string, unknown> | null;
}

export interface TemplateInput {
  name: string;
  description?: string;
  tags?: string[];
  active?: boolean;
  data?: Record<string, unknown>;
}

export interface TemplatePushResult {
  slug: string;
  action: "created" | "updated" | "skipped" | "error";
  detail?: string;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readJsonFile(file: string): Record<string, unknown> | null {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function writeJsonFile(file: string, data: unknown): void {
  ensureDir(dirnameOf(file));
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function dirnameOf(file: string): string {
  const i = file.lastIndexOf("/");
  const j = file.lastIndexOf("\\");
  const k = Math.max(i, j);
  return k === -1 ? "." : file.slice(0, k);
}

function workflowToFile(wf: Record<string, unknown>): Record<string, unknown> {
  return {
    slug: wf.slug ?? wf.workflowId ?? wf._id ?? "",
    workflowId: wf.workflowId ?? wf._id ?? "",
    name: wf.name ?? "",
    description: wf.description ?? "",
    tags: wf.tags ?? [],
    active: wf.active ?? true,
    steps: wf.steps ?? [],
    preferences: wf.preferences ?? undefined,
  };
}

function layoutToFile(layout: Record<string, unknown>): Record<string, unknown> {
  return {
    slug: layout.slug ?? layout.layoutId ?? layout._id ?? "",
    layoutId: layout.layoutId ?? layout._id ?? "",
    name: layout.name ?? "",
    description: layout.description ?? "",
    contentType: layout.contentType ?? "customHtml",
    variables: layout.variables ?? [],
    isDefault: layout.isDefault ?? false,
    content: layout.content ?? "",
  };
}

export class NovuTemplateService {
  private readonly api: NovuApiClient;

  constructor(api?: NovuApiClient) {
    this.api = api ?? new NovuApiClient();
  }

  // ─── Pull ────────────────────────────────────────────────────

  async pullAll(): Promise<{ workflows: number; layouts: number }> {
    ensureDir(WORKFLOWS_DIR);
    ensureDir(LAYOUTS_DIR);

    let workflowCount = 0;
    let layoutCount = 0;

    const wfData = await this.api.listWorkflows();
    for (const wf of wfData.data) {
      const file = workflowToFile(wf);
      writeJsonFile(join(WORKFLOWS_DIR, `${file.slug}.json`), file);
      workflowCount++;
    }

    const layoutData = await this.api.listLayouts();
    for (const layout of layoutData.data) {
      const file = layoutToFile(layout);
      writeJsonFile(join(LAYOUTS_DIR, `${file.slug}.json`), file);
      layoutCount++;
    }

    logger.info("Pulled Novu templates", { workflows: workflowCount, layouts: layoutCount });
    return { workflows: workflowCount, layouts: layoutCount };
  }

  async pullWorkflow(slug: string): Promise<boolean> {
    const data = await this.api.getWorkflow(slug);
    const file = workflowToFile(data);
    writeJsonFile(join(WORKFLOWS_DIR, `${file.slug}.json`), file);
    logger.info("Pulled Novu workflow template", { slug });
    return true;
  }

  async pullLayout(slug: string): Promise<boolean> {
    const data = await this.api.getLayout(slug);
    const file = layoutToFile(data);
    writeJsonFile(join(LAYOUTS_DIR, `${file.slug}.json`), file);
    logger.info("Pulled Novu layout template", { slug });
    return true;
  }

  // ─── List ────────────────────────────────────────────────────

  async list(): Promise<TemplateSummary[]> {
    const results: TemplateSummary[] = [];

    // Workflows
    ensureDir(WORKFLOWS_DIR);
    const localWorkflowSlugs = readdirSync(WORKFLOWS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));

    let remoteWorkflows: Array<Record<string, unknown>> = [];
    try {
      const data = await this.api.listWorkflows();
      remoteWorkflows = data.data;
    } catch (err) {
      logger.warning("Failed to list remote workflows", { error: String(err) });
    }

    const workflowSlugOf = (w: Record<string, unknown>): string => ((w.slug ?? w.workflowId ?? w._id) as string) ?? "";
    const remoteWorkflowSlugs = new Set(remoteWorkflows.map(workflowSlugOf).filter(Boolean));
    const allWorkflowSlugs = new Set([...localWorkflowSlugs, ...remoteWorkflowSlugs]);

    for (const slug of allWorkflowSlugs) {
      const local = localWorkflowSlugs.includes(slug);
      const remote = remoteWorkflowSlugs.has(slug);
      const name = remote
        ? (remoteWorkflows.find((w) => workflowSlugOf(w) === slug)?.name as string)
        : (readJsonFile(join(WORKFLOWS_DIR, `${slug}.json`))?.name as string) ?? slug;
      results.push({ type: "workflow", slug, name, local, remote, synced: local && remote });
    }

    // Layouts
    ensureDir(LAYOUTS_DIR);
    const localLayoutSlugs = readdirSync(LAYOUTS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));

    let remoteLayouts: Array<Record<string, unknown>> = [];
    try {
      const data = await this.api.listLayouts();
      remoteLayouts = data.data;
    } catch (err) {
      logger.warning("Failed to list remote layouts", { error: String(err) });
    }

    const layoutSlugOf = (l: Record<string, unknown>): string => ((l.slug ?? l.layoutId ?? l._id) as string) ?? "";
    const remoteLayoutSlugs = new Set(remoteLayouts.map(layoutSlugOf).filter(Boolean));
    const allLayoutSlugs = new Set([...localLayoutSlugs, ...remoteLayoutSlugs]);

    for (const slug of allLayoutSlugs) {
      const local = localLayoutSlugs.includes(slug);
      const remote = remoteLayoutSlugs.has(slug);
      const name = remote
        ? (remoteLayouts.find((l) => layoutSlugOf(l) === slug)?.name as string)
        : (readJsonFile(join(LAYOUTS_DIR, `${slug}.json`))?.name as string) ?? slug;
      results.push({ type: "layout", slug, name, local, remote, synced: local && remote });
    }

    return results.sort((a, b) => `${a.type}:${a.slug}`.localeCompare(`${b.type}:${b.slug}`));
  }

  // ─── Get ─────────────────────────────────────────────────────

  async get(type: TemplateType, slug: string): Promise<TemplateDetail> {
    const localFile = type === "workflow" ? join(WORKFLOWS_DIR, `${slug}.json`) : join(LAYOUTS_DIR, `${slug}.json`);
    const local = readJsonFile(localFile);

    let remote: Record<string, unknown> | null = null;
    try {
      const data = type === "workflow" ? await this.api.getWorkflow(slug) : await this.api.getLayout(slug);
      remote = data;
    } catch {
      remote = null;
    }

    const name = (local?.name as string) ?? (remote?.name as string) ?? slug;
    return { type, slug, name, local, remote };
  }

  // ─── Create / update local template files ────────────────────

  createOrUpdateLocal(type: TemplateType, slug: string, input: TemplateInput): boolean {
    const dir = type === "workflow" ? WORKFLOWS_DIR : LAYOUTS_DIR;
    ensureDir(dir);
    const file = join(dir, `${slug}.json`);

    const existing = readJsonFile(file) ?? {};
    const next: Record<string, unknown> = {
      ...existing,
      slug,
      name: input.name ?? existing.name ?? slug,
      description: input.description ?? existing.description ?? "",
      tags: input.tags ?? existing.tags ?? [],
      active: input.active ?? existing.active ?? true,
      ...(input.data ?? {}),
    };

    writeJsonFile(file, next);
    logger.info("Saved Novu template locally", { type, slug });
    return true;
  }

  // ─── Push to Novu ────────────────────────────────────────────

  async push(slug?: string): Promise<TemplatePushResult[]> {
    const results: TemplatePushResult[] = [];

    ensureDir(WORKFLOWS_DIR);
    ensureDir(LAYOUTS_DIR);

    const workflowFiles = readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of workflowFiles) {
      const itemSlug = file.replace(/\.json$/, "");
      if (slug && itemSlug !== slug) continue;
      results.push(await this.pushWorkflowFile(join(WORKFLOWS_DIR, file), itemSlug));
    }

    const layoutFiles = readdirSync(LAYOUTS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of layoutFiles) {
      const itemSlug = file.replace(/\.json$/, "");
      if (slug && itemSlug !== slug) continue;
      results.push(await this.pushLayoutFile(join(LAYOUTS_DIR, file), itemSlug));
    }

    return results;
  }

  private async pushWorkflowFile(file: string, slug: string): Promise<TemplatePushResult> {
    const data = readJsonFile(file);
    if (!data) {
      logger.warning("Skipping invalid workflow template file", { slug });
      return { slug, action: "error", detail: "Invalid JSON" };
    }

    const steps = (data.steps as Array<Record<string, unknown>> ?? []).map((s) => ({
      name: s.name ?? "Step",
      type: s.type ?? "email",
      template: s.template ?? {},
      controls: s.controls ?? {},
    }));

    try {
      const remote = await this.api.getWorkflow(slug);
      await this.api.updateWorkflow(remote._id as string, {
        name: data.name,
        description: data.description,
        tags: data.tags ?? [],
        active: data.active ?? true,
        steps,
      });
      logger.info("Updated Novu workflow template", { slug });
      return { slug, action: "updated" };
    } catch (err) {
      if (err instanceof NovuApiError && err.statusCode === 404) {
        const notificationGroupId = (data.notificationGroupId as string) ?? (await this.resolveNotificationGroupId());
        if (!notificationGroupId) {
          logger.error("No notification group available for Novu workflow creation", { slug });
          return { slug, action: "error", detail: "No notification group available" };
        }
        const created = await this.api.createWorkflow({
          name: data.name,
          slug,
          description: data.description,
          tags: data.tags ?? [],
          active: data.active ?? true,
          notificationGroupId,
          steps,
        });
        logger.info("Created Novu workflow template", { slug });
        return { slug, action: "created", detail: (created.workflowId as string) ?? undefined };
      }
      logger.error("Failed to push Novu workflow template", { slug, error: String(err) });
      return { slug, action: "error", detail: String(err) };
    }
  }

  private async resolveNotificationGroupId(): Promise<string | undefined> {
    try {
      const groups = await this.api.listNotificationGroups();
      return (groups[0]?._id as string) ?? undefined;
    } catch (err) {
      logger.warning("Failed to list Novu notification groups", { error: String(err) });
      return undefined;
    }
  }

  private async pushLayoutFile(file: string, slug: string): Promise<TemplatePushResult> {
    const data = readJsonFile(file);
    if (!data) {
      logger.warning("Skipping invalid layout template file", { slug });
      return { slug, action: "error", detail: "Invalid JSON" };
    }

    const payload = {
      name: data.name,
      description: data.description,
      contentType: data.contentType ?? "customHtml",
      variables: data.variables ?? [],
      isDefault: data.isDefault ?? false,
      content: data.content ?? "",
    };

    try {
      const remote = await this.api.getLayout(slug);
      await this.api.updateLayout(remote._id as string, payload);
      logger.info("Updated Novu layout template", { slug });
      return { slug, action: "updated" };
    } catch (err) {
      if (err instanceof NovuApiError && err.statusCode === 404) {
        const created = await this.api.createLayout({ ...payload, slug });
        logger.info("Created Novu layout template", { slug });
        return { slug, action: "created", detail: (created.layoutId as string) ?? undefined };
      }
      logger.error("Failed to push Novu layout template", { slug, error: String(err) });
      return { slug, action: "error", detail: String(err) };
    }
  }

  // ─── Delete ──────────────────────────────────────────────────

  async delete(type: TemplateType, slug: string): Promise<{ local: boolean; remote: boolean }> {
    let localDeleted = false;
    const file = type === "workflow" ? join(WORKFLOWS_DIR, `${slug}.json`) : join(LAYOUTS_DIR, `${slug}.json`);
    if (existsSync(file)) {
      rmSync(file, { force: true });
      localDeleted = true;
    }

    let remoteDeleted = false;
    try {
      if (type === "workflow") {
        const remote = await this.api.getWorkflow(slug);
        await this.api.deleteWorkflow(remote._id as string);
      } else {
        const remote = await this.api.getLayout(slug);
        await this.api.deleteLayout(remote._id as string);
      }
      remoteDeleted = true;
    } catch (err) {
      if (err instanceof NovuApiError && err.statusCode === 404) {
        logger.info("Template already absent remotely", { type, slug });
      } else {
        logger.error("Failed to delete remote template", { type, slug, error: String(err) });
      }
    }

    logger.info("Deleted Novu template", { type, slug, local: localDeleted, remote: remoteDeleted });
    return { local: localDeleted, remote: remoteDeleted };
  }
}
