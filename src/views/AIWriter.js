import React, { useState } from 'react';
import { 
  Wand2, AlignLeft, Bold, Italic, List, Save, Download, 
  BarChart3, Image as ImageIcon, Plus, CheckCircle2, AlertCircle, 
  Sparkles, ChevronRight, LayoutTemplate, MoreHorizontal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data for the embedded chart
const chartData = [
  { month: '1月', 现有成本: 4000, 优化预期: 4000 },
  { month: '2月', 现有成本: 3000, 优化预期: 2800 },
  { month: '3月', 现有成本: 2000, 优化预期: 1500 },
  { month: '4月', 现有成本: 2780, 优化预期: 1908 },
  { month: '5月', 现有成本: 1890, 优化预期: 1200 },
  { month: '6月', 现有成本: 2390, 优化预期: 1100 },
];

export default function AIWriter() {
  const [showSlashMenu, setShowSlashMenu] = useState(true);

  return (
    <div className="flex h-full gap-6">
      
      {/* --- Left: Advanced AI Editor Area --- */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
        
        {/* Rich Toolbar */}
        <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-1 text-gray-600">
            <select className="bg-transparent border-none text-sm font-medium focus:outline-none hover:bg-gray-100 p-1.5 rounded cursor-pointer">
              <option>正文 (Normal)</option>
              <option>标题 1 (H1)</option>
              <option>标题 2 (H2)</option>
            </select>
            <div className="w-px h-5 bg-gray-300 mx-2"></div>
            <button className="p-1.5 hover:bg-gray-100 rounded transition"><Bold size={16} /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition"><Italic size={16} /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition"><AlignLeft size={16} /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition"><List size={16} /></button>
            <div className="w-px h-5 bg-gray-300 mx-2"></div>
            
            {/* AI Action Buttons in Toolbar */}
            <button className="flex items-center gap-1.5 p-1.5 px-2 hover:bg-purple-50 text-purple-700 rounded transition text-sm font-medium">
              <Sparkles size={14} /> 自动润色
            </button>
            <button className="flex items-center gap-1.5 p-1.5 px-2 hover:bg-blue-50 text-blue-700 rounded transition text-sm font-medium">
              <BarChart3 size={14} /> 数据转图表
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">已自动保存 14:23</span>
            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md bg-white shadow-sm transition">
              <Save size={16} /> 保存草稿
            </button>
            <button className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-sm transition">
              <Download size={16} /> 导出专业报告
            </button>
          </div>
        </div>

        {/* Editor Document Canvas */}
        <div className="flex-1 overflow-auto bg-[#F8FAFC] p-8 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto bg-white min-h-full p-12 shadow-sm border border-gray-200 rounded-lg relative">
            
            {/* Document Title */}
            <input 
              type="text" 
              className="w-full text-4xl font-bold mb-8 text-gray-900 border-none focus:outline-none placeholder-gray-300"
              defaultValue="A集团降本增效初步诊断方案"
            />

            {/* Content Blocks */}
            <div className="space-y-6 text-gray-800 leading-relaxed text-base">
              
              {/* Text Block */}
              <div className="group relative">
                <div className="absolute -left-10 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer">
                  <Plus size={20} className="text-gray-400 hover:text-blue-600" />
                  <MoreHorizontal size={20} className="text-gray-400 hover:text-gray-600" />
                </div>
                <h2 className="text-xl font-bold mb-3 mt-8">一、 核心问题诊断</h2>
                <p>客户目前面临市场竞争加剧，利润空间被严重压缩的困境。经过初步调研与高管访谈，我们诊断出以下两个核心症结：</p>
                <ul className="list-decimal pl-5 mt-2 space-y-2">
                  <li><strong>直接制造成本偏高：</strong> 生产线自动化率低于行业基准15%，导致人工成本高昂且废品率波动大。</li>
                  <li><strong>供应链物流冗余：</strong> 缺乏集中的干线物流规划，区域分发仓重叠度达30%。</li>
                </ul>
              </div>

              {/* AI Generated Chart Block */}
              <div className="group relative my-8 border border-blue-100 bg-blue-50/30 rounded-xl p-6 shadow-sm">
                <div className="absolute -top-3 left-6 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-blue-200">
                  <Sparkles size={12} /> BrainBox 自动图表生成
                </div>
                <div className="flex justify-between items-center mb-6 mt-2">
                  <div>
                    <h3 className="font-bold text-gray-900">制造成本优化预期预测模型</h3>
                    <p className="text-xs text-gray-500 mt-1">基于STM标准制造业降本曲线测算</p>
                  </div>
                  <button className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 px-2 py-1 rounded bg-white">编辑数据源</button>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="现有成本" stroke="#94a3b8" fillOpacity={1} fill="url(#colorCurrent)" />
                      <Area type="monotone" dataKey="优化预期" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOptimized)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-gray-400 mt-4">图 1-1: 导入精益管理后未来6个月成本下降趋势（单位：万元）</p>
              </div>

              {/* Active Line with Slash Menu Trigger */}
              <div className="group relative pt-4">
                <div className="absolute -left-10 top-4 opacity-100 flex items-center gap-1 cursor-pointer">
                  <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center border border-blue-200">
                    <Plus size={16} className="text-blue-600" onClick={() => setShowSlashMenu(!showSlashMenu)} />
                  </div>
                </div>
                <p className="text-gray-400 text-lg">
                  点击左侧 '+' 或输入 <span className="bg-gray-100 text-gray-700 px-1.5 rounded font-mono text-sm border border-gray-200">/</span> 唤出 AI 组件...
                </p>

                {/* Floating Slash Menu */}
                {showSlashMenu && (
                  <div className="absolute left-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30 animate-fade-in-up">
                    <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">AI 智能生成</div>
                    <div className="p-1 space-y-0.5">
                      <MenuItem icon={<Wand2 size={16} className="text-purple-500"/>} title="自动续写内容" sub="根据上下文生成专业段落" />
                      <MenuItem icon={<BarChart3 size={16} className="text-blue-500"/>} title="生成数据图表" sub="输入数据自动清洗并绘图" />
                      <MenuItem icon={<LayoutTemplate size={16} className="text-emerald-500"/>} title="插入标准模型框架图" sub="波士顿矩阵、鱼骨图等" />
                      <MenuItem icon={<ImageIcon size={16} className="text-orange-500"/>} title="智能配图生成" sub="根据当前段落语义生成配图" />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- Right: Actionable Co-pilot Sidebar --- */}
      <div className="w-[400px] flex flex-col gap-4">
        
        {/* Actionable Quality Check Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <CheckCircle2 size={18} className="text-emerald-500" />
              方法论完整性审查
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">及格 65分</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700">核心问题诊断逻辑清晰</p>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">缺失 STM 标准化解决方案框架</p>
                <p className="text-xs text-red-600 mt-1">未引入标准的《供应链四象限评估模型》</p>
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold transition">
                  <Wand2 size={12} /> 一键让 AI 补充模型分析框架
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable AI Context Suggestions Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden flex-1 flex flex-col relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <div className="p-4 border-b border-blue-100 bg-gradient-to-b from-blue-50/80 to-white flex items-center gap-2 font-bold text-blue-900">
            <Sparkles size={18} className="text-blue-600" />
            BrainBox 情境辅助推荐
          </div>
          <div className="p-5 flex-1 overflow-auto space-y-6 custom-scrollbar">
            
            {/* Suggestion 1: Content Expansion */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
                  <AlignLeft size={14} className="text-blue-500"/> 扩充诊断维度
                </h4>
              </div>
              <p className="text-[12px] text-gray-600 mb-4 leading-relaxed">
                系统检测到您当前仅列出了“制造成本”和“物流”。根据知识库中同行业（重工）历史成功案例，<span className="bg-yellow-100 text-yellow-800 px-1 rounded font-medium">采购招标寻源策略</span> 通常是降本空间最大的环节。
              </p>
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg shadow-sm shadow-blue-600/20 transition font-bold flex justify-center items-center gap-2">
                生成采购诊断建议段落 <ChevronRight size={14} />
              </button>
            </div>

            {/* Suggestion 2: Data/Asset Injection */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 hover:border-purple-300 transition shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-purple-500"/> 发现高价值基准数据
                </h4>
              </div>
              <p className="text-[12px] text-gray-600 mb-3 leading-relaxed">
                库中找到《2023年长三角重工企业运营基准指标库》，包含您正在撰写的能耗及人工基准线。
              </p>
              <div className="bg-white border border-purple-100 rounded-lg p-3 mb-4 cursor-pointer hover:shadow-md transition">
                <div className="h-16 flex items-end justify-between px-2 opacity-50 pointer-events-none">
                  {/* Fake tiny bar chart for preview */}
                  <div className="w-4 bg-purple-300 h-[60%] rounded-t-sm"></div>
                  <div className="w-4 bg-blue-300 h-[80%] rounded-t-sm"></div>
                  <div className="w-4 bg-purple-300 h-[40%] rounded-t-sm"></div>
                  <div className="w-4 bg-blue-300 h-[90%] rounded-t-sm"></div>
                </div>
                <p className="text-center text-[10px] text-gray-500 mt-2 font-medium">预览：长三角人工成本对标图表</p>
              </div>
              <button className="w-full py-2 bg-white border border-purple-300 hover:bg-purple-50 text-purple-700 text-xs rounded-lg shadow-sm transition font-bold">
                提取数据并插入图表区块
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 p-2.5 hover:bg-blue-50 cursor-pointer rounded-lg transition group">
      <div className="w-8 h-8 rounded bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 group-hover:border-blue-200">
        {icon}
      </div>
      <div>
        <h5 className="text-[13px] font-bold text-gray-800">{title}</h5>
        <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}