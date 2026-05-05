/* global Response, beforeEach, describe, expect, it, jest, require */
import { ApplicationError } from "../../../middlewares/errorHandler";

jest.mock("../../../utils/http", () => ({
  timedFetch: jest.fn(),
}));

describe("achievementBucketClient", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should upload an achievement image and return the bucket key", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        imageId: "achievement-1",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage(
        {
          fileName: "achievement.png",
          mimeType: "image/png",
          contentBase64: "dGVzdA==",
        },
        "achievement-1",
      ),
    ).resolves.toBe("achievement-1");

    expect(timedFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://bucket-manager.test/bucket/image/insert",
        method: "POST",
        serviceName: "bucket-manager",
      }),
    );
  });

  it("should reconstruct the bucket key from imageId responses", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        success: true,
        imageId: "achievement-1",
        message: "Image uploaded successfully",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage(
        {
          fileName: "achievement.png",
          mimeType: "image/png",
          contentBase64: "dGVzdA==",
        },
        "achievement-1",
      ),
    ).resolves.toBe("achievement-1");
  });

  it("should accept data URL base64 payloads", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        imageId: "achievement-1",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage({
        fileName: "achievement.png",
        mimeType: "image/png",
        contentBase64: "data:image/png;base64,dGVzdA==",
      }),
    ).resolves.toBe("achievement-1");
  });

  it("should accept base64 payloads with embedded line breaks", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        imageId: "achievement-1",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage({
        fileName: "achievement.png",
        mimeType: "image/png",
        contentBase64: "dGVz\ndA==",
      }),
    ).resolves.toBe("achievement-1");
  });

  it("should accept legacy key payloads and extract imageId", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        key: "assets/image/achievement/achievement-1.webp",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage({
        fileName: "achievement.png",
        mimeType: "image/png",
        contentBase64: "dGVzdA==",
      }),
    ).resolves.toBe("achievement-1");
  });

  it("should retrieve a signed achievement image url", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        url: "https://bucket.test/signed-image",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(client.getAchievementImageUrl("achievement-1")).resolves.toBe(
      "https://bucket.test/signed-image",
    );
  });

  it("should upload a badge image and return the image id", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        imageId: "badge-1",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadBadgeImage(
        {
          fileName: "badge.png",
          mimeType: "image/png",
          contentBase64: "dGVzdA==",
        },
        "badge-1",
      ),
    ).resolves.toBe("badge-1");

    expect(timedFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://bucket-manager.test/bucket/image/insert",
        method: "POST",
        serviceName: "bucket-manager",
      }),
    );
  });

  it("should retrieve a signed badge image url", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        url: "https://bucket.test/signed-badge",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(client.getBadgeImageUrl("badge-1")).resolves.toBe(
      "https://bucket.test/signed-badge",
    );
  });

  it("should reject invalid base64 content", async () => {
    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage({
        fileName: "achievement.png",
        mimeType: "image/png",
        contentBase64: "%%%invalid%%%",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        400,
        "validation_error",
        "imageUpload.contentBase64 must be valid base64 content",
      ),
    );
  });

  it("should surface bucket manager validation errors", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        error: "image is required",
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage({
        fileName: "achievement.png",
        mimeType: "image/png",
        contentBase64: "dGVzdA==",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        400,
        "validation_error",
        "Bucket manager rejected the achievement image",
        {
          error: "image is required",
        },
      ),
    );
  });

  it("should reject invalid success payloads from bucket manager", async () => {
    const { timedFetch } = require("../../../utils/http");
    const response = new Response(
      JSON.stringify({
        id: "unexpected",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );

    timedFetch.mockResolvedValue(response);

    const {
      HttpBucketAchievementClient,
    } = require("../../../services/achievementBucketClient");
    const client = new HttpBucketAchievementClient();

    await expect(
      client.uploadAchievementImage({
        fileName: "achievement.png",
        mimeType: "image/png",
        contentBase64: "dGVzdA==",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "bucket_manager_error",
        "Bucket manager returned an invalid image payload",
      ),
    );
  });
});
