/* global describe, expect, it, jest */
import { achievementRoutes } from "../../../routes/achievementRoutes";

function buildRouter() {
  const handler = jest.fn();

  return achievementRoutes({
    activateAchievementHandler: handler,
    createAchievementHandler: handler,
    deactivateAchievementHandler: handler,
    deleteAchievementHandler: handler,
    generateAchievementSuggestionHandler: handler,
    getAchievementLeaderboardByChannelIdHandler: handler,
    getAchievementByIdHandler: handler,
    getAchievementsByChannelIdHandler: handler,
    getAchievementsByUserIdHandler: handler,
    getAchievementsByUserIdAndChannelIdHandler: handler,
    getPublicAchievementsHandler: handler,
    updateAchievementHandler: handler,
  });
}

function hasRoute(
  path: string,
  method: "get" | "post" | "put" | "delete" | "patch",
): boolean | undefined {
  const stack = (
    buildRouter() as unknown as {
      stack: Array<{
        route?: { path: string; methods: Record<string, boolean> };
      }>;
    }
  ).stack;

  return stack.find(
    (layer) => layer.route?.path === path && layer.route.methods[method],
  )?.route?.methods[method];
}

describe("achievementRoutes", () => {
  it("should register the create achievement route", () => {
    expect(hasRoute("/", "post")).toBe(true);
  });

  it("should register the AI suggestion route", () => {
    expect(hasRoute("/ai-suggestion", "post")).toBe(true);
  });

  it("should register the update achievement route", () => {
    expect(hasRoute("/:achievementId", "put")).toBe(true);
  });

  it("should register the delete achievement route", () => {
    expect(hasRoute("/:achievementId", "delete")).toBe(true);
  });

  it("should register the deactivate achievement route", () => {
    expect(hasRoute("/:achievementId/deactivate", "patch")).toBe(true);
  });

  it("should register the activate achievement route", () => {
    expect(hasRoute("/:achievementId/activate", "patch")).toBe(true);
  });

  it("should register the get achievement by id route", () => {
    expect(hasRoute("/:achievementId", "get")).toBe(true);
  });

  it("should register the get achievement leaderboard by channel route", () => {
    expect(hasRoute("/channel/:channelId/leaderboard", "get")).toBe(true);
  });

  it("should register the get achievements by channel route", () => {
    expect(hasRoute("/channel/:channelId", "get")).toBe(true);
  });

  it("should register the get public achievements route", () => {
    expect(hasRoute("/public", "get")).toBe(true);
  });

  it("should register the get achievements by user route", () => {
    expect(hasRoute("/user/:userId", "get")).toBe(true);
  });

  it("should register the get achievements by user and channel route", () => {
    expect(hasRoute("/user/:userId/channel/:channelId", "get")).toBe(true);
  });
});
