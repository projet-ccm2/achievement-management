/* global afterAll, beforeEach, describe, expect, it, jest, process, require */
describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("validateConfig", () => {
    it("should use defaults only for optional values", () => {
      delete process.env.PORT;
      delete process.env.NODE_ENV;
      delete process.env.ALLOWED_ORIGINS;
      process.env.DB_SERVICE_URL = "http://db-service.test";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      const { config } = require("../../../config/environment");

      expect(config.port).toBe(3000);
      expect(config.nodeEnv).toBe("development");
      expect(config.dbServiceUrl).toBe("http://db-service.test");
      expect(config.aiServiceUrl).toBe("http://ai-service.test");
      expect(config.notificationHandlerUrl).toBe(
        "http://notification-handler.test",
      );
      expect(config.cors.allowedOrigins).toEqual([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "null",
      ]);
    });

    it("should use provided environment variables", () => {
      process.env.PORT = "8080";
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://example.com,https://test.com";
      process.env.DB_SERVICE_URL = "http://db.internal";
      process.env.IA_SERVICE_URL = "http://ai.internal";
      process.env.NOTIFICATION_HANDLER_URL = "http://notify.internal";

      const { config } = require("../../../config/environment");

      expect(config.port).toBe(8080);
      expect(config.nodeEnv).toBe("production");
      expect(config.dbServiceUrl).toBe("http://db.internal");
      expect(config.aiServiceUrl).toBe("http://ai.internal");
      expect(config.notificationHandlerUrl).toBe("http://notify.internal");
      expect(config.cors.allowedOrigins).toEqual([
        "https://example.com",
        "https://test.com",
      ]);
    });

    it("should parse port as integer", () => {
      process.env.PORT = "9999";
      process.env.DB_SERVICE_URL = "http://db-service.test";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      const { config } = require("../../../config/environment");

      expect(config.port).toBe(9999);
      expect(typeof config.port).toBe("number");
    });

    it("should handle empty ALLOWED_ORIGINS", () => {
      process.env.ALLOWED_ORIGINS = "";
      process.env.DB_SERVICE_URL = "http://db-service.test";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      const { config } = require("../../../config/environment");

      expect(config.cors.allowedOrigins).toEqual([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "null",
      ]);
    });

    it("should handle single allowed origin", () => {
      process.env.ALLOWED_ORIGINS = "https://single-origin.com";
      process.env.DB_SERVICE_URL = "http://db-service.test";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      const { config } = require("../../../config/environment");

      expect(config.cors.allowedOrigins).toEqual(["https://single-origin.com"]);
    });

    it("should handle FRONT_URL", () => {
      process.env.FRONT_URL = "https://front-url.com";
      process.env.DB_SERVICE_URL = "http://db-service.test";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      const { config } = require("../../../config/environment");

      expect(config.cors.allowedOrigins).toEqual(["https://front-url.com"]);
    });

    it("should fail clearly when a required service URL is missing", () => {
      delete process.env.DB_SERVICE_URL;
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      expect(() => {
        require("../../../config/environment");
      }).toThrow("DB_SERVICE_URL is required");
    });

    it("should fail clearly when a required service URL is invalid", () => {
      process.env.DB_SERVICE_URL = "not-a-url";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      expect(() => {
        require("../../../config/environment");
      }).toThrow("DB_SERVICE_URL must be a valid URL");
    });

    it("should fail clearly when the port is invalid", () => {
      process.env.PORT = "0";
      process.env.DB_SERVICE_URL = "http://db-service.test";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      expect(() => {
        require("../../../config/environment");
      }).toThrow("PORT must be a positive integer");
    });

    it("should fail clearly when ALLOWED_ORIGINS is missing in production", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ALLOWED_ORIGINS;
      process.env.DB_SERVICE_URL = "http://db-service.test";
      process.env.IA_SERVICE_URL = "http://ai-service.test";
      process.env.NOTIFICATION_HANDLER_URL = "http://notification-handler.test";

      expect(() => {
        require("../../../config/environment");
      }).toThrow("ALLOWED_ORIGINS or FRONT_URL is required in production");
    });
  });

  describe("config structure", () => {
    it("should have correct structure", () => {
      const { config } = require("../../../config/environment");

      expect(config).toHaveProperty("port");
      expect(config).toHaveProperty("nodeEnv");
      expect(config).toHaveProperty("dbServiceUrl");
      expect(config).toHaveProperty("aiServiceUrl");
      expect(config).toHaveProperty("notificationHandlerUrl");
      expect(config).toHaveProperty("cors");

      expect(config.cors).toHaveProperty("allowedOrigins");

      expect(typeof config.port).toBe("number");
      expect(typeof config.nodeEnv).toBe("string");
      expect(typeof config.dbServiceUrl).toBe("string");
      expect(typeof config.aiServiceUrl).toBe("string");
      expect(typeof config.notificationHandlerUrl).toBe("string");
      expect(Array.isArray(config.cors.allowedOrigins)).toBe(true);
    });
  });
});
