import type { GameCategory } from '@/shared/types/game';

import categoriesSeed from './categories.json';

export const categories: readonly GameCategory[] = categoriesSeed.data;
