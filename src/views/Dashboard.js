import React, { useState } from 'react';
import { 
  ChevronRight, BrainCircuit, ArrowRight, MessageSquare, 
  FileText, Activity, AlertTriangle, TrendingUp, TrendingDown,
  Clock, Play, MoreHorizontal, ArrowUpRight, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Minimal mock data for the tiny trend line in status cards
const trendData = [
  { value: 40 }, { value: 30 }, { value: 45 }, { value: 50 }, 
  { value: 65 }, { value: 60 }, { value: 80 }
];

export default function Dashboard() {
  const [activeAlerts, setActiveAlerts] = useState(2);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      
      {/* Welcome Header */}
      <div className="flex justify-between items-end bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-2xl border border-blue-100/50">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-2 uppercase tracking-widest">
            <Activity size={16} className="animate-pulse" />
            系统状态：运行良好
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">下午好，李顾问</h2>
          <p className="text-gray-600 mt-2 text-[15px]">STM-Box 边缘算力终端运行正常，本地知识库今日已完成 12 份新资产的增量向量化。</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">当前项目进度综合健康度</p>
          <div className="text-3xl font-black text-emerald-600">89<span className="text-lg text-emerald-600/60 font-medium">/100</span></div>
        </div>
      </div>

      {/* Hero Status Cards */}
      <div className="grid grid-cols-4 gap-5">
        <StatusCard 
          title="近期诊断检索" 
          value="124" 
          trend="+12%" 
          trendText="较上周"
          type="info" 
          icon={<SearchIcon />}
          sparkline={true}
        />
        <StatusCard 
          title="待处理项目任务" 
          value="5" 
          trend="2" 
          trendText="项标记为紧急"
          type="warning" 
          icon={<Clock size={20} />}
        />
        <StatusCard 
          title="经营健康度预警客户" 
          value={activeAlerts} 
          trend="-1" 
          trendText="较上周恢复"
          type="danger" 
          icon={<AlertTriangle size={20} />}
        />
        <StatusCard 
          title="边缘设备综合算力" 
          value="良好" 
          trend="CPU 12% / NPU 4%" 
          type="success" 
          icon={<BrainCircuit size={20} />}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* --- Left Column (8/12) --- */}
        <div className="col-span-8 space-y-8">
          
          {/* Active Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                活跃项目智能辅助
              </h3>
              <button className="text-sm text-blue-600 font-bold flex items-center hover:text-blue-800 transition-colors">
                查看全部项目 <ChevronRight size={16} />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              <ProjectItem 
                name="A集团 制造业成本优化" 
                client="A集团"
                status="撰写中"
                progress={65}
                dueDate="还有 3 天提交"
                aiTip="检测到文档结构缺失：建议补充供应链环节的风险分析，系统已为您找到 3 篇高度相关历史案例。"
                alertType="warning"
              />
              <ProjectItem 
                name="B公司 数字化转型规划" 
                client="B医疗科技"
                status="资料梳理"
                progress={30}
                dueDate="下周二"
                aiTip="多模态处理完成：已自动解析客户提供的 15 份财务及运营数据报表，生成初始洞察简报。"
                alertType="success"
              />
            </div>
          </div>

          {/* Recent Assets */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                最近入库知识资产
              </h3>
            </div>
            <div className="p-2">
              <DocItem name="消费品行业渠道下沉策略.pdf" type="pdf" date="2小时前" tag="行研报告" />
              <DocItem name="某汽车客户数字化工厂方案.ppt" type="ppt" date="昨天" tag="结项方案" />
              <DocItem name="高管访谈录音_20240315.mp3" type="audio" date="昨天" tag="一手语料" />
            </div>
          </div>
        </div>

        {/* --- Right Column (4/12) --- */}
        <div className="col-span-4 space-y-8">
          
          {/* AI Feed / Recommendations */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-md border border-blue-500 overflow-hidden relative group">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all duration-500"></div>
            
            <div className="p-6 relative z-10">
              <div className="flex items-center gap-2 text-blue-100 mb-5">
                <BrainCircuit size={20} className="text-yellow-300" />
                <h3 className="font-bold text-lg tracking-wide text-white">BrainBox 知识推荐</h3>
              </div>
              <p className="text-[13px] text-blue-100 mb-5 leading-relaxed">
                基于您最近在密集查阅<span className="bg-white/20 px-1.5 py-0.5 rounded text-white mx-1 font-medium">成本控制</span>相关材料，系统主动为您推送以下高价值内部核心资产：
              </p>
              
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 hover:border-white/40 transition-all shadow-lg transform hover:-translate-y-1">
                <h4 className="font-bold text-white mb-2 leading-tight">《精益生产与成本控制标准方法论 V3.0》</h4>
                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-1.5">
                    <span className="inline-block text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full font-bold">合伙人内部核准版</span>
                    <p className="text-[11px] text-blue-200">语义匹配度 <span className="font-bold text-white text-[13px]">92%</span></p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                    <ArrowUpRight size={16} className="font-bold" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CRM Health Alerts */}
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
               <HealthAlert 
                 company="C 零售企业" 
                 score={65} 
                 status="下降" 
                 reason="近期财报利润率连续两季度下滑"
               />
               <HealthAlert 
                 company="D 医疗科技" 
                 score={88} 
                 status="稳定" 
                 reason="合同履约正常，二期项目接洽中"
               />
            </div>
            <button className="w-full py-3 bg-gray-50 text-sm text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-900 transition-colors border-t border-gray-100">
              进入 CRM 处理
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

// Fake icon component to avoid passing huge SVGs
function SearchIcon() {
  return <Search size={20} className="text-blue-500" />;
}
import { Search } from 'lucide-react';

function StatusCard({ title, value, trend, trendText, type, icon, sparkline }) {
  const styles = {
    info: { iconBg: 'bg-blue-50 text-blue-600', trend: 'text-blue-600', border: 'border-blue-100 hover:border-blue-300' },
    warning: { iconBg: 'bg-amber-50 text-amber-600', trend: 'text-amber-600', border: 'border-amber-100 hover:border-amber-300' },
    danger: { iconBg: 'bg-red-50 text-red-600', trend: 'text-red-600', border: 'border-red-100 hover:border-red-300' },
    success: { iconBg: 'bg-emerald-50 text-emerald-600', trend: 'text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300' }
  };

  const style = styles[type];

  return (
    <div className={`bg-white p-5 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md ${style.border} group cursor-default relative overflow-hidden`}>
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

      {/* Optional Sparkline Graphic */}
      {sparkline && (
        <div className="absolute bottom-0 right-0 w-24 h-12 opacity-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ProjectItem({ name, client, status, progress, dueDate, aiTip, alertType }) {
  return (
    <div className="p-6 hover:bg-gray-50/80 transition-colors group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">{client}</span>
            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Clock size={10}/> {dueDate}</span>
          </div>
          <h4 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{name}</h4>
        </div>
        <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-full font-bold shadow-sm">{status}</span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden border border-gray-200/50">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPjxyZWN0IHdpZHRoPSc0JyBoZWlnaHQ9JzQnIGZpbGw9J25vbmUnLz48cGF0aCBkPSdNMCA0TDRgIDB2NGgtNHonIGZpbGw9JyNmZmYnIG9wYWNpdHk9Jy4yJy8+PC9zdmc+')] opacity-50"></div>
        </div>
      </div>

      <div className={`flex items-start gap-2.5 text-[13px] p-3 rounded-lg border ${
        alertType === 'warning' ? 'bg-amber-50/50 border-amber-200/60 text-amber-900' : 'bg-emerald-50/50 border-emerald-200/60 text-emerald-900'
      }`}>
        {alertType === 'warning' ? (
          <MessageSquare size={16} className="mt-0.5 shrink-0 text-amber-500" />
        ) : (
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
        )}
        <p className="leading-relaxed"><strong className={alertType === 'warning' ? 'text-amber-700' : 'text-emerald-700'}>BrainBox 提示：</strong>{aiTip}</p>
      </div>
    </div>
  );
}

function DocItem({ name, type, date, tag }) {
  return (
    <div className="flex items-center justify-between p-3 mx-2 my-2 border border-transparent rounded-xl hover:bg-white hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
          type === 'pdf' ? 'bg-red-50 border-red-100 text-red-500' : 
          type === 'ppt' ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-purple-50 border-purple-100 text-purple-500'
        }`}>
          {type === 'audio' ? <Play size={18} className="ml-0.5" /> : <FileText size={18} />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{name}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="uppercase font-black">{type}</span>
            <span>•</span>
            <span>{date}</span>
            <span>•</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">{tag}</span>
          </div>
        </div>
      </div>
      <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function HealthAlert({ company, score, status, reason }) {
  const isWarning = score < 70;
  return (
    <div className="flex items-center justify-between p-3.5 m-2 border border-gray-100 bg-white rounded-xl hover:border-gray-300 transition-colors cursor-pointer group">
      <div>
        <h4 className="font-bold text-gray-900 text-sm mb-1">{company}</h4>
        <p className="text-[11px] text-gray-500 max-w-[200px] truncate" title={reason}>{reason}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`text-xl font-black ${isWarning ? 'text-red-500' : 'text-emerald-500'}`}>
            {score}
          </div>
          <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isWarning ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {status === '下降' ? '↓ 预警' : '稳定'}
          </div>
        </div>
        <MoreHorizontal size={16} className="text-gray-300 group-hover:text-gray-500" />
      </div>
    </div>
  );
}