/* global Response, fetch */
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import { Achievement } from "../models/achievement";
import {
  CreateAchievementRequest,
  mapDbAchievementToResponse,
  UpdateAchievementRequest,
} from "../utils/achievementPayload";

/* eslint-disable no-unused-vars */
type DbAchievementClient = {
  createAchievement: (
    ...args: [CreateAchievementRequest]
  ) => Promise<Achievement>;
  updateAchievement: (
    ...args: [string, UpdateAchievementRequest]
  ) => Promise<Achievement>;
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
    ...(Object.prototype.hasOwnProperty.call(payload, "channelId")
      ? { ["Chanel_ID"]: (payload as CreateAchievementRequest).channelId }
      : {}),
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

function mapDbError(response: Response, operation: "create" | "update"): Error {
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
}

const dbAchievementClient: DbAchievementClient = new HttpDbAchievementClient();

export { HttpDbAchievementClient, buildDbPayload, dbAchievementClient };
export type { DbAchievementClient };
