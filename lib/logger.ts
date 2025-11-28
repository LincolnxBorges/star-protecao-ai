/**
 * Simple logging system for the application
 * Logs are stored in memory with a configurable limit
 * In production, this could be extended to use external services
 */

export type LogLevel = "debug" | "info" | "warning" | "error";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  source?: string;
}

// In-memory log storage (configurable limit)
const MAX_LOGS = 1000;
const logs: LogEntry[] = [];

// Minimum log level to store (can be configured via system settings)
let minLogLevel: LogLevel = "info";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
};

function generateId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLogLevel];
}

function addLog(entry: Omit<LogEntry, "id" | "timestamp">): LogEntry {
  const logEntry: LogEntry = {
    id: generateId(),
    timestamp: new Date(),
    ...entry,
  };

  logs.unshift(logEntry);

  // Trim logs if exceeding limit
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }

  // Also output to console in development
  if (process.env.NODE_ENV === "development") {
    const levelColors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m", // green
      warning: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";
    const color = levelColors[entry.level];
    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ${entry.source ? `[${entry.source}] ` : ""}${entry.message}`,
      entry.context || ""
    );
  }

  return logEntry;
}

/**
 * Set the minimum log level to store
 */
export function setLogLevel(level: LogLevel): void {
  minLogLevel = level;
}

/**
 * Get the current minimum log level
 */
export function getLogLevel(): LogLevel {
  return minLogLevel;
}

/**
 * Log a debug message
 */
export function debug(
  message: string,
  context?: Record<string, unknown>,
  source?: string
): LogEntry | null {
  if (!shouldLog("debug")) return null;
  return addLog({ level: "debug", message, context, source });
}

/**
 * Log an info message
 */
export function info(
  message: string,
  context?: Record<string, unknown>,
  source?: string
): LogEntry | null {
  if (!shouldLog("info")) return null;
  return addLog({ level: "info", message, context, source });
}

/**
 * Log a warning message
 */
export function warning(
  message: string,
  context?: Record<string, unknown>,
  source?: string
): LogEntry | null {
  if (!shouldLog("warning")) return null;
  return addLog({ level: "warning", message, context, source });
}

/**
 * Log an error message
 */
export function error(
  message: string,
  context?: Record<string, unknown>,
  source?: string
): LogEntry | null {
  if (!shouldLog("error")) return null;
  return addLog({ level: "error", message, context, source });
}

/**
 * Get all logs, optionally filtered by level
 */
export function getLogs(options?: {
  level?: LogLevel;
  source?: string;
  limit?: number;
  since?: Date;
}): LogEntry[] {
  let filtered = [...logs];

  if (options?.level) {
    filtered = filtered.filter((log) => log.level === options.level);
  }

  if (options?.source) {
    filtered = filtered.filter((log) => log.source === options.source);
  }

  if (options?.since) {
    const since = options.since;
    filtered = filtered.filter((log) => log.timestamp >= since);
  }

  if (options?.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Get log statistics
 */
export function getLogStats(): {
  total: number;
  byLevel: Record<LogLevel, number>;
  oldestTimestamp?: Date;
  newestTimestamp?: Date;
} {
  const stats = {
    total: logs.length,
    byLevel: {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
    } as Record<LogLevel, number>,
    oldestTimestamp: logs.length > 0 ? logs[logs.length - 1].timestamp : undefined,
    newestTimestamp: logs.length > 0 ? logs[0].timestamp : undefined,
  };

  for (const log of logs) {
    stats.byLevel[log.level]++;
  }

  return stats;
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
  logs.length = 0;
}

/**
 * Clear logs older than the specified date
 */
export function clearOldLogs(olderThan: Date): number {
  const initialLength = logs.length;
  const cutoffIndex = logs.findIndex((log) => log.timestamp < olderThan);

  if (cutoffIndex !== -1) {
    logs.splice(cutoffIndex);
  }

  return initialLength - logs.length;
}

// Export a logger object for convenient usage
export const logger = {
  debug,
  info,
  warning,
  error,
  getLogs,
  getLogStats,
  clearLogs,
  clearOldLogs,
  setLogLevel,
  getLogLevel,
};

export default logger;
