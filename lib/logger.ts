// Simple logger utility - in production, you'd use a service like Pino or Winston

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogObject {
  message: string
  [key: string]: any
}

/**
 * Simple logging utility
 */
class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, messageOrObject: string | LogObject, ...args: any[]) {
    // Skip debug logs in production
    if (level === "debug" && process.env.NODE_ENV === "production") {
      return
    }

    const timestamp = new Date().toISOString()
    const context = this.context

    // Format the log message
    let logObject: any

    if (typeof messageOrObject === "string") {
      logObject = {
        timestamp,
        level,
        context,
        message: messageOrObject,
        ...(args.length > 0 ? { data: args } : {}),
      }
    } else {
      const { message, ...rest } = messageOrObject
      logObject = {
        timestamp,
        level,
        context,
        message,
        ...rest,
      }
    }

    // In a real app, you might send logs to a service like Datadog, Logtail, etc.
    switch (level) {
      case "debug":
        console.debug(JSON.stringify(logObject))
        break
      case "info":
        console.info(JSON.stringify(logObject))
        break
      case "warn":
        console.warn(JSON.stringify(logObject))
        break
      case "error":
        console.error(JSON.stringify(logObject))
        break
    }
  }

  debug(messageOrObject: string | LogObject, ...args: any[]) {
    this.log("debug", messageOrObject, ...args)
  }

  info(messageOrObject: string | LogObject, ...args: any[]) {
    this.log("info", messageOrObject, ...args)
  }

  warn(messageOrObject: string | LogObject, ...args: any[]) {
    this.log("warn", messageOrObject, ...args)
  }

  error(messageOrObject: string | LogObject, ...args: any[]) {
    this.log("error", messageOrObject, ...args)
  }
}

/**
 * Create a logger instance for the specified context
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}
