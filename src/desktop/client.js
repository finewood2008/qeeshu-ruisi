function getBridge() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.ruisiDesktop || null;
}

export function hasDesktopBridge() {
  return Boolean(getBridge()?.available);
}

export function getDesktopBootstrapSync() {
  return getBridge()?.runtime?.getBootstrapSync?.() || {};
}

export function saveDesktopRuntimeConfigSync(payload) {
  const result = getBridge()?.runtime?.saveConfigSync?.(payload);
  if (!result) {
    return null;
  }
  if (result.ok === false) {
    throw new Error(result.error?.message || '保存桌面端运行时配置失败。');
  }
  return result.data || null;
}

export function clearDesktopRuntimeConfigSync() {
  const result = getBridge()?.runtime?.clearConfigSync?.();
  if (!result) {
    return null;
  }
  if (result.ok === false) {
    throw new Error(result.error?.message || '清除桌面端运行时配置失败。');
  }
  return result.data || null;
}

export async function getDesktopRuntimeHealth() {
  return getBridge()?.runtime?.getHealth?.() || null;
}

export async function loadLocalDashboardSnapshot() {
  return getBridge()?.snapshots?.dashboard?.() || null;
}

export async function loadLocalSearchSnapshot(query) {
  return getBridge()?.snapshots?.search?.(query) || [];
}

export async function loadLocalAssetsSnapshot() {
  return getBridge()?.snapshots?.assets?.() || null;
}

export async function loadLocalCrmSnapshot() {
  return getBridge()?.snapshots?.crm?.() || null;
}

export async function loadLocalSystemSnapshot() {
  return getBridge()?.snapshots?.system?.() || null;
}

export async function loadLocalWriterSnapshot() {
  return getBridge()?.snapshots?.writer?.() || null;
}

export async function loadLocalMethodologySnapshot() {
  return getBridge()?.snapshots?.methodology?.() || null;
}

export async function listDesktopDrafts() {
  return getBridge()?.drafts?.list?.() || [];
}

export async function getDesktopDraft(id) {
  return getBridge()?.drafts?.get?.(id) || null;
}

export async function saveDesktopDraft(payload) {
  return getBridge()?.drafts?.save?.(payload) || null;
}

export async function saveDesktopCrmCustomer(payload) {
  return getBridge()?.crm?.saveCustomer?.(payload) || null;
}

export async function saveDesktopCrmOpportunity(payload) {
  return getBridge()?.crm?.saveOpportunity?.(payload) || null;
}

export async function saveDesktopKnowledgeDocument(payload) {
  return getBridge()?.knowledge?.saveDocument?.(payload) || null;
}

export async function reindexDesktopKnowledgeDocument(documentId) {
  return getBridge()?.knowledge?.reindexDocument?.(documentId) || null;
}

export async function deleteDesktopKnowledgeDocument(documentId) {
  return getBridge()?.knowledge?.deleteDocument?.(documentId) || null;
}

export async function listDesktopKnowledgeChatMessages(documentId, title) {
  return getBridge()?.knowledge?.listChatMessages?.(documentId, title) || [];
}

export async function sendDesktopKnowledgeChatMessage(payload) {
  return getBridge()?.knowledge?.sendChatMessage?.(payload) || [];
}

export async function getDesktopMethodologyProfile() {
  return getBridge()?.methodology?.getProfile?.() || null;
}

export async function saveDesktopMethodologyProfile(payload) {
  return getBridge()?.methodology?.saveProfile?.(payload) || null;
}

export async function addDesktopCustomFramework(payload) {
  return getBridge()?.methodology?.addCustomFramework?.(payload) || null;
}

export async function listDesktopAiLogs(scope, limit = 20) {
  return getBridge()?.ai?.listLogs?.(scope, limit) || [];
}

export async function recordDesktopAiLog(payload) {
  return getBridge()?.ai?.recordLog?.(payload) || [];
}

export async function listDesktopNotificationEvents(limit = 100) {
  return getBridge()?.notifications?.list?.(limit) || [];
}

export async function addDesktopNotificationEvent(payload) {
  return getBridge()?.notifications?.add?.(payload) || [];
}

export async function markAllDesktopNotificationEventsRead() {
  return getBridge()?.notifications?.markAllRead?.() || [];
}

export async function clearDesktopNotificationEvents() {
  return getBridge()?.notifications?.clear?.() || [];
}
