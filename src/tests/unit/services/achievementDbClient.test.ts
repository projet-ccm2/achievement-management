/* global afterEach, beforeEach, describe, expect, global, it, jest */
import {
  buildDbPayload,
  HttpDbAchievementClient,
} from "../../../services/achievementDbClient";
import { ApplicationError } from "../../../middlewares/errorHandler";

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
      buildDbPayload({
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
      }),
    ).toEqual({
      ["Achievement_Title"]: "First",
      ["Achievement_Description"]: "Desc",
      ["Achievement_Goal"]: 1,
      ["Achievement_Reward"]: 0,
      ["Achievement_Label"]: "",
      ["Achievement_Public"]: true,
      ["Achievement_Downloads"]: 0,
      ["Achievement_Visits"]: 0,
      ["Achievement_Active"]: true,
      ["Achievement_Secret"]: false,
      ["Achievement_Image"]: null,
      ["Chanel_ID"]: "channel-1",
      ["Type"]: {
        ["Type_Label"]: "message",
        ["Type_Data"]: null,
      },
    });
  });

  it("should create an achievement through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        ["Achievement_ID"]: "achievement-1",
        ["Achievement_Title"]: "First",
        ["Achievement_Description"]: "Desc",
        ["Achievement_Goal"]: 1,
        ["Achievement_Reward"]: 0,
        ["Achievement_Label"]: "",
        ["Achievement_Public"]: false,
        ["Achievement_Downloads"]: 0,
        ["Achievement_Visits"]: 0,
        ["Achievement_Active"]: true,
        ["Achievement_Secret"]: false,
        ["Achievement_Image"]: null,
        ["Chanel_ID"]: "channel-1",
        ["Type"]: {
          ["Type_Label"]: "message",
          ["Type_Data"]: null,
        },
      }),
    });

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
        label: "message",
        data: null,
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://db-service.test/achievements",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(achievement.id).toBe("achievement-1");
  });

  it("should map DB service failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "failure",
      }),
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
        "DB service could not create the achievement",
      ),
    );
  });

  it("should reject invalid non-json DB payloads", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("text/plain"),
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
        "DB service returned an invalid achievement payload",
      ),
    );
  });

  it("should handle responses without a content type header", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
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
        "DB service could not create the achievement",
      ),
    );
  });

  it("should update an achievement through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        ["Achievement_ID"]: "achievement-1",
        ["Achievement_Title"]: "Updated",
        ["Achievement_Description"]: "Desc",
        ["Achievement_Goal"]: 2,
        ["Achievement_Reward"]: 10,
        ["Achievement_Label"]: "",
        ["Achievement_Public"]: false,
        ["Achievement_Downloads"]: 0,
        ["Achievement_Visits"]: 0,
        ["Achievement_Active"]: true,
        ["Achievement_Secret"]: false,
        ["Achievement_Image"]: null,
        ["Chanel_ID"]: "channel-1",
        ["Type"]: {
          ["Type_Label"]: "message_content",
          ["Type_Data"]: "updated",
        },
      }),
    });

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

    expect(global.fetch).toHaveBeenCalledWith(
      "http://db-service.test/achievements/achievement-1",
      expect.objectContaining({
        method: "PUT",
      }),
    );
    expect(achievement.title).toBe("Updated");
  });

  it("should map update not found responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "not found",
      }),
    });

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
          label: "message_content",
          data: "updated",
        },
      }),
    ).rejects.toEqual(
      new ApplicationError(404, "not_found", "Achievement not found"),
    );
  });

  it("should delete an achievement through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        ["Achievement_ID"]: "achievement-1",
        ["Achievement_Title"]: "Deleted",
        ["Achievement_Description"]: "Desc",
        ["Achievement_Goal"]: 2,
        ["Achievement_Reward"]: 10,
        ["Achievement_Label"]: "",
        ["Achievement_Public"]: false,
        ["Achievement_Downloads"]: 0,
        ["Achievement_Visits"]: 0,
        ["Achievement_Active"]: false,
        ["Achievement_Secret"]: false,
        ["Achievement_Image"]: null,
        ["Chanel_ID"]: "channel-1",
        ["Type"]: {
          ["Type_Label"]: "message",
          ["Type_Data"]: null,
        },
      }),
    });

    const client = new HttpDbAchievementClient();
    const achievement = await client.deleteAchievement("achievement-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://db-service.test/achievements/achievement-1",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
    expect(achievement.id).toBe("achievement-1");
  });

  it("should map delete not found responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "not found",
      }),
    });

    const client = new HttpDbAchievementClient();

    await expect(client.deleteAchievement("achievement-1")).rejects.toEqual(
      new ApplicationError(404, "not_found", "Achievement not found"),
    );
  });

  it("should deactivate an achievement through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        ["Achievement_ID"]: "achievement-1",
        ["Achievement_Title"]: "Deactivated",
        ["Achievement_Description"]: "Desc",
        ["Achievement_Goal"]: 2,
        ["Achievement_Reward"]: 10,
        ["Achievement_Label"]: "",
        ["Achievement_Public"]: false,
        ["Achievement_Downloads"]: 0,
        ["Achievement_Visits"]: 0,
        ["Achievement_Active"]: false,
        ["Achievement_Secret"]: false,
        ["Achievement_Image"]: null,
        ["Chanel_ID"]: "channel-1",
        ["Type"]: {
          ["Type_Label"]: "message",
          ["Type_Data"]: null,
        },
      }),
    });

    const client = new HttpDbAchievementClient();
    const achievement = await client.deactivateAchievement("achievement-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://db-service.test/achievements/achievement-1/deactivate",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(achievement.active).toBe(false);
  });

  it("should map deactivate not found responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "not found",
      }),
    });

    const client = new HttpDbAchievementClient();

    await expect(client.deactivateAchievement("achievement-1")).rejects.toEqual(
      new ApplicationError(404, "not_found", "Achievement not found"),
    );
  });

  it("should activate an achievement through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        ["Achievement_ID"]: "achievement-1",
        ["Achievement_Title"]: "Activated",
        ["Achievement_Description"]: "Desc",
        ["Achievement_Goal"]: 2,
        ["Achievement_Reward"]: 10,
        ["Achievement_Label"]: "",
        ["Achievement_Public"]: false,
        ["Achievement_Downloads"]: 0,
        ["Achievement_Visits"]: 0,
        ["Achievement_Active"]: true,
        ["Achievement_Secret"]: false,
        ["Achievement_Image"]: null,
        ["Chanel_ID"]: "channel-1",
        ["Type"]: {
          ["Type_Label"]: "message",
          ["Type_Data"]: null,
        },
      }),
    });

    const client = new HttpDbAchievementClient();
    const achievement = await client.activateAchievement("achievement-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://db-service.test/achievements/achievement-1/activate",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(achievement.active).toBe(true);
  });

  it("should map activate not found responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "not found",
      }),
    });

    const client = new HttpDbAchievementClient();

    await expect(client.activateAchievement("achievement-1")).rejects.toEqual(
      new ApplicationError(404, "not_found", "Achievement not found"),
    );
  });

  it("should get an achievement by id through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        ["Achievement_ID"]: "achievement-1",
        ["Achievement_Title"]: "Fetched",
        ["Achievement_Description"]: "Desc",
        ["Achievement_Goal"]: 2,
        ["Achievement_Reward"]: 10,
        ["Achievement_Label"]: "",
        ["Achievement_Public"]: false,
        ["Achievement_Downloads"]: 0,
        ["Achievement_Visits"]: 0,
        ["Achievement_Active"]: true,
        ["Achievement_Secret"]: false,
        ["Achievement_Image"]: null,
        ["Chanel_ID"]: "channel-1",
        ["Type"]: {
          ["Type_Label"]: "message",
          ["Type_Data"]: null,
        },
      }),
    });

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

  it("should map get by id not found responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "not found",
      }),
    });

    const client = new HttpDbAchievementClient();

    await expect(client.getAchievementById("achievement-1")).rejects.toEqual(
      new ApplicationError(404, "not_found", "Achievement not found"),
    );
  });

  it("should get achievements by channel through the DB service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue([
        {
          ["Achievement_ID"]: "achievement-1",
          ["Achievement_Title"]: "Fetched",
          ["Achievement_Description"]: "Desc",
          ["Achievement_Goal"]: 2,
          ["Achievement_Reward"]: 10,
          ["Achievement_Label"]: "",
          ["Achievement_Public"]: false,
          ["Achievement_Downloads"]: 0,
          ["Achievement_Visits"]: 0,
          ["Achievement_Active"]: true,
          ["Achievement_Secret"]: false,
          ["Achievement_Image"]: null,
          ["Chanel_ID"]: "channel-1",
          ["Type"]: {
            ["Type_Label"]: "message",
            ["Type_Data"]: null,
          },
        },
      ]),
    });

    const client = new HttpDbAchievementClient();
    const achievements = await client.getAchievementsByChannelId("channel-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://db-service.test/achievements/channel/channel-1",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(achievements).toHaveLength(1);
  });

  it("should reject invalid achievement list payloads", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        invalid: true,
      }),
    });

    const client = new HttpDbAchievementClient();

    await expect(
      client.getAchievementsByChannelId("channel-1"),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement list payload",
      ),
    );
  });

  it("should map channel list DB service failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "failure",
      }),
    });

    const client = new HttpDbAchievementClient();

    await expect(
      client.getAchievementsByChannelId("channel-1"),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "db_service_error",
        "DB service could not get the achievement",
      ),
    );
  });
});
