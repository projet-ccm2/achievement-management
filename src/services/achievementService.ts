import { ApplicationError } from "../middlewares/errorHandler";
import {
  Achievement,
  AchievementSuggestion,
  UserAchievement,
} from "../models/achievement";
import {
  aiAchievementClient,
  AiAchievementClient,
} from "./achievementAiClient";
import {
  dbAchievementClient,
  DbAchievementClient,
} from "./achievementDbClient";
import {
  notificationCacheClient,
  NotificationCacheClient,
} from "./notificationCacheClient";
import {
  AiSuggestionRequest,
  CreateAchievementRequest,
  UpdateAchievementRequest,
} from "../utils/achievementPayload";

interface AchievementServiceDependencies {
  dbClient: DbAchievementClient;
  notificationClient: NotificationCacheClient;
}

interface AchievementAiServiceDependencies {
  aiClient: AiAchievementClient;
}

async function invalidateChannelCacheIfNeeded(
  channelId: string | null,
  notificationClient: NotificationCacheClient,
  message: string,
): Promise<void> {
  if (!channelId) {
    return;
  }

  try {
    await notificationClient.invalidateChannelCache(channelId);
  } catch {
    throw new ApplicationError(502, "notification_handler_error", message);
  }
}

async function createAchievementWithDependencies(
  payload: CreateAchievementRequest,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement = await dependencies.dbClient.createAchievement(payload);

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement creation",
  );

  return achievement;
}

async function createAchievement(
  payload: CreateAchievementRequest,
): Promise<Achievement> {
  return createAchievementWithDependencies(payload, {
    dbClient: dbAchievementClient,
    notificationClient: notificationCacheClient,
  });
}

async function getAchievementByIdWithDependencies(
  achievementId: string,
  dependencies: Pick<AchievementServiceDependencies, "dbClient">,
): Promise<Achievement> {
  return dependencies.dbClient.getAchievementById(achievementId);
}

async function getAchievementById(achievementId: string): Promise<Achievement> {
  return getAchievementByIdWithDependencies(achievementId, {
    dbClient: dbAchievementClient,
  });
}

async function getAchievementsByChannelIdWithDependencies(
  channelId: string,
  dependencies: Pick<AchievementServiceDependencies, "dbClient">,
): Promise<Achievement[]> {
  return dependencies.dbClient.getAchievementsByChannelId(channelId);
}

async function getAchievementsByChannelId(
  channelId: string,
): Promise<Achievement[]> {
  return getAchievementsByChannelIdWithDependencies(channelId, {
    dbClient: dbAchievementClient,
  });
}

async function getPublicAchievementsWithDependencies(
  dependencies: Pick<AchievementServiceDependencies, "dbClient">,
): Promise<Achievement[]> {
  return dependencies.dbClient.getPublicAchievements();
}

async function getPublicAchievements(): Promise<Achievement[]> {
  return getPublicAchievementsWithDependencies({
    dbClient: dbAchievementClient,
  });
}

async function getAchievementsByUserIdWithDependencies(
  userId: string,
  dependencies: Pick<AchievementServiceDependencies, "dbClient">,
): Promise<UserAchievement[]> {
  return dependencies.dbClient.getAchievementsByUserId(userId);
}

async function getAchievementsByUserId(
  userId: string,
): Promise<UserAchievement[]> {
  return getAchievementsByUserIdWithDependencies(userId, {
    dbClient: dbAchievementClient,
  });
}

async function getAchievementsByUserIdAndChannelIdWithDependencies(
  userId: string,
  channelId: string,
  dependencies: Pick<AchievementServiceDependencies, "dbClient">,
): Promise<UserAchievement[]> {
  return dependencies.dbClient.getAchievementsByUserIdAndChannelId(
    userId,
    channelId,
  );
}

async function getAchievementsByUserIdAndChannelId(
  userId: string,
  channelId: string,
): Promise<UserAchievement[]> {
  return getAchievementsByUserIdAndChannelIdWithDependencies(
    userId,
    channelId,
    {
      dbClient: dbAchievementClient,
    },
  );
}

async function generateAchievementSuggestionWithDependencies(
  payload: AiSuggestionRequest,
  dependencies: AchievementAiServiceDependencies,
): Promise<AchievementSuggestion> {
  return dependencies.aiClient.generateAchievementSuggestion(payload);
}

async function generateAchievementSuggestion(
  payload: AiSuggestionRequest,
): Promise<AchievementSuggestion> {
  return generateAchievementSuggestionWithDependencies(payload, {
    aiClient: aiAchievementClient,
  });
}

async function updateAchievementWithDependencies(
  achievementId: string,
  payload: UpdateAchievementRequest,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement = await dependencies.dbClient.updateAchievement(
    achievementId,
    payload,
  );

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement update",
  );

  return achievement;
}

async function updateAchievement(
  achievementId: string,
  payload: UpdateAchievementRequest,
): Promise<Achievement> {
  return updateAchievementWithDependencies(achievementId, payload, {
    dbClient: dbAchievementClient,
    notificationClient: notificationCacheClient,
  });
}

async function deleteAchievementWithDependencies(
  achievementId: string,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.deleteAchievement(achievementId);

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement deletion",
  );

  return achievement;
}

async function deleteAchievement(achievementId: string): Promise<Achievement> {
  return deleteAchievementWithDependencies(achievementId, {
    dbClient: dbAchievementClient,
    notificationClient: notificationCacheClient,
  });
}

async function deactivateAchievementWithDependencies(
  achievementId: string,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.deactivateAchievement(achievementId);

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement deactivation",
  );

  return achievement;
}

async function deactivateAchievement(
  achievementId: string,
): Promise<Achievement> {
  return deactivateAchievementWithDependencies(achievementId, {
    dbClient: dbAchievementClient,
    notificationClient: notificationCacheClient,
  });
}

async function activateAchievementWithDependencies(
  achievementId: string,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.activateAchievement(achievementId);

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement activation",
  );

  return achievement;
}

async function activateAchievement(
  achievementId: string,
): Promise<Achievement> {
  return activateAchievementWithDependencies(achievementId, {
    dbClient: dbAchievementClient,
    notificationClient: notificationCacheClient,
  });
}

export {
  activateAchievement,
  activateAchievementWithDependencies,
  createAchievement,
  createAchievementWithDependencies,
  generateAchievementSuggestion,
  generateAchievementSuggestionWithDependencies,
  getAchievementById,
  getAchievementByIdWithDependencies,
  getAchievementsByChannelId,
  getAchievementsByChannelIdWithDependencies,
  getAchievementsByUserId,
  getAchievementsByUserIdAndChannelId,
  getAchievementsByUserIdAndChannelIdWithDependencies,
  getAchievementsByUserIdWithDependencies,
  getPublicAchievements,
  getPublicAchievementsWithDependencies,
  deactivateAchievement,
  deactivateAchievementWithDependencies,
  deleteAchievement,
  deleteAchievementWithDependencies,
  updateAchievement,
  updateAchievementWithDependencies,
};
