import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Database,
  BrainCircuit,
  ChevronDown,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  Search as SearchIcon,
  Send,
  X,
} from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { useAppShell } from '../AppShellContext';
import { useSdkViewData } from '../hooks/useSdkViewData';
import {
  listDocumentChatMessages,
  loadSearchSnapshot,
  sendDocumentChatMessage,
} from '../sdk/api';

const assetTypeOptions = [
  { value: 'all', label: '全部' },
  { value: 'pdf', label: 'PDF/Word' },
  { value: 'ppt', label: 'PPT' },
  { value: 'audio', label: '访谈录音' },
];

const timeRangeOptions = [
  { value: 'all', label: '不限时间' },
  { value: 'half-year', label: '最近半年' },
  { value: 'one-year', label: '最近一年' },
  { value: 'before-2022', label: '2022 年及以前' },
];

function normalizeResultDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function matchesTimeRange(dateValue, range) {
  if (range === 'all') {
    return true;
  }
  const parsed = normalizeResultDate(dateValue);
  if (!parsed) {
    return true;
  }

  const now = new Date();
  const halfYearAgo = new Date(now);
  halfYearAgo.setMonth(now.getMonth() - 6);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  if (range === 'half-year') {
    return parsed >= halfYearAgo;
  }
  if (range === 'one-year') {
    return parsed >= oneYearAgo;
  }
  if (range === 'before-2022') {
    return parsed.getFullYear() <= 2022;
  }
  return true;
}

export default function Search() {
  const {
    consumePendingSearchIntent,
    navigateTo,
    pushNotificationEvent,
    pushToast,
  } = useAppShell();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatNotice, setChatNotice] = useState('');
  const chatEndRef = useRef(null);

  const loader = useCallback(() => {
    const normalizedQuery = submittedQuery.trim();
    if (!normalizedQuery) {
      return Promise.resolve([]);
    }
    return loadSearchSnapshot(normalizedQuery);
  }, [submittedQuery]);
  const { data, error, loading, source } = useSdkViewData(loader);
  const results = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    return [];
  }, [data]);

  const filteredResults = useMemo(() => results.filter((item) => {
    const typeMatched = assetTypeFilter === 'all' ? true : item.type === assetTypeFilter;
    const timeMatched = matchesTimeRange(item.date, timeRangeFilter);
    return typeMatched && timeMatched;
  }), [assetTypeFilter, results, timeRangeFilter]);

  const selectedData = filteredResults.find((item) => item.id === selectedId) || filteredResults[0];
  const isUnconfigured = source === 'unconfigured';
  const canUseRealChat = source === 'local' || source === 'sdk';
  const hasSubmittedQuery = Boolean(submittedQuery.trim());
  const emptyStateTitle = !hasSubmittedQuery
    ? isUnconfigured
      ? '当前还没有接入真实知识库'
      : '先输入关键词开始检索'
    : error
      ? '当前检索接口还没有返回真实结果'
      : isUnconfigured
        ? '当前还没有接入真实知识库'
        : '当前查询没有命中结果';
  const emptyStateDescription = !hasSubmittedQuery
    ? isUnconfigured
      ? '请先接入 QeeClaw Platform，或在桌面本地模式下导入知识资产；接入完成后，再输入关键词开始检索。'
      : '输入业务关键词后，这里会展示真实命中的知识资产；若尚未接入，可先去配置平台接入或导入本地资产。'
    : error
      ? error.message
      : isUnconfigured
        ? '请先接入 QeeClaw Platform，或在桌面本地模式下导入知识资产后，再进行诊断检索。'
        : '可尝试调整关键词、放宽筛选条件，或先去“资产管理”导入资料。';

  useEffect(() => {
    if (filteredResults.length > 0 && !filteredResults.some((item) => item.id === selectedId)) {
      setSelectedId(filteredResults[0].id);
    }
  }, [filteredResults, selectedId]);

  useEffect(() => {
    const intent = consumePendingSearchIntent();
    if (!intent?.query) {
      return;
    }
    setQuery(intent.query);
    setSubmittedQuery(intent.query);
  }, [consumePendingSearchIntent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let cancelled = false;

    async function syncMessages() {
      setChatInput('');
      if (!selectedData) {
        setMessages([]);
        return;
      }

      if (!canUseRealChat) {
        setMessages([]);
        setChatNotice('');
        return;
      }

      try {
        const history = await listDocumentChatMessages(selectedData.id, selectedData.title);
        if (cancelled) {
          return;
        }
        setMessages(history);
        setChatNotice(history.length > 0
          ? source === 'local'
            ? '已从本地桌面会话中恢复当前资料追问记录。'
            : '已恢复当前浏览器保存的资料追问记录。'
          : source === 'local'
            ? '当前资料还没有本地追问记录。'
            : '当前资料还没有浏览器侧追问记录，可直接发起真实模型追问。');
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setMessages([]);
        setChatNotice(loadError.message || '加载本地追问记录失败。');
      }
    }

    syncMessages();
    return () => {
      cancelled = true;
    };
  }, [canUseRealChat, selectedData, source]);

  const handleSearch = () => {
    const nextQuery = query.trim();
    if (!nextQuery) {
      pushToast('请先输入检索关键词', 'info', { recordEvent: false });
      return;
    }
    setSubmittedQuery(nextQuery);
    pushNotificationEvent(
      `已发起知识检索：${nextQuery}`,
      '检索结果会按当前筛选条件更新，并可继续追问或导入撰写助手。',
      'info',
    );
  };

  const handleAddToWriter = () => {
    if (!selectedData) {
      return;
    }
    navigateTo('write', {
      writerImport: {
        title: selectedData.title,
        summary: selectedData.summary,
        highlight: selectedData.highlight,
      },
    });
    pushNotificationEvent(
      `已导入资料「${selectedData.title}」`,
      '检索结果摘要已发送到撰写助手，可继续生成销售方案或专业报告。',
      'success',
    );
    pushToast(`已把「${selectedData.title}」加入撰写助手`, 'success', { recordEvent: false });
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedData) {
      return;
    }

    const question = text.trim();
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setChatInput('');
    setIsTyping(true);
    pushNotificationEvent(
      `已追问资料「${selectedData.title}」`,
      `问题：${question}`,
      'info',
    );

    if (canUseRealChat) {
      try {
        const history = await sendDocumentChatMessage({
          documentId: selectedData.id,
          title: selectedData.title,
          summary: selectedData.summary,
          insights: selectedData.insights,
          question,
        });
        setMessages(history);
        setChatNotice(source === 'local'
          ? '当前对话已保存到本地桌面数据库。'
          : '当前对话已通过真实模型完成追问，并保存到当前浏览器。');
        pushNotificationEvent(
          source === 'local' ? '资料追问已写入本地会话' : '资料追问已完成真实模型调用',
          source === 'local'
            ? `《${selectedData.title}》的追问记录已保存到本地桌面数据库。`
            : `《${selectedData.title}》的追问记录已保存到当前浏览器，可继续追问。`,
          'success',
        );
      } catch (chatError) {
        setMessages((prev) => prev.slice(0, -1));
        setChatNotice(chatError.message || '资料追问失败。');
      } finally {
        setIsTyping(false);
      }
      return;
    }

    setIsTyping(false);
    setMessages((prev) => prev.slice(0, -1));
    setChatNotice('当前环境尚未接入真实资料追问能力；这里不会再展示前端模拟回复。');
    pushNotificationEvent(
      '资料追问尚未接入真实接口',
      '当前不会再展示前端模拟回复，请先完成平台接入或切换到桌面本地模式。',
      'warning',
    );
    pushToast('当前未接入真实资料追问接口', 'warning', { recordEvent: false });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="p-6 border-b border-gray-200 bg-gray-50/80 z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">知识库诊断检索</h2>
            <p className="text-sm text-gray-500 mt-1">当前页已接入真实知识检索；在线模式下资料追问走真实模型调用，桌面模式下会同时落本地会话。</p>
          </div>
          <DataSourceBadge
            source={source}
            error={error}
            variant="hybrid"
            label={source === 'sdk' ? '真实知识检索 / 实时模型追问' : source === 'local' ? '本地知识检索 / 本地追问' : undefined}
            title={source === 'sdk'
              ? '左侧检索结果来自 QeeClaw SDK；右侧追问会调用平台模型能力，并把会话历史保存在当前浏览器。'
              : source === 'local'
                ? '左侧结果与右侧追问都来自本地桌面数据层，并且会话会写入本地数据库。'
                : undefined}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <SearchIcon size={20} className="text-gray-400 ml-4 mr-2" />
            <input
              type="text"
              className="bg-transparent border-none focus:outline-none w-full text-gray-800 text-lg py-3"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="输入查询内容，例如：制造成本优化..."
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-md font-medium transition mr-1.5 flex items-center gap-2"
            >
              {loading ? '检索中...' : '智能检索'}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilter((current) => !current)}
              className="px-6 py-3 h-full bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 transition shadow-sm"
            >
              <Filter size={18} />
              高级筛选
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
            </button>

            {showFilter ? (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-800">检索过滤条件</h4>
                  <X size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setShowFilter(false)} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">资产类型</label>
                    <div className="flex flex-wrap gap-2">
                      {assetTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAssetTypeFilter(option.value)}
                          className={`px-3 py-1 text-sm rounded border transition ${
                            assetTypeFilter === option.value
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">时间范围</label>
                    <select
                      value={timeRangeFilter}
                      onChange={(event) => setTimeRangeFilter(event.target.value)}
                      className="w-full border border-gray-200 rounded p-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    >
                      {timeRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAssetTypeFilter('all');
                        setTimeRangeFilter('all');
                        pushNotificationEvent(
                          '已清空检索筛选条件',
                          '资产类型和时间范围都已恢复为默认值。',
                          'info',
                        );
                        pushToast('已清空高级筛选条件', 'info', { recordEvent: false });
                      }}
                      className="text-xs text-gray-500 hover:text-blue-600"
                    >
                      清空筛选
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3 mt-4 text-sm items-center">
          <span className="text-gray-500">当前查询：</span>
          <span className="text-blue-600 font-medium">{submittedQuery}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{filteredResults.length} 条候选结果</span>
          {assetTypeFilter !== 'all' || timeRangeFilter !== 'all' ? (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-xs text-blue-700">
                已筛选：
                {assetTypeOptions.find((item) => item.value === assetTypeFilter)?.label}
                {' / '}
                {timeRangeOptions.find((item) => item.value === timeRangeFilter)?.label}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-gray-200 overflow-auto p-6 space-y-4 bg-white custom-scrollbar">
          {filteredResults.length === 0 ? (
            <SearchEmptyState
              title={emptyStateTitle}
              description={emptyStateDescription}
              onOpenAccess={() => navigateTo('settings-system', { settingsTab: 'access' })}
              onOpenAssets={() => navigateTo('assets')}
            />
          ) : (
            filteredResults.map((result) => (
              <ResultCard key={result.id} data={result} active={selectedData?.id === result.id} onClick={() => setSelectedId(result.id)} />
            ))
          )}
        </div>

        <div className="w-1/2 bg-[#F8FAFC] overflow-auto p-6 flex flex-col custom-scrollbar">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-blue-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-800">
                <BrainCircuit size={20} />
                <h3 className="font-semibold text-lg">企数睿思·方法论洞察</h3>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium border border-blue-200">
                基于真实命中资料展示
              </span>
            </div>

            {!selectedData ? (
              <div className="flex-1 flex items-center justify-center px-8">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <BrainCircuit size={24} />
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-gray-900">等待真实检索结果</h4>
                  <p className="mt-2 text-sm leading-7 text-gray-500">检索命中后，这里才会展示方法论洞察、资料使用动作和资料追问面板。</p>
                </div>
              </div>
            ) : (
              <div className="p-6 overflow-auto flex-1 space-y-8">
                <div className="animate-fade-in-up">
                  <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-sm"></div>
                    核心观点提取
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-700 list-disc pl-6 marker:text-gray-400">
                    {selectedData.insights.map((insight, index) => (
                      <li
                        key={index}
                        dangerouslySetInnerHTML={{
                          __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>'),
                        }}
                      ></li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-100 pt-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-sm"></div>
                    资料使用动作
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                    <ImageIcon size={32} className="text-gray-300 mb-3" />
                    <span>当前仅保留真实资料引用入口；图表缩略图、自动抽图与引用建议待真实解析能力接入后再开放。</span>
                  </div>
                  <button
                    className="mt-3 w-full py-2.5 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium hover:bg-gray-50 hover:text-blue-600 transition flex items-center justify-center gap-2"
                    onClick={handleAddToWriter}
                  >
                    添加到当前撰写报告中
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-6 flex flex-col flex-1 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare size={16} className="text-cyan-500" /> 追问企数睿思
                  </h4>

                  {chatNotice ? (
                    <div className="mb-3 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-800">
                      {chatNotice}
                    </div>
                  ) : null}

                  <div className="bg-gray-50 border border-gray-200 rounded-t-lg p-4 flex-1 min-h-[150px] max-h-[300px] overflow-y-auto space-y-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        {source === 'local'
                          ? '当前资料尚无本地追问记录，发起一次提问后会自动写入本地桌面数据库。'
                          : source === 'sdk'
                            ? '当前资料尚无追问记录，发起一次提问后会调用真实模型并保存在当前浏览器。'
                            : '当前环境尚未接入真实资料追问接口；这里不会再展示模拟对话。'}
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
                          }`}>
                            <p
                              className="leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                            ></p>
                          </div>
                        </div>
                      ))
                    )}
                    {isTyping ? (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 text-gray-500 rounded-lg rounded-bl-none shadow-sm px-4 py-3 text-sm">
                          正在组织回答...
                        </div>
                      </div>
                    ) : null}
                    <div ref={chatEndRef}></div>
                  </div>

                  <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-3">
                    <div className="mb-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs leading-6 text-gray-500">
                      当前不再展示前端自动生成的推荐追问。请输入你的真实问题，或围绕当前资料继续追问。
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                        placeholder="继续追问当前案例..."
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            handleSendMessage(chatInput);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSendMessage(chatInput)}
                        className="w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchEmptyState({ title, description, onOpenAccess, onOpenAssets }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
          <Database size={24} />
        </div>
        <h3 className="mt-4 text-xl font-black text-gray-900">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenAccess}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            去完成平台接入
          </button>
          <button
            type="button"
            onClick={onOpenAssets}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            去导入知识资产
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ data, active, onClick }) {
  const typeStyles = {
    pdf: 'bg-red-50 text-red-600 border-red-100',
    ppt: 'bg-orange-50 text-orange-600 border-orange-100',
    audio: 'bg-purple-50 text-purple-600 border-purple-100',
    doc: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border transition ${
        active ? 'border-blue-300 bg-blue-50/60 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] uppercase px-2 py-1 rounded-full border font-bold ${typeStyles[data.type] || typeStyles.doc}`}>
              {data.type}
            </span>
            <span className="text-xs text-gray-400">{data.date}</span>
          </div>
          <h3 className="font-bold text-gray-900 leading-snug">{data.title}</h3>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{data.summary}</p>
          <div className="mt-3 bg-gray-50 rounded-lg border border-gray-100 px-3 py-2 text-xs text-gray-500">
            {data.highlight}
          </div>
        </div>
      </div>
    </button>
  );
}
