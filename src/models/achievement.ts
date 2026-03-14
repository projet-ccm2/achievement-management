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
  channelId: string;
  type: AchievementType;
}

export type { Achievement, AchievementType };
