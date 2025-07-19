// standings.js - Professional Tournament Standings System

/**
 * Standings data and state management
 */
let standingsData = {
  groups: {},
  lastUpdated: null
};

/**
 * Initializes standings system
 */
async function initStandings() {
  try {
    // Load required data
    const [playersRes, fixturesRes] = await Promise.all([
      fetch('data/players.json'),
      fetch('data/fixtures.json')
    ]);
    
    const playersData = await playersRes.json();
    const fixturesData = await fixturesRes.json();
    
    // Calculate standings
    standingsData = calculateAllStandings(playersData.players, fixturesData.matches, fixturesData.completedMatches);
    standingsData.lastUpdated = new Date().toISOString();
    
    console.log('Standings calculated for', Object.keys(standingsData.groups).length, 'groups');
    
    // Render standings
    renderStandings();
    
    // Set up auto-refresh
    setupStandingsAutoRefresh();
  } catch (error) {
    console.error('Error initializing standings:', error);
    showNotification('alert', 'Failed to load standings data', 5000);
  }
}

/**
 * Calculates standings for all groups
 */
function calculateAllStandings(players, matches, completedMatches) {
  const allMatches = [...(matches || []), ...(completedMatches || [])];
  const groups = {};
  
  // Initialize group structures with players
  players.forEach(player => {
    if (player.tournamentStats?.group) {
      const group = player.tournamentStats.group;
      if (!groups[group]) {
        groups[group] = {
          players: {},
          matches: []
        };
      }
      
      // Initialize player stats
      groups[group].players[player.id] = {
        id: player.id,
        name: player.name,
        img: player.img,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    }
  });
  
  // Process matches to update standings
  allMatches.forEach(match => {
    if (!match.group || !match.player1Id || !match.player2Id) return;
    
    const group = groups[match.group];
    if (!group) return;
    
    // Add match to group
    group.matches.push(match);
    
    // Get player references
    const player1 = group.players[match.player1Id];
    const player2 = group.players[match.player2Id];
    if (!player1 || !player2) return;
    
    // Update match counts
    player1.played++;
    player2.played++;
    
    // Process completed matches
    if (match.status === 'completed' && match.score) {
      const [goals1, goals2] = match.score.split('-').map(Number);
      
      // Update goals
      player1.goalsFor += goals1;
      player1.goalsAgainst += goals2;
      player2.goalsFor += goals2;
      player2.goalsAgainst += goals1;
      
      // Update points based on result
      if (match.winnerId === 'draw') {
        player1.draws++;
        player2.draws++;
        player1.points += 1;
        player2.points += 1;
      } else if (match.winnerId === match.player1Id) {
        player1.wins++;
        player2.losses++;
        player1.points += 3;
      } else {
        player2.wins++;
        player1.losses++;
        player2.points += 3;
      }
    }
  });
  
  // Sort players in each group by points, GD, GF
  Object.keys(groups).forEach(group => {
    groups[group].standings = Object.values(groups[group].players).sort((a, b) => {
      // Sort by points
      if (b.points !== a.points) return b.points - a.points;
      
      // Sort by goal difference
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      
      // Sort by goals scored
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      
      // Sort alphabetically as last resort
      return a.name.localeCompare(b.name);
    });
    
    // Add position numbers
    groups[group].standings.forEach((player, index) => {
      player.position = index + 1;
    });
  });
  
  return {
    groups,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Renders standings tables
 */
function renderStandings() {
  const container = document.getElementById('standingsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  Object.entries(standingsData.groups).forEach(([groupName, groupData]) => {
    const groupElement = document.createElement('div');
    groupElement.className = 'group-standings';
    
    groupElement.innerHTML = `
      <div class="group-title">Group ${groupName}</div>
      <div class="table-container">
        <table class="group-standings-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Player</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            ${groupData.standings.map(player => `
              <tr onclick="showPlayerDetails('${player.id}')" class="clickable-player">
                <td>${player.position}</td>
                <td class="team-cell">
                  <img src="${player.img}" alt="${player.name}">
                  <span>${player.name}</span>
                </td>
                <td>${player.played}</td>
                <td>${player.wins}</td>
                <td>${player.draws}</td>
                <td>${player.losses}</td>
                <td>${player.goalsFor}</td>
                <td>${player.goalsAgainst}</td>
                <td>${player.goalsFor - player.goalsAgainst}</td>
                <td><strong>${player.points}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    container.appendChild(groupElement);
  });
  
  // Add last updated time
  const lastUpdated = document.createElement('div');
  lastUpdated.className = 'last-updated';
  lastUpdated.textContent = `Last updated: ${new Date(standingsData.lastUpdated).toLocaleString()}`;
  container.appendChild(lastUpdated);
}

/**
 * Sets up auto-refresh of standings
 */
function setupStandingsAutoRefresh() {
  // Refresh every 15 minutes
  setInterval(async () => {
    try {
      const fixturesRes = await fetch('data/fixtures.json');
      const fixturesData = await fixturesRes.json();
      
      // Check if there are new completed matches
      const newCompletedCount = fixturesData.completedMatches.filter(cm => 
        !standingsData.groups[cm.group]?.matches.some(m => 
          m.player1Id === cm.player1Id && 
          m.player2Id === cm.player2Id &&
          m.date === cm.date
        )
      ).length;
      
      if (newCompletedCount > 0) {
        console.log('New matches detected, refreshing standings...');
        await initStandings();
        showNotification('info', 'Standings updated', 3000);
      }
    } catch (error) {
      console.error('Error during standings refresh:', error);
    }
  }, 900000); // 15 minutes
}

/**
 * Gets current standings for a specific group
 */
function getGroupStandings(group) {
  return standingsData.groups[group]?.standings || [];
}

/**
 * Gets current position of a player
 */
function getPlayerPosition(playerId) {
  for (const group in standingsData.groups) {
    const player = standingsData.groups[group].standings.find(p => p.id === playerId);
    if (player) {
      return {
        group,
        position: player.position,
        points: player.points
      };
    }
  }
  return null;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initStandings);

// Expose to global scope
window.getGroupStandings = getGroupStandings;
window.getPlayerPosition = getPlayerPosition;
