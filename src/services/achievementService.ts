import { ApplicationError } from "../middlewares/errorHandler";
import {
  Achievement,
  AchievementLeaderboardEntry,
  AchievementSuggestion,
  UserAchievement,
} from "../models/achievement";
import {
  aiAchievementClient,
  AiAchievementClient,
} from "./achievementAiClient";
import {
  bucketAchievementClient,
  BucketAchievementClient,
} from "./achievementBucketClient";
import {
  dbAchievementClient,
  DbAchievementClient,
} from "./achievementDbClient";
import {
  notificationCacheClient,
  NotificationCacheClient,
} from "./notificationCacheClient";
import {
  AchievementLeaderboardQuery,
  AiSuggestionRequest,
  CreateAchievementRequest,
  UpdateAchievementRequest,
} from "../utils/achievementPayload";

interface AchievementServiceDependencies {
  dbClient: DbAchievementClient;
  notificationClient: NotificationCacheClient;
}

interface AchievementImageServiceDependencies
  extends AchievementServiceDependencies {
  bucketClient: BucketAchievementClient;
}

interface AchievementAiServiceDependencies {
  aiClient: AiAchievementClient;
}

const defaultAchievementImagePlaceholder =
  "https://placehold.co/512x512/png?text=Achievement";

async function resolveImageWithDependencies(
  image: string | null,
  imageUpload: CreateAchievementRequest["imageUpload"],
  bucketClient: BucketAchievementClient,
  imageId?: string,
): Promise<string | null> {
  if (!imageUpload) {
    return image;
  }

  return bucketClient.uploadAchievementImage(imageUpload, imageId);
}

async function resolveCreateImageWithDependencies(
  image: string | null,
  imageUpload: CreateAchievementRequest["imageUpload"],
  bucketClient: BucketAchievementClient,
): Promise<string> {
  const resolvedImage = await resolveImageWithDependencies(
    image,
    imageUpload,
    bucketClient,
  );

  return resolvedImage ?? defaultAchievementImagePlaceholder;
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
  dependencies: AchievementImageServiceDependencies,
): Promise<Achievement> {
  const payloadWithStoredImage = {
    ...payload,
    image: await resolveCreateImageWithDependencies(
      payload.image,
      payload.imageUpload,
      dependencies.bucketClient,
    ),
  };
  const achievement = await dependencies.dbClient.createAchievement(
    payloadWithStoredImage,
  );

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
    bucketClient: bucketAchievementClient,
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

async function getAchievementLeaderboardByChannelIdWithDependencies(
  channelId: string,
  query: AchievementLeaderboardQuery,
  dependencies: Pick<AchievementServiceDependencies, "dbClient">,
): Promise<AchievementLeaderboardEntry[]> {
  return dependencies.dbClient.getAchievementLeaderboardByChannelId(
    channelId,
    query,
  );
}

async function getAchievementLeaderboardByChannelId(
  channelId: string,
  query: AchievementLeaderboardQuery,
): Promise<AchievementLeaderboardEntry[]> {
  return getAchievementLeaderboardByChannelIdWithDependencies(
    channelId,
    query,
    {
      dbClient: dbAchievementClient,
    },
  );
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
  dependencies: AchievementImageServiceDependencies,
): Promise<Achievement> {
  const payloadWithStoredImage = {
    ...payload,
    image: await resolveImageWithDependencies(
      payload.image,
      payload.imageUpload,
      dependencies.bucketClient,
      achievementId,
    ),
  };
  const achievement = await dependencies.dbClient.updateAchievement(
    achievementId,
    payloadWithStoredImage,
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
    bucketClient: bucketAchievementClient,
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
  defaultAchievementImagePlaceholder,
  generateAchievementSuggestion,
  generateAchievementSuggestionWithDependencies,
  getAchievementLeaderboardByChannelId,
  getAchievementLeaderboardByChannelIdWithDependencies,
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
