import { canUseBrowserBusinessData } from '../sdk/runtime';

const CRM_STORAGE_KEY = 'qeeshu_ruisi_browser_crm_v1';
const LEGACY_CUSTOMER_IDS = new Set([
  'seed-customer-a',
  'seed-customer-b',
]);
const LEGACY_OPPORTUNITY_IDS = new Set([
  'seed-opp-a1',
  'seed-opp-a2',
  'seed-opp-b1',
]);

function canUseStorage() {
  if (!canUseBrowserBusinessData()) {
    return false;
  }
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const probeKey = '__qeeshu_ruisi_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
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

function createEmptyState() {
  return {
    version: 2,
    customers: [],
    opportunities: [],
    updatedAt: nowIso(),
  };
}

function sanitizeState(rawState) {
  const baseState = rawState && typeof rawState === 'object' ? rawState : {};
  const customers = Array.isArray(baseState.customers)
    ? baseState.customers.filter((item) => item && typeof item === 'object' && !LEGACY_CUSTOMER_IDS.has(String(item.id)))
    : [];
  const validCustomerIds = new Set(customers.map((item) => String(item.id)));
  const opportunities = Array.isArray(baseState.opportunities)
    ? baseState.opportunities.filter((item) => (
      item
      && typeof item === 'object'
      && !LEGACY_OPPORTUNITY_IDS.has(String(item.id))
      && validCustomerIds.has(String(item.customerId))
    ))
    : [];

  return {
    version: 2,
    customers,
    opportunities,
    updatedAt: baseState.updatedAt || nowIso(),
  };
}

function readState() {
  if (!canUseStorage()) {
    return createEmptyState();
  }
  const raw = window.localStorage.getItem(CRM_STORAGE_KEY);
  const parsed = parseJson(raw, null);
  if (!parsed || !Array.isArray(parsed.customers) || !Array.isArray(parsed.opportunities)) {
    const emptyState = createEmptyState();
    writeState(emptyState);
    return emptyState;
  }
  const sanitized = sanitizeState(parsed);
  if (JSON.stringify(sanitized) !== JSON.stringify(parsed)) {
    writeState(sanitized);
  }
  return sanitized;
}

function writeState(state) {
  if (!canUseStorage()) {
    return state;
  }
  window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify({
    ...state,
    updatedAt: nowIso(),
  }));
  return state;
}

function formatShortDate(value) {
  if (!value) {
    return '待排期';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
  }).replace(/\//g, '.');
}

function mapOpportunityStage(stage) {
  if (stage === 'proposal') {
    return '推进中';
  }
  if (stage === 'won') {
    return '已结项';
  }
  if (stage === 'risk') {
    return '需关注';
  }
  return '待跟进';
}

function normalizeId(value, prefix) {
  const raw = String(value || '').trim();
  if (raw) {
    return raw;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildClient(customer, opportunities) {
  const sortedOpportunities = opportunities
    .slice()
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));

  return {
    id: customer.id,
    name: customer.name,
    industry: customer.industry || '待补充',
    projectsCount: sortedOpportunities.length,
    score: Math.round(Number(customer.healthScore || 80)),
    trend: Number(customer.healthScore || 80) >= 85 ? 'up' : Number(customer.healthScore || 80) >= 70 ? 'stable' : 'down',
    status: customer.status || '稳定推进',
    highlight: Number(customer.healthScore || 80) < 70,
    contact: {
      name: customer.owner || '待补充',
      role: customer.contactRole || '关键接口人',
      phone: customer.phone || '待补充',
      email: customer.email || '待补充',
    },
    address: customer.address || '待补充',
    description: customer.description || '待补充客户简介',
    aiDiagnosis: customer.aiDiagnosis || '待补充 AI 诊断摘要',
    projects: sortedOpportunities.slice(0, 3).map((item) => ({
      name: item.title,
      date: item.expectedCloseAt ? `${formatShortDate(item.expectedCloseAt)} 预计` : '待排期',
      status: item.status || mapOpportunityStage(item.stage),
    })),
    assets: Array.isArray(customer.assets) && customer.assets.length > 0
      ? customer.assets
      : [{ name: `${customer.name}_客户摘要.md`, type: 'DOC' }],
  };
}

function buildSnapshotFromState(state, note) {
  const clients = state.customers
    .map((customer) => buildClient(
      customer,
      state.opportunities.filter((item) => String(item.customerId) === String(customer.id)),
    ))
    .sort((left, right) => right.score - left.score);

  return {
    note,
    stats: {
      healthy: clients.filter((item) => item.score >= 80).length,
      renew: clients.filter((item) => item.score >= 70 && item.score < 80).length,
      warning: clients.filter((item) => item.score < 70).length,
    },
    clients,
  };
}

function mergeProjects(baseProjects = [], localProjects = []) {
  const merged = [...localProjects];
  const existingNames = new Set(localProjects.map((item) => item.name));
  baseProjects.forEach((item) => {
    if (!existingNames.has(item.name)) {
      merged.push(item);
    }
  });
  return merged;
}

export function canUseBrowserCrmStorage() {
  return canUseStorage();
}

export function loadBrowserCrmSnapshot(baseSnapshot = null) {
  const state = readState();
  const localSnapshot = buildSnapshotFromState(
    state,
    '当前 CRM 页面使用浏览器本地存储数据，适合纯浏览器开发模式下调试新增客户、编辑资料与商机创建。',
  );

  if (!baseSnapshot) {
    return localSnapshot;
  }

  const localById = new Map(localSnapshot.clients.map((item) => [String(item.id), item]));
  const mergedBaseClients = (baseSnapshot.clients || []).map((item) => {
    const local = localById.get(String(item.id));
    if (!local) {
      return item;
    }
    return {
      ...item,
      ...local,
      projects: mergeProjects(item.projects || [], local.projects || []),
      projectsCount: Math.max(item.projectsCount || 0, local.projectsCount || 0, (mergeProjects(item.projects || [], local.projects || [])).length),
      assets: (local.assets && local.assets.length > 0) ? local.assets : item.assets,
    };
  });

  const existingIds = new Set(mergedBaseClients.map((item) => String(item.id)));
  const appendedClients = localSnapshot.clients.filter((item) => !existingIds.has(String(item.id)));
  const clients = [...mergedBaseClients, ...appendedClients];

  return {
    ...baseSnapshot,
    note: '当前 CRM 页面来自 QeeClaw SDK 结果，并已叠加浏览器本地开发数据。你可以直接在浏览器里新增客户、编辑资料和创建商机。',
    stats: {
      healthy: clients.filter((item) => item.score >= 80).length,
      renew: clients.filter((item) => item.score >= 70 && item.score < 80).length,
      warning: clients.filter((item) => item.score < 70).length,
    },
    clients,
  };
}

export function saveBrowserCrmCustomer(payload) {
  const state = readState();
  const customerId = normalizeId(payload.id, 'browser-customer');
  const timestamp = nowIso();
  const nextCustomer = {
    id: customerId,
    name: String(payload.name || '').trim(),
    industry: payload.industry || '',
    owner: payload.owner || '',
    contactRole: payload.contactRole || '关键接口人',
    status: payload.status || '稳定推进',
    healthScore: Number(payload.healthScore || 80),
    phone: payload.phone || '',
    email: payload.email || '',
    address: payload.address || '',
    description: payload.description || '',
    aiDiagnosis: payload.aiDiagnosis || '',
    assets: Array.isArray(payload.assets) ? payload.assets : undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const existingIndex = state.customers.findIndex((item) => String(item.id) === String(customerId));
  if (existingIndex >= 0) {
    nextCustomer.createdAt = state.customers[existingIndex].createdAt || timestamp;
    state.customers[existingIndex] = {
      ...state.customers[existingIndex],
      ...nextCustomer,
      updatedAt: timestamp,
    };
  } else {
    state.customers.unshift(nextCustomer);
  }

  writeState(state);
  return {
    id: customerId,
    name: nextCustomer.name,
  };
}

export function saveBrowserCrmOpportunity(payload) {
  const state = readState();
  const customerId = normalizeId(payload.customerId, 'browser-customer');
  const customerExists = state.customers.some((item) => String(item.id) === String(customerId));

  if (!customerExists) {
    throw new Error('未找到对应客户，无法创建商机。');
  }

  const opportunityId = normalizeId(payload.id, 'browser-opportunity');
  const timestamp = nowIso();
  const nextOpportunity = {
    id: opportunityId,
    customerId,
    title: String(payload.title || '').trim(),
    stage: payload.stage || 'proposal',
    amount: Number(payload.amount || 0),
    probability: Number(payload.probability || 0),
    owner: payload.owner || '',
    nextAction: payload.nextAction || '',
    expectedCloseAt: payload.expectedCloseAt || '',
    status: payload.status || mapOpportunityStage(payload.stage),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const existingIndex = state.opportunities.findIndex((item) => String(item.id) === String(opportunityId));
  if (existingIndex >= 0) {
    nextOpportunity.createdAt = state.opportunities[existingIndex].createdAt || timestamp;
    state.opportunities[existingIndex] = {
      ...state.opportunities[existingIndex],
      ...nextOpportunity,
      updatedAt: timestamp,
    };
  } else {
    state.opportunities.unshift(nextOpportunity);
  }

  writeState(state);
  return nextOpportunity;
}
