// main.js - Fixed version
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initNavigation();
  initScrollToTop();
  loadContent('home');
});

// Tab-specific initialization functions
function initHome() {
  // Initialize home page features
  console.log("Home tab initialized");
  // You can add home-specific code here later
}

function initToday() {
  // Initialize today page features
  console.log("Today tab initialized");
  // You can add today-specific code here later
}

function initTable() {
  // Initialize table page features
  console.log("Table tab initialized");
  // You can add table-specific code here later
}

function initFixture() {
  // Initialize fixture page features
  console.log("Fixture tab initialized");
  // You can add fixture-specific code here later
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const navIndicator = document.querySelector('.nav-indicator');
  const navbar = document.querySelector('.navbar');

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

  // Set initial indicator position
  const activeItem = document.querySelector('.nav-item.active');
  if (activeItem) moveIndicator(activeItem);

  window.addEventListener('resize', () => {
    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem) moveIndicator(activeItem);
  });
}

function initScrollToTop() {
  const scrollToTopBtn = document.getElementById('scrollToTop');
  
  if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });
    
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

async function loadContent(tab) {
  const contentContainer = document.getElementById('contentContainer');
  if (!contentContainer) return;

  contentContainer.innerHTML = '';

  try {
    const response = await fetch(`templates/${tab}.html`);
    if (!response.ok) throw new Error('Failed to load template');
    
    const html = await response.text();
    contentContainer.innerHTML = html;

    // Initialize tab-specific JS
    switch(tab) {
      case 'home':
        initHome();
        break;
      case 'today':
        initToday();
        break;
      case 'table':
        initTable();
        break;
      case 'fixture':
        initFixture();
        break;
    }
  } catch (error) {
    console.error(`Error loading ${tab} content:`, error);
    contentContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading ${tab} content. Please try again later.</p>
      </div>
    `;
  }
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num) {
  if (isNaN(num)) return '';
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
