import { Request, Response } from "express";
import { createAchievement } from "../services/achievementService";
import {
  CreateAchievementRequest,
  CreateAchievementResponse,
  parseCreateAchievementRequest,
  parseUpdateAchievementRequest,
  UpdateAchievementRequest,
  UpdateAchievementResponse,
} from "../utils/achievementPayload";
import { updateAchievement } from "../services/achievementService";

interface CreateAchievementHandler {
  (req: Request, res: Response): Promise<void>;
}

interface UpdateAchievementHandler {
  (req: Request, res: Response): Promise<void>;
}

function buildCreateAchievementHandler(
  createAchievementAction: (
    request: CreateAchievementRequest,
  ) => Promise<CreateAchievementResponse>,
): CreateAchievementHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const payload = parseCreateAchievementRequest(req.body);
    const achievement = await createAchievementAction(payload);

    res.status(201).json(achievement);
  };
}

const createAchievementHandler = buildCreateAchievementHandler(createAchievement);

function buildUpdateAchievementHandler(
  updateAchievementAction: (
    achievementId: string,
    request: UpdateAchievementRequest,
  ) => Promise<UpdateAchievementResponse>,
): UpdateAchievementHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const payload = parseUpdateAchievementRequest(req.body);
    const achievement = await updateAchievementAction(
      req.params.achievementId,
      payload,
    );

    res.status(200).json(achievement);
  };
}

const updateAchievementHandler = buildUpdateAchievementHandler(updateAchievement);

export {
  buildCreateAchievementHandler,
  buildUpdateAchievementHandler,
  createAchievementHandler,
  updateAchievementHandler,
};
