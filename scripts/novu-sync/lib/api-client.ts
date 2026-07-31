import { request as httpsRequest, RequestOptions } from "node:https";
import { request as httpRequest } from "node:http";
import { config } from "./config.js";
import { RunLogger } from "./logger.js";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function parseUrl(base: string, path: string): URL {
  return new URL(path, base.endsWith("/") ? base : base + "/");
}

function httpRequestPromise(url: URL, options: RequestOptions, body?: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = mod(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        resolve({ statusCode: res.statusCode ?? 500, body });
      });
    });
    req.on("error", (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}

export class NovuApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly log: RunLogger;

  constructor(log: RunLogger) {
    this.log = log;
    this.apiKey = config.novuApiKey;
    this.baseUrl = config.novuApiUrl;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.apiKey) throw new ApiError(401, "NOVU_API_SECRET_KEY is not set in .env");

    const url = parseUrl(this.baseUrl, path);
    const headers: Record<string, string> = {
      Authorization: `ApiKey ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const options: RequestOptions = {
          method,
          headers,
          timeout: 15000,
        };

        const jsonBody = body ? JSON.stringify(body) : undefined;
        if (jsonBody) headers["Content-Length"] = Buffer.byteLength(jsonBody).toString();

        const res = await httpRequestPromise(url, { ...options, headers }, jsonBody);

        if (res.statusCode === 429 || (res.statusCode >= 500 && res.statusCode < 600)) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            this.log.warn(`Retry ${attempt}/${maxRetries} after ${res.statusCode}`, { path, delayMs: Math.round(delay) });
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
        }

        if (res.statusCode === 401) throw new ApiError(401, "Authentication failed — check NOVU_API_SECRET_KEY");
        if (res.statusCode === 404) throw new ApiError(404, `Not found: ${path}`);
        if (res.statusCode === 409) throw new ApiError(409, `Conflict: ${res.body}`);

        if (res.statusCode! >= 400) {
          let parsed: unknown;
          try { parsed = JSON.parse(res.body); } catch { parsed = res.body; }
          throw new ApiError(res.statusCode!, `API error: ${res.body}`, parsed);
        }

        if (!res.body) return undefined as T;
        return JSON.parse(res.body) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof ApiError && err.statusCode !== 429 && (err.statusCode < 500 || err.statusCode >= 600)) {
          throw err;
        }
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
          this.log.warn(`Retry ${attempt}/${maxRetries} after error`, { error: lastError.message, delayMs: delay });
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  // ─── Notification groups ────────────────────────────────────
  async listNotificationGroups(): Promise<Array<Record<string, unknown>>> {
    return this.request("GET", "/v1/notification-groups");
  }

  // ─── Workflows (Novu v2 API) ────────────────────────────────

  async listWorkflows(page = 0, limit = 50): Promise<{ data: Array<Record<string, unknown>>; totalCount: number }> {
    const raw = await this.request<{ data: { workflows: Array<Record<string, unknown>>; totalCount: number } }>(
      "GET",
      `/v2/workflows?limit=${limit}`,
    );
    return { data: raw.data?.workflows ?? [], totalCount: raw.data?.totalCount ?? 0 };
  }

  async getWorkflow(workflowId: string): Promise<Record<string, unknown>> {
    const raw = await this.request<{ data: Record<string, unknown> }>("GET", `/v2/workflows/${workflowId}`);
    return raw.data ?? {};
  }

  async createWorkflow(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const raw = await this.request<{ data: Record<string, unknown> }>("POST", "/v2/workflows", data);
    return raw.data ?? {};
  }

  async updateWorkflow(workflowId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const raw = await this.request<{ data: Record<string, unknown> }>("PUT", `/v2/workflows/${workflowId}`, data);
    return raw.data ?? {};
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.request("DELETE", `/v2/workflows/${workflowId}`);
  }

  // ─── Layouts ─────────────────────────────────────────────────
  async listLayouts(page = 0, limit = 50): Promise<{ data: Array<Record<string, unknown>>; totalCount: number }> {
    return this.request("GET", `/v1/layouts?page=${page}&limit=${limit}`);
  }

  async getLayout(layoutId: string): Promise<Record<string, unknown>> {
    const raw = await this.request<{ data?: Record<string, unknown> }>("GET", `/v1/layouts/${layoutId}`);
    return (raw?.data ?? raw) as Record<string, unknown>;
  }

  async createLayout(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request("POST", "/v1/layouts", data);
  }

  async updateLayout(layoutId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request("PUT", `/v1/layouts/${layoutId}`, data);
  }

  async deleteLayout(layoutId: string): Promise<void> {
    return this.request("DELETE", `/v1/layouts/${layoutId}`);
  }
}
