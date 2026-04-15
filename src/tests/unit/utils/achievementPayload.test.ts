/* global describe, expect, it */
import {
  mapDbAchievementLeaderboardResponse,
  mapAiSuggestionToResponse,
  mapDbAchievementToResponse,
  mapDbAchievementsToResponse,
  mapDbUserAchievementToResponse,
  mapDbUserAchievementsToResponse,
  parseAchievementLeaderboardQuery,
  parseAiSuggestionRequest,
  parseCreateAchievementRequest,
  parseUpdateAchievementRequest,
  supportedTriggerLabels,
} from "../../../utils/achievementPayload";
import { ApplicationError } from "../../../middlewares/errorHandler";

describe("achievementPayload", () => {
  it("should expose the supported trigger labels", () => {
    expect(supportedTriggerLabels).toEqual([
      "countMessage",
      "contentMessage",
      "countCostChannelPoint",
      "countRedeemChannelPoint",
      "apicaller",
    ]);
  });

  it("should parse and normalize a valid creation payload", () => {
    expect(
      parseCreateAchievementRequest({
        title: " First ",
        description: "Desc",
        goal: 5,
        reward: 0,
        label: " custom ",
        public: true,
        active: true,
        secret: false,
        image: " https://image.test/file.png ",
        channelId: " channel-1 ",
        type: {
          label: "Count Redeem Channel Point",
          data: " reward ",
        },
      }),
    ).toEqual({
      title: "First",
      description: "Desc",
      goal: 5,
      reward: 0,
      label: " ",
      public: true,
      active: true,
      secret: false,
      image: "https://image.test/file.png",
      imageUpload: null,
      channelId: "channel-1",
      type: {
        label: "countRedeemChannelPoint",
        data: "reward",
      },
    });
  });

  it("should default create label to a single space when omitted", () => {
    expect(
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 5,
        reward: 0,
        public: true,
        active: true,
        secret: false,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      }),
    ).toEqual({
      title: "First",
      description: "Desc",
      goal: 5,
      reward: 0,
      label: " ",
      public: true,
      active: true,
      secret: false,
      image: null,
      imageUpload: null,
      channelId: "channel-1",
      type: {
        label: "countMessage",
        data: null,
      },
    });
  });

  it("should parse a valid update payload", () => {
    expect(
      parseUpdateAchievementRequest({
        title: " Updated ",
        description: "Desc",
        goal: 2,
        reward: 10,
        public: false,
        active: true,
        secret: false,
        image: null,
        type: {
          label: "Content Message",
          data: "updated",
        },
      }),
    ).toEqual({
      title: "Updated",
      description: "Desc",
      goal: 2,
      reward: 10,
      label: "",
      public: false,
      active: true,
      secret: false,
      image: null,
      imageUpload: null,
      type: {
        label: "contentMessage",
        data: "updated",
      },
    });
  });

  it("should parse a valid image upload payload", () => {
    expect(
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 5,
        reward: 0,
        public: true,
        active: true,
        secret: false,
        image: null,
        imageUpload: {
          fileName: "achievement.png",
          mimeType: "image/png",
          contentBase64: "dGVzdA==",
        },
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      }),
    ).toEqual({
      title: "First",
      description: "Desc",
      goal: 5,
      reward: 0,
      label: " ",
      public: true,
      active: true,
      secret: false,
      image: null,
      imageUpload: {
        fileName: "achievement.png",
        mimeType: "image/png",
        contentBase64: "dGVzdA==",
      },
      channelId: "channel-1",
      type: {
        label: "countMessage",
        data: null,
      },
    });
  });

  it("should reject invalid creation payloads", () => {
    expect(() => parseCreateAchievementRequest(null)).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "Request body must be an object",
      ),
    );
    expect(() =>
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        public: true,
        active: true,
        secret: false,
        channelId: "channel-1",
      }),
    ).toThrow(
      new ApplicationError(400, "validation_error", "type must be an object"),
    );
    expect(() =>
      parseCreateAchievementRequest({
        title: " ",
        description: "Desc",
        goal: 1,
        reward: 0,
        public: true,
        active: true,
        secret: false,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(400, "validation_error", "title is required"),
    );
    expect(() =>
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: -1,
        public: true,
        active: true,
        secret: false,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "reward must be a non-negative integer",
      ),
    );
    expect(() =>
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        public: "true",
        active: true,
        secret: false,
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(400, "validation_error", "public must be a boolean"),
    );
    expect(() =>
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        public: true,
        active: true,
        secret: false,
        channelId: "channel-1",
        type: {
          label: "unknown",
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "type.label is not supported",
      ),
    );
    expect(() =>
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        public: true,
        active: true,
        secret: false,
        imageUpload: "invalid",
        channelId: "channel-1",
        type: {
          label: "countMessage",
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "imageUpload must be an object",
      ),
    );
  });

  it("should reject invalid channel point cost data", () => {
    expect(() =>
      parseCreateAchievementRequest({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        public: true,
        active: true,
        secret: false,
        channelId: "channel-1",
        type: {
          label: "countCostChannelPoint",
          data: "abc",
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "type.data must be a positive integer or numeric string for countCostChannelPoint",
      ),
    );
  });

  it("should parse a valid AI suggestion prompt request", () => {
    expect(
      parseAiSuggestionRequest({
        prompt: " Create an achievement suggestion ",
      }),
    ).toEqual({
      prompt: "Create an achievement suggestion",
    });
    expect(() => parseAiSuggestionRequest(null)).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "Request body must be an object",
      ),
    );
  });

  it("should parse a valid achievement leaderboard query", () => {
    expect(
      parseAchievementLeaderboardQuery({
        limit: "5",
        sort: "completed",
      }),
    ).toEqual({
      limit: 5,
      sort: "completed",
    });

    expect(parseAchievementLeaderboardQuery({})).toEqual({});
  });

  it("should reject invalid achievement leaderboard query values", () => {
    expect(() =>
      parseAchievementLeaderboardQuery({
        limit: "0",
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "limit must be a positive integer",
      ),
    );

    expect(() =>
      parseAchievementLeaderboardQuery({
        sort: "invalid",
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "sort must be either xp or completed",
      ),
    );
  });

  it("should map a DB achievement response with the new camelCase contract", () => {
    expect(
      mapDbAchievementToResponse({
        id: "achievement-1",
        title: "First",
        description: "Desc",
        goal: 10,
        reward: 5,
        label: "",
        public: false,
        downloads: 1,
        visits: 2,
        active: true,
        secret: false,
        image: "https://image.test/file.png",
        channelId: null,
        typeAchievement: {
          id: "type-1",
          label: "API Caller",
          data: "event_key",
        },
      }),
    ).toEqual({
      id: "achievement-1",
      title: "First",
      description: "Desc",
      goal: 10,
      reward: 5,
      label: "",
      public: false,
      downloads: 1,
      visits: 2,
      active: true,
      secret: false,
      image: "https://image.test/file.png",
      channelId: null,
      type: {
        label: "apicaller",
        data: "event_key",
      },
    });
  });

  it("should map a DB achievement list response", () => {
    expect(
      mapDbAchievementsToResponse([
        {
          id: "achievement-1",
          title: "First",
          description: "Desc",
          goal: 10,
          reward: 5,
          public: false,
          active: true,
          secret: false,
          channelId: "channel-1",
          typeAchievement: {
            id: "type-1",
            label: "countMessage",
            data: "",
          },
        },
      ]),
    ).toEqual([
      {
        id: "achievement-1",
        title: "First",
        description: "Desc",
        goal: 10,
        reward: 5,
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

  it("should map a DB achievement leaderboard response", () => {
    expect(
      mapDbAchievementLeaderboardResponse([
        {
          userId: "user-1",
          username: "viewer-one",
          xp: 150,
          completed: 5,
        },
      ]),
    ).toEqual([
      {
        userId: "user-1",
        username: "viewer-one",
        xp: 150,
        completed: 5,
      },
    ]);
  });

  it("should map a DB user achievement response from achieved", () => {
    expect(
      mapDbUserAchievementToResponse({
        id: "achievement-1",
        title: "First",
        description: "Desc",
        goal: 10,
        reward: 5,
        public: false,
        active: true,
        secret: false,
        channelId: "channel-1",
        typeAchievement: {
          id: "type-1",
          label: "countMessage",
          data: "",
        },
        achieved: {
          achievementId: "achievement-1",
          userId: "user-1",
          count: 8,
          finished: true,
          labelActive: true,
          acquiredDate: "2025-09-01T10:00:00.000Z",
        },
      }),
    ).toEqual({
      id: "achievement-1",
      title: "First",
      description: "Desc",
      goal: 10,
      reward: 5,
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
        progressCount: 8,
        finished: true,
        acquiredDate: "2025-09-01T10:00:00.000Z",
      },
    });
  });

  it("should map a wrapped DB user achievement list response", () => {
    expect(
      mapDbUserAchievementsToResponse({
        userId: "user-1",
        channelId: "channel-1",
        achievements: [
          {
            id: "achievement-1",
            title: "First",
            description: "Desc",
            goal: 10,
            reward: 5,
            public: false,
            active: true,
            secret: false,
            channelId: "channel-1",
            typeAchievement: {
              id: "type-1",
              label: "countMessage",
              data: "",
            },
            achieved: null,
          },
        ],
      }),
    ).toEqual([
      expect.objectContaining({
        id: "achievement-1",
        userState: {
          progressCount: 0,
          finished: false,
          acquiredDate: null,
        },
      }),
    ]);
  });

  it("should reject invalid DB responses", () => {
    expect(() => mapDbAchievementToResponse("invalid")).toThrow(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement payload",
      ),
    );
    expect(() => mapDbUserAchievementsToResponse("invalid")).toThrow(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid user achievement list payload",
      ),
    );
    expect(() => mapDbAchievementsToResponse("invalid")).toThrow(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement list payload",
      ),
    );
    expect(() => mapDbAchievementLeaderboardResponse("invalid")).toThrow(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement leaderboard payload",
      ),
    );
    expect(() =>
      mapDbAchievementToResponse({
        id: "achievement-1",
        title: "First",
        description: "Desc",
        goal: 10,
        reward: 5,
        public: false,
        downloads: -1,
        active: true,
        secret: false,
        channelId: "channel-1",
        typeAchievement: {
          id: "type-1",
          label: "countMessage",
          data: "",
        },
      }),
    ).toThrow(
      new ApplicationError(
        502,
        "db_service_error",
        "downloads must be a non-negative integer",
      ),
    );
  });

  it("should map a valid AI suggestion response", () => {
    expect(
      mapAiSuggestionToResponse({
        title: " First ",
        description: " Desc ",
        goal: 10,
        reward: 5,
        public: false,
        active: true,
        secret: false,
        type: {
          label: "Content Message",
          data: " keyword ",
        },
      }),
    ).toEqual({
      title: "First",
      description: "Desc",
      goal: 10,
      reward: 5,
      public: false,
      active: true,
      secret: false,
      type: {
        label: "contentMessage",
        data: "keyword",
      },
    });
  });
});
