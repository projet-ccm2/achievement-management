/* global describe, expect, it, jest */
import {
  createChannelBadgeWithDependencies,
  getChannelBadgeWithDependencies,
  getUserBadgesWithDependencies,
  updateChannelBadgeWithDependencies,
} from "../../../services/achievementService";

describe("achievementService badge flows", () => {
  function createBucketClient() {
    return {
      uploadBadgeImage: jest.fn(),
      getBadgeImageUrl: jest
        .fn()
        .mockImplementation(async (imageId: string) => {
          return `https://bucket.test/${imageId}`;
        }),
    };
  }

  it("should return user badges with signed image urls", async () => {
    const dbClient = {
      getUserBadges: jest.fn().mockResolvedValue([
        {
          id: "badge-1",
          title: "Viewer legend",
          image: "badge-image-1",
        },
      ]),
    };
    const bucketClient = createBucketClient();

    const badges = await getUserBadgesWithDependencies("user-1", {
      bucketClient,
      dbClient,
    });

    expect(dbClient.getUserBadges).toHaveBeenCalledWith("user-1");
    expect(bucketClient.getBadgeImageUrl).toHaveBeenCalledWith("badge-image-1");
    expect(badges).toEqual([
      {
        id: "badge-1",
        title: "Viewer legend",
        image: "https://bucket.test/badge-image-1",
      },
    ]);
  });

  it("should return channel badge with signed image url", async () => {
    const dbClient = {
      getChannelBadge: jest.fn().mockResolvedValue({
        id: "badge-1",
        title: "Channel badge",
        image: "badge-image-1",
      }),
    };
    const bucketClient = createBucketClient();

    const badge = await getChannelBadgeWithDependencies("channel-1", {
      bucketClient,
      dbClient,
    });

    expect(dbClient.getChannelBadge).toHaveBeenCalledWith("channel-1");
    expect(badge).toEqual({
      id: "badge-1",
      title: "Channel badge",
      image: "https://bucket.test/badge-image-1",
    });
  });

  it("should upload the badge image before creating the channel badge", async () => {
    const dbClient = {
      createChannelBadge: jest.fn().mockResolvedValue({
        id: "badge-1",
        title: "Channel badge",
        image: "channel-1",
      }),
    };
    const bucketClient = {
      ...createBucketClient(),
      uploadBadgeImage: jest.fn().mockResolvedValue("channel-1"),
    };

    const badge = await createChannelBadgeWithDependencies(
      "channel-1",
      {
        title: "Channel badge",
        image: null,
        imageUpload: {
          fileName: "badge.png",
          mimeType: "image/png",
          contentBase64: "dGVzdA==",
        },
      },
      {
        bucketClient,
        dbClient,
      },
    );

    expect(bucketClient.uploadBadgeImage).toHaveBeenCalledWith(
      {
        fileName: "badge.png",
        mimeType: "image/png",
        contentBase64: "dGVzdA==",
      },
      "channel-1",
    );
    expect(dbClient.createChannelBadge).toHaveBeenCalledWith("channel-1", {
      title: "Channel badge",
      image: "channel-1",
      imageUpload: {
        fileName: "badge.png",
        mimeType: "image/png",
        contentBase64: "dGVzdA==",
      },
    });
    expect(badge.image).toBe("https://bucket.test/channel-1");
  });

  it("should update the channel badge with a signed image url", async () => {
    const dbClient = {
      updateChannelBadge: jest.fn().mockResolvedValue({
        id: "badge-1",
        title: "Updated badge",
        image: "badge-image-2",
      }),
    };
    const bucketClient = createBucketClient();

    const badge = await updateChannelBadgeWithDependencies(
      "channel-1",
      {
        title: "Updated badge",
      },
      {
        bucketClient,
        dbClient,
      },
    );

    expect(dbClient.updateChannelBadge).toHaveBeenCalledWith("channel-1", {
      title: "Updated badge",
      image: undefined,
      imageUpload: undefined,
    });
    expect(badge).toEqual({
      id: "badge-1",
      title: "Updated badge",
      image: "https://bucket.test/badge-image-2",
    });
  });

  it("should keep direct badge image urls unchanged", async () => {
    const dbClient = {
      getChannelBadge: jest.fn().mockResolvedValue({
        id: "badge-1",
        title: "Channel badge",
        image: "https://cdn.test/badge.png",
      }),
    };
    const bucketClient = createBucketClient();

    const badge = await getChannelBadgeWithDependencies("channel-1", {
      bucketClient,
      dbClient,
    });

    expect(bucketClient.getBadgeImageUrl).not.toHaveBeenCalled();
    expect(badge.image).toBe("https://cdn.test/badge.png");
  });
});
