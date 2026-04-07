import React, { useState } from 'react';
import { Search as SearchIcon, Filter, FileText, BrainCircuit, Play, MessageSquare } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('制造业成本优化');
  
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Search Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-4">
          <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <SearchIcon size={20} className="text-gray-400 mr-3" />
            <input 
              type="text" 
              className="bg-transparent border-none focus:outline-none w-full text-gray-800 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="描述您的业务问题或关键词..."
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-md font-medium transition">
              智能检索
            </button>
          </div>
          <button className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2">
            <Filter size={18} />
            高级筛选
          </button>
        </div>
        <div className="flex gap-2 mt-4 text-sm">
          <span className="text-gray-500">相关搜索：</span>
          <span className="text-blue-600 hover:underline cursor-pointer">精益生产与降本增效</span>
          <span className="text-blue-600 hover:underline cursor-pointer">汽车行业供应链优化</span>
          <span className="text-blue-600 hover:underline cursor-pointer">人力资源成本管控</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Results List */}
        <div className="w-1/2 border-r border-gray-200 overflow-auto p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-4">找到 15 个高度相关案例，已按照匹配度排序</p>
          
          <ResultCard 
            title="XX重工 2022年制造成本全面优化项目结项报告"
            type="pdf"
            match="95%"
            date="2022-11-20"
            summary="该项目通过引入精益生产模式，结合柔性供应链改造，在6个月内帮助客户将直接制造成本降低了12%。其中关于废料回收体系的建立与您目前的查询高度相关。"
            highlight="...建议从生产流程中的原材料损耗入手，建立全链路的监控系统..."
            active={true}
          />

          <ResultCard 
            title="汽车零部件企业精益管理转型方案"
            type="ppt"
            match="88%"
            date="2023-04-15"
            summary="详细拆解了汽车零部件行业的成本构成，重点分析了人工成本和能源成本的优化空间。包含了大量可复用的行业标准数据和基准指标。"
            highlight="...通过优化排班与能源管理系统联动，可实现车间能耗下降15%..."
            active={false}
          />

          <ResultCard 
            title="A集团高管深度访谈 - 供应链总监"
            type="audio"
            match="76%"
            date="2021-09-05"
            summary="客户方供应链总监对当前仓储物流成本居高不下的深度剖析，提到了第三方物流整合失败的教训。"
            highlight="...我们在整合区域外包仓储时，忽略了信息系统对接的隐性成本..."
            active={false}
          />
        </div>

        {/* AI Insight Panel (Right Side) */}
        <div className="w-1/2 bg-gray-50 overflow-auto p-6 flex flex-col">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-800">
                <BrainCircuit size={20} />
                <h3 className="font-semibold text-lg">BrainBox 智能洞察</h3>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium border border-blue-200">
                基于选中案例生成
              </span>
            </div>
            
            <div className="p-6 overflow-auto flex-1 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">核心观点提取</h4>
                <ul className="space-y-3 text-sm text-gray-700 list-disc pl-5">
                  <li>重工制造业成本优化的核心难点通常不在于单一环节，而在于**跨部门的协同浪费**。</li>
                  <li>建立**废料循环追踪系统**是短期见效最快的抓手（预计投资回报率 300%）。</li>
                  <li>该项目采用的《STM四象限成本削减矩阵》可以直接套用于当前您的需求。</li>
                </ul>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">关键图表引用建议</h4>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 flex items-center justify-center h-32 text-gray-500 text-sm">
                  [此处显示自动提取的“降本增效路线图”图表缩略图]
                </div>
                <button className="mt-3 w-full py-2 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  添加到当前撰写的报告中
                </button>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageSquare size={16} /> 追问 BrainBox
                </h4>
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <input 
                    type="text" 
                    placeholder="就当前这篇文档深入提问..." 
                    className="w-full text-sm border-none focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition">这篇报告有没有提到具体的人员优化方案？</button>
                  <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition">帮我总结其风险控制策略</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ title, type, match, date, summary, highlight, active }) {
  return (
    <div className={`p-4 rounded-xl border transition cursor-pointer ${
      active ? 'border-blue-500 bg-blue-50/30 shadow-md ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            type === 'pdf' ? 'bg-red-100 text-red-600' : 
            type === 'ppt' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
          }`}>
            {type === 'audio' ? <Play size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <h4 className={`font-semibold text-base ${active ? 'text-blue-900' : 'text-gray-900'}`}>{title}</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="uppercase font-bold tracking-wider">{type}</span>
              <span>{date}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 mb-1">匹配度</span>
          <span className="text-lg font-bold text-emerald-600">{match}</span>
        </div>
      </div>
      
      <div className="mt-3">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{summary}</p>
        <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded border border-yellow-200">
          <span className="font-semibold mr-1">关键词命中：</span>
          <span dangerouslySetInnerHTML={{ __html: highlight.replace(/成本优化|精益生产|降低/g, '<mark class="bg-yellow-200 px-1 rounded">$&</mark>') }} />
        </div>
      </div>
    </div>
  );
}