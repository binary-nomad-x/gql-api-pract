import * as fs from "node:fs";
import * as path from "node:path";

export type LogLevel = "debug" | "info" | "notice" | "warning" | "error" | "critical" | "alert" | "emergency";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  notice: 2,
  warning: 3,
  error: 4,
  critical: 5,
  alert: 6,
  emergency: 7,
};

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  notice: "NOTICE",
  warning: "WARNING",
  error: "ERROR",
  critical: "CRITICAL",
  alert: "ALERT",
  emergency: "EMERGENCY",
};

const LOG_DIR = path.resolve(process.cwd(), "logs");
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "debug";

class Logger {
  private get env(): string {
    return process.env.NODE_ENV || "development";
  }

  private log(level: LogLevel, message: string, meta?: unknown): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const metaStr = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
    const line = `[${timestamp}] ${this.env}.${LOG_LEVEL_NAMES[level]}: ${message}${metaStr}\n`;

    if (LEVEL_PRIORITY[level] >= LEVEL_PRIORITY["error"]) {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }

    this.writeToFile(line);
  }

  private writeToFile(line: string): void {
    try {
      if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
      const date = new Date().toISOString().slice(0, 10);
      const filePath = path.join(LOG_DIR, `laravel-${date}.log`);
      fs.appendFileSync(filePath, line, "utf-8");
    } catch {
      // Silently fail - logging should never crash the app
    }
  }

  debug(message: string, meta?: unknown): void {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.log("info", message, meta);
  }

  notice(message: string, meta?: unknown): void {
    this.log("notice", message, meta);
  }

  warning(message: string, meta?: unknown): void {
    this.log("warning", message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.log("error", message, meta);
  }

  critical(message: string, meta?: unknown): void {
    this.log("critical", message, meta);
  }

  alert(message: string, meta?: unknown): void {
    this.log("alert", message, meta);
  }

  emergency(message: string, meta?: unknown): void {
    this.log("emergency", message, meta);
  }
}

export const logger = new Logger();
