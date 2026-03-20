import { RequestHandler, Router } from "express";

interface AchievementRouteHandlers {
  activateAchievementHandler: RequestHandler;
  createAchievementHandler: RequestHandler;
  updateAchievementHandler: RequestHandler;
  deleteAchievementHandler: RequestHandler;
  deactivateAchievementHandler: RequestHandler;
  getAchievementByIdHandler: RequestHandler;
}

function achievementRoutes(handlers: AchievementRouteHandlers): Router {
  const router = Router();

  router.post("/", handlers.createAchievementHandler);
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
