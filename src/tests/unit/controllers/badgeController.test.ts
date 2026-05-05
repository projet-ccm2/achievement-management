/* global describe, expect, it, jest */
import { Request, Response } from "express";
import {
  buildCreateChannelBadgeHandler,
  buildGetChannelBadgeHandler,
  buildGetUserBadgesHandler,
  buildUpdateChannelBadgeHandler,
} from "../../../controllers/achievementController";
import { ApplicationError } from "../../../middlewares/errorHandler";

describe("badge controller handlers", () => {
  it("should parse and create a channel badge", async () => {
    const createChannelBadge = jest.fn().mockResolvedValue({
      id: "badge-1",
      title: "Channel badge",
      image: "https://bucket.test/channel-1",
    });
    const handler = buildCreateChannelBadgeHandler(createChannelBadge);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: { channelId: "channel-1" },
        body: {
          title: " Channel badge ",
          image: "https://cdn.test/badge.png",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(createChannelBadge).toHaveBeenCalledWith("channel-1", {
      title: "Channel badge",
      image: "https://cdn.test/badge.png",
      imageUpload: null,
    });
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it("should throw validation errors for invalid badge create payloads", async () => {
    const handler = buildCreateChannelBadgeHandler(jest.fn());

    await expect(
      handler(
        {
          params: { channelId: "channel-1" },
          body: {
            title: "Badge",
          },
        } as unknown as Request,
        {} as Response,
        jest.fn(),
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("should parse and update a channel badge", async () => {
    const updateChannelBadge = jest.fn().mockResolvedValue({
      id: "badge-1",
      title: "Updated badge",
      image: "https://bucket.test/channel-1",
    });
    const handler = buildUpdateChannelBadgeHandler(updateChannelBadge);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: { channelId: "channel-1" },
        body: {
          title: " Updated badge ",
        },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(updateChannelBadge).toHaveBeenCalledWith("channel-1", {
      title: "Updated badge",
      imageUpload: null,
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("should return the channel badge", async () => {
    const getChannelBadge = jest.fn().mockResolvedValue({
      id: "badge-1",
      title: "Channel badge",
      image: "https://bucket.test/channel-1",
    });
    const handler = buildGetChannelBadgeHandler(getChannelBadge);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: { channelId: "channel-1" },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(getChannelBadge).toHaveBeenCalledWith("channel-1");
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("should return the user badges", async () => {
    const getUserBadges = jest.fn().mockResolvedValue([
      {
        id: "badge-1",
        title: "Viewer legend",
        image: "https://bucket.test/badge-1",
      },
    ]);
    const handler = buildGetUserBadgesHandler(getUserBadges);
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await handler(
      {
        params: { userId: "user-1" },
      } as unknown as Request,
      response,
      jest.fn(),
    );

    expect(getUserBadges).toHaveBeenCalledWith("user-1");
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
