import { ApplicationError } from "../middlewares/errorHandler";
import { Achievement } from "../models/achievement";
import {
  dbAchievementClient,
  DbAchievementClient,
} from "./achievementDbClient";
import {
  notificationCacheClient,
  NotificationCacheClient,
} from "./notificationCacheClient";
import {
  CreateAchievementRequest,
  UpdateAchievementRequest,
} from "../utils/achievementPayload";

interface AchievementServiceDependencies {
  dbClient: DbAchievementClient;
  notificationClient: NotificationCacheClient;
}

async function createAchievementWithDependencies(
  payload: CreateAchievementRequest,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement = await dependencies.dbClient.createAchievement(payload);

  try {
    await dependencies.notificationClient.invalidateChannelCache(
      achievement.channelId,
    );
  } catch {
    throw new ApplicationError(
      502,
      "notification_handler_error",
      "Notification handler cache invalidation failed after achievement creation",
    );
  }

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

async function updateAchievementWithDependencies(
  achievementId: string,
  payload: UpdateAchievementRequest,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement = await dependencies.dbClient.updateAchievement(
    achievementId,
    payload,
  );

  try {
    await dependencies.notificationClient.invalidateChannelCache(
      achievement.channelId,
    );
  } catch {
    throw new ApplicationError(
      502,
      "notification_handler_error",
      "Notification handler cache invalidation failed after achievement update",
    );
  }

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

export {
  createAchievement,
  createAchievementWithDependencies,
  updateAchievement,
  updateAchievementWithDependencies,
};
