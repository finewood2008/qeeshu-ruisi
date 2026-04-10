import {
  canUseBrowserBusinessData,
  getCoreClient,
  getProductClient,
  getUserScope,
  qeeclawRuntime,
  resolveKnowledgeScope,
  resolveTeamContext,
  shouldUseDesktopBusinessData,
} from './runtime';
import {
  loadBrowserCrmSnapshot,
  saveBrowserCrmCustomer,
  saveBrowserCrmOpportunity,
} from '../browser-storage/crm';
import {
  addDesktopCustomFramework,
  getDesktopRuntimeHealth,
  getDesktopDraft,
  getDesktopMethodologyProfile,
  listDesktopDrafts,
  listDesktopAiLogs,
  listDesktopKnowledgeChatMessages,
  loadLocalAssetsSnapshot,
  loadLocalCrmSnapshot,
  loadLocalDashboardSnapshot,
  loadLocalMethodologySnapshot,
  loadLocalSearchSnapshot,
  loadLocalSystemSnapshot,
  loadLocalWriterSnapshot,
  recordDesktopAiLog,
  saveDesktopMethodologyProfile,
  saveDesktopCrmCustomer,
  saveDesktopCrmOpportunity,
  saveDesktopDraft,
  saveDesktopKnowledgeDocument,
  reindexDesktopKnowledgeDocument,
  deleteDesktopKnowledgeDocument,
  sendDesktopKnowledgeChatMessage,
} from '../desktop/client';
import { normalizeSdkError } from './error-utils';

const CRM_INDUSTRIES = ['机械制造', '医疗科技', '消费零售', '新能源', '企业服务', '工业软件'];
const CRM_CITIES = ['苏州工业园区', '深圳南山区', '上海徐汇区', '合肥经开区', '杭州滨江区', '广州天河区'];
const DOCUMENT_CHAT_STORAGE_KEY = 'qeeshu_ruisi_document_chat_v1';
const browserDocumentChatMemory = new Map();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value.list)) {
      return value.list;
    }
    if (Array.isArray(value.items)) {
      return value.items;
    }
  }
  return [];
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
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

function formatBytes(bytes) {
  const value = safeNumber(bytes, 0);
  if (value <= 0) {
    return '1.0 MB';
  }
  if (value >= 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${value} B`;
}

function trimTitle(value, fallback) {
  return (value || '').trim() || fallback;
}

function normalizeRuntimeLabel(value) {
  return (value || '').toLowerCase() === 'openclaw' ? 'OpenClaw' : trimTitle(value, 'OpenClaw');
}

function normalizeKnowledgeAssetState(value) {
  const status = String(value || '').trim().toLowerCase();
  if (['indexed', 'completed', 'complete', 'ready', 'done', 'success', 'succeeded'].includes(status)) {
    return 'completed';
  }
  if (['processing', 'indexing', 'running', 'pending_index', 'ingesting', 'uploading'].includes(status)) {
    return 'processing';
  }
  if (['pending', 'queued', 'queueing', 'waiting', 'created'].includes(status)) {
    return 'pending';
  }
  return 'completed';
}

function mapKnowledgeAssetStateLabel(value) {
  const normalized = normalizeKnowledgeAssetState(value);
  if (normalized === 'completed') {
    return '已完成';
  }
  if (normalized === 'processing') {
    return '处理中';
  }
  return '待处理';
}

function inferFileType(name) {
  const value = (name || '').toLowerCase();
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

function createRuntimeId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function canUseWindowStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readStorageJson(key, fallback) {
  if (!canUseWindowStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorageJson(key, value) {
  if (!canUseWindowStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore localStorage write failures and keep in-memory fallback.
  }
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function buildDocumentChatThreadKey(documentId, title) {
  return [
    qeeclawRuntime.baseUrl || 'browser',
    qeeclawRuntime.runtimeType || 'openclaw',
    documentId || '',
    title || '',
  ].join('::');
}

function readBrowserDocumentChatHistory(documentId, title) {
  const threadKey = buildDocumentChatThreadKey(documentId, title);
  const storedMap = readStorageJson(DOCUMENT_CHAT_STORAGE_KEY, {});
  const storedMessages = Array.isArray(storedMap[threadKey]) ? storedMap[threadKey] : null;
  if (storedMessages) {
    browserDocumentChatMemory.set(threadKey, storedMessages);
    return storedMessages;
  }
  return browserDocumentChatMemory.get(threadKey) || [];
}

function saveBrowserDocumentChatHistory(documentId, title, messages) {
  const threadKey = buildDocumentChatThreadKey(documentId, title);
  const nextMessages = Array.isArray(messages) ? messages.slice(-12) : [];
  browserDocumentChatMemory.set(threadKey, nextMessages);
  const storedMap = readStorageJson(DOCUMENT_CHAT_STORAGE_KEY, {});
  storedMap[threadKey] = nextMessages;
  writeStorageJson(DOCUMENT_CHAT_STORAGE_KEY, storedMap);
  return nextMessages;
}

function buildDocumentChatPrompt(payload, history = []) {
  const historyLines = history
    .slice(-6)
    .map((item) => `${item.role === 'user' ? '用户' : '助手'}：${stripMarkdown(item.content)}`)
    .join('\n');
  const insights = Array.isArray(payload?.insights)
    ? payload.insights.map((item) => `- ${stripMarkdown(item)}`).join('\n')
    : '- 暂无';

  return [
    '你是“企数睿思”的资料追问助手，需要基于当前资料生成中文业务回答。',
    '要求：不要编造资料中没有明确出现的具体事实；如果依据不足，要直接说明“基于当前资料摘要，暂时只能给出方向性建议”。',
    `资料标题：${payload?.title || '未命名资料'}`,
    `资料摘要：${stripMarkdown(payload?.summary || '暂无摘要') || '暂无摘要'}`,
    `关键洞察：\n${insights}`,
    historyLines ? `最近对话：\n${historyLines}` : '最近对话：暂无',
    `用户问题：${stripMarkdown(payload?.question || '')}`,
    '请直接输出中文答案，结构如下：',
    '1. 先给一句结论',
    '2. 再给 3-5 条紧扣当前资料的分析或行动建议',
    '3. 若适合，可补一条“下一步建议”',
  ].join('\n\n');
}

function trimPromptContext(value, limit = 3200) {
  const text = stripMarkdown(value || '');
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
}

function serializeWriterBlocks(blocks = []) {
  return blocks
    .slice(0, 24)
    .map((block, index) => {
      if (!block) {
        return '';
      }
      if (block.type === 'list') {
        return `${index + 1}. [list] ${block.items?.map((item) => item.text).join('；') || ''}`;
      }
      if (block.type === 'chart') {
        const rows = Array.isArray(block.data) ? block.data.length : 0;
        return `${index + 1}. [chart] ${block.title || '图表'} / ${block.subtitle || ''} / ${rows} 行数据`;
      }
      if (block.type === 'image') {
        return `${index + 1}. [image] ${block.caption || ''}`;
      }
      return `${index + 1}. [${block.type || 'p'}] ${block.content || ''}`;
    })
    .filter(Boolean)
    .join('\n');
}

function getWriterCommandInstruction(commandKey) {
  switch (commandKey) {
    case 'continue':
      return '请补充 1-2 个可直接插入报告的正文块，聚焦销售诊断、客户经营或项目推进建议。';
    case 'framework':
      return '请补一个结构化分析框架，优先输出 1 个小标题和 1 个包含 4-6 条的列表块。';
    case 'roadmap':
      return '请生成落地路线图，优先覆盖 30/60/90 天阶段动作，可用小标题 + 列表。';
    case 'risk':
      return '请补充风险与保障措施，优先输出 1 个小标题和 1 个包含 4-6 条的列表块。';
    case 'chart':
      return '请输出一个可以直接进报告的图表块，数据必须是结构化数字行。';
    default:
      return '请输出可直接插入当前草稿的结构化内容块。';
  }
}

function buildWriterCommandPrompt({ commandKey, draftTitle, blocks, methodologyReview }) {
  const currentDraft = trimPromptContext(serializeWriterBlocks(blocks), 3600);
  const reviewSummary = methodologyReview?.summary
    ? `AI 方法论复核摘要：${trimPromptContext(methodologyReview.summary, 400)}`
    : '';
  const reviewGaps = Array.isArray(methodologyReview?.gaps) && methodologyReview.gaps.length > 0
    ? `优先缺口：${methodologyReview.gaps.slice(0, 3).map((item) => `${item.label}（建议动作：${item.commandKey}）`).join('；')}`
    : '';

  return [
    '你是“企数睿思”销售驾驶舱里的 AI Writer，需要为中文咨询/销售方案生成结构化内容块。',
    '请只返回 JSON，不要输出 markdown 代码块，不要输出解释。',
    '允许的块类型只有：h3、p、list、chart。',
    'list 块格式：{"type":"list","items":["要点1","要点2"]}',
    'chart 块格式：{"type":"chart","title":"...","subtitle":"...","figCaption":"...","data":[{"month":"阶段1","当前值":70,"目标值":85}]}',
    '除 chart 外，尽量不要输出超过 3 个块。',
    `当前草稿标题：${draftTitle || '未命名草稿'}`,
    currentDraft ? `当前草稿内容：\n${currentDraft}` : '当前草稿内容：暂无，可从空白状态开始补充。',
    reviewSummary || 'AI 方法论复核摘要：暂无',
    reviewGaps || '优先缺口：暂无',
    `当前任务：${getWriterCommandInstruction(commandKey)}`,
    '返回 JSON 结构如下：{"note":"一句话说明这次补充了什么","blocks":[...]}',
  ].join('\n\n');
}

function buildWriterMethodologyPrompt({ draftTitle, blocks }) {
  const currentDraft = trimPromptContext(serializeWriterBlocks(blocks), 3600);
  return [
    '你是“企数睿思”的方法论审查助手，需要对当前中文销售/咨询草稿做结构完整性复核。',
    '请只返回 JSON，不要输出 markdown 代码块。',
    `草稿标题：${draftTitle || '未命名草稿'}`,
    currentDraft ? `草稿内容：\n${currentDraft}` : '草稿内容：暂无',
    '请从“诊断框架、证据支撑、落地路线图、风险保障”四个角度给出复核结果。',
    '返回 JSON 结构如下：{"summary":"...","score":78,"strengths":["..."],"gaps":[{"label":"...","advice":"...","commandKey":"framework|chart|roadmap|risk|continue"}],"nextStep":"..."}',
  ].join('\n\n');
}

function extractJsonPayload(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return value;
  }

  const text = String(value).trim();
  const candidates = [text];
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    candidates.push(fenceMatch[1].trim());
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Continue scanning other candidates.
    }
  }

  return null;
}

function normalizeGeneratedListItems(items, fallbackPrefix = '要点') {
  const source = Array.isArray(items)
    ? items
    : String(items || '')
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);

  return source
    .map((item, index) => ({
      id: createRuntimeId('item'),
      text: trimTitle(typeof item === 'string' ? item : item?.text, `${fallbackPrefix} ${index + 1}`),
      aiGenerated: true,
    }))
    .filter((item) => item.text);
}

function normalizeGeneratedChartData(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  return rows.map((row, index) => {
    const entry = row && typeof row === 'object' ? row : {};
    const label = trimTitle(entry.month || entry.stage || entry.period, `阶段 ${index + 1}`);
    const nextRow = { month: label };
    const numericKeys = Object.keys(entry).filter((key) => !['month', 'stage', 'period'].includes(key));

    numericKeys.forEach((key) => {
      const parsed = Number(entry[key]);
      if (Number.isFinite(parsed)) {
        nextRow[key] = parsed;
      }
    });

    if (Object.keys(nextRow).length === 1) {
      nextRow['当前值'] = 60 + index * 5;
      nextRow['目标值'] = 75 + index * 4;
    }

    return nextRow;
  });
}

function normalizeGeneratedBlock(item, index) {
  const type = String(item?.type || 'p').toLowerCase();

  if (type === 'chart') {
    const data = normalizeGeneratedChartData(item?.data);
    if (data.length === 0) {
      throw new Error('模型没有返回可用的图表数据，请稍后重试或先补充更多上下文。');
    }
    return {
      id: createRuntimeId('chart'),
      type: 'chart',
      title: trimTitle(item?.title, `图表建议 ${index + 1}`),
      subtitle: trimTitle(item?.subtitle, '来自企数睿思 AI Writer 的结构化图表建议'),
      figCaption: trimTitle(item?.figCaption, '图表数据由当前草稿内容推导生成，建议人工复核后再正式交付。'),
      data,
      aiGenerated: true,
    };
  }

  if (type === 'list') {
    const listItems = normalizeGeneratedListItems(item?.items, 'AI 建议');
    if (listItems.length === 0) {
      throw new Error('模型没有返回可用的列表内容，请稍后重试。');
    }
    return {
      id: createRuntimeId('list'),
      type: 'list',
      items: listItems,
      aiGenerated: true,
    };
  }

  if (type === 'h3' || type === 'h2' || type === 'p') {
    const content = trimTitle(item?.content || item?.text || item?.title, '');
    if (!content) {
      throw new Error('模型没有返回可用的正文内容，请稍后重试。');
    }
    return {
      id: createRuntimeId(type),
      type,
      content,
      aiGenerated: true,
    };
  }

  const fallbackContent = trimTitle(item?.content || item?.text || item?.title || item, '');
  if (!fallbackContent) {
    throw new Error('模型没有返回可用内容块，请稍后重试。');
  }
  return {
    id: createRuntimeId('p'),
    type: 'p',
    content: fallbackContent,
    aiGenerated: true,
  };
}

function hasAvailableWriterRoute(routeProfile, providerSummary = []) {
  const resolvedModel = trimTitle(routeProfile?.resolvedModel, '');
  const resolvedProvider = trimTitle(routeProfile?.resolvedProviderName, '');
  const candidateCount = safeNumber(routeProfile?.candidateCount, 0);
  const availableModelCount = safeNumber(routeProfile?.availableModelCount, 0);
  const configuredVisibleProviderCount = normalizeList(providerSummary).filter((item) => (
    Boolean(item?.configured) && safeNumber(item?.visibleCount, 0) > 0
  )).length;

  return Boolean(
    resolvedModel &&
    resolvedProvider &&
    (candidateCount > 0 || availableModelCount > 0 || configuredVisibleProviderCount > 0)
  );
}

function buildWriterCapabilities(routeProfile, providerSummary = []) {
  const enabled = hasAvailableWriterRoute(routeProfile, providerSummary);
  return {
    blockGenerate: enabled,
    methodologyCheck: enabled,
    chartGenerate: enabled,
    imageGenerate: false,
  };
}

function buildWriterMissingApis(routeProfile, providerSummary = []) {
  const items = [];

  if (!hasAvailableWriterRoute(routeProfile, providerSummary)) {
    items.push('当前尚未检测到可用模型路由，AI 撰写 / 方法论复核 / 图表生成会自动禁用');
  }

  items.push(
    'image generate / 智能配图',
    'SSE 流式写作回传',
  );

  return items;
}

function normalizePlainTextWriterBlocks(text, commandKey) {
  const lines = String(text || '')
    .replace(/```(?:json|markdown)?/gi, '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (lines.length === 0 || commandKey === 'chart') {
    return [];
  }

  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length === 0) {
      return;
    }
    blocks.push({
      id: createRuntimeId('list'),
      type: 'list',
      items: normalizeGeneratedListItems(listBuffer, 'AI 建议'),
      aiGenerated: true,
    });
    listBuffer = [];
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^#{1,3}\s*(.+)$/);
    if (headingMatch?.[1]) {
      flushList();
      blocks.push({
        id: createRuntimeId('h3'),
        type: 'h3',
        content: trimTitle(headingMatch[1], 'AI 生成标题'),
        aiGenerated: true,
      });
      return;
    }

    const listMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+[.、]\s+(.+)$/);
    if (listMatch?.[1]) {
      listBuffer.push(listMatch[1]);
      return;
    }

    flushList();
    blocks.push({
      id: createRuntimeId('p'),
      type: 'p',
      content: trimTitle(line, 'AI 生成内容'),
      aiGenerated: true,
    });
  });

  flushList();
  return blocks.slice(0, 3);
}

async function invokePlatformModel(prompt, context) {
  await ensureOpenClawRuntimeOnline();
  const core = (
    context === 'writer-generate' ||
    context === 'writer-methodology-check' ||
    context === 'document-chat'
  )
    ? getCoreClient({ timeoutMs: qeeclawRuntime.writerTimeoutMs })
    : getCoreClient();

  try {
    return await core.models.invoke({ prompt });
  } catch (error) {
    throw normalizeSdkError(error, {
      hasCredentials: qeeclawRuntime.hasCredentials,
      context,
    });
  }
}

function buildSearchInsights(title, query) {
  return [
    `这份资产已经通过 **QeeClaw Knowledge Center** 完成索引，可直接参与“${query}”类问题的语义召回。`,
    `当前结果更适合被纳入 **咨询案例复用** 与 **方法论沉淀** 的双重工作流，而不只是单次检索。`,
    `如果后续需要更强的段落级追问，说明我们需要把 **document chat / SSE** 能力补进 SDK 或 Platform API。`,
  ];
}

function mapKnowledgeItemToSearchResult(item, index, query, workspaceName) {
  const title = trimTitle(item.filename || item.sourceName || item.source_name, `知识资产 ${index + 1}`);
  const type = inferFileType(title);
  const updatedAt = item.updatedAt || item.updated_at || item.createTime || item.create_time;
  const runtimeType = normalizeRuntimeLabel(item.runtimeType || item.runtime_type || qeeclawRuntime.runtimeType);
  const workspaceLabel = trimTitle(
    workspaceName || item.workspaceName || item.workspace_name || item.teamName || item.team_name,
    '当前工作空间',
  );

  return {
    id: `${title}-${index}`,
    title,
    type,
    date: formatShortDate(updatedAt),
    summary: `已在 ${runtimeType} / ${workspaceLabel} 范围完成索引，适合直接复用于咨询案例检索与复盘。`,
    highlight: `...命中资源 ${title}，建议优先用于“${query}”场景下的历史案例对标与框架迁移...`,
    insights: buildSearchInsights(title, query),
  };
}

function mapDocumentToSearchResult(item, index, query) {
  const title = trimTitle(item.documentTitle, `平台文档 ${index + 1}`);
  return {
    id: `${item.id}-${index}`,
    title,
    type: inferFileType(title),
    date: formatShortDate(item.updateTime),
    summary: trimTitle(item.documentDetail, '来自平台文档中心，可作为知识检索的补充来源。'),
    highlight: `...文档标签 ${item.labels || 'platform'} 与“${query}”存在较高关联，适合作为参考样本...`,
    insights: buildSearchInsights(title, query),
  };
}

function buildProjectStatus(priority) {
  if (priority === 'high') {
    return '重点跟进';
  }
  if (priority === 'medium') {
    return '推进中';
  }
  return '待复盘';
}

function buildRecommendation(home) {
  const top = Array.isArray(home?.recommendedKnowledge)
    ? home.recommendedKnowledge.find((item) => item?.type !== 'document')
    : null;
  if (!top) {
    return {
      title: '等待更多真实知识资产进入索引',
      tag: '知识资产',
      description: '当前还没有可用于首页推荐的真实知识资产，已不再展示平台文档示例。',
    };
  }

  return {
    title: top.title,
    tag: '知识资产',
    description: '当前条目来自 Product SDK 返回的推荐结果，可直接跳转到检索页继续查看与复用。',
  };
}

function buildCrmAlert(item, index) {
  const levelText = item.riskLevel === 'critical'
    ? '高风险'
    : item.riskLevel === 'high'
      ? '需关注'
      : item.riskLevel === 'medium'
        ? '中风险'
        : '待跟进';
  return {
    company: item.roomName,
    status: levelText,
    reason: item.reason,
    level: index === 0 ? 'warning' : 'info',
  };
}

function normalizeClientRiskLevel(riskLevel) {
  if (riskLevel === 'critical' || riskLevel === 'high' || riskLevel === 'medium') {
    return riskLevel;
  }
  return 'normal';
}

function mapClientRiskLabel(riskLevel) {
  if (riskLevel === 'critical') {
    return '高风险';
  }
  if (riskLevel === 'high') {
    return '重点跟进';
  }
  if (riskLevel === 'medium') {
    return '需关注';
  }
  return '稳定跟进';
}

function buildClientFromGroup(group, index, board, home) {
  const riskItem = board.highRiskCustomers.find((item) => item.roomId === group.roomId);
  const industry = CRM_INDUSTRIES[index % CRM_INDUSTRIES.length];
  const address = CRM_CITIES[index % CRM_CITIES.length];
  const riskLevel = normalizeClientRiskLevel(riskItem?.riskLevel);
  const riskLabel = mapClientRiskLabel(riskLevel);
  const productHint = home.recommendedKnowledge[index % Math.max(home.recommendedKnowledge.length, 1)];
  const roomOwner = `客户群负责人 ${index + 1}`;
  const status = riskItem?.reason || (riskLevel === 'normal' ? '互动活跃，可推进下一轮诊断' : '需要主动补一次业务触达');

  return {
    id: index + 1,
    name: group.roomName,
    industry,
    projectsCount: clamp(Math.ceil(group.msgCount / 3), 1, 4),
    riskLevel,
    riskLabel,
    status,
    highlight: riskLevel === 'critical' || riskLevel === 'high',
    recentActivity: formatRelativeLabel(group.lastActive),
    contact: {
      name: roomOwner,
      role: '关键接口人',
      phone: `13${index + 6}0-88${index}8-66${index}6`,
      email: `contact${index + 1}@local-workspace`,
    },
    address,
    description: `当前由 QeeClaw 会话中心群组“${group.roomName}”组合生成 CRM 聚合视图，用于在正式 CRM 领域模型接入前查看业务上下文。`,
    aiDiagnosis: `${status}。最近活跃时间：${formatRelativeLabel(group.lastActive)}。建议动作：${riskItem?.reason || home.followUps[index]?.suggestedAction || '整理最近对话纪要，形成下一步行动清单'}。`,
    projects: [
      {
        name: `${group.roomName} 跟进计划`,
        date: `${formatShortDate(group.lastActive)} 更新`,
        status: riskLevel === 'normal' ? '推进中' : '需关注',
      },
      {
        name: 'QeeClaw 销售洞察复盘',
        date: '本周',
        status: '建议执行',
      },
    ],
    assets: [
      {
        name: productHint?.title || '待补充知识资产',
        type: productHint?.type === 'document' ? 'PDF' : 'Knowledge',
      },
    ],
  };
}

export function getRuntimeSnapshot() {
  const baseUrlLabel = qeeclawRuntime.baseUrl
    ? qeeclawRuntime.baseUrl.replace(/^https?:\/\//, '')
    : qeeclawRuntime.resolvedMode === 'local'
      ? 'local-desktop'
      : '未配置';

  return {
    ...qeeclawRuntime,
    runtimeLabel: normalizeRuntimeLabel(qeeclawRuntime.runtimeType),
    sourceLabel: qeeclawRuntime.resolvedMode === 'sdk'
      ? 'QeeClaw SDK'
      : qeeclawRuntime.resolvedMode === 'local'
        ? '本地桌面数据'
        : '未接入模式',
    modeLabel: qeeclawRuntime.resolvedMode === 'sdk'
      ? 'SDK 实时模式'
      : qeeclawRuntime.resolvedMode === 'local'
        ? '本地优先桌面模式'
        : '未接入模式',
    baseUrlLabel,
    workspaceLabel: qeeclawRuntime.hasCredentials
      ? '等待检测本地 QeeClaw'
      : qeeclawRuntime.resolvedMode === 'local'
        ? '本地业务数据'
        : '未配置',
  };
}

function mapRuntimeSummaryToRuntimeState(summary) {
  return {
    runtimeType: summary?.runtimeType || qeeclawRuntime.runtimeType,
    runtimeLabel: summary?.runtimeLabel || normalizeRuntimeLabel(qeeclawRuntime.runtimeType),
    runtimeStatus: summary?.runtimeStatus || 'unknown',
    runtimeStage: summary?.runtimeStage || 'phase_unknown',
    supportsDeviceBridge: Boolean(summary?.supportsDeviceBridge),
    supportsManagedDownload: Boolean(summary?.supportsManagedDownload),
    supportsImRelay: Boolean(summary?.supportsImRelay),
    onlineTeamCount: summary?.onlineTeamCount || 0,
    notes: summary?.notes || '当前未返回 runtime 摘要信息。',
  };
}

async function getOpenClawRuntimeSummary() {
  const core = getCoreClient();

  try {
    const runtimes = await core.models.listRuntimes();
    return runtimes.find((item) => item.runtimeType === qeeclawRuntime.runtimeType) || null;
  } catch (error) {
    throw normalizeSdkError(error, {
      hasCredentials: qeeclawRuntime.hasCredentials,
      context: 'runtime-summary',
    });
  }
}

async function ensureOpenClawRuntimeOnline() {
  const runtimeSummary = await getOpenClawRuntimeSummary();

  if (!runtimeSummary) {
    throw new Error('QeeClaw Platform 未返回 OpenClaw 运行时信息，请确认平台是否已启用 `/api/platform/models/runtimes`。');
  }

  if ((runtimeSummary.onlineTeamCount || 0) <= 0) {
    throw new Error('本地 QeeClaw / OpenClaw 当前未连接到平台。请先启动本地 QeeClaw，再刷新页面重试。');
  }

  return runtimeSummary;
}

async function resolveRuntimeSnapshot() {
  const runtime = getRuntimeSnapshot();
  if (qeeclawRuntime.resolvedMode === 'local') {
    const health = await getDesktopRuntimeHealth();
    return {
      ...runtime,
      workspaceName: health?.workspaceLabel || '本地业务数据',
      workspaceLabel: health?.workspaceLabel || '本地业务数据',
      runtimeStatus: health?.runtimeStatus || 'ready',
      runtimeStage: 'local_desktop',
      runtimeNotes: health?.notes || '当前由 Electron 本地数据层提供运行时状态。',
      baseUrlLabel: health?.baseUrlLabel || runtime.baseUrlLabel,
    };
  }
  if (!qeeclawRuntime.hasCredentials || qeeclawRuntime.resolvedMode !== 'sdk') {
    return runtime;
  }

  const runtimeSummary = await ensureOpenClawRuntimeOnline();

  return {
    ...runtime,
    workspaceName: '本地 QeeClaw 已连接',
    workspaceLabel: '本地 QeeClaw 已连接',
    runtimeStatus: runtimeSummary.runtimeStatus,
    runtimeStage: runtimeSummary.runtimeStage,
    runtimeNotes: runtimeSummary.notes,
  };
}

export async function loadRuntimeSnapshot() {
  return resolveRuntimeSnapshot();
}

export async function loadDashboardSnapshot() {
  if (shouldUseDesktopBusinessData()) {
    return loadLocalDashboardSnapshot();
  }
  await ensureOpenClawRuntimeOnline();
  const product = getProductClient();
  const team = await resolveTeamContext();
  const scope = getUserScope();
  const knowledgeScope = await resolveKnowledgeScope();

  const [home, board, deviceOverview, knowledgeHome] = await Promise.all([
    product.salesCockpit.loadHome(team.teamId, scope),
    product.salesCockpit.loadOpportunityBoard(team.teamId, scope),
    product.deviceCenter.loadOverview(),
    product.knowledgeCenter.loadHome(knowledgeScope),
  ]);

  const recentAssets = normalizeList(knowledgeHome?.assets)
    .slice(0, 3)
    .map((item, index) => ({
      name: trimTitle(item.filename || item.source_name || item.sourceName, `知识资产 ${index + 1}`),
      type: inferFileType(item.filename || item.source_name || item.sourceName),
      date: formatRelativeLabel(item.updatedAt || item.updated_at || item.createTime || item.create_time),
      tag: mapKnowledgeAssetStateLabel(item.status),
    }));

  return {
    statusText: deviceOverview.online > 0 ? '运行良好' : '等待设备上线',
    greeting: '欢迎进入企数睿思工作台',
    subtitle: `当前工作空间「${team.workspaceName}」正在展示真实业务计数、知识资产与风险提醒；首页已不再混入平台文档示例。`,
    healthScore: null,
    cards: [
      {
        title: '近期诊断检索',
        value: String(home.summary.knowledgeHitCount),
        trend: `+${home.summary.knowledgeHitCount}`,
        trendText: '条 SDK 推荐结果',
        type: 'info',
      },
      {
        title: '待处理项目任务',
        value: String(home.summary.pendingFollowUpCount),
        trend: String(home.summary.pendingApprovalCount),
        trendText: '项待审批/待推进',
        type: 'warning',
      },
      {
        title: '经营健康度预警客户',
        value: String(board.highRiskCustomers.length),
        trend: `${home.riskOpportunities.length}`,
        trendText: '个高风险动作待处理',
        type: 'danger',
      },
      {
        title: '设备在线状态',
        value: deviceOverview.online > 0 ? '在线' : '离线',
        trend: `${deviceOverview.online}/${deviceOverview.total} 在线`,
        trendText: 'Product SDK 设备视图',
        type: 'success',
      },
    ],
    projects: home.followUps.slice(0, 3).map((item) => ({
      name: item.roomName,
      client: '会话中心聚合商机',
      status: buildProjectStatus(item.priority),
      dueDate: `最近活跃 ${formatRelativeLabel(item.lastActive)}`,
      aiTip: item.suggestedAction,
      alertType: item.priority === 'high' ? 'warning' : 'success',
    })),
    recentAssets,
    recommendation: buildRecommendation(home),
    crmAlerts: board.highRiskCustomers.slice(0, 2).map(buildCrmAlert),
  };
}

export async function loadSearchSnapshot(query) {
  if (shouldUseDesktopBusinessData()) {
    return loadLocalSearchSnapshot(query);
  }
  await ensureOpenClawRuntimeOnline();
  const core = getCoreClient();
  const product = getProductClient();
  const [knowledgeScope, team] = await Promise.all([
    resolveKnowledgeScope(),
    resolveTeamContext(),
  ]);
  const normalizedQuery = trimTitle(query, '咨询案例');

  const searchResult = await product.knowledgeCenter.search({
    ...knowledgeScope,
    query: normalizedQuery,
    limit: 8,
  });

  const items = normalizeList(searchResult).map((item, index) =>
    mapKnowledgeItemToSearchResult(item, index, normalizedQuery, team.workspaceName),
  );

  if (items.length > 0) {
    return items;
  }

  const documents = await core.file.listDocuments({ limit: 8 });
  return documents.map((item, index) => mapDocumentToSearchResult(item, index, normalizedQuery));
}

export async function loadAssetsSnapshot() {
  if (shouldUseDesktopBusinessData()) {
    return loadLocalAssetsSnapshot();
  }
  const runtimeSummary = await ensureOpenClawRuntimeOnline();
  const product = getProductClient({
    timeoutMs: qeeclawRuntime.knowledgeUploadTimeoutMs,
  });
  const knowledgeScope = await resolveKnowledgeScope();

  const [deviceOverview, runtimeState, knowledgeHome] = await Promise.all([
    product.deviceCenter.loadOverview(),
    Promise.resolve(mapRuntimeSummaryToRuntimeState(runtimeSummary)),
    product.knowledgeCenter.loadHome(knowledgeScope),
  ]);

  const stats = knowledgeHome.stats || {};
  const config = knowledgeHome.config || {};
  const files = normalizeList(knowledgeHome.assets).map((item, index) => {
    const status = normalizeKnowledgeAssetState(item.status);
    return {
      id: item.source_name || item.filename || index,
      name: trimTitle(item.filename || item.source_name, `知识资产 ${index + 1}`),
      type: inferFileType(item.filename || item.source_name).toUpperCase(),
      size: formatBytes(item.size),
      status,
      time: formatRelativeLabel(item.updated_at || item.updatedAt),
    };
  });

  const assetCount = safeNumber(stats.assetCount, files.length);
  const indexedCount = safeNumber(stats.indexedCount, files.filter((item) => item.status === 'completed').length);
  const processingCount = files.filter((item) => item.status === 'processing').length;
  const primaryDevice = deviceOverview.devices[0];

  return {
    title: primaryDevice?.deviceName || `${runtimeState.runtimeLabel} Edge Node`,
    runtimeLabel: runtimeState.runtimeLabel,
    statusLabel: runtimeState.runtimeStatus,
    onlineText: `${deviceOverview.online}/${deviceOverview.total} 在线`,
    watchDir: config.watchDir || '待配置',
    lastSyncAt: formatRelativeLabel(stats.lastSyncAt || config.lastSyncAt),
    assetCount,
    indexedCount,
    processingCount,
    files,
  };
}

export async function loadCrmSnapshot() {
  if (shouldUseDesktopBusinessData()) {
    return loadLocalCrmSnapshot();
  }
  if (!qeeclawRuntime.hasCredentials && canUseBrowserBusinessData()) {
    return loadBrowserCrmSnapshot();
  }
  await ensureOpenClawRuntimeOnline();
  const product = getProductClient();
  const team = await resolveTeamContext();
  const scope = getUserScope();

  const [board, home, conversationHome] = await Promise.all([
    product.salesCockpit.loadOpportunityBoard(team.teamId, scope),
    product.salesCockpit.loadHome(team.teamId, scope),
    product.conversationCenter.loadHome(team.teamId, { groupLimit: 8, historyLimit: 8 }),
  ]);

  const clients = conversationHome.groups.slice(0, 6).map((group, index) =>
    buildClientFromGroup(group, index, board, home),
  );

  const healthy = clients.filter((item) => item.riskLevel === 'normal').length;
  const renew = clients.filter((item) => item.riskLevel === 'medium' || item.riskLevel === 'high').length;
  const warning = clients.filter((item) => item.riskLevel === 'critical').length;

  const baseSnapshot = {
    note: `当前 CRM 页面基于工作空间「${team.workspaceName}」的 conversations + approvals 组合结果生成，是 Product SDK 的客户聚合视图。`,
    stats: {
      healthy,
      renew,
      warning,
    },
    clients,
  };

  if (canUseBrowserBusinessData()) {
    return loadBrowserCrmSnapshot(baseSnapshot);
  }

  return baseSnapshot;
}

export async function loadSystemSnapshot() {
  if (shouldUseDesktopBusinessData()) {
    const localSnapshot = await loadLocalSystemSnapshot();
    if (!qeeclawRuntime.hasCredentials) {
      return localSnapshot;
    }

    const core = getCoreClient();
    const [routeProfile, quota, runtime] = await Promise.all([
      core.models.getRouteProfile(),
      core.models.getQuota(),
      resolveRuntimeSnapshot(),
    ]);

    return {
      ...localSnapshot,
      routeProfile,
      wallet: {
        balance: quota.walletBalance,
        currency: quota.currency,
      },
      quota,
      runtime,
    };
  }
  const core = getCoreClient();

  const [routeProfile, runtimeSummary, quota, runtime] = await Promise.all([
    core.models.getRouteProfile(),
    ensureOpenClawRuntimeOnline(),
    core.models.getQuota(),
    resolveRuntimeSnapshot(),
  ]);

  return {
    routeProfile,
    runtimeState: mapRuntimeSummaryToRuntimeState(runtimeSummary),
    products: [],
    wallet: {
      balance: quota.walletBalance,
      currency: quota.currency,
    },
    quota,
    runtime,
  };
}

export async function loadWriterSnapshot() {
  if (shouldUseDesktopBusinessData()) {
    const localSnapshot = await loadLocalWriterSnapshot();
    if (!qeeclawRuntime.hasCredentials) {
      return localSnapshot;
    }

    const core = getCoreClient();
    const [routeProfile, providerSummary, usage, cost, quota, runtime] = await Promise.all([
      core.models.getRouteProfile(),
      core.models.listProviderSummary(),
      core.models.getUsage({ days: 30 }),
      core.models.getCost({ days: 30 }),
      core.models.getQuota(),
      resolveRuntimeSnapshot(),
    ]);

    return {
      ...localSnapshot,
      routeProfile,
      providerSummary,
      usage,
      cost,
      quota,
      runtime,
      capabilities: buildWriterCapabilities(routeProfile, providerSummary),
      missingApis: buildWriterMissingApis(routeProfile, providerSummary),
    };
  }
  const core = getCoreClient();

  await ensureOpenClawRuntimeOnline();

  const [routeProfile, providerSummary, usage, cost, quota, runtime] = await Promise.all([
    core.models.getRouteProfile(),
    core.models.listProviderSummary(),
    core.models.getUsage({ days: 30 }),
    core.models.getCost({ days: 30 }),
    core.models.getQuota(),
    resolveRuntimeSnapshot(),
  ]);

  return {
    routeProfile,
    providerSummary,
    usage,
    cost,
    quota,
    products: [],
    runtime,
    capabilities: buildWriterCapabilities(routeProfile, providerSummary),
    missingApis: buildWriterMissingApis(routeProfile, providerSummary),
  };
}

export async function loadMethodologySnapshot() {
  if (shouldUseDesktopBusinessData()) {
    return loadLocalMethodologySnapshot();
  }
  const core = getCoreClient();
  const product = getProductClient();
  const knowledgeScope = await resolveKnowledgeScope();
  const runtimeSummary = await ensureOpenClawRuntimeOnline();

  const [routeProfile, providerSummary, knowledgeHome, runtime] = await Promise.all([
    core.models.getRouteProfile(),
    core.models.listProviderSummary(),
    product.knowledgeCenter.loadHome(knowledgeScope),
    resolveRuntimeSnapshot(),
  ]);

  const stats = knowledgeHome.stats || {};
  const config = knowledgeHome.config || {};
  const assets = normalizeList(knowledgeHome.assets);

  return {
    routeProfile,
    providerSummary,
    runtimeState: mapRuntimeSummaryToRuntimeState(runtimeSummary),
    runtime,
    knowledge: {
      assetCount: safeNumber(stats.assetCount, assets.length),
      indexedCount: safeNumber(stats.indexedCount, assets.length),
      watchDir: config.watchDir || '待配置',
      lastSyncAt: stats.lastSyncAt || config.lastSyncAt || null,
    },
    missingApis: [
      'framework registry / methodology plugin catalog',
      '私有方法论文档上传与结构提炼',
      '组织级策略持久化与团队共享',
      '方法论开关与 AI Writer 联动校验',
    ],
  };
}

export async function listWriterDrafts() {
  if (!shouldUseDesktopBusinessData()) {
    return [];
  }
  return listDesktopDrafts();
}

export async function loadWriterDraft(id) {
  if (!shouldUseDesktopBusinessData()) {
    return null;
  }
  return getDesktopDraft(id);
}

export async function persistWriterDraft(payload) {
  if (!shouldUseDesktopBusinessData()) {
    throw new Error('当前仅本地桌面模式支持草稿持久化。');
  }
  return saveDesktopDraft(payload);
}

export async function persistCrmCustomer(payload) {
  if (shouldUseDesktopBusinessData()) {
    return saveDesktopCrmCustomer(payload);
  }
  if (canUseBrowserBusinessData()) {
    return saveBrowserCrmCustomer(payload);
  }
  throw new Error('当前环境不支持本地 CRM 保存。');
}

export async function persistCrmOpportunity(payload) {
  if (shouldUseDesktopBusinessData()) {
    return saveDesktopCrmOpportunity(payload);
  }
  if (canUseBrowserBusinessData()) {
    return saveBrowserCrmOpportunity(payload);
  }
  throw new Error('当前环境不支持本地商机保存。');
}

export async function persistKnowledgeDocument(payload) {
  if (shouldUseDesktopBusinessData()) {
    const file = payload?.file;
    let fileBytes = null;

    if (file && typeof file.arrayBuffer === 'function') {
      fileBytes = new Uint8Array(await file.arrayBuffer());
    }

    return saveDesktopKnowledgeDocument({
      ...payload,
      filename: trimTitle(payload?.filename || payload?.title, ''),
      sourceName: trimTitle(payload?.sourceName || payload?.title, ''),
      fileBytes,
    });
  }

  if (qeeclawRuntime.resolvedMode !== 'sdk') {
    throw new Error('当前模式不支持知识资产上传。');
  }

  const file = payload?.file;
  const filename = trimTitle(payload?.filename || payload?.title, '');

  if (!file) {
    throw new Error('请选择需要上传到知识库的文件。');
  }

  if (!filename) {
    throw new Error('知识文件名不能为空。');
  }

  await ensureOpenClawRuntimeOnline();

  const product = getProductClient();
  const knowledgeScope = await resolveKnowledgeScope();

  try {
    return await product.knowledgeCenter.ingest({
      ...knowledgeScope,
      file,
      filename,
      contentType: payload?.contentType || file?.type || 'application/octet-stream',
      sourceName: trimTitle(payload?.sourceName || payload?.title, filename),
    });
  } catch (error) {
    throw normalizeSdkError(error, {
      hasCredentials: qeeclawRuntime.hasCredentials,
      context: 'knowledge-upload',
      defaultMessage: '知识文件上传失败',
    });
  }
}

export async function reindexKnowledgeDocument(documentId) {
  if (!shouldUseDesktopBusinessData()) {
    throw new Error('当前仅本地桌面模式支持本地知识资产重建索引。');
  }
  return reindexDesktopKnowledgeDocument(documentId);
}

export async function deleteKnowledgeDocument(documentId) {
  if (!shouldUseDesktopBusinessData()) {
    throw new Error('当前仅本地桌面模式支持本地知识资产删除。');
  }
  return deleteDesktopKnowledgeDocument(documentId);
}

export async function listDocumentChatMessages(documentId, title) {
  if (shouldUseDesktopBusinessData()) {
    return listDesktopKnowledgeChatMessages(documentId, title);
  }
  return readBrowserDocumentChatHistory(documentId, title);
}

export async function sendDocumentChatMessage(payload) {
  if (shouldUseDesktopBusinessData()) {
    return sendDesktopKnowledgeChatMessage(payload);
  }

  const question = trimTitle(payload?.question, '');
  if (!question) {
    throw new Error('追问内容不能为空。');
  }

  const history = readBrowserDocumentChatHistory(payload?.documentId, payload?.title);
  const userMessage = {
    id: createRuntimeId('msg'),
    role: 'user',
    content: question,
    createdAt: new Date().toISOString(),
  };

  const result = await invokePlatformModel(
    buildDocumentChatPrompt(payload, [...history, userMessage]),
    'document-chat',
  );

  const assistantReply = trimTitle(result?.text, '');
  if (!assistantReply) {
    throw new Error('模型没有返回可用回答，请稍后重试。');
  }

  const nextHistory = saveBrowserDocumentChatHistory(payload?.documentId, payload?.title, [
    ...history,
    userMessage,
    {
      id: createRuntimeId('msg'),
      role: 'ai',
      content: assistantReply,
      createdAt: new Date().toISOString(),
      model: result?.model || '',
    },
  ]);

  return nextHistory;
}

export async function generateWriterBlocks(payload) {
  if (shouldUseDesktopBusinessData() && !qeeclawRuntime.hasCredentials) {
    throw new Error('当前本地桌面模式尚未配置 API Key，无法调用真实写作能力。');
  }

  const result = await invokePlatformModel(
    buildWriterCommandPrompt(payload),
    'writer-generate',
  );
  const parsed = extractJsonPayload(result?.text);

  if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
    return {
      note: trimTitle(parsed.note, '已根据当前草稿上下文生成新的写作内容。'),
      blocks: parsed.blocks.map(normalizeGeneratedBlock),
      model: result?.model || '',
    };
  }

  const rawText = String(result?.text || '').trim();
  // 放宽对残缺 JSON 的识别：大模型可能因为 max_tokens 被截断，导致没有结尾的 }
  const seemsLikeJson = rawText.startsWith('{') || rawText.startsWith('["') || rawText.includes('```json');

  if (seemsLikeJson && (!parsed || (typeof parsed === 'object' && !Array.isArray(parsed?.blocks)))) {
    throw new Error('模型生成的内容被强行截断，未能输出完整的结构数据，请检查后台大模型接口是否存在 Token 长度限制。');
  }

  const fallbackBlocks = normalizePlainTextWriterBlocks(result?.text, payload?.commandKey);
  if (fallbackBlocks.length > 0) {
    return {
      note: '模型返回了非 JSON 文本，已按纯文本兜底写入当前草稿。',
      blocks: fallbackBlocks,
      model: result?.model || '',
    };
  }

  throw new Error('模型没有返回可解析的结构化内容块，请稍后重试。');
}

export async function runWriterMethodologyCheck(payload) {
  if (shouldUseDesktopBusinessData() && !qeeclawRuntime.hasCredentials) {
    return null;
  }

  const draftText = trimPromptContext(serializeWriterBlocks(payload?.blocks || []), 600);
  if (!draftText) {
    return null;
  }

  const result = await invokePlatformModel(
    buildWriterMethodologyPrompt(payload),
    'writer-methodology-check',
  );
  const parsed = extractJsonPayload(result?.text);

  if (!parsed) {
    const rawText = String(result?.text || '').trim();
    if (!rawText) {
      throw new Error('模型未返回任何响应。可能被前置大模型引擎风控拦截、上下文远超 token 上限，或后台调用崩溃，请稍后重试。');
    }
    
    const seemsLikeJson = rawText.startsWith('{') || rawText.includes('```json');
    if (seemsLikeJson) {
      throw new Error('模型生成的方法论审查结果被强行中断（常见原因为后台接口被配置了极短的 max_tokens，或网络被掐断）。');
    }
    
    throw new Error(`模型未返回结构化审查结果，而是返回了普通文本：${rawText.slice(0, 30)}...`);
  }

  return {
    summary: trimTitle(parsed.summary, '已完成当前草稿的方法论复核。'),
    score: Number.isFinite(Number(parsed.score)) ? Number(parsed.score) : null,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((item) => trimTitle(item, '')).filter(Boolean) : [],
    gaps: Array.isArray(parsed.gaps)
      ? parsed.gaps
        .map((item) => ({
          label: trimTitle(item?.label, ''),
          advice: trimTitle(item?.advice, ''),
          commandKey: trimTitle(item?.commandKey, 'continue'),
        }))
        .filter((item) => item.label)
      : [],
    nextStep: trimTitle(parsed.nextStep, ''),
    model: result?.model || '',
  };
}

export async function getMethodologyProfile() {
  if (!shouldUseDesktopBusinessData()) {
    return null;
  }
  return getDesktopMethodologyProfile();
}

export async function persistMethodologyProfile(payload) {
  if (!shouldUseDesktopBusinessData()) {
    throw new Error('当前仅本地桌面模式支持方法论配置持久化。');
  }
  return saveDesktopMethodologyProfile(payload);
}

export async function createCustomFramework(payload) {
  if (!shouldUseDesktopBusinessData()) {
    throw new Error('当前仅本地桌面模式支持新增机构自有框架。');
  }
  return addDesktopCustomFramework(payload);
}

export async function listAiExecutionLogs(scope, limit = 20) {
  if (!shouldUseDesktopBusinessData()) {
    return [];
  }
  return listDesktopAiLogs(scope, limit);
}

export async function recordAiExecutionLog(payload) {
  if (!shouldUseDesktopBusinessData()) {
    return [];
  }
  return recordDesktopAiLog(payload);
}
