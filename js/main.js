// main.js - Complete Fixed Version
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Show loading state
    showNotification('info', 'Loading application data...', 3000);

    // First load all essential data
    await loadEssentialData();
    
    // Then initialize UI components
    initNavigation();
    initScrollToTop();
    loadContent('home');
    
    // Hide loading state
    showNotification('info', 'Application ready!', 2000);
  } catch (error) {
    console.error("Initialization failed:", error);
    showNotification('alert', 'Failed to initialize application', 5000);
    
    // Fallback content if initialization fails
    document.getElementById('contentContainer').innerHTML = `
      <div class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Application Error</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload Application</button>
      </div>
    `;
  }
});

// Shared application data store
const appData = {
  players: {},
  fixtures: { matches: [], completedMatches: [] },
  standings: {},
  news: [],
  lastUpdated: null
};

/**
 * Loads all required data files
 */
async function loadEssentialData() {
  try {
    // Show loading progress
    const loadingMessages = [
      'Loading player data...',
      'Loading fixture data...',
      'Loading standings...',
      'Loading news...'
    ];
    
    let currentLoad = 0;
    const updateProgress = () => {
      document.getElementById('notificationContainer')?.insertAdjacentHTML(
        'beforeend',
        `<div class="loading-progress">${loadingMessages[currentLoad]}</div>`
      );
      currentLoad++;
    };

    // Load all data in parallel
    const [playersRes, fixturesRes, standingsRes, newsRes] = await Promise.all([
      fetch('data/players.json').then(r => { updateProgress(); return r; }),
      fetch('data/fixtures.json').then(r => { updateProgress(); return r; }),
      fetch('data/standings.json').then(r => { updateProgress(); return r; }),
      fetch('data/news.json').then(r => { updateProgress(); return r; })
    ]);

    // Verify responses
    if (!playersRes.ok) throw new Error('Failed to load player data');
    if (!fixturesRes.ok) throw new Error('Failed to load fixtures');
    if (!standingsRes.ok) throw new Error('Failed to load standings');
    if (!newsRes.ok) throw new Error('Failed to load news');

    // Process and store data
    appData.players = (await playersRes.json()).players.reduce((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});

    appData.fixtures = await fixturesRes.json();
    appData.standings = await standingsRes.json();
    appData.news = await newsRes.json();
    appData.lastUpdated = new Date().toISOString();

    // Make available globally
    window.appData = appData;
    window.playersData = appData.players; // Legacy support

  } catch (error) {
    console.error("Data loading failed:", error);
    throw new Error(`Data loading failed: ${error.message}`);
  }
}

/**
 * Tab-specific initialization functions
 */
function initHome() {
  try {
    console.log("Initializing home tab");
    renderNews();
    renderTopPlayers();
  } catch (error) {
    console.error("Home tab init failed:", error);
    showNotification('alert', 'Failed to initialize home tab', 3000);
  }
}

function initToday() {
  try {
    console.log("Initializing today tab");
    renderTodaysMatches();
    setupLiveUpdates();
  } catch (error) {
    console.error("Today tab init failed:", error);
    showNotification('alert', 'Failed to initialize today tab', 3000);
  }
}

function initTable() {
  try {
    console.log("Initializing table tab");
    renderStandings();
    setupStandingsAutoRefresh();
  } catch (error) {
    console.error("Table tab init failed:", error);
    showNotification('alert', 'Failed to initialize standings', 3000);
  }
}

function initFixture() {
  try {
    console.log("Initializing fixture tab");
    generateFixtureView();
    setupAutoRefresh();
  } catch (error) {
    console.error("Fixture tab init failed:", error);
    showNotification('alert', 'Failed to initialize fixtures', 3000);
  }
}

/**
 * Content loading system
 */
async function loadContent(tab) {
  const contentContainer = document.getElementById('contentContainer');
  if (!contentContainer) return;

  // Show loading state
  contentContainer.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading ${tab} content...</p>
    </div>
  `;

  try {
    // Load HTML template
    const response = await fetch(`templates/${tab}.html`);
    if (!response.ok) throw new Error(`Failed to load ${tab} template`);
    
    const html = await response.text();
    contentContainer.innerHTML = html;

    // Initialize tab-specific functionality
    switch(tab) {
      case 'home': initHome(); break;
      case 'today': initToday(); break;
      case 'table': initTable(); break;
      case 'fixture': initFixture(); break;
    }
  } catch (error) {
    console.error(`Error loading ${tab} content:`, error);
    contentContainer.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to load ${tab} content</h3>
        <p>${error.message}</p>
        <button onclick="loadContent('${tab}')">Retry</button>
      </div>
    `;
  }
}

/**
 * Navigation system
 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const navIndicator = document.querySelector('.nav-indicator');
  const navbar = document.querySelector('.navbar');

  if (!navItems.length || !navIndicator || !navbar) {
    console.warn("Navigation elements not found");
    return;
  }

  function moveIndicator(item) {
    const itemRect = item.getBoundingClientRect();
    const navbarRect = navbar.getBoundingClientRect();
    navIndicator.style.width = `${itemRect.width}px`;
    navIndicator.style.left = `${itemRect.left - navbarRect.left}px`;
  }

  function createRipple(e, element) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - element.getBoundingClientRect().left - radius}px`;
    ripple.style.top = `${e.clientY - element.getBoundingClientRect().top - radius}px`;
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      navItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      moveIndicator(this);
      createRipple(e, this);
      loadContent(this.dataset.tab);
    });
  });

  // Set initial active item
  const activeItem = document.querySelector('.nav-item.active') || navItems[0];
  if (activeItem) {
    activeItem.classList.add('active');
    moveIndicator(activeItem);
  }
}

/**
 * Scroll-to-top button
 */
function initScrollToTop() {
  const scrollToTopBtn = document.getElementById('scrollToTop');
  if (!scrollToTopBtn) return;

  window.addEventListener('scroll', () => {
    scrollToTopBtn.classList.toggle('visible', window.pageYOffset > 300);
  });
  
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Helper function for ordinal numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num) {
  if (isNaN(num)) return '';
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Make helper function available globally
window.getOrdinalSuffix = getOrdinalSuffix;
