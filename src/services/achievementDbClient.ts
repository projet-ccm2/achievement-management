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

class HttpDbAchievementClient implements DbAchievementClient {
  public async getAchievementById(achievementId: string): Promise<Achievement> {
    const url = `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`;
    const response = await timedFetch({
      url,
      method: "GET",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not get the achievement",
      timeoutErrorMessage:
        "DB service request timed out while getting the achievement",
      init: {
        method: "GET",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "getAchievementById",
        method: "GET",
        url,
        status: response.status,
      });
      throw mapDbError(response, "get");
    }

    return mapDbAchievementToResponse(body);
  }

  public async getAchievementsByChannelId(
    channelId: string,
  ): Promise<Achievement[]> {
    const url = `${config.dbServiceUrl}/achievements/channel/${encodeURIComponent(channelId)}`;
    const response = await timedFetch({
      url,
      method: "GET",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not get the achievement",
      timeoutErrorMessage:
        "DB service request timed out while getting the achievement",
      init: {
        method: "GET",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "getAchievementsByChannelId",
        method: "GET",
        url,
        status: response.status,
      });
      throw mapDbError(response, "get");
    }

    return mapDbAchievementsToResponse(body);
  }

  public async getPublicAchievements(): Promise<Achievement[]> {
    const url = `${config.dbServiceUrl}/achievements/public`;
    const response = await timedFetch({
      url,
      method: "GET",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not get the achievement",
      timeoutErrorMessage:
        "DB service request timed out while getting the achievement",
      init: {
        method: "GET",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "getPublicAchievements",
        method: "GET",
        url,
        status: response.status,
      });
      throw mapDbError(response, "get");
    }

    return mapDbAchievementsToResponse(body);
  }

  public async getAchievementsByUserId(
    userId: string,
  ): Promise<UserAchievement[]> {
    const url = `${config.dbServiceUrl}/achievements/user/${encodeURIComponent(userId)}`;
    const response = await timedFetch({
      url,
      method: "GET",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not get the achievement",
      timeoutErrorMessage:
        "DB service request timed out while getting the achievement",
      init: {
        method: "GET",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "getAchievementsByUserId",
        method: "GET",
        url,
        status: response.status,
      });
      throw mapDbError(response, "get");
    }

    return mapDbUserAchievementsToResponse(body);
  }

  public async getAchievementsByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<UserAchievement[]> {
    const url = `${config.dbServiceUrl}/achievements/user/${encodeURIComponent(userId)}/channel/${encodeURIComponent(channelId)}`;
    const response = await timedFetch({
      url,
      method: "GET",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not get the achievement",
      timeoutErrorMessage:
        "DB service request timed out while getting the achievement",
      init: {
        method: "GET",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "getAchievementsByUserIdAndChannelId",
        method: "GET",
        url,
        status: response.status,
      });
      throw mapDbError(response, "get");
    }

    return mapDbUserAchievementsToResponse(body);
  }

  public async createAchievement(
    payload: CreateAchievementRequest,
  ): Promise<Achievement> {
    const url = `${config.dbServiceUrl}/achievements`;
    const response = await timedFetch({
      url,
      method: "POST",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not create the achievement",
      timeoutErrorMessage:
        "DB service request timed out while creating the achievement",
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildDbPayload(payload)),
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "createAchievement",
        method: "POST",
        url,
        status: response.status,
      });
      throw mapDbError(response, "create");
    }

    return mapDbAchievementToResponse(body);
  }

  public async updateAchievement(
    achievementId: string,
    payload: UpdateAchievementRequest,
  ): Promise<Achievement> {
    const url = `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`;
    const response = await timedFetch({
      url,
      method: "PUT",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not update the achievement",
      timeoutErrorMessage:
        "DB service request timed out while updating the achievement",
      init: {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildDbUpdatePayload(payload)),
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "updateAchievement",
        method: "PUT",
        url,
        status: response.status,
      });
      throw mapDbError(response, "update");
    }

    return mapDbAchievementToResponse(body);
  }

  public async deleteAchievement(achievementId: string): Promise<Achievement> {
    const url = `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`;
    const response = await timedFetch({
      url,
      method: "DELETE",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not delete the achievement",
      timeoutErrorMessage:
        "DB service request timed out while deleting the achievement",
      init: {
        method: "DELETE",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "deleteAchievement",
        method: "DELETE",
        url,
        status: response.status,
      });
      throw mapDbError(response, "delete");
    }

    return mapDbAchievementToResponse(body);
  }

  public async deactivateAchievement(
    achievementId: string,
  ): Promise<Achievement> {
    const url = `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}/deactivate`;
    const response = await timedFetch({
      url,
      method: "PATCH",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not deactivate the achievement",
      timeoutErrorMessage:
        "DB service request timed out while deactivating the achievement",
      init: {
        method: "PATCH",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "deactivateAchievement",
        method: "PATCH",
        url,
        status: response.status,
      });
      throw mapDbError(response, "deactivate");
    }

    return mapDbAchievementToResponse(body);
  }

  public async activateAchievement(
    achievementId: string,
  ): Promise<Achievement> {
    const url = `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}/activate`;
    const response = await timedFetch({
      url,
      method: "PATCH",
      serviceName: "db-service",
      timeoutMs: config.externalRequestTimeoutMs,
      errorCode: "db_service_error",
      networkErrorMessage: "DB service could not activate the achievement",
      timeoutErrorMessage:
        "DB service request timed out while activating the achievement",
      init: {
        method: "PATCH",
      },
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      logger.error("DB service returned an error response", {
        operation: "activateAchievement",
        method: "PATCH",
        url,
        status: response.status,
      });
      throw mapDbError(response, "activate");
    }

    return mapDbAchievementToResponse(body);
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
