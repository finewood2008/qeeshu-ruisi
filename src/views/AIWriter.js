import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft,
  AlertCircle,
  BarChart3,
  Bold,
  CheckCircle2,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Italic,
  LayoutTemplate,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppShell } from '../AppShellContext';
import { useSdkViewData } from '../hooks/useSdkViewData';
import {
  generateWriterBlocks,
  listWriterDrafts,
  loadWriterDraft,
  loadWriterSnapshot,
  persistWriterDraft,
  recordAiExecutionLog,
  runWriterMethodologyCheck,
} from '../sdk/api';

const emptyWriterSnapshot = {
  routeProfile: {
    resolvedModel: '',
    resolvedProviderName: '',
    candidateCount: 0,
    configuredProviderCount: 0,
    availableModelCount: 0,
    resolutionReason: '',
  },
  usage: {
    totalCalls: 0,
    totalInputChars: 0,
    totalOutputChars: 0,
    lastUsedAt: '',
  },
  cost: {
    totalAmount: 0,
    primaryCurrency: 'CNY',
  },
  quota: {
    dailySpent: 0,
    dailyRemaining: 0,
    monthlySpent: 0,
    monthlyRemaining: 0,
    currency: 'CNY',
  },
  providerSummary: [],
  products: [],
  capabilities: {
    blockGenerate: false,
    methodologyCheck: false,
    chartGenerate: false,
    imageGenerate: false,
  },
  missingApis: [
    'document chat / SSE 流式问答',
    'block generate / structured generate',
    'methodology check / missing-framework detection',
    '图表数据抽取与配图生成',
  ],
};

const commandCatalog = {
  continue: {
    key: 'continue',
    title: '自动续写内容',
    sub: '根据当前诊断上下文生成专业段落',
    accent: 'purple',
    delay: 1100,
  },
  chart: {
    key: 'chart',
    title: '生成数据图表',
    sub: '插入可直接进报告的量化图表',
    accent: 'blue',
    delay: 1300,
  },
  framework: {
    key: 'framework',
    title: '插入标准模型框架',
    sub: '补齐咨询框架，提升方法论完整性',
    accent: 'emerald',
    delay: 1500,
  },
  image: {
    key: 'image',
    title: '智能配图生成',
    sub: '按段落语义插入知识联想配图',
    accent: 'orange',
    delay: 950,
  },
  roadmap: {
    key: 'roadmap',
    title: '生成落地路线图',
    sub: '补齐 30/60/90 天行动拆解',
    accent: 'sky',
    delay: 1250,
  },
  risk: {
    key: 'risk',
    title: '补充风险与保障措施',
    sub: '形成更完整的实施保障段落',
    accent: 'rose',
    delay: 1150,
  },
};

const commandOrder = ['continue', 'chart', 'framework', 'image', 'roadmap', 'risk'];
const WRITER_UI_TIMEOUT_MS = 120000;

function createId(prefix = 'block') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyDraftBlocks() {
  return [
    {
      id: createId('p'),
      type: 'p',
      content: '',
    },
  ];
}

function getBlockAlignmentClass(block) {
  if (block.align === 'center') {
    return 'text-center';
  }
  if (block.align === 'right') {
    return 'text-right';
  }
  return 'text-left';
}

function getBlockTypographyClass(block) {
  return [
    block.bold ? 'font-bold' : '',
    block.italic ? 'italic' : '',
    getBlockAlignmentClass(block),
  ].filter(Boolean).join(' ');
}

function getChartSeries(block) {
  const firstRow = Array.isArray(block?.data) && block.data.length > 0 ? block.data[0] : null;
  if (!firstRow) {
    return ['现有成本', '优化预期'];
  }
  return Object.keys(firstRow).filter((key) => key !== 'month');
}

function normalizeChartRows(rows, series) {
  return rows
    .map((row, index) => {
      const nextRow = { month: String(row.month || '').trim() || `阶段 ${index + 1}` };
      series.forEach((key) => {
        const parsed = Number(row[key]);
        nextRow[key] = Number.isFinite(parsed) ? parsed : 0;
      });
      return nextRow;
    })
    .filter((row) => row.month);
}

function parseDraftContent(contentJson) {
  if (!contentJson) {
    return {};
  }
  if (typeof contentJson === 'string') {
    try {
      return JSON.parse(contentJson);
    } catch (error) {
      return {};
    }
  }
  return typeof contentJson === 'object' ? contentJson : {};
}

function formatClockLabel(value) {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapAuditLogItem(item) {
  return {
    id: item.id,
    commandKey: item.taskType,
    trigger: item.input?.trigger || '本地任务',
    note: item.output?.note || '已记录本地 AI 执行日志。',
    createdAt: formatClockLabel(item.createdAt) || '刚刚',
  };
}

function flattenBlockContent(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'list') {
        return block.items.map((item) => item.text).join(' ');
      }
      return block.content || block.title || block.caption || '';
    })
    .join('\n');
}

function getWriterContextLength(blocks) {
  return flattenBlockContent(blocks).replace(/\s+/g, '').trim().length;
}

function hasMeaningfulWriterContext(blocks) {
  return getWriterContextLength(blocks) >= 12;
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function countBlockType(blocks, type) {
  return blocks.filter((block) => block.type === type).length;
}

function extractBlockText(block) {
  if (!block) {
    return '';
  }
  if (block.type === 'list') {
    return block.items.map((item) => item.text).join('\n');
  }
  return block.content || '';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildWriterMarkdown(title, blocks) {
  const lines = blocks.flatMap((block) => {
    if (block.type === 'h2') {
      return [`## ${block.content}`, ''];
    }
    if (block.type === 'h3') {
      return [`### ${block.content}`, ''];
    }
    if (block.type === 'p') {
      return [block.content, ''];
    }
    if (block.type === 'list') {
      return [...block.items.map((item) => `- ${item.text}`), ''];
    }
    if (block.type === 'chart') {
      return [
        `### [图表] ${block.title}`,
        block.subtitle || '',
        ...(block.data || []).map((row) => JSON.stringify(row)),
        '',
      ];
    }
    if (block.type === 'image') {
      return [`### [配图] ${block.caption}`, block.url || '', ''];
    }
    return [];
  });

  return `# ${title}\n\n${lines.join('\n')}`;
}

function buildWriterHtml(title, blocks) {
  const body = blocks.map((block) => {
    const inlineStyle = [
      block.bold ? 'font-weight:700;' : '',
      block.italic ? 'font-style:italic;' : '',
      block.align ? `text-align:${block.align};` : '',
    ].join('');

    if (block.type === 'h2') {
      return `<h2 style="${inlineStyle}">${escapeHtml(block.content)}</h2>`;
    }
    if (block.type === 'h3') {
      return `<h3 style="${inlineStyle}">${escapeHtml(block.content)}</h3>`;
    }
    if (block.type === 'p') {
      return `<p style="${inlineStyle}">${escapeHtml(block.content)}</p>`;
    }
    if (block.type === 'list') {
      return `<ol style="${inlineStyle}">${block.items.map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')}</ol>`;
    }
    if (block.type === 'chart') {
      const columns = Array.from(new Set((block.data || []).flatMap((row) => Object.keys(row))));
      return `
        <section class="chart-block">
          <div class="chart-head">
            <h3>${escapeHtml(block.title)}</h3>
            <p>${escapeHtml(block.subtitle || '')}</p>
          </div>
          <table>
            <thead>
              <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${(block.data || []).map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <div class="caption">${escapeHtml(block.figCaption || '')}</div>
        </section>
      `;
    }
    if (block.type === 'image') {
      return `
        <figure class="image-block">
          <img src="${escapeHtml(block.url || '')}" alt="${escapeHtml(block.caption || '')}" />
          <figcaption>${escapeHtml(block.caption || '')}</figcaption>
        </figure>
      `;
    }
    return '';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; background: #eef2ff; color: #0f172a; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
    .page { max-width: 920px; margin: 32px auto; background: #ffffff; padding: 56px 64px; box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08); border-radius: 24px; }
    .cover { border-bottom: 2px solid #dbeafe; padding-bottom: 24px; margin-bottom: 32px; }
    .eyebrow { display: inline-block; padding: 6px 12px; background: #dbeafe; color: #1d4ed8; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
    h1 { font-size: 34px; margin: 18px 0 8px; line-height: 1.25; }
    h2 { font-size: 24px; margin: 28px 0 12px; color: #0f172a; }
    h3 { font-size: 18px; margin: 24px 0 10px; color: #1d4ed8; }
    p, li { font-size: 15px; line-height: 1.9; color: #334155; }
    ol { padding-left: 22px; }
    .meta { font-size: 13px; color: #64748b; }
    .chart-block, .image-block { margin: 28px 0; padding: 20px; border: 1px solid #dbeafe; background: #f8fbff; border-radius: 18px; }
    .chart-head p { margin-top: 6px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; background: #ffffff; border-radius: 12px; overflow: hidden; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
    th { background: #eff6ff; color: #1e3a8a; }
    .caption, figcaption { margin-top: 12px; font-size: 12px; color: #64748b; text-align: center; }
    img { width: 100%; border-radius: 12px; object-fit: cover; max-height: 420px; }
  </style>
</head>
<body>
  <main class="page">
    <section class="cover">
      <span class="eyebrow">QeeShu Ruisi Report</span>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">导出时间：${escapeHtml(new Date().toLocaleString('zh-CN'))}</div>
    </section>
    ${body}
  </main>
</body>
</html>`;
}

function buildWriterWordDocument(title, blocks) {
  const html = buildWriterHtml(title, blocks);
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
</head>
<body>
${html.replace(/^[\s\S]*<body>/, '').replace(/<\/body>[\s\S]*$/, '')}
</body>
</html>`;
}

function includesText(blocks, keyword) {
  return flattenBlockContent(blocks).includes(keyword);
}

function buildMethodologyAudit(blocks) {
  const plainText = flattenBlockContent(blocks);
  const hasDiagnosis = plainText.includes('诊断');
  const hasFramework = includesText(blocks, '四象限评估') || includesText(blocks, '框架');
  const hasEvidence = blocks.some((block) => block.type === 'chart');
  const hasRoadmap = plainText.includes('路线图') || plainText.includes('行动拆解') || plainText.includes('阶段一');
  const hasRisk = plainText.includes('风险') || plainText.includes('保障') || plainText.includes('兜底');

  const checklist = [
    {
      key: 'diagnosis',
      label: '核心问题诊断',
      description: '需要先把问题边界、症结与优先级说清楚。',
      done: hasDiagnosis,
      commandKey: 'continue',
    },
    {
      key: 'framework',
      label: '标准咨询框架',
      description: '建议补齐四象限、鱼骨图、价值链等可复用框架。',
      done: hasFramework,
      commandKey: 'framework',
    },
    {
      key: 'evidence',
      label: '量化证据',
      description: '至少补一个图表或基准数据段，增强说服力。',
      done: hasEvidence,
      commandKey: 'chart',
    },
    {
      key: 'roadmap',
      label: '落地路线图',
      description: '需要有可执行的 30/60/90 天动作拆解。',
      done: hasRoadmap,
      commandKey: 'roadmap',
    },
    {
      key: 'risk',
      label: '风险与保障措施',
      description: '交付稿最好有实施风险、保障动作与兜底方案。',
      done: hasRisk,
      commandKey: 'risk',
    },
  ];

  const completed = checklist.filter((item) => item.done).length;
  const missingItems = checklist.filter((item) => !item.done);
  const strengths = checklist.filter((item) => item.done);

  return {
    completed,
    total: checklist.length,
    completionRate: checklist.length > 0 ? Math.round((completed / checklist.length) * 100) : 0,
    checklist,
    missingItems,
    strengths,
    primaryGap: missingItems[0] || null,
  };
}

function buildSuggestedCommands(audit) {
  const missing = audit.missingItems.map((item) => item.commandKey);
  const suggested = [...missing];

  if (suggested.length < 3) {
    ['continue', 'image', 'chart'].forEach((key) => {
      if (!suggested.includes(key)) {
        suggested.push(key);
      }
    });
  }

  return suggested.slice(0, 3).map((key) => commandCatalog[key]);
}

function resolveCommandAvailability(capabilities = {}) {
  return {
    continue: Boolean(capabilities.blockGenerate),
    chart: Boolean(capabilities.chartGenerate),
    framework: Boolean(capabilities.blockGenerate),
    image: Boolean(capabilities.imageGenerate),
    roadmap: Boolean(capabilities.blockGenerate),
    risk: Boolean(capabilities.blockGenerate),
  };
}

function getCommandIcon(commandKey, size = 16) {
  switch (commandKey) {
    case 'continue':
      return <Wand2 size={size} className="text-purple-500" />;
    case 'chart':
      return <BarChart3 size={size} className="text-blue-500" />;
    case 'framework':
      return <LayoutTemplate size={size} className="text-emerald-500" />;
    case 'image':
      return <ImageIcon size={size} className="text-orange-500" />;
    case 'roadmap':
      return <ChevronRight size={size} className="text-sky-500" />;
    case 'risk':
      return <ShieldAlert size={size} className="text-rose-500" />;
    default:
      return <Sparkles size={size} className="text-gray-500" />;
  }
}

function getActivityNote(commandKey) {
  switch (commandKey) {
    case 'framework':
      return '补齐标准咨询框架，完善方法论完整性清单。';
    case 'chart':
      return '插入量化图表，增强报告证据链。';
    case 'roadmap':
      return '将诊断结论转换为分阶段落地动作。';
    case 'risk':
      return '补上实施风险与保障动作，增强交付完整性。';
    case 'image':
      return '按上下文补充知识联想配图。';
    default:
      return '基于当前语境生成补充分析段落。';
  }
}

export default function AIWriter() {
  const {
    confirmSensitiveAction,
    consumePendingWriterImport,
    pushNotificationEvent,
    pushToast,
  } = useAppShell();
  const loader = useCallback(() => loadWriterSnapshot(), []);
  const {
    data: writerData,
    source: writerSource,
  } = useSdkViewData(loader);
  const writerSnapshot = writerData || emptyWriterSnapshot;
  const isLocalDraftMode = writerSource === 'local';
  const commandAvailability = useMemo(
    () => resolveCommandAvailability(writerSnapshot.capabilities),
    [writerSnapshot.capabilities],
  );
  const aiGenerationReady = Object.values(commandAvailability).some(Boolean);
  const methodologyCheckReady = Boolean(writerSnapshot.capabilities?.methodologyCheck);

  const [draftTitle, setDraftTitle] = useState('新的销售方案草稿');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [blocks, setBlocks] = useState(() => createEmptyDraftBlocks());
  const writerContextReady = useMemo(() => hasMeaningfulWriterContext(blocks), [blocks]);
  const [selectedBlockId, setSelectedBlockId] = useState(() => createEmptyDraftBlocks()[0]?.id || '');
  const [actionMenuBlockId, setActionMenuBlockId] = useState('');
  const [chartEditorBlockId, setChartEditorBlockId] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [quickInsertText, setQuickInsertText] = useState('');
  const [pendingCommand, setPendingCommand] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [writerAuditLogs, setWriterAuditLogs] = useState([]);
  const [remoteMethodologyReview, setRemoteMethodologyReview] = useState(null);
  const [methodologyReviewState, setMethodologyReviewState] = useState({
    loading: false,
    error: '',
  });
  const [draftSaveState, setDraftSaveState] = useState({
    status: 'idle',
    message: '',
    savedAt: '',
  });
  const [activityLog, setActivityLog] = useState([]);

  const slashMenuRef = useRef(null);

  const methodologyAudit = useMemo(() => buildMethodologyAudit(blocks), [blocks]);
  const suggestedCommands = useMemo(() => buildSuggestedCommands(methodologyAudit), [methodologyAudit]);
  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) || null,
    [blocks, selectedBlockId],
  );
  const editingChartBlock = useMemo(
    () => blocks.find((block) => block.id === chartEditorBlockId && block.type === 'chart') || null,
    [blocks, chartEditorBlockId],
  );

  useEffect(() => {
    if (Array.isArray(writerSnapshot.recentTasks) && writerSnapshot.recentTasks.length > 0) {
      setWriterAuditLogs(writerSnapshot.recentTasks.map(mapAuditLogItem));
    }
  }, [writerSnapshot.recentTasks]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (slashMenuRef.current && !slashMenuRef.current.contains(event.target)) {
        setShowSlashMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const primaryReviewGap = useMemo(() => {
    const remoteGap = Array.isArray(remoteMethodologyReview?.gaps)
      ? remoteMethodologyReview.gaps.find((item) => commandAvailability[item.commandKey])
      : null;
    return remoteGap || methodologyAudit.primaryGap || null;
  }, [commandAvailability, methodologyAudit.primaryGap, remoteMethodologyReview?.gaps]);

  useEffect(() => {
    if (!methodologyCheckReady) {
      setRemoteMethodologyReview(null);
      setMethodologyReviewState({
        loading: false,
        error: '',
      });
      return undefined;
    }

    const draftText = flattenBlockContent(blocks).trim();
    if (!draftText || !hasMeaningfulWriterContext(blocks)) {
      setRemoteMethodologyReview(null);
      setMethodologyReviewState({
        loading: false,
        error: '',
      });
      return undefined;
    }

    let cancelled = false;
    const timerId = window.setTimeout(async () => {
      setMethodologyReviewState({
        loading: true,
        error: '',
      });
      try {
        const review = await withTimeout(
          runWriterMethodologyCheck({
            draftTitle,
            blocks,
          }),
          WRITER_UI_TIMEOUT_MS,
          'AI 方法论复核超时。请先补充更完整的正文，或稍后重试。',
        );
        if (cancelled) {
          return;
        }
        setRemoteMethodologyReview(review);
        setMethodologyReviewState({
          loading: false,
          error: '',
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setMethodologyReviewState({
          loading: false,
          error: error.message || '方法论复核失败。',
        });
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [blocks, draftTitle, methodologyCheckReady]);

  const refreshDrafts = useCallback(async (preferredDraftId) => {
    if (!isLocalDraftMode) {
      return;
    }

    const drafts = await listWriterDrafts();
    const writerDrafts = drafts.filter((item) => item.type === 'writer');
    setRecentDrafts(writerDrafts);

    const targetDraftId = preferredDraftId || selectedDraftId || writerDrafts[0]?.id;
    if (!targetDraftId) {
      return;
    }

    const draft = await loadWriterDraft(targetDraftId);
    if (!draft) {
      return;
    }

    const content = parseDraftContent(draft.content_json);
    setSelectedDraftId(draft.id);
    setDraftTitle(draft.title || '未命名草稿');
    const restoredBlocks = Array.isArray(content.blocks) && content.blocks.length > 0 ? content.blocks : createEmptyDraftBlocks();
    setBlocks(restoredBlocks);
    setSelectedBlockId(restoredBlocks[0]?.id || '');
    setActivityLog(Array.isArray(content.activityLog) ? content.activityLog : []);
    setDraftSaveState({
      status: 'saved',
      message: '已从本地桌面草稿恢复',
      savedAt: draft.updated_at || draft.saved_at || '',
    });
  }, [isLocalDraftMode, selectedDraftId]);

  useEffect(() => {
    refreshDrafts().catch((error) => {
      setDraftSaveState({
        status: 'error',
        message: error.message || '加载本地草稿失败。',
        savedAt: '',
      });
    });
  }, [refreshDrafts]);

  useEffect(() => {
    const importRequest = consumePendingWriterImport();
    if (!importRequest?.title) {
      return;
    }
    const nextBlocks = [
      {
        id: createId('h3'),
        type: 'h3',
        content: `引用资料：${importRequest.title}`,
      },
      {
        id: createId('p'),
        type: 'p',
        content: `${importRequest.summary || '已从知识检索页导入资料摘要。'} ${importRequest.highlight || ''}`.trim(),
      },
    ];
    setBlocks((current) => ([
      ...current,
      ...nextBlocks,
    ]));
    setSelectedBlockId(nextBlocks[0].id);
    setActivityLog((current) => [
      {
        id: createId('log'),
        commandKey: 'continue',
        trigger: 'Search 联动导入',
        note: `已从检索页导入《${importRequest.title}》到当前草稿。`,
        createdAt: '刚刚',
      },
      ...current,
    ].slice(0, 6));
    pushNotificationEvent(
      `已导入资料「${importRequest.title}」`,
      '检索结果已插入当前写作草稿，可继续润色、补图表或导出报告。',
      'success',
    );
    pushToast(`已导入资料「${importRequest.title}」`, 'success', { recordEvent: false });
  }, [consumePendingWriterImport, pushNotificationEvent, pushToast]);

  const runAiCommand = useCallback(async (commandKey, trigger = 'Slash Menu') => {
    if (!commandCatalog[commandKey] || pendingCommand) {
      return;
    }

    const config = commandCatalog[commandKey];
    if (!writerContextReady) {
      const message = '请先输入一段业务正文，或从 CRM / 检索页导入资料后，再使用 AI 自动补齐。';
      pushNotificationEvent(
        `暂无法执行「${config.title}」`,
        message,
        'info',
      );
      pushToast(message, 'warning', { recordEvent: false });
      return;
    }

    if (!commandAvailability[commandKey]) {
      const note = `已记录「${config.title}」请求，但当前尚未接入真实自动写作接口，因此不会插入模拟内容。`;
      setActivityLog((current) => [
        {
          id: createId('log'),
          commandKey,
          trigger,
          note,
          createdAt: '刚刚',
        },
        ...current,
      ].slice(0, 6));
      if (isLocalDraftMode) {
        recordAiExecutionLog({
          scope: 'writer',
          taskType: commandKey,
          targetId: selectedDraftId || null,
          targetName: draftTitle || '未命名草稿',
          status: 'pending',
          input: {
            trigger,
            commandTitle: config.title,
          },
          output: {
            note,
          },
        }).then((logs) => {
          if (Array.isArray(logs)) {
            setWriterAuditLogs(logs.map(mapAuditLogItem));
          }
        }).catch(() => {
          // 本地审计记录失败时不阻断正文编辑
        });
      }
      pushNotificationEvent(
        `AI 能力未开放：${config.title}`,
        '当前版本不会再生成前端模拟正文，请手工编辑、从检索页导入资料，或使用已经开放的真实生成能力。',
        'warning',
      );
      pushToast(`当前未开放「${config.title}」真实生成能力`, 'warning', { recordEvent: false });
      return;
    }

    setShowSlashMenu(false);
    setPendingCommand(commandKey);

    try {
      const generated = await withTimeout(
        generateWriterBlocks({
          commandKey,
          draftTitle,
          blocks,
          methodologyReview: remoteMethodologyReview,
        }),
        WRITER_UI_TIMEOUT_MS,
        'AI 写作执行超时。请先补充更多上下文，或稍后重试。',
      );
      const nextBlocks = Array.isArray(generated?.blocks) ? generated.blocks : [];
      if (nextBlocks.length === 0) {
        throw new Error('模型没有返回可插入的内容块。');
      }

      setBlocks((current) => [...current, ...nextBlocks]);
      setSelectedBlockId(nextBlocks[0]?.id || selectedBlockId);
      setActivityLog((current) => [
        {
          id: createId('log'),
          commandKey,
          trigger,
          note: generated.note || getActivityNote(commandKey),
          createdAt: '刚刚',
        },
        ...current,
      ].slice(0, 6));
      if (isLocalDraftMode) {
        recordAiExecutionLog({
          scope: 'writer',
          taskType: commandKey,
          targetId: selectedDraftId || null,
          targetName: draftTitle || '未命名草稿',
          status: 'completed',
          input: {
            trigger,
            commandTitle: config.title,
          },
          output: {
            note: generated.note || getActivityNote(commandKey),
          },
        }).then((logs) => {
          if (Array.isArray(logs)) {
            setWriterAuditLogs(logs.map(mapAuditLogItem));
          }
        }).catch(() => {
          // 本地审计记录失败时不阻断正文编辑
        });
      }
      pushNotificationEvent(
        `AI 已完成「${config.title}」`,
        `触发来源：${trigger}，已插入 ${nextBlocks.length} 个真实生成内容块。`,
        'success',
      );
    } catch (error) {
      if (isLocalDraftMode) {
        recordAiExecutionLog({
          scope: 'writer',
          taskType: commandKey,
          targetId: selectedDraftId || null,
          targetName: draftTitle || '未命名草稿',
          status: 'failed',
          input: {
            trigger,
            commandTitle: config.title,
          },
          output: {
            note: error.message || '真实生成失败。',
          },
        }).then((logs) => {
          if (Array.isArray(logs)) {
            setWriterAuditLogs(logs.map(mapAuditLogItem));
          }
        }).catch(() => {
          // Ignore audit failures.
        });
      }
      pushNotificationEvent(
        `AI 执行失败：${config.title}`,
        error.message || '真实写作接口执行失败，请稍后重试。',
        'warning',
      );
      pushToast(error.message || '真实写作接口执行失败', 'warning', { recordEvent: false });
    } finally {
      setPendingCommand('');
    }
  }, [blocks, commandAvailability, draftTitle, isLocalDraftMode, pendingCommand, pushNotificationEvent, pushToast, remoteMethodologyReview, selectedBlockId, selectedDraftId, writerContextReady]);

  const handlePrimaryAuditAction = () => {
    if (primaryReviewGap) {
      runAiCommand(primaryReviewGap.commandKey, '方法论审查');
      return;
    }
    runAiCommand('continue', '方法论审查');
  };

  const handleSaveDraft = useCallback(async () => {
    if (!isLocalDraftMode) {
      setDraftSaveState({
        status: 'idle',
        message: '当前仅本地桌面模式支持草稿持久化。',
        savedAt: '',
      });
      return;
    }

    try {
      setDraftSaveState({
        status: 'saving',
        message: '正在保存到本地桌面数据库...',
        savedAt: '',
      });
      const saved = await persistWriterDraft({
        id: selectedDraftId || undefined,
        type: 'writer',
        title: draftTitle || '未命名草稿',
        contentJson: {
          blocks,
          activityLog,
        },
      });
      setSelectedDraftId(saved.id);
      await refreshDrafts(saved.id);
      setDraftSaveState({
        status: 'saved',
        message: '草稿已保存到本地桌面数据库',
        savedAt: saved.updated_at || saved.saved_at || new Date().toISOString(),
      });
      pushNotificationEvent(
        `草稿「${draftTitle || '未命名草稿'}」已保存`,
        '当前内容已经写入本地桌面数据库，可在本地草稿箱继续回读。',
        'success',
      );
    } catch (error) {
      setDraftSaveState({
        status: 'error',
        message: error.message || '保存草稿失败。',
        savedAt: '',
      });
    }
  }, [activityLog, blocks, draftTitle, isLocalDraftMode, pushNotificationEvent, refreshDrafts, selectedDraftId]);

  const handleCreateDraft = useCallback(async () => {
    const hasMeaningfulContent = blocks.length > 1 || blocks.some((block) => extractBlockText(block)?.trim());
    if (hasMeaningfulContent) {
      const confirmed = await confirmSensitiveAction({
        title: '确认新建草稿并重置当前编辑区？',
        description: '这会保留已保存草稿，但当前编辑区会切换到新的本地草稿模板。',
        confirmLabel: '确认新建',
        tone: 'primary',
      });
      if (!confirmed) {
        return;
      }
    }

    setSelectedDraftId('');
    setDraftTitle('新的销售方案草稿');
    const nextBlocks = createEmptyDraftBlocks();
    setBlocks(nextBlocks);
    setSelectedBlockId(nextBlocks[0]?.id || '');
    setActionMenuBlockId('');
    setChartEditorBlockId('');
    setQuickInsertText('');
    setActivityLog([]);
    setDraftSaveState({
      status: 'idle',
      message: '已创建空白草稿，请从 CRM / 知识检索导入内容，或直接开始撰写。',
      savedAt: '',
    });
    pushNotificationEvent(
      '已创建新的本地草稿',
      '当前编辑区已重置为新的销售方案模板，可继续插入正文、图表与方法论块。',
      'info',
    );
  }, [blocks, confirmSensitiveAction, pushNotificationEvent]);

  const updateBlockById = useCallback((blockId, updater) => {
    setBlocks((current) => current.map((block) => (
      block.id === blockId ? updater(block) : block
    )));
  }, []);

  const updateSelectedBlock = useCallback((updater) => {
    if (!selectedBlockId) {
      return;
    }
    updateBlockById(selectedBlockId, updater);
  }, [selectedBlockId, updateBlockById]);

  const handleBlockTextBlur = useCallback((blockId, event) => {
    const nextValue = event.currentTarget.textContent || '';
    updateBlockById(blockId, (block) => ({
      ...block,
      content: nextValue.trim() || block.content,
    }));
  }, [updateBlockById]);

  const handleListItemBlur = useCallback((blockId, itemId, event) => {
    const nextValue = event.currentTarget.textContent || '';
    updateBlockById(blockId, (block) => ({
      ...block,
      items: block.items.map((item) => (
        item.id === itemId
          ? { ...item, text: nextValue.trim() || item.text }
          : item
      )),
    }));
  }, [updateBlockById]);

  const handleToggleTextStyle = useCallback((key) => {
    updateSelectedBlock((block) => ({
      ...block,
      [key]: !block[key],
    }));
  }, [updateSelectedBlock]);

  const handleCycleAlignment = useCallback(() => {
    updateSelectedBlock((block) => {
      const order = ['left', 'center', 'right'];
      const currentIndex = order.indexOf(block.align || 'left');
      return {
        ...block,
        align: order[(currentIndex + 1) % order.length],
      };
    });
  }, [updateSelectedBlock]);

  const handleChangeBlockType = useCallback((nextType) => {
    if (!selectedBlockId) {
      return;
    }

    updateBlockById(selectedBlockId, (block) => {
      if (nextType === 'list') {
        if (block.type === 'list') {
          return block;
        }
        return {
          ...block,
          type: 'list',
          items: [{ id: createId('item'), text: extractBlockText(block) || '新的要点' }],
        };
      }

      if (block.type === 'list') {
        return {
          ...block,
          type: nextType,
          content: extractBlockText(block),
        };
      }

      return {
        ...block,
        type: nextType,
      };
    });
  }, [selectedBlockId, updateBlockById]);

  const handleDuplicateBlock = useCallback((blockId) => {
    setBlocks((current) => {
      const index = current.findIndex((item) => item.id === blockId);
      if (index === -1) {
        return current;
      }
      const source = current[index];
      const duplicate = {
        ...source,
        id: createId(source.type || 'block'),
        items: Array.isArray(source.items)
          ? source.items.map((item) => ({ ...item, id: createId('item') }))
          : source.items,
      };
      const next = [...current];
      next.splice(index + 1, 0, duplicate);
      setSelectedBlockId(duplicate.id);
      return next;
    });
    setActionMenuBlockId('');
    pushToast('已复制当前内容块', 'success');
  }, [pushToast]);

  const handleRemoveBlock = useCallback(async (blockId) => {
    const targetBlock = blocks.find((item) => item.id === blockId);
    const confirmed = await confirmSensitiveAction({
      title: '确认删除当前内容块？',
      description: `即将删除${targetBlock?.type === 'chart' ? '图表' : '正文'}块，此操作会影响当前草稿内容结构。`,
      confirmLabel: '确认删除',
    });
    if (!confirmed) {
      return;
    }

    setBlocks((current) => {
      if (current.length <= 1) {
        return current;
      }
      const index = current.findIndex((item) => item.id === blockId);
      if (index === -1) {
        return current;
      }
      const next = current.filter((item) => item.id !== blockId);
      setSelectedBlockId(next[Math.max(0, index - 1)]?.id || next[0]?.id || '');
      return next;
    });
    setActionMenuBlockId('');
    pushNotificationEvent(
      '已删除写作内容块',
      `已从当前草稿移除${targetBlock?.type === 'chart' ? '图表块' : '正文块'}。`,
      'warning',
    );
    pushToast('已删除当前内容块', 'info', { recordEvent: false });
  }, [blocks, confirmSensitiveAction, pushNotificationEvent, pushToast]);

  const handleQuickInsert = useCallback(() => {
    const text = quickInsertText.trim();
    const nextBlock = {
      id: createId('p'),
      type: 'p',
      content: text || '新的正文段落',
    };
    setBlocks((current) => [...current, nextBlock]);
    setSelectedBlockId(nextBlock.id);
    setQuickInsertText('');
    setShowSlashMenu(false);
    pushToast('已插入新的正文段落', 'success');
  }, [pushToast, quickInsertText]);

  const handleSaveChartBlock = useCallback((payload) => {
    if (!chartEditorBlockId) {
      return;
    }
    updateBlockById(chartEditorBlockId, (block) => ({
      ...block,
      title: payload.title,
      subtitle: payload.subtitle,
      figCaption: payload.figCaption,
      data: payload.data,
    }));
    setChartEditorBlockId('');
    pushNotificationEvent(
      `图表「${payload.title || '未命名图表'}」已更新`,
      '图表标题、说明或数据行已经写回当前草稿。',
      'success',
    );
    pushToast('图表数据源已更新', 'success', { recordEvent: false });
  }, [chartEditorBlockId, pushNotificationEvent, pushToast, updateBlockById]);

  const exportFile = useCallback((content, extension, mimeType, successText) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${draftTitle || '企数睿思草稿'}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
    pushNotificationEvent(
      `草稿已导出为 ${extension.toUpperCase()} 文件`,
      `当前草稿《${draftTitle || '企数睿思草稿'}》已完成本地导出。`,
      'success',
    );
    pushToast(successText, 'success', { recordEvent: false });
  }, [draftTitle, pushNotificationEvent, pushToast]);

  const handleExportDraft = useCallback(() => {
    setExportModalOpen(true);
  }, []);

  const handleExportMarkdown = useCallback(() => {
    exportFile(
      buildWriterMarkdown(draftTitle || '企数睿思草稿', blocks),
      'md',
      'text/markdown;charset=utf-8',
      '草稿已导出为 Markdown 文件',
    );
  }, [blocks, draftTitle, exportFile]);

  const handleExportHtml = useCallback(() => {
    exportFile(
      buildWriterHtml(draftTitle || '企数睿思草稿', blocks),
      'html',
      'text/html;charset=utf-8',
      '草稿已导出为 HTML 专业报告',
    );
  }, [blocks, draftTitle, exportFile]);

  const handleExportWord = useCallback(() => {
    exportFile(
      buildWriterWordDocument(draftTitle || '企数睿思草稿', blocks),
      'doc',
      'application/msword;charset=utf-8',
      '草稿已导出为 Word 兼容文档',
    );
  }, [blocks, draftTitle, exportFile]);

  const renderBlock = (block) => {
    const aiIndicator = block.aiGenerated ? (
      <span className="absolute -left-6 top-1 text-purple-500 animate-pulse" title="企数睿思 AI 生成">
        <Sparkles size={16} />
      </span>
    ) : null;
    const typographyClass = getBlockTypographyClass(block);

    switch (block.type) {
      case 'h2':
        return (
          <h2
            className={`text-xl mb-3 mt-8 relative group outline-none ${typographyClass}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => handleBlockTextBlur(block.id, event)}
          >
            {aiIndicator}
            {block.content}
          </h2>
        );
      case 'h3':
        return (
          <h3
            className={`text-lg mb-2 mt-6 relative group text-blue-900 outline-none ${typographyClass}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => handleBlockTextBlur(block.id, event)}
          >
            {aiIndicator}
            {block.content}
          </h3>
        );
      case 'p':
        return (
          <p
            className={`relative group mb-3 outline-none ${typographyClass} ${block.aiGenerated ? 'bg-purple-50 text-purple-900 p-2 rounded border border-purple-100' : ''}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => handleBlockTextBlur(block.id, event)}
          >
            {aiIndicator}
            {block.content}
          </p>
        );
      case 'list':
        return (
          <ul className={`list-decimal pl-5 mt-2 space-y-2 relative group ${typographyClass}`}>
            {block.items.map((item) => (
              <li
                key={item.id}
                className={`relative ${item.aiGenerated ? 'bg-purple-50 text-purple-900 p-1.5 rounded -ml-1.5 border border-purple-100 marker:text-purple-500' : 'marker:text-gray-500'}`}
              >
                {item.aiGenerated ? <Sparkles size={12} className="absolute -left-5 top-1.5 text-purple-500" /> : null}
                <span
                  className="outline-none"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => handleListItemBlur(block.id, item.id, event)}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        );
      case 'chart':
        {
          const gradientCurrent = `colorCurrent-${block.id}`;
          const gradientOptimized = `colorOptimized-${block.id}`;
          const series = getChartSeries(block);
          const primarySeries = series[0] || '现有成本';
          const secondarySeries = series[1] || series[0] || '优化预期';
          return (
            <div className="group relative my-8 border border-blue-100 bg-blue-50/30 rounded-xl p-6 shadow-sm">
              {block.aiGenerated ? (
                <div className="absolute -top-3 left-6 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-blue-200">
                  <Sparkles size={10} /> 企数睿思 自动图表
                </div>
              ) : null}
              <div className="flex justify-between items-center mb-6 mt-2">
                <div>
                  <h3 className="font-bold text-gray-900">{block.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{block.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChartEditorBlockId(block.id)}
                  className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 px-2 py-1 rounded bg-white"
                >
                  编辑数据源
                </button>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={block.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradientCurrent} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id={gradientOptimized} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey={primarySeries} stroke="#94a3b8" fillOpacity={1} fill={`url(#${gradientCurrent})`} />
                    <Area type="monotone" dataKey={secondarySeries} stroke="#3b82f6" fillOpacity={1} fill={`url(#${gradientOptimized})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-center text-gray-400 mt-4">{block.figCaption}</p>
            </div>
          );
        }
      case 'image':
        return (
          <div className="group relative my-8 border border-gray-200 rounded-xl p-2 shadow-sm bg-white">
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 z-10">
              <ImageIcon size={10} /> 智能配图
            </div>
            <div className="rounded-lg overflow-hidden bg-gray-100 h-64 flex items-center justify-center relative">
              <img src={block.url} alt={block.caption} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-center text-gray-500 mt-3 mb-2">{block.caption}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
        <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-1 text-gray-600">
            <select
              value={selectedBlock?.type === 'list' ? 'list' : selectedBlock?.type || 'p'}
              onChange={(event) => handleChangeBlockType(event.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:outline-none hover:bg-gray-100 p-1.5 rounded cursor-pointer"
            >
              <option value="p">正文 (Normal)</option>
              <option value="h2">标题 1 (H1)</option>
              <option value="h3">标题 2 (H2)</option>
              <option value="list">列表</option>
            </select>
            <div className="w-px h-5 bg-gray-300 mx-2"></div>
            <button
              type="button"
              onClick={() => handleToggleTextStyle('bold')}
              disabled={!selectedBlock}
              className={`p-1.5 rounded transition ${selectedBlock?.bold ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'} disabled:opacity-50`}
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleTextStyle('italic')}
              disabled={!selectedBlock}
              className={`p-1.5 rounded transition ${selectedBlock?.italic ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'} disabled:opacity-50`}
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={handleCycleAlignment}
              disabled={!selectedBlock}
              className="p-1.5 hover:bg-gray-100 rounded transition disabled:opacity-50"
              title={`当前对齐：${selectedBlock?.align || 'left'}`}
            >
              <AlignLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleChangeBlockType(selectedBlock?.type === 'list' ? 'p' : 'list')}
              disabled={!selectedBlock}
              className={`p-1.5 rounded transition ${selectedBlock?.type === 'list' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'} disabled:opacity-50`}
            >
              <List size={16} />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-2"></div>
            <button
              className="flex items-center shrink-0 whitespace-nowrap gap-1.5 p-1.5 px-2 hover:bg-purple-50 text-purple-700 rounded transition text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => runAiCommand('continue', '工具栏')}
              disabled={Boolean(pendingCommand) || !commandAvailability.continue || !writerContextReady}
              title={!writerContextReady ? "请先在下方输入正文，然后再使用此功能" : "自动润色"}
            >
              <Sparkles size={14} className="group-hover:animate-pulse" /> 自动润色
            </button>
            <button
              className="flex items-center shrink-0 whitespace-nowrap gap-1.5 p-1.5 px-2 hover:bg-blue-50 text-blue-700 rounded transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => runAiCommand('chart', '工具栏')}
              disabled={Boolean(pendingCommand) || !commandAvailability.chart || !writerContextReady}
              title={!writerContextReady ? "请先在下方输入正文，然后再使用此功能" : "数据转图表"}
            >
              <BarChart3 size={14} /> 数据转图表
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span 
              className="text-xs text-gray-400 font-medium truncate max-w-[200px] lg:max-w-xs"
              title={pendingCommand
                ? `AI 正在执行「${commandCatalog[pendingCommand].title}」...`
                : !writerContextReady
                  ? '请先输入业务正文，或从 CRM / 检索页导入资料后再使用 AI 补齐'
                  : draftSaveState.status === 'saving'
                    ? draftSaveState.message
                    : draftSaveState.status === 'saved'
                      ? `已保存 ${formatClockLabel(draftSaveState.savedAt)}`
                      : draftSaveState.message || (isLocalDraftMode ? '当前为本地桌面草稿模式' : '当前为在线编辑模式，草稿尚未持久化')}
            >
              {pendingCommand
                ? `AI 正在执行「${commandCatalog[pendingCommand].title}」...`
                : !writerContextReady
                  ? '请先输入正文，或导入资料后再使用 AI 工具'
                : draftSaveState.status === 'saving'
                  ? draftSaveState.message
                : draftSaveState.status === 'saved'
                  ? `已保存 ${formatClockLabel(draftSaveState.savedAt)}`
                    : draftSaveState.message || (isLocalDraftMode ? '当前为已持久化的本地草稿模式' : '当前为在线编辑，草稿暂未持久化')}
            </span>
            <button
              className="flex items-center shrink-0 whitespace-nowrap gap-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md bg-white shadow-sm transition"
              onClick={handleSaveDraft}
            >
              <Save size={16} /> 保存草稿
            </button>
            <button
              className="flex items-center shrink-0 whitespace-nowrap gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-sm transition"
              onClick={handleExportDraft}
            >
              <Download size={16} /> 导出专业报告
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#F8FAFC] p-8 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto bg-white min-h-full p-12 shadow-sm border border-gray-200 rounded-lg relative">
            <input
              type="text"
              className="w-full text-4xl font-bold mb-6 text-gray-900 border-none focus:outline-none placeholder-gray-300"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
            />

            <div className="mb-6 flex flex-wrap items-center gap-2">
              {methodologyAudit.checklist.map((item) => (
                <span
                  key={item.key}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                    item.done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {item.done ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {item.label}
                </span>
              ))}
            </div>

            <div className="space-y-4 text-gray-800 leading-relaxed text-[15px]">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className={`group relative rounded-xl transition ${selectedBlockId === block.id ? 'ring-2 ring-blue-200 bg-blue-50/30 px-3 py-2 -mx-3' : ''}`}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setActionMenuBlockId('');
                  }}
                >
                  <div className="absolute -left-10 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer">
                    <button
                      type="button"
                      className="rounded text-gray-400 hover:text-blue-600"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedBlockId(block.id);
                        setShowSlashMenu((current) => !current);
                      }}
                    >
                      <Plus size={20} />
                    </button>
                    <button
                      type="button"
                      className={`rounded ${actionMenuBlockId === block.id ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedBlockId(block.id);
                        setActionMenuBlockId((current) => current === block.id ? '' : block.id);
                      }}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  {actionMenuBlockId === block.id ? (
                    <div className="absolute -left-2 top-8 z-20 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDuplicateBlock(block.id);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                      >
                        复制当前块
                      </button>
                      {block.type === 'chart' ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setChartEditorBlockId(block.id);
                            setActionMenuBlockId('');
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                        >
                          编辑图表数据
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveBlock(block.id);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                      >
                        删除当前块
                      </button>
                    </div>
                  ) : null}
                  {renderBlock(block)}
                </div>
              ))}

              <div className="group relative pt-4 pb-24" ref={slashMenuRef}>
                <div className="absolute -left-10 top-4 opacity-100 flex items-center gap-1 cursor-pointer">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition ${showSlashMenu ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                    <Plus size={16} onClick={() => setShowSlashMenu((current) => !current)} className={showSlashMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
                  <textarea
                    rows={3}
                    value={quickInsertText}
                    onChange={(event) => setQuickInsertText(event.target.value)}
                    onFocus={() => setShowSlashMenu(false)}
                    placeholder="在此输入正文，或点击左侧 + 唤出 AI 组件"
                    className="w-full resize-none border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-400">输入正文后可直接插入；需要 AI 辅助时再使用 Slash Menu。</div>
                    <button
                      type="button"
                      onClick={handleQuickInsert}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      插入正文块
                    </button>
                  </div>
                </div>

                {showSlashMenu ? (
                  <div className="absolute left-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30 animate-fade-in-up">
                    <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span>AI 智能生成</span>
                      <span className="text-[10px] font-normal text-gray-400">ESC 关闭</span>
                    </div>
                    <div className="p-1 space-y-0.5">
                      {commandOrder.map((commandKey) => (
                        <MenuItem
                          key={commandKey}
                          icon={getCommandIcon(commandKey)}
                          title={commandCatalog[commandKey].title}
                          sub={commandCatalog[commandKey].sub}
                          disabled={Boolean(pendingCommand) || !commandAvailability[commandKey] || !writerContextReady}
                          onClick={() => runAiCommand(commandKey, 'Slash Menu')}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {pendingCommand ? (
            <div className="fixed bottom-10 right-[28rem] rounded-2xl border border-blue-200 bg-white/95 backdrop-blur px-4 py-3 shadow-xl flex items-center gap-3 z-30">
              <Loader2 size={18} className="animate-spin text-blue-600" />
              <div>
                <div className="text-sm font-semibold text-gray-900">{commandCatalog[pendingCommand].title}</div>
                <div className="text-xs text-gray-500">正在调用真实写作能力；由于底层大模型使用非流式响应全篇分析，耗时较长（最高允许 {Math.round(WRITER_UI_TIMEOUT_MS / 1000)} 秒）。</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {editingChartBlock ? (
        <ChartEditorModal
          block={editingChartBlock}
          onClose={() => setChartEditorBlockId('')}
          onSave={handleSaveChartBlock}
        />
      ) : null}

      {exportModalOpen ? (
        <ExportReportModal
          title={draftTitle}
          onClose={() => setExportModalOpen(false)}
          onExportMarkdown={handleExportMarkdown}
          onExportHtml={handleExportHtml}
          onExportWord={handleExportWord}
        />
      ) : null}

      <div className="w-[420px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-6 pr-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 transition-all">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <CheckCircle2 size={18} className={methodologyAudit.missingItems.length === 0 ? 'text-emerald-500' : 'text-amber-500'} />
              方法论完整性审查
            </div>
            <span className={`text-xs px-2 py-1 rounded font-bold transition-colors ${methodologyAudit.missingItems.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              已完成 {methodologyAudit.completed}/{methodologyAudit.total} 项
            </span>
          </div>
          <div className="p-4 space-y-3">
            {methodologyCheckReady ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-sky-900">AI 方法论复核</div>
                  {methodologyReviewState.loading ? <Loader2 size={14} className="animate-spin text-sky-600" /> : null}
                </div>
                {methodologyReviewState.error ? (
                  <p className="mt-2 text-xs leading-6 text-sky-800">{methodologyReviewState.error}</p>
                ) : remoteMethodologyReview ? (
                  <>
                    <p className="mt-2 text-xs leading-6 text-sky-900">{remoteMethodologyReview.summary}</p>
                    {remoteMethodologyReview.gaps?.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {remoteMethodologyReview.gaps.slice(0, 2).map((item) => (
                          <div key={`${item.label}-${item.commandKey}`} className="rounded-lg border border-sky-100 bg-white/80 px-3 py-2">
                            <div className="text-xs font-semibold text-sky-900">{item.label}</div>
                            <div className="mt-1 text-[11px] leading-5 text-sky-800">{item.advice}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {remoteMethodologyReview.nextStep ? (
                      <p className="mt-2 text-[11px] leading-5 text-sky-700">下一步：{remoteMethodologyReview.nextStep}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-xs leading-6 text-sky-800">
                    {writerContextReady
                      ? '已检测到正文上下文，这里会自动调用真实模型给出方法论复核建议。'
                      : '请先输入一段业务正文，或从 CRM / 检索页导入资料后，这里才会启动真实方法论复核。'}
                  </p>
                )}
              </div>
            ) : null}
            {methodologyAudit.checklist.map((item) => (
              <ChecklistRow
                key={item.key}
                item={item}
                onAction={() => runAiCommand(item.commandKey, '方法论审查')}
                disabled={Boolean(pendingCommand) || !commandAvailability[item.commandKey] || !writerContextReady}
              />
            ))}
            <button
              onClick={handlePrimaryAuditAction}
              disabled={Boolean(pendingCommand) || !writerContextReady || !(primaryReviewGap ? commandAvailability[primaryReviewGap.commandKey] : commandAvailability.continue)}
              title={!writerContextReady ? "请先在上方输入正文，然后再使用此功能" : ""}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pendingCommand ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {primaryReviewGap
                ? `优先补齐：${primaryReviewGap.label}`
                : '继续增强当前章节'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden flex-shrink-0 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500 z-10"></div>
          <div className="px-5 pt-6 pb-5 border-b border-blue-100 bg-gradient-to-b from-blue-50/80 to-white flex items-center justify-between relative mt-1">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-lg">
              <Sparkles size={20} className="text-blue-600" />
              企数睿思·写作 Copilot
            </div>
            <span className="text-[13px] text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              {methodologyAudit.missingItems.length > 0 ? `${methodologyAudit.missingItems.length} 项待补齐` : '结构完整'}
            </span>
          </div>

          <div className="p-5 space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="text-xs uppercase tracking-wide text-blue-600 font-bold">本页进度</div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-900">{blocks.length}</div>
                  <div className="text-xs text-blue-700 mt-1">当前已生成内容块</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">{countBlockType(blocks, 'chart')}</div>
                  <div className="text-xs text-blue-700 mt-1">图表证据块</div>
                </div>
              </div>
              <div className="mt-4 w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${methodologyAudit.completionRate}%` }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-[13px]">推荐 AI 动作</h4>
                <span className="text-[11px] text-gray-400">按当前缺口动态排序</span>
              </div>
              {suggestedCommands.map((command) => (
                <SuggestionCard
                  key={command.key}
                  command={command}
                  onRun={() => runAiCommand(command.key, 'Copilot 推荐')}
                  disabled={Boolean(pendingCommand) || !commandAvailability[command.key] || !writerContextReady}
                />
              ))}
            </div>

            {!writerContextReady ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                先输入一段业务正文，或从 CRM / 检索页导入资料后，再使用自动润色、图表生成和方法论补齐。当前空白草稿不会再直接调用真实模型，避免长时间等待。
              </div>
            ) : !aiGenerationReady ? (
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                自动润色、图表生成、方法论补齐等能力当前还没有接入真实写作接口，因此页面不会再插入模拟内容。现在可用的是真实路由快照、本地草稿保存、检索资料导入和报告导出。
              </div>
            ) : !commandAvailability.image ? (
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                当前已经接入真实自动润色、框架补齐、路线图、风险段落和结构化图表生成；暂未开放的是智能配图与流式回传。
              </div>
            ) : null}

            <div className="space-y-3">
              {isLocalDraftMode ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">本地草稿箱</p>
                      <p className="mt-1 text-xs text-indigo-700">草稿写入 Electron + SQLite，本机可离线保存与回读。</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateDraft}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      新建草稿
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {recentDrafts.length > 0 ? recentDrafts.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => refreshDrafts(item.id)}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                          item.id === selectedDraftId
                            ? 'border-indigo-300 bg-white text-indigo-900'
                            : 'border-indigo-100 bg-white/70 text-indigo-800 hover:bg-white'
                        }`}
                      >
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className="mt-1 text-[11px] opacity-70">更新时间 {formatClockLabel(item.updated_at || item.saved_at)}</div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-dashed border-indigo-200 bg-white/70 px-3 py-3 text-xs text-indigo-700">
                        还没有本地草稿，点击右上角“保存草稿”即可生成第一份桌面草稿。
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-[13px]">{isLocalDraftMode ? '最近本地 AI 审计记录' : '最近 AI 插入记录'}</h4>
                <span className="text-[11px] text-gray-400">{isLocalDraftMode ? '来自本地 ai_execution_logs' : '用于验证未来 block generate 工作流'}</span>
              </div>
              <div className="space-y-2">
                {(isLocalDraftMode && writerAuditLogs.length > 0 ? writerAuditLogs : activityLog).length > 0 ? (
                  (isLocalDraftMode && writerAuditLogs.length > 0 ? writerAuditLogs : activityLog).map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          {getCommandIcon(item.commandKey, 14)}
                          {commandCatalog[item.commandKey]?.title || 'AI 动作'}
                        </div>
                        <span className="text-[11px] text-gray-400">{item.createdAt}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">{item.note}</p>
                      <p className="mt-2 text-[11px] text-gray-400">触发来源：{item.trigger}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-xs text-gray-500">
                    还没有 AI 插入记录。你可以先从 CRM / 检索页导入资料，或手工输入内容后再触发增强动作。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, title, sub, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-lg transition group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-8 h-8 rounded bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 group-hover:border-blue-200">
        {icon}
      </div>
      <div className="text-left">
        <h5 className="text-[13px] font-bold text-gray-800">{title}</h5>
        <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

function ChartEditorModal({ block, onClose, onSave }) {
  const series = useMemo(() => getChartSeries(block), [block]);
  const [title, setTitle] = useState(block.title || '');
  const [subtitle, setSubtitle] = useState(block.subtitle || '');
  const [figCaption, setFigCaption] = useState(block.figCaption || '');
  const [rows, setRows] = useState(() => block.data.map((item) => ({ ...item })));

  useEffect(() => {
    setTitle(block.title || '');
    setSubtitle(block.subtitle || '');
    setFigCaption(block.figCaption || '');
    setRows(block.data.map((item) => ({ ...item })));
  }, [block]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">编辑图表数据源</h3>
            <p className="mt-1 text-sm text-gray-500">当前支持修改图表标题、说明和数据行，保存后会直接回写到本地草稿。</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">x</button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <MiniField label="图表标题" value={title} onChange={setTitle} />
            <MiniField label="图表副标题" value={subtitle} onChange={setSubtitle} />
          </div>
          <MiniField label="图注说明" value={figCaption} onChange={setFigCaption} />
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600" style={{ gridTemplateColumns: `160px repeat(${series.length}, minmax(0, 1fr)) 60px` }}>
              <div>阶段 / 月份</div>
              {series.map((item) => (
                <div key={item}>{item}</div>
              ))}
              <div className="text-right">操作</div>
            </div>
            <div className="divide-y divide-gray-100">
              {rows.map((row, index) => (
                <div
                  key={`${row.month}-${index}`}
                  className="grid items-center gap-3 px-4 py-3"
                  style={{ gridTemplateColumns: `160px repeat(${series.length}, minmax(0, 1fr)) 60px` }}
                >
                  <input
                    value={row.month || ''}
                    onChange={(event) => setRows((current) => current.map((item, rowIndex) => (
                      rowIndex === index ? { ...item, month: event.target.value } : item
                    )))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  {series.map((key) => (
                    <input
                      key={`${key}-${index}`}
                      type="number"
                      value={row[key]}
                      onChange={(event) => setRows((current) => current.map((item, rowIndex) => (
                        rowIndex === index ? { ...item, [key]: event.target.value } : item
                      )))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                    className="text-right text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRows((current) => ([
                ...current,
                series.reduce((acc, item) => ({ ...acc, [item]: 0 }), { month: `阶段 ${current.length + 1}` }),
              ]))}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              新增一行
            </button>
            <div className="flex gap-3">
              <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button
                onClick={() => onSave({
                  title: title.trim() || block.title,
                  subtitle: subtitle.trim(),
                  figCaption: figCaption.trim(),
                  data: normalizeChartRows(rows, series),
                })}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                保存图表
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportReportModal({ title, onClose, onExportMarkdown, onExportHtml, onExportWord }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">导出专业报告</h3>
            <p className="mt-1 text-sm text-gray-500">为《{title || '未命名草稿'}》选择一个导出格式。</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">x</button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <button
            type="button"
            onClick={onExportHtml}
            className="w-full rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left hover:bg-blue-100 transition"
          >
            <div className="text-base font-semibold text-blue-900">HTML 专业报告</div>
            <p className="mt-2 text-sm leading-relaxed text-blue-800">适合直接交付或二次打印，包含封面、结构化正文、图表数据表格和图片版式。</p>
          </button>
          <button
            type="button"
            onClick={onExportWord}
            className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left hover:bg-emerald-100 transition"
          >
            <div className="text-base font-semibold text-emerald-900">Word 兼容文档</div>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800">适合交给客户继续在 Word 中编辑，当前导出为 `.doc` 兼容格式，保留报告版式和主要内容结构。</p>
          </button>
          <button
            type="button"
            onClick={onExportMarkdown}
            className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left hover:bg-gray-50 transition"
          >
            <div className="text-base font-semibold text-gray-900">Markdown 草稿</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">适合继续在本地编辑、提交到知识库或交给研发团队做后续转换处理。</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
      />
    </label>
  );
}

function ChecklistRow({ item, onAction, disabled }) {
  return (
    <div className={`rounded-xl border p-3 ${item.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {item.done ? (
            <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
          </div>
        </div>
        {!item.done ? (
          <button
            type="button"
            onClick={onAction}
            disabled={disabled}
            title={disabled ? "请先在左侧输入部分业务正文后，再使用工具" : "点击工具一键补齐"}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            补齐
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SuggestionCard({ command, onRun, disabled }) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
          {getCommandIcon(command.key, 14)} {command.title}
        </h4>
      </div>
      <p className="text-[12px] text-gray-600 mb-4 leading-relaxed">{command.sub}</p>
      <button
        type="button"
        onClick={onRun}
        disabled={disabled}
        title={disabled ? "请先在左侧输入部分业务正文后，再使用工具" : ""}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg shadow-sm shadow-blue-600/20 transition font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        立即执行 <ChevronRight size={14} />
      </button>
    </div>
  );
}
