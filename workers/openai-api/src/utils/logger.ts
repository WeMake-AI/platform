/**
 * Logging utilities for Cloudflare Workers
 */

import type { Env } from "../types/env";

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Log entry interface
 */
/**
 * Metadata type for logging - allows primitive values and nested objects
 */
export type LogMetadata = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId: string | undefined;
  userId: string | undefined;
  metadata: LogMetadata | undefined;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private requestId: string | undefined;
  private userId: string | undefined;
  private env: Env | undefined;

  constructor(options?: {
    requestId?: string | undefined;
    userId?: string | undefined;
    env?: Env | undefined;
  }) {
    this.requestId = options?.requestId;
    this.userId = options?.userId;
    this.env = options?.env;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: {
    requestId?: string | undefined;
    userId?: string | undefined;
  }): Logger {
    return new Logger({
      requestId: context.requestId ?? this.requestId,
      userId: context.userId ?? this.userId,
      env: this.env
    });
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    const errorMetadata = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          ...metadata
        }
      : metadata;

    this.log(LogLevel.ERROR, message, errorMetadata);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.requestId || "unknown",
      userId: this.userId,
      metadata
    };

    // Format for console output
    const levelName = LogLevel[level];
    const prefix = `[${entry.timestamp}] ${levelName}`;
    const context = this.requestId ? ` [${this.requestId}]` : "";
    const user = this.userId ? ` [user:${this.userId}]` : "";

    const logMessage = `${prefix}${context}${user}: ${message}`;

    // Output to console based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, metadata || "");
        break;
      case LogLevel.INFO:
        console.info(logMessage, metadata || "");
        break;
      case LogLevel.WARN:
        console.warn(logMessage, metadata || "");
        break;
      case LogLevel.ERROR:
        console.error(logMessage, metadata || "");
        break;
    }

    // TODO: Send to external logging service if configured
    // if (this.env?.LOG_ENDPOINT) {
    //   this.sendToExternalLogger(entry);
    // }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(options?: {
  requestId?: string;
  userId?: string | undefined;
  env?: Env;
}): Logger {
  return new Logger(options);
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Log request timing
 */
export function logTiming(
  operation: string,
  startTime: number,
  metadata?: LogMetadata
): void {
  const duration = Date.now() - startTime;
  logger.info(`${operation} completed`, {
    duration_ms: duration,
    ...metadata
  });
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  requestId?: string,
  metadata?: LogMetadata
): void {
  const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
  const message = `${method} ${path} - ${statusCode} (${duration}ms)`;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: requestId || "unknown",
    userId: undefined,
    metadata: {
      method,
      path,
      statusCode,
      duration,
      ...metadata
    }
  };

  // Output based on level
  if (level === LogLevel.WARN) {
    console.warn(message, entry.metadata);
  } else {
    console.info(message, entry.metadata);
  }
}
