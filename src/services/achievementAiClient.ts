/* global Response, fetch */
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import { AchievementSuggestion } from "../models/achievement";
import {
  AiSuggestionRequest,
  mapAiSuggestionToResponse,
  supportedTriggerLabels,
} from "../utils/achievementPayload";

/* eslint-disable no-unused-vars */
interface AiAchievementClient {
  generateAchievementSuggestion(
    payload: AiSuggestionRequest,
  ): Promise<AchievementSuggestion>;
}
/* eslint-enable no-unused-vars */

async function parseAiResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return null;
}

function mapAiError(response: Response): ApplicationError {
  if (response.status === 400) {
    return new ApplicationError(
      502,
      "ai_service_error",
      "AI service rejected the suggestion request",
    );
  }

  if (response.status === 422) {
    return new ApplicationError(
      502,
      "ai_service_error",
      "AI service returned an unusable achievement suggestion",
    );
  }

  return new ApplicationError(
    502,
    "ai_service_error",
    "AI service could not generate an achievement suggestion",
  );
}

class HttpAiAchievementClient implements AiAchievementClient {
  public async generateAchievementSuggestion(
    payload: AiSuggestionRequest,
  ): Promise<AchievementSuggestion> {
    const response = await fetch(
      `${config.aiServiceUrl}/achievements/suggestions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          prompt: payload.prompt,
          supportedTriggerLabels,
        }),
      },
    );

    const body = await parseAiResponse(response);

    if (!response.ok) {
      throw mapAiError(response);
    }

    try {
      return mapAiSuggestionToResponse(body);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw new ApplicationError(
          502,
          "ai_service_error",
          "AI service returned an unusable achievement suggestion",
        );
      }

      throw error;
    }
  }
}

const aiAchievementClient: AiAchievementClient = new HttpAiAchievementClient();

export { HttpAiAchievementClient, aiAchievementClient };
export type { AiAchievementClient };
