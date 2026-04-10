const NOTIFICATION_STORAGE_KEY = 'qeeshu_ruisi_notification_events_v1';
const MAX_EVENTS = 50;

function canUseStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const probeKey = '__qeeshu_ruisi_notification_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    return false;
  }
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeEvent(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  return {
    id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: item.title || '系统通知',
    detail: item.detail || '',
    level: item.level || 'info',
    createdAt: item.createdAt || new Date().toISOString(),
    read: Boolean(item.read || item.readAt),
    readAt: item.readAt || null,
  };
}

export function readNotificationEvents() {
  if (!canUseStorage()) {
    return [];
  }
  const parsed = parseJson(window.localStorage.getItem(NOTIFICATION_STORAGE_KEY), []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map(normalizeEvent).filter(Boolean);
}

export function writeNotificationEvents(events) {
  if (!canUseStorage()) {
    return [];
  }
  const normalized = Array.isArray(events)
    ? events.map(normalizeEvent).filter(Boolean).slice(0, MAX_EVENTS)
    : [];
  window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function appendNotificationEvent(event) {
  const current = readNotificationEvents();
  return writeNotificationEvents([{ ...normalizeEvent(event), read: false, readAt: null }, ...current].slice(0, MAX_EVENTS));
}

export function markAllNotificationEventsRead() {
  const timestamp = new Date().toISOString();
  const current = readNotificationEvents();
  return writeNotificationEvents(current.map((item) => ({
    ...item,
    read: true,
    readAt: item.readAt || timestamp,
  })));
}

export function clearNotificationEvents() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
}

export function countUnreadNotificationEvents(events = []) {
  return (Array.isArray(events) ? events : []).filter((item) => !item.read).length;
}
