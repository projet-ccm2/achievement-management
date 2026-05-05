import { RequestHandler, Router } from "express";

interface BadgeRouteHandlers {
  createChannelBadgeHandler: RequestHandler;
  updateChannelBadgeHandler: RequestHandler;
  getChannelBadgeHandler: RequestHandler;
  getUserBadgesHandler: RequestHandler;
}

function badgeRoutes(handlers: BadgeRouteHandlers): Router {
  const router = Router();

  router.get("/user/:userId", handlers.getUserBadgesHandler);
  router.get("/channel/:channelId", handlers.getChannelBadgeHandler);
  router.post("/channel/:channelId", handlers.createChannelBadgeHandler);
  router.put("/channel/:channelId", handlers.updateChannelBadgeHandler);

  return router;
}

export { badgeRoutes };
