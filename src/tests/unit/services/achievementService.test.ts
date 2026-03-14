import { ApplicationError } from "../../../middlewares/errorHandler";
import {
  createAchievementWithDependencies,
  updateAchievementWithDependencies,
} from "../../../services/achievementService";

describe("achievementService", () => {
  const payload = {
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
      label: "message" as const,
      data: null,
    },
  };

  it("should persist and invalidate the cache", async () => {
    const dbClient = {
      createAchievement: jest.fn().mockResolvedValue({
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
        type: {
          label: "message",
          data: null,
        },
      }),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
    };

    const achievement = await createAchievementWithDependencies(payload, {
      dbClient,
      notificationClient,
    });

    expect(dbClient.createAchievement).toHaveBeenCalledWith(payload);
    expect(notificationClient.invalidateChannelCache).toHaveBeenCalledWith(
      "channel-1",
    );
    expect(achievement.id).toBe("achievement-1");
  });

  it("should surface notification invalidation failures", async () => {
    const dbClient = {
      createAchievement: jest.fn().mockResolvedValue({
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
        type: {
          label: "message",
          data: null,
        },
      }),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(
      createAchievementWithDependencies(payload, {
        dbClient,
        notificationClient,
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed after achievement creation",
      ),
    );
  });

  it("should use the default dependencies in createAchievement", async () => {
    jest.resetModules();

    const createdAchievement = {
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
      type: {
        label: "message",
        data: null,
      },
    };

    jest.doMock("../../../services/achievementDbClient", () => ({
      dbAchievementClient: {
        createAchievement: jest.fn().mockResolvedValue(createdAchievement),
      },
    }));
    jest.doMock("../../../services/notificationCacheClient", () => ({
      notificationCacheClient: {
        invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
      },
    }));

    const { createAchievement } = require("../../../services/achievementService");

    await expect(createAchievement(payload)).resolves.toEqual(createdAchievement);
  });

  it("should use the default dependencies in updateAchievement", async () => {
    jest.resetModules();

    const updatedAchievement = {
      id: "achievement-1",
      title: "Updated",
      description: "Desc",
      goal: 2,
      reward: 10,
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
    };

    jest.doMock("../../../services/achievementDbClient", () => ({
      dbAchievementClient: {
        createAchievement: jest.fn(),
        updateAchievement: jest.fn().mockResolvedValue(updatedAchievement),
      },
    }));
    jest.doMock("../../../services/notificationCacheClient", () => ({
      notificationCacheClient: {
        invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
      },
    }));

    const { updateAchievement } = require("../../../services/achievementService");

    await expect(
      updateAchievement("achievement-1", {
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
    ).resolves.toEqual(updatedAchievement);
  });

  it("should update and invalidate the cache", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      updateAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Updated",
        description: "Desc",
        goal: 2,
        reward: 10,
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
      }),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
    };

    const achievement = await updateAchievementWithDependencies(
      "achievement-1",
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
      {
        dbClient,
        notificationClient,
      },
    );

    expect(dbClient.updateAchievement).toHaveBeenCalledWith("achievement-1", {
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
    expect(notificationClient.invalidateChannelCache).toHaveBeenCalledWith(
      "channel-1",
    );
    expect(achievement.title).toBe("Updated");
  });

  it("should surface notification invalidation failures after update", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      updateAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Updated",
        description: "Desc",
        goal: 2,
        reward: 10,
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
      }),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(
      updateAchievementWithDependencies(
        "achievement-1",
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
        {
          dbClient,
          notificationClient,
        },
      ),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed after achievement update",
      ),
    );
  });
});
