jest.mock('./runtime', () => {
  const models = {
    getRouteProfile: jest.fn(),
    listProviderSummary: jest.fn(),
    getUsage: jest.fn(),
    getCost: jest.fn(),
    getQuota: jest.fn(),
    listRuntimes: jest.fn(),
    invoke: jest.fn(),
  };

  return {
    canUseBrowserBusinessData: jest.fn(() => false),
    getCoreClient: jest.fn(() => ({ models })),
    getProductClient: jest.fn(() => ({})),
    getUserScope: jest.fn(() => 'mine'),
    qeeclawRuntime: {
      hasCredentials: true,
      resolvedMode: 'local',
      runtimeType: 'openclaw',
      baseUrl: 'https://paas.qeeshu.com',
      writerTimeoutMs: 45000,
    },
    resolveKnowledgeScope: jest.fn(),
    resolveTeamContext: jest.fn(),
    shouldUseDesktopBusinessData: jest.fn(() => true),
    __models: models,
  };
});

jest.mock('../desktop/client', () => ({
  addDesktopCustomFramework: jest.fn(),
  getDesktopRuntimeHealth: jest.fn(() => Promise.resolve({
    workspaceLabel: '本地业务数据',
    runtimeStatus: 'ready',
    notes: 'ok',
    baseUrlLabel: 'paas.qeeshu.com',
  })),
  getDesktopDraft: jest.fn(),
  getDesktopMethodologyProfile: jest.fn(),
  listDesktopDrafts: jest.fn(() => Promise.resolve([])),
  listDesktopAiLogs: jest.fn(() => Promise.resolve([])),
  listDesktopKnowledgeChatMessages: jest.fn(() => Promise.resolve([])),
  loadLocalAssetsSnapshot: jest.fn(),
  loadLocalCrmSnapshot: jest.fn(),
  loadLocalDashboardSnapshot: jest.fn(),
  loadLocalMethodologySnapshot: jest.fn(),
  loadLocalSearchSnapshot: jest.fn(),
  loadLocalSystemSnapshot: jest.fn(),
  loadLocalWriterSnapshot: jest.fn(() => Promise.resolve({
    localStats: {
      draftCount: 1,
      writerLogCount: 2,
    },
    recentTasks: [],
  })),
  recordDesktopAiLog: jest.fn(() => Promise.resolve([])),
  saveDesktopMethodologyProfile: jest.fn(),
  saveDesktopCrmCustomer: jest.fn(),
  saveDesktopCrmOpportunity: jest.fn(),
  saveDesktopDraft: jest.fn(),
  saveDesktopKnowledgeDocument: jest.fn(),
  reindexDesktopKnowledgeDocument: jest.fn(),
  deleteDesktopKnowledgeDocument: jest.fn(),
  sendDesktopKnowledgeChatMessage: jest.fn(() => Promise.resolve([])),
}));

const runtimeModule = require('./runtime');
const {
  loadWriterSnapshot,
  generateWriterBlocks,
} = require('./api');

describe('writer sdk api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runtimeModule.shouldUseDesktopBusinessData.mockImplementation(() => true);
    runtimeModule.getCoreClient.mockImplementation(() => ({
      models: runtimeModule.__models,
    }));
    runtimeModule.__models.getUsage.mockResolvedValue({ totalCalls: 0 });
    runtimeModule.__models.getCost.mockResolvedValue({ totalAmount: 0, primaryCurrency: 'CNY' });
    runtimeModule.__models.getQuota.mockResolvedValue({
      currency: 'CNY',
      dailySpent: 0,
      dailyRemaining: 100,
      monthlySpent: 0,
      monthlyRemaining: 1000,
    });
  });

  test('loadWriterSnapshot disables writer generation when no live route is available', async () => {
    runtimeModule.__models.getRouteProfile.mockResolvedValue({
      resolvedModel: '',
      resolvedProviderName: '',
      candidateCount: 0,
      configuredProviderCount: 0,
      availableModelCount: 0,
      resolutionReason: 'no available model',
    });
    runtimeModule.__models.listProviderSummary.mockResolvedValue([]);

    const snapshot = await loadWriterSnapshot();

    expect(snapshot.capabilities).toEqual({
      blockGenerate: false,
      methodologyCheck: false,
      chartGenerate: false,
      imageGenerate: false,
    });
    expect(snapshot.missingApis).toContain('当前尚未检测到可用模型路由，AI 撰写 / 方法论复核 / 图表生成会自动禁用');
  });

  test('generateWriterBlocks falls back to plain text blocks when model output is not json', async () => {
    runtimeModule.__models.listRuntimes.mockResolvedValue([
      {
        runtimeType: 'openclaw',
        onlineTeamCount: 1,
        runtimeLabel: 'OpenClaw',
        runtimeStatus: 'online',
        runtimeStage: 'ready',
      },
    ]);
    runtimeModule.__models.invoke.mockResolvedValue({
      text: '建议先统一客户分层口径，再补充商机推进节奏与责任人机制。',
      model: 'gpt-4.1',
    });

    const result = await generateWriterBlocks({
      commandKey: 'continue',
      draftTitle: '销售方案',
      blocks: [],
      methodologyReview: null,
    });

    expect(result.note).toContain('非 JSON 文本');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('p');
    expect(result.blocks[0].content).toContain('建议先统一客户分层口径');
  });
});
