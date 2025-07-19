// notifications.js - Professional Notification System

/**
 * Notification types and their configurations
 */
const notificationTypes = {
  win: {
    icon: 'fas fa-trophy',
    color: 'var(--win-color)',
    title: 'Match Won'
  },
  loss: {
    icon: 'fas fa-times-circle',
    color: 'var(--loss-color)',
    title: 'Match Lost'
  },
  draw: {
    icon: 'fas fa-equals',
    color: 'var(--draw-color)',
    title: 'Match Drawn'
  },
  info: {
    icon: 'fas fa-info-circle',
    color: 'var(--highlight)',
    title: 'Information'
  },
  update: {
    icon: 'fas fa-sync-alt',
    color: 'var(--highlight)',
    title: 'Update'
  },
  alert: {
    icon: 'fas fa-exclamation-triangle',
    color: '#ffcc00',
    title: 'Alert'
  }
};

/**
 * Shows a notification with professional animation and auto-dismissal
 * @param {string} type - Notification type (win/loss/draw/info/update/alert)
 * @param {string} message - Notification message content
 * @param {number} duration - Duration in ms (default: 5000)
 * @param {object} options - Additional options {title, action}
 */
function showNotification(type, message, duration = 5000, options = {}) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const config = notificationTypes[type] || notificationTypes.info;
  const notificationId = `notification-${Date.now()}`;
  const title = options.title || config.title;

  const notification = document.createElement('div');
  notification.id = notificationId;
  notification.className = `notification ${type}`;
  notification.style.setProperty('--notification-color', config.color);

  notification.innerHTML = `
    <i class="${config.icon} notification-icon"></i>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
      ${options.action ? `<div class="notification-action">${options.action}</div>` : ''}
    </div>
    <div class="notification-close" onclick="removeNotification('${notificationId}')">&times;</div>
    <div class="notification-progress">
      <div class="notification-progress-bar" style="animation-duration: ${duration/1000}s"></div>
    </div>
  `;

  container.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Auto-remove if duration is set
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notificationId);
    }, duration);
  }

  return notificationId;
}

/**
 * Removes a notification with smooth animation
 * @param {string} notificationId - ID of the notification to remove
 */
function removeNotification(notificationId) {
  const notification = document.getElementById(notificationId);
  if (notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

/**
 * Shows match result notifications automatically
 */
async function showMatchNotifications() {
  try {
    const response = await fetch('data/fixtures.json');
    const { completedMatches } = await response.json();
    
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
        const winner = match.winnerId === match.player1Id ? player1 : player2;
        const loser = match.winnerId === match.player1Id ? player2 : player1;
        
        showNotification(
          'win',
          `${winner.name} defeated ${loser.name} ${match.score}`,
          6000,
          { 
            title: 'Match Result',
            action: `<button onclick="showPlayerDetails('${winner.id}')">View Winner</button>`
          }
        );
      }
    });
  } catch (error) {
    console.error('Error loading match notifications:', error);
  }
}

/**
 * Shows system notifications from news.json
 */
async function showSystemNotifications() {
  try {
    const response = await fetch('data/news.json');
    const newsItems = await response.json();
    
    newsItems.forEach(news => {
      if (news.urgent) {
        showNotification(
          'alert',
          news.content,
          8000,
          { title: news.title }
        );
      }
    });
  } catch (error) {
    console.error('Error loading system notifications:', error);
  }
}

/**
 * Initialize notification system
 */
function initNotifications() {
  // Show match notifications on load
  showMatchNotifications();
  
  // Show system notifications
  showSystemNotifications();
  
  // Check for new notifications every 5 minutes
  setInterval(() => {
    showMatchNotifications();
    showSystemNotifications();
  }, 300000);
}

// Helper function (would be in players.js)
function getPlayerById(id) {
  // Implementation depends on your player data structure
  // This should return player object or null
  return window.playersData?.[id] || null;
}

// Expose to global scope
window.showNotification = showNotification;
window.removeNotification = removeNotification;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initNotifications);
