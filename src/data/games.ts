import type { GameCard } from '@/types/game';

const ASSETS_BASE = '/assets/games';

function hashSlug(slug: string): number {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function buildGame(slug: string, name: string): GameCard {
  const hash = hashSlug(slug);
  const rating = Math.round((4 + (hash % 10) / 10) * 10) / 10;
  const likes = Math.round(((hash % 900) + 100) * 10) / 10;

  return {
    slug,
    name,
    cardImage: `${ASSETS_BASE}/${slug}-card.jpg`,
    heroImage: `${ASSETS_BASE}/${slug}-hero.jpg`,
    rating,
    likes: `${likes}K`,
  };
}

export const games: GameCard[] = [
  buildGame('heartopia', 'Heartopia'),
  buildGame('cat-mail-co', 'Cat Mail Co.'),
  buildGame('tiny-glade', 'Tiny Glade'),
  buildGame('cozy-solitaire', 'Cozy Solitaire'),
  buildGame('cat-chess', 'Cat Chess'),
  buildGame('whisper-of-the-house', 'Whisper of the House'),
  buildGame('koroneko', 'Koroneko'),
  buildGame('palia', 'Palia'),
  buildGame('grimshire', 'Grimshire'),
  buildGame('cozy-sudoku', 'Cozy Sudoku'),
  buildGame('winter-burrow', 'Winter Burrow'),
  buildGame('wytchwood', 'Wytchwood'),
  buildGame('cast-n-chill', 'Cast n Chill'),
  buildGame('little-corners', 'Little Corners'),
  buildGame('leafy-corner', 'Leafy Corner'),
  buildGame('leaf-it-alone', 'Leaf It Alone'),
  buildGame('organized-inside', 'Organized Inside'),
  buildGame('shelve-the-potions', 'Shelve the Potions'),
  buildGame('the-wild-at-heart', 'The Wild at Heart'),
  buildGame('islanders-new-shores', 'Islanders: New Shores'),
  buildGame('camper-van-make-it-home', 'Camper Van: Make It Home'),
  buildGame('tailside-cozy-cafe-sim', 'Tailside: Cozy Cafe Sim'),
  buildGame('tukoni-forest-keepers', 'Tukoni: Forest Keepers'),
  buildGame('vacation-cafe-simulator', 'Vacation Cafe Simulator'),
];

export const heroGame: GameCard = games[0]!;
