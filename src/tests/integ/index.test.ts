/* global beforeEach, describe, expect, it, jest */
import request from "supertest";
import { app } from "../../app";
import { config } from "../../config/environment";
import {
  activateAchievement,
  createAchievement,
  deactivateAchievement,
  deleteAchievement,
  generateAchievementSuggestion,
  getAchievementById,
  getAchievementsByChannelId,
  getAchievementsByUserIdAndChannelId,
  getAchievementsByUserId,
  getPublicAchievements,
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
  activateAchievement: jest.fn(),
  createAchievement: jest.fn(),
  deactivateAchievement: jest.fn(),
  deleteAchievement: jest.fn(),
  generateAchievementSuggestion: jest.fn(),
  getAchievementById: jest.fn(),
  getAchievementsByChannelId: jest.fn(),
  getAchievementsByUserIdAndChannelId: jest.fn(),
  getAchievementsByUserId: jest.fn(),
  getPublicAchievements: jest.fn(),
  updateAchievement: jest.fn(),
}));

describe("Express App", () => {
  const activateAchievementMock = activateAchievement as jest.MockedFunction<
    typeof activateAchievement
  >;
  const createAchievementMock = createAchievement as jest.MockedFunction<
    typeof createAchievement
  >;
  const generateAchievementSuggestionMock =
    generateAchievementSuggestion as jest.MockedFunction<
      typeof generateAchievementSuggestion
    >;
  const getAchievementByIdMock = getAchievementById as jest.MockedFunction<
    typeof getAchievementById
  >;
  const getAchievementsByChannelIdMock =
    getAchievementsByChannelId as jest.MockedFunction<
      typeof getAchievementsByChannelId
    >;
  const getPublicAchievementsMock =
    getPublicAchievements as jest.MockedFunction<typeof getPublicAchievements>;
  const getAchievementsByUserIdMock =
    getAchievementsByUserId as jest.MockedFunction<
      typeof getAchievementsByUserId
    >;
  const getAchievementsByUserIdAndChannelIdMock =
    getAchievementsByUserIdAndChannelId as jest.MockedFunction<
      typeof getAchievementsByUserIdAndChannelId
    >;
  const deactivateAchievementMock =
    deactivateAchievement as jest.MockedFunction<typeof deactivateAchievement>;
  const deleteAchievementMock = deleteAchievement as jest.MockedFunction<
    typeof deleteAchievement
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

    it("should expose CORS headers for an allowed origin", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000",
      );
      expect(response.headers["access-control-allow-methods"]).toBe(
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      );
      expect(response.headers["access-control-allow-headers"]).toBe(
        "Content-Type, Authorization",
      );
    });

    it("should not expose CORS headers for a disallowed origin", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "https://blocked.example");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("should answer preflight requests", async () => {
      const response = await request(app)
        .options("/achievements")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000",
      );
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
          label: "contentMessage",
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
            label: "Content Message",
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
          label: "contentMessage",
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
          label: "contentMessage",
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
            label: "countMessage",
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
            label: "countMessage",
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
            label: "countMessage",
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

  describe("POST /achievements/ai-suggestion", () => {
    it("should return an AI suggestion", async () => {
      generateAchievementSuggestionMock.mockResolvedValue({
        title: "Suggested title",
        description: "Suggested description",
        goal: 100,
        reward: 250,
        public: false,
        active: true,
        secret: false,
        type: {
          label: "countMessage",
          data: null,
        },
      });

      const response = await request(app)
        .post("/achievements/ai-suggestion")
        .send({
          prompt: " Create an achievement for 100 messages ",
        });

      expect(response.status).toBe(200);
      expect(generateAchievementSuggestionMock).toHaveBeenCalledWith({
        prompt: "Create an achievement for 100 messages",
      });
      expect(response.body).toEqual({
        title: "Suggested title",
        description: "Suggested description",
        goal: 100,
        reward: 250,
        public: false,
        active: true,
        secret: false,
        type: {
          label: "countMessage",
          data: null,
        },
      });
    });

    it("should reject an invalid AI prompt payload", async () => {
      const response = await request(app)
        .post("/achievements/ai-suggestion")
        .send({
          prompt: " ",
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: "validation_error",
        message: "prompt is required",
      });
      expect(generateAchievementSuggestionMock).not.toHaveBeenCalled();
    });

    it("should return AI service failures", async () => {
      generateAchievementSuggestionMock.mockRejectedValue(
        new ApplicationError(
          502,
          "ai_service_error",
          "AI service returned an unusable achievement suggestion",
        ),
      );

      const response = await request(app)
        .post("/achievements/ai-suggestion")
        .send({
          prompt: "Any prompt",
        });

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        code: "ai_service_error",
        message: "AI service returned an unusable achievement suggestion",
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
          label: "contentMessage",
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
            label: "Content Message",
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
          label: "contentMessage",
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
            label: "contentMessage",
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
            label: "countMessage",
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
            label: "countMessage",
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

  describe("DELETE /achievements/:achievementId", () => {
    it("should delete an achievement and return the stable response", async () => {
      deleteAchievementMock.mockResolvedValue({
        id: "achievement-1",
        title: "Deleted title",
        description: "Deleted description",
        goal: 20,
        reward: 50,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      });

      const response = await request(app).delete("/achievements/achievement-1");

      expect(response.status).toBe(200);
      expect(deleteAchievementMock).toHaveBeenCalledWith("achievement-1");
      expect(response.body).toEqual({
        id: "achievement-1",
        title: "Deleted title",
        description: "Deleted description",
        goal: 20,
        reward: 50,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      });
    });

    it("should return not found when the deleted achievement does not exist", async () => {
      deleteAchievementMock.mockRejectedValue(
        new ApplicationError(404, "not_found", "Achievement not found"),
      );

      const response = await request(app).delete(
        "/achievements/achievement-404",
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: "not_found",
        message: "Achievement not found",
      });
    });

    it("should return notification handler failures on delete", async () => {
      deleteAchievementMock.mockRejectedValue(
        new ApplicationError(
          502,
          "notification_handler_error",
          "Notification handler cache invalidation failed after achievement deletion",
        ),
      );

      const response = await request(app).delete("/achievements/achievement-1");

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        code: "notification_handler_error",
        message:
          "Notification handler cache invalidation failed after achievement deletion",
      });
    });
  });

  describe("PATCH /achievements/:achievementId/deactivate", () => {
    it("should deactivate an achievement and return the stable response", async () => {
      deactivateAchievementMock.mockResolvedValue({
        id: "achievement-1",
        title: "Deactivated title",
        description: "Deactivated description",
        goal: 20,
        reward: 50,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      });

      const response = await request(app).patch(
        "/achievements/achievement-1/deactivate",
      );

      expect(response.status).toBe(200);
      expect(deactivateAchievementMock).toHaveBeenCalledWith("achievement-1");
      expect(response.body).toEqual({
        id: "achievement-1",
        title: "Deactivated title",
        description: "Deactivated description",
        goal: 20,
        reward: 50,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      });
    });

    it("should return not found when the achievement does not exist", async () => {
      deactivateAchievementMock.mockRejectedValue(
        new ApplicationError(404, "not_found", "Achievement not found"),
      );

      const response = await request(app).patch(
        "/achievements/achievement-404/deactivate",
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: "not_found",
        message: "Achievement not found",
      });
    });

    it("should return notification handler failures on deactivate", async () => {
      deactivateAchievementMock.mockRejectedValue(
        new ApplicationError(
          502,
          "notification_handler_error",
          "Notification handler cache invalidation failed after achievement deactivation",
        ),
      );

      const response = await request(app).patch(
        "/achievements/achievement-1/deactivate",
      );

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        code: "notification_handler_error",
        message:
          "Notification handler cache invalidation failed after achievement deactivation",
      });
    });
  });

  describe("PATCH /achievements/:achievementId/activate", () => {
    it("should activate an achievement and return the stable response", async () => {
      activateAchievementMock.mockResolvedValue({
        id: "achievement-1",
        title: "Activated title",
        description: "Activated description",
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
          label: "countMessage",
          data: null,
        },
      });

      const response = await request(app).patch(
        "/achievements/achievement-1/activate",
      );

      expect(response.status).toBe(200);
      expect(activateAchievementMock).toHaveBeenCalledWith("achievement-1");
      expect(response.body).toEqual({
        id: "achievement-1",
        title: "Activated title",
        description: "Activated description",
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
          label: "countMessage",
          data: null,
        },
      });
    });

    it("should return not found when the achievement does not exist", async () => {
      activateAchievementMock.mockRejectedValue(
        new ApplicationError(404, "not_found", "Achievement not found"),
      );

      const response = await request(app).patch(
        "/achievements/achievement-404/activate",
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: "not_found",
        message: "Achievement not found",
      });
    });

    it("should return notification handler failures on activate", async () => {
      activateAchievementMock.mockRejectedValue(
        new ApplicationError(
          502,
          "notification_handler_error",
          "Notification handler cache invalidation failed after achievement activation",
        ),
      );

      const response = await request(app).patch(
        "/achievements/achievement-1/activate",
      );

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        code: "notification_handler_error",
        message:
          "Notification handler cache invalidation failed after achievement activation",
      });
    });
  });

  describe("GET /achievements/:achievementId", () => {
    it("should return an achievement by id", async () => {
      getAchievementByIdMock.mockResolvedValue({
        id: "achievement-1",
        title: "Fetched title",
        description: "Fetched description",
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
          label: "countMessage",
          data: null,
        },
      });

      const response = await request(app).get("/achievements/achievement-1");

      expect(response.status).toBe(200);
      expect(getAchievementByIdMock).toHaveBeenCalledWith("achievement-1");
      expect(response.body).toEqual({
        id: "achievement-1",
        title: "Fetched title",
        description: "Fetched description",
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
          label: "countMessage",
          data: null,
        },
      });
    });

    it("should return not found when the achievement does not exist", async () => {
      getAchievementByIdMock.mockRejectedValue(
        new ApplicationError(404, "not_found", "Achievement not found"),
      );

      const response = await request(app).get("/achievements/achievement-404");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: "not_found",
        message: "Achievement not found",
      });
    });
  });

  describe("GET /achievements/channel/:channelId", () => {
    it("should return achievements by channel", async () => {
      getAchievementsByChannelIdMock.mockResolvedValue([
        {
          id: "achievement-1",
          title: "Channel title",
          description: "Channel description",
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
            label: "countMessage",
            data: null,
          },
        },
      ]);

      const response = await request(app).get(
        "/achievements/channel/channel-1",
      );

      expect(response.status).toBe(200);
      expect(getAchievementsByChannelIdMock).toHaveBeenCalledWith("channel-1");
      expect(response.body).toEqual([
        {
          id: "achievement-1",
          title: "Channel title",
          description: "Channel description",
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
            label: "countMessage",
            data: null,
          },
        },
      ]);
    });

    it("should return an empty list when the channel has no achievements", async () => {
      getAchievementsByChannelIdMock.mockResolvedValue([]);

      const response = await request(app).get(
        "/achievements/channel/channel-1",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /achievements/public", () => {
    it("should return public achievements", async () => {
      getPublicAchievementsMock.mockResolvedValue([
        {
          id: "achievement-1",
          title: "Public title",
          description: "Public description",
          goal: 20,
          reward: 50,
          label: "",
          public: true,
          downloads: 0,
          visits: 0,
          active: true,
          secret: false,
          image: null,
          channelId: "channel-1",
          type: {
            label: "countMessage",
            data: null,
          },
        },
      ]);

      const response = await request(app).get("/achievements/public");

      expect(response.status).toBe(200);
      expect(getPublicAchievementsMock).toHaveBeenCalledWith();
      expect(response.body).toEqual([
        {
          id: "achievement-1",
          title: "Public title",
          description: "Public description",
          goal: 20,
          reward: 50,
          label: "",
          public: true,
          downloads: 0,
          visits: 0,
          active: true,
          secret: false,
          image: null,
          channelId: "channel-1",
          type: {
            label: "countMessage",
            data: null,
          },
        },
      ]);
    });

    it("should return an empty list when there are no public achievements", async () => {
      getPublicAchievementsMock.mockResolvedValue([]);

      const response = await request(app).get("/achievements/public");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /achievements/user/:userId", () => {
    it("should return achievements by user with state", async () => {
      getAchievementsByUserIdMock.mockResolvedValue([
        {
          id: "achievement-1",
          title: "Profile title",
          description: "Profile description",
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
            label: "countMessage",
            data: null,
          },
          userState: {
            progressCount: 20,
            finished: true,
            acquiredDate: "2025-09-01T10:00:00.000Z",
          },
        },
      ]);

      const response = await request(app).get("/achievements/user/user-1");

      expect(response.status).toBe(200);
      expect(getAchievementsByUserIdMock).toHaveBeenCalledWith("user-1");
      expect(response.body).toEqual([
        {
          id: "achievement-1",
          title: "Profile title",
          description: "Profile description",
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
            label: "countMessage",
            data: null,
          },
          userState: {
            progressCount: 20,
            finished: true,
            acquiredDate: "2025-09-01T10:00:00.000Z",
          },
        },
      ]);
    });

    it("should return an empty list when the user has no achievements", async () => {
      getAchievementsByUserIdMock.mockResolvedValue([]);

      const response = await request(app).get("/achievements/user/user-1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /achievements/user/:userId/channel/:channelId", () => {
    it("should return achievements by user and channel with state", async () => {
      getAchievementsByUserIdAndChannelIdMock.mockResolvedValue([
        {
          id: "achievement-1",
          title: "Profile title",
          description: "Profile description",
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
            label: "countMessage",
            data: null,
          },
          userState: {
            progressCount: 20,
            finished: true,
            acquiredDate: "2025-09-01T10:00:00.000Z",
          },
        },
      ]);

      const response = await request(app).get(
        "/achievements/user/user-1/channel/channel-1",
      );

      expect(response.status).toBe(200);
      expect(getAchievementsByUserIdAndChannelIdMock).toHaveBeenCalledWith(
        "user-1",
        "channel-1",
      );
      expect(response.body).toEqual([
        {
          id: "achievement-1",
          title: "Profile title",
          description: "Profile description",
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
            label: "countMessage",
            data: null,
          },
          userState: {
            progressCount: 20,
            finished: true,
            acquiredDate: "2025-09-01T10:00:00.000Z",
          },
        },
      ]);
    });

    it("should return an empty list when the user has no achievements for the channel", async () => {
      getAchievementsByUserIdAndChannelIdMock.mockResolvedValue([]);

      const response = await request(app).get(
        "/achievements/user/user-1/channel/channel-1",
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
