/* global console, global, jest, process */
process.env.NODE_ENV = "test";

const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

process.env.PORT = "3000";
process.env.NODE_ENV = "test";
process.env.DB_SERVICE_URL = "http://db-service.test";
process.env.IA_SERVICE_URL = "http://ai-service.test";
process.env.BUCKET_MANAGER_URL = "http://bucket-manager.test";
process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";
