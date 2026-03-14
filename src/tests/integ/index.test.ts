/* global beforeEach, describe, expect, it, jest */
import request from "supertest";
import { app } from "../../app";
import { config } from "../../config/environment";
import {
  createAchievement,
  updateAchievement,
} from "../../services/achievementService";
import { ApplicationError } from "../../middlewares/errorHandler";

jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../../services/achievementService", () => ({
  createAchievement: jest.fn(),
  updateAchievement: jest.fn(),
}));

describe("Express App", () => {
  const createAchievementMock = createAchievement as jest.MockedFunction<
    typeof createAchievement
  >;
  const updateAchievementMock = updateAchievement as jest.MockedFunction<
    typeof updateAchievement
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status with correct structure", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("environment", config.nodeEnv);
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it("should return a valid ISO timestamp", async () => {
      const response = await request(app).get("/health");
      const timestamp = new Date(response.body.timestamp);

      expect(timestamp.toISOString()).toBe(response.body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe("Server configuration", () => {
    it("should have x-powered-by header disabled", () => {
      expect(app.get("x-powered-by")).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle unknown routes with 404", async () => {
      const response = await request(app).get("/unknown-route");
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: "not_found",
        message: "Route GET /unknown-route not found",
      });
    });
  });

  describe("POST /achievements", () => {
    it("should create an achievement and return the stable response", async () => {
      createAchievementMock.mockResolvedValue({
        id: "achievement-1",
        title: "First 100 messages",
        description: "Unlock after 100 messages",
        goal: 100,
        reward: 250,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message_content",
          data: "hello world",
        },
      });

      const response = await request(app)
        .post("/achievements")
        .send({
          title: " First 100 messages ",
          description: "Unlock after 100 messages",
          goal: 100,
          reward: 250,
          public: false,
          active: true,
          secret: false,
          channelId: "channel-1",
          type: {
            label: "Message Content",
            data: "hello world",
          },
        });

      expect(response.status).toBe(201);
      expect(createAchievementMock).toHaveBeenCalledWith({
        title: "First 100 messages",
        description: "Unlock after 100 messages",
        goal: 100,
        reward: 250,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message_content",
          data: "hello world",
        },
      });
      expect(response.body).toEqual({
        id: "achievement-1",
        title: "First 100 messages",
        description: "Unlock after 100 messages",
        goal: 100,
        reward: 250,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message_content",
          data: "hello world",
        },
      });
    });

    it("should reject an invalid payload", async () => {
      const response = await request(app)
        .post("/achievements")
        .send({
          title: "Invalid",
          description: "Invalid",
          goal: 0,
          reward: 10,
          public: false,
          active: true,
          secret: false,
          channelId: "channel-1",
          type: {
            label: "message",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: "validation_error",
        message: "goal must be a positive integer",
      });
      expect(createAchievementMock).not.toHaveBeenCalled();
    });

    it("should map unexpected downstream errors to 500", async () => {
      createAchievementMock.mockRejectedValue(
        new Error("unexpected downstream failure"),
      );

      const response = await request(app)
        .post("/achievements")
        .send({
          title: "Any",
          description: "Any",
          goal: 1,
          reward: 0,
          public: false,
          active: true,
          secret: false,
          channelId: "channel-1",
          type: {
            label: "message",
            data: null,
          },
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        code: "internal_server_error",
        message: "An unexpected error occurred",
      });
    });

    it("should return downstream application errors", async () => {
      createAchievementMock.mockRejectedValue(
        new ApplicationError(
          502,
          "notification_handler_error",
          "Notification handler cache invalidation failed after achievement creation",
        ),
      );

      const response = await request(app)
        .post("/achievements")
        .send({
          title: "Any",
          description: "Any",
          goal: 1,
          reward: 0,
          public: false,
          active: true,
          secret: false,
          channelId: "channel-1",
          type: {
            label: "message",
            data: null,
          },
        });

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        code: "notification_handler_error",
        message:
          "Notification handler cache invalidation failed after achievement creation",
      });
    });
  });

  describe("PUT /achievements/:achievementId", () => {
    it("should update an achievement and return the stable response", async () => {
      updateAchievementMock.mockResolvedValue({
        id: "achievement-1",
        title: "Updated title",
        description: "Updated description",
        goal: 20,
        reward: 50,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message_content",
          data: "updated",
        },
      });

      const response = await request(app)
        .put("/achievements/achievement-1")
        .send({
          title: " Updated title ",
          description: "Updated description",
          goal: 20,
          reward: 50,
          public: false,
          active: true,
          secret: false,
          image: null,
          type: {
            label: "message-content",
            data: "updated",
          },
        });

      expect(response.status).toBe(200);
      expect(updateAchievementMock).toHaveBeenCalledWith("achievement-1", {
        title: "Updated title",
        description: "Updated description",
        goal: 20,
        reward: 50,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        type: {
          label: "message_content",
          data: "updated",
        },
      });
      expect(response.body.id).toBe("achievement-1");
    });

    it("should reject an invalid update payload", async () => {
      const response = await request(app)
        .put("/achievements/achievement-1")
        .send({
          title: "Invalid",
          description: "Invalid",
          goal: 1,
          reward: 0,
          public: false,
          active: true,
          secret: false,
          type: {
            label: "message_content",
            data: "",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: "validation_error",
        message: "type.data is required",
      });
      expect(updateAchievementMock).not.toHaveBeenCalled();
    });

    it("should return not found when the achievement does not exist", async () => {
      updateAchievementMock.mockRejectedValue(
        new ApplicationError(404, "not_found", "Achievement not found"),
      );

      const response = await request(app)
        .put("/achievements/achievement-404")
        .send({
          title: "Updated",
          description: "Updated",
          goal: 1,
          reward: 0,
          public: false,
          active: true,
          secret: false,
          type: {
            label: "message",
            data: null,
          },
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: "not_found",
        message: "Achievement not found",
      });
    });

    it("should return notification handler failures on update", async () => {
      updateAchievementMock.mockRejectedValue(
        new ApplicationError(
          502,
          "notification_handler_error",
          "Notification handler cache invalidation failed after achievement update",
        ),
      );

      const response = await request(app)
        .put("/achievements/achievement-1")
        .send({
          title: "Updated",
          description: "Updated",
          goal: 1,
          reward: 0,
          public: false,
          active: true,
          secret: false,
          type: {
            label: "message",
            data: null,
          },
        });

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        code: "notification_handler_error",
        message:
          "Notification handler cache invalidation failed after achievement update",
      });
    });
  });
});
