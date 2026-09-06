/**
 * Lightweight usage analytics tracker.
 *
 * Sessions are heartbeat-based: a session id lives in localStorage and expires
 * after 30 minutes of inactivity, so each visit becomes a session. Events are
 * sent fire-and-forget to POST /api/events — tracking must never slow down or
 * break the app.
 */

const SESSION_KEY = 'jackpass_session_id';
const SESSION_START_KEY = 'jackpass_session_started_at';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function getOrCreateSession(): { id: string; startedAt: number } {
  let id = localStorage.getItem(SESSION_KEY);
  let startedAt = Number(localStorage.getItem(SESSION_START_KEY) || 0);
  const now = Date.now();

  if (!id || !startedAt || now - startedAt > SESSION_TIMEOUT_MS) {
    id = crypto.randomUUID();
    startedAt = now;
    try {
      localStorage.setItem(SESSION_KEY, id);
      localStorage.setItem(SESSION_START_KEY, String(startedAt));
    } catch {
      // Private mode or storage full — still track within this page view.
    }
  }

  return { id, startedAt };
}

/**
 * Record a usage event. Fire-and-forget; failures are silently swallowed.
 */
export function track(eventName: string, metadata?: Record<string, unknown>): void {
  try {
    const { id, startedAt } = getOrCreateSession();
    const payload = {
      sessionId: id,
      eventName,
      page: window.location.pathname,
      metadata: metadata ?? {},
      durationSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
    };

    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true, // survives page navigation
    }).catch(() => {
      // Tracking must never break the app.
    });
  } catch {
    // Never throw from tracking.
  }
}

/**
 * Wire up session lifecycle listeners (session end on page unload).
 * Call once at app startup.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  const onPageHide = () => {
    try {
      const { id, startedAt } = getOrCreateSession();
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: id,
          eventName: 'session_end',
          page: window.location.pathname,
          metadata: {},
          durationSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  window.addEventListener('pagehide', onPageHide);
}