import React, { useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Clock,
  FileText,
  LayoutDashboard,
  Search as SearchIcon,
} from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { useAppShell } from '../AppShellContext';
import { useSdkViewData } from '../hooks/useSdkViewData';
import { loadDashboardSnapshot } from '../sdk/api';

const cardIcons = [
  <SearchIcon size={20} className="text-blue-500" />,
  <Clock size={20} />,
  <AlertTriangle size={20} />,
  <BrainCircuit size={20} />,
];

export default function Dashboard() {
  const { navigateTo, pushToast } = useAppShell();
  const loader = useCallback(() => loadDashboardSnapshot(), []);
  const { data, error, loading, source } = useSdkViewData(loader);
  const dashboard = data || null;
  const hasDashboardData = Boolean(
    dashboard
    && Array.isArray(dashboard.cards)
    && dashboard.cards.length > 0,
  );
  const isUnconfigured = source === 'unconfigured';
  const emptyTitle = error
    ? '当前还没有可展示的真实工作台数据'
    : isUnconfigured
      ? '当前处于未接入状态'
      : '当前暂无首页数据';
  const emptyDescription = error
    ? error.message
    : isUnconfigured
      ? '请先完成 QeeClaw Platform 接入，或切到桌面本地真实数据模式后再查看首页。'
      : '接入完成后，这里会展示真实项目、知识资产、客户预警和设备状态。';

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-end bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-2xl border border-blue-100/50">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest">
              <Activity size={16} className={loading ? 'animate-pulse' : ''} />
              系统状态：{dashboard?.statusText || (error ? '待接入' : isUnconfigured ? '未接入' : '暂无数据')}
            </div>
            <DataSourceBadge source={source} error={error} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{dashboard?.greeting || '欢迎进入企数睿思工作台'}</h2>
          <p className="text-gray-600 mt-2 text-[15px] max-w-3xl">{dashboard?.subtitle || emptyDescription}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">当前首页口径</p>
          <div className="text-2xl font-black text-emerald-600">
            {dashboard?.healthScore != null ? `${dashboard.healthScore}/100` : '仅展示真实计数'}
          </div>
        </div>
      </div>

      {hasDashboardData ? (
        <>
          <div className="grid grid-cols-4 gap-5">
            {dashboard.cards.map((card, index) => (
              <StatusCard
                key={card.title}
                title={card.title}
                value={card.value}
                trend={card.trend}
                trendText={card.trendText}
                type={card.type}
                icon={cardIcons[index]}
              />
            ))}
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-600" />
                    活跃项目智能辅助
                  </h3>
                  <button
                    className="text-sm text-blue-600 font-bold flex items-center hover:text-blue-800 transition-colors"
                    onClick={() => navigateTo('crm')}
                  >
                    查看全部项目 <ChevronRight size={16} />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {dashboard.projects.map((project) => (
                    <ProjectItem key={project.name} {...project} />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    最近入库知识资产
                  </h3>
                </div>
                <div className="p-2">
                  {Array.isArray(dashboard.recentAssets) && dashboard.recentAssets.length > 0 ? (
                    dashboard.recentAssets.map((asset) => (
                      <DocItem key={asset.name} {...asset} />
                    ))
                  ) : (
                    <SectionEmptyState
                      title="当前还没有真实入库资产"
                      description="这里现在只展示真实知识库资产；如果还没导入或索引完成，将不再显示平台文档示例。"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-4 space-y-8">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl shadow-md border border-blue-500 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all duration-500"></div>
                <div className="p-6 relative z-10">
                  <div className="flex items-center gap-2 text-blue-100 mb-5">
                    <BrainCircuit size={20} className="text-yellow-300" />
                    <h3 className="font-bold text-lg tracking-wide text-white">企数睿思·SDK 洞察推荐</h3>
                  </div>
                  <p className="text-[13px] text-blue-100 mb-5 leading-relaxed">{dashboard.recommendation.description}</p>

                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 hover:border-white/40 transition-all shadow-lg transform hover:-translate-y-1">
                    <h4 className="font-bold text-white mb-2 leading-tight">{dashboard.recommendation.title}</h4>
                    <div className="flex justify-between items-end mt-4">
                      <div className="space-y-1.5">
                        <span className="inline-block text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full font-bold">
                          {dashboard.recommendation.tag}
                        </span>
                        <p className="text-[11px] text-blue-200">
                          当前仅展示真实推荐条目，不再展示前端推导匹配分
                        </p>
                      </div>
                      <button
                        className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                        onClick={() => {
                          navigateTo('search', { query: dashboard.recommendation.title });
                          pushToast(`已跳转到检索页，查看推荐资料「${dashboard.recommendation.title}」`, 'success');
                        }}
                      >
                        <ArrowUpRight size={16} className="font-bold" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-red-50 bg-red-50/30 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    客户经营健康度预警
                  </h3>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                </div>
                <div className="p-3">
                  {dashboard.crmAlerts.map((item) => (
                    <HealthAlert key={item.company} {...item} />
                  ))}
                </div>
                <button
                  className="w-full py-3 bg-gray-50 text-sm text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-900 transition-colors border-t border-gray-100"
                  onClick={() => navigateTo('crm')}
                >
                  进入 CRM 处理
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <DashboardEmptyState
          title={emptyTitle}
          description={emptyDescription}
          onOpenAccess={() => navigateTo('settings-system', { settingsTab: 'access' })}
          onOpenAssets={() => navigateTo('assets')}
        />
      )}
    </div>
  );
}

function DashboardEmptyState({ title, description, onOpenAccess, onOpenAssets }) {
  return (
    <div className="rounded-3xl border border-dashed border-blue-200 bg-white px-8 py-14 shadow-sm">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <LayoutDashboard size={28} />
        </div>
        <h3 className="mt-5 text-2xl font-black text-gray-900">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenAccess}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            去完成平台接入
          </button>
          <button
            type="button"
            onClick={onOpenAssets}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            查看本地资产入口
          </button>
        </div>
        <div className="mt-8 grid gap-3 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-sm font-semibold text-gray-900">1. 接入平台</div>
            <div className="mt-1 text-xs leading-6 text-gray-500">先在“本地偏好与接入”里配置 `baseUrl + API Key`。</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-sm font-semibold text-gray-900">2. 准备本地数据</div>
            <div className="mt-1 text-xs leading-6 text-gray-500">桌面模式下可接本地 CRM、知识库、草稿与设备数据。</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="text-sm font-semibold text-gray-900">3. 再看首页</div>
            <div className="mt-1 text-xs leading-6 text-gray-500">完成接入后，这里才展示真实项目、推荐、预警与统计。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionEmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-2 text-xs leading-6 text-gray-500">{description}</div>
    </div>
  );
}

function StatusCard({ title, value, trend, trendText, type, icon }) {
  const styles = {
    info: { iconBg: 'bg-blue-50 text-blue-600', trend: 'text-blue-600', border: 'border-blue-100 hover:border-blue-300' },
    warning: { iconBg: 'bg-amber-50 text-amber-600', trend: 'text-amber-600', border: 'border-amber-100 hover:border-amber-300' },
    danger: { iconBg: 'bg-red-50 text-red-600', trend: 'text-red-600', border: 'border-red-100 hover:border-red-300' },
    success: { iconBg: 'bg-emerald-50 text-emerald-600', trend: 'text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300' },
  };

  const style = styles[type];

  return (
    <div className={`bg-white p-5 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md ${style.border} group cursor-default`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[13px] font-bold text-gray-500">{title}</h4>
        <div className={`p-2 rounded-lg ${style.iconBg} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="text-4xl font-black text-gray-900 tracking-tight">{value}</div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span className={`text-[12px] font-black px-1.5 py-0.5 rounded bg-gray-50 ${style.trend}`}>{trend}</span>
        <span className="text-[11px] text-gray-400 font-medium">{trendText}</span>
      </div>
    </div>
  );
}

function ProjectItem({ name, client, status, dueDate, aiTip, alertType }) {
  return (
    <div className="p-6 hover:bg-gray-50/80 transition-colors group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">{client}</span>
            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
              <Clock size={10} />
              {dueDate}
            </span>
          </div>
          <h4 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{name}</h4>
        </div>
        <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-full font-bold shadow-sm">{status}</span>
      </div>

      <div className={`flex items-start gap-2.5 text-[13px] p-3 rounded-lg border ${
        alertType === 'warning'
          ? 'bg-amber-50/50 border-amber-200/60 text-amber-900'
          : 'bg-emerald-50/50 border-emerald-200/60 text-emerald-900'
      }`}>
        <BrainCircuit size={16} className="mt-0.5 shrink-0" />
        <p>{aiTip}</p>
      </div>
    </div>
  );
}

function DocItem({ name, type, date, tag }) {
  const style = {
    pdf: 'bg-red-50 text-red-600 border-red-100',
    ppt: 'bg-orange-50 text-orange-600 border-orange-100',
    audio: 'bg-purple-50 text-purple-600 border-purple-100',
    doc: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-xl transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold uppercase ${style[type] || style.doc}`}>
          {type}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-400">{date}</p>
        </div>
      </div>
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200 shrink-0">{tag}</span>
    </div>
  );
}

function HealthAlert({ company, status, reason, level }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 hover:border-red-100 hover:bg-red-50/20 transition">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-900">{company}</h4>
          <p className="text-xs text-gray-500 mt-1">{reason}</p>
        </div>
        <div className="text-right">
          <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
            level === 'warning'
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
          }`}>{status}</div>
        </div>
      </div>
    </div>
  );
}
