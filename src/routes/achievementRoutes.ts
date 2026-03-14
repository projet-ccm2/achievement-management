import { RequestHandler, Router } from "express";

interface AchievementRouteHandlers {
  createAchievementHandler: RequestHandler;
  updateAchievementHandler: RequestHandler;
}

function achievementRoutes(handlers: AchievementRouteHandlers): Router {
  const router = Router();

  router.post("/", handlers.createAchievementHandler);
  router.put("/:achievementId", handlers.updateAchievementHandler);

  return router;
}

export { achievementRoutes };
