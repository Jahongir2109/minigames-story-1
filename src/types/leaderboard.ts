export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: {
    totalItems: number;
    description: string;
  };
}
