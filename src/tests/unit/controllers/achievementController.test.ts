/* global describe, expect, it, jest */
import { Request, Response } from "express";
import {
  buildCreateAchievementHandler,
  buildDeleteAchievementHandler,
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
            label: "message",
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
        label: "message_content",
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
            label: "message-content",
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
      type: {
        label: "message_content",
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
        label: "message",
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
});
