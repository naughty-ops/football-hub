// players.js - Professional Player Management System

/**
 * Player data structure and utilities
 */
const playersData = {
  // This will be populated from players.json
};

// DOM elements cache
const playerModal = document.getElementById('playerModal');
let currentPlayerId = null;

/**
 * Initializes player system
 */
async function initPlayers() {
  try {
    const response = await fetch('data/players.json');
    const data = await response.json();
    Object.assign(playersData, data.players.reduce((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {}));
    
    console.log('Player system initialized with', Object.keys(playersData).length, 'players');
    
    // Render top players on home page
    renderTopPlayers();
  } catch (error) {
    console.error('Error initializing player system:', error);
    showNotification('alert', 'Failed to load player data', 5000);
  }
}

/**
 * Renders top players grid on home page
 */
function renderTopPlayers() {
  const grid = document.getElementById('topPlayersGrid');
  if (!grid) return;
  
  // Sort players by position/points
  const topPlayers = Object.values(playersData)
    .sort((a, b) => a.position - b.position)
    .slice(0, 6); // Show top 6 players
  
  grid.innerHTML = topPlayers.map(player => `
    <div class="player-card" onclick="showPlayerDetails('${player.id}')">
      <div class="player-position">${player.position}</div>
      <img src="${player.img}" alt="${player.name}" class="player-img">
      <div class="player-name">${player.name}</div>
      <div class="player-id">eFootball ID: ${player.id}</div>
    </div>
  `).join('');
}

/**
 * Shows player details modal
 * @param {string} identifier - Player ID or name
 */
async function showPlayerDetails(identifier) {
  const playerId = getPlayerId(identifier);
  if (!playerId || !playersData[playerId]) {
    showNotification('alert', 'Player not found', 3000);
    return;
  }
  
  currentPlayerId = playerId;
  const player = playersData[playerId];
  
  // Show loading state
  playerModal.innerHTML = `
    <div class="player-modal-content loading">
      <span class="close-modal" onclick="closePlayerModal()">&times;</span>
      <div class="player-header">
        <div class="loading-player-img"></div>
        <div class="player-header-info">
          <h2 class="loading-player" style="width: 200px"></h2>
          <p class="loading-player" style="width: 150px"></p>
          <p class="loading-player" style="width: 120px"></p>
        </div>
      </div>
    </div>
  `;
  playerModal.style.display = 'block';
  
  // Load player data with slight delay for better UX
  setTimeout(() => populatePlayerModal(player), 300);
}

/**
 * Populates player modal with data
 * @param {object} player - Player data object
 */
function populatePlayerModal(player) {
  const winRate = Math.round((player.matchesWon / player.matchesPlayed) * 100);
  
  playerModal.innerHTML = `
    <div class="player-modal-content">
      <span class="close-modal" onclick="closePlayerModal()">&times;</span>
      <div class="player-header">
        <img src="${player.img}" alt="${player.name}" class="player-header-img">
        <div class="player-header-info">
          <h2>${player.name}</h2>
          <p>eFootball ID: ${player.id}</p>
          <p>Position: ${player.position}${getOrdinalSuffix(player.position)}</p>
          <p>Points: ${player.points}</p>
        </div>
        <div class="player-header-rank">#${player.position}</div>
      </div>
      
      <div class="player-details">
        <div class="stats-tabs">
          <div class="stats-tab active" data-tab="overview">Overview</div>
          <div class="stats-tab" data-tab="matches">Matches</div>
          <div class="stats-tab" data-tab="stats">Advanced Stats</div>
        </div>
        
        <div class="stats-tab-content active" id="overviewTab">
          <div class="detail-section">
            <h3><i class="fas fa-chart-line"></i> Player Stats</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${player.matchesPlayed}</div>
                <div class="stat-label">Matches Played</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${player.matchesWon}</div>
                <div class="stat-label">Matches Won</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${winRate}%</div>
                <div class="stat-label">Win Rate</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${player.goalsScored}</div>
                <div class="stat-label">Goals Scored</div>
              </div>
            </div>
          </div>
          
          ${renderTournamentStats(player)}
          ${renderNextMatch(player)}
        </div>
        
        <div class="stats-tab-content" id="matchesTab">
          <div class="detail-section">
            <h3><i class="fas fa-history"></i> Recent Matches</h3>
            <div class="matches-list">
              ${renderRecentMatches(player)}
            </div>
          </div>
        </div>
        
        <div class="stats-tab-content" id="statsTab">
          ${renderAdvancedStats(player)}
          ${renderMatchHighlights(player)}
        </div>
      </div>
    </div>
  `;
  
  // Initialize tab switching
  initPlayerTabs();
}

/**
 * Renders tournament stats section
 */
function renderTournamentStats(player) {
  if (!player.tournamentStats) return '';
  
  return `
    <div class="detail-section">
      <h3><i class="fas fa-trophy"></i> Tournament Performance</h3>
      <div class="tournament-stats">
        <div class="tournament-stat-card">
          <h4>Current Group</h4>
          <p>${player.tournamentStats.group || 'N/A'}</p>
        </div>
        <div class="tournament-stat-card">
          <h4>Group Position</h4>
          <p>${player.tournamentStats.groupPosition ? 
            player.tournamentStats.groupPosition + getOrdinalSuffix(player.tournamentStats.groupPosition) : 'N/A'}</p>
        </div>
        <div class="tournament-stat-card">
          <h4>Group Points</h4>
          <p>${player.tournamentStats.groupPoints || '0'}</p>
        </div>
        <div class="tournament-stat-card">
          <h4>Group Goals</h4>
          <p>${player.tournamentStats.groupGoals || '0'}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders next match section
 */
function renderNextMatch(player) {
  if (!player.nextMatch) return '';
  
  const opponent = playersData[player.nextMatch.opponentId];
  if (!opponent) return '';
  
  return `
    <div class="detail-section">
      <h3><i class="fas fa-calendar-alt"></i> Next Match</h3>
      <div class="match-item">
        <div class="match-teams">
          <div class="match-team">
            <img src="${player.img}" alt="${player.name}">
            <span>${player.name}</span>
          </div>
          <div class="match-result">VS</div>
          <div class="match-team">
            <img src="${opponent.img}" alt="${opponent.name}">
            <span>${opponent.name}</span>
          </div>
        </div>
        <div class="match-info">
          <span>${player.nextMatch.date}</span>
          <span>${player.nextMatch.time}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders recent matches list
 */
function renderRecentMatches(player) {
  if (!player.recentMatches || player.recentMatches.length === 0) {
    return '<p>No recent matches found</p>';
  }
  
  return player.recentMatches.map(match => {
    const opponent = playersData[match.opponentId];
    if (!opponent) return '';
    
    return `
      <div class="match-item">
        <div class="match-teams">
          <div class="match-team">
            <img src="${player.img}" alt="${player.name}">
            <span>${player.name}</span>
          </div>
          <div class="match-result ${match.result === 'W' ? 'win' : match.result === 'L' ? 'loss' : 'draw'}">
            ${match.score}
          </div>
          <div class="match-team">
            <img src="${opponent.img}" alt="${opponent.name}">
            <span>${opponent.name}</span>
          </div>
        </div>
        <div class="match-info">
          <span>${match.date}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renders advanced stats section
 */
function renderAdvancedStats(player) {
  if (!player.advancedStats) return '';
  
  return `
    <div class="detail-section">
      <h3><i class="fas fa-chart-pie"></i> Performance Metrics</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${player.advancedStats.avgGoals || '0.0'}</div>
          <div class="stat-label">Avg Goals/Match</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${player.advancedStats.cleanSheets || '0'}</div>
          <div class="stat-label">Clean Sheets</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${player.advancedStats.passAccuracy || '0'}%</div>
          <div class="stat-label">Pass Accuracy</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${player.advancedStats.shotsOnTarget || '0'}%</div>
          <div class="stat-label">Shots on Target</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders match highlights section
 */
function renderMatchHighlights(player) {
  if (!player.lastMatchHighlights) return '';
  
  return `
    <div class="detail-section">
      <h3><i class="fas fa-star"></i> Match Highlights</h3>
      <div class="match-highlights">
        <div class="highlight-title">Last Match Performance</div>
        <div class="highlight-stats">
          ${player.lastMatchHighlights.goals ? `
            <div class="highlight-stat">
              <i class="fas fa-futbol"></i> ${player.lastMatchHighlights.goals} Goals
            </div>
          ` : ''}
          ${player.lastMatchHighlights.assists ? `
            <div class="highlight-stat">
              <i class="fas fa-assistive-listening-systems"></i> ${player.lastMatchHighlights.assists} Assists
            </div>
          ` : ''}
          ${player.lastMatchHighlights.distance ? `
            <div class="highlight-stat">
              <i class="fas fa-running"></i> ${player.lastMatchHighlights.distance} km
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Initializes player modal tabs
 */
function initPlayerTabs() {
  const tabs = playerModal.querySelectorAll('.stats-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      playerModal.querySelectorAll('.stats-tab-content').forEach(c => c.classList.remove('active'));
      
      // Activate current tab
      this.classList.add('active');
      const tabId = this.dataset.tab + 'Tab';
      playerModal.querySelector(`#${tabId}`).classList.add('active');
    });
  });
}

/**
 * Closes player modal
 */
function closePlayerModal() {
  playerModal.style.display = 'none';
  currentPlayerId = null;
}

/**
 * Gets player ID from identifier (ID or name)
 */
function getPlayerId(identifier) {
  // If it's already an ID
  if (playersData[identifier]) return identifier;
  
  // Check if it's a name
  for (const id in playersData) {
    if (playersData[id].name === identifier) {
      return id;
    }
  }
  
  return null;
}

// Helper function from main.js
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPlayers);

// Expose to global scope
window.showPlayerDetails = showPlayerDetails;
window.closePlayerModal = closePlayerModal;
