/* global afterEach, beforeEach, describe, expect, global, it, jest, process */
import { ApplicationError } from "../../../middlewares/errorHandler";
import { HttpAiAchievementClient } from "../../../services/achievementAiClient";

jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("achievementAiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("should generate an achievement suggestion through the AI service", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        title: "First",
        description: "Desc",
        goal: 100,
        reward: 250,
        public: false,
        active: true,
        secret: false,
        type: {
          label: "message",
          data: null,
        },
      }),
    });

    const client = new HttpAiAchievementClient();
    const suggestion = await client.generateAchievementSuggestion({
      prompt: "Create an achievement",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.IA_SERVICE_URL}/achievements/suggestions`,
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(suggestion.goal).toBe(100);
  });

  it("should map AI validation failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 422,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "invalid",
      }),
    });

    const client = new HttpAiAchievementClient();

    await expect(
      client.generateAchievementSuggestion({
        prompt: "Create an achievement",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "ai_service_error",
        "AI service returned an unusable achievement suggestion",
      ),
    );
  });

  it("should map AI bad request failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "invalid request",
      }),
    });

    const client = new HttpAiAchievementClient();

    await expect(
      client.generateAchievementSuggestion({
        prompt: "Create an achievement",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "ai_service_error",
        "AI service rejected the suggestion request",
      ),
    );
  });

  it("should handle AI responses without a content type header", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const client = new HttpAiAchievementClient();

    await expect(
      client.generateAchievementSuggestion({
        prompt: "Create an achievement",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "ai_service_error",
        "AI service could not generate an achievement suggestion",
      ),
    );
  });

  it("should map generic AI service failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        message: "failure",
      }),
    });

    const client = new HttpAiAchievementClient();

    await expect(
      client.generateAchievementSuggestion({
        prompt: "Create an achievement",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "ai_service_error",
        "AI service could not generate an achievement suggestion",
      ),
    );
  });

  it("should reject invalid AI suggestion payloads", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      json: jest.fn().mockResolvedValue({
        title: "First",
      }),
    });

    const client = new HttpAiAchievementClient();

    await expect(
      client.generateAchievementSuggestion({
        prompt: "Create an achievement",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "ai_service_error",
        "AI service returned an unusable achievement suggestion",
      ),
    );
  });

  it("should map AI network timeouts", async () => {
    const timeoutError = new Error("timed out");
    timeoutError.name = "AbortError";
    (global.fetch as jest.Mock).mockRejectedValue(timeoutError);

    const client = new HttpAiAchievementClient();

    await expect(
      client.generateAchievementSuggestion({
        prompt: "Create an achievement",
      }),
    ).rejects.toEqual(
      new ApplicationError(
        502,
        "ai_service_error",
        "AI service request timed out while generating an achievement suggestion",
      ),
    );
  });
});
