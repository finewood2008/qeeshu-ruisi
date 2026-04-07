import React, { useState } from 'react';
import { 
  Users, TrendingUp, TrendingDown, AlertTriangle, Building2, MoreHorizontal,
  ArrowLeft, Phone, Mail, MapPin, Briefcase, Calendar, FileText, CheckCircle2,
  BrainCircuit, ChevronRight, Download
} from 'lucide-react';

// --- Mock Data ---
const mockClients = [
  {
    id: 1,
    name: "A重工集团",
    industry: "机械制造",
    projectsCount: 4,
    score: 92,
    trend: "up",
    status: "优质客户，建议推进二期数字化转型项目",
    contact: { name: "张建国", role: "CIO", phone: "138-0000-0000", email: "zhangjg@a-heavy.com" },
    address: "江苏省苏州市工业园区",
    description: "国内领先的工程机械制造商，近年来致力于从传统制造向智能制造转型，是我们的核心战略大客户。",
    aiDiagnosis: "客户目前现金流充裕，一期精益生产项目交付满意度高（NPS: 9/10）。根据近期互动频次及系统抓取的高管公开演讲，其对“数字化工厂”表现出强烈兴趣。建议下周一由合伙人带队进行二期项目 Pitch。",
    projects: [
      { name: "2022年制造成本全面优化", date: "2022.03 - 2022.11", status: "已结项" },
      { name: "组织架构与绩效体系梳理", date: "2021.05 - 2021.09", status: "已结项" }
    ],
    assets: [
      { name: "A重工_成本优化结项报告.pdf", type: "PDF" },
      { name: "A重工_数字化转型蓝图初案.ppt", type: "PPT" }
    ]
  },
  {
    id: 2,
    name: "B医疗科技",
    industry: "医疗器械",
    projectsCount: 1,
    score: 88,
    trend: "stable",
    status: "交付阶段，客户满意度高",
    contact: { name: "刘总", role: "运营VP", phone: "139-8888-8888", email: "liu@b-medtech.cn" },
    address: "广东省深圳市南山区科技园",
    description: "专注于高端医疗器械研发与生产的创新型企业，正处于快速扩张期。",
    aiDiagnosis: "项目【全国销售渠道搭建】正在按计划推进，进度 75%。近期客户多次查阅我方提交的阶段性报告，系统判定接受度较高。可适时引出关于“渠道库存管理”的潜在需求。",
    projects: [
      { name: "全国销售渠道网络搭建规划", date: "2023.10 - 至今", status: "进行中" }
    ],
    assets: [
      { name: "B医疗_渠道规划阶段汇报.ppt", type: "PPT" }
    ]
  },
  {
    id: 3,
    name: "C零售商超",
    industry: "消费零售",
    projectsCount: 2,
    score: 65,
    trend: "down",
    status: "近期营收数据下滑，建议提供成本诊断方案",
    highlight: true,
    contact: { name: "王芳", role: "运营总监", phone: "137-1111-2222", email: "wangf@c-retail.com" },
    address: "上海市徐汇区xx路",
    description: "区域性连锁超市龙头，面对电商冲击及供应链成本上升，线下门店利润被严重压缩。",
    aiDiagnosis: "⚠️ 预警触发：该客户最近一季度的公开财报显示净利润率下降了 2.4%。历史交流录音中多次提及“仓储成本”和“人员冗余”。建议立即主动输出一份基于零售行业的《门店降本增效白皮书》并主动预约拜访。",
    projects: [
      { name: "会员体系搭建与运营策略", date: "2023.01 - 2023.06", status: "已结项" }
    ],
    assets: [
      { name: "C零售_会员数据分析报告.pdf", type: "PDF" },
      { name: "客户访谈录音_王总_202312.mp3", type: "Audio" }
    ]
  },
  {
    id: 4,
    name: "D新能源车企",
    industry: "汽车制造",
    projectsCount: 3,
    score: 74,
    trend: "down",
    status: "合同即将到期，需跟进续约情况",
    contact: { name: "陈明", role: "采购部", phone: "136-3333-4444", email: "chenm@d-auto.com" },
    address: "安徽省合肥市经开区",
    description: "造车新势力之一，目前正处于产能爬坡和供应链优化的关键时期。",
    aiDiagnosis: "常年顾问合同将于下月到期。系统检测到沟通频次在过去 30 天内下降了 40%。建议指派客户成功经理(CSM)介入，组织一次年度价值回顾会议(QBR)。",
    projects: [
      { name: "2023年度战略顾问服务", date: "2023.05 - 2024.05", status: "临近到期" },
      { name: "供应链风险评估", date: "2022.08 - 2022.12", status: "已结项" }
    ],
    assets: [
      { name: "D车企_年度服务中期回顾.pdf", type: "PDF" }
    ]
  }
];


export default function CRM() {
  const [selectedClient, setSelectedClient] = useState(null);

  if (selectedClient) {
    return <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">融合客户管理 (Smart CRM)</h2>
          <p className="text-sm text-gray-500 mt-1">基于业务数据与历史交付记录的健康度实时监控</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition shadow-sm">
          导入新客户
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
            <h4 className="text-emerald-800 text-sm font-medium mb-1">健康度良好</h4>
            <p className="text-3xl font-bold text-emerald-600">24 <span className="text-sm font-normal text-emerald-700">家</span></p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-xl">
            <h4 className="text-yellow-800 text-sm font-medium mb-1">需关注续约</h4>
            <p className="text-3xl font-bold text-yellow-600">8 <span className="text-sm font-normal text-yellow-700">家</span></p>
          </div>
          <div className="bg-red-50 border border-red-100 p-5 rounded-xl flex justify-between items-end">
            <div>
              <h4 className="text-red-800 text-sm font-medium mb-1">经营健康度预警</h4>
              <p className="text-3xl font-bold text-red-600">3 <span className="text-sm font-normal text-red-700">家</span></p>
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
                <th className="px-6 py-4">健康度评分</th>
                <th className="px-6 py-4">AI 状态诊断</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {mockClients.map(client => (
                <ClientRow 
                  key={client.id}
                  client={client}
                  onClick={() => setSelectedClient(client)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClientRow({ client, onClick }) {
  const { name, industry, projectsCount, score, trend, status, highlight } = client;
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
        <div className="flex items-center gap-2">
          <span className={`font-bold text-base ${
            parseInt(score) >= 80 ? 'text-emerald-600' : 
            parseInt(score) >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>{score}</span>
          {trend === 'up' && <TrendingUp size={16} className="text-emerald-500" />}
          {trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
          {trend === 'stable' && <span className="text-gray-400 text-xs">-</span>}
        </div>
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

// --- Client Detail View ---
function ClientDetail({ client, onBack }) {
  const isWarning = client.score < 70;

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden">
      {/* Detail Header */}
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
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition">
            编辑资料
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            新建商机项目
          </button>
        </div>
      </div>

      {/* Detail Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
          
          {/* Left Column (4/12) */}
          <div className="col-span-4 space-y-6">
            
            {/* Health Score Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-4">综合经营健康度</h3>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className={`text-6xl font-black ${isWarning ? 'text-red-500' : 'text-emerald-500'}`}>
                  {client.score}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-sm text-gray-500">/ 100</span>
                  {client.trend === 'up' && <span className="text-xs font-bold text-emerald-500 flex items-center"><TrendingUp size={12} className="mr-1"/> 提升</span>}
                  {client.trend === 'down' && <span className="text-xs font-bold text-red-500 flex items-center"><TrendingDown size={12} className="mr-1"/> 下降</span>}
                </div>
              </div>
              <p className={`text-sm mt-4 font-medium px-4 py-2 rounded-lg ${isWarning ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {client.status}
              </p>
            </div>

            {/* Basic Info Card */}
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
                    <span className="block text-gray-500 mt-1 flex items-center gap-1"><Phone size={12}/> {client.contact.phone}</span>
                    <span className="block text-gray-500 mt-1 flex items-center gap-1"><Mail size={12}/> {client.contact.email}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (8/12) */}
          <div className="col-span-8 space-y-6">
            
            {/* AI Diagnosis */}
            <div className={`p-6 rounded-xl border shadow-sm ${isWarning ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`flex items-center gap-2 font-bold mb-3 ${isWarning ? 'text-red-800' : 'text-blue-800'}`}>
                <BrainCircuit size={20} />
                企数睿思 深度诊断与策略建议
              </div>
              <p className={`text-sm leading-relaxed ${isWarning ? 'text-red-900' : 'text-blue-900'}`}>
                {client.aiDiagnosis}
              </p>
              <div className="mt-4 pt-4 border-t border-black/10 flex gap-3">
                <button className={`px-4 py-2 rounded shadow-sm text-sm font-medium transition ${isWarning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  生成专属解决方案大纲
                </button>
                <button className={`px-4 py-2 rounded border text-sm font-medium transition ${isWarning ? 'border-red-300 text-red-700 hover:bg-red-100' : 'border-blue-300 text-blue-700 hover:bg-blue-100'}`}>
                  查看相关历史相似案例
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Projects */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400"/> 历史与当前项目
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{client.projects.length} 个</span>
                </div>
                <div className="space-y-4">
                  {client.projects.map((proj, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                      <h4 className="text-sm font-medium text-gray-900">{proj.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-gray-500">{proj.date}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          proj.status === '已结项' ? 'bg-gray-100 text-gray-600' : 
                          proj.status === '临近到期' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{proj.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assets */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-gray-400"/> 核心知识资产
                  </h3>
                  <span className="text-xs text-blue-600 cursor-pointer hover:underline">查看全部</span>
                </div>
                <div className="space-y-3">
                  {client.assets.map((asset, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition group cursor-pointer">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          asset.type === 'PDF' ? 'bg-red-100 text-red-600' : 
                          asset.type === 'PPT' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {asset.type}
                        </div>
                        <span className="text-sm text-gray-700 truncate">{asset.name}</span>
                      </div>
                      <Download size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition" />
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