/* global URL, process */
interface Config {
  port: number;
  nodeEnv: string;
  dbServiceUrl: string;
  aiServiceUrl: string;
  notificationHandlerUrl: string;
  externalRequestTimeoutMs: number;
  cors: {
    allowedOrigins: string[];
  };
}

function readRequiredUrl(variableName: string): string {
  const rawValue = process.env[variableName];

  if (!rawValue || rawValue.trim().length === 0) {
    throw new Error(`${variableName} is required`);
  }

  try {
    return new URL(rawValue).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${variableName} must be a valid URL`);
  }
}

function readPort(): number {
  const rawPort = process.env.PORT || "3000";
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return port;
}

function readAllowedOrigins(): string[] {
  if (!process.env.ALLOWED_ORIGINS) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ALLOWED_ORIGINS is required in production");
    }

    return ["http://localhost:3000", "http://localhost:8080", "null"];
  }

  return process.env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function readExternalRequestTimeoutMs(): number {
  const rawTimeout = process.env.EXTERNAL_REQUEST_TIMEOUT_MS || "10000";
  const timeoutMs = Number.parseInt(rawTimeout, 10);

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("EXTERNAL_REQUEST_TIMEOUT_MS must be a positive integer");
  }

  return timeoutMs;
}

function validateConfig(): Config {
  return {
    port: readPort(),
    nodeEnv: process.env.NODE_ENV || "development",
    dbServiceUrl: readRequiredUrl("DB_SERVICE_URL"),
    aiServiceUrl: readRequiredUrl("IA_SERVICE_URL"),
    notificationHandlerUrl: readRequiredUrl("NOTIFICATION_HANDLER_URL"),
    externalRequestTimeoutMs: readExternalRequestTimeoutMs(),
    cors: {
      allowedOrigins: readAllowedOrigins(),
    },
  };
}

export const config = validateConfig();
