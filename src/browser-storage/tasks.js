const TASK_STORAGE_KEY = 'qeeshu_ruisi_local_tasks_v1';
const MAX_TASKS = 100;

function canUseStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const probeKey = '__qeeshu_ruisi_task_probe__';
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

function normalizeTask(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const normalizedStatus = item.status || 'pending';
  const updatedAt = item.updatedAt || item.createdAt || new Date().toISOString();
  const completedAt = normalizedStatus === 'completed'
    ? (item.completedAt || updatedAt)
    : null;
  return {
    id: item.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(item.title || '未命名事项').trim() || '未命名事项',
    scope: String(item.scope || '待补充').trim() || '待补充',
    note: String(item.note || '').trim(),
    status: normalizedStatus,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt,
    completedAt,
    archivedAt: item.archivedAt || null,
  };
}

export function readTaskItems() {
  if (!canUseStorage()) {
    return [];
  }
  const parsed = parseJson(window.localStorage.getItem(TASK_STORAGE_KEY), []);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.map(normalizeTask).filter(Boolean);
}

export function writeTaskItems(items) {
  if (!canUseStorage()) {
    return [];
  }
  const normalized = Array.isArray(items)
    ? items.map(normalizeTask).filter(Boolean).slice(0, MAX_TASKS)
    : [];
  window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function appendTaskItem(item) {
  const timestamp = new Date().toISOString();
  const current = readTaskItems();
  return writeTaskItems([
    {
      ...item,
      id: item?.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: item?.createdAt || timestamp,
      updatedAt: item?.updatedAt || timestamp,
      status: item?.status || 'pending',
    },
    ...current,
  ]);
}

export function updateTaskItem(taskId, updates = {}) {
  const timestamp = new Date().toISOString();
  const current = readTaskItems();
  return writeTaskItems(current.map((item) => {
    if (String(item.id) !== String(taskId)) {
      return item;
    }
    const nextStatus = updates.status || item.status || 'pending';
    return normalizeTask({
      ...item,
      ...updates,
      id: item.id,
      createdAt: item.createdAt,
      updatedAt: timestamp,
      completedAt: nextStatus === 'completed'
        ? (updates.completedAt || item.completedAt || timestamp)
        : null,
      archivedAt: Object.prototype.hasOwnProperty.call(updates, 'archivedAt')
        ? updates.archivedAt
        : item.archivedAt,
    });
  }));
}

export function removeTaskItem(taskId) {
  const current = readTaskItems();
  return writeTaskItems(current.filter((item) => String(item.id) !== String(taskId)));
}
