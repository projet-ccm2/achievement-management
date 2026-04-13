/* global Response */
import { config } from "../config/environment";
import { ApplicationError } from "../middlewares/errorHandler";
import { AchievementSuggestion } from "../models/achievement";
import { logger } from "../utils/logger";
import {
  AiSuggestionRequest,
  mapAiSuggestionToResponse,
  supportedTriggerLabels,
} from "../utils/achievementPayload";
import { timedFetch } from "../utils/http";

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
    const url = `${config.aiServiceUrl}/achievements/suggestions`;
    const response = await timedFetch({
      url,
      method: "POST",
      serviceName: "ai-service",
      errorCode: "ai_service_error",
      networkErrorMessage:
        "AI service could not generate an achievement suggestion",
      timeoutErrorMessage:
        "AI service request timed out while generating an achievement suggestion",
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          prompt: payload.prompt,
          supportedTriggerLabels,
        }),
      },
    });

    const body = await parseAiResponse(response);

    if (!response.ok) {
      logger.error("AI service returned an error response", {
        operation: "generateAchievementSuggestion",
        method: "POST",
        url,
        status: response.status,
      });
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
