import { ApplicationError } from "../middlewares/errorHandler";
import {
  Achievement,
  AchievementLeaderboardEntry,
  AchievementSuggestion,
  Badge,
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
  CreateBadgeRequest,
  CreateAchievementRequest,
  UpdateBadgeRequest,
  UpdateAchievementRequest,
} from "../utils/achievementPayload";

interface AchievementAiServiceDependencies {
  aiClient: AiAchievementClient;
}

type NotificationDependencies = Pick<
  NotificationCacheClient,
  "invalidateChannelCache"
>;

type AchievementBucketReadDependencies = Pick<
  BucketAchievementClient,
  "getAchievementImageUrl"
>;

type AchievementBucketWriteDependencies = Pick<
  BucketAchievementClient,
  "uploadAchievementImage" | "getAchievementImageUrl"
>;

type BadgeBucketReadDependencies = Pick<
  BucketAchievementClient,
  "getBadgeImageUrl"
>;

type BadgeBucketWriteDependencies = Pick<
  BucketAchievementClient,
  "uploadBadgeImage" | "getBadgeImageUrl"
>;

const defaultAchievementImagePlaceholder =
  "https://placehold.co/512x512/png?text=Achievement";

async function resolveImageWithDependencies(
  image: string | null,
  imageUpload: CreateAchievementRequest["imageUpload"],
  bucketClient: Pick<BucketAchievementClient, "uploadAchievementImage">,
  imageId?: string,
): Promise<string | null> {
  if (!imageUpload) {
    return image;
  }

  return bucketClient.uploadAchievementImage(imageUpload, imageId);
}

function isDirectImageUrl(image: string): boolean {
  return /^https?:\/\//i.test(image);
}

async function resolveBadgeImageWithDependencies(
  image: string | null | undefined,
  imageUpload:
    | CreateBadgeRequest["imageUpload"]
    | UpdateBadgeRequest["imageUpload"],
  bucketClient: Pick<BucketAchievementClient, "uploadBadgeImage">,
  imageId?: string,
): Promise<string | null | undefined> {
  if (imageUpload) {
    return bucketClient.uploadBadgeImage(imageUpload, imageId);
  }

  return image;
}

async function resolveBadgeImageUrlWithDependencies(
  image: string,
  bucketClient: BadgeBucketReadDependencies,
): Promise<string> {
  if (isDirectImageUrl(image)) {
    return image;
  }

  return bucketClient.getBadgeImageUrl(image.trim());
}

function resolveStoredAchievementImageId(image: string): string | null {
  const normalizedImage = image.trim();

  if (normalizedImage.length === 0 || isDirectImageUrl(normalizedImage)) {
    return null;
  }

  return normalizedImage;
}

async function resolveAchievementImageUrlWithDependencies(
  image: string | null,
  bucketClient: AchievementBucketReadDependencies,
): Promise<string | null> {
  if (!image) {
    return null;
  }

  if (isDirectImageUrl(image)) {
    return image;
  }

  const imageId = resolveStoredAchievementImageId(image);

  if (!imageId) {
    return image;
  }

  return bucketClient.getAchievementImageUrl(imageId);
}

async function enrichAchievementLikeImageWithDependencies<
  TAchievement extends Achievement,
>(
  achievement: TAchievement,
  bucketClient: AchievementBucketReadDependencies,
): Promise<TAchievement> {
  return {
    ...achievement,
    image: await resolveAchievementImageUrlWithDependencies(
      achievement.image,
      bucketClient,
    ),
  };
}

async function enrichBadgeImageWithDependencies(
  badge: Badge,
  bucketClient: BadgeBucketReadDependencies,
): Promise<Badge> {
  return {
    ...badge,
    image: await resolveBadgeImageUrlWithDependencies(
      badge.image,
      bucketClient,
    ),
  };
}

async function resolveCreateImageWithDependencies(
  image: string | null,
  imageUpload: CreateAchievementRequest["imageUpload"],
  bucketClient: Pick<BucketAchievementClient, "uploadAchievementImage">,
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
  notificationClient: NotificationDependencies,
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
  dependencies: {
    dbClient: Pick<DbAchievementClient, "createAchievement">;
    notificationClient: NotificationDependencies;
    bucketClient: AchievementBucketWriteDependencies;
  },
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

  return enrichAchievementLikeImageWithDependencies(
    achievement,
    dependencies.bucketClient,
  );
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
  dependencies: {
    dbClient: Pick<DbAchievementClient, "getAchievementById">;
    bucketClient: AchievementBucketReadDependencies;
  },
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.getAchievementById(achievementId);

  return enrichAchievementLikeImageWithDependencies(
    achievement,
    dependencies.bucketClient,
  );
}

async function getAchievementById(achievementId: string): Promise<Achievement> {
  return getAchievementByIdWithDependencies(achievementId, {
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
}

async function getAchievementsByChannelIdWithDependencies(
  channelId: string,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "getAchievementsByChannelId">;
    bucketClient: AchievementBucketReadDependencies;
  },
): Promise<Achievement[]> {
  const achievements =
    await dependencies.dbClient.getAchievementsByChannelId(channelId);

  return Promise.all(
    achievements.map((achievement) =>
      enrichAchievementLikeImageWithDependencies(
        achievement,
        dependencies.bucketClient,
      ),
    ),
  );
}

async function getAchievementsByChannelId(
  channelId: string,
): Promise<Achievement[]> {
  return getAchievementsByChannelIdWithDependencies(channelId, {
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
}

async function getPublicAchievementsWithDependencies(dependencies: {
  dbClient: Pick<DbAchievementClient, "getPublicAchievements">;
  bucketClient: AchievementBucketReadDependencies;
}): Promise<Achievement[]> {
  const achievements = await dependencies.dbClient.getPublicAchievements();

  return Promise.all(
    achievements.map((achievement) =>
      enrichAchievementLikeImageWithDependencies(
        achievement,
        dependencies.bucketClient,
      ),
    ),
  );
}

async function getPublicAchievements(): Promise<Achievement[]> {
  return getPublicAchievementsWithDependencies({
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
}

async function getAchievementLeaderboardByChannelIdWithDependencies(
  channelId: string,
  query: AchievementLeaderboardQuery,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "getAchievementLeaderboardByChannelId">;
  },
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
  dependencies: {
    dbClient: Pick<DbAchievementClient, "getAchievementsByUserId">;
    bucketClient: AchievementBucketReadDependencies;
  },
): Promise<UserAchievement[]> {
  const achievements =
    await dependencies.dbClient.getAchievementsByUserId(userId);

  return Promise.all(
    achievements.map((achievement) =>
      enrichAchievementLikeImageWithDependencies(
        achievement,
        dependencies.bucketClient,
      ),
    ),
  );
}

async function getAchievementsByUserId(
  userId: string,
): Promise<UserAchievement[]> {
  return getAchievementsByUserIdWithDependencies(userId, {
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
}

async function getAchievementsByUserIdAndChannelIdWithDependencies(
  userId: string,
  channelId: string,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "getAchievementsByUserIdAndChannelId">;
    bucketClient: AchievementBucketReadDependencies;
  },
): Promise<UserAchievement[]> {
  const achievements =
    await dependencies.dbClient.getAchievementsByUserIdAndChannelId(
      userId,
      channelId,
    );

  return Promise.all(
    achievements.map((achievement) =>
      enrichAchievementLikeImageWithDependencies(
        achievement,
        dependencies.bucketClient,
      ),
    ),
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
      bucketClient: bucketAchievementClient,
      dbClient: dbAchievementClient,
    },
  );
}

async function getUserBadgesWithDependencies(
  userId: string,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "getUserBadges">;
    bucketClient: BadgeBucketReadDependencies;
  },
): Promise<Badge[]> {
  const badges = await dependencies.dbClient.getUserBadges(userId);

  return Promise.all(
    badges.map((badge) =>
      enrichBadgeImageWithDependencies(badge, dependencies.bucketClient),
    ),
  );
}

async function getUserBadges(userId: string): Promise<Badge[]> {
  return getUserBadgesWithDependencies(userId, {
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
}

async function getChannelBadgeWithDependencies(
  channelId: string,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "getChannelBadge">;
    bucketClient: BadgeBucketReadDependencies;
  },
): Promise<Badge> {
  const badge = await dependencies.dbClient.getChannelBadge(channelId);

  return enrichBadgeImageWithDependencies(badge, dependencies.bucketClient);
}

async function getChannelBadge(channelId: string): Promise<Badge> {
  return getChannelBadgeWithDependencies(channelId, {
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
}

async function createChannelBadgeWithDependencies(
  channelId: string,
  payload: CreateBadgeRequest,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "createChannelBadge">;
    bucketClient: BadgeBucketWriteDependencies;
  },
): Promise<Badge> {
  const resolvedImage =
    (await resolveBadgeImageWithDependencies(
      payload.image,
      payload.imageUpload,
      dependencies.bucketClient,
      channelId,
    )) ?? null;
  const payloadWithStoredImage = {
    ...payload,
    image: resolvedImage,
  };
  const badge = await dependencies.dbClient.createChannelBadge(
    channelId,
    payloadWithStoredImage,
  );

  return enrichBadgeImageWithDependencies(badge, dependencies.bucketClient);
}

async function createChannelBadge(
  channelId: string,
  payload: CreateBadgeRequest,
): Promise<Badge> {
  return createChannelBadgeWithDependencies(channelId, payload, {
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
}

async function updateChannelBadgeWithDependencies(
  channelId: string,
  payload: UpdateBadgeRequest,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "updateChannelBadge">;
    bucketClient: BadgeBucketWriteDependencies;
  },
): Promise<Badge> {
  const payloadWithStoredImage = {
    ...payload,
    image: await resolveBadgeImageWithDependencies(
      payload.image,
      payload.imageUpload,
      dependencies.bucketClient,
      channelId,
    ),
  };
  const badge = await dependencies.dbClient.updateChannelBadge(
    channelId,
    payloadWithStoredImage,
  );

  return enrichBadgeImageWithDependencies(badge, dependencies.bucketClient);
}

async function updateChannelBadge(
  channelId: string,
  payload: UpdateBadgeRequest,
): Promise<Badge> {
  return updateChannelBadgeWithDependencies(channelId, payload, {
    bucketClient: bucketAchievementClient,
    dbClient: dbAchievementClient,
  });
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
  dependencies: {
    dbClient: Pick<DbAchievementClient, "updateAchievement">;
    notificationClient: NotificationDependencies;
    bucketClient: AchievementBucketWriteDependencies;
  },
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

  return enrichAchievementLikeImageWithDependencies(
    achievement,
    dependencies.bucketClient,
  );
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
  dependencies: {
    dbClient: Pick<DbAchievementClient, "deleteAchievement">;
    notificationClient: NotificationDependencies;
  },
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.deleteAchievement(achievementId);

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement deletion",
  );

  return enrichAchievementLikeImageWithDependencies(
    achievement,
    bucketAchievementClient,
  );
}

async function deleteAchievement(achievementId: string): Promise<Achievement> {
  return deleteAchievementWithDependencies(achievementId, {
    dbClient: dbAchievementClient,
    notificationClient: notificationCacheClient,
  });
}

async function deactivateAchievementWithDependencies(
  achievementId: string,
  dependencies: {
    dbClient: Pick<DbAchievementClient, "deactivateAchievement">;
    notificationClient: NotificationDependencies;
  },
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.deactivateAchievement(achievementId);

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement deactivation",
  );

  return enrichAchievementLikeImageWithDependencies(
    achievement,
    bucketAchievementClient,
  );
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
  dependencies: {
    dbClient: Pick<DbAchievementClient, "activateAchievement">;
    notificationClient: NotificationDependencies;
  },
): Promise<Achievement> {
  const achievement =
    await dependencies.dbClient.activateAchievement(achievementId);

  await invalidateChannelCacheIfNeeded(
    achievement.channelId,
    dependencies.notificationClient,
    "Notification handler cache invalidation failed after achievement activation",
  );

  return enrichAchievementLikeImageWithDependencies(
    achievement,
    bucketAchievementClient,
  );
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
  createChannelBadge,
  createChannelBadgeWithDependencies,
  createAchievement,
  createAchievementWithDependencies,
  defaultAchievementImagePlaceholder,
  generateAchievementSuggestion,
  generateAchievementSuggestionWithDependencies,
  getChannelBadge,
  getChannelBadgeWithDependencies,
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
  getUserBadges,
  getUserBadgesWithDependencies,
  getPublicAchievements,
  getPublicAchievementsWithDependencies,
  deactivateAchievement,
  deactivateAchievementWithDependencies,
  deleteAchievement,
  deleteAchievementWithDependencies,
  updateChannelBadge,
  updateChannelBadgeWithDependencies,
  updateAchievement,
  updateAchievementWithDependencies,
};
