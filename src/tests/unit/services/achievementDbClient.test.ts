/* global afterEach, beforeEach, describe, expect, global, it, jest */
import {
  buildDbPayload,
  buildDbUpdatePayload,
  HttpDbAchievementClient,
} from "../../../services/achievementDbClient";
import { ApplicationError } from "../../../middlewares/errorHandler";

jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

function mockJsonResponse(
  body: unknown,
  ok = true,
  status = 200,
): {
  ok: boolean;
  status: number;
  headers: { get: jest.Mock };
  json: jest.Mock;
} {
  return {
    ok,
    status,
    headers: {
      get: jest.fn().mockReturnValue("application/json"),
    },
    json: jest.fn().mockResolvedValue(body),
  };
}

function buildDbAchievementResponse(overrides: Record<string, unknown> = {}): {
  id: string;
  title: string;
  description: string;
  goal: number;
  reward: number;
  label: string;
  public: boolean;
  downloads: number;
  visits: number;
  active: boolean;
  secret: boolean;
  image: string | null;
  channelId: string | null;
  typeAchievement: {
    id: string;
    label: string;
    data: string;
  };
} {
  return {
    id: "achievement-1",
    title: "First",
    description: "Desc",
    goal: 1,
    reward: 0,
    label: "",
    public: false,
    downloads: 0,
    visits: 0,
    active: true,
    secret: false,
    image: null,
    channelId: "channel-1",
    typeAchievement: {
      id: "type-1",
      label: "message",
      data: "",
    },
    ...overrides,
  };
}

describe("achievementDbClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("should build the DB payload", () => {
    expect(
      buildDbPayload(
        {
          title: "First",
          description: "Desc",
          goal: 1,
          reward: 0,
          label: "",
          public: true,
          active: true,
          secret: false,
          image: null,
          channelId: "channel-1",
          type: {
            label: "message",
            data: null,
          },
        },
        "type-1",
      ),
    ).toEqual({
      title: "First",
      description: "Desc",
      goal: 1,
      reward: 0,
      label: "",
      public: true,
      active: true,
      secret: false,
      image: null,
      channelId: "channel-1",
      typeId: "type-1",
    });
  });

  it("should build the DB update payload without channelId", () => {
    expect(
      buildDbUpdatePayload(
        {
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
        },
        "type-2",
      ),
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
      typeId: "type-2",
    });
  });

  it("should create an achievement through the DB service", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: "type-1",
          label: "message_content",
          data: "updated",
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse(buildDbAchievementResponse()));

    const client = new HttpDbAchievementClient();
    const achievement = await client.createAchievement({
      title: "First",
      description: "Desc",
      goal: 1,
      reward: 0,
      label: "",
      public: false,
      active: true,
      secret: false,
      image: null,
      channelId: "channel-1",
      type: {
        label: "message_content",
        data: "updated",
      },
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://db-service.test/type-achievements",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          label: "message_content",
          data: "updated",
        }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://db-service.test/achievements",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "First",
          description: "Desc",
          goal: 1,
          reward: 0,
          label: "",
          public: false,
          active: true,
          secret: false,
          image: null,
          channelId: "channel-1",
          typeId: "type-1",
        }),
      }),
    );
    expect(achievement.id).toBe("achievement-1");
  });

  it("should send an empty type data string for message achievements", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: "type-1",
          label: "message",
          data: "",
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse(buildDbAchievementResponse()));

    const client = new HttpDbAchievementClient();

    await client.createAchievement({
      title: "First",
      description: "Desc",
      goal: 1,
      reward: 0,
      label: "",
      public: false,
      active: true,
      secret: false,
      image: null,
      channelId: "channel-1",
      type: {
        label: "message",
        data: null,
      },
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://db-service.test/type-achievements",
      expect.objectContaining({
        body: JSON.stringify({
          label: "message",
          data: "",
        }),
      }),
    );
  });

  it("should reject invalid type creation payloads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({
        invalid: true,
      }),
    );

    const client = new HttpDbAchievementClient();

    await expect(
      client.createAchievement({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement type payload",
      ),
    );
  });

  it("should map type creation failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ message: "failure" }, false, 500),
    );

    const client = new HttpDbAchievementClient();

    await expect(
      client.createAchievement({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service could not create the achievement type",
      ),
    );
  });

  it("should reject non-json type creation payloads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const client = new HttpDbAchievementClient();

    await expect(
      client.createAchievement({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement type payload",
      ),
    );
  });

  it("should parse text DB responses successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: jest.fn().mockReturnValue("text/plain") },
      text: jest.fn().mockResolvedValue("some-text-response"),
    });

    const client = new HttpDbAchievementClient();

    await expect(
      client.createAchievement({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement type payload",
      ),
    );
  });

  it("should map 400 validation error for type creation", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ error: "bad" }, false, 400),
    );

    const client = new HttpDbAchievementClient();

    await expect(
      client.createAchievement({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(
        400,
        "db_service_validation_error",
        "DB service validation failed for achievement type",
        { error: "bad" }
      ),
    );
  });

  it("should map 422 validation error for type creation", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ error: "bad" }, false, 422),
    );

    const client = new HttpDbAchievementClient();

    await expect(
      client.createAchievement({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(
        422,
        "db_service_validation_error",
        "DB service validation failed for achievement type",
        { error: "bad" }
      ),
    );
  });

  it("should map generic < 500 error for type creation", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ error: "forbidden" }, false, 403),
    );

    const client = new HttpDbAchievementClient();

    await expect(
      client.createAchievement({
        title: "First",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: false,
        active: true,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(
        403,
        "db_service_error",
        "DB service could not create the achievement type",
        { error: "forbidden" }
      ),
    );
  });

  it("should update an achievement through the DB service", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: "type-2",
          label: "message_content",
          data: "updated",
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse(
          buildDbAchievementResponse({
            title: "Updated",
            typeAchievement: {
              id: "type-2",
              label: "message_content",
              data: "updated",
            },
          }),
        ),
      );

    const client = new HttpDbAchievementClient();
    const achievement = await client.updateAchievement("achievement-1", {
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

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://db-service.test/achievements/achievement-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          title: "Updated",
          description: "Desc",
          goal: 2,
          reward: 10,
          label: "",
          public: false,
          active: true,
          secret: false,
          image: null,
          typeId: "type-2",
        }),
      }),
    );
    expect(achievement.title).toBe("Updated");
  });

  it("should map update not found responses", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: "type-1",
          label: "message",
          data: "",
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({ message: "not found" }, false, 404),
      );

    const client = new HttpDbAchievementClient();

    await expect(
      client.updateAchievement("achievement-1", {
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
          label: "message",
          data: null,
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(404, "not_found", "Achievement not found"),
    );
  });

  it("should map 400 validation error in mapDbError", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ field: "invalid" }, false, 400),
    );

    const client = new HttpDbAchievementClient();

    await expect(client.getAchievementById("achievement-1")).rejects.toEqual(
      new ApplicationError(
        400,
        "db_service_validation_error",
        "DB service validation failed during get",
        { field: "invalid" }
      ),
    );
  });

  it("should map 422 validation error in mapDbError", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ field: "invalid" }, false, 422),
    );

    const client = new HttpDbAchievementClient();

    await expect(client.getAchievementById("achievement-1")).rejects.toEqual(
      new ApplicationError(
        422,
        "db_service_validation_error",
        "DB service validation failed during get",
        { field: "invalid" }
      ),
    );
  });

  it("should map 500 error to 502 in mapDbError", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ message: "failed" }, false, 500),
    );

    const client = new HttpDbAchievementClient();

    await expect(client.getAchievementById("achievement-1")).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service could not get the achievement",
        { message: "failed" }
      ),
    );
  });

  it("should map generic < 500 error in mapDbError", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ message: "forbidden" }, false, 403),
    );

    const client = new HttpDbAchievementClient();

    await expect(client.getAchievementById("achievement-1")).rejects.toEqual(
      new ApplicationError(
        403,
        "db_service_error",
        "DB service could not get the achievement",
        { message: "forbidden" }
      ),
    );
  });

  it("should get an achievement by id through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse(buildDbAchievementResponse()),
    );

    const client = new HttpDbAchievementClient();
    const achievement = await client.getAchievementById("achievement-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://db-service.test/achievements/achievement-1",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(achievement.id).toBe("achievement-1");
  });

  it("should delete an achievement through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse(buildDbAchievementResponse({ active: false })),
    );

    const client = new HttpDbAchievementClient();
    const achievement = await client.deleteAchievement("achievement-1");

    expect(achievement.active).toBe(false);
  });

  it("should deactivate and activate an achievement through the DB service", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockJsonResponse(buildDbAchievementResponse({ active: false })),
      )
      .mockResolvedValueOnce(
        mockJsonResponse(buildDbAchievementResponse({ active: true })),
      );

    const client = new HttpDbAchievementClient();
    const deactivated = await client.deactivateAchievement("achievement-1");
    const activated = await client.activateAchievement("achievement-1");

    expect(deactivated.active).toBe(false);
    expect(activated.active).toBe(true);
  });

  it("should get achievements by channel through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse([buildDbAchievementResponse()]),
    );

    const client = new HttpDbAchievementClient();
    const achievements = await client.getAchievementsByChannelId("channel-1");

    expect(achievements).toHaveLength(1);
    expect(achievements[0]?.channelId).toBe("channel-1");
  });

  it("should get public achievements through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse([
        buildDbAchievementResponse({
          public: true,
          channelId: null,
        }),
      ]),
    );

    const client = new HttpDbAchievementClient();
    const achievements = await client.getPublicAchievements();

    expect(achievements).toHaveLength(1);
    expect(achievements[0]?.public).toBe(true);
    expect(achievements[0]?.channelId).toBeNull();
  });

  it("should get achievements by user through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse([
        buildDbAchievementResponse({
          achieved: {
            achievementId: "achievement-1",
            userId: "user-1",
            count: 2,
            finished: true,
            labelActive: true,
            acquiredDate: "2025-09-01T10:00:00.000Z",
          },
        }),
      ]),
    );

    const client = new HttpDbAchievementClient();
    const achievements = await client.getAchievementsByUserId("user-1");

    expect(achievements[0]?.userState).toEqual({
      progressCount: 2,
      finished: true,
      acquiredDate: "2025-09-01T10:00:00.000Z",
    });
  });

  it("should unwrap achievements by user and channel from the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse({
        userId: "user-1",
        channelId: "channel-1",
        achievements: [
          buildDbAchievementResponse({
            achieved: null,
          }),
        ],
      }),
    );

    const client = new HttpDbAchievementClient();
    const achievements = await client.getAchievementsByUserIdAndChannelId(
      "user-1",
      "channel-1",
    );

    expect(achievements).toHaveLength(1);
    expect(achievements[0]?.userState).toEqual({
      progressCount: 0,
      finished: false,
      acquiredDate: null,
    });
  });

  it("should reject invalid wrapped user achievement payloads", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse({
        invalid: true,
      }),
    );

    const client = new HttpDbAchievementClient();

    await expect(
      client.getAchievementsByUserIdAndChannelId("user-1", "channel-1"),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid user achievement list payload",
      ),
    );
  });
});
