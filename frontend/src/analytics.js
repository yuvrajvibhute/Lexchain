/**
 * LexChain Analytics & Monitoring Module
 * Tracks user interactions, wallet connections, errors, and performance metrics.
 * Integrates with localStorage for offline-first analytics persistence.
 */

const ANALYTICS_KEY = 'lexchain_analytics';
const SESSION_KEY = 'lexchain_session';
const MAX_EVENTS = 500;

// ─── Session Management ────────────────────────────────────────────────────────
function getOrCreateSession() {
  let session = sessionStorage.getItem(SESSION_KEY);
  if (!session) {
    session = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
      startedAt: new Date().toISOString(),
      pageViews: 0,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    session = JSON.parse(session);
  }
  return session;
}

// ─── Core Event Storage ────────────────────────────────────────────────────────
function getStoredData() {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : { events: [], metrics: {}, errors: [], walletInteractions: [] };
  } catch {
    return { events: [], metrics: {}, errors: [], walletInteractions: [] };
  }
}

function saveData(data) {
  try {
    // Keep only last MAX_EVENTS to avoid storage overflow
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(-MAX_EVENTS);
    }
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Analytics] Storage save failed:', e.message);
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Track a generic analytics event
 * @param {string} eventName - Name of the event
 * @param {object} properties - Event properties/metadata
 */
export function trackEvent(eventName, properties = {}) {
  const session = getOrCreateSession();
  const data = getStoredData();

  const event = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: eventName,
    sessionId: session.id,
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    ...properties,
  };

  data.events.push(event);
  saveData(data);

  // Console log in development
  if (import.meta.env.DEV) {
    console.log(`[Analytics] Event: ${eventName}`, properties);
  }

  return event;
}

/**
 * Track a page view
 * @param {string} pageName - Name of the page
 * @param {string} role - User role if authenticated
 */
export function trackPageView(pageName, role = null) {
  const session = getOrCreateSession();
  session.pageViews = (session.pageViews || 0) + 1;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return trackEvent('page_view', {
    page: pageName,
    role,
    referrer: document.referrer || 'direct',
  });
}

/**
 * Track wallet connection events
 * @param {string} walletAddress - The connected wallet address
 * @param {string} method - Connection method (metamask, privy, etc.)
 * @param {string} action - Action performed (connect, disconnect, sign)
 */
export function trackWalletInteraction(walletAddress, method, action, metadata = {}) {
  const data = getStoredData();

  const interaction = {
    id: 'wi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    walletAddress: walletAddress ? walletAddress.toLowerCase() : 'unknown',
    method,
    action,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  data.walletInteractions.push(interaction);
  saveData(data);

  // Also track as a regular event
  trackEvent('wallet_interaction', {
    wallet: walletAddress ? walletAddress.slice(0, 10) + '...' : 'unknown',
    method,
    action,
    ...metadata,
  });

  return interaction;
}

/**
 * Track user authentication events
 */
export function trackAuth(action, role, method, userId = null) {
  return trackEvent('auth_event', { action, role, method, userId });
}

/**
 * Track evidence operations
 */
export function trackEvidence(action, evidenceId = null, caseId = null) {
  return trackEvent('evidence_operation', { action, evidenceId, caseId });
}

/**
 * Track case management operations
 */
export function trackCase(action, caseId = null, status = null) {
  return trackEvent('case_operation', { action, caseId, status });
}

/**
 * Track errors and exceptions
 * @param {string} errorType - Type of error
 * @param {string} message - Error message
 * @param {object} context - Additional context
 */
export function trackError(errorType, message, context = {}) {
  const data = getStoredData();

  const error = {
    id: 'err_' + Date.now(),
    type: errorType,
    message: String(message).slice(0, 500),
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    ...context,
  };

  data.errors.push(error);
  if (data.errors.length > 100) data.errors = data.errors.slice(-100);
  saveData(data);

  trackEvent('error', { errorType, message: String(message).slice(0, 200) });
  return error;
}

/**
 * Record a performance metric
 * @param {string} metricName - Name of the metric
 * @param {number} value - Metric value
 * @param {string} unit - Unit (ms, bytes, count, etc.)
 */
export function trackMetric(metricName, value, unit = 'count') {
  const data = getStoredData();
  if (!data.metrics[metricName]) {
    data.metrics[metricName] = { values: [], unit };
  }
  data.metrics[metricName].values.push({ value, timestamp: new Date().toISOString() });
  if (data.metrics[metricName].values.length > 100) {
    data.metrics[metricName].values = data.metrics[metricName].values.slice(-100);
  }
  saveData(data);
}

/**
 * Track API call performance
 */
export function trackApiCall(endpoint, method, statusCode, durationMs) {
  trackMetric(`api_${method.toLowerCase()}_${endpoint.replace(/\//g, '_')}`, durationMs, 'ms');
  trackEvent('api_call', { endpoint, method, statusCode, durationMs });
}

// ─── Analytics Dashboard Data ──────────────────────────────────────────────────

/**
 * Get aggregated analytics report
 */
export function getAnalyticsReport() {
  const data = getStoredData();
  const session = getOrCreateSession();

  // Event counts by type
  const eventCounts = {};
  data.events.forEach(e => {
    eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
  });

  // Page views
  const pageViews = data.events
    .filter(e => e.name === 'page_view')
    .reduce((acc, e) => {
      acc[e.page] = (acc[e.page] || 0) + 1;
      return acc;
    }, {});

  // Unique wallets
  const uniqueWallets = [...new Set(
    data.walletInteractions
      .filter(w => w.walletAddress && w.walletAddress !== 'unknown')
      .map(w => w.walletAddress)
  )];

  // Error rate
  const totalEvents = data.events.length;
  const errorEvents = data.errors.length;

  // Activity over time (last 7 days)
  const now = new Date();
  const activityByDay = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    activityByDay[key] = 0;
  }
  data.events.forEach(e => {
    const day = e.timestamp?.split('T')[0];
    if (activityByDay.hasOwnProperty(day)) {
      activityByDay[day]++;
    }
  });

  return {
    summary: {
      totalEvents,
      totalErrors: errorEvents,
      uniqueWallets: uniqueWallets.length,
      walletInteractions: data.walletInteractions.length,
      currentSession: session.id,
      sessionPageViews: session.pageViews,
    },
    eventCounts,
    pageViews,
    uniqueWallets,
    activityByDay,
    recentEvents: data.events.slice(-20).reverse(),
    recentErrors: data.errors.slice(-10).reverse(),
    walletInteractions: data.walletInteractions,
  };
}

/**
 * Get wallet interaction proof for submission
 * Returns list of unique wallet addresses with their interaction history
 */
export function getWalletInteractionProof() {
  const data = getStoredData();

  // Group by wallet address
  const byWallet = {};
  data.walletInteractions.forEach(wi => {
    if (!byWallet[wi.walletAddress]) {
      byWallet[wi.walletAddress] = {
        address: wi.walletAddress,
        interactions: [],
        firstSeen: wi.timestamp,
        lastSeen: wi.timestamp,
      };
    }
    byWallet[wi.walletAddress].interactions.push(wi);
    if (wi.timestamp > byWallet[wi.walletAddress].lastSeen) {
      byWallet[wi.walletAddress].lastSeen = wi.timestamp;
    }
  });

  return Object.values(byWallet);
}

/**
 * Export analytics data as JSON string for download
 */
export function exportAnalytics() {
  const report = getAnalyticsReport();
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lexchain-analytics-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Clear all analytics data
 */
export function clearAnalytics() {
  localStorage.removeItem(ANALYTICS_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Performance Observer ──────────────────────────────────────────────────────
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  try {
    // Track page load performance
    window.addEventListener('load', () => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        trackMetric('page_load_time', Math.round(nav.loadEventEnd - nav.fetchStart), 'ms');
        trackMetric('dom_content_loaded', Math.round(nav.domContentLoadedEventEnd - nav.fetchStart), 'ms');
        trackMetric('time_to_first_byte', Math.round(nav.responseStart - nav.fetchStart), 'ms');
      }
    });

    // Track Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lcp = entries[entries.length - 1];
        trackMetric('largest_contentful_paint', Math.round(lcp.startTime), 'ms');
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {
    // Performance API not fully supported
  }
}

// ─── Global Error Tracking ─────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    trackError('javascript_error', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError('unhandled_promise_rejection', event.reason?.message || String(event.reason));
  });
}

export default {
  trackEvent,
  trackPageView,
  trackWalletInteraction,
  trackAuth,
  trackEvidence,
  trackCase,
  trackError,
  trackMetric,
  trackApiCall,
  getAnalyticsReport,
  getWalletInteractionProof,
  exportAnalytics,
  clearAnalytics,
};
