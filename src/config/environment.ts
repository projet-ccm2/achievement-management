/* global process */
interface Config {
  port: number;
  nodeEnv: string;
  dbServiceUrl: string;
  notificationHandlerUrl: string;
  cors: {
    allowedOrigins: string[];
  };
}

function validateConfig(): Config {
  return {
    port: Number.parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    dbServiceUrl: process.env.DB_SERVICE_URL || "http://localhost:3001",
    notificationHandlerUrl:
      process.env.NOTIFICATION_HANDLER_URL || "http://localhost:3002",
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["http://localhost:3000", "http://localhost:8080", "null"],
    },
  };
}

export const config = validateConfig();
