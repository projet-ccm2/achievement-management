import { RequestHandler, Router } from "express";

interface AchievementRouteHandlers {
  createAchievementHandler: RequestHandler;
  updateAchievementHandler: RequestHandler;
  deleteAchievementHandler: RequestHandler;
}

function achievementRoutes(handlers: AchievementRouteHandlers): Router {
  const router = Router();

  router.post("/", handlers.createAchievementHandler);
  router.put("/:achievementId", handlers.updateAchievementHandler);
  router.delete("/:achievementId", handlers.deleteAchievementHandler);

  return router;
}

export { achievementRoutes };
