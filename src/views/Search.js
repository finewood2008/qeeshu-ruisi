import React, { useState, useEffect, useRef } from 'react';
import { 
  Search as SearchIcon, Filter, FileText, BrainCircuit, Play, MessageSquare, 
  Send, Image as ImageIcon, CheckCircle2, ChevronDown, X
} from 'lucide-react';

// --- Mock Data ---
const mockResults = [
  {
    id: 1,
    title: "XX重工 2022年制造成本全面优化项目结项报告",
    type: "pdf",
    match: 95,
    date: "2022-11-20",
    summary: "该项目通过引入精益生产模式，结合柔性供应链改造，在6个月内帮助客户将直接制造成本降低了12%。其中关于废料回收体系的建立与您目前的查询高度相关。",
    highlight: "...建议从生产流程中的原材料损耗入手，建立全链路的监控系统...",
    insights: [
      "重工制造业成本优化的核心难点通常不在于单一环节，而在于**跨部门的协同浪费**。",
      "建立**废料循环追踪系统**是短期见效最快的抓手（预计投资回报率 300%）。",
      "该项目采用的《STM四象限成本削减矩阵》可以直接套用于当前您的需求。"
    ],
    chart: { title: "降本增效路线图", type: "line" },
    suggestedQuestions: ["这篇报告有没有提到具体的人员优化方案？", "帮我总结其风险控制策略"]
  },
  {
    id: 2,
    title: "汽车零部件企业精益管理转型方案",
    type: "ppt",
    match: 88,
    date: "2023-04-15",
    summary: "详细拆解了汽车零部件行业的成本构成，重点分析了人工成本和能源成本的优化空间。包含了大量可复用的行业标准数据和基准指标。",
    highlight: "...通过优化排班与能源管理系统联动，可实现车间能耗下降15%...",
    insights: [
      "人工成本占比在零部件企业普遍偏高，**定岗定编优化**是破局关键。",
      "能源管理系统(EMS)的引入能平均带来 10%-15% 的电力节省。",
      "需要特别关注与主机厂的**JIT（准时制交付）协同成本**及违约风险。"
    ],
    chart: { title: "车间能耗下降趋势模型预测", type: "bar" },
    suggestedQuestions: ["报告中提到的基准指标具体是多少？", "如何说服一线员工配合排班优化？"]
  },
  {
    id: 3,
    title: "A集团高管深度访谈 - 供应链总监",
    type: "audio",
    match: 76,
    date: "2021-09-05",
    summary: "客户方供应链总监对当前仓储物流成本居高不下的深度剖析，提到了第三方物流整合失败的教训。",
    highlight: "...我们在整合区域外包仓储时，忽略了信息系统对接的隐性成本...",
    insights: [
      "第三方物流(3PL)整合失败的最大原因是**IT系统不兼容导致的隐性人工操作成本剧增**。",
      "高管团队对于激进的成本削减持保守态度，更倾向于**平稳过渡的微调方案**。",
      "区域外包仓储的议价能力较弱，建议采取集中采购模式。"
    ],
    chart: { title: "物流成本构成饼图", type: "pie" },
    suggestedQuestions: ["供应链总监对哪些供应商最不满意？", "访谈中提到哪些历史遗留问题？"]
  }
];

export default function Search() {
  const [query, setQuery] = useState('制造业成本优化');
  const [selectedId, setSelectedId] = useState(mockResults[0].id);
  const [showFilter, setShowFilter] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const selectedData = mockResults.find(r => r.id === selectedId);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Reset chat when switching documents
  useEffect(() => {
    setMessages([]);
    setChatInput('');
  }, [selectedId]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      let reply = "";
      if (text.includes("人员优化") || text.includes("人工")) {
        reply = "在这篇文档中，关于人员优化主要提出了两点：1. 引入自动化设备替代高危/重复性工位（预计替代率15%）；2. 实行跨岗培训，培养多能工，以应对订单的季节性波动。您需要我将详细的数据对比提取出来吗？";
      } else if (text.includes("风险")) {
        reply = "文档中提到的核心风险控制策略包括：1. 建立**分级供应商备份机制**，避免单一供应商断供引发的生产停滞；2. 预留 5% 的产能冗余应对激增订单。";
      } else {
        reply = `根据文档上下文，关于“${text}”，报告中建议结合行业平均水平（基准数据库）进行对标分析，重点关注那些超出基准线 20% 以上的异常消耗项。`;
      }
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* --- Header / Search Area --- */}
      <div className="p-6 border-b border-gray-200 bg-gray-50/80 z-10">
        <div className="flex gap-4">
          <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <SearchIcon size={20} className="text-gray-400 ml-4 mr-2" />
            <input 
              type="text" 
              className="bg-transparent border-none focus:outline-none w-full text-gray-800 text-lg py-3"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入查询内容，例如：制造成本优化..."
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-md font-medium transition mr-1.5 flex items-center gap-2">
              智能检索
            </button>
          </div>
          
          {/* Advanced Filter Button & Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className="px-6 py-3 h-full bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 transition shadow-sm"
            >
              <Filter size={18} />
              高级筛选
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-800">检索过滤条件</h4>
                  <X size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setShowFilter(false)} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">资产类型</label>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded border border-blue-200 cursor-pointer">全部</span>
                      <span className="px-3 py-1 bg-white text-gray-600 text-sm rounded border border-gray-200 cursor-pointer hover:bg-gray-50">PDF/Word</span>
                      <span className="px-3 py-1 bg-white text-gray-600 text-sm rounded border border-gray-200 cursor-pointer hover:bg-gray-50">PPT</span>
                      <span className="px-3 py-1 bg-white text-gray-600 text-sm rounded border border-gray-200 cursor-pointer hover:bg-gray-50">访谈录音</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">时间范围</label>
                    <select className="w-full border border-gray-200 rounded p-2 text-sm text-gray-700 outline-none focus:border-blue-500">
                      <option>不限时间</option>
                      <option>最近半年</option>
                      <option>最近一年</option>
                      <option>2022年及以前</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-4 text-sm items-center">
          <span className="text-gray-500">相关搜索：</span>
          <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition">精益生产与降本增效</span>
          <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition">汽车行业供应链优化</span>
          <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition">人力资源成本管控</span>
        </div>
      </div>

      {/* --- Main Layout --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Col: Results List */}
        <div className="w-1/2 border-r border-gray-200 overflow-auto p-6 space-y-4 bg-white custom-scrollbar">
          <p className="text-sm text-gray-500 mb-4">找到 15 个高度相关案例，已按照<span className="font-semibold text-gray-700">匹配度排序</span></p>
          
          {mockResults.map((result) => (
            <ResultCard 
              key={result.id}
              data={result}
              active={selectedId === result.id}
              onClick={() => setSelectedId(result.id)}
            />
          ))}
        </div>

        {/* Right Col: AI Insight Panel */}
        <div className="w-1/2 bg-[#F8FAFC] overflow-auto p-6 flex flex-col custom-scrollbar">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-200 bg-blue-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-800">
                <BrainCircuit size={20} />
                <h3 className="font-semibold text-lg">BrainBox 智能洞察</h3>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium border border-blue-200">
                基于选中案例生成
              </span>
            </div>
            
            {/* Panel Content Scrollable */}
            <div className="p-6 overflow-auto flex-1 space-y-8">
              
              {/* Insights */}
              <div className="animate-fade-in-up">
                <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-sm"></div>
                  核心观点提取
                </h4>
                <ul className="space-y-3 text-sm text-gray-700 list-disc pl-6 marker:text-gray-400">
                  {selectedData.insights.map((insight, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>') }}></li>
                  ))}
                </ul>
              </div>

              {/* Chart Suggestion */}
              <div className="border-t border-gray-100 pt-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-sm"></div>
                  关键图表引用建议
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center h-40 text-gray-500 text-sm group cursor-pointer hover:border-blue-400 transition">
                  <ImageIcon size={32} className="text-gray-300 mb-3 group-hover:text-blue-400 transition" />
                  <span>[此处显示自动提取的“{selectedData.chart.title}”图表缩略图]</span>
                </div>
                <button className="mt-3 w-full py-2.5 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium hover:bg-gray-50 hover:text-blue-600 transition flex items-center justify-center gap-2">
                  添加当前撰写的报告中
                </button>
              </div>

              {/* Chat Section */}
              <div className="border-t border-gray-100 pt-6 flex flex-col flex-1 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                <h4 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <MessageSquare size={16} className="text-purple-500" /> 追问 BrainBox
                </h4>
                
                {/* Chat History */}
                <div className="bg-gray-50 border border-gray-200 rounded-t-lg p-4 flex-1 min-h-[150px] max-h-[300px] overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      提出关于这篇文档的具体问题...
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
                        }`}>
                          <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none p-3 shadow-sm flex gap-1 items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="bg-white border-x border-b border-gray-200 rounded-b-lg p-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1 pr-2">
                    <input 
                      type="text" 
                      placeholder="就当前这篇文档深入提问..." 
                      className="w-full bg-transparent text-sm border-none focus:outline-none px-3 py-1.5 text-gray-700"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                    />
                    <button 
                      onClick={() => handleSendMessage(chatInput)}
                      disabled={!chatInput.trim()}
                      className={`p-1.5 rounded-md transition ${chatInput.trim() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  
                  {/* Suggestion Chips */}
                  {messages.length === 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {selectedData.suggestedQuestions.map((q, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="text-xs bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-600 px-3 py-1.5 rounded-full transition truncate max-w-[200px]"
                          title={q}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function ResultCard({ data, active, onClick }) {
  const { title, type, match, date, summary, highlight } = data;
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
        active 
          ? 'border-blue-400 bg-blue-50/40 shadow-md ring-1 ring-blue-400' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      {/* Active Indicator Line */}
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}

      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
            type === 'pdf' ? 'bg-red-50 text-red-600 border border-red-100' : 
            type === 'ppt' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
          }`}>
            {type === 'audio' ? <Play size={20} className="ml-0.5" /> : <FileText size={20} />}
          </div>
          <div>
            <h4 className={`font-bold text-[15px] leading-tight mb-1 ${active ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-700 transition'}`}>
              {title}
            </h4>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="uppercase font-bold tracking-wider">{type}</span>
              <span>{date}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 mb-0.5">匹配度</span>
          <span className={`text-lg font-black ${active ? 'text-emerald-600' : 'text-emerald-500'}`}>{match}%</span>
        </div>
      </div>
      
      <div className="mt-3">
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{summary}</p>
        <div className={`text-[12px] p-2.5 rounded border transition-colors ${
          active ? 'bg-yellow-50/80 border-yellow-200 text-yellow-800' : 'bg-gray-50 border-gray-100 text-gray-600'
        }`}>
          <span className="font-bold mr-1">关键词命中：</span>
          <span dangerouslySetInnerHTML={{ __html: highlight.replace(/成本优化|精益生产|降低|排班|能耗|隐性/g, '<mark class="bg-yellow-200 px-0.5 rounded text-gray-900">$&</mark>') }} />
        </div>
      </div>
    </div>
  );
}