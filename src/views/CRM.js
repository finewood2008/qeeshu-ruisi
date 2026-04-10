import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  BrainCircuit,
  ChevronRight,
  Download,
  Plus,
  Save,
  Search,
} from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { useAppShell } from '../AppShellContext';
import { useSdkViewData } from '../hooks/useSdkViewData';
import { canUseBrowserBusinessData, shouldUseDesktopBusinessData } from '../sdk/runtime';
import {
  loadCrmSnapshot,
  persistCrmCustomer,
  persistCrmOpportunity,
} from '../sdk/api';

const defaultCustomerForm = {
  id: '',
  name: '',
  industry: '',
  owner: '',
  status: '稳定推进',
  healthScore: 80,
  phone: '',
  email: '',
  address: '',
  description: '',
  aiDiagnosis: '',
};

const defaultOpportunityForm = {
  id: '',
  customerId: '',
  title: '',
  stage: 'proposal',
  amount: 0,
  probability: 50,
  owner: '',
  nextAction: '',
  expectedCloseAt: '',
};

function downloadCrmAssetSummary(client, asset) {
  const content = [
    `# ${asset.name}`,
    '',
    `客户：${client.name}`,
    `行业：${client.industry}`,
    `资产类型：${asset.type}`,
    '',
    `资产说明：该资产当前来自企数睿思本地 CRM 视图，可继续在知识检索页中做相似案例追问与复用。`,
  ].join('\n');

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${asset.name.replace(/[\\/:*?"<>|]/g, '_')}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildCustomerForm(client) {
  if (!client) {
    return defaultCustomerForm;
  }
  return {
    id: client.id || '',
    name: client.name || '',
    industry: client.industry || '',
    owner: client.contact?.name || '',
    status: client.status || '稳定推进',
    healthScore: Number(client.score || 80),
    phone: client.contact?.phone || '',
    email: client.contact?.email || '',
    address: client.address || '',
    description: client.description || '',
    aiDiagnosis: client.aiDiagnosis || '',
  };
}

function buildOpportunityForm(customerId) {
  return {
    ...defaultOpportunityForm,
    customerId,
  };
}

export default function CRM() {
  const { navigateTo, pushNotificationEvent, pushToast } = useAppShell();
  const [refreshKey, setRefreshKey] = useState(0);
  const loader = useCallback(() => {
    void refreshKey;
    return loadCrmSnapshot();
  }, [refreshKey]);
  const { data, error, source } = useSdkViewData(loader, {
    allowOfflineLoad: canUseBrowserBusinessData(),
    offlineSource: 'browser',
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [assetModal, setAssetModal] = useState({ open: false, client: null, asset: null });
  const [customerModal, setCustomerModal] = useState({ open: false, initial: defaultCustomerForm });
  const [opportunityModal, setOpportunityModal] = useState({ open: false, initial: defaultOpportunityForm });
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });

  const canManageLocalCrm = shouldUseDesktopBusinessData() || canUseBrowserBusinessData();
  const isSdkAggregateView = source === 'sdk';
  const clients = useMemo(() => {
    if (data?.clients?.length) {
      return data.clients;
    }
    return [];
  }, [data]);
  const stats = data?.stats || {
    healthy: clients.filter((item) => item.score >= 80).length,
    renew: clients.filter((item) => item.score >= 70 && item.score < 80).length,
    warning: clients.filter((item) => item.score < 70).length,
  };
  const statLabels = isSdkAggregateView
    ? { healthy: '稳定跟进', renew: '需重点跟进', warning: '高风险客户' }
    : { healthy: '健康度良好', renew: '需关注续约', warning: '经营健康度预警' };

  useEffect(() => {
    if (!selectedClient) {
      return;
    }
    const matched = clients.find((item) => item.id === selectedClient.id);
    if (matched) {
      setSelectedClient(matched);
    }
  }, [clients, selectedClient]);

  const handleCustomerSubmit = useCallback(async (formData) => {
    try {
      setSaveState({ status: 'saving', message: '正在保存客户资料...' });
      const saved = await persistCrmCustomer(formData);
      setSaveState({ status: 'saved', message: `客户「${saved.name}」已保存到本地数据库。` });
      setCustomerModal({ open: false, initial: defaultCustomerForm });
      setRefreshKey((current) => current + 1);
      pushNotificationEvent(
        `客户「${saved.name}」已保存`,
        '客户主数据、联系人和诊断摘要已经写入本地 CRM 数据库。',
        'success',
      );
      pushToast(`客户「${saved.name}」已保存`, 'success', { recordEvent: false });
    } catch (submitError) {
      setSaveState({ status: 'error', message: submitError.message || '保存客户资料失败。' });
    }
  }, [pushNotificationEvent, pushToast]);

  const handleOpportunitySubmit = useCallback(async (formData) => {
    try {
      setSaveState({ status: 'saving', message: '正在创建本地商机...' });
      await persistCrmOpportunity({
        ...formData,
        probability: Number(formData.probability) / 100,
      });
      setSaveState({ status: 'saved', message: '商机项目已写入本地数据库。' });
      setOpportunityModal({ open: false, initial: defaultOpportunityForm });
      setRefreshKey((current) => current + 1);
      pushNotificationEvent(
        `商机「${formData.title}」已创建`,
        '商机阶段、金额和下一步动作已经写入本地 CRM 数据库。',
        'success',
      );
      pushToast(`商机「${formData.title}」已创建`, 'success', { recordEvent: false });
    } catch (submitError) {
      setSaveState({ status: 'error', message: submitError.message || '保存商机失败。' });
    }
  }, [pushNotificationEvent, pushToast]);

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        source={source}
        canManageLocalCrm={canManageLocalCrm}
        onBack={() => setSelectedClient(null)}
        onEdit={() => setCustomerModal({ open: true, initial: buildCustomerForm(selectedClient) })}
        onCreateOpportunity={() => setOpportunityModal({ open: true, initial: buildOpportunityForm(selectedClient.id) })}
        onCreateSolution={() => {
          navigateTo('write', {
            writerImport: {
              title: `${selectedClient.name} 专属解决方案大纲`,
              summary: selectedClient.aiDiagnosis,
              highlight: `客户状态：${selectedClient.status}`,
            },
          });
          pushNotificationEvent(
            `已为客户「${selectedClient.name}」创建方案入口`,
            '客户诊断摘要已带入撰写助手，可继续生成专属解决方案大纲。',
            'success',
          );
          pushToast(`已基于客户「${selectedClient.name}」跳转到撰写助手`, 'success', { recordEvent: false });
        }}
        onViewCases={() => {
          navigateTo('search', { query: `${selectedClient.name} ${selectedClient.industry}` });
          pushNotificationEvent(
            `已为客户「${selectedClient.name}」打开相似案例检索`,
            '已跳转到知识检索页，并自动带入客户名称和行业关键字。',
            'info',
          );
          pushToast(`已为客户「${selectedClient.name}」打开相似案例检索`, 'success', { recordEvent: false });
        }}
        onViewAllAssets={() => {
          navigateTo('search', { query: `${selectedClient.name} 核心知识资产` });
          pushNotificationEvent(
            `已查看客户「${selectedClient.name}」资产`,
            '已跳转到知识检索页查看该客户相关资产。',
            'info',
          );
          pushToast(`已为客户「${selectedClient.name}」打开资产检索`, 'success', { recordEvent: false });
        }}
        onOpenAsset={(asset) => setAssetModal({ open: true, client: selectedClient, asset })}
        onDownloadAsset={(asset) => {
          downloadCrmAssetSummary(selectedClient, asset);
          pushNotificationEvent(
            `已导出 CRM 资产摘要「${asset.name}」`,
            `客户：${selectedClient.name}，资产摘要已导出为本地 Markdown 文件。`,
            'success',
          );
          pushToast(`已导出资产摘要「${asset.name}」`, 'success', { recordEvent: false });
        }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">融合客户管理 (Smart CRM)</h2>
              <DataSourceBadge
                source={source}
                error={error}
                variant="hybrid"
                label={
                  source === 'sdk'
                    ? 'SDK 组合客户视图'
                    : source === 'local'
                      ? '本地 CRM 业务数据'
                      : source === 'browser'
                        ? '浏览器本地 CRM 开发数据'
                        : undefined
                }
                title={
                  source === 'sdk'
                    ? 'CRM 列表当前由会话、跟进与商机数据组合生成，用于客户接入前快速查看业务聚合视图。'
                    : source === 'browser'
                      ? '当前数据来自浏览器本地开发存储，仅在开发模式下启用，方便测试新增客户、编辑资料与新建商机。'
                      : undefined
                }
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isSdkAggregateView ? '基于会话、跟进与审批结果的客户聚合视图' : '基于业务数据与历史交付记录的健康度实时监控'}
            </p>
          </div>
          <button
            className={`px-4 py-2 rounded-md font-medium text-sm transition shadow-sm flex items-center gap-2 ${
              canManageLocalCrm
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canManageLocalCrm}
            onClick={() => setCustomerModal({ open: true, initial: defaultCustomerForm })}
          >
            <Plus size={16} />
            {canManageLocalCrm ? '导入新客户' : '仅桌面版支持导入'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {data?.note ? (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
              {data.note}
            </div>
          ) : null}

          {saveState.message ? (
            <div className={`mb-6 rounded-xl px-5 py-4 text-sm ${
              saveState.status === 'error'
                ? 'border border-rose-200 bg-rose-50 text-rose-800'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              {saveState.message}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-6 mb-8">
            <StatCard title={statLabels.healthy} value={stats.healthy} unit="家" tone="emerald" />
            <StatCard title={statLabels.renew} value={stats.renew} unit="家" tone="yellow" />
            <div className="bg-red-50 border border-red-100 p-5 rounded-xl flex justify-between items-end">
              <div>
                <h4 className="text-red-800 text-sm font-medium mb-1">{statLabels.warning}</h4>
                <p className="text-3xl font-bold text-red-600">{stats.warning} <span className="text-sm font-normal text-red-700">家</span></p>
              </div>
              <AlertTriangle className="text-red-300 mb-1" size={32} />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-medium">
                <tr>
                  <th className="px-6 py-4">客户名称</th>
                  <th className="px-6 py-4">所属行业</th>
                  <th className="px-6 py-4">历史项目数</th>
                  <th className="px-6 py-4">{isSdkAggregateView ? '跟进等级' : '健康度评分'}</th>
                  <th className="px-6 py-4">AI 状态诊断</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {clients.length > 0 ? clients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    source={source}
                    onClick={() => setSelectedClient(client)}
                  />
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-14">
                      <div className="mx-auto max-w-xl text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <Briefcase size={24} />
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-gray-900">当前还没有客户数据</h4>
                        <p className="mt-2 text-sm leading-7 text-gray-500">
                          接入真实平台后可展示真实客户视图；桌面模式和浏览器开发模式下也可以直接导入新客户并创建商机。
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

      {customerModal.open ? (
        <CustomerModal
          initialData={customerModal.initial}
          saving={saveState.status === 'saving'}
          onClose={() => setCustomerModal({ open: false, initial: defaultCustomerForm })}
          onSubmit={handleCustomerSubmit}
        />
      ) : null}

      {opportunityModal.open ? (
        <OpportunityModal
          initialData={opportunityModal.initial}
          saving={saveState.status === 'saving'}
          onClose={() => setOpportunityModal({ open: false, initial: defaultOpportunityForm })}
          onSubmit={handleOpportunitySubmit}
        />
      ) : null}

      {assetModal.open && assetModal.client && assetModal.asset ? (
        <CrmAssetModal
          client={assetModal.client}
          asset={assetModal.asset}
          onClose={() => setAssetModal({ open: false, client: null, asset: null })}
          onSearch={() => {
            navigateTo('search', { query: `${assetModal.client.name} ${assetModal.asset.name}` });
            setAssetModal({ open: false, client: null, asset: null });
            pushNotificationEvent(
              `已使用 CRM 资产「${assetModal.asset.name}」发起检索`,
              `客户：${assetModal.client.name}，已自动跳转到知识检索页。`,
              'success',
            );
            pushToast(`已使用资产「${assetModal.asset.name}」发起检索`, 'success', { recordEvent: false });
          }}
          onImportToWriter={() => {
            navigateTo('write', {
              writerImport: {
                title: assetModal.asset.name,
                summary: `${assetModal.client.name} / ${assetModal.asset.type} 资产摘要`,
                highlight: `来自 CRM 资产中心，适合复用到客户方案撰写中。`,
              },
            });
            setAssetModal({ open: false, client: null, asset: null });
            pushNotificationEvent(
              `已把 CRM 资产「${assetModal.asset.name}」导入撰写助手`,
              `客户：${assetModal.client.name}，资产摘要已进入写作工作流。`,
              'success',
            );
            pushToast(`已把资产「${assetModal.asset.name}」导入撰写助手`, 'success', { recordEvent: false });
          }}
          onDownload={() => {
            downloadCrmAssetSummary(assetModal.client, assetModal.asset);
            pushNotificationEvent(
              `已导出 CRM 资产摘要「${assetModal.asset.name}」`,
              `客户：${assetModal.client.name}，摘要已导出为本地 Markdown 文件。`,
              'success',
            );
            pushToast(`已导出资产摘要「${assetModal.asset.name}」`, 'success', { recordEvent: false });
          }}
        />
      ) : null}
    </>
  );
}

function StatCard({ title, value, unit, tone }) {
  const styles = {
    emerald: {
      box: 'bg-emerald-50 border-emerald-100',
      title: 'text-emerald-800',
      value: 'text-emerald-600',
    },
    yellow: {
      box: 'bg-yellow-50 border-yellow-100',
      title: 'text-yellow-800',
      value: 'text-yellow-600',
    },
  };
  const palette = styles[tone];

  return (
    <div className={`${palette.box} border p-5 rounded-xl`}>
      <h4 className={`${palette.title} text-sm font-medium mb-1`}>{title}</h4>
      <p className={`${palette.value} text-3xl font-bold`}>{value} <span className={`text-sm font-normal ${palette.title}`}>{unit}</span></p>
    </div>
  );
}

function ClientRow({ client, source, onClick }) {
  const { name, industry, projectsCount, score, trend, status, highlight, riskLabel, riskLevel } = client;
  const isSdkAggregateView = source === 'sdk' && !Number.isFinite(Number(score));
  const riskBadgeClass = riskLevel === 'critical'
    ? 'bg-red-100 text-red-700'
    : riskLevel === 'high'
      ? 'bg-amber-100 text-amber-700'
      : riskLevel === 'medium'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-emerald-100 text-emerald-700';
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-blue-50 cursor-pointer transition ${highlight ? 'bg-red-50/20' : ''}`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs ${highlight ? 'bg-red-400' : 'bg-blue-600'}`}>
            {name.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4">{industry}</td>
      <td className="px-6 py-4">{projectsCount} 个</td>
      <td className="px-6 py-4">
        {isSdkAggregateView ? (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${riskBadgeClass}`}>
            {riskLabel || '稳定跟进'}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-base ${
              Number(score) >= 80 ? 'text-emerald-600' : Number(score) >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>{score}</span>
            {trend === 'up' && <TrendingUp size={16} className="text-emerald-500" />}
            {trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
            {trend === 'stable' && <span className="text-gray-400 text-xs">-</span>}
          </div>
        )}
      </td>
      <td className="px-6 py-4 max-w-xs truncate text-gray-500" title={status}>
        {status}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-1 text-gray-400 hover:text-blue-600 transition">
          <ChevronRight size={18} />
        </button>
      </td>
    </tr>
  );
}

function ClientDetail({
  client,
  source,
  onBack,
  onEdit,
  onCreateOpportunity,
  onCreateSolution,
  onViewCases,
  onViewAllAssets,
  onOpenAsset,
  onDownloadAsset,
  canManageLocalCrm,
}) {
  const hasHealthScore = Number.isFinite(Number(client.score));
  const isWarning = hasHealthScore
    ? Number(client.score) < 70
    : ['critical', 'high'].includes(String(client.riskLevel || ''));
  const riskBadgeClass = client.riskLevel === 'critical'
    ? 'bg-red-100 text-red-700'
    : client.riskLevel === 'high'
      ? 'bg-amber-100 text-amber-700'
      : client.riskLevel === 'medium'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden">
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">{client.industry}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">客户档案 & 智能化洞察</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              canManageLocalCrm
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canManageLocalCrm}
            onClick={onEdit}
          >
            编辑资料
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition shadow-sm ${
              canManageLocalCrm
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canManageLocalCrm}
            onClick={onCreateOpportunity}
          >
            新建商机项目
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
          <div className="col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-4">{hasHealthScore ? '综合经营健康度' : '当前跟进等级'}</h3>
              {hasHealthScore ? (
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className={`text-6xl font-black ${isWarning ? 'text-red-500' : 'text-emerald-500'}`}>
                    {client.score}
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-500">/ 100</span>
                    {client.trend === 'up' && <span className="text-xs font-bold text-emerald-500 flex items-center"><TrendingUp size={12} className="mr-1" /> 提升</span>}
                    {client.trend === 'down' && <span className="text-xs font-bold text-red-500 flex items-center"><TrendingDown size={12} className="mr-1" /> 下降</span>}
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex flex-col items-center gap-3">
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${riskBadgeClass}`}>
                    {client.riskLabel || '稳定跟进'}
                  </span>
                  <div className="text-xs text-gray-500">最近活跃：{client.recentActivity || '未返回'}</div>
                  <div className="text-xs text-gray-500">当前视图：{source === 'sdk' ? 'SDK 客户聚合视图' : '本地 CRM'}</div>
                </div>
              )}
              <p className={`text-sm mt-4 font-medium px-4 py-2 rounded-lg ${isWarning ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {client.status}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">企业信息</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{client.description}</p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <span className="text-gray-700">{client.address}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Briefcase size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <span className="block text-gray-900 font-medium">{client.contact.name} ({client.contact.role})</span>
                    <span className="block text-gray-500 mt-1 flex items-center gap-1"><Phone size={12} /> {client.contact.phone}</span>
                    <span className="block text-gray-500 mt-1 flex items-center gap-1"><Mail size={12} /> {client.contact.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-8 space-y-6">
            <div className={`p-6 rounded-xl border shadow-sm ${isWarning ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`flex items-center gap-2 font-bold mb-3 ${isWarning ? 'text-red-800' : 'text-blue-800'}`}>
                <BrainCircuit size={20} />
                企数睿思 深度诊断与策略建议
              </div>
              <p className={`text-sm leading-relaxed ${isWarning ? 'text-red-900' : 'text-blue-900'}`}>
                {client.aiDiagnosis}
              </p>
              <div className="mt-4 pt-4 border-t border-black/10 flex gap-3">
                <button
                  className={`px-4 py-2 rounded shadow-sm text-sm font-medium transition ${isWarning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  onClick={onCreateSolution}
                >
                  生成专属解决方案大纲
                </button>
                <button
                  className={`px-4 py-2 rounded border text-sm font-medium transition ${isWarning ? 'border-red-300 text-red-700 hover:bg-red-100' : 'border-blue-300 text-blue-700 hover:bg-blue-100'}`}
                  onClick={onViewCases}
                >
                  查看相关历史相似案例
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" /> 历史与当前项目
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{client.projects.length} 个</span>
                </div>
                <div className="space-y-4">
                  {client.projects.map((proj, index) => (
                    <div key={`${proj.name}-${index}`} className="border-l-2 border-blue-500 pl-3 py-1">
                      <h4 className="text-sm font-medium text-gray-900">{proj.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-gray-500">{proj.date}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          proj.status === '已结项'
                            ? 'bg-gray-100 text-gray-600'
                            : proj.status === '临近到期'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>{proj.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" /> 核心知识资产
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={onViewAllAssets}
                  >
                    查看全部
                  </button>
                </div>
                <div className="space-y-3">
                  {client.assets.map((asset, index) => (
                    <div
                      key={`${asset.name}-${index}`}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition group cursor-pointer"
                      onClick={() => onOpenAsset(asset)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          asset.type === 'PDF'
                            ? 'bg-red-100 text-red-600'
                            : asset.type === 'PPT'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-purple-100 text-purple-600'
                        }`}>
                          {asset.type}
                        </div>
                        <span className="text-sm text-gray-700 truncate">{asset.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDownloadAsset(asset);
                        }}
                        className="text-gray-400 opacity-0 group-hover:opacity-100 transition hover:text-blue-600"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerModal({ initialData, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(initialData);

  return (
    <ModalShell
      title={form.id ? '编辑客户资料' : '导入新客户'}
      subtitle="支持手工录入客户主数据，联系人与 AI 诊断将保存到本地 SQLite。"
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="客户名称" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
        <Field label="所属行业" value={form.industry} onChange={(value) => setForm((current) => ({ ...current, industry: value }))} />
        <Field label="联系人" value={form.owner} onChange={(value) => setForm((current) => ({ ...current, owner: value }))} />
        <Field label="客户状态" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} />
        <Field label="联系电话" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
        <Field label="邮箱" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
        <Field label="健康度评分" type="number" value={form.healthScore} onChange={(value) => setForm((current) => ({ ...current, healthScore: value }))} />
        <Field label="地址" value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} />
      </div>
      <Field label="企业简介" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} textarea />
      <Field label="AI 诊断建议" value={form.aiDiagnosis} onChange={(value) => setForm((current) => ({ ...current, aiDiagnosis: value }))} textarea />
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button
          onClick={() => onSubmit({ ...form, healthScore: Number(form.healthScore || 80) })}
          disabled={saving || !form.name.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2"><Save size={14} /> {saving ? '保存中...' : '保存客户'}</span>
        </button>
      </div>
    </ModalShell>
  );
}

function OpportunityModal({ initialData, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(initialData);

  return (
    <ModalShell
      title="新建商机项目"
      subtitle="商机会和客户关联写入本地数据库，并同步影响工作台与 CRM 统计。"
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="商机名称" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
        <Field label="负责人" value={form.owner} onChange={(value) => setForm((current) => ({ ...current, owner: value }))} />
        <SelectField
          label="阶段"
          value={form.stage}
          options={[
            { value: 'lead', label: '待跟进' },
            { value: 'proposal', label: '推进中' },
            { value: 'risk', label: '需关注' },
            { value: 'won', label: '已成交' },
          ]}
          onChange={(value) => setForm((current) => ({ ...current, stage: value }))}
        />
        <Field label="预计金额" type="number" value={form.amount} onChange={(value) => setForm((current) => ({ ...current, amount: value }))} />
        <Field label="成交概率 (%)" type="number" value={form.probability} onChange={(value) => setForm((current) => ({ ...current, probability: value }))} />
        <Field label="预计成交日期" type="date" value={form.expectedCloseAt} onChange={(value) => setForm((current) => ({ ...current, expectedCloseAt: value }))} />
      </div>
      <Field label="下一步动作" value={form.nextAction} onChange={(value) => setForm((current) => ({ ...current, nextAction: value }))} textarea />
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
        <button
          onClick={() => onSubmit(form)}
          disabled={saving || !form.customerId || !form.title.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2"><Plus size={14} /> {saving ? '创建中...' : '创建商机'}</span>
        </button>
      </div>
    </ModalShell>
  );
}

function CrmAssetModal({ client, asset, onClose, onSearch, onImportToWriter, onDownload }) {
  return (
    <ModalShell
      title={asset.name}
      subtitle={`客户：${client.name} · 资产类型：${asset.type}`}
      onClose={onClose}
    >
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-700">
        当前资产已经接入 CRM 明细页的真实操作链路，可继续执行检索、导入撰写助手或导出资产摘要。
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ReadOnlyField label="客户名称" value={client.name} />
        <ReadOnlyField label="资产类型" value={asset.type} />
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2">
        <button
          type="button"
          onClick={onSearch}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 inline-flex items-center justify-center gap-2"
        >
          <Search size={16} />
          发起检索
        </button>
        <button
          type="button"
          onClick={onImportToWriter}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 inline-flex items-center justify-center gap-2"
        >
          <BrainCircuit size={16} />
          导入撰写助手
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2"
        >
          <Download size={16} />
          导出摘要
        </button>
      </div>
    </ModalShell>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-gray-900 break-all">{value}</div>
    </div>
  );
}

function ModalShell({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">×</button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
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
