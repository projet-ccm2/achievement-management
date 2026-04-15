/* global describe, expect, it, jest */
import { Request, Response } from "express";
import {
  buildActivateAchievementHandler,
  buildCreateAchievementHandler,
  buildDeactivateAchievementHandler,
  buildDeleteAchievementHandler,
  buildGenerateAchievementSuggestionHandler,
  buildGetAchievementByIdHandler,
  buildGetAchievementsByChannelIdHandler,
  buildGetAchievementsByUserIdHandler,
  buildGetPublicAchievementsHandler,
  buildUpdateAchievementHandler,
} from "../../../controllers/achievementController";
import { ApplicationError } from "../../../middlewares/errorHandler";

describe("achievementController", () => {
  it("should parse the request and return a created achievement", async () => {
    const createAchievement = jest.fn().mockResolvedValue({
      id: "achievement-1",
      title: "First",
      description: "Desc",
      goal: 1,
      reward: 0,
      label: " ",
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
    const handler = buildCreateAchievementHandler(createAchievement);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        body: {
          title: " First ",
          description: "Desc",
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
        },
      } as Request,
      response,
      jest.fn(),
    );

    expect(createAchievement).toHaveBeenCalledWith({
      title: "First",
      description: "Desc",
      goal: 1,
      reward: 0,
      label: " ",
      public: false,
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
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it("should throw validation errors from the parser", async () => {
    const handler = buildCreateAchievementHandler(jest.fn());

    await expect(
      handler(
        {
          body: {
            title: "Any",
          },
        } as Request,
        {} as Response,
        jest.fn(),
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("should parse the prompt request and return an AI suggestion", async () => {
    const generateAchievementSuggestion = jest.fn().mockResolvedValue({
      title: "First",
      description: "Desc",
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
    const handler = buildGenerateAchievementSuggestionHandler(
      generateAchievementSuggestion,
    );
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        body: {
          prompt: " First achievement suggestion ",
        },
      } as Request,
      response,
      jest.fn(),
    );

    expect(generateAchievementSuggestion).toHaveBeenCalledWith({
      prompt: "First achievement suggestion",
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("should parse the update request and return the updated achievement", async () => {
    const updateAchievement = jest.fn().mockResolvedValue({
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
        label: "contentMessage",
        data: "updated",
      },
    });
    const handler = buildUpdateAchievementHandler(updateAchievement);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: {
          achievementId: "achievement-1",
        },
        body: {
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
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(updateAchievement).toHaveBeenCalledWith("achievement-1", {
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
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("should delete the achievement and return the deleted payload", async () => {
    const deleteAchievement = jest.fn().mockResolvedValue({
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
        label: "countMessage",
        data: null,
      },
    });
    const handler = buildDeleteAchievementHandler(deleteAchievement);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: {
          achievementId: "achievement-1",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(deleteAchievement).toHaveBeenCalledWith("achievement-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "achievement-1",
      }),
    );
  });

  it("should deactivate the achievement and return the updated payload", async () => {
    const deactivateAchievement = jest.fn().mockResolvedValue({
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
        label: "countMessage",
        data: null,
      },
    });
    const handler = buildDeactivateAchievementHandler(deactivateAchievement);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: {
          achievementId: "achievement-1",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(deactivateAchievement).toHaveBeenCalledWith("achievement-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "achievement-1",
        active: false,
      }),
    );
  });

  it("should activate the achievement and return the updated payload", async () => {
    const activateAchievement = jest.fn().mockResolvedValue({
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
        label: "countMessage",
        data: null,
      },
    });
    const handler = buildActivateAchievementHandler(activateAchievement);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: {
          achievementId: "achievement-1",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(activateAchievement).toHaveBeenCalledWith("achievement-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "achievement-1",
        active: true,
      }),
    );
  });

  it("should return the achievement by id", async () => {
    const getAchievementById = jest.fn().mockResolvedValue({
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
        label: "countMessage",
        data: null,
      },
    });
    const handler = buildGetAchievementByIdHandler(getAchievementById);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: {
          achievementId: "achievement-1",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(getAchievementById).toHaveBeenCalledWith("achievement-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "achievement-1",
      }),
    );
  });

  it("should return achievements by channel id", async () => {
    const getAchievementsByChannelId = jest.fn().mockResolvedValue([
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
          label: "countMessage",
          data: null,
        },
      },
    ]);
    const handler = buildGetAchievementsByChannelIdHandler(
      getAchievementsByChannelId,
    );
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: {
          channelId: "channel-1",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(getAchievementsByChannelId).toHaveBeenCalledWith("channel-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "achievement-1",
        }),
      ]),
    );
  });

  it("should return public achievements", async () => {
    const getPublicAchievements = jest.fn().mockResolvedValue([
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
          label: "countMessage",
          data: null,
        },
      },
    ]);
    const handler = buildGetPublicAchievementsHandler(getPublicAchievements);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler({} as Request, response, jest.fn());

    expect(getPublicAchievements).toHaveBeenCalledWith();
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "achievement-1",
          public: true,
        }),
      ]),
    );
  });

  it("should return achievements by user id with user state", async () => {
    const getAchievementsByUserId = jest.fn().mockResolvedValue([
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
          label: "countMessage",
          data: null,
        },
        userState: {
          progressCount: 2,
          finished: true,
          acquiredDate: "2025-09-01T10:00:00.000Z",
        },
      },
    ]);
    const handler = buildGetAchievementsByUserIdHandler(
      getAchievementsByUserId,
    );
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: {
          userId: "user-1",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(getAchievementsByUserId).toHaveBeenCalledWith("user-1");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "achievement-1",
          userState: expect.objectContaining({
            progressCount: 2,
            finished: true,
          }),
        }),
      ]),
    );
  });
});
