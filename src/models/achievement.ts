interface AchievementType {
  label: string;
  data: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  goal: number;
  reward: number;
  label: string;
  public: boolean;
  downloads: number;
  visits: number;
  active: boolean;
  secret: boolean;
  image: string | null;
  channelId: string | null;
  type: AchievementType;
}

interface AchievementUserState {
  progressCount: number;
  finished: boolean;
  acquiredDate: string | null;
}

interface UserAchievement extends Achievement {
  userState: AchievementUserState;
}

interface AchievementSuggestion {
  title: string;
  description: string;
  goal: number;
  reward: number;
  public: boolean;
  active: boolean;
  secret: boolean;
  type: AchievementType;
}

interface AchievementLeaderboardEntry {
  userId: string;
  username: string;
  xp: number;
  completed: number;
}

interface Badge {
  id: string;
  title: string;
  image: string;
}

export type {
  Achievement,
  AchievementLeaderboardEntry,
  AchievementSuggestion,
  AchievementType,
  AchievementUserState,
  Badge,
  UserAchievement,
};
