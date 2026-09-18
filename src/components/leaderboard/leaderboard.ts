import './leaderboard.scss';
import type { LeaderboardEntry, LeaderboardResponse } from '@/types/leaderboard';

const AVATAR_COLORS = ['primary', 'teal', 'purple', 'pink', 'blue'] as const;

function initials(name: string): string {
  const letters = name
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .split(/\s+/);
  const first = letters[0]?.[0] ?? '';
  const second = letters[1]?.[0] ?? letters[0]?.[1] ?? '';
  return `${first}${second}`.toUpperCase();
}

function rowMarkup(entry: LeaderboardEntry): string {
  const color = AVATAR_COLORS[(entry.rank - 1) % AVATAR_COLORS.length];

  return `
    <tr>
      <td><span class="leaderboard__rank">#${entry.rank}</span></td>
      <td>
        <div class="leaderboard__player">
          <span class="leaderboard__avatar leaderboard__avatar--${color}">${initials(entry.playerName)}</span>
          ${entry.playerName}
        </div>
      </td>
      <td>${entry.gamesPlayed}</td>
      <td>${entry.totalScore.toLocaleString('en-US')}</td>
      <td>
        <span class="leaderboard__streak">🔥 ${entry.streakDays} days</span>
      </td>
      <td><span class="leaderboard__pill">${entry.favoriteGameName}</span></td>
    </tr>
  `;
}

async function loadLeaderboard(): Promise<LeaderboardResponse> {
  const response = await fetch('/mock-data/leaderboard.json');
  if (!response.ok) {
    throw new Error(`Failed to load leaderboard: ${response.status}`);
  }
  return (await response.json()) as LeaderboardResponse;
}

export function createLeaderboard(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'leaderboard';
  section.id = 'leaderboard';

  section.innerHTML = `
    <div class="container">
      <h2><span class="leaderboard__accent" aria-hidden="true"></span>Top Players This Week</h2>
      <div class="leaderboard__table-wrap">
        <table class="leaderboard__table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Games played</th>
              <th scope="col">Total score</th>
              <th scope="col">Streak</th>
              <th scope="col">Favorite game</th>
            </tr>
          </thead>
          <tbody data-rows>
            <tr>
              <td colspan="6" class="leaderboard__status">Loading leaderboard…</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const tbody = section.querySelector<HTMLTableSectionElement>('[data-rows]');

  loadLeaderboard()
    .then((response) => {
      if (!tbody) return;
      tbody.innerHTML = response.data.map(rowMarkup).join('');
    })
    .catch(() => {
      if (!tbody) return;
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="leaderboard__status">Couldn't load the leaderboard right now.</td>
        </tr>
      `;
    });

  return section;
}
