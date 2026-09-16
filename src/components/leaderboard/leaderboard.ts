import './leaderboard.scss';
import type { LeaderboardEntry, LeaderboardResponse } from '@/types/leaderboard';

function rowMarkup(entry: LeaderboardEntry): string {
  return `
    <tr>
      <td><span class="leaderboard__rank">#${entry.rank}</span></td>
      <td>${entry.playerName}</td>
      <td>${entry.gamesPlayed}</td>
      <td>${entry.totalScore.toLocaleString('en-US')}</td>
      <td>${entry.streakDays} days</td>
      <td>${entry.favoriteGameName}</td>
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
      <h2>Top players this week</h2>
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
