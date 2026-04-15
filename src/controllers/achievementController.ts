import { Request, RequestHandler, Response } from "express";
import {
  activateAchievement,
  createAchievement,
  deactivateAchievement,
  deleteAchievement,
  generateAchievementSuggestion,
  getAchievementLeaderboardByChannelId,
  getAchievementById,
  getAchievementsByChannelId,
  getAchievementsByUserId,
  getAchievementsByUserIdAndChannelId,
  getPublicAchievements,
  updateAchievement,
} from "../services/achievementService";
import {
  parseAchievementLeaderboardQuery,
  parseAiSuggestionRequest,
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

function buildGenerateAchievementSuggestionHandler(
  generateAchievementSuggestionAction: typeof generateAchievementSuggestion,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const payload = parseAiSuggestionRequest(req.body);
    const suggestion = await generateAchievementSuggestionAction(payload);

    res.status(200).json(suggestion);
  };
}

const generateAchievementSuggestionHandler =
  buildGenerateAchievementSuggestionHandler(generateAchievementSuggestion);

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

function buildGetAchievementLeaderboardByChannelIdHandler(
  getAchievementLeaderboardByChannelIdAction: typeof getAchievementLeaderboardByChannelId,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const leaderboard = await getAchievementLeaderboardByChannelIdAction(
      req.params.channelId,
      parseAchievementLeaderboardQuery(req.query),
    );

    res.status(200).json(leaderboard);
  };
}

const getAchievementLeaderboardByChannelIdHandler =
  buildGetAchievementLeaderboardByChannelIdHandler(
    getAchievementLeaderboardByChannelId,
  );

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

function buildGetAchievementsByUserIdAndChannelIdHandler(
  getAchievementsByUserIdAndChannelIdAction: typeof getAchievementsByUserIdAndChannelId,
): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const achievements = await getAchievementsByUserIdAndChannelIdAction(
      req.params.userId,
      req.params.channelId,
    );

    res.status(200).json(achievements);
  };
}

const getAchievementsByUserIdAndChannelIdHandler =
  buildGetAchievementsByUserIdAndChannelIdHandler(
    getAchievementsByUserIdAndChannelId,
  );

export {
  buildActivateAchievementHandler,
  buildCreateAchievementHandler,
  buildDeactivateAchievementHandler,
  buildDeleteAchievementHandler,
  buildGenerateAchievementSuggestionHandler,
  buildGetAchievementLeaderboardByChannelIdHandler,
  buildGetAchievementByIdHandler,
  buildGetAchievementsByChannelIdHandler,
  buildGetAchievementsByUserIdHandler,
  buildGetAchievementsByUserIdAndChannelIdHandler,
  buildGetPublicAchievementsHandler,
  buildUpdateAchievementHandler,
  activateAchievementHandler,
  createAchievementHandler,
  deactivateAchievementHandler,
  deleteAchievementHandler,
  generateAchievementSuggestionHandler,
  getAchievementLeaderboardByChannelIdHandler,
  getAchievementByIdHandler,
  getAchievementsByChannelIdHandler,
  getAchievementsByUserIdHandler,
  getAchievementsByUserIdAndChannelIdHandler,
  getPublicAchievementsHandler,
  updateAchievementHandler,
};
