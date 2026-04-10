const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

function nowIso() {
  return new Date().toISOString();
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatRelativeLabel(value) {
  if (!value) {
    return '刚刚';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const diffHours = Math.round((Date.now() - parsed.getTime()) / 3600000);
  if (diffHours <= 1) {
    return '1 小时内';
  }
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} 天前`;
}

function formatShortDate(value) {
  if (!value) {
    return '刚刚';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

function inferFileType(name) {
  const value = String(name || '').toLowerCase();
  if (value.endsWith('.pdf')) {
    return 'pdf';
  }
  if (value.endsWith('.ppt') || value.endsWith('.pptx')) {
    return 'ppt';
  }
  if (value.endsWith('.mp3') || value.endsWith('.wav') || value.endsWith('.m4a')) {
    return 'audio';
  }
  if (value.endsWith('.xls') || value.endsWith('.xlsx') || value.endsWith('.csv')) {
    return 'excel';
  }
  return 'doc';
}

function sanitizeTextPreview(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
}

function readMethodologyTextPreview(sourcePath, sourceType) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return '';
  }
  if (!['doc', 'excel'].includes(sourceType)) {
    return '';
  }
  try {
    const raw = fs.readFileSync(sourcePath, 'utf8');
    return sanitizeTextPreview(raw).slice(0, 1200);
  } catch (error) {
    return '';
  }
}

function inferMethodologyDimensions(text) {
  const source = String(text || '').toLowerCase();
  const catalog = [
    ['战略', ['战略', 'strategy', '增长', '市场']],
    ['组织', ['组织', 'org', '岗位', '协同']],
    ['流程', ['流程', 'process', '运营', '交付']],
    ['数据', ['数据', 'data', '指标', '看板']],
    ['客户', ['客户', 'crm', '销售', '渠道']],
    ['供应链', ['供应链', '采购', '库存', '物流']],
    ['财务', ['财务', '利润', '现金流', '预算']],
    ['风险', ['风险', '内控', '合规', '预警']],
  ];
  const matched = catalog
    .filter(([, keywords]) => keywords.some((keyword) => source.includes(keyword)))
    .map(([label]) => label);
  return matched.length > 0 ? matched.slice(0, 6) : ['战略', '流程', '数据'];
}

function buildMethodologyApplication(dimensions) {
  if (dimensions.includes('客户') || dimensions.includes('供应链')) {
    return '适合销售诊断、客户经营复盘、渠道治理和供应链优化等场景，建议优先用于方案生成前的结构化诊断。';
  }
  if (dimensions.includes('财务') || dimensions.includes('风险')) {
    return '适合经营分析、利润改善和风险治理类项目，建议作为高层汇报和经营驾驶舱分析的底层框架。';
  }
  return '适合作为通用企业诊断框架，用于项目启动、访谈提纲设计、AI Writer 自动补框架等场景。';
}

function buildMethodologyExtract(payload) {
  const sourceName = payload.sourceName || path.basename(payload.sourcePath || payload.title || '');
  const sourcePath = payload.sourcePath || '';
  const sourceType = inferFileType(sourceName || payload.title);
  const exists = sourcePath ? fs.existsSync(sourcePath) : false;
  const fileSize = exists ? fs.statSync(sourcePath).size : Number(payload.fileSize || 0);
  const preview = readMethodologyTextPreview(sourcePath, sourceType);
  const mergedText = `${payload.title || ''} ${payload.desc || ''} ${sourceName || ''} ${preview}`.trim();
  const dimensions = inferMethodologyDimensions(mergedText);
  const extractSummary = preview
    ? `已从本地文件中提炼出 ${dimensions.join(' / ')} 等关键维度，可用于后续 AI Writer 和诊断页的结构化分析。`
    : `已根据文件名与描述推断出 ${dimensions.join(' / ')} 等关键维度，后续可继续补充正文内容做更深提炼。`;

  return {
    sourceName,
    sourcePath,
    sourceType: sourceType.toUpperCase(),
    fileSize,
    preview,
    dimensions,
    extractSummary,
    application: buildMethodologyApplication(dimensions),
  };
}

function mapOpportunityStage(stage) {
  if (stage === 'proposal') {
    return '推进中';
  }
  if (stage === 'won') {
    return '已成交';
  }
  if (stage === 'risk') {
    return '需关注';
  }
  return '待跟进';
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

function buildLocalKnowledgeReply(question, context = {}) {
  const normalizedQuestion = String(question || '').trim();
  const title = context.title || '当前资料';
  const summary = context.summary || '当前资料已进入本地知识库';
  const insights = Array.isArray(context.insights) ? context.insights : [];
  const lead = `基于《${title}》这份本地资产，我先给你一个可直接用于业务推进的回答。`;

  if (normalizedQuestion.includes('风险')) {
    return `${lead}\n\n1. 当前最值得关注的风险点是：${summary}\n2. 如果要做经营复盘，建议把风险拆成“组织协同、流程效率、数据可见性”三条线分别追问。\n3. 下一步可以把这份资料和历史项目记录一起整理成一页风险清单。`;
  }

  if (normalizedQuestion.includes('框架') || normalizedQuestion.includes('模型')) {
    return `${lead}\n\n这份资料最适合抽取的方法论结构包括：\n- 问题诊断框架\n- 关键指标与证据链\n- 可落地的行动拆解\n\n${insights[0] || '建议优先把其中的诊断逻辑整理成标准咨询框架，方便后续复用。'}`;
  }

  if (normalizedQuestion.includes('总结') || normalizedQuestion.includes('摘要')) {
    return `${lead}\n\n一句话摘要：${summary}\n\n建议你把这份资料提炼成三个部分输出：\n- 背景与核心问题\n- 关键洞察与数据证据\n- 下一步行动建议`;
  }

  return `${lead}\n\n围绕你的问题“${normalizedQuestion}”，我建议优先结合这份资料中的核心摘要与关键洞察来组织输出。\n\n摘要参考：${summary}\n\n${insights[0] || '下一步建议继续围绕这份资料做结构化追问。'}`;
}

class RuisiDatabase {
  constructor(dbPath) {
    ensureDir(dbPath);
    this.dbPath = dbPath;
    this.db = new DatabaseSync(dbPath);
    this.initialize();
  }

  initialize() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        theme TEXT NOT NULL DEFAULT 'system',
        language TEXT NOT NULL DEFAULT 'zh-CN',
        default_runtime TEXT NOT NULL DEFAULT 'openclaw',
        default_scope TEXT NOT NULL DEFAULT 'mine',
        auto_launch_qeeclaw INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workspace_profiles (
        id TEXT PRIMARY KEY,
        workspace_name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        runtime_type TEXT NOT NULL DEFAULT 'openclaw',
        scope TEXT NOT NULL DEFAULT 'mine',
        masked_api_key TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_verified_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crm_customers (
        id TEXT PRIMARY KEY,
        external_id TEXT,
        name TEXT NOT NULL,
        industry TEXT,
        owner TEXT,
        status TEXT,
        health_score REAL NOT NULL DEFAULT 80,
        phone TEXT,
        email TEXT,
        address TEXT,
        tags_json TEXT,
        description TEXT,
        ai_diagnosis TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crm_opportunities (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        title TEXT NOT NULL,
        stage TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        probability REAL NOT NULL DEFAULT 0,
        owner TEXT,
        next_action TEXT,
        expected_close_at TEXT,
        status TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS crm_activities (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        opportunity_id TEXT,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        occurred_at TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS conversation_threads (
        id TEXT PRIMARY KEY,
        channel_type TEXT NOT NULL,
        channel_account_id TEXT,
        peer_name TEXT NOT NULL,
        thread_title TEXT NOT NULL,
        last_message_at TEXT,
        summary TEXT,
        unread_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        role TEXT NOT NULL,
        sender_name TEXT,
        content TEXT NOT NULL,
        content_type TEXT NOT NULL DEFAULT 'text',
        attachments_json TEXT,
        sent_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS knowledge_documents (
        id TEXT PRIMARY KEY,
        source_path TEXT,
        title TEXT NOT NULL,
        mime_type TEXT,
        file_size INTEGER NOT NULL DEFAULT 0,
        hash TEXT,
        index_status TEXT NOT NULL DEFAULT 'indexed',
        summary TEXT,
        watch_dir TEXT,
        indexed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS device_states (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        device_name TEXT NOT NULL,
        runtime_status TEXT NOT NULL,
        online INTEGER NOT NULL DEFAULT 0,
        cpu REAL NOT NULL DEFAULT 0,
        memory REAL NOT NULL DEFAULT 0,
        npu REAL NOT NULL DEFAULT 0,
        temperature REAL NOT NULL DEFAULT 0,
        reported_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runtime_health_checks (
        id TEXT PRIMARY KEY,
        check_type TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        details_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content_json TEXT NOT NULL,
        related_customer_id TEXT,
        related_thread_id TEXT,
        saved_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS methodology_profiles (
        id TEXT PRIMARY KEY,
        strategy TEXT NOT NULL DEFAULT 'mixed',
        frameworks_json TEXT NOT NULL,
        custom_frameworks_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ai_execution_logs (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        task_type TEXT NOT NULL,
        target_id TEXT,
        target_name TEXT,
        status TEXT NOT NULL,
        input_json TEXT,
        output_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notification_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        detail TEXT,
        level TEXT NOT NULL DEFAULT 'info',
        read_at TEXT,
        created_at TEXT NOT NULL
      );
    `);

    const settingsExists = this.db.prepare('SELECT id FROM app_settings WHERE id = ?').get('default');
    if (!settingsExists) {
      const timestamp = nowIso();
      this.db.prepare(`
        INSERT INTO app_settings (
          id, theme, language, default_runtime, default_scope, auto_launch_qeeclaw, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('default', 'system', 'zh-CN', 'openclaw', 'mine', 1, timestamp, timestamp);
    }

    const methodologyExists = this.db.prepare('SELECT id FROM methodology_profiles WHERE id = ?').get('default');
    if (!methodologyExists) {
      const timestamp = nowIso();
      this.db.prepare(`
        INSERT INTO methodology_profiles (
          id, strategy, frameworks_json, custom_frameworks_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'default',
        'mixed',
        JSON.stringify({
          mckinsey: false,
          bcg: false,
          porter: false,
          scor: false,
          pestel: false,
          swot: false,
        }),
        JSON.stringify([]),
        timestamp,
        timestamp,
      );
    }

    this.cleanupLegacySeedData();
  }

  seedIfEmpty() {
    return;
  }

  cleanupLegacySeedData() {
    const legacyCustomerIds = ['cust-a-heavy', 'cust-b-med', 'cust-c-retail'];
    const legacyOpportunityIds = ['opp-a-phase2', 'opp-b-channel', 'opp-c-recovery'];
    const legacyThreadIds = ['thread-a', 'thread-b'];
    const legacyDocumentIds = ['doc-cost', 'doc-channel', 'doc-interview'];

    legacyOpportunityIds.forEach((id) => {
      this.db.prepare('DELETE FROM crm_opportunities WHERE id = ?').run(id);
    });
    legacyCustomerIds.forEach((id) => {
      this.db.prepare('DELETE FROM crm_customers WHERE id = ?').run(id);
    });
    legacyThreadIds.forEach((threadId) => {
      this.db.prepare('DELETE FROM conversation_messages WHERE thread_id = ?').run(threadId);
      this.db.prepare('DELETE FROM conversation_threads WHERE id = ?').run(threadId);
    });
    legacyDocumentIds.forEach((id) => {
      this.db.prepare('DELETE FROM knowledge_documents WHERE id = ?').run(id);
    });

    const methodology = this.db.prepare('SELECT frameworks_json, custom_frameworks_json FROM methodology_profiles WHERE id = ?').get('default');
    if (methodology) {
      const frameworks = parseJson(methodology.frameworks_json, {});
      const customFrameworks = parseJson(methodology.custom_frameworks_json, []);
      const cleanedFrameworks = {
        ...frameworks,
        mckinsey: false,
        bcg: false,
        porter: false,
        pestel: false,
        swot: false,
      };
      const cleanedCustomFrameworks = Array.isArray(customFrameworks)
        ? customFrameworks.filter((item) => !['private-1', 'private-2', 'private-3'].includes(item?.id))
        : [];

      this.db.prepare(`
        UPDATE methodology_profiles
        SET frameworks_json = ?, custom_frameworks_json = ?, updated_at = ?
        WHERE id = ?
      `).run(
        JSON.stringify(cleanedFrameworks),
        JSON.stringify(cleanedCustomFrameworks),
        nowIso(),
        'default',
      );
    }

    const hasWorkspaceProfile = Boolean(this.db.prepare('SELECT id FROM workspace_profiles LIMIT 1').get());
    const customerCount = Number(this.db.prepare('SELECT COUNT(*) AS total FROM crm_customers').get().total || 0);
    const documentCount = Number(this.db.prepare('SELECT COUNT(*) AS total FROM knowledge_documents').get().total || 0);

    if (!hasWorkspaceProfile && customerCount === 0 && documentCount === 0) {
      this.db.prepare('DELETE FROM device_states WHERE device_id = ?').run('device-openclaw-local');
      this.db.prepare(`
        DELETE FROM runtime_health_checks
        WHERE message = '当前处于本地业务数据模式，可继续完善桌面化实现。'
          OR message LIKE '本地知识目录%'
          OR message LIKE '本地设备状态%'
      `).run();
    }
  }

  getActiveWorkspaceProfile() {
    return this.db.prepare('SELECT * FROM workspace_profiles WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1').get() || null;
  }

  listWorkspaceProfiles() {
    return this.db.prepare('SELECT * FROM workspace_profiles ORDER BY is_active DESC, updated_at DESC').all();
  }

  upsertActiveWorkspaceProfile(payload) {
    const profileId = payload.id || 'workspace-default';
    const timestamp = nowIso();
    this.db.prepare('UPDATE workspace_profiles SET is_active = 0').run();

    const existing = this.db.prepare('SELECT id FROM workspace_profiles WHERE id = ?').get(profileId);
    if (existing) {
      this.db.prepare(`
        UPDATE workspace_profiles
        SET workspace_name = ?, base_url = ?, runtime_type = ?, scope = ?, masked_api_key = ?, is_active = 1, last_verified_at = ?, updated_at = ?
        WHERE id = ?
      `).run(
        payload.workspaceName || '当前设备工作空间',
        payload.baseUrl,
        payload.runtimeType || 'openclaw',
        payload.scope || 'mine',
        payload.maskedApiKey || null,
        timestamp,
        timestamp,
        profileId,
      );
    } else {
      this.db.prepare(`
        INSERT INTO workspace_profiles (
          id, workspace_name, base_url, runtime_type, scope, masked_api_key, is_active, last_verified_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).run(
        profileId,
        payload.workspaceName || '当前设备工作空间',
        payload.baseUrl,
        payload.runtimeType || 'openclaw',
        payload.scope || 'mine',
        payload.maskedApiKey || null,
        timestamp,
        timestamp,
        timestamp,
      );
    }
    return profileId;
  }

  clearWorkspaceProfiles() {
    this.db.prepare('DELETE FROM workspace_profiles').run();
  }

  recordRuntimeHealth(checkType, status, message, details = {}) {
    this.db.prepare(`
      INSERT INTO runtime_health_checks (
        id, check_type, status, message, details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), checkType, status, message, JSON.stringify(details), nowIso());
  }

  getRuntimeHealth() {
    const latestChecks = this.db.prepare(`
      SELECT check_type, status, message, details_json, created_at
      FROM runtime_health_checks
      ORDER BY created_at DESC
    `).all();
    const latestByType = {};
    latestChecks.forEach((item) => {
      if (!latestByType[item.check_type]) {
        latestByType[item.check_type] = item;
      }
    });

    const activeProfile = this.getActiveWorkspaceProfile();
    const latestDevice = this.db.prepare(`
      SELECT *
      FROM device_states
      ORDER BY reported_at DESC
      LIMIT 1
    `).get();

    const gatewayCheck = latestByType.gateway;
    const gatewayStatus = gatewayCheck?.status || 'unknown';

    return {
      source: 'local',
      runtimeType: activeProfile?.runtime_type || 'openclaw',
      runtimeLabel: 'OpenClaw',
      runtimeStatus: latestDevice?.runtime_status || (gatewayStatus === 'ok' ? 'ready' : 'degraded'),
      workspaceLabel: activeProfile?.workspace_name || '本地业务数据',
      baseUrlLabel: activeProfile?.base_url || '未配置平台地址',
      storageProvider: 'electron-main',
      modeLabel: activeProfile ? '本地优先桌面模式' : '本地业务数据模式',
      sourceLabel: '本地桌面数据',
      online: Boolean(latestDevice?.online),
      deviceName: latestDevice?.device_name || 'QeeClaw Edge Node',
      gatewayStatus,
      notes: gatewayCheck?.message || '当前由 Electron 本地数据库与桌面服务提供运行时状态。',
    };
  }

  getMethodologyProfile() {
    const profile = this.db.prepare('SELECT * FROM methodology_profiles WHERE id = ?').get('default');
    if (!profile) {
      return {
        strategy: 'mixed',
        frameworks: {},
        customFrameworks: [],
      };
    }

    return {
      strategy: profile.strategy || 'mixed',
      frameworks: parseJson(profile.frameworks_json, {}),
      customFrameworks: parseJson(profile.custom_frameworks_json, []),
      updatedAt: profile.updated_at,
    };
  }

  saveMethodologyProfile(payload) {
    const current = this.getMethodologyProfile();
    const timestamp = nowIso();
    const strategy = payload.strategy || current.strategy || 'mixed';
    const frameworks = payload.frameworks || current.frameworks || {};
    const customFrameworks = payload.customFrameworks || current.customFrameworks || [];

    this.db.prepare(`
      UPDATE methodology_profiles
      SET strategy = ?, frameworks_json = ?, custom_frameworks_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      strategy,
      JSON.stringify(frameworks),
      JSON.stringify(customFrameworks),
      timestamp,
      'default',
    );

    return this.getMethodologyProfile();
  }

  addCustomFramework(payload) {
    const current = this.getMethodologyProfile();
    const extract = buildMethodologyExtract(payload);
    const customFramework = {
      id: payload.id || randomUUID(),
      title: payload.title,
      date: payload.date || `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, '0')} 更新`,
      desc: payload.desc || '机构自有方法论',
      enabled: payload.enabled !== false,
      sourceName: extract.sourceName,
      sourcePath: extract.sourcePath,
      sourceType: extract.sourceType,
      fileSize: extract.fileSize,
      dimensions: extract.dimensions,
      extractSummary: extract.extractSummary,
      application: extract.application,
      preview: extract.preview,
    };

    return this.saveMethodologyProfile({
      strategy: current.strategy,
      frameworks: current.frameworks,
      customFrameworks: [customFramework, ...(current.customFrameworks || [])],
    });
  }

  ensureKnowledgeChatThread(documentId, title) {
    const existing = this.db.prepare(`
      SELECT *
      FROM conversation_threads
      WHERE channel_type = ? AND channel_account_id = ?
      LIMIT 1
    `).get('knowledge_chat', documentId);

    if (existing) {
      return existing;
    }

    const timestamp = nowIso();
    const threadId = `knowledge-${documentId}`;
    this.db.prepare(`
      INSERT INTO conversation_threads (
        id, channel_type, channel_account_id, peer_name, thread_title, last_message_at, summary, unread_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      threadId,
      'knowledge_chat',
      documentId,
      title,
      title,
      timestamp,
      '本地知识追问线程',
      0,
      timestamp,
      timestamp,
    );

    return this.db.prepare('SELECT * FROM conversation_threads WHERE id = ?').get(threadId);
  }

  listDocumentChatMessages(documentId, title) {
    const thread = this.ensureKnowledgeChatThread(documentId, title);
    return this.db.prepare(`
      SELECT *
      FROM conversation_messages
      WHERE thread_id = ?
      ORDER BY sent_at ASC, created_at ASC
    `).all(thread.id).map((item) => ({
      id: item.id,
      role: item.role === 'assistant' ? 'ai' : item.role,
      content: item.content,
      createdAt: item.sent_at,
      senderName: item.sender_name,
    }));
  }

  sendDocumentChatMessage(payload) {
    const thread = this.ensureKnowledgeChatThread(payload.documentId, payload.title);
    const timestamp = nowIso();
    const question = String(payload.question || '').trim();
    if (!question) {
      throw new Error('追问内容不能为空。');
    }

    this.db.prepare(`
      INSERT INTO conversation_messages (
        id, thread_id, role, sender_name, content, content_type, attachments_json, sent_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), thread.id, 'user', '当前用户', question, 'text', null, timestamp, timestamp);

    const reply = buildLocalKnowledgeReply(question, {
      title: payload.title,
      summary: payload.summary,
      insights: payload.insights,
    });
    const replyAt = nowIso();
    this.db.prepare(`
      INSERT INTO conversation_messages (
        id, thread_id, role, sender_name, content, content_type, attachments_json, sent_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), thread.id, 'assistant', '企数睿思', reply, 'text', null, replyAt, replyAt);

    this.db.prepare(`
      UPDATE conversation_threads
      SET last_message_at = ?, summary = ?, updated_at = ?
      WHERE id = ?
    `).run(replyAt, question, replyAt, thread.id);

    return this.listDocumentChatMessages(payload.documentId, payload.title);
  }

  recordAiExecutionLog(payload) {
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO ai_execution_logs (
        id, scope, task_type, target_id, target_name, status, input_json, output_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.id || randomUUID(),
      payload.scope,
      payload.taskType,
      payload.targetId || null,
      payload.targetName || null,
      payload.status || 'completed',
      JSON.stringify(payload.input || {}),
      JSON.stringify(payload.output || {}),
      timestamp,
    );
    return this.listAiExecutionLogs(payload.scope, 20);
  }

  listAiExecutionLogs(scope, limit = 20) {
    return this.db.prepare(`
      SELECT *
      FROM ai_execution_logs
      WHERE scope = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(scope, limit).map((item) => ({
      id: item.id,
      scope: item.scope,
      taskType: item.task_type,
      targetId: item.target_id,
      targetName: item.target_name,
      status: item.status,
      input: parseJson(item.input_json, {}),
      output: parseJson(item.output_json, {}),
      createdAt: item.created_at,
    }));
  }

  listNotificationEvents(limit = 100) {
    return this.db.prepare(`
      SELECT *
      FROM notification_events
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit).map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      level: item.level,
      createdAt: item.created_at,
      read: Boolean(item.read_at),
      readAt: item.read_at || null,
    }));
  }

  addNotificationEvent(payload) {
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO notification_events (
        id, title, detail, level, read_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      payload.id || randomUUID(),
      String(payload.title || '').trim() || '系统通知',
      String(payload.detail || '').trim(),
      payload.level || 'info',
      payload.read ? timestamp : null,
      payload.createdAt || timestamp,
    );
    return this.listNotificationEvents();
  }

  markAllNotificationEventsRead() {
    this.db.prepare(`
      UPDATE notification_events
      SET read_at = COALESCE(read_at, ?)
      WHERE read_at IS NULL
    `).run(nowIso());
    return this.listNotificationEvents();
  }

  clearNotificationEvents() {
    this.db.prepare('DELETE FROM notification_events').run();
    return [];
  }

  getDashboardSnapshot() {
    const knowledgeHitCount = this.db.prepare('SELECT COUNT(*) AS total FROM knowledge_documents').get().total;
    const pendingFollowUpCount = this.db.prepare(`SELECT COUNT(*) AS total FROM crm_opportunities WHERE stage != 'won'`).get().total;
    const warningCount = this.db.prepare(`SELECT COUNT(*) AS total FROM crm_customers WHERE health_score < 70`).get().total;
    const latestDevice = this.db.prepare(`SELECT * FROM device_states ORDER BY reported_at DESC LIMIT 1`).get();
    const opportunities = this.db.prepare(`
      SELECT o.*, c.name AS customer_name, c.health_score
      FROM crm_opportunities o
      JOIN crm_customers c ON c.id = o.customer_id
      ORDER BY c.health_score ASC, o.updated_at DESC
      LIMIT 3
    `).all();
    const documents = this.db.prepare(`
      SELECT *
      FROM knowledge_documents
      ORDER BY updated_at DESC
      LIMIT 3
    `).all();
    const highestRisk = this.db.prepare(`
      SELECT name, health_score, status, ai_diagnosis
      FROM crm_customers
      ORDER BY health_score ASC
      LIMIT 2
    `).all();

    return {
      statusText: latestDevice?.online ? '本地数据可用' : '等待本地运行时接入',
      greeting: '欢迎进入本地优先工作台',
      subtitle: '当前页面数据来自 Electron 本地 SQLite 与桌面服务层，后续可逐步替换为真实客户本地业务数据。',
      healthScore: null,
      cards: [
        {
          title: '近期诊断检索',
          value: String(knowledgeHitCount),
          trend: `+${knowledgeHitCount}`,
          trendText: '条本地知识资产',
          type: 'info',
        },
        {
          title: '待处理项目任务',
          value: String(pendingFollowUpCount),
          trend: String(warningCount),
          trendText: '项重点跟进',
          type: 'warning',
        },
        {
          title: '经营健康度预警客户',
          value: String(warningCount),
          trend: `${warningCount}`,
          trendText: '个高风险客户',
          type: 'danger',
        },
        {
          title: '设备在线状态',
          value: latestDevice?.online ? '在线' : '离线',
          trend: latestDevice?.reported_at ? `最近上报 ${formatRelativeLabel(latestDevice.reported_at)}` : '等待写入',
          trendText: '本地设备状态',
          type: 'success',
        },
      ],
      projects: opportunities.map((item, index) => ({
        name: item.title,
        client: item.customer_name,
        status: mapOpportunityStage(item.stage),
        dueDate: `预计成交 ${formatShortDate(item.expected_close_at)}`,
        aiTip: item.next_action || '建议补充下一步动作',
        alertType: index === 0 ? 'warning' : 'success',
      })),
      recentAssets: documents.map((item) => ({
        name: item.title,
        type: inferFileType(item.title),
        date: formatRelativeLabel(item.updated_at),
        tag: item.index_status === 'indexed' ? '已索引' : '处理中',
      })),
      recommendation: documents[0]
        ? {
            title: documents[0].title,
            tag: '本地知识资产',
            description: '当前推荐结果来自本地知识库中的真实已入库资产，可继续用于检索、撰写和客户跟进。',
          }
        : {
            title: '等待导入本地知识资产',
            tag: '本地模式',
            description: '当前尚未发现可推荐文档。',
          },
      crmAlerts: highestRisk.map((item) => ({
        company: item.name,
        status: item.health_score < 70 ? '高风险' : '需关注',
        reason: item.ai_diagnosis,
        level: item.health_score < 70 ? 'warning' : 'info',
      })),
    };
  }

  searchKnowledge(query) {
    const normalizedQuery = String(query || '咨询案例').trim() || '咨询案例';
    const rows = this.db.prepare(`
      SELECT *
      FROM knowledge_documents
      WHERE title LIKE ? OR summary LIKE ?
      ORDER BY updated_at DESC
      LIMIT 8
    `).all(`%${normalizedQuery}%`, `%${normalizedQuery}%`);

    return rows.map((item, index) => ({
      id: item.id,
      title: item.title,
      type: inferFileType(item.title),
      date: formatShortDate(item.updated_at),
      summary: item.summary,
      highlight: `...本地知识库命中《${item.title}》，适合直接服务“${normalizedQuery}”相关问题诊断与方案整理...`,
      insights: [
        `这份资产当前已经进入 **本地知识库**，可以直接参与“${normalizedQuery}”类语义检索。`,
        '当前资料追问记录会写入本地桌面数据库，可继续用于后续检索与写作联动。',
        '后续若补充段落级高亮与引用片段抽取，这里可以继续增强为更细粒度的本地知识诊断。',
      ],
    }));
  }

  getAssetsSnapshot() {
    const latestDevice = this.db.prepare(`SELECT * FROM device_states ORDER BY reported_at DESC LIMIT 1`).get();
    const files = this.db.prepare(`
      SELECT *
      FROM knowledge_documents
      ORDER BY updated_at DESC
    `).all();
    const watchDir = files[0]?.watch_dir || '待配置';

    return {
      title: latestDevice?.device_name || '本地资产库',
      runtimeLabel: 'OpenClaw',
      statusLabel: latestDevice?.runtime_status || 'waiting',
      onlineText: latestDevice ? (latestDevice.online ? '1/1 在线' : '0/1 在线') : '0/0 在线',
      watchDir,
      lastSyncAt: files[0]?.updated_at || latestDevice?.reported_at
        ? formatRelativeLabel(files[0]?.updated_at || latestDevice?.reported_at)
        : '',
      assetCount: files.length,
      indexedCount: files.filter((item) => item.index_status === 'indexed').length,
      processingCount: files.filter((item) => item.index_status === 'processing').length,
      files: files.map((item) => ({
        id: item.id,
        name: item.title,
        type: inferFileType(item.title).toUpperCase(),
        size: item.file_size > 1024 * 1024 ? `${(item.file_size / (1024 * 1024)).toFixed(1)} MB` : `${item.file_size} B`,
        status: item.index_status === 'indexed' ? 'completed' : item.index_status === 'processing' ? 'processing' : 'pending',
        time: formatRelativeLabel(item.updated_at),
        sourcePath: item.source_path || '',
        summary: item.summary || '',
      })),
    };
  }

  saveKnowledgeDocument(payload) {
    const timestamp = nowIso();
    const documentId = payload.id || randomUUID();
    const existing = this.db.prepare('SELECT id FROM knowledge_documents WHERE id = ?').get(documentId);
    const title = String(payload.title || '').trim();

    if (!title) {
      throw new Error('资产名称不能为空。');
    }

    const watchDir = payload.watchDir || '';
    const sourcePath = payload.sourcePath || path.join(watchDir, title);
    const mimeType = payload.mimeType || inferFileType(title);
    const indexStatus = payload.indexStatus || 'indexed';
    const fileSize = Number(payload.fileSize || 0);

    if (existing) {
      this.db.prepare(`
        UPDATE knowledge_documents
        SET source_path = ?, title = ?, mime_type = ?, file_size = ?, hash = ?, index_status = ?, summary = ?, watch_dir = ?, indexed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(
        sourcePath,
        title,
        mimeType,
        fileSize,
        payload.hash || `${documentId}-hash`,
        indexStatus,
        payload.summary || '',
        watchDir,
        indexStatus === 'indexed' ? timestamp : null,
        timestamp,
        documentId,
      );
    } else {
      this.db.prepare(`
        INSERT INTO knowledge_documents (
          id, source_path, title, mime_type, file_size, hash, index_status, summary, watch_dir, indexed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        documentId,
        sourcePath,
        title,
        mimeType,
        fileSize,
        payload.hash || `${documentId}-hash`,
        indexStatus,
        payload.summary || '',
        watchDir,
        indexStatus === 'indexed' ? timestamp : null,
        timestamp,
        timestamp,
      );
    }

    return this.db.prepare('SELECT * FROM knowledge_documents WHERE id = ?').get(documentId);
  }

  getKnowledgeDocument(documentId) {
    return this.db.prepare('SELECT * FROM knowledge_documents WHERE id = ?').get(documentId) || null;
  }

  reindexKnowledgeDocument(documentId) {
    const existing = this.db.prepare('SELECT * FROM knowledge_documents WHERE id = ?').get(documentId);
    if (!existing) {
      throw new Error('未找到需要重建索引的知识资产。');
    }

    const timestamp = nowIso();
    this.db.prepare(`
      UPDATE knowledge_documents
      SET index_status = ?, indexed_at = ?, updated_at = ?
      WHERE id = ?
    `).run('indexed', timestamp, timestamp, documentId);

    this.recordRuntimeHealth(
      'knowledge',
      'ok',
      `已重新索引本地知识资产：${existing.title}`,
      { documentId, title: existing.title },
    );

    return this.db.prepare('SELECT * FROM knowledge_documents WHERE id = ?').get(documentId);
  }

  deleteKnowledgeDocument(documentId) {
    const existing = this.db.prepare('SELECT * FROM knowledge_documents WHERE id = ?').get(documentId);
    if (!existing) {
      throw new Error('未找到需要删除的知识资产。');
    }

    const threads = this.db.prepare(`
      SELECT id
      FROM conversation_threads
      WHERE channel_type = ? AND channel_account_id = ?
    `).all('knowledge_chat', documentId);

    threads.forEach((thread) => {
      this.db.prepare('DELETE FROM conversation_messages WHERE thread_id = ?').run(thread.id);
    });
    this.db.prepare(`
      DELETE FROM conversation_threads
      WHERE channel_type = ? AND channel_account_id = ?
    `).run('knowledge_chat', documentId);
    this.db.prepare('DELETE FROM knowledge_documents WHERE id = ?').run(documentId);

    this.recordRuntimeHealth(
      'knowledge',
      'warn',
      `已删除本地知识资产：${existing.title}`,
      { documentId, title: existing.title },
    );

    return {
      id: documentId,
      title: existing.title,
      deleted: true,
    };
  }

  getCrmSnapshot() {
    const customers = this.db.prepare(`
      SELECT *
      FROM crm_customers
      ORDER BY health_score DESC
    `).all();
    const opportunitiesByCustomer = this.db.prepare(`
      SELECT customer_id, COUNT(*) AS total
      FROM crm_opportunities
      GROUP BY customer_id
    `).all();
    const customerProjectCount = new Map(opportunitiesByCustomer.map((item) => [item.customer_id, item.total]));
    const documents = this.db.prepare(`
      SELECT id, title
      FROM knowledge_documents
      ORDER BY updated_at DESC
    `).all();

    const clients = customers.map((item, index) => ({
      id: item.id,
      name: item.name,
      industry: item.industry,
      projectsCount: customerProjectCount.get(item.id) || 0,
      score: Math.round(item.health_score),
      trend: item.health_score >= 85 ? 'up' : item.health_score >= 70 ? 'stable' : 'down',
      status: item.status,
      highlight: item.health_score < 70,
      contact: {
        name: `联系人 ${index + 1}`,
        role: '关键接口人',
        phone: item.phone || '待补充',
        email: item.email || '待补充',
      },
      address: item.address || '待补充',
      description: item.description,
      aiDiagnosis: item.ai_diagnosis,
      projects: this.db.prepare(`
        SELECT title, expected_close_at, status
        FROM crm_opportunities
        WHERE customer_id = ?
        ORDER BY updated_at DESC
        LIMIT 2
      `).all(item.id).map((opp) => ({
        name: opp.title,
        date: opp.expected_close_at ? `${formatShortDate(opp.expected_close_at)} 预计` : '待排期',
        status: opp.status,
      })),
      assets: documents.slice(0, 2).map((doc) => ({
        name: doc.title,
        type: inferFileType(doc.title).toUpperCase(),
      })),
    }));

    return {
      note: '当前 CRM 页面读取的是本地 SQLite 业务数据；如当前为空，请先在本地新增客户或导入客户资料。',
      stats: {
        healthy: clients.filter((item) => item.score >= 80).length,
        renew: clients.filter((item) => item.score >= 70 && item.score < 80).length,
        warning: clients.filter((item) => item.score < 70).length,
      },
      clients,
    };
  }

  saveCustomer(payload) {
    const timestamp = nowIso();
    const customerId = payload.id || randomUUID();
    const existing = this.db.prepare('SELECT id FROM crm_customers WHERE id = ?').get(customerId);
    const tagsJson = JSON.stringify(Array.isArray(payload.tags) ? payload.tags : []);

    if (existing) {
      this.db.prepare(`
        UPDATE crm_customers
        SET external_id = ?, name = ?, industry = ?, owner = ?, status = ?, health_score = ?, phone = ?, email = ?, address = ?, tags_json = ?, description = ?, ai_diagnosis = ?, updated_at = ?
        WHERE id = ?
      `).run(
        payload.externalId || null,
        payload.name,
        payload.industry || null,
        payload.owner || null,
        payload.status || '稳定推进',
        Number(payload.healthScore || 80),
        payload.phone || null,
        payload.email || null,
        payload.address || null,
        tagsJson,
        payload.description || '',
        payload.aiDiagnosis || '',
        timestamp,
        customerId,
      );
    } else {
      this.db.prepare(`
        INSERT INTO crm_customers (
          id, external_id, name, industry, owner, status, health_score, phone, email, address, tags_json, description, ai_diagnosis, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customerId,
        payload.externalId || null,
        payload.name,
        payload.industry || null,
        payload.owner || null,
        payload.status || '稳定推进',
        Number(payload.healthScore || 80),
        payload.phone || null,
        payload.email || null,
        payload.address || null,
        tagsJson,
        payload.description || '',
        payload.aiDiagnosis || '',
        timestamp,
        timestamp,
      );
    }

    return this.db.prepare('SELECT * FROM crm_customers WHERE id = ?').get(customerId);
  }

  saveOpportunity(payload) {
    const timestamp = nowIso();
    const opportunityId = payload.id || randomUUID();
    const existing = this.db.prepare('SELECT id FROM crm_opportunities WHERE id = ?').get(opportunityId);
    const stage = payload.stage || 'proposal';
    const status = payload.status || mapOpportunityStage(stage);

    if (existing) {
      this.db.prepare(`
        UPDATE crm_opportunities
        SET customer_id = ?, title = ?, stage = ?, amount = ?, probability = ?, owner = ?, next_action = ?, expected_close_at = ?, status = ?, updated_at = ?
        WHERE id = ?
      `).run(
        payload.customerId,
        payload.title,
        stage,
        Number(payload.amount || 0),
        Number(payload.probability || 0),
        payload.owner || null,
        payload.nextAction || null,
        payload.expectedCloseAt || null,
        status,
        timestamp,
        opportunityId,
      );
    } else {
      this.db.prepare(`
        INSERT INTO crm_opportunities (
          id, customer_id, title, stage, amount, probability, owner, next_action, expected_close_at, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        opportunityId,
        payload.customerId,
        payload.title,
        stage,
        Number(payload.amount || 0),
        Number(payload.probability || 0),
        payload.owner || null,
        payload.nextAction || null,
        payload.expectedCloseAt || null,
        status,
        timestamp,
        timestamp,
      );
    }

    return this.db.prepare('SELECT * FROM crm_opportunities WHERE id = ?').get(opportunityId);
  }

  getSystemSnapshot(activeProfile) {
    const runtime = this.getRuntimeHealth();
    const settings = this.db.prepare('SELECT * FROM app_settings WHERE id = ?').get('default');
    const profile = activeProfile || this.getActiveWorkspaceProfile();

    return {
      routeProfile: {
        resolvedModel: '',
        resolvedProviderName: profile ? '待建立平台连接' : '本地模式',
        configuredProviderCount: profile ? 1 : 0,
        availableModelCount: 0,
        resolutionReason: profile ? '当前设备已保存平台接入配置；连接成功后这里才会返回真实模型路由。' : '当前为本地优先模式，尚未连接云端模型路由。',
      },
      runtimeState: {
        runtimeType: runtime.runtimeType,
        runtimeLabel: runtime.runtimeLabel,
        runtimeStatus: runtime.runtimeStatus,
      },
      products: [],
      wallet: {
        balance: 0,
        currency: profile ? 'CNY' : 'LOCAL',
      },
      quota: {
        dailySpent: 0,
        dailyRemaining: 0,
        monthlySpent: 0,
        monthlyRemaining: 0,
        currency: profile ? 'CNY' : 'LOCAL',
        walletBalance: 0,
      },
      runtime: {
        ...runtime,
        scope: settings?.default_scope || 'mine',
        hasStoredConfig: Boolean(profile),
      },
      profile: {
        username: 'local-user',
        role: '桌面本地用户',
        isEnterpriseVerified: Boolean(profile),
        teams: profile ? [{ id: profile.id, name: profile.workspace_name }] : [],
      },
    };
  }

  getWriterSnapshot(activeProfile) {
    const draftCount = this.db.prepare('SELECT COUNT(*) AS total FROM drafts').get().total;
    const base = this.getSystemSnapshot(activeProfile);
    const recentTasks = this.listAiExecutionLogs('writer', 8);
    const writerLogCount = this.db.prepare(`
      SELECT COUNT(*) AS total
      FROM ai_execution_logs
      WHERE scope = ?
    `).get('writer').total;

    return {
      routeProfile: base.routeProfile,
      usage: {
        totalCalls: 0,
        totalInputChars: 0,
        totalOutputChars: 0,
        lastUsedAt: recentTasks[0]?.createdAt || '',
      },
      cost: {
        totalAmount: 0,
        primaryCurrency: base.wallet.currency,
      },
      quota: base.quota,
      providerSummary: [],
      products: [],
      runtime: base.runtime,
      localStats: {
        draftCount,
        writerLogCount,
      },
      recentTasks,
      missingApis: [
        'document chat / SSE 流式问答',
        'block generate / structured generate',
        'methodology check / missing-framework detection',
        '图表数据抽取与配图生成',
      ],
    };
  }

  getMethodologySnapshot(activeProfile) {
    const base = this.getSystemSnapshot(activeProfile);
    const methodology = this.getMethodologyProfile();
    const knowledgeStats = this.db.prepare(`
      SELECT COUNT(*) AS asset_count, SUM(CASE WHEN index_status = 'indexed' THEN 1 ELSE 0 END) AS indexed_count, MAX(updated_at) AS last_sync_at, MAX(watch_dir) AS watch_dir
      FROM knowledge_documents
    `).get();
    return {
      routeProfile: base.routeProfile,
      providerSummary: this.getWriterSnapshot(activeProfile).providerSummary,
      runtimeState: base.runtimeState,
      runtime: base.runtime,
      strategy: methodology.strategy,
      frameworks: methodology.frameworks,
      customFrameworks: methodology.customFrameworks,
      knowledge: {
        assetCount: Number(knowledgeStats.asset_count || 0),
        indexedCount: Number(knowledgeStats.indexed_count || 0),
        watchDir: knowledgeStats.watch_dir || '待配置',
        lastSyncAt: knowledgeStats.last_sync_at || null,
      },
      missingApis: [
        'framework registry / methodology plugin catalog',
        '私有方法论文档上传与结构提炼',
        '组织级策略持久化与团队共享',
        '方法论开关与 AI Writer 联动校验',
      ],
    };
  }

  listDrafts() {
    return this.db.prepare(`
      SELECT *
      FROM drafts
      ORDER BY updated_at DESC
    `).all();
  }

  getDraft(id) {
    return this.db.prepare('SELECT * FROM drafts WHERE id = ?').get(id) || null;
  }

  saveDraft(payload) {
    const timestamp = nowIso();
    const draftId = payload.id || randomUUID();
    const existing = this.getDraft(draftId);
    if (existing) {
      this.db.prepare(`
        UPDATE drafts
        SET type = ?, title = ?, content_json = ?, related_customer_id = ?, related_thread_id = ?, saved_at = ?, updated_at = ?
        WHERE id = ?
      `).run(
        payload.type,
        payload.title,
        JSON.stringify(payload.contentJson || {}),
        payload.relatedCustomerId || null,
        payload.relatedThreadId || null,
        timestamp,
        timestamp,
        draftId,
      );
    } else {
      this.db.prepare(`
        INSERT INTO drafts (
          id, type, title, content_json, related_customer_id, related_thread_id, saved_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        draftId,
        payload.type,
        payload.title,
        JSON.stringify(payload.contentJson || {}),
        payload.relatedCustomerId || null,
        payload.relatedThreadId || null,
        timestamp,
        timestamp,
      );
    }
    return this.getDraft(draftId);
  }

  close() {
    this.db.close();
  }
}

module.exports = {
  RuisiDatabase,
};
