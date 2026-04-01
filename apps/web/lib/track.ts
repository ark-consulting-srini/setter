// Lightweight analytics tracker — fire and forget
export function track(eventType: string, page?: string, eventData?: Record<string, unknown>) {
  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, page, eventData }),
    }).catch(() => {}) // silently ignore errors
  } catch {}
}
