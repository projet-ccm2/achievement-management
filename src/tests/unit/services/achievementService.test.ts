/* global describe, expect, it, jest, require */
import { ApplicationError } from "../../../middlewares/errorHandler";
import {
  activateAchievementWithDependencies,
  createAchievementWithDependencies,
  deactivateAchievementWithDependencies,
  deleteAchievementWithDependencies,
  getAchievementByIdWithDependencies,
  getAchievementsByChannelIdWithDependencies,
  getAchievementsByUserIdAndChannelIdWithDependencies,
  getAchievementsByUserIdWithDependencies,
  getPublicAchievementsWithDependencies,
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
      deleteAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
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
      deleteAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
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
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));
    jest.doMock("../../../services/notificationCacheClient", () => ({
      notificationCacheClient: {
        invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
      },
    }));

    const {
      createAchievement,
    } = require("../../../services/achievementService");

    await expect(createAchievement(payload)).resolves.toEqual(
      createdAchievement,
    );
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
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn().mockResolvedValue(updatedAchievement),
      },
    }));
    jest.doMock("../../../services/notificationCacheClient", () => ({
      notificationCacheClient: {
        invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
      },
    }));

    const {
      updateAchievement,
    } = require("../../../services/achievementService");

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
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
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
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
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

  it("should use the default dependencies in deleteAchievement", async () => {
    jest.resetModules();

    const deletedAchievement = {
      id: "achievement-1",
      title: "Deleted",
      description: "Desc",
      goal: 1,
      reward: 0,
      label: "",
      public: false,
      downloads: 0,
      visits: 0,
      active: false,
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
        createAchievement: jest.fn(),
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn().mockResolvedValue(deletedAchievement),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));
    jest.doMock("../../../services/notificationCacheClient", () => ({
      notificationCacheClient: {
        invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
      },
    }));

    const {
      deleteAchievement,
    } = require("../../../services/achievementService");

    await expect(deleteAchievement("achievement-1")).resolves.toEqual(
      deletedAchievement,
    );
  });

  it("should delete and invalidate the cache", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Deleted",
        description: "Desc",
        goal: 2,
        reward: 10,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
    };

    const achievement = await deleteAchievementWithDependencies(
      "achievement-1",
      {
        dbClient,
        notificationClient,
      },
    );

    expect(dbClient.deleteAchievement).toHaveBeenCalledWith("achievement-1");
    expect(notificationClient.invalidateChannelCache).toHaveBeenCalledWith(
      "channel-1",
    );
    expect(achievement.id).toBe("achievement-1");
  });

  it("should surface notification invalidation failures after delete", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Deleted",
        description: "Desc",
        goal: 2,
        reward: 10,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(
      deleteAchievementWithDependencies("achievement-1", {
        dbClient,
        notificationClient,
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed after achievement deletion",
      ),
    );
  });

  it("should use the default dependencies in deactivateAchievement", async () => {
    jest.resetModules();

    const deactivatedAchievement = {
      id: "achievement-1",
      title: "Deactivated",
      description: "Desc",
      goal: 1,
      reward: 0,
      label: "",
      public: false,
      downloads: 0,
      visits: 0,
      active: false,
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
        createAchievement: jest.fn(),
        activateAchievement: jest.fn(),
        deactivateAchievement: jest
          .fn()
          .mockResolvedValue(deactivatedAchievement),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));
    jest.doMock("../../../services/notificationCacheClient", () => ({
      notificationCacheClient: {
        invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
      },
    }));

    const {
      deactivateAchievement,
    } = require("../../../services/achievementService");

    await expect(deactivateAchievement("achievement-1")).resolves.toEqual(
      deactivatedAchievement,
    );
  });

  it("should deactivate and invalidate the cache", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Deactivated",
        description: "Desc",
        goal: 2,
        reward: 10,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
    };

    const achievement = await deactivateAchievementWithDependencies(
      "achievement-1",
      {
        dbClient,
        notificationClient,
      },
    );

    expect(dbClient.deactivateAchievement).toHaveBeenCalledWith(
      "achievement-1",
    );
    expect(notificationClient.invalidateChannelCache).toHaveBeenCalledWith(
      "channel-1",
    );
    expect(achievement.active).toBe(false);
  });

  it("should surface notification invalidation failures after deactivation", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Deactivated",
        description: "Desc",
        goal: 2,
        reward: 10,
        label: "",
        public: false,
        downloads: 0,
        visits: 0,
        active: false,
        secret: false,
        image: null,
        channelId: "channel-1",
        type: {
          label: "message",
          data: null,
        },
      }),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(
      deactivateAchievementWithDependencies("achievement-1", {
        dbClient,
        notificationClient,
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed after achievement deactivation",
      ),
    );
  });

  it("should use the default dependencies in activateAchievement", async () => {
    jest.resetModules();

    const activatedAchievement = {
      id: "achievement-1",
      title: "Activated",
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
        createAchievement: jest.fn(),
        activateAchievement: jest.fn().mockResolvedValue(activatedAchievement),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));
    jest.doMock("../../../services/notificationCacheClient", () => ({
      notificationCacheClient: {
        invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
      },
    }));

    const {
      activateAchievement,
    } = require("../../../services/achievementService");

    await expect(activateAchievement("achievement-1")).resolves.toEqual(
      activatedAchievement,
    );
  });

  it("should activate and invalidate the cache", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Activated",
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
          label: "message",
          data: null,
        },
      }),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockResolvedValue(undefined),
    };

    const achievement = await activateAchievementWithDependencies(
      "achievement-1",
      {
        dbClient,
        notificationClient,
      },
    );

    expect(dbClient.activateAchievement).toHaveBeenCalledWith("achievement-1");
    expect(notificationClient.invalidateChannelCache).toHaveBeenCalledWith(
      "channel-1",
    );
    expect(achievement.active).toBe(true);
  });

  it("should surface notification invalidation failures after activation", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Activated",
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
          label: "message",
          data: null,
        },
      }),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };
    const notificationClient = {
      invalidateChannelCache: jest.fn().mockRejectedValue(new Error("boom")),
    };

    await expect(
      activateAchievementWithDependencies("achievement-1", {
        dbClient,
        notificationClient,
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "notification_handler_error",
        "Notification handler cache invalidation failed after achievement activation",
      ),
    );
  });

  it("should use the default dependencies in getAchievementById", async () => {
    jest.resetModules();

    const fetchedAchievement = {
      id: "achievement-1",
      title: "Fetched",
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
        createAchievement: jest.fn(),
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn().mockResolvedValue(fetchedAchievement),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));

    const {
      getAchievementById,
    } = require("../../../services/achievementService");

    await expect(getAchievementById("achievement-1")).resolves.toEqual(
      fetchedAchievement,
    );
  });

  it("should get an achievement by id through dependencies", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn().mockResolvedValue({
        id: "achievement-1",
        title: "Fetched",
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
          label: "message",
          data: null,
        },
      }),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };

    const achievement = await getAchievementByIdWithDependencies(
      "achievement-1",
      {
        dbClient,
      },
    );

    expect(dbClient.getAchievementById).toHaveBeenCalledWith("achievement-1");
    expect(achievement.id).toBe("achievement-1");
  });

  it("should use the default dependencies in getAchievementsByChannelId", async () => {
    jest.resetModules();

    const fetchedAchievements = [
      {
        id: "achievement-1",
        title: "Fetched",
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
      },
    ];

    jest.doMock("../../../services/achievementDbClient", () => ({
      dbAchievementClient: {
        createAchievement: jest.fn(),
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest
          .fn()
          .mockResolvedValue(fetchedAchievements),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));

    const {
      getAchievementsByChannelId,
    } = require("../../../services/achievementService");

    await expect(getAchievementsByChannelId("channel-1")).resolves.toEqual(
      fetchedAchievements,
    );
  });

  it("should get achievements by channel through dependencies", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn().mockResolvedValue([
        {
          id: "achievement-1",
          title: "Fetched",
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
            label: "message",
            data: null,
          },
        },
      ]),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };

    const achievements = await getAchievementsByChannelIdWithDependencies(
      "channel-1",
      {
        dbClient,
      },
    );

    expect(dbClient.getAchievementsByChannelId).toHaveBeenCalledWith(
      "channel-1",
    );
    expect(achievements).toHaveLength(1);
  });

  it("should use the default dependencies in getPublicAchievements", async () => {
    jest.resetModules();

    const fetchedAchievements = [
      {
        id: "achievement-1",
        title: "Public",
        description: "Desc",
        goal: 1,
        reward: 0,
        label: "",
        public: true,
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
      },
    ];

    jest.doMock("../../../services/achievementDbClient", () => ({
      dbAchievementClient: {
        createAchievement: jest.fn(),
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn().mockResolvedValue(fetchedAchievements),
        updateAchievement: jest.fn(),
      },
    }));

    const {
      getPublicAchievements,
    } = require("../../../services/achievementService");

    await expect(getPublicAchievements()).resolves.toEqual(fetchedAchievements);
  });

  it("should get public achievements through dependencies", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn().mockResolvedValue([
        {
          id: "achievement-1",
          title: "Public",
          description: "Desc",
          goal: 2,
          reward: 10,
          label: "",
          public: true,
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
        },
      ]),
      updateAchievement: jest.fn(),
    };

    const achievements = await getPublicAchievementsWithDependencies({
      dbClient,
    });

    expect(dbClient.getPublicAchievements).toHaveBeenCalledWith();
    expect(achievements).toHaveLength(1);
    expect(achievements[0]?.public).toBe(true);
  });

  it("should use the default dependencies in getAchievementsByUserId", async () => {
    jest.resetModules();

    const fetchedAchievements = [
      {
        id: "achievement-1",
        title: "Profile",
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
        userState: {
          progressCount: 1,
          finished: true,
          acquiredDate: "2025-09-01T10:00:00.000Z",
        },
      },
    ];

    jest.doMock("../../../services/achievementDbClient", () => ({
      dbAchievementClient: {
        createAchievement: jest.fn(),
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserId: jest
          .fn()
          .mockResolvedValue(fetchedAchievements),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));

    const {
      getAchievementsByUserId,
    } = require("../../../services/achievementService");

    await expect(getAchievementsByUserId("user-1")).resolves.toEqual(
      fetchedAchievements,
    );
  });

  it("should get achievements by user through dependencies", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn(),
      getAchievementsByUserId: jest.fn().mockResolvedValue([
        {
          id: "achievement-1",
          title: "Profile",
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
            label: "message",
            data: null,
          },
          userState: {
            progressCount: 2,
            finished: true,
            acquiredDate: "2025-09-01T10:00:00.000Z",
          },
        },
      ]),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };

    const achievements = await getAchievementsByUserIdWithDependencies(
      "user-1",
      {
        dbClient,
      },
    );

    expect(dbClient.getAchievementsByUserId).toHaveBeenCalledWith("user-1");
    expect(achievements).toHaveLength(1);
    expect(achievements[0]?.userState.progressCount).toBe(2);
  });

  it("should use the default dependencies in getAchievementsByUserIdAndChannelId", async () => {
    jest.resetModules();

    const fetchedAchievements = [
      {
        id: "achievement-1",
        title: "Profile",
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
        userState: {
          progressCount: 1,
          finished: true,
          acquiredDate: "2025-09-01T10:00:00.000Z",
        },
      },
    ];

    jest.doMock("../../../services/achievementDbClient", () => ({
      dbAchievementClient: {
        createAchievement: jest.fn(),
        activateAchievement: jest.fn(),
        deactivateAchievement: jest.fn(),
        deleteAchievement: jest.fn(),
        getAchievementById: jest.fn(),
        getAchievementsByChannelId: jest.fn(),
        getAchievementsByUserIdAndChannelId: jest
          .fn()
          .mockResolvedValue(fetchedAchievements),
        getAchievementsByUserId: jest.fn(),
        getPublicAchievements: jest.fn(),
        updateAchievement: jest.fn(),
      },
    }));

    const {
      getAchievementsByUserIdAndChannelId,
    } = require("../../../services/achievementService");

    await expect(
      getAchievementsByUserIdAndChannelId("user-1", "channel-1"),
    ).resolves.toEqual(fetchedAchievements);
  });

  it("should get achievements by user and channel through dependencies", async () => {
    const dbClient = {
      createAchievement: jest.fn(),
      activateAchievement: jest.fn(),
      deactivateAchievement: jest.fn(),
      deleteAchievement: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByChannelId: jest.fn(),
      getAchievementsByUserIdAndChannelId: jest.fn().mockResolvedValue([
        {
          id: "achievement-1",
          title: "Profile",
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
            label: "message",
            data: null,
          },
          userState: {
            progressCount: 2,
            finished: true,
            acquiredDate: "2025-09-01T10:00:00.000Z",
          },
        },
      ]),
      getAchievementsByUserId: jest.fn(),
      getPublicAchievements: jest.fn(),
      updateAchievement: jest.fn(),
    };

    const achievements =
      await getAchievementsByUserIdAndChannelIdWithDependencies(
        "user-1",
        "channel-1",
        {
          dbClient,
        },
      );

    expect(dbClient.getAchievementsByUserIdAndChannelId).toHaveBeenCalledWith(
      "user-1",
      "channel-1",
    );
    expect(achievements).toHaveLength(1);
    expect(achievements[0]?.channelId).toBe("channel-1");
  });
});
