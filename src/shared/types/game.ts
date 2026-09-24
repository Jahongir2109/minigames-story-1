export interface Game {
  slug: string;
  name: string;
  category: string;
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
  featured: boolean;
}

export interface GameCategory {
  slug: string;
  label: string;
  isDefault: boolean;
}

export interface TopRecord {
  position: number;
  playerName: string;
  score: number;
  achievedAt: string;
}

export interface GameDetails {
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  fullDescription: string;
  specs: {
    genre: string;
    players: string;
    duration: string;
    price: string;
  };
  topRecords: TopRecord[];
}

export interface GameComment {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
}
