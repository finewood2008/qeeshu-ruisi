import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  BookOpen, SlidersHorizontal, Library, CheckCircle2, 
  ToggleRight, ToggleLeft, UploadCloud, ShieldCheck,
  Globe, Building, AlertCircle, X, Info, Image as ImageIcon, Save, Plus, ArrowUp, ArrowDown, FileText
} from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { useAppShell } from '../AppShellContext';
import { useSdkViewData } from '../hooks/useSdkViewData';
import {
  createCustomFramework,
  loadMethodologySnapshot,
  persistMethodologyProfile,
} from '../sdk/api';

const builtInFrameworkCatalog = {
  mckinsey: {
    title: '麦肯锡 7S 模型',
    desc: '用于组织诊断与战略落地一致性分析。',
  },
  bcg: {
    title: '波士顿矩阵 (BCG Matrix)',
    desc: '用于业务组合与市场份额/增长率分析。',
  },
  porter: {
    title: '波特五力模型',
    desc: '用于行业竞争格局与吸引力评估。',
  },
  scor: {
    title: 'SCOR 供应链参考模型',
    desc: '用于供应链流程、绩效和优化诊断。',
  },
  pestel: {
    title: 'PESTEL 宏观环境分析',
    desc: '用于政、经、社、技、环、法多维度外部扫描。',
  },
  swot: {
    title: 'SWOT 分析模型',
    desc: '用于优势、劣势、机会、威胁的基础诊断。',
  },
};

const emptyMethodologySnapshot = {
  routeProfile: {
    resolvedModel: '',
    configuredProviderCount: 0,
  },
  providerSummary: [],
  runtimeState: {
    runtimeLabel: 'OpenClaw',
    runtimeStatus: 'unknown',
  },
  runtime: {
    workspaceLabel: '待接入',
    runtimeLabel: 'OpenClaw',
  },
  knowledge: {
    assetCount: 0,
    indexedCount: 0,
    watchDir: '待配置',
    lastSyncAt: '',
  },
  missingApis: [
    'framework registry / methodology plugin catalog',
    '私有方法论文档上传与结构提炼',
    '组织级策略持久化与团队共享',
    '方法论开关与 AI Writer 联动校验',
  ],
};

function inferFrameworkDescription(fileName) {
  const normalized = String(fileName || '').replace(/\.[^.]+$/, '');
  if (!normalized) {
    return '';
  }
  return `从本地方法论文档《${normalized}》导入，建议后续继续补充适用业务场景、关键诊断维度和优先级说明。`;
}

export default function Settings() {
  const { pushNotificationEvent, pushToast } = useAppShell();
  const frameworkFileInputRef = useRef(null);
  const loader = useCallback(() => loadMethodologySnapshot(), []);
  const { data: methodologyData, error: methodologyError, source: methodologySource } = useSdkViewData(loader);
  const methodologySnapshot = methodologyData || emptyMethodologySnapshot;
  const isLocalMode = methodologySource === 'local';
  const providerSummary = Array.isArray(methodologySnapshot.providerSummary) ? methodologySnapshot.providerSummary : [];
  const missingApis = Array.isArray(methodologySnapshot.missingApis) ? methodologySnapshot.missingApis : [];
  const [strategy, setStrategy] = useState('mixed');
  const [frameworks, setFrameworks] = useState({
    mckinsey: false,
    bcg: false,
    porter: false,
    scor: false,
    pestel: false,
    swot: false,
  });

  // Modal State
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const [createFrameworkOpen, setCreateFrameworkOpen] = useState(false);
  const [customFrameworks, setCustomFrameworks] = useState([]);
  const [importedFrameworkFile, setImportedFrameworkFile] = useState(null);
  const [customFrameworkForm, setCustomFrameworkForm] = useState({
    title: '',
    desc: '',
  });

  const proprietaryFrameworks = useMemo(() => customFrameworks, [customFrameworks]);

  useEffect(() => {
    if (methodologySnapshot.strategy) {
      setStrategy(methodologySnapshot.strategy);
    }
    if (methodologySnapshot.frameworks) {
      setFrameworks((current) => ({
        ...current,
        ...methodologySnapshot.frameworks,
      }));
    }
    if (Array.isArray(methodologySnapshot.customFrameworks) && methodologySnapshot.customFrameworks.length > 0) {
      setCustomFrameworks(methodologySnapshot.customFrameworks);
    } else {
      setCustomFrameworks([]);
    }
  }, [methodologySnapshot]);

  const toggleFramework = (e, key) => {
    e.stopPropagation(); // 阻止冒泡，避免触发打开 Modal
    const nextEnabled = !frameworks[key];
    setFrameworks(prev => ({ ...prev, [key]: nextEnabled }));
    setSaveState({ status: 'idle', message: '' });
    pushNotificationEvent(
      `预置框架已${nextEnabled ? '启用' : '停用'}`,
      `框架键：${key}。点击“保存全部更改”后会写入当前方法论配置。`,
      'info',
    );
  };

  const openFrameworkModal = (key) => {
    const framework = builtInFrameworkCatalog[key];
    setSelectedFramework({
      title: framework?.title || `${key.toUpperCase()} 模型`,
      desc: framework?.desc || '当前仅支持框架开关与优先级配置，详细框架知识卡和图谱尚未接入。',
      dimensions: [],
      application: '当前版本里，这个框架主要用于控制 AI 思考策略的优先级；真正的框架注册中心与知识图谱后续再接入。',
    });
  };

  const handleSaveMethodology = async () => {
    if (!isLocalMode) {
      setSaveState({
        status: 'idle',
        message: '当前只有本地桌面模式支持方法论配置持久化。',
      });
      return;
    }

    try {
      setSaveState({ status: 'saving', message: '正在保存方法论配置...' });
      await persistMethodologyProfile({
        strategy,
        frameworks,
        customFrameworks: proprietaryFrameworks,
      });
      setSaveState({ status: 'saved', message: '方法论配置已写入本地桌面数据库。' });
      pushNotificationEvent(
        '方法论配置已保存',
        `当前策略：${strategy}；预置框架与机构自有框架优先级已写入本地桌面数据库。`,
        'success',
      );
      pushToast('方法论配置已保存', 'success', { recordEvent: false });
    } catch (saveError) {
      setSaveState({ status: 'error', message: saveError.message || '保存方法论配置失败。' });
    }
  };

  const handleCreateFramework = async () => {
    if (!customFrameworkForm.title.trim()) {
      return;
    }

    try {
      setSaveState({ status: 'saving', message: '正在新增机构自有框架...' });
      const profile = await createCustomFramework({
        title: customFrameworkForm.title.trim(),
        desc: customFrameworkForm.desc.trim(),
        sourcePath: importedFrameworkFile?.path || null,
        sourceName: importedFrameworkFile?.name || null,
      });
      if (Array.isArray(profile?.customFrameworks)) {
        setCustomFrameworks(profile.customFrameworks);
      }
      setCreateFrameworkOpen(false);
      setCustomFrameworkForm({ title: '', desc: '' });
      setImportedFrameworkFile(null);
      setSaveState({ status: 'saved', message: '新的机构自有框架已保存到本地数据库。' });
      pushNotificationEvent(
        `机构自有框架「${customFrameworkForm.title.trim()}」已新增`,
        '新的方法论条目已经写入本地数据库，可继续调整优先级或启停状态。',
        'success',
      );
      pushToast(`机构自有框架「${customFrameworkForm.title.trim()}」已新增`, 'success', { recordEvent: false });
    } catch (saveError) {
      setSaveState({ status: 'error', message: saveError.message || '新增机构自有框架失败。' });
    }
  };

  const openFrameworkFilePicker = useCallback(() => {
    frameworkFileInputRef.current?.click();
  }, []);

  const handleFrameworkFileSelected = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const sourcePath = file.path || '';
    setImportedFrameworkFile({
      name: file.name,
      path: sourcePath,
      size: file.size,
    });
    setCustomFrameworkForm({
      title: file.name.replace(/\.[^.]+$/, ''),
      desc: inferFrameworkDescription(file.name),
    });
    setCreateFrameworkOpen(true);
    setSaveState({ status: 'idle', message: '' });
    pushNotificationEvent(
      `已选择方法论文档「${file.name}」`,
      '文档元数据已加载到新增框架表单，下一步可补充说明并保存到本地数据库。',
      'info',
    );
    event.target.value = '';
  }, [pushNotificationEvent]);

  const toggleProprietaryFramework = useCallback((frameworkId) => {
    const target = proprietaryFrameworks.find((item) => item.id === frameworkId);
    const nextEnabled = target ? target.enabled === false : true;
    setCustomFrameworks((current) => current.map((item) => (
      item.id === frameworkId ? { ...item, enabled: item.enabled === false } : item
    )));
    setSaveState({ status: 'idle', message: '机构自有框架状态已更新，点击“保存全部更改”后写入本地数据库。' });
    pushNotificationEvent(
      `机构自有框架已${nextEnabled ? '启用' : '停用'}`,
      `框架：${target?.title || frameworkId}。当前变更尚未最终落库，请记得保存全部更改。`,
      'info',
    );
  }, [proprietaryFrameworks, pushNotificationEvent]);

  const moveProprietaryFramework = useCallback((frameworkId, direction) => {
    const target = proprietaryFrameworks.find((item) => item.id === frameworkId);
    setCustomFrameworks((current) => {
      const index = current.findIndex((item) => item.id === frameworkId);
      if (index === -1) {
        return current;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setSaveState({ status: 'idle', message: '机构自有框架优先级已调整，点击“保存全部更改”后写入本地数据库。' });
    pushNotificationEvent(
      '机构自有框架优先级已调整',
      `框架：${target?.title || frameworkId}，方向：${direction === 'up' ? '上移' : '下移'}。`,
      'info',
    );
  }, [proprietaryFrameworks, pushNotificationEvent]);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden relative">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <SlidersHorizontal className="text-blue-600" />
              系统与方法论设置
            </h2>
            <DataSourceBadge
              source={methodologySource}
              error={methodologyError}
              variant="hybrid"
              label={methodologySource === 'sdk' ? 'SDK 控制面 / 本地方法论配置' : undefined}
              title={methodologySource === 'sdk' ? '模型路由、知识范围与运行时上下文来自 SDK；方法论开关和机构自有框架由本地配置承载。' : undefined}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">配置 企数睿思 (QEESHU RUISI) 的底层思考逻辑与参考框架</p>
        </div>
        <button
          onClick={handleSaveMethodology}
          disabled={!isLocalMode}
          className={`px-6 py-2 rounded-md font-medium transition shadow-sm inline-flex items-center gap-2 ${
            isLocalMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500'
          }`}
        >
          <Save size={16} />
          保存全部更改
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 relative">
        <div className="max-w-5xl mx-auto space-y-8">
          {saveState.message ? (
            <div className={`rounded-2xl px-5 py-4 text-sm ${
              saveState.status === 'error'
                ? 'border border-rose-200 bg-rose-50 text-rose-800'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              {saveState.message}
            </div>
          ) : null}

          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">方法论页当前可验证的 SDK 能力</h3>
                <p className="text-sm text-gray-500 mt-1">这里展示真实模型路由、知识范围与运行时上下文。机构自有框架若未上传，则显示空态而不再展示默认预置库。</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">当前工作空间 / Runtime</div>
                <div className="mt-2 font-semibold text-gray-900">{methodologySnapshot.runtime.workspaceLabel} / {methodologySnapshot.runtime.runtimeLabel}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-5">
              <SnapshotCard title="路由模型" value={methodologySnapshot.routeProfile.resolvedModel || '未返回'} />
              <SnapshotCard title="Provider 数" value={`${methodologySnapshot.routeProfile.configuredProviderCount || providerSummary.length} 个`} />
              <SnapshotCard title="知识资产" value={`${methodologySnapshot.knowledge.assetCount} 项`} />
              <SnapshotCard title="运行时状态" value={methodologySnapshot.runtimeState.runtimeStatus || 'unknown'} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl border border-blue-100 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">当前知识范围</p>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-900">WatchDir：</span>{methodologySnapshot.knowledge.watchDir}</p>
                  <p><span className="font-medium text-gray-900">Indexed：</span>{methodologySnapshot.knowledge.indexedCount}/{methodologySnapshot.knowledge.assetCount}</p>
                  <p><span className="font-medium text-gray-900">Last Sync：</span>{methodologySnapshot.knowledge.lastSyncAt || '未返回'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">这页还缺的 SDK/API 能力</p>
                <ul className="mt-3 space-y-2 text-xs text-amber-800">
                  {missingApis.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Strategy Setting */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <BrainIcon className="text-blue-600" />
              <h3 className="font-bold text-lg text-gray-900">AI 思考策略与框架调用优先级</h3>
            </div>
            <div className="p-6">
              <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {isLocalMode
                  ? '当前“思考策略”与框架开关会写入本地桌面数据库，重开应用后仍然保留。'
                  : '当前“思考策略”开关仍是页面本地状态，用来验证未来的策略持久化接口应该长什么样。'}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <StrategyCard 
                  id="mixed" current={strategy} onClick={() => setStrategy('mixed')}
                  title="智能混合模式 (推荐)" 
                  icon={<ShieldCheck size={24} />}
                  desc="优先依赖机构自有理论框架，在自有框架缺乏相关维度时，智能调用权威公开框架作为补充。"
                />
                <StrategyCard 
                  id="private" current={strategy} onClick={() => setStrategy('private')}
                  title="严格私有模式" 
                  icon={<Building size={24} />}
                  desc="仅严格依据本地上传的机构自有知识库与方法论进行诊断，杜绝一切外部知识，确保绝对独特视角。"
                />
                <StrategyCard 
                  id="public" current={strategy} onClick={() => setStrategy('public')}
                  title="通用公开模式" 
                  icon={<Globe size={24} />}
                  desc="主要依赖内置的全球经典管理学理论进行分析，适合初创机构或标准化程度高的行业研究。"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Built-in Global Frameworks */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="text-blue-600" size={20} />
                  <h3 className="font-bold text-gray-900">预置全球经典咨询框架库</h3>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">已激活 {Object.values(frameworks).filter(Boolean).length} 项</span>
              </div>
              <div className="p-2">
                <FrameworkToggle 
                  title="麦肯锡 7S 模型" desc="组织诊断与战略落地一致性分析" 
                  active={frameworks.mckinsey} 
                  onToggle={(e) => toggleFramework(e, 'mckinsey')} 
                  onClick={() => openFrameworkModal('mckinsey')}
                />
                <FrameworkToggle 
                  title="波士顿矩阵 (BCG Matrix)" desc="业务组合与市场份额/增长率分析" 
                  active={frameworks.bcg} 
                  onToggle={(e) => toggleFramework(e, 'bcg')} 
                  onClick={() => openFrameworkModal('bcg')}
                />
                <FrameworkToggle 
                  title="波特五力模型" desc="行业竞争格局与吸引力评估" 
                  active={frameworks.porter} 
                  onToggle={(e) => toggleFramework(e, 'porter')} 
                  onClick={() => openFrameworkModal('porter')}
                />
                <FrameworkToggle 
                  title="SCOR 供应链参考模型" desc="深度供应链诊断、绩效与流程优化" 
                  active={frameworks.scor} 
                  onToggle={(e) => toggleFramework(e, 'scor')} 
                  onClick={() => openFrameworkModal('scor')}
                />
                <FrameworkToggle 
                  title="PESTEL 宏观环境分析" desc="政、经、社、技、环、法多维度外部扫描" 
                  active={frameworks.pestel} 
                  onToggle={(e) => toggleFramework(e, 'pestel')} 
                  onClick={() => openFrameworkModal('pestel')}
                />
                <FrameworkToggle 
                  title="SWOT 分析模型" desc="优势、劣势、机会、威胁基础诊断" 
                  active={frameworks.swot} 
                  onToggle={(e) => toggleFramework(e, 'swot')} 
                  onClick={() => openFrameworkModal('swot')}
                />
              </div>
            </div>

            {/* Proprietary Frameworks */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-purple-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="text-purple-600" size={20} />
                  <h3 className="font-bold text-gray-900">机构自有理论框架管理 (IP)</h3>
                </div>
                <button
                  onClick={openFrameworkFilePicker}
                  disabled={!isLocalMode}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition shadow-sm ${
                    isLocalMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <UploadCloud size={14} /> 导入新框架
                </button>
              </div>
              <div className="p-6 flex-1 bg-gray-50/50">
                <div className="mb-4 rounded-lg border border-dashed border-purple-200 bg-white px-4 py-3 text-sm text-purple-800">
                  {isLocalMode
                    ? '这里已经支持把机构自有框架元数据写入本地数据库；如果还没有上传任何方法论文档，会保持空列表。'
                    : '这块当前还没有专属云端框架库；若未接本地数据，就不会再展示默认机构框架。'}
                </div>
                
                {strategy === 'public' && (
                  <div className="mb-4 flex items-start gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200 text-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    您当前选择了“通用公开模式”，自有框架的调用优先级将被降低。
                  </div>
                )}

                {proprietaryFrameworks.length > 0 ? (
                  <div className="space-y-3">
                    {proprietaryFrameworks.map((item, index) => (
                      <ProprietaryItem
                        key={item.id || item.title}
                        framework={item}
                        index={index}
                        total={proprietaryFrameworks.length}
                        title={item.title}
                        date={item.date}
                        enabled={item.enabled !== false}
                        onOpen={() => setSelectedFramework({
                          title: item.title,
                          desc: item.desc || item.extractSummary || '机构自有方法论',
                          dimensions: item.dimensions || [],
                          application: item.application || '激活后将作为机构自有框架优先参与诊断与撰写。',
                          sourceType: item.sourceType,
                          sourcePath: item.sourcePath,
                          preview: item.preview,
                          extractSummary: item.extractSummary,
                          isCustom: true,
                        })}
                        onToggle={isLocalMode ? () => toggleProprietaryFramework(item.id) : undefined}
                        onMoveUp={isLocalMode ? () => moveProprietaryFramework(item.id, 'up') : undefined}
                        onMoveDown={isLocalMode ? () => moveProprietaryFramework(item.id, 'down') : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-purple-200 bg-white px-5 py-8 text-center text-sm text-purple-800">
                    当前还没有机构自有框架。可上传本地方法论文档后，再在这里查看、启停和调整优先级。
                  </div>
                )}
                
                <div
                  className="mt-6 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 bg-white hover:bg-gray-50 hover:border-blue-400 transition cursor-pointer"
                  onClick={openFrameworkFilePicker}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (!file) {
                      return;
                    }
                    setImportedFrameworkFile({
                      name: file.name,
                      path: file.path || '',
                      size: file.size,
                    });
                    setCustomFrameworkForm({
                      title: file.name.replace(/\.[^.]+$/, ''),
                      desc: inferFrameworkDescription(file.name),
                    });
                    setCreateFrameworkOpen(true);
                  }}
                >
                  <UploadCloud size={32} className="mb-2 text-gray-400" />
                  <p className="text-sm font-bold text-gray-700">拖拽或点击上传内部培训手册/方法论文档</p>
                  <p className="text-xs mt-1">支持 PDF, PPT, Word 等格式，AI 将自动提炼结构作为私有判断框架</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- Framework Detail Modal (Floating Layer) --- */}
      {selectedFramework && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedFramework(null)}></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all animate-fade-in-up">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="text-blue-600" size={20}/>
                {selectedFramework.title}
              </h3>
              <button onClick={() => setSelectedFramework(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Introduction */}
              <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                {selectedFramework.desc}
              </p>

              {selectedFramework.extractSummary ? (
                <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50 px-4 py-4">
                  <div className="text-sm font-semibold text-purple-900">本地提炼摘要</div>
                  <p className="mt-2 text-sm leading-relaxed text-purple-800">{selectedFramework.extractSummary}</p>
                  {selectedFramework.sourceType || selectedFramework.sourcePath ? (
                    <div className="mt-3 space-y-1 text-xs text-purple-700">
                      {selectedFramework.sourceType ? <p>来源格式：{selectedFramework.sourceType}</p> : null}
                      {selectedFramework.sourcePath ? <p className="break-all">来源路径：{selectedFramework.sourcePath}</p> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Visualization Placeholder */}
              <div className="w-full h-48 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center mb-8 relative overflow-hidden group">
                {selectedFramework.imageUrl ? (
                  <>
                     <div className="absolute inset-0 bg-white opacity-90 mix-blend-overlay"></div>
                     <p className="text-gray-400 font-medium z-10 flex items-center gap-2">
                       <ImageIcon size={20} />
                       框架结构图谱可视化
                     </p>
                  </>
                ) : (
                  <p className="text-gray-400 font-medium flex items-center gap-2"><ImageIcon size={20} /> 模型结构图谱可视化</p>
                )}
              </div>

              {/* Dimensions */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 mb-3 border-l-4 border-blue-500 pl-2">包含诊断维度</h4>
                {selectedFramework.dimensions && selectedFramework.dimensions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedFramework.dimensions.map((dim, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
                        {dim}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                    当前还没有可展示的结构化维度信息，后续接入 framework registry / 文档提炼能力后会在这里呈现。
                  </div>
                )}
              </div>

              {/* AI Application Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                  <Info size={18} />
                  企数睿思 AI 调用场景说明
                </h4>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  {selectedFramework.application}
                </p>
              </div>

              {selectedFramework.preview ? (
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    文档预览摘录
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {selectedFramework.preview}
                  </p>
                </div>
              ) : null}

            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
               <button 
                 onClick={() => setSelectedFramework(null)}
                 className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
               >
                 确认并关闭
               </button>
            </div>
          </div>
        </div>
      )}

      {createFrameworkOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setCreateFrameworkOpen(false)}></div>
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">新增机构自有框架</h3>
              <button onClick={() => setCreateFrameworkOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">框架名称</span>
                <input
                  value={customFrameworkForm.title}
                  onChange={(event) => setCustomFrameworkForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-purple-500"
                  placeholder="例如：销售驾驶舱经营诊断模型"
                />
              </label>
              {importedFrameworkFile ? (
                <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                  <div className="font-semibold">已选择本地方法论文档</div>
                  <div className="mt-1 break-all text-xs">{importedFrameworkFile.path || importedFrameworkFile.name}</div>
                </div>
              ) : null}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">简要说明</span>
                <textarea
                  rows={4}
                  value={customFrameworkForm.desc}
                  onChange={(event) => setCustomFrameworkForm((current) => ({ ...current, desc: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-purple-500"
                  placeholder="描述这个方法论主要适用于哪些业务诊断场景"
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setCreateFrameworkOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
                <button onClick={handleCreateFramework} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 inline-flex items-center gap-2">
                  <Plus size={14} />
                  保存框架
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={frameworkFileInputRef}
        type="file"
        className="hidden"
        onChange={handleFrameworkFileSelected}
      />

    </div>
  );
}

// Sub components

function StrategyCard({ id, current, onClick, title, desc, icon }) {
  const active = current === id;
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
        active 
          ? 'border-blue-600 bg-blue-50/30 shadow-md ring-1 ring-blue-600' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {icon}
        </div>
        {active && <CheckCircle2 className="text-blue-600" size={20} />}
      </div>
      <h4 className={`font-bold text-base mb-2 ${active ? 'text-blue-900' : 'text-gray-900'}`}>{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function FrameworkToggle({ title, desc, active, onToggle, onClick }) {
  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-white hover:shadow-sm hover:border-gray-300 border border-transparent rounded-lg transition group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-[15px] font-bold text-gray-900 group-hover:text-blue-700 transition">{title}</h4>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">点击查看详情</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
      <div 
        className={`ml-4 transition-colors ${active ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 hover:text-gray-400'}`}
        onClick={onToggle}
      >
        {active ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
      </div>
    </div>
  );
}

function ProprietaryItem({ framework, index, total, title, date, enabled = true, onOpen, onToggle, onMoveUp, onMoveDown }) {
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center gap-3 group hover:border-purple-300 transition">
      <button type="button" className="flex items-center gap-3 text-left flex-1 min-w-0" onClick={onOpen}>
        <div className="bg-purple-100 text-purple-600 p-1.5 rounded">
          <BookOpen size={16} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-800 group-hover:text-purple-700 transition">{title}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">{date}</p>
          {framework?.extractSummary ? (
            <p className="mt-1 truncate text-xs text-gray-500">{framework.extractSummary}</p>
          ) : null}
        </div>
      </button>
      <div className="flex items-center gap-2 shrink-0">
        <div className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded ${
          enabled
            ? 'text-emerald-500 bg-emerald-50'
            : 'text-gray-400 bg-gray-100'
        }`}>
          <CheckCircle2 size={12} /> {enabled ? '优先调用' : '未启用'}
        </div>
        {onMoveUp ? (
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
          >
            <ArrowUp size={14} />
          </button>
        ) : null}
        {onMoveDown ? (
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
          >
            <ArrowDown size={14} />
          </button>
        ) : null}
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            {enabled ? '停用' : '启用'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// Missing icon fix removed

function BrainIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  );
}

function SnapshotCard({ title, value }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-2 text-sm font-semibold text-gray-900 break-all">{value}</div>
    </div>
  );
}
