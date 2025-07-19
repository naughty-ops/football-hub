// fixtures.js - Professional Fixture Management System

/**
 * Fixture data and state management
 */
let fixturesData = {
  groups: [],
  matches: [],
  completedMatches: []
};

let currentGroupFilter = 'all';
let currentRoundFilter = 'all';
let autoRefreshInterval = null;

/**
 * Initializes fixture system
 */
async function initFixtures() {
  try {
    const response = await fetch('data/fixtures.json');
    const data = await response.json();
    
    fixturesData = {
      groups: data.groups || ['A', 'B', 'C', 'D'],
      matches: data.matches || [],
      completedMatches: data.completedMatches || []
    };
    
    console.log('Fixture system initialized with', 
      fixturesData.matches.length, 'matches and',
      fixturesData.completedMatches.length, 'completed matches');
    
    // Set up auto-refresh every 5 minutes
    setupAutoRefresh();
    
    // Generate initial fixtures
    generateFixtureView();
    
    // Show any new match notifications
    checkForNewResults();
  } catch (error) {
    console.error('Error loading fixture data:', error);
    showNotification('alert', 'Failed to load fixture data', 5000);
  }
}

/**
 * Generates the complete fixture view
 */
function generateFixtureView() {
  const fixtureContainer = document.getElementById('fixtureList');
  if (!fixtureContainer) return;
  
  // Clear existing content
  fixtureContainer.innerHTML = '';
  
  // Generate group navigation
  generateGroupNavigation();
  
  // Generate round navigation
  generateRoundNavigation();
  
  // Process and display all fixtures
  processFixturesForDisplay();
}

/**
 * Generates group filter navigation
 */
function generateGroupNavigation() {
  const groupNav = document.querySelector('.group-navigation');
  if (!groupNav) return;
  
  const groups = ['all', ...fixturesData.groups, 'completed'];
  
  groupNav.innerHTML = groups.map(group => `
    <div class="group-btn ${group === currentGroupFilter ? 'active' : ''}" 
         data-group="${group}"
         onclick="setGroupFilter('${group}')">
      ${group === 'all' ? 'All Groups' : 
        group === 'completed' ? 'Results' : `Group ${group}`}
    </div>
  `).join('');
}

/**
 * Generates round filter navigation
 */
function generateRoundNavigation() {
  const roundNav = document.querySelector('.round-navigation');
  if (!roundNav) return;
  
  // Calculate total rounds from matches
  const totalRounds = Math.max(...fixturesData.matches.map(m => m.round), 0) || 1;
  const rounds = ['all', ...Array.from({length: totalRounds}, (_, i) => i + 1)];
  
  roundNav.innerHTML = rounds.map(round => `
    <div class="round-btn ${round === currentRoundFilter ? 'active' : ''}" 
         data-round="${round}"
         onclick="setRoundFilter('${round}')">
      ${round === 'all' ? 'All Rounds' : `Round ${round}`}
    </div>
  `).join('');
}

/**
 * Processes fixtures for display based on current filters
 */
function processFixturesForDisplay() {
  const fixtureContainer = document.getElementById('fixtureList');
  if (!fixtureContainer) return;
  
  // Group matches by round and group
  const groupedMatches = groupMatchesByRoundAndGroup();
  
  // Create fixture sections
  Object.entries(groupedMatches).forEach(([group, rounds]) => {
    Object.entries(rounds).forEach(([round, matches]) => {
      if (matches.length > 0) {
        const section = createFixtureSection(group, round, matches);
        fixtureContainer.appendChild(section);
      }
    });
  });
  
  // Apply current filters
  applyCurrentFilters();
}

/**
 * Groups matches by round and group for display
 */
function groupMatchesByRoundAndGroup() {
  const allMatches = [...fixturesData.matches, ...fixturesData.completedMatches];
  const grouped = {};
  
  allMatches.forEach(match => {
    const group = match.group || 'Unknown';
    const round = match.round || 1;
    const status = match.status === 'completed' ? 'completed' : 'upcoming';
    
    if (!grouped[group]) grouped[group] = {};
    if (!grouped[group][round]) grouped[group][round] = [];
    
    grouped[group][round].push({
      ...match,
      status,
      isCompleted: status === 'completed'
    });
  });
  
  return grouped;
}

/**
 * Creates a fixture section element
 */
function createFixtureSection(group, round, matches) {
  const section = document.createElement('div');
  section.className = 'fixture-round';
  section.dataset.group = group.replace('Group ', '');
  section.dataset.round = round;
  section.dataset.status = group === 'Completed Matches' ? 'completed' : 'upcoming';
  
  section.innerHTML = `
    <h3 class="fixture-date">
      <i class="fas fa-${group === 'Completed Matches' ? 'history' : 'calendar'}"></i>
      ${group} - Round ${round}
    </h3>
    ${matches.map(match => createMatchCard(match)).join('')}
  `;
  
  return section;
}

/**
 * Creates an individual match card element
 */
function createMatchCard(match) {
  const player1 = getPlayerById(match.player1Id);
  const player2 = getPlayerById(match.player2Id);
  
  const player1Initials = player1 ? player1.name.split(' ').map(n => n[0]).join('') : 'P1';
  const player2Initials = player2 ? player2.name.split(' ').map(n => n[0]).join('') : 'P2';
  
  return `
    <div class="match-card ${match.isCompleted ? 'completed' : ''}">
      ${match.isCompleted && match.winnerId ? `
        <div class="winner-badge">
          Winner: ${getPlayerById(match.winnerId)?.name || 'Unknown'}
        </div>
      ` : ''}
      <div class="teams">
        <div class="team">
          <img src="${player1?.img || `https://via.placeholder.com/50x50?text=${player1Initials}`}" 
               alt="${match.player1}" 
               onclick="showPlayerDetails('${match.player1Id}')" 
               class="clickable-player">
          <span onclick="showPlayerDetails('${match.player1Id}')" class="clickable-player">
            ${player1?.name || match.player1}
          </span>
        </div>
        <div class="vs">
          VS
          ${match.score ? `
            <div class="match-score ${getScoreClass(match, match.player1Id)}">
              ${match.score}
            </div>
          ` : '<div class="match-score">-</div>'}
        </div>
        <div class="team">
          <img src="${player2?.img || `https://via.placeholder.com/50x50?text=${player2Initials}`}" 
               alt="${match.player2}" 
               onclick="showPlayerDetails('${match.player2Id}')" 
               class="clickable-player">
          <span onclick="showPlayerDetails('${match.player2Id}')" class="clickable-player">
            ${player2?.name || match.player2}
          </span>
        </div>
      </div>
      <div class="match-info">
        <span class="league">Group ${match.group}</span>
        <span class="match-status ${match.isCompleted ? 'status-completed' : 'status-upcoming'}">
          ${match.isCompleted ? 'Completed' : match.time || 'Time TBA'}
        </span>
      </div>
    </div>
  `;
}

/**
 * Applies current filters to fixtures
 */
function applyCurrentFilters() {
  const fixtures = document.querySelectorAll('.fixture-round');
  
  fixtures.forEach(fixture => {
    const fixtureGroup = fixture.dataset.group;
    const fixtureRound = fixture.dataset.round;
    
    const showFixture = 
      (currentGroupFilter === 'all' || 
       (currentGroupFilter === 'completed' && fixture.dataset.status === 'completed') || 
       fixtureGroup === currentGroupFilter) &&
      (currentRoundFilter === 'all' || fixtureRound === currentRoundFilter);
    
    fixture.style.display = showFixture ? 'block' : 'none';
  });
}

/**
 * Sets the current group filter and updates view
 */
function setGroupFilter(group) {
  currentGroupFilter = group;
  document.querySelectorAll('.group-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.group === group);
  });
  applyCurrentFilters();
}

/**
 * Sets the current round filter and updates view
 */
function setRoundFilter(round) {
  currentRoundFilter = round;
  document.querySelectorAll('.round-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.round === round);
  });
  applyCurrentFilters();
}

/**
 * Determines CSS class for score based on result
 */
function getScoreClass(match, playerId) {
  if (!match.score || !match.winnerId) return '';
  if (match.winnerId === 'draw') return 'draw';
  return match.winnerId === playerId ? 'win' : 'loss';
}

/**
 * Sets up auto-refresh of fixtures
 */
function setupAutoRefresh() {
  // Clear any existing interval
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  
  // Set new interval (every 5 minutes)
  autoRefreshInterval = setInterval(async () => {
    try {
      const response = await fetch('data/fixtures.json');
      const data = await response.json();
      
      // Check for new completed matches
      const newCompleted = data.completedMatches.filter(cm => 
        !fixturesData.completedMatches.some(existing => 
          existing.player1Id === cm.player1Id && 
          existing.player2Id === cm.player2Id &&
          existing.date === cm.date
        )
      );
      
      if (newCompleted.length > 0) {
        fixturesData.completedMatches = data.completedMatches;
        generateFixtureView();
        showNewResultNotifications(newCompleted);
      }
    } catch (error) {
      console.error('Error during fixture refresh:', error);
    }
  }, 300000); // 5 minutes
}

/**
 * Checks for and shows notifications for new results
 */
function checkForNewResults() {
  if (fixturesData.completedMatches.length > 0) {
    showNewResultNotifications(fixturesData.completedMatches);
  }
}

/**
 * Shows notifications for new match results
 */
function showNewResultNotifications(completedMatches) {
  completedMatches.forEach(match => {
    const player1 = getPlayerById(match.player1Id);
    const player2 = getPlayerById(match.player2Id);
    
    if (!player1 || !player2) return;
    
    if (match.winnerId === 'draw') {
      showNotification(
        'draw',
        `${player1.name} ${match.score} ${player2.name}`,
        6000,
        { title: 'Match Ended in Draw' }
      );
    } else {
      const winner = getPlayerById(match.winnerId);
      showNotification(
        'win',
        `${winner.name} defeated ${match.winnerId === match.player1Id ? player2.name : player1.name} ${match.score}`,
        6000,
        { 
          title: 'Match Result',
          action: `<button onclick="showPlayerDetails('${winner.id}')">View Winner</button>`
        }
      );
    }
  });
}

/**
 * Helper function to get player by ID
 */
function getPlayerById(id) {
  return window.playersData?.[id] || null;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initFixtures);

// Expose to global scope
window.setGroupFilter = setGroupFilter;
window.setRoundFilter = setRoundFilter;
