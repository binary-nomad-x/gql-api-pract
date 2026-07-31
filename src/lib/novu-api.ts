import { request as httpsRequest } from "node:https";
import { request as httpRequest, RequestOptions } from "node:http";
import { logger } from "@gql-prisma-api/utils/logger.js";

export class NovuApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "NovuApiError";
  }
}

function requestPromise(url: URL, options: RequestOptions, body?: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = mod(url, options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        resolve({ statusCode: res.statusCode ?? 500, body: Buffer.concat(chunks).toString("utf-8") });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export class NovuApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? process.env.NOVU_API_SECRET_KEY ?? "";
    this.baseUrl = (baseUrl ?? process.env.NOVU_API_HOST_NAME ?? "https://api.novu.co").replace(/\/+$/, "");
  }

  hasCredentials(): boolean {
    return this.apiKey.length > 0;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.apiKey) throw new NovuApiError(401, "NOVU_API_SECRET_KEY is not set");

    const url = new URL(path, this.baseUrl.endsWith("/") ? this.baseUrl : this.baseUrl + "/");
    const headers: Record<string, string> = {
      Authorization: `ApiKey ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const jsonBody = body ? JSON.stringify(body) : undefined;
        if (jsonBody) headers["Content-Length"] = Buffer.byteLength(jsonBody).toString();

        const res = await requestPromise(url, { method, headers, timeout: 15000 }, jsonBody);

        if (res.statusCode === 429 || (res.statusCode >= 500 && res.statusCode < 600)) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 500 + Math.random() * 1000;
            logger.warning(`Novu API retry ${attempt}/${maxRetries}`, { status: res.statusCode, delayMs: Math.round(delay) });
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
        }

        if (res.statusCode === 401) throw new NovuApiError(401, "Authentication failed — check NOVU_API_SECRET_KEY");
        if (res.statusCode === 404) throw new NovuApiError(404, `Not found: ${path}`);

        if (res.statusCode! >= 400) {
          let parsed: unknown;
          try { parsed = JSON.parse(res.body); } catch { parsed = res.body; }
          throw new NovuApiError(res.statusCode!, `Novu API error: ${res.body}`, parsed);
        }

        if (!res.body) return undefined as T;
        return JSON.parse(res.body) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof NovuApiError && err.statusCode !== 429 && err.statusCode < 500) throw err;
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
        }
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  // ─── Notification groups ─────────────────────────────────────
  async listNotificationGroups(): Promise<Array<Record<string, unknown>>> {
    return this.request("GET", "/v1/notification-groups");
  }

  // ─── Workflows (templates) ───────────────────────────────────
  async listWorkflows(page = 0, limit = 50): Promise<{ data: Array<Record<string, unknown>>; totalCount: number }> {
    return this.request("GET", `/v1/workflows?page=${page}&limit=${limit}`);
  }

  async getWorkflow(workflowId: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/v1/workflows/${workflowId}`);
  }

  async createWorkflow(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request("POST", "/v1/workflows", data);
  }

  async updateWorkflow(workflowId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request("PUT", `/v1/workflows/${workflowId}`, data);
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    return this.request("DELETE", `/v1/workflows/${workflowId}`);
  }

  // ─── Layouts ─────────────────────────────────────────────────
  async listLayouts(page = 0, limit = 50): Promise<{ data: Array<Record<string, unknown>>; totalCount: number }> {
    return this.request("GET", `/v1/layouts?page=${page}&limit=${limit}`);
  }

  async getLayout(layoutId: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/v1/layouts/${layoutId}`);
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
