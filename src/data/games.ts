import type { Game } from '@/shared/types/game';

import gamesSeed from './games.json';

export const games: readonly Game[] = gamesSeed.data;
