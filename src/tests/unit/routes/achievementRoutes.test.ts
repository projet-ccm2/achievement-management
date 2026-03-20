/* global describe, expect, it, jest */
import { achievementRoutes } from "../../../routes/achievementRoutes";

describe("achievementRoutes", () => {
  it("should register the create achievement route", () => {
    const handler = jest.fn();
    const router = achievementRoutes({
      activateAchievementHandler: handler,
      createAchievementHandler: handler,
      deactivateAchievementHandler: handler,
      deleteAchievementHandler: handler,
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
      activateAchievementHandler: handler,
      createAchievementHandler: handler,
      deactivateAchievementHandler: handler,
      deleteAchievementHandler: handler,
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

  it("should register the delete achievement route", () => {
    const handler = jest.fn();
    const router = achievementRoutes({
      activateAchievementHandler: handler,
      createAchievementHandler: handler,
      deactivateAchievementHandler: handler,
      deleteAchievementHandler: handler,
      updateAchievementHandler: handler,
    });
    const stack = (
      router as unknown as {
        stack: Array<{
          route?: { path: string; methods: Record<string, boolean> };
        }>;
      }
    ).stack;

    const deleteRoute = stack.find(
      (layer) =>
        layer.route?.path === "/:achievementId" &&
        layer.route.methods["delete"],
    );

    expect(deleteRoute?.route?.methods["delete"]).toBe(true);
  });

  it("should register the deactivate achievement route", () => {
    const handler = jest.fn();
    const router = achievementRoutes({
      activateAchievementHandler: handler,
      createAchievementHandler: handler,
      deactivateAchievementHandler: handler,
      deleteAchievementHandler: handler,
      updateAchievementHandler: handler,
    });
    const stack = (
      router as unknown as {
        stack: Array<{
          route?: { path: string; methods: Record<string, boolean> };
        }>;
      }
    ).stack;

    const deactivateRoute = stack.find(
      (layer) =>
        layer.route?.path === "/:achievementId/deactivate" &&
        layer.route.methods.patch,
    );

    expect(deactivateRoute?.route?.methods.patch).toBe(true);
  });

  it("should register the activate achievement route", () => {
    const handler = jest.fn();
    const router = achievementRoutes({
      activateAchievementHandler: handler,
      createAchievementHandler: handler,
      deactivateAchievementHandler: handler,
      deleteAchievementHandler: handler,
      updateAchievementHandler: handler,
    });
    const stack = (
      router as unknown as {
        stack: Array<{
          route?: { path: string; methods: Record<string, boolean> };
        }>;
      }
    ).stack;

    const activateRoute = stack.find(
      (layer) =>
        layer.route?.path === "/:achievementId/activate" &&
        layer.route.methods.patch,
    );

    expect(activateRoute?.route?.methods.patch).toBe(true);
  });
});
