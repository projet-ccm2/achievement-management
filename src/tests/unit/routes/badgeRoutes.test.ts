/* global describe, expect, it, jest */
import { badgeRoutes } from "../../../routes/badgeRoutes";

function buildRouter() {
  const handler = jest.fn();

  return badgeRoutes({
    createChannelBadgeHandler: handler,
    getChannelBadgeHandler: handler,
    getUserBadgesHandler: handler,
    updateChannelBadgeHandler: handler,
  });
}

function hasRoute(
  path: string,
  method: "get" | "post" | "put",
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

describe("badgeRoutes", () => {
  it("should register the get user badges route", () => {
    expect(hasRoute("/user/:userId", "get")).toBe(true);
  });

  it("should register the get channel badge route", () => {
    expect(hasRoute("/channel/:channelId", "get")).toBe(true);
  });

  it("should register the create channel badge route", () => {
    expect(hasRoute("/channel/:channelId", "post")).toBe(true);
  });

  it("should register the update channel badge route", () => {
    expect(hasRoute("/channel/:channelId", "put")).toBe(true);
  });
});
