import { createQeeClawClient } from '@qeeclaw/core-sdk';
import { createQeeClawProductSDK } from '@qeeclaw/product-sdk';
import {
  clearDesktopRuntimeConfigSync,
  getDesktopBootstrapSync,
  hasDesktopBridge,
  saveDesktopRuntimeConfigSync,
} from '../desktop/client';
import { normalizeSdkError } from './error-utils';

const RUNTIME_CONFIG_STORAGE_KEY = 'qeeshu_ruisi_runtime_config_v1';

function sanitizeMode(value) {
  if (value === 'sdk') {
    return value;
  }
  return 'auto';
}

function sanitizeRuntimeType(value) {
  if (value === 'openclaw' || value === 'hermes') {
    return value;
  }
  return 'hermes'; // 默认 Runtime 为 Hermes
}

function sanitizeScope(value) {
  return value === 'all' ? 'all' : 'mine';
}

function normalizeBaseUrl(value) {
  return (value || '').trim().replace(/\/+$/, '');
}

function readStoredRuntimeConfig() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function readDesktopRuntimeConfig() {
  try {
    return getDesktopBootstrapSync() || {};
  } catch (error) {
    return {};
  }
}

function normalizeTeamId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function selectDefaultTeam(teams = []) {
  if (!Array.isArray(teams) || teams.length === 0) {
    return null;
  }
  const enterpriseTeam = teams.find((item) => !item?.isPersonal);
  return enterpriseTeam || teams[0] || null;
}

function selectResolvedTeam(context) {
  const defaultTeamId = normalizeTeamId(context?.defaultTeamId);
  if (defaultTeamId) {
    const matchedTeam = (context?.teams || []).find((item) => normalizeTeamId(item?.id) === defaultTeamId);
    if (matchedTeam) {
      return matchedTeam;
    }
    return {
      id: defaultTeamId,
      name: context?.defaultTeamName || `Workspace ${defaultTeamId}`,
      isPersonal: Boolean(context?.defaultTeamIsPersonal),
    };
  }
  return selectDefaultTeam(context?.teams);
}

const storedRuntimeConfig = readStoredRuntimeConfig();
const desktopRuntimeConfig = readDesktopRuntimeConfig();
const desktopAvailable = hasDesktopBridge();
const envRequestedMode = sanitizeMode(process.env.REACT_APP_QEECLAW_MODE);
const baseUrl = normalizeBaseUrl(
  desktopRuntimeConfig.baseUrl ||
  storedRuntimeConfig.baseUrl ||
  process.env.REACT_APP_QEECLAW_BASE_URL,
);
const apiKey = (
  desktopRuntimeConfig.apiKey ||
  storedRuntimeConfig.apiKey ||
  storedRuntimeConfig.token ||
  process.env.REACT_APP_QEECLAW_API_KEY ||
  process.env.REACT_APP_QEECLAW_TOKEN ||
  ''
).trim();
const scope = sanitizeScope(desktopRuntimeConfig.scope || storedRuntimeConfig.scope || process.env.REACT_APP_QEECLAW_SCOPE);
const hasStoredConfig = Boolean(
  desktopRuntimeConfig.hasStoredConfig ||
  storedRuntimeConfig.baseUrl ||
  storedRuntimeConfig.apiKey ||
  storedRuntimeConfig.token,
);
const requestedMode = hasStoredConfig ? 'sdk' : envRequestedMode;
const hasCredentials = Boolean(baseUrl && apiKey);
const resolvedMode = desktopAvailable ? 'local' : hasCredentials ? 'sdk' : 'unconfigured';
const runtimeType = sanitizeRuntimeType(
  desktopRuntimeConfig.runtimeType ||
  storedRuntimeConfig.runtimeType ||
  process.env.REACT_APP_QEECLAW_RUNTIME_TYPE,
);
const knowledgeUploadTimeoutMs = (() => {
  const parsed = Number(process.env.REACT_APP_QEECLAW_KNOWLEDGE_UPLOAD_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 360000;
})();
const writerTimeoutMs = (() => {
  const parsed = Number(process.env.REACT_APP_QEECLAW_WRITER_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120000;
})();

export const qeeclawRuntime = Object.freeze({
  mode: requestedMode,
  resolvedMode,
  hasCredentials,
  baseUrl,
  apiKey,
  runtimeType,
  scope,
  hasStoredConfig,
  isDesktop: desktopAvailable,
  configSource: desktopRuntimeConfig.configSource || (hasStoredConfig ? 'local-storage' : 'env'),
  storageProvider: desktopRuntimeConfig.storageProvider || (desktopAvailable ? 'electron-main' : 'local-storage'),
  knowledgeUploadTimeoutMs,
  writerTimeoutMs,
  isHermes: runtimeType === 'hermes',
  isOpenClaw: runtimeType === 'openclaw',
  hermesBridgeUrl: (process.env.REACT_APP_HERMES_BRIDGE_URL || 'http://127.0.0.1:21747').replace(/\/+$/, ''),
});

let coreClient;
let productClient;
let workspaceContextPromise;
let teamContextPromise;
const scopedCoreClients = new Map();
const scopedProductClients = new Map();

export function shouldPreferSdk() {
  return qeeclawRuntime.hasCredentials;
}

export function shouldPreferLiveData() {
  return qeeclawRuntime.resolvedMode === 'sdk' || qeeclawRuntime.resolvedMode === 'local';
}

export function shouldUseDesktopBusinessData() {
  return qeeclawRuntime.isDesktop;
}

export function canUseBrowserBusinessData() {
  const browserDevDataEnabled = process.env.REACT_APP_ENABLE_BROWSER_DEV_DATA === '1'
    || process.env.NODE_ENV !== 'production';
  if (!browserDevDataEnabled) {
    return false;
  }
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const probeKey = '__qeeshu_ruisi_browser_business_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    return false;
  }
}

export function isBrowserDevDataEnabled() {
  return canUseBrowserBusinessData();
}

export function getUserScope() {
  return qeeclawRuntime.scope;
}

export function getCoreClient(options = {}) {
  if (!qeeclawRuntime.hasCredentials) {
    throw new Error('QeeClaw SDK 尚未配置 baseUrl/API Key。请在系统设置中填写，或补充 .env.local。');
  }

  const timeoutMs = Number(options.timeoutMs);
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    const cacheKey = `timeout:${timeoutMs}`;
    if (!scopedCoreClients.has(cacheKey)) {
      scopedCoreClients.set(cacheKey, createQeeClawClient({
        baseUrl: qeeclawRuntime.baseUrl,
        token: qeeclawRuntime.apiKey,
        timeoutMs,
        userAgent: 'qeeshu-ruisi-real-product-validation',
      }));
    }
    return scopedCoreClients.get(cacheKey);
  }

  if (!coreClient) {
    coreClient = createQeeClawClient({
      baseUrl: qeeclawRuntime.baseUrl,
      token: qeeclawRuntime.apiKey,
      userAgent: 'qeeshu-ruisi-real-product-validation',
    });
  }
  return coreClient;
}

export function getProductClient(options = {}) {
  const timeoutMs = Number(options.timeoutMs);
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    const cacheKey = `timeout:${timeoutMs}`;
    if (!scopedProductClients.has(cacheKey)) {
      scopedProductClients.set(cacheKey, createQeeClawProductSDK(getCoreClient({ timeoutMs })));
    }
    return scopedProductClients.get(cacheKey);
  }

  if (!productClient) {
    productClient = createQeeClawProductSDK(getCoreClient());
  }
  return productClient;
}

export async function resolveWorkspaceContext() {
  if (!qeeclawRuntime.hasCredentials) {
    throw new Error('QeeClaw SDK 尚未配置 baseUrl/API Key，无法解析当前工作空间。');
  }
  if (!workspaceContextPromise) {
    workspaceContextPromise = getCoreClient().tenant.getCurrentContext().catch((error) => {
      workspaceContextPromise = undefined;
      throw normalizeSdkError(error, {
        hasCredentials: qeeclawRuntime.hasCredentials,
        context: 'workspace-context',
      });
    });
  }
  return workspaceContextPromise;
}

export async function resolveTeamContext() {
  if (!teamContextPromise) {
    teamContextPromise = resolveWorkspaceContext()
      .then((context) => {
        const team = selectResolvedTeam(context);
        const teamId = normalizeTeamId(team?.id);

        if (!team || !teamId) {
          throw new Error('当前 API Key 未绑定可用工作空间，无法自动解析默认业务范围。');
        }

        return {
          teamId,
          workspaceName: team.name || `Workspace ${teamId}`,
          isPersonal: Boolean(team.isPersonal),
        };
      })
      .catch((error) => {
        teamContextPromise = undefined;
        throw normalizeSdkError(error, {
          hasCredentials: qeeclawRuntime.hasCredentials,
          context: 'team-context',
        });
      });
  }
  return teamContextPromise;
}

export async function resolveKnowledgeScope() {
  const team = await resolveTeamContext();
  return {
    teamId: team.teamId,
    runtimeType: qeeclawRuntime.runtimeType,
  };
}

export function getRuntimeConfigDraft() {
  return {
    baseUrl: qeeclawRuntime.baseUrl,
    apiKey: qeeclawRuntime.apiKey,
    scope: qeeclawRuntime.scope,
    runtimeType: qeeclawRuntime.runtimeType,
    configSource: qeeclawRuntime.configSource,
    hasStoredConfig: qeeclawRuntime.hasStoredConfig,
  };
}

export function canPersistRuntimeConfig() {
  return qeeclawRuntime.isDesktop || (typeof window !== 'undefined' && Boolean(window.localStorage));
}

export function saveRuntimeConfig({ baseUrl: nextBaseUrl, apiKey: nextApiKey, token: nextToken, scope: nextScope = 'mine', runtimeType: nextRuntimeType }) {
  if (!canPersistRuntimeConfig()) {
    throw new Error('当前环境不支持本地保存接入配置。');
  }

  const normalizedBaseUrl = normalizeBaseUrl(nextBaseUrl);
  const normalizedApiKey = (nextApiKey || nextToken || '').trim();
  const normalizedScope = sanitizeScope(nextScope);
  const normalizedRuntimeType = sanitizeRuntimeType(nextRuntimeType);

  if (!normalizedBaseUrl || !normalizedApiKey) {
    throw new Error('请先填写完整的 baseUrl 与 API Key。');
  }

  if (qeeclawRuntime.isDesktop) {
    saveDesktopRuntimeConfigSync({
      baseUrl: normalizedBaseUrl,
      apiKey: normalizedApiKey,
      scope: normalizedScope,
      runtimeType: normalizedRuntimeType,
    });
    return;
  }

  window.localStorage.setItem(
    RUNTIME_CONFIG_STORAGE_KEY,
    JSON.stringify({
      baseUrl: normalizedBaseUrl,
      apiKey: normalizedApiKey,
      scope: normalizedScope,
      runtimeType: normalizedRuntimeType,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearRuntimeConfig() {
  if (!canPersistRuntimeConfig()) {
    return;
  }
  if (qeeclawRuntime.isDesktop) {
    clearDesktopRuntimeConfigSync();
    return;
  }
  window.localStorage.removeItem(RUNTIME_CONFIG_STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Hermes Bridge 交互方法
// ---------------------------------------------------------------------------

/**
 * 检查 Hermes Bridge 健康状态。
 * 只在 runtimeType === 'hermes' 时有意义。
 */
export async function checkHermesBridgeHealth() {
  if (!qeeclawRuntime.isHermes) {
    return { ok: false, message: '当前 Runtime 不是 Hermes' };
  }

  try {
    const response = await fetch(`${qeeclawRuntime.hermesBridgeUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return { ok: false, message: `Bridge 返回 HTTP ${response.status}` };
    }
    const data = await response.json();
    return {
      ok: data.status === 'ok',
      version: data.version,
      hermesAvailable: data.hermes_available,
      pythonVersion: data.python_version,
      message: data.message || null,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Bridge 连接失败',
    };
  }
}

/**
 * 获取 Hermes Gateway 状态。
 */
export async function getHermesGatewayStatus() {
  if (!qeeclawRuntime.isHermes) {
    return { running: false, platforms: [], activePlatformCount: 0 };
  }

  try {
    const response = await fetch(`${qeeclawRuntime.hermesBridgeUrl}/gateway/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return { running: false, platforms: [], activePlatformCount: 0 };
    }
    return await response.json();
  } catch {
    return { running: false, platforms: [], activePlatformCount: 0 };
  }
}

/**
 * 获取 Hermes 支持的全部消息平台列表。
 */
export async function getHermesSupportedPlatforms() {
  try {
    const response = await fetch(`${qeeclawRuntime.hermesBridgeUrl}/gateway/supported-platforms`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.platforms || [];
  } catch {
    return [];
  }
}

/**
 * 启动 / 停止 Hermes Gateway。
 */
export async function controlHermesGateway(action = 'start') {
  try {
    const response = await fetch(`${qeeclawRuntime.hermesBridgeUrl}/gateway/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10000),
    });
    return await response.json();
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Gateway 操作失败' };
  }
}
