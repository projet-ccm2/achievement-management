import { Request, RequestHandler, Response } from "express";
import {
  activateAchievement,
  createAchievement,
  deactivateAchievement,
  deleteAchievement,
  getAchievementById,
  getAchievementsByChannelId,
  getAchievementsByUserId,
  getPublicAchievements,
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

function buildDeleteAchievementHandler(
  deleteAchievementAction: typeof deleteAchievement,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievement = await deleteAchievementAction(req.params.achievementId);

    res.status(200).json(achievement);
  };
}

const deleteAchievementHandler =
  buildDeleteAchievementHandler(deleteAchievement);

function buildDeactivateAchievementHandler(
  deactivateAchievementAction: typeof deactivateAchievement,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievement = await deactivateAchievementAction(
      req.params.achievementId,
    );

    res.status(200).json(achievement);
  };
}

const deactivateAchievementHandler = buildDeactivateAchievementHandler(
  deactivateAchievement,
);

function buildActivateAchievementHandler(
  activateAchievementAction: typeof activateAchievement,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievement = await activateAchievementAction(
      req.params.achievementId,
    );

    res.status(200).json(achievement);
  };
}

const activateAchievementHandler =
  buildActivateAchievementHandler(activateAchievement);

function buildGetAchievementByIdHandler(
  getAchievementByIdAction: typeof getAchievementById,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievement = await getAchievementByIdAction(
      req.params.achievementId,
    );

    res.status(200).json(achievement);
  };
}

const getAchievementByIdHandler =
  buildGetAchievementByIdHandler(getAchievementById);

function buildGetAchievementsByChannelIdHandler(
  getAchievementsByChannelIdAction: typeof getAchievementsByChannelId,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievements = await getAchievementsByChannelIdAction(
      req.params.channelId,
    );

    res.status(200).json(achievements);
  };
}

const getAchievementsByChannelIdHandler =
  buildGetAchievementsByChannelIdHandler(getAchievementsByChannelId);

function buildGetPublicAchievementsHandler(
  getPublicAchievementsAction: typeof getPublicAchievements,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievements = await getPublicAchievementsAction();

    res.status(200).json(achievements);
  };
}

const getPublicAchievementsHandler = buildGetPublicAchievementsHandler(
  getPublicAchievements,
);

function buildGetAchievementsByUserIdHandler(
  getAchievementsByUserIdAction: typeof getAchievementsByUserId,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievements = await getAchievementsByUserIdAction(req.params.userId);

    res.status(200).json(achievements);
  };
}

const getAchievementsByUserIdHandler = buildGetAchievementsByUserIdHandler(
  getAchievementsByUserId,
);

export {
  buildActivateAchievementHandler,
  buildCreateAchievementHandler,
  buildDeactivateAchievementHandler,
  buildDeleteAchievementHandler,
  buildGetAchievementByIdHandler,
  buildGetAchievementsByChannelIdHandler,
  buildGetAchievementsByUserIdHandler,
  buildGetPublicAchievementsHandler,
  buildUpdateAchievementHandler,
  activateAchievementHandler,
  createAchievementHandler,
  deactivateAchievementHandler,
  deleteAchievementHandler,
  getAchievementByIdHandler,
  getAchievementsByChannelIdHandler,
  getAchievementsByUserIdHandler,
  getPublicAchievementsHandler,
  updateAchievementHandler,
};
