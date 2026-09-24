import type { GameComment, GameDetails } from '@/shared/types/game';

import commentsSeed from './game-comments.json';
import detailsSeed from './game-details.json';

// Story 2 shows the same static game in the Game Details dialog for every card.
export const staticGameDetails: GameDetails = detailsSeed.data;

export const staticGameComments: readonly GameComment[] = commentsSeed.data;
