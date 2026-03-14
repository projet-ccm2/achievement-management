/* global describe, expect, it, jest */
import { achievementRoutes } from "../../../routes/achievementRoutes";

describe("achievementRoutes", () => {
  it("should register the create achievement route", () => {
    const handler = jest.fn();
    const router = achievementRoutes({
      createAchievementHandler: handler,
      updateAchievementHandler: handler,
    });
    const stack = (
      router as unknown as {
        stack: Array<{
          route?: { path: string; methods: Record<string, boolean> };
        }>;
      }
    ).stack;

    const createRoute = stack.find((layer) => layer.route?.path === "/");

    expect(createRoute?.route?.methods.post).toBe(true);
  });

  it("should register the update achievement route", () => {
    const handler = jest.fn();
    const router = achievementRoutes({
      createAchievementHandler: handler,
      updateAchievementHandler: handler,
    });
    const stack = (
      router as unknown as {
        stack: Array<{
          route?: { path: string; methods: Record<string, boolean> };
        }>;
      }
    ).stack;

    const updateRoute = stack.find(
      (layer) => layer.route?.path === "/:achievementId",
    );

    expect(updateRoute?.route?.methods.put).toBe(true);
  });
});
