const { contextBridge, ipcRenderer } = require('electron');

function invokeSync(channel, payload) {
  return ipcRenderer.sendSync(channel, payload);
}

contextBridge.exposeInMainWorld('ruisiDesktop', {
  available: true,
  runtime: {
    getBootstrapSync() {
      return invokeSync('ruisi:runtime:get-bootstrap-sync');
    },
    saveConfigSync(payload) {
      return invokeSync('ruisi:runtime:save-config-sync', payload);
    },
    clearConfigSync() {
      return invokeSync('ruisi:runtime:clear-config-sync');
    },
    getHealth() {
      return ipcRenderer.invoke('ruisi:runtime:get-health');
    },
  },
  workspace: {
    listProfiles() {
      return ipcRenderer.invoke('ruisi:workspace:list');
    },
  },
  snapshots: {
    dashboard() {
      return ipcRenderer.invoke('ruisi:snapshot:dashboard');
    },
    search(query) {
      return ipcRenderer.invoke('ruisi:snapshot:search', query);
    },
    assets() {
      return ipcRenderer.invoke('ruisi:snapshot:assets');
    },
    crm() {
      return ipcRenderer.invoke('ruisi:snapshot:crm');
    },
    system() {
      return ipcRenderer.invoke('ruisi:snapshot:system');
    },
    writer() {
      return ipcRenderer.invoke('ruisi:snapshot:writer');
    },
    methodology() {
      return ipcRenderer.invoke('ruisi:snapshot:methodology');
    },
  },
  drafts: {
    list() {
      return ipcRenderer.invoke('ruisi:drafts:list');
    },
    get(id) {
      return ipcRenderer.invoke('ruisi:drafts:get', id);
    },
    save(payload) {
      return ipcRenderer.invoke('ruisi:drafts:save', payload);
    },
  },
  crm: {
    saveCustomer(payload) {
      return ipcRenderer.invoke('ruisi:crm:save-customer', payload);
    },
    saveOpportunity(payload) {
      return ipcRenderer.invoke('ruisi:crm:save-opportunity', payload);
    },
  },
  knowledge: {
    saveDocument(payload) {
      return ipcRenderer.invoke('ruisi:knowledge:save-document', payload);
    },
    reindexDocument(documentId) {
      return ipcRenderer.invoke('ruisi:knowledge:reindex-document', documentId);
    },
    deleteDocument(documentId) {
      return ipcRenderer.invoke('ruisi:knowledge:delete-document', documentId);
    },
    listChatMessages(documentId, title) {
      return ipcRenderer.invoke('ruisi:knowledge:list-chat-messages', documentId, title);
    },
    sendChatMessage(payload) {
      return ipcRenderer.invoke('ruisi:knowledge:send-chat-message', payload);
    },
  },
  methodology: {
    getProfile() {
      return ipcRenderer.invoke('ruisi:methodology:get-profile');
    },
    saveProfile(payload) {
      return ipcRenderer.invoke('ruisi:methodology:save-profile', payload);
    },
    addCustomFramework(payload) {
      return ipcRenderer.invoke('ruisi:methodology:add-custom-framework', payload);
    },
  },
  ai: {
    listLogs(scope, limit) {
      return ipcRenderer.invoke('ruisi:ai:list-logs', scope, limit);
    },
    recordLog(payload) {
      return ipcRenderer.invoke('ruisi:ai:record-log', payload);
    },
  },
  notifications: {
    list(limit) {
      return ipcRenderer.invoke('ruisi:notifications:list', limit);
    },
    add(payload) {
      return ipcRenderer.invoke('ruisi:notifications:add', payload);
    },
    markAllRead() {
      return ipcRenderer.invoke('ruisi:notifications:mark-all-read');
    },
    clear() {
      return ipcRenderer.invoke('ruisi:notifications:clear');
    },
  },
});
