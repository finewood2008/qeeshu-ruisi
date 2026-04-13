const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const { URL } = require('node:url');
const { RuisiDatabase } = require('./database');
const { SecretStore } = require('./secrets');

const LOCAL_QEECLAW_KNOWLEDGE_BASE_URL = normalizeBaseUrl(
  process.env.RUISI_LOCAL_QEECLAW_KNOWLEDGE_BASE_URL || '',
);
const LOCAL_QEECLAW_TIMEOUT_MS = Number(process.env.RUISI_LOCAL_QEECLAW_TIMEOUT_MS || 360000);
const LOCAL_QEECLAW_READY_RETRY_TIMES = Number(process.env.RUISI_LOCAL_QEECLAW_READY_RETRY_TIMES || 6);
const LOCAL_QEECLAW_READY_RETRY_DELAY_MS = Number(process.env.RUISI_LOCAL_QEECLAW_READY_RETRY_DELAY_MS || 1500);

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function sanitizeScope(value) {
  return value === 'all' ? 'all' : 'mine';
}

function maskApiKey(value) {
  const input = String(value || '').trim();
  if (!input) {
    return '';
  }
  if (input.length <= 8) {
    return `${input.slice(0, 2)}***`;
  }
  return `${input.slice(0, 4)}***${input.slice(-4)}`;
}

function sanitizeFilename(value) {
  const normalized = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '_');
  return normalized || 'knowledge.bin';
}

function resolveManagedKnowledgePath(rootDir, filename) {
  const safeName = sanitizeFilename(filename);
  const parsed = path.parse(safeName);
  let nextPath = path.join(rootDir, safeName);
  let index = 1;

  while (fs.existsSync(nextPath)) {
    const suffix = `-${index}`;
    nextPath = path.join(rootDir, `${parsed.name}${suffix}${parsed.ext || ''}`);
    index += 1;
  }

  return nextPath;
}

function resolveUploadContentType(value, filename) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw.includes('/')) {
    return raw;
  }

  const inferred = String(filename || '').trim().toLowerCase();
  if (raw === 'pdf' || inferred.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (raw === 'ppt' || inferred.endsWith('.ppt') || inferred.endsWith('.pptx')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  if (raw === 'excel' || inferred.endsWith('.xls') || inferred.endsWith('.xlsx') || inferred.endsWith('.csv')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (raw === 'audio' || inferred.endsWith('.mp3') || inferred.endsWith('.wav') || inferred.endsWith('.m4a')) {
    return 'audio/mpeg';
  }
  if (raw === 'doc' || inferred.endsWith('.doc') || inferred.endsWith('.docx') || inferred.endsWith('.txt') || inferred.endsWith('.md')) {
    return 'application/octet-stream';
  }
  return 'application/octet-stream';
}

function safeParseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveLocalQeeClawBaseUrls() {
  const explicit = LOCAL_QEECLAW_KNOWLEDGE_BASE_URL;
  if (explicit) {
    return [explicit];
  }

  const port = String(process.env.KV_PORT || '21735').trim() || '21735';
  return [
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
  ];
}

function buildMultipartBody({ fieldName, filename, contentType, buffer }) {
  const boundary = `----RuisiBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const header = Buffer.from(
    `--${boundary}\r\n`
      + `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n`
      + `Content-Type: ${contentType}\r\n\r\n`,
    'utf8',
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  return {
    boundary,
    body: Buffer.concat([header, buffer, footer]),
  };
}

function requestLocalQeeClaw({ method = 'GET', pathname, headers = {}, body = null, timeoutMs = LOCAL_QEECLAW_TIMEOUT_MS, baseUrl } = {}) {
  const candidates = baseUrl ? [baseUrl] : resolveLocalQeeClawBaseUrls();
  let lastError = null;

  return candidates.reduce(async (previous, candidateBaseUrl) => {
    try {
      return await previous;
    } catch (_ignored) {
      return new Promise((resolve, reject) => {
        const targetUrl = new URL(pathname, `${candidateBaseUrl}/`);
        const transport = targetUrl.protocol === 'https:' ? https : http;
        const request = transport.request(
          targetUrl,
          {
            method,
            headers,
          },
          (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            response.on('end', () => {
              const rawText = Buffer.concat(chunks).toString('utf8');
              resolve({
                baseUrl: candidateBaseUrl,
                status: response.statusCode || 0,
                ok: (response.statusCode || 0) >= 200 && (response.statusCode || 0) < 300,
                text: rawText,
                json: safeParseJson(rawText),
              });
            });
          },
        );

        request.setTimeout(timeoutMs, () => {
          request.destroy(new Error(`Local QeeClaw request timed out (${candidateBaseUrl})`));
        });
        request.on('error', (error) => {
          lastError = error;
          reject(error);
        });

        if (body) {
          request.write(body);
        }
        request.end();
      });
    }
  }, Promise.reject(lastError || new Error('No local QeeClaw base URL candidates available.'))).catch((error) => {
    throw lastError || error;
  });
}

async function assertLocalQeeClawKnowledgeReady() {
  let lastError = null;

  for (let attempt = 0; attempt < LOCAL_QEECLAW_READY_RETRY_TIMES; attempt += 1) {
    try {
      const response = await requestLocalQeeClaw({
        method: 'GET',
        pathname: '/api/knowledge/stats',
        headers: {
          Accept: 'application/json',
        },
        timeoutMs: 10000,
      });

      if (!response.ok) {
        const message = response?.json?.message || response?.text || '本地 QeeClaw 知识库暂时不可用。';
        throw new Error(message);
      }

      return {
        baseUrl: response.baseUrl,
        stats: response.json?.data || null,
      };
    } catch (error) {
      lastError = error;
      if (attempt < LOCAL_QEECLAW_READY_RETRY_TIMES - 1) {
        await sleep(LOCAL_QEECLAW_READY_RETRY_DELAY_MS);
      }
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError || '');
  throw new Error(`本地 QeeClaw 知识库未启动或不可用。请先启动本地 QeeClaw 后重试。底层错误：${detail}`);
}

async function uploadToLocalQeeClawKnowledge({ filename, contentType, fileBuffer, baseUrl }) {
  const { boundary, body } = buildMultipartBody({
    fieldName: 'file',
    filename,
    contentType,
    buffer: fileBuffer,
  });
  const response = await requestLocalQeeClaw({
    method: 'POST',
    pathname: '/api/knowledge/upload',
    headers: {
      Accept: 'application/json',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body),
    },
    body,
    baseUrl,
  });

  if (!response.ok || Number(response?.json?.code) !== 0) {
    const message = response?.json?.message || response?.text || '本地 QeeClaw 知识上传失败。';
    throw new Error(`写入本地 QeeClaw 知识库失败：${message}`);
  }

  return response.json?.data || null;
}

async function deleteFromLocalQeeClawKnowledge(sourceName, options = {}) {
  const response = await requestLocalQeeClaw({
    method: 'POST',
    pathname: '/api/knowledge/delete',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: Buffer.from(JSON.stringify({ source_name: sourceName }), 'utf8'),
    baseUrl: options.baseUrl,
  });

  if (!response.ok || Number(response?.json?.code) !== 0) {
    const message = response?.json?.message || response?.text || '本地 QeeClaw 知识删除失败。';
    if (options.ignoreMissing && /不存在|not found|缺少/i.test(String(message))) {
      return { ignored: true };
    }
    throw new Error(`删除本地 QeeClaw 知识失败：${message}`);
  }

  return response.json?.data || { deleted: true };
}

function createDesktopServices({ userDataPath, safeStorage }) {
  const database = new RuisiDatabase(path.join(userDataPath, 'ruisi-local.sqlite'));
  const secretStore = new SecretStore(path.join(userDataPath, 'ruisi-secrets.json'), safeStorage);
  const managedKnowledgeDir = path.join(userDataPath, 'knowledge-assets');
  fs.mkdirSync(managedKnowledgeDir, { recursive: true });

  function getBootstrap() {
    const activeProfile = database.getActiveWorkspaceProfile();
    const apiKey = activeProfile ? secretStore.getApiKey(activeProfile.id) : '';

    return {
      desktopAvailable: true,
      baseUrl: activeProfile?.base_url || '',
      apiKey,
      scope: activeProfile?.scope || 'mine',
      runtimeType: activeProfile?.runtime_type || 'openclaw',
      hasStoredConfig: Boolean(activeProfile?.base_url && apiKey),
      configSource: activeProfile ? 'electron-main' : 'env',
      storageProvider: 'electron-main',
    };
  }

  function saveRuntimeConfig(payload) {
    const baseUrl = normalizeBaseUrl(payload?.baseUrl);
    const apiKey = String(payload?.apiKey || payload?.token || '').trim();
    const scope = sanitizeScope(payload?.scope);
    const runtimeType = payload?.runtimeType || payload?.runtime_type || 'openclaw';

    if (!baseUrl || !apiKey) {
      throw new Error('请先填写完整的 baseUrl 与 API Key。');
    }

    const profileId = database.upsertActiveWorkspaceProfile({
      id: 'workspace-default',
      workspaceName: '默认工作空间',
      baseUrl,
      runtimeType,
      scope,
      maskedApiKey: maskApiKey(apiKey),
    });
    secretStore.setApiKey(profileId, apiKey);
    database.recordRuntimeHealth('gateway', 'ok', '桌面端本地配置已保存，可继续接入本地 QeeClaw 与云端控制面。', {
      baseUrl,
      profileId,
    });
    return getBootstrap();
  }

  function clearRuntimeConfig() {
    const activeProfile = database.getActiveWorkspaceProfile();
    if (activeProfile) {
      secretStore.deleteApiKey(activeProfile.id);
    }
    database.clearWorkspaceProfiles();
    database.recordRuntimeHealth('gateway', 'warn', '桌面端接入配置已清除，当前将回退到本地业务数据模式。', {});
    return getBootstrap();
  }

  function resolveKnowledgeBuffer(payload) {
    const sourcePath = String(payload?.sourcePath || '').trim();
    if (sourcePath && fs.existsSync(sourcePath)) {
      return {
        sourcePath,
        fileBuffer: fs.readFileSync(sourcePath),
      };
    }

    if (payload?.fileBytes) {
      return {
        sourcePath: '',
        fileBuffer: Buffer.from(payload.fileBytes),
      };
    }

    throw new Error('当前缺少可写入本地知识库的文件内容。请重新选择文件后再试。');
  }

  function resolveKnowledgeMirrorPath(payload, title, fileBuffer) {
    const sourcePath = String(payload?.sourcePath || '').trim();
    if (sourcePath && fs.existsSync(sourcePath)) {
      return sourcePath;
    }

    const targetPath = resolveManagedKnowledgePath(
      managedKnowledgeDir,
      payload?.filename || payload?.sourceName || title,
    );
    fs.writeFileSync(targetPath, fileBuffer);
    return targetPath;
  }

  async function saveKnowledgeDocument(payload) {
    const title = String(payload?.title || payload?.filename || '').trim();
    if (!title) {
      throw new Error('知识文件名不能为空。');
    }

    const filename = sanitizeFilename(payload?.filename || payload?.sourceName || payload?.title || title);
    const { fileBuffer } = resolveKnowledgeBuffer(payload);
    const knowledgeRuntime = await assertLocalQeeClawKnowledgeReady();
    const uploadResult = await uploadToLocalQeeClawKnowledge({
      filename,
      contentType: resolveUploadContentType(payload?.contentType || payload?.mimeType, filename),
      fileBuffer,
      baseUrl: knowledgeRuntime.baseUrl,
    });
    const mirrorPath = resolveKnowledgeMirrorPath(payload, title, fileBuffer);
    const stat = fs.statSync(mirrorPath);
    const saved = database.saveKnowledgeDocument({
      ...payload,
      title: filename,
      sourcePath: mirrorPath,
      watchDir: payload?.watchDir || path.dirname(mirrorPath),
      fileSize: stat.size,
      indexStatus: 'indexed',
      summary: payload?.summary
        || `已上传到本地 QeeClaw 知识库，共生成 ${Number(uploadResult?.chunk_count || 0)} 个知识分片。`,
    });

    database.recordRuntimeHealth(
      'knowledge',
      'ok',
      `本地知识文件已写入 QeeClaw：${saved.title}`,
      {
        documentId: saved.id,
        sourcePath: mirrorPath,
        fileSize: stat.size,
        chunkCount: Number(uploadResult?.chunk_count || 0),
      },
    );

    return saved;
  }

  async function reindexKnowledgeDocument(documentId) {
    const existing = database.getKnowledgeDocument(documentId);
    if (!existing) {
      throw new Error('未找到需要重建索引的知识资产。');
    }

    const sourcePath = String(existing.source_path || '').trim();
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      throw new Error('当前缺少可用于重建索引的本地原始文件，请重新导入该资产后再试。');
    }

    const fileBuffer = fs.readFileSync(sourcePath);
    const knowledgeRuntime = await assertLocalQeeClawKnowledgeReady();
    await deleteFromLocalQeeClawKnowledge(existing.title, {
      ignoreMissing: true,
      baseUrl: knowledgeRuntime.baseUrl,
    });
    await uploadToLocalQeeClawKnowledge({
      filename: existing.title,
      contentType: resolveUploadContentType(existing.mime_type, existing.title),
      fileBuffer,
      baseUrl: knowledgeRuntime.baseUrl,
    });
    return database.reindexKnowledgeDocument(documentId);
  }

  async function deleteKnowledgeDocument(documentId) {
    const existing = database.getKnowledgeDocument(documentId);
    if (!existing) {
      throw new Error('未找到需要删除的知识资产。');
    }

    const knowledgeRuntime = await assertLocalQeeClawKnowledgeReady();
    await deleteFromLocalQeeClawKnowledge(existing.title, {
      ignoreMissing: true,
      baseUrl: knowledgeRuntime.baseUrl,
    });
    return database.deleteKnowledgeDocument(documentId);
  }

  return {
    runtime: {
      getBootstrap,
      saveRuntimeConfig,
      clearRuntimeConfig,
      getHealth: () => database.getRuntimeHealth(),
    },
    workspace: {
      listProfiles: () => database.listWorkspaceProfiles(),
    },
    snapshots: {
      dashboard: () => database.getDashboardSnapshot(),
      search: (query) => database.searchKnowledge(query),
      assets: () => database.getAssetsSnapshot(),
      crm: () => database.getCrmSnapshot(),
      system: () => database.getSystemSnapshot(database.getActiveWorkspaceProfile()),
      writer: () => database.getWriterSnapshot(database.getActiveWorkspaceProfile()),
      methodology: () => database.getMethodologySnapshot(database.getActiveWorkspaceProfile()),
    },
    drafts: {
      list: () => database.listDrafts(),
      get: (id) => database.getDraft(id),
      save: (payload) => database.saveDraft(payload),
    },
    crm: {
      saveCustomer: (payload) => database.saveCustomer(payload),
      saveOpportunity: (payload) => database.saveOpportunity(payload),
    },
    knowledge: {
      saveDocument: (payload) => saveKnowledgeDocument(payload),
      reindexDocument: (documentId) => reindexKnowledgeDocument(documentId),
      deleteDocument: (documentId) => deleteKnowledgeDocument(documentId),
      listChatMessages: (documentId, title) => database.listDocumentChatMessages(documentId, title),
      sendChatMessage: (payload) => database.sendDocumentChatMessage(payload),
    },
    methodology: {
      getProfile: () => database.getMethodologyProfile(),
      saveProfile: (payload) => database.saveMethodologyProfile(payload),
      addCustomFramework: (payload) => database.addCustomFramework(payload),
    },
    ai: {
      listLogs: (scope, limit) => database.listAiExecutionLogs(scope, limit),
      recordLog: (payload) => database.recordAiExecutionLog(payload),
    },
    notifications: {
      list: (limit) => database.listNotificationEvents(limit),
      add: (payload) => database.addNotificationEvent(payload),
      markAllRead: () => database.markAllNotificationEventsRead(),
      clear: () => database.clearNotificationEvents(),
    },
    close: () => database.close(),
  };
}

module.exports = {
  createDesktopServices,
};
