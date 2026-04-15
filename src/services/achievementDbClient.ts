/* global Response, URLSearchParams */
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import {
  Achievement,
  AchievementLeaderboardEntry,
  UserAchievement,
} from "../models/achievement";
import { logger } from "../utils/logger";
import {
  AchievementLeaderboardQuery,
  CreateAchievementRequest,
  mapDbAchievementLeaderboardResponse,
  mapDbAchievementToResponse,
  mapDbAchievementsToResponse,
  mapDbUserAchievementsToResponse,
  UpdateAchievementRequest,
} from "../utils/achievementPayload";
import { timedFetch } from "../utils/http";

/* eslint-disable no-unused-vars */
type DbAchievementClient = {
  getAchievementById: (...args: [string]) => Promise<Achievement>;
  getAchievementsByChannelId: (...args: [string]) => Promise<Achievement[]>;
  getPublicAchievements: () => Promise<Achievement[]>;
  getAchievementLeaderboardByChannelId: (
    ...args: [string, AchievementLeaderboardQuery]
  ) => Promise<AchievementLeaderboardEntry[]>;
  getAchievementsByUserId: (...args: [string]) => Promise<UserAchievement[]>;
  getAchievementsByUserIdAndChannelId: (
    ...args: [string, string]
  ) => Promise<UserAchievement[]>;
  createAchievement: (
    ...args: [CreateAchievementRequest]
  ) => Promise<Achievement>;
  updateAchievement: (
    ...args: [string, UpdateAchievementRequest]
  ) => Promise<Achievement>;
  deleteAchievement: (...args: [string]) => Promise<Achievement>;
  deactivateAchievement: (...args: [string]) => Promise<Achievement>;
  activateAchievement: (...args: [string]) => Promise<Achievement>;
};
/* eslint-enable no-unused-vars */

function buildDbPayload(
  payload: CreateAchievementRequest,
  typeId: string,
): Record<string, unknown> {
  const normalizedLabel =
    payload.label.trim().length === 0 ? " " : payload.label;

  return {
    title: payload.title,
    description: payload.description,
    goal: payload.goal,
    reward: payload.reward,
    label: normalizedLabel,
    public: payload.public,
    active: payload.active,
    secret: payload.secret,
    image: payload.image,
    channelId: payload.channelId,
    typeId,
  };
}

function buildDbUpdatePayload(
  payload: UpdateAchievementRequest,
  typeId: string,
): Record<string, unknown> {
  const normalizedLabel =
    payload.label.trim().length === 0 ? " " : payload.label;

  return {
    title: payload.title,
    description: payload.description,
    goal: payload.goal,
    reward: payload.reward,
    label: normalizedLabel,
    public: payload.public,
    active: payload.active,
    secret: payload.secret,
    image: payload.image,
    typeId,
  };
}

async function parseDbResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function mapDbError(
  response: Response,
  operation: "get" | "create" | "update" | "delete" | "deactivate" | "activate",
  body?: unknown,
): Error {
  if (response.status === 404) {
    return new ApplicationError(404, "not_found", "Achievement not found");
  }

  if (response.status === 400 || response.status === 422) {
    return new ApplicationError(
      response.status,
      "db_service_validation_error",
      `DB service validation failed during ${operation}`,
      body,
    );
  }

  return new ApplicationError(
    response.status >= 500 ? 502 : response.status,
    "db_service_error",
    `DB service could not ${operation} the achievement`,
    body,
  );
}

interface DbRequestOptions {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  operation: "get" | "create" | "update" | "delete" | "deactivate" | "activate";
  requestBody?: Record<string, unknown>;
  logOperation: string;
  networkErrorMessage: string;
  timeoutErrorMessage: string;
}

/* eslint-disable no-unused-vars */
type DbResponseMapper<T> = (...args: [unknown]) => T;
/* eslint-enable no-unused-vars */

function buildTypeAchievementPayload(
  payload: CreateAchievementRequest | UpdateAchievementRequest,
): Record<string, string> {
  return {
    label: payload.type.label,
    data: payload.type.data ?? "",
  };
}

class HttpDbAchievementClient implements DbAchievementClient {
  private async createTypeAchievement(
    payload: CreateAchievementRequest | UpdateAchievementRequest,
  ): Promise<string> {
    const url = `${config.dbServiceUrl}/type-achievements`;
    const response = await timedFetch({
      url,
      method: "POST",
      serviceName: "db-service",
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not create the achievement type",
      timeoutErrorMessage:
        "DB service request timed out while creating the achievement type",
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildTypeAchievementPayload(payload)),
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "createTypeAchievement",
        method: "POST",
        url,
        status: response.status,
        body,
      });

      if (response.status === 400 || response.status === 422) {
        throw new ApplicationError(
          response.status,
          "db_service_validation_error",
          "DB service validation failed for achievement type",
          body,
        );
      }

      throw new ApplicationError(
        response.status >= 500 ? 502 : response.status,
        "db_service_error",
        "DB service could not create the achievement type",
        body,
      );
    }

    const parsedBody = body as { id?: unknown } | null;

    if (!parsedBody || typeof parsedBody.id !== "string") {
      throw new ApplicationError(
        502,
        "db_service_error",
        "DB service returned an invalid achievement type payload",
      );
    }

    return parsedBody.id;
  }

  private async requestDb<T>(
    options: DbRequestOptions,
    mapBody: DbResponseMapper<T>,
  ): Promise<T> {
    const response = await timedFetch({
      url: options.url,
      method: options.method,
      serviceName: "db-service",
      errorCode: "db_service_error",
      networkErrorMessage: options.networkErrorMessage,
      timeoutErrorMessage: options.timeoutErrorMessage,
      init: options.requestBody
        ? {
            method: options.method,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(options.requestBody),
          }
        : {
            method: options.method,
          },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: options.logOperation,
        method: options.method,
        url: options.url,
        status: response.status,
        body,
      });
      throw mapDbError(response, options.operation, body);
    }

    return mapBody(body);
  }

  public async getAchievementById(achievementId: string): Promise<Achievement> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`,
        method: "GET",
        operation: "get",
        logOperation: "getAchievementById",
        networkErrorMessage: "DB service could not get the achievement",
        timeoutErrorMessage:
          "DB service request timed out while getting the achievement",
      },
      mapDbAchievementToResponse,
    );
  }

  public async getAchievementsByChannelId(
    channelId: string,
  ): Promise<Achievement[]> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/channel/${encodeURIComponent(channelId)}`,
        method: "GET",
        operation: "get",
        logOperation: "getAchievementsByChannelId",
        networkErrorMessage: "DB service could not get the achievement",
        timeoutErrorMessage:
          "DB service request timed out while getting the achievement",
      },
      mapDbAchievementsToResponse,
    );
  }

  public async getPublicAchievements(): Promise<Achievement[]> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/public`,
        method: "GET",
        operation: "get",
        logOperation: "getPublicAchievements",
        networkErrorMessage: "DB service could not get the achievement",
        timeoutErrorMessage:
          "DB service request timed out while getting the achievement",
      },
      mapDbAchievementsToResponse,
    );
  }

  public async getAchievementLeaderboardByChannelId(
    channelId: string,
    query: AchievementLeaderboardQuery,
  ): Promise<AchievementLeaderboardEntry[]> {
    const searchParams = new URLSearchParams();

    if (query.limit !== undefined) {
      searchParams.set("limit", String(query.limit));
    }

    if (query.sort) {
      searchParams.set("sort", query.sort);
    }

    const querySuffix =
      searchParams.size > 0 ? `?${searchParams.toString()}` : "";

    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/channel/${encodeURIComponent(channelId)}/leaderboard${querySuffix}`,
        method: "GET",
        operation: "get",
        logOperation: "getAchievementLeaderboardByChannelId",
        networkErrorMessage:
          "DB service could not get the achievement leaderboard",
        timeoutErrorMessage:
          "DB service request timed out while getting the achievement leaderboard",
      },
      mapDbAchievementLeaderboardResponse,
    );
  }

  public async getAchievementsByUserId(
    userId: string,
  ): Promise<UserAchievement[]> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/user/${encodeURIComponent(userId)}`,
        method: "GET",
        operation: "get",
        logOperation: "getAchievementsByUserId",
        networkErrorMessage: "DB service could not get the achievement",
        timeoutErrorMessage:
          "DB service request timed out while getting the achievement",
      },
      mapDbUserAchievementsToResponse,
    );
  }

  public async getAchievementsByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<UserAchievement[]> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/user/${encodeURIComponent(userId)}/channel/${encodeURIComponent(channelId)}`,
        method: "GET",
        operation: "get",
        logOperation: "getAchievementsByUserIdAndChannelId",
        networkErrorMessage: "DB service could not get the achievement",
        timeoutErrorMessage:
          "DB service request timed out while getting the achievement",
      },
      mapDbUserAchievementsToResponse,
    );
  }

  public async createAchievement(
    payload: CreateAchievementRequest,
  ): Promise<Achievement> {
    const typeId = await this.createTypeAchievement(payload);

    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements`,
        method: "POST",
        operation: "create",
        logOperation: "createAchievement",
        requestBody: buildDbPayload(payload, typeId),
        networkErrorMessage: "DB service could not create the achievement",
        timeoutErrorMessage:
          "DB service request timed out while creating the achievement",
      },
      mapDbAchievementToResponse,
    );
  }

  public async updateAchievement(
    achievementId: string,
    payload: UpdateAchievementRequest,
  ): Promise<Achievement> {
    const typeId = await this.createTypeAchievement(payload);

    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`,
        method: "PUT",
        operation: "update",
        logOperation: "updateAchievement",
        requestBody: buildDbUpdatePayload(payload, typeId),
        networkErrorMessage: "DB service could not update the achievement",
        timeoutErrorMessage:
          "DB service request timed out while updating the achievement",
      },
      mapDbAchievementToResponse,
    );
  }

  public async deleteAchievement(achievementId: string): Promise<Achievement> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`,
        method: "DELETE",
        operation: "delete",
        logOperation: "deleteAchievement",
        networkErrorMessage: "DB service could not delete the achievement",
        timeoutErrorMessage:
          "DB service request timed out while deleting the achievement",
      },
      mapDbAchievementToResponse,
    );
  }

  public async deactivateAchievement(
    achievementId: string,
  ): Promise<Achievement> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}/deactivate`,
        method: "PATCH",
        operation: "deactivate",
        logOperation: "deactivateAchievement",
        networkErrorMessage: "DB service could not deactivate the achievement",
        timeoutErrorMessage:
          "DB service request timed out while deactivating the achievement",
      },
      mapDbAchievementToResponse,
    );
  }

  public async activateAchievement(
    achievementId: string,
  ): Promise<Achievement> {
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}/activate`,
        method: "PATCH",
        operation: "activate",
        logOperation: "activateAchievement",
        networkErrorMessage: "DB service could not activate the achievement",
        timeoutErrorMessage:
          "DB service request timed out while activating the achievement",
      },
      mapDbAchievementToResponse,
    );
  }
}

const dbAchievementClient: DbAchievementClient = new HttpDbAchievementClient();

export {
  HttpDbAchievementClient,
  buildDbPayload,
  buildDbUpdatePayload,
  dbAchievementClient,
};
export type { DbAchievementClient };
