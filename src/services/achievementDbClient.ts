/* global Response, fetch */
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import { Achievement, UserAchievement } from "../models/achievement";
import {
  CreateAchievementRequest,
  mapDbAchievementToResponse,
  mapDbAchievementsToResponse,
  mapDbUserAchievementsToResponse,
  UpdateAchievementRequest,
} from "../utils/achievementPayload";

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

function buildDbPayload(
  payload: CreateAchievementRequest | UpdateAchievementRequest,
): Record<string, unknown> {
  return {
    ["Achievement_Title"]: payload.title,
    ["Achievement_Description"]: payload.description,
    ["Achievement_Goal"]: payload.goal,
    ["Achievement_Reward"]: payload.reward,
    ["Achievement_Label"]: payload.label,
    ["Achievement_Public"]: payload.public,
    ["Achievement_Downloads"]: 0,
    ["Achievement_Visits"]: 0,
    ["Achievement_Active"]: payload.active,
    ["Achievement_Secret"]: payload.secret,
    ["Achievement_Image"]: payload.image,
    ...("channelId" in payload ? { ["Chanel_ID"]: payload.channelId } : {}),
    ["Type"]: {
      ["Type_Label"]: payload.type.label,
      ["Type_Data"]: payload.type.data,
    },
  };
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
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`,
      {
        method: "GET",
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "get");
    }

    return mapDbAchievementToResponse(body);
  }

  public async getAchievementsByChannelId(
    channelId: string,
  ): Promise<Achievement[]> {
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/channel/${encodeURIComponent(channelId)}`,
      {
        method: "GET",
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "get");
    }

    return mapDbAchievementsToResponse(body);
  }

  public async getPublicAchievements(): Promise<Achievement[]> {
    const response = await fetch(`${config.dbServiceUrl}/achievements/public`, {
      method: "GET",
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "get");
    }

    return mapDbAchievementsToResponse(body);
  }

  public async getAchievementsByUserId(
    userId: string,
  ): Promise<UserAchievement[]> {
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/user/${encodeURIComponent(userId)}`,
      {
        method: "GET",
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "get");
    }

    return mapDbUserAchievementsToResponse(body);
  }

  public async getAchievementsByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<UserAchievement[]> {
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/user/${encodeURIComponent(userId)}/channel/${encodeURIComponent(channelId)}`,
      {
        method: "GET",
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "get");
    }

    return mapDbUserAchievementsToResponse(body);
  }

  public async createAchievement(
    payload: CreateAchievementRequest,
  ): Promise<Achievement> {
    const response = await fetch(`${config.dbServiceUrl}/achievements`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(buildDbPayload(payload)),
    });

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "create");
    }

    return mapDbAchievementToResponse(body);
  }

  public async updateAchievement(
    achievementId: string,
    payload: UpdateAchievementRequest,
  ): Promise<Achievement> {
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildDbPayload(payload)),
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "update");
    }

    return mapDbAchievementToResponse(body);
  }

  public async deleteAchievement(achievementId: string): Promise<Achievement> {
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}`,
      {
        method: "DELETE",
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "delete");
    }

    return mapDbAchievementToResponse(body);
  }

  public async deactivateAchievement(
    achievementId: string,
  ): Promise<Achievement> {
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}/deactivate`,
      {
        method: "PATCH",
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "deactivate");
    }

    return mapDbAchievementToResponse(body);
  }

  public async activateAchievement(
    achievementId: string,
  ): Promise<Achievement> {
    const response = await fetch(
      `${config.dbServiceUrl}/achievements/${encodeURIComponent(achievementId)}/activate`,
      {
        method: "PATCH",
      },
    );

    const body = await parseDbResponse(response);

    if (!response.ok) {
      throw mapDbError(response, "activate");
    }

    return mapDbAchievementToResponse(body);
  }
}

const dbAchievementClient: DbAchievementClient = new HttpDbAchievementClient();

export { HttpDbAchievementClient, buildDbPayload, dbAchievementClient };
export type { DbAchievementClient };
