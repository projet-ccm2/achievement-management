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

async function deleteAchievementWithDependencies(
  achievementId: string,
  dependencies: AchievementServiceDependencies,
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.deleteAchievement(achievementId);

  try {
    await dependencies.notificationClient.invalidateChannelCache(
      achievement.channelId,
    );
  } catch {
    throw new ApplicationError(
      502,
      "notification_handler_error",
      "Notification handler cache invalidation failed after achievement deletion",
    );
  }

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

  try {
    await dependencies.notificationClient.invalidateChannelCache(
      achievement.channelId,
    );
  } catch {
    throw new ApplicationError(
      502,
      "notification_handler_error",
      "Notification handler cache invalidation failed after achievement deactivation",
    );
  }

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

  try {
    await dependencies.notificationClient.invalidateChannelCache(
      achievement.channelId,
    );
  } catch {
    throw new ApplicationError(
      502,
      "notification_handler_error",
      "Notification handler cache invalidation failed after achievement activation",
    );
  }

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
  getAchievementById,
  getAchievementByIdWithDependencies,
  deactivateAchievement,
  deactivateAchievementWithDependencies,
  deleteAchievement,
  deleteAchievementWithDependencies,
  updateAchievement,
  updateAchievementWithDependencies,
};
