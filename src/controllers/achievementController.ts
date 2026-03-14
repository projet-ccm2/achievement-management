import { Request, RequestHandler, Response } from "express";
import {
  createAchievement,
  updateAchievement,
} from "../services/achievementService";
import {
  parseCreateAchievementRequest,
  parseUpdateAchievementRequest,
} from "../utils/achievementPayload";

function buildCreateAchievementHandler(
  createAchievementAction: typeof createAchievement,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const payload = parseCreateAchievementRequest(req.body);
    const achievement = await createAchievementAction(payload);

    res.status(201).json(achievement);
  };
}

const createAchievementHandler =
  buildCreateAchievementHandler(createAchievement);

function buildUpdateAchievementHandler(
  updateAchievementAction: typeof updateAchievement,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const payload = parseUpdateAchievementRequest(req.body);
    const achievement = await updateAchievementAction(
      req.params.achievementId,
      payload,
    );

    res.status(200).json(achievement);
  };
}

const updateAchievementHandler =
  buildUpdateAchievementHandler(updateAchievement);

export {
  buildCreateAchievementHandler,
  buildUpdateAchievementHandler,
  createAchievementHandler,
  updateAchievementHandler,
};
