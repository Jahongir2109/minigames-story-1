import type { LeaderboardEntry } from '@/shared/types/game';

import leaderboardSeed from './leaderboard.json';

export const leaderboard: readonly LeaderboardEntry[] = leaderboardSeed.data;
