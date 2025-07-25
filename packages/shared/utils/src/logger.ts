/**
 * Comprehensive Structured Logging System
 * Supports multilingual applications with proper error tracking
 * Compatible with PowerShell (no unicode icons)
 */

import { randomUUID } from "crypto";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogContext {
  userId?: string;
  companyId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  userAgent?: string;
  ip?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  language?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memory?: number;
  };
  service: string;
  version?: string;
}

class StructuredLogger {
  private service: string;
  private version: string;
  private minLevel: LogLevel;
  private correlationId: string;

  constructor(service: string, version = "1.0.0", minLevel = LogLevel.INFO) {
    this.service = service;
    this.version = version;
    this.minLevel = minLevel;
    this.correlationId = randomUUID();
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error,
    duration?: number
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context: {
        ...context,
        correlationId: context.correlationId || this.correlationId,
      },
      service: this.service,
      version: this.version,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    if (duration !== undefined) {
      entry.performance = {
        duration,
        memory: process.memoryUsage().heapUsed,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const levelNames = ["DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"];
    const levelName = levelNames[entry.level];

    // PowerShell-compatible output (no unicode icons)
    const prefix = `[${entry.timestamp}] [${levelName}] [${entry.service}]`;

    if (entry.level >= LogLevel.ERROR) {
      console.error(`${prefix} ${entry.message}`, entry.context, entry.error);
    } else if (entry.level >= LogLevel.WARN) {
      console.warn(`${prefix} ${entry.message}`, entry.context);
    } else {
      console.log(`${prefix} ${entry.message}`, entry.context);
    }

    // In production, also send to structured logging service
    if (process.env.NODE_ENV === "production") {
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry): void {
    // Send to external logging service (e.g., ELK, Datadog, etc.)
    // Implementation depends on your logging infrastructure
    try {
      // Example: POST to logging endpoint
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      // Fail silently to avoid logging loops
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.output(entry);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      this.output(entry);
    }
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context, error);
      this.output(entry);
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(
        LogLevel.ERROR,
        message,
        context,
        error
      );
      this.output(entry);
    }
  }

  critical(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.CRITICAL)) {
      const entry = this.createLogEntry(
        LogLevel.CRITICAL,
        message,
        context,
        error
      );
      this.output(entry);
    }
  }

  // Performance logging
  time(label: string, context?: LogContext): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Performance: ${label}`, {
        ...context,
        performance: { duration },
      });
    };
  }

  // Request/Response logging
  request(method: string, path: string, context?: LogContext): string {
    const requestId = randomUUID();
    this.info(`Request started: ${method} ${path}`, {
      ...context,
      requestId,
      method,
      path,
    });
    return requestId;
  }

  response(
    requestId: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`Request completed: ${statusCode}`, {
      ...context,
      requestId,
      statusCode,
      duration,
    });
  }

  // Authentication logging
  authSuccess(userId: string, method: string, context?: LogContext): void {
    this.info(`Authentication successful: ${method}`, {
      ...context,
      userId,
      authMethod: method,
    });
  }

  authFailure(email: string, reason: string, context?: LogContext): void {
    this.warn(`Authentication failed: ${reason}`, {
      ...context,
      email,
      authFailureReason: reason,
    });
  }

  // Business operation logging
  businessOperation(
    operation: string,
    entity: string,
    context?: LogContext
  ): void {
    this.info(`Business operation: ${operation} ${entity}`, {
      ...context,
      operation,
      entity,
    });
  }

  // Greek compliance logging
  complianceEvent(event: string, entity: string, context?: LogContext): void {
    this.info(`Greek compliance: ${event}`, {
      ...context,
      complianceEvent: event,
      entity,
    });
  }

  // Database operation logging
  databaseOperation(
    operation: string,
    table: string,
    context?: LogContext
  ): void {
    this.debug(`Database: ${operation} ${table}`, {
      ...context,
      dbOperation: operation,
      table,
    });
  }

  // Create child logger with additional context
  child(additionalContext: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger(
      this.service,
      this.version,
      this.minLevel
    );
    childLogger.correlationId = this.correlationId;

    // Override methods to include additional context
    const originalMethods = ["debug", "info", "warn", "error", "critical"];
    originalMethods.forEach((method) => {
      const originalMethod = (childLogger as any)[method];
      (childLogger as any)[method] = (
        message: string,
        context?: LogContext,
        error?: Error
      ) => {
        originalMethod.call(
          childLogger,
          message,
          { ...additionalContext, ...context },
          error
        );
      };
    });

    return childLogger;
  }
}

// Global logger instances
export const createLogger = (
  service: string,
  version?: string,
  minLevel?: LogLevel
): StructuredLogger => {
  return new StructuredLogger(service, version, minLevel);
};

// Default loggers for common services
export const apiLogger = createLogger("api-service");
export const authLogger = createLogger("auth-service");
export const clientLogger = createLogger("client-app");
export const adminLogger = createLogger("admin-app");

// Export the class for custom loggers
export { StructuredLogger };
