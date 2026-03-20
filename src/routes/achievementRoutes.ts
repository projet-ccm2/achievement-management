import { RequestHandler, Router } from "express";

interface AchievementRouteHandlers {
  activateAchievementHandler: RequestHandler;
  generateAchievementSuggestionHandler: RequestHandler;
  createAchievementHandler: RequestHandler;
  updateAchievementHandler: RequestHandler;
  deleteAchievementHandler: RequestHandler;
  deactivateAchievementHandler: RequestHandler;
  getAchievementByIdHandler: RequestHandler;
  getAchievementsByChannelIdHandler: RequestHandler;
  getAchievementsByUserIdHandler: RequestHandler;
  getAchievementsByUserIdAndChannelIdHandler: RequestHandler;
  getPublicAchievementsHandler: RequestHandler;
}

function achievementRoutes(handlers: AchievementRouteHandlers): Router {
  const router = Router();

  router.post("/ai-suggestion", handlers.generateAchievementSuggestionHandler);
  router.post("/", handlers.createAchievementHandler);
  router.get("/public", handlers.getPublicAchievementsHandler);
  router.get("/channel/:channelId", handlers.getAchievementsByChannelIdHandler);
  router.get(
    "/user/:userId/channel/:channelId",
    handlers.getAchievementsByUserIdAndChannelIdHandler,
  );
  router.get("/user/:userId", handlers.getAchievementsByUserIdHandler);
  router.get("/:achievementId", handlers.getAchievementByIdHandler);
  router.put("/:achievementId", handlers.updateAchievementHandler);
  router.delete("/:achievementId", handlers.deleteAchievementHandler);
  router.patch("/:achievementId/activate", handlers.activateAchievementHandler);
  router.patch(
    "/:achievementId/deactivate",
    handlers.deactivateAchievementHandler,
  );

  return router;
}

export { achievementRoutes };
