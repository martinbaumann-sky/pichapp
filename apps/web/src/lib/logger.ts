import pino, { type Logger, type LoggerOptions } from "pino";

type LoggerBindings = Record<string, unknown> & { module?: string };

let baseLogger: Logger | null = null;

function createBaseLogger(): Logger {
  const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
  const options: LoggerOptions = {
    level,
    messageKey: "message",
    redact: {
      paths: ["req.headers.authorization", "password", "token"],
      remove: true,
    },
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return bindings.module ? { module: bindings.module } : {};
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (process.env.NODE_ENV !== "production") {
    return pino({ ...options, transport: { target: "pino-pretty", options: { colorize: true } } });
  }

  return pino(options);
}

export function getLogger(bindings?: LoggerBindings): Logger {
  if (!baseLogger) {
    baseLogger = createBaseLogger();
  }
  return bindings ? baseLogger.child(bindings) : baseLogger;
}

export function withRequestId(logger: Logger, requestId?: string | null): Logger {
  if (!requestId) return logger;
  return logger.child({ requestId });
}
