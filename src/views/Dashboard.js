import React from 'react';
import { ChevronRight, BrainCircuit, ArrowRight, MessageSquare, FileText } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">下午好，李顾问</h2>
          <p className="text-gray-500 mt-1">STM-Box 边缘算力终端运行正常，知识库已更新至最新状态。</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard title="近期诊断检索" value="124" trend="+12% 本周" type="info" />
        <StatusCard title="待处理项" value="5" trend="2 个紧急" type="warning" />
        <StatusCard title="高频客户健康度预警" value="2" trend="需关注" type="danger" />
        <StatusCard title="边缘设备算力" value="正常" trend="CPU 12% / NPU 4%" type="success" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Col - Projects */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg">活跃项目智能辅助</h3>
              <button className="text-sm text-blue-600 font-medium flex items-center">查看全部 <ChevronRight size={16} /></button>
            </div>
            <div className="divide-y divide-gray-100">
              <ProjectItem 
                name="A集团 制造业成本优化" 
                status="撰写中"
                progress={65}
                aiTip="建议补充供应链环节的风险分析，已找到3篇高度相关历史案例"
              />
              <ProjectItem 
                name="B公司 数字化转型规划" 
                status="资料梳理"
                progress={30}
                aiTip="已自动解析客户提供的 15 份财务及运营数据报表"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <h3 className="font-semibold text-lg mb-4">最近入库知识资产</h3>
            <div className="space-y-3">
              <DocItem name="消费品行业渠道下沉策略.pdf" type="pdf" date="2小时前" />
              <DocItem name="某汽车客户数字化工厂方案.ppt" type="ppt" date="昨天" />
              <DocItem name="高管访谈录音_20240315.mp3" type="audio" date="昨天" />
            </div>
          </div>
        </div>

        {/* Right Col - AI Feed */}
        <div className="col-span-1 space-y-6">
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 text-blue-800 mb-4">
              <BrainCircuit size={20} />
              <h3 className="font-semibold text-lg">BrainBox 推荐</h3>
            </div>
            <p className="text-sm text-blue-900 mb-4">基于您最近在看【成本控制】相关材料，为您推荐：</p>
            <div className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition">
              <h4 className="font-medium text-gray-900 mb-1">《精益生产与成本控制标准方法论》</h4>
              <p className="text-xs text-gray-500 mb-3">内部核心资料库 · 匹配度 92%</p>
              <button className="text-sm text-blue-600 font-medium flex items-center gap-1">
                立即阅读 <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-lg">客户经营健康度预警</h3>
            </div>
            <div className="p-6 space-y-4">
               <HealthAlert company="C 零售企业" score={65} status="下降" />
               <HealthAlert company="D 医疗科技" score={88} status="稳定" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, trend, type }) {
  const colorMap = {
    info: 'text-blue-600',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    success: 'text-emerald-500'
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h4 className="text-sm text-gray-500 mb-2">{title}</h4>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className={`text-xs font-medium ${colorMap[type]}`}>{trend}</div>
    </div>
  );
}

function ProjectItem({ name, status, progress, aiTip }) {
  return (
    <div className="p-6 hover:bg-gray-50 transition">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{status}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex items-start gap-2 text-sm bg-amber-50 text-amber-800 p-3 rounded-md">
        <MessageSquare size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <p><strong>AI 助手提示：</strong>{aiTip}</p>
      </div>
    </div>
  );
}

function DocItem({ name, type, date }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-200 cursor-pointer transition">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
          type === 'pdf' ? 'bg-red-100 text-red-600' : 
          type === 'ppt' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
        }`}>
          <FileText size={16} />
        </div>
        <div className="truncate w-48">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-400" />
    </div>
  );
}

function HealthAlert({ company, score, status }) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
      <div>
        <h4 className="font-medium text-gray-900 text-sm">{company}</h4>
        <p className="text-xs text-gray-500 mt-1">健康度评分</p>
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold ${score < 70 ? 'text-red-600' : 'text-emerald-600'}`}>
          {score}
        </div>
        <div className={`text-xs font-medium ${status === '下降' ? 'text-red-500' : 'text-gray-500'}`}>
          {status === '下降' ? '↓ 预警' : '稳定'}
        </div>
      </div>
    </div>
  );
}