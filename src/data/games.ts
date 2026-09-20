import type { Game } from '@/shared/types/game';

import gamesSeed from './games.json';

export const games: readonly Game[] = gamesSeed.data;

export const featuredGames: readonly Game[] = games.filter((game: Game): boolean => game.featured);
