import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Database,
  Download,
  HardDrive,
  Search,
  Settings,
  UploadCloud,
  Cpu,
  Filter,
  FileText,
  PlayCircle,
  Save,
} from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { useAppShell } from '../AppShellContext';
import { useSdkViewData } from '../hooks/useSdkViewData';
import {
  deleteKnowledgeDocument,
  loadAssetsSnapshot,
  persistKnowledgeDocument,
  reindexKnowledgeDocument,
} from '../sdk/api';

const emptyAssetsSnapshot = {
  title: '资产管理',
  runtimeLabel: 'OpenClaw',
  statusLabel: 'waiting',
  onlineText: '0/0 在线',
  watchDir: '待配置',
  lastSyncAt: '',
  assetCount: 0,
  indexedCount: 0,
  processingCount: 0,
  files: [],
};

const defaultAssetForm = {
  title: '',
  summary: '',
  fileSizeMb: 10,
  watchDir: '',
  indexStatus: 'indexed',
  mimeType: 'pdf',
};

function resolveWatchDirFromPath(sourcePath) {
  if (!sourcePath) {
    return '';
  }
  const normalized = String(sourcePath).replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index > 0 ? normalized.slice(0, index) : '';
}

function inferMimeTypeFromFile(file) {
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return 'ppt';
  }
  if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a')) {
    return 'audio';
  }
  if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
    return 'excel';
  }
  if (name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.txt') || name.endsWith('.md')) {
    return 'doc';
  }
  return 'pdf';
}

function downloadAssetSummary(file) {
  const content = [
    `# ${file.name}`,
    '',
    `格式：${file.type}`,
    `状态：${file.status}`,
    `大小：${file.size}`,
    `加入时间：${file.time}`,
    '',
    `摘要：${file.summary || '暂无摘要说明。'}`,
    '',
    `本地路径：${file.sourcePath || '未记录'}`,
  ].join('\n');

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${file.name.replace(/[\\/:*?"<>|]/g, '_')}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Assets() {
  const { confirmSensitiveAction, navigateTo, pushDesktopNotification, pushToast } = useAppShell();
  const fileInputRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingLocalFile, setPendingLocalFile] = useState(null);
  const [assetFormSeed, setAssetFormSeed] = useState(defaultAssetForm);
  const [statusFilter, setStatusFilter] = useState('all');
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const loader = useCallback(() => {
    void refreshKey;
    return loadAssetsSnapshot();
  }, [refreshKey]);
  const { data, error, source } = useSdkViewData(loader);
  const assets = data || emptyAssetsSnapshot;
  const assetFiles = useMemo(() => (Array.isArray(assets.files) ? assets.files : []), [assets.files]);
  const isLocalMode = source === 'local';
  const isSdkMode = source === 'sdk';
  const isUploadSupported = isLocalMode || isSdkMode;
  const summaryCards = useMemo(() => {
    return [
      {
        label: '在线设备',
        value: assets.onlineText,
        sub: '来自 deviceCenter.loadOverview()',
        color: 'blue',
      },
      {
        label: '已索引资产',
        value: `${assets.indexedCount || 0} 项`,
        sub: '来自 knowledgeCenter.loadHome()',
        color: 'purple',
      },
      {
        label: '处理中资产',
        value: `${assets.processingCount || 0} 项`,
        sub: '仅展示真实索引状态，不展示推导百分比',
        color: 'emerald',
      },
      {
        label: '安全私有存储',
        value: `${assets.assetCount || assetFiles.length} 项资产`,
        sub: isLocalMode ? '本地知识资产视图' : 'Knowledge Center 真实视图',
        color: 'orange',
      },
    ];
  }, [assetFiles.length, assets, isLocalMode]);

  const isRuntimeOnline = useMemo(() => {
    const onlineText = String(assets.onlineText || '');
    const matched = onlineText.match(/^(\d+)\s*\/\s*(\d+)/);
    if (matched) {
      return Number(matched[1]) > 0;
    }
    return ['online', 'ready', 'running'].includes(String(assets.statusLabel || '').toLowerCase());
  }, [assets.onlineText, assets.statusLabel]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) {
      return statusFilter === 'all' ? assetFiles : assetFiles.filter((item) => item.status === statusFilter);
    }
    return assetFiles.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [assetFiles, searchTerm, statusFilter]);

  const handleSaveAsset = useCallback(async (form) => {
    try {
      const targetLabel = isLocalMode ? '正在上传到本地 QeeClaw 知识库...' : '正在上传知识文件到平台知识库...';
      setSaveState({ status: 'saving', message: targetLabel });
      await persistKnowledgeDocument({
        title: form.title,
        summary: form.summary,
        watchDir: form.watchDir,
        indexStatus: form.indexStatus,
        mimeType: form.mimeType,
        fileSize: Number(form.fileSizeMb || 0) * 1024 * 1024,
        file: pendingLocalFile?.rawFile,
        filename: form.title,
        contentType: pendingLocalFile?.contentType,
        sourceName: form.title,
        sourcePath: pendingLocalFile?.sourcePath || null,
      });
      const successMessage = isLocalMode
        ? `文件「${form.title}」已写入本地 QeeClaw 知识库。`
        : `文件「${form.title}」已上传到知识库，正在等待索引。`;
      setSaveState({ status: 'saved', message: successMessage });
      setAssetModalOpen(false);
      setPendingLocalFile(null);
      setAssetFormSeed(defaultAssetForm);
      setRefreshKey((current) => current + 1);
      if (isLocalMode) {
        pushDesktopNotification(
          '本地知识入库完成',
          `文件「${form.title}」已经写入本地 QeeClaw 知识库，可继续用于检索与撰写。`,
          'assetComplete',
        );
        pushToast(`文件「${form.title}」已完成本地知识入库`, 'success');
      } else {
        pushDesktopNotification(
          '知识文件已提交',
          `文件「${form.title}」已经上传到平台知识库，等待索引完成后即可检索。`,
          'assetComplete',
        );
        pushToast(`文件「${form.title}」已提交到知识库`, 'success');
      }
    } catch (submitError) {
      setSaveState({ status: 'error', message: submitError.message || '登记资产失败。' });
    }
  }, [isLocalMode, pendingLocalFile, pushDesktopNotification, pushToast]);

  const handleReindexAsset = useCallback(async (file) => {
    try {
      setSaveState({ status: 'saving', message: `正在重新索引资产「${file.name}」...` });
      await reindexKnowledgeDocument(file.id);
      setSelectedFile(null);
      setRefreshKey((current) => current + 1);
      setSaveState({ status: 'saved', message: `资产「${file.name}」已重新建立本地索引。` });
      pushDesktopNotification(
        '资产重新索引完成',
        `资产「${file.name}」已经完成本地重新索引。`,
        'assetComplete',
      );
      pushToast(`已重新索引「${file.name}」`, 'success');
    } catch (submitError) {
      setSaveState({ status: 'error', message: submitError.message || '重新索引失败。' });
    }
  }, [pushDesktopNotification, pushToast]);

  const handleDeleteAsset = useCallback(async (file) => {
    const confirmed = await confirmSensitiveAction({
      title: `确认删除本地资产「${file.name}」？`,
      description: '删除后会从本地知识库中移除这份资产元数据，当前动作无法自动恢复。',
      confirmLabel: '确认删除',
    });
    if (!confirmed) {
      return;
    }

    try {
      setSaveState({ status: 'saving', message: `正在删除资产「${file.name}」...` });
      await deleteKnowledgeDocument(file.id);
      setSelectedFile(null);
      setRefreshKey((current) => current + 1);
      setSaveState({ status: 'saved', message: `资产「${file.name}」已从本地数据库移除。` });
      pushToast(`已删除「${file.name}」`, 'success');
    } catch (submitError) {
      setSaveState({ status: 'error', message: submitError.message || '删除资产失败。' });
    }
  }, [confirmSensitiveAction, pushToast]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const sourcePath = file.path || '';
    const seed = {
      title: file.name,
      summary: `从本机导入资产：${file.name}`,
      fileSizeMb: Math.max(0.1, Number((file.size / (1024 * 1024)).toFixed(2))),
      watchDir: resolveWatchDirFromPath(sourcePath),
      indexStatus: 'indexed',
      mimeType: inferMimeTypeFromFile(file),
    };

    setPendingLocalFile({
      name: file.name,
      sizeLabel: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      rawFile: file,
      contentType: file.type || 'application/octet-stream',
      sourcePath,
    });
    setAssetFormSeed(seed);
    setAssetModalOpen(true);
    pushToast(
      isLocalMode
        ? `已选择文件「${file.name}」，请确认后写入本地资产库。`
        : `已选择文件「${file.name}」，请确认后上传到知识库。`,
      'success',
    );
    event.target.value = '';
  }, [isLocalMode, pushToast]);

  useEffect(() => {
    if (!assetModalOpen) {
      setPendingLocalFile(null);
      setAssetFormSeed(defaultAssetForm);
    }
  }, [assetModalOpen]);

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">资产管理</h2>
              <DataSourceBadge
                source={source}
                error={error}
                variant="hybrid"
                label={source === 'sdk' ? 'SDK 实时 / 真实资产状态' : source === 'local' ? '本地知识资产库 / 本地设备状态' : undefined}
                title={source === 'sdk' ? '知识资产与设备在线态来自 SDK；若当前没有真实资产数据，则页面显示空态而不再展示默认文件。' : undefined}
              />
            </div>
            <p className="text-sm text-gray-500">
              当前页面已经接入 `deviceCenter.loadOverview()` 与 `knowledgeCenter.loadHome()`；
              {isLocalMode ? '本地桌面模式会直接把文件写入本地 QeeClaw 知识库。' : isSdkMode ? 'SDK 模式现已支持真实文件上传到平台知识库。' : '当前尚未接入真实资产数据。'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={16} /> 设备设置
            </button>
            <button
              className={`px-4 py-2 rounded-md font-medium text-sm transition shadow-sm flex items-center gap-2 ${
                isUploadSupported
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isUploadSupported}
              onClick={openFilePicker}
            >
              <UploadCloud size={16} />
              {isLocalMode ? '导入到本地知识库' : isSdkMode ? '上传到知识库' : '上传新资产'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
          {saveState.message ? (
            <div className={`rounded-xl px-5 py-4 text-sm ${
              saveState.status === 'error'
                ? 'border border-rose-200 bg-rose-50 text-rose-800'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              {saveState.message}
            </div>
          ) : null}

          <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Cpu size={180} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <HardDrive className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{assets.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex h-2 w-2 relative">
                        {isRuntimeOnline ? <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span> : null}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isRuntimeOnline ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                      </span>
                      <span className={`${isRuntimeOnline ? 'text-emerald-400' : 'text-amber-300'} text-xs font-bold tracking-wider`}>
                        {assets.runtimeLabel} | 状态 {assets.statusLabel} | {assets.onlineText}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">知识目录</p>
                  <p className="text-sm font-mono">{assets.watchDir || '未指定目录'}</p>
                  <p className="text-xs text-gray-500 mt-2">最近同步 {assets.lastSyncAt || '未返回'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {summaryCards.map((item) => (
                  <MetricBox
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    sub={item.sub}
                    color={item.color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Database size={18} className="text-blue-600" />
                知识资产列表
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索文件名..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 w-48"
                  />
                </div>
                <button
                  className="p-1.5 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 transition"
                  title="筛选"
                  onClick={() => {
                    const order = ['all', 'completed', 'processing', 'pending'];
                    const next = order[(order.indexOf(statusFilter) + 1) % order.length];
                    setStatusFilter(next);
                    pushToast(next === 'all' ? '已显示全部资产' : `已筛选状态：${next}`, 'info');
                  }}
                >
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white border-b border-gray-100 text-gray-500 font-medium sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3">资产名称</th>
                    <th className="px-6 py-3 w-24">格式</th>
                    <th className="px-6 py-3 w-32">索引说明</th>
                    <th className="px-6 py-3 w-40">状态</th>
                    <th className="px-6 py-3 w-32">加入时间</th>
                    <th className="px-6 py-3 w-24 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                    <FileRow key={file.id} file={file} onView={() => setSelectedFile(file)} />
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-14">
                        <div className="mx-auto max-w-xl text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Database size={24} />
                          </div>
                          <h4 className="mt-4 text-lg font-bold text-gray-900">当前还没有真实资产</h4>
                          <p className="mt-2 text-sm leading-7 text-gray-500">
                            完成平台接入后可查看真实知识资产；桌面模式下也可以直接导入本地文件。现在不会再展示默认示例文件列表。
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {assetModalOpen ? (
        <AssetModal
          mode={isLocalMode ? 'local' : isSdkMode ? 'sdk' : 'unconfigured'}
          initialForm={assetFormSeed}
          selectedFile={pendingLocalFile}
          saving={saveState.status === 'saving'}
          onPickFile={openFilePicker}
          onClose={() => setAssetModalOpen(false)}
          onSubmit={handleSaveAsset}
        />
      ) : null}

      {settingsOpen ? (
        <AssetDeviceSettingsModal
          watchDir={assets.watchDir}
          onClose={() => setSettingsOpen(false)}
          onOpenSystemSettings={() => {
            setSettingsOpen(false);
            navigateTo('settings-system', { settingsTab: 'general' });
            pushToast('已跳转到系统交互偏好页，可继续配置桌面环境。', 'success');
          }}
        />
      ) : null}

      {selectedFile ? (
        <AssetDetailModal
          file={selectedFile}
          mode={isLocalMode ? 'local' : isSdkMode ? 'sdk' : 'unconfigured'}
          onClose={() => setSelectedFile(null)}
          onDownload={() => {
            downloadAssetSummary(selectedFile);
            pushToast(`已导出资产摘要「${selectedFile.name}」`, 'success');
          }}
          onReindex={() => handleReindexAsset(selectedFile)}
          onDelete={() => handleDeleteAsset(selectedFile)}
          onUseInSearch={() => {
            const fileName = selectedFile.name;
            setSelectedFile(null);
            navigateTo('search', { query: fileName });
            pushToast(`已使用资产「${fileName}」发起检索`, 'success');
          }}
        />
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />
    </>
  );
}

function MetricBox({ label, value, sub, color }) {
  const bgColors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
      <div className="text-gray-400 text-xs mb-2 font-medium flex justify-between">{label}</div>
      <div className="text-2xl font-bold text-white mb-2">{value}</div>
      <div className={`mb-2 h-1.5 w-12 rounded-full ${bgColors[color]} opacity-80`}></div>
      <div className="text-[11px] text-gray-400">{sub}</div>
    </div>
  );
}

function FileRow({ file, onView }) {
  const { name, type, size, status, time } = file;
  const badgeClass = status === 'completed'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : status === 'processing'
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : 'bg-amber-50 text-amber-700 border-amber-100';

  return (
    <tr className="hover:bg-blue-50/30 transition group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            type === 'PDF'
              ? 'bg-red-50 text-red-500 border border-red-100'
              : type === 'PPT'
                ? 'bg-orange-50 text-orange-500 border border-orange-100'
                : type === 'AUDIO'
                  ? 'bg-purple-50 text-purple-500 border border-purple-100'
                  : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
          }`}>
            {type === 'AUDIO' ? <PlayCircle size={16} /> : <FileText size={16} />}
          </div>
          <div>
            <div className="font-medium text-gray-900 group-hover:text-blue-700 transition truncate max-w-xs">{name}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{size}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">{type}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-gray-500">
          {status === 'completed' ? '索引完成，可直接检索' : status === 'processing' ? '正在建立索引' : '等待进入索引队列'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
          {status === 'completed' ? '已完成' : status === 'processing' ? '处理中' : '排队中'}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-500">{time}</td>
      <td className="px-6 py-4 text-right">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium" onClick={onView}>查看</button>
      </td>
    </tr>
  );
}

function AssetDeviceSettingsModal({ watchDir, onClose, onOpenSystemSettings }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">设备设置</h3>
            <p className="mt-1 text-sm text-gray-500">当前先展示桌面资产目录与运行时说明，后续再补真实设备配置写入。</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">x</button>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">当前知识目录</div>
            <div className="mt-2 font-mono text-sm text-gray-900">{watchDir || '未指定目录'}</div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-800">
            当前版本的设备设置入口已经可用，但更深的设备参数保存仍建议统一放到系统设置与本地服务层中。
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">关闭</button>
            <button onClick={onOpenSystemSettings} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">前往系统设置</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDetailModal({ file, mode, onClose, onUseInSearch, onDownload, onReindex, onDelete }) {
  const isLocalMode = mode === 'local';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{file.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{isLocalMode ? '本地资产详情与下一步操作' : '知识库资产详情与下一步操作'}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">x</button>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="格式" value={file.type} />
            <DetailItem label="大小" value={file.size} />
            <DetailItem label="状态" value={file.status} />
            <DetailItem label="加入时间" value={file.time} />
          </div>
          {file.sourcePath ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">本地文件路径</div>
              <div className="mt-2 break-all font-mono text-xs text-gray-700">{file.sourcePath}</div>
            </div>
          ) : null}
          {file.summary ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">摘要说明</div>
              <div className="mt-2 text-sm text-gray-700">{file.summary}</div>
            </div>
          ) : null}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
            {isLocalMode
              ? '当前详情页已经支持重新索引、导出摘要和删除本地资产；下一步再补真实文件预览。'
              : '当前 SDK 模式下已支持查看与发起检索；服务端重建索引、删除等治理动作后续再接入。'}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button onClick={onDownload} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2">
              <Download size={14} />
              导出摘要
            </button>
            {isLocalMode ? (
              <button onClick={onReindex} className="rounded-lg border border-blue-300 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50">重新索引</button>
            ) : null}
            {isLocalMode ? (
              <button onClick={onDelete} className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50">删除资产</button>
            ) : null}
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">关闭</button>
            <button onClick={onUseInSearch} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">用此资产检索</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function AssetModal({ mode, initialForm, selectedFile, onPickFile, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(initialForm || defaultAssetForm);
  const isLocalMode = mode === 'local';
  const isSdkMode = mode === 'sdk';

  useEffect(() => {
    setForm(initialForm || defaultAssetForm);
  }, [initialForm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{isSdkMode ? '上传知识文件到平台知识库' : '上传知识文件到本地 QeeClaw 知识库'}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isSdkMode
                ? '当前会把文件直接上传到平台知识库，并进入索引队列。'
                : '当前会把文件直接写入本地 QeeClaw 知识库，并同步更新 Ruisi 本地索引视图。'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">x</button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-blue-900">{selectedFile?.name || '尚未选择本地文件'}</div>
                <div className="mt-1 text-xs text-blue-700">
                  {selectedFile?.sourcePath || (isSdkMode ? '点击右侧按钮选择文件后，会自动预填文件名与大小，并直接走平台知识库上传。' : '点击右侧按钮选择文件后，会自动预填名称、路径和大小，并直传本地 QeeClaw 知识库。')}
                </div>
              </div>
              <button
                type="button"
                onClick={onPickFile}
                className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                {selectedFile ? '重新选择文件' : '选择文件'}
              </button>
            </div>
          </div>
          <Field label={isSdkMode ? '文件名' : '资产名称'} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
          {isLocalMode ? (
            <>
              <Field label="摘要说明" textarea value={form.summary} onChange={(value) => setForm((current) => ({ ...current, summary: value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="目录" value={form.watchDir} onChange={(value) => setForm((current) => ({ ...current, watchDir: value }))} />
                <Field label="大小 (MB)" type="number" value={form.fileSizeMb} onChange={(value) => setForm((current) => ({ ...current, fileSizeMb: value }))} />
                <SelectField
                  label="格式"
                  value={form.mimeType}
                  onChange={(value) => setForm((current) => ({ ...current, mimeType: value }))}
                  options={[
                    { value: 'pdf', label: 'PDF/Word' },
                    { value: 'ppt', label: 'PPT' },
                    { value: 'audio', label: 'Audio' },
                    { value: 'excel', label: 'Excel/CSV' },
                    { value: 'doc', label: 'Doc' },
                  ]}
                />
                <SelectField
                  label="索引状态"
                  value={form.indexStatus}
                  onChange={(value) => setForm((current) => ({ ...current, indexStatus: value }))}
                  options={[
                    { value: 'indexed', label: '已索引' },
                    { value: 'processing', label: '处理中' },
                    { value: 'pending', label: '排队中' },
                  ]}
                />
              </div>
            </>
          ) : null}
          {isSdkMode ? (
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="文件大小" value={selectedFile?.sizeLabel || `${form.fileSizeMb} MB`} />
              <DetailItem label="文件类型" value={(selectedFile?.contentType || 'application/octet-stream').replace(/^application\//, '')} />
            </div>
          ) : null}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button
              onClick={() => onSubmit(form)}
              disabled={saving || !form.title.trim() || !selectedFile}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2"><Save size={14} /> {saving ? '保存中...' : isSdkMode ? '上传到知识库' : '写入本地知识库'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea = false, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {textarea ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
        />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </label>
  );
}
