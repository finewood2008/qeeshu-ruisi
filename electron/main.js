const path = require('node:path');
const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const { createDesktopServices } = require('./services/desktop-services');

let mainWindow;
let desktopServices;

function getStartUrl() {
  return process.env.ELECTRON_START_URL || null;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1280,
    minHeight: 760,
    title: '企数睿思',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const startUrl = getStartUrl();
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }
}

function registerIpcHandlers() {
  ipcMain.on('ruisi:runtime:get-bootstrap-sync', (event) => {
    try {
      event.returnValue = desktopServices.runtime.getBootstrap();
    } catch (error) {
      event.returnValue = {
        desktopAvailable: true,
        baseUrl: '',
        apiKey: '',
        scope: 'mine',
        runtimeType: 'openclaw',
        hasStoredConfig: false,
        configSource: 'electron-main',
        storageProvider: 'electron-main',
        error: error instanceof Error ? error.message : '获取桌面启动配置失败。',
      };
    }
  });

  ipcMain.on('ruisi:runtime:save-config-sync', (event, payload) => {
    try {
      event.returnValue = {
        ok: true,
        data: desktopServices.runtime.saveRuntimeConfig(payload),
      };
    } catch (error) {
      event.returnValue = {
        ok: false,
        error: {
          code: 'SAVE_RUNTIME_CONFIG_FAILED',
          message: error instanceof Error ? error.message : '保存桌面端运行时配置失败。',
        },
      };
    }
  });

  ipcMain.on('ruisi:runtime:clear-config-sync', (event) => {
    try {
      event.returnValue = {
        ok: true,
        data: desktopServices.runtime.clearRuntimeConfig(),
      };
    } catch (error) {
      event.returnValue = {
        ok: false,
        error: {
          code: 'CLEAR_RUNTIME_CONFIG_FAILED',
          message: error instanceof Error ? error.message : '清除桌面端运行时配置失败。',
        },
      };
    }
  });

  ipcMain.handle('ruisi:runtime:get-health', async () => desktopServices.runtime.getHealth());
  ipcMain.handle('ruisi:workspace:list', async () => desktopServices.workspace.listProfiles());
  ipcMain.handle('ruisi:snapshot:dashboard', async () => desktopServices.snapshots.dashboard());
  ipcMain.handle('ruisi:snapshot:search', async (_event, query) => desktopServices.snapshots.search(query));
  ipcMain.handle('ruisi:snapshot:assets', async () => desktopServices.snapshots.assets());
  ipcMain.handle('ruisi:snapshot:crm', async () => desktopServices.snapshots.crm());
  ipcMain.handle('ruisi:snapshot:system', async () => desktopServices.snapshots.system());
  ipcMain.handle('ruisi:snapshot:writer', async () => desktopServices.snapshots.writer());
  ipcMain.handle('ruisi:snapshot:methodology', async () => desktopServices.snapshots.methodology());
  ipcMain.handle('ruisi:drafts:list', async () => desktopServices.drafts.list());
  ipcMain.handle('ruisi:drafts:get', async (_event, id) => desktopServices.drafts.get(id));
  ipcMain.handle('ruisi:drafts:save', async (_event, payload) => desktopServices.drafts.save(payload));
  ipcMain.handle('ruisi:crm:save-customer', async (_event, payload) => desktopServices.crm.saveCustomer(payload));
  ipcMain.handle('ruisi:crm:save-opportunity', async (_event, payload) => desktopServices.crm.saveOpportunity(payload));
  ipcMain.handle('ruisi:knowledge:save-document', async (_event, payload) => desktopServices.knowledge.saveDocument(payload));
  ipcMain.handle('ruisi:knowledge:reindex-document', async (_event, documentId) => desktopServices.knowledge.reindexDocument(documentId));
  ipcMain.handle('ruisi:knowledge:delete-document', async (_event, documentId) => desktopServices.knowledge.deleteDocument(documentId));
  ipcMain.handle('ruisi:knowledge:list-chat-messages', async (_event, documentId, title) => desktopServices.knowledge.listChatMessages(documentId, title));
  ipcMain.handle('ruisi:knowledge:send-chat-message', async (_event, payload) => desktopServices.knowledge.sendChatMessage(payload));
  ipcMain.handle('ruisi:methodology:get-profile', async () => desktopServices.methodology.getProfile());
  ipcMain.handle('ruisi:methodology:save-profile', async (_event, payload) => desktopServices.methodology.saveProfile(payload));
  ipcMain.handle('ruisi:methodology:add-custom-framework', async (_event, payload) => desktopServices.methodology.addCustomFramework(payload));
  ipcMain.handle('ruisi:ai:list-logs', async (_event, scope, limit) => desktopServices.ai.listLogs(scope, limit));
  ipcMain.handle('ruisi:ai:record-log', async (_event, payload) => desktopServices.ai.recordLog(payload));
  ipcMain.handle('ruisi:notifications:list', async (_event, limit) => desktopServices.notifications.list(limit));
  ipcMain.handle('ruisi:notifications:add', async (_event, payload) => desktopServices.notifications.add(payload));
  ipcMain.handle('ruisi:notifications:mark-all-read', async () => desktopServices.notifications.markAllRead());
  ipcMain.handle('ruisi:notifications:clear', async () => desktopServices.notifications.clear());
}

app.whenReady().then(() => {
  desktopServices = createDesktopServices({
    userDataPath: app.getPath('userData'),
    safeStorage,
  });
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  desktopServices?.close?.();
});
