/* global Blob, Buffer, FormData, Response */
import { randomUUID } from "node:crypto";
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import { AchievementImageUpload } from "../utils/achievementPayload";
import { timedFetch } from "../utils/http";

/* eslint-disable no-unused-vars */
interface BucketAchievementClient {
  uploadAchievementImage(
    imageUpload: AchievementImageUpload,
    elementId?: string,
  ): Promise<string>;
  getAchievementImageUrl(imageId: string): Promise<string>;
}
/* eslint-enable no-unused-vars */

function decodeBase64Content(contentBase64: string): Buffer {
  const trimmedContent = contentBase64.trim();
  const dataUrlPrefixPattern = /^data:[^;]+;base64,(.+)$/;
  const dataUrlPrefixMatch = dataUrlPrefixPattern.exec(trimmedContent);
  const normalizedContentSource = dataUrlPrefixMatch
    ? dataUrlPrefixMatch[1]
    : trimmedContent;
  const normalizedContent = normalizedContentSource.split(/\s+/).join("");

  if (!/^[A-Za-z0-9+/=]+$/.test(normalizedContent)) {
    throw new ApplicationError(
      400,
      "validation_error",
      "imageUpload.contentBase64 must be valid base64 content",
    );
  }

  return Buffer.from(normalizedContent, "base64");
}

function parseBucketResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function buildAchievementBucketKey(imageId: string): string {
  return `assets/image/achievement/${imageId}.webp`;
}

function extractAchievementImageIdFromKey(key: string): string | null {
  const normalizedKey = key.trim();
  const keyPattern = /^assets\/image\/achievement\/([^/]+)\.webp$/;
  const keyMatch = keyPattern.exec(normalizedKey);

  return keyMatch ? keyMatch[1] : null;
}

class HttpBucketAchievementClient implements BucketAchievementClient {
  public async uploadAchievementImage(
    imageUpload: AchievementImageUpload,
    elementId: string = randomUUID(),
  ): Promise<string> {
    const body = new FormData();
    const imageBuffer = decodeBase64Content(imageUpload.contentBase64);
    const imageBlob = new Blob([Uint8Array.from(imageBuffer)], {
      type: imageUpload.mimeType,
    });

    body.append("image", imageBlob, imageUpload.fileName);
    body.append("typeImage", "achievement");
    body.append("elementId", elementId);

    const response = await timedFetch({
      url: `${config.bucketManagerUrl}/bucket/image/insert`,
      method: "POST",
      serviceName: "bucket-manager",
      errorCode: "bucket_manager_error",
      networkErrorMessage:
        "Bucket manager could not upload the achievement image",
      timeoutErrorMessage:
        "Bucket manager request timed out while uploading the achievement image",
      init: {
        method: "POST",
        body,
      },
    });
    const parsedBody = await parseBucketResponse(response);

    if (!response.ok) {
      if (response.status === 400 || response.status === 422) {
        throw new ApplicationError(
          400,
          "validation_error",
          "Bucket manager rejected the achievement image",
          parsedBody,
        );
      }

      throw new ApplicationError(
        response.status >= 500 ? 502 : response.status,
        "bucket_manager_error",
        "Bucket manager could not upload the achievement image",
        parsedBody,
      );
    }

    const bodyRecord = parsedBody as {
      imageId?: unknown;
      key?: unknown;
    } | null;

    if (!bodyRecord) {
      throw new ApplicationError(
        502,
        "bucket_manager_error",
        "Bucket manager returned an invalid image payload",
      );
    }

    if (typeof bodyRecord.imageId === "string") {
      return bodyRecord.imageId;
    }

    if (typeof bodyRecord.key === "string") {
      const extractedImageId = extractAchievementImageIdFromKey(bodyRecord.key);

      if (extractedImageId) {
        return extractedImageId;
      }
    }

    throw new ApplicationError(
      502,
      "bucket_manager_error",
      "Bucket manager returned an invalid image payload",
    );
  }

  public async getAchievementImageUrl(imageId: string): Promise<string> {
    const response = await timedFetch({
      url: `${config.bucketManagerUrl}/bucket/image/get?typeImage=achievement&elementId=${encodeURIComponent(
        imageId,
      )}`,
      method: "GET",
      serviceName: "bucket-manager",
      errorCode: "bucket_manager_error",
      networkErrorMessage:
        "Bucket manager could not retrieve the achievement image URL",
      timeoutErrorMessage:
        "Bucket manager request timed out while retrieving the achievement image URL",
      init: {
        method: "GET",
      },
    });
    const parsedBody = await parseBucketResponse(response);

    if (!response.ok) {
      throw new ApplicationError(
        response.status >= 500 ? 502 : response.status,
        "bucket_manager_error",
        "Bucket manager could not retrieve the achievement image URL",
        parsedBody,
      );
    }

    const bodyRecord = parsedBody as { url?: unknown } | null;

    if (!bodyRecord || typeof bodyRecord.url !== "string") {
      throw new ApplicationError(
        502,
        "bucket_manager_error",
        "Bucket manager returned an invalid image URL payload",
      );
    }

    return bodyRecord.url;
  }
}

const bucketAchievementClient: BucketAchievementClient =
  new HttpBucketAchievementClient();

export {
  buildAchievementBucketKey,
  extractAchievementImageIdFromKey,
  HttpBucketAchievementClient,
  bucketAchievementClient,
};
export type { BucketAchievementClient };
