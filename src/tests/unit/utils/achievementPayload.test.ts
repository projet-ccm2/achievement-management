import {
  mapDbAchievementToResponse,
  parseCreateAchievementRequest,
  parseUpdateAchievementRequest,
  supportedTriggerLabels,
} from "../../../utils/achievementPayload";
import { ApplicationError } from "../../../middlewares/errorHandler";

describe("achievementPayload", () => {
  it("should expose the supported trigger labels", () => {
    expect(supportedTriggerLabels).toEqual([
      "message",
      "message_content",
      "channel_point_cost",
      "redeem_channel_point",
      "api_caller",
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
          label: "Redeem Channel Point",
          data: " reward ",
        },
      }),
    ).toEqual({
      title: "First",
      description: "Desc",
      goal: 5,
      reward: 0,
      label: "custom",
      public: true,
      active: true,
      secret: false,
      image: "https://image.test/file.png",
      channelId: "channel-1",
      type: {
        label: "redeem_channel_point",
        data: "reward",
      },
    });
  });

  it("should normalize message type data to null", () => {
    expect(
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
          label: "message",
          data: "ignored",
        },
      }).type.data,
    ).toBeNull();
  });

  it("should normalize channel point cost to a string", () => {
    expect(
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
          label: "channel-point-cost",
          data: 100,
        },
      }).type,
    ).toEqual({
      label: "channel_point_cost",
      data: "100",
    });
  });

  it("should reject non object payloads", () => {
    expect(() => parseCreateAchievementRequest(null)).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "Request body must be an object",
      ),
    );
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
          label: "message-content",
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
      type: {
        label: "message_content",
        data: "updated",
      },
    });
  });

  it("should reject missing type objects", () => {
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
  });

  it("should reject non string trigger labels", () => {
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
          label: 12,
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "type.label must be a string",
      ),
    );
  });

  it("should reject empty required strings", () => {
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
          label: "message",
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(400, "validation_error", "title is required"),
    );
  });

  it("should reject unsupported trigger labels", () => {
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
          label: "channel_point_cost",
          data: "abc",
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "type.data must be a positive integer or numeric string for channel_point_cost",
      ),
    );
  });

  it("should reject invalid rewards", () => {
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
          label: "message",
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
  });

  it("should reject invalid booleans", () => {
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
          label: "message",
          data: null,
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "public must be a boolean",
      ),
    );
  });

  it("should reject channel point cost values with invalid types", () => {
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
          label: "channel_point_cost",
          data: false,
        },
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "type.data must be a positive integer or numeric string for channel_point_cost",
      ),
    );
  });

  it("should map a DB achievement response with nested type", () => {
    expect(
      mapDbAchievementToResponse({
        Achievement_ID: "achievement-1",
        Achievement_Title: "First",
        Achievement_Description: "Desc",
        Achievement_Goal: 10,
        Achievement_Reward: 5,
        Achievement_Label: "",
        Achievement_Public: false,
        Achievement_Downloads: 1,
        Achievement_Visits: 2,
        Achievement_Active: true,
        Achievement_Secret: false,
        Achievement_Image: "https://image.test/file.png",
        Chanel_ID: "channel-1",
        Type: {
          Type_Label: "API Caller",
          Type_Data: "event_key",
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
      channelId: "channel-1",
      type: {
        label: "api_caller",
        data: "event_key",
      },
    });
  });

  it("should map a DB achievement response with flat type fields and defaults", () => {
    expect(
      mapDbAchievementToResponse({
        Achievement_ID: "achievement-1",
        Achievement_Title: "First",
        Achievement_Description: "Desc",
        Achievement_Goal: 10,
        Achievement_Reward: 5,
        Achievement_Public: false,
        Achievement_Active: true,
        Achievement_Secret: false,
        Chanel_ID: "channel-1",
        Type_Label: "message",
        Type_Data: "ignored",
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
        label: "message",
        data: null,
      },
    });
  });

  it("should reject invalid DB responses", () => {
    expect(() => mapDbAchievementToResponse("invalid")).toThrow(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement payload",
      ),
    );
  });

  it("should reject invalid DB numeric fields", () => {
    expect(() =>
      mapDbAchievementToResponse({
        Achievement_ID: "achievement-1",
        Achievement_Title: "First",
        Achievement_Description: "Desc",
        Achievement_Goal: 10,
        Achievement_Reward: 5,
        Achievement_Public: false,
        Achievement_Downloads: -1,
        Achievement_Active: true,
        Achievement_Secret: false,
        Chanel_ID: "channel-1",
        Type_Label: "message",
        Type_Data: null,
      }),
    ).toThrow(
      new ApplicationError(
        502,
        "db_service_error",
        "Achievement_Downloads must be a non-negative integer",
      ),
    );
  });

  it("should reject invalid DB booleans", () => {
    expect(() =>
      mapDbAchievementToResponse({
        Achievement_ID: "achievement-1",
        Achievement_Title: "First",
        Achievement_Description: "Desc",
        Achievement_Goal: 10,
        Achievement_Reward: 5,
        Achievement_Public: "false",
        Achievement_Active: true,
        Achievement_Secret: false,
        Chanel_ID: "channel-1",
        Type_Label: "message",
        Type_Data: null,
      }),
    ).toThrow(
      new ApplicationError(
        400,
        "validation_error",
        "Achievement_Public must be a boolean",
      ),
    );
  });
});
