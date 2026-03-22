/* global Response */
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import { Achievement, UserAchievement } from "../models/achievement";
import { logger } from "../utils/logger";
import {
  CreateAchievementRequest,
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

function buildBaseDbPayload(
  payload: CreateAchievementRequest | UpdateAchievementRequest,
): Record<string, unknown> {
  return {
    ["Achievement_Title"]: payload.title,
    ["Achievement_Description"]: payload.description,
    ["Achievement_Goal"]: payload.goal,
    ["Achievement_Reward"]: payload.reward,
    ["Achievement_Label"]: payload.label,
    ["Achievement_Public"]: payload.public,
    ["Achievement_Active"]: payload.active,
    ["Achievement_Secret"]: payload.secret,
    ["Achievement_Image"]: payload.image,
    ["Type"]: {
      ["Type_Label"]: payload.type.label,
      ["Type_Data"]: payload.type.data,
    },
  };
}

function buildDbPayload(
  payload: CreateAchievementRequest,
): Record<string, unknown> {
  return {
    ...buildBaseDbPayload(payload),
    ["Achievement_Downloads"]: 0,
    ["Achievement_Visits"]: 0,
    ["Chanel_ID"]: payload.channelId,
  };
}

function buildDbUpdatePayload(
  payload: UpdateAchievementRequest,
): Record<string, unknown> {
  return buildBaseDbPayload(payload);
}

async function parseDbResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return null;
}

function mapDbError(
  response: Response,
  operation: "get" | "create" | "update" | "delete" | "deactivate" | "activate",
): Error {
  if (response.status === 404) {
    return new ApplicationError(404, "not_found", "Achievement not found");
  }

  return new ApplicationError(
    502,
    "db_service_error",
    `DB service could not ${operation} the achievement`,
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

class HttpDbAchievementClient implements DbAchievementClient {
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
      });
      throw mapDbError(response, options.operation);
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
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements`,
        method: "POST",
        operation: "create",
        logOperation: "createAchievement",
        requestBody: buildDbPayload(payload),
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
    return this.requestDb(
      {
        url: `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`,
        method: "PUT",
        operation: "update",
        logOperation: "updateAchievement",
        requestBody: buildDbUpdatePayload(payload),
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
