import React, { useState, useRef, useEffect } from 'react';
import { 
  Wand2, AlignLeft, Bold, Italic, List, Save, Download, 
  BarChart3, Image as ImageIcon, Plus, CheckCircle2, AlertCircle, 
  Sparkles, ChevronRight, LayoutTemplate, MoreHorizontal, X, FileText, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Default Data ---
const initialChartData = [
  { month: '1月', 现有成本: 4000, 优化预期: 4000 },
  { month: '2月', 现有成本: 3000, 优化预期: 2800 },
  { month: '3月', 现有成本: 2000, 优化预期: 1500 },
  { month: '4月', 现有成本: 2780, 优化预期: 1908 },
  { month: '5月', 现有成本: 1890, 优化预期: 1200 },
  { month: '6月', 现有成本: 2390, 优化预期: 1100 },
];

export default function AIWriter() {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [blocks, setBlocks] = useState([
    { id: '1', type: 'h2', content: '一、 核心问题诊断' },
    { id: '2', type: 'p', content: '客户目前面临市场竞争加剧，利润空间被严重压缩的困境。经过初步调研与高管访谈，我们诊断出以下两个核心症结：' },
    { id: '3', type: 'list', items: [
      { id: '3-1', text: '直接制造成本偏高：生产线自动化率低于行业基准15%，导致人工成本高昂且废品率波动大。' },
      { id: '3-2', text: '供应链物流冗余：缺乏集中的干线物流规划，区域分发仓重叠度达30%。' }
    ]},
    { id: '4', type: 'chart', data: initialChartData, title: '制造成本优化预期预测模型', subtitle: '基于STM标准制造业降本曲线测算', figCaption: '图 1-1: 导入精益管理后未来6个月成本下降趋势（单位：万元）' }
  ]);
  
  // Right Panel States
  const [methodologyScore, setMethodologyScore] = useState(65);
  const [isMissingModel, setIsMissingModel] = useState(true);
  const [isFixingModel, setIsFixingModel] = useState(false);
  const [isGeneratingParagraph, setIsGeneratingParagraph] = useState(false);
  
  // Slash Menu Reference
  const slashMenuRef = useRef(null);
  
  // Close slash menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (slashMenuRef.current && !slashMenuRef.current.contains(event.target)) {
        setShowSlashMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers for Right Panel Actions ---

  const handleFixModel = () => {
    setIsFixingModel(true);
    setTimeout(() => {
      // 1. Add new blocks for the missing model
      const newBlocks = [
        ...blocks,
        { id: `gen-${Date.now()}`, type: 'h3', content: '1.1 供应链四象限评估' },
        { id: `gen-${Date.now()+1}`, type: 'p', content: '基于 STM 标准化的《供应链四象限评估模型》，我们将客户当前的供应商池依据“供应风险”与“利润影响”进行了分类映射。分析表明，客户在“瓶颈物资”象限投入的管理资源严重不足。', aiGenerated: true },
        { id: `gen-${Date.now()+2}`, type: 'image', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop', caption: '图 1-2: 供应链物资风险矩阵分析 (AI自动匹配知识库配图)' }
      ];
      setBlocks(newBlocks);
      
      // 2. Update panel state
      setIsMissingModel(false);
      setMethodologyScore(85);
      setIsFixingModel(false);
    }, 1500);
  };

  const handleExpandDimension = () => {
    setIsGeneratingParagraph(true);
    setTimeout(() => {
      // Find the list block and add a new item
      const newBlocks = blocks.map(block => {
        if (block.type === 'list') {
          return {
            ...block,
            items: [
              ...block.items,
              { id: `gen-li-${Date.now()}`, text: '采购招标寻源策略缺失（AI补充）：未建立集中的战略采购平台，导致非生产性物料(MRO)采购成本比长三角同行业基准高出 22%。', aiGenerated: true }
            ]
          };
        }
        return block;
      });
      setBlocks(newBlocks);
      setIsGeneratingParagraph(false);
    }, 1200);
  };

  // --- Render Block Helper ---
  const renderBlock = (block) => {
    const aiIndicator = block.aiGenerated && (
      <span className="absolute -left-6 top-1 text-purple-500 animate-pulse" title="企数睿思 AI 生成">
        <Sparkles size={16} />
      </span>
    );

    switch(block.type) {
      case 'h2':
        return <h2 className="text-xl font-bold mb-3 mt-8 relative group">{aiIndicator}{block.content}</h2>;
      case 'h3':
        return <h3 className="text-lg font-bold mb-2 mt-6 relative group text-blue-900">{aiIndicator}{block.content}</h3>;
      case 'p':
        return (
          <p className={`relative group mb-3 ${block.aiGenerated ? 'bg-purple-50 text-purple-900 p-2 rounded border border-purple-100' : ''}`}>
            {aiIndicator}
            {block.content}
          </p>
        );
      case 'list':
        return (
          <ul className="list-decimal pl-5 mt-2 space-y-2 relative group">
            {block.items.map(item => (
              <li key={item.id} className={`relative ${item.aiGenerated ? 'bg-purple-50 text-purple-900 p-1.5 rounded -ml-1.5 border border-purple-100 marker:text-purple-500' : 'marker:text-gray-500'}`}>
                {item.aiGenerated && <Sparkles size={12} className="absolute -left-5 top-1.5 text-purple-500" />}
                <span dangerouslySetInnerHTML={{ __html: item.text.replace(/([^：]+：)/, '<strong>$1</strong>') }} />
              </li>
            ))}
          </ul>
        );
      case 'chart':
        return (
          <div className="group relative my-8 border border-blue-100 bg-blue-50/30 rounded-xl p-6 shadow-sm">
            <div className="absolute -top-3 left-6 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-blue-200">
              <Sparkles size={10} /> 企数睿思 自动图表
            </div>
            <div className="flex justify-between items-center mb-6 mt-2">
              <div>
                <h3 className="font-bold text-gray-900">{block.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{block.subtitle}</p>
              </div>
              <button className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 px-2 py-1 rounded bg-white">编辑数据源</button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={block.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="现有成本" stroke="#94a3b8" fillOpacity={1} fill="url(#colorCurrent)" />
                  <Area type="monotone" dataKey="优化预期" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOptimized)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">{block.figCaption}</p>
          </div>
        );
      case 'image':
        return (
          <div className="group relative my-8 border border-gray-200 rounded-xl p-2 shadow-sm bg-white">
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 z-10">
              <ImageIcon size={10} /> 智能配图
            </div>
            <div className="rounded-lg overflow-hidden bg-gray-100 h-64 flex items-center justify-center relative">
               <img src={block.url} alt={block.caption} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-center text-gray-500 mt-3 mb-2">{block.caption}</p>
          </div>
        );
      default:
        return null;
    }
  };

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
            <button className="flex items-center gap-1.5 p-1.5 px-2 hover:bg-purple-50 text-purple-700 rounded transition text-sm font-medium group">
              <Sparkles size={14} className="group-hover:animate-pulse" /> 自动润色
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

            {/* Content Blocks Render */}
            <div className="space-y-4 text-gray-800 leading-relaxed text-[15px]">
              {blocks.map(block => (
                <div key={block.id} className="group relative">
                   {/* Block Hover Actions (Notion style) */}
                   <div className="absolute -left-10 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer">
                    <Plus size={20} className="text-gray-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); setShowSlashMenu(!showSlashMenu); }} />
                    <MoreHorizontal size={20} className="text-gray-400 hover:text-gray-600" />
                  </div>
                  {renderBlock(block)}
                </div>
              ))}

              {/* Active Line with Slash Menu Trigger */}
              <div className="group relative pt-4 pb-24" ref={slashMenuRef}>
                <div className="absolute -left-10 top-4 opacity-100 flex items-center gap-1 cursor-pointer">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition ${showSlashMenu ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                    <Plus size={16} onClick={() => setShowSlashMenu(!showSlashMenu)} className={showSlashMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
                  </div>
                </div>
                <div className="flex items-center text-gray-400 text-base" onClick={() => setShowSlashMenu(true)}>
                  <span className="cursor-text">在此输入正文... 或输入</span>
                  <span className="mx-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shadow-sm font-mono text-xs border border-gray-200">/</span>
                  <span>唤出 AI 组件</span>
                </div>

                {/* Floating Slash Menu */}
                {showSlashMenu && (
                  <div className="absolute left-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30 animate-fade-in-up">
                    <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span>AI 智能生成</span>
                      <span className="text-[10px] font-normal text-gray-400">ESC 关闭</span>
                    </div>
                    <div className="p-1 space-y-0.5">
                      <MenuItem icon={<Wand2 size={16} className="text-purple-500"/>} title="自动续写内容" sub="根据上下文生成专业段落" />
                      <MenuItem icon={<BarChart3 size={16} className="text-blue-500"/>} title="生成数据图表" sub="输入数据自动清洗并绘图" />
                      <MenuItem icon={<LayoutTemplate size={16} className="text-emerald-500"/>} title="插入标准模型框架图" sub="波士顿矩阵、鱼骨图等" onClick={() => { handleFixModel(); setShowSlashMenu(false); }} />
                      <MenuItem icon={<ImageIcon size={16} className="text-orange-500"/>} title="智能配图生成" sub="根据当前段落语义检索配图" />
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <MenuItem icon={<FileText size={16} className="text-gray-500"/>} title="基础块" sub="文本、标题、列表等" />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 transition-all">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <CheckCircle2 size={18} className={methodologyScore >= 80 ? "text-emerald-500" : "text-amber-500"} />
              方法论完整性审查
            </div>
            <span className={`text-xs px-2 py-1 rounded font-bold transition-colors ${methodologyScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              得分 {methodologyScore}分
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700">核心问题诊断逻辑清晰</p>
            </div>
            
            {isMissingModel ? (
              <div className="flex items-start gap-3 animate-fade-in">
                <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">缺失 STM 标准化解决方案框架</p>
                  <p className="text-xs text-red-600 mt-1">未引入标准的《供应链四象限评估模型》</p>
                  <button 
                    onClick={handleFixModel}
                    disabled={isFixingModel}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold transition disabled:opacity-50"
                  >
                    {isFixingModel ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} 
                    {isFixingModel ? 'AI 正在生成并插入...' : '一键让 AI 补充模型分析框架'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 animate-fade-in-up">
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">已应用《供应链四象限评估模型》</p>
                  <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mt-1 inline-block">AI 自动生成</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actionable AI Context Suggestions Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden flex-1 flex flex-col relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <div className="p-4 border-b border-blue-100 bg-gradient-to-b from-blue-50/80 to-white flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Sparkles size={18} className="text-blue-600" />
              企数睿思·情境辅助推荐
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </div>
          
          <div className="p-5 flex-1 overflow-auto space-y-6 custom-scrollbar">
            
            {/* Suggestion 1: Content Expansion */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition shadow-sm group relative overflow-hidden">
              {isGeneratingParagraph && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 size={24} className="text-blue-600 animate-spin mb-2" />
                  <span className="text-xs text-blue-800 font-medium">知识库检索与生成中...</span>
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
                  <AlignLeft size={14} className="text-blue-500"/> 扩充诊断维度
                </h4>
              </div>
              <p className="text-[12px] text-gray-600 mb-4 leading-relaxed">
                系统检测到您当前仅列出了“制造成本”和“物流”。根据知识库中同行业（重工）历史成功案例，<span className="bg-yellow-100 text-yellow-800 px-1 rounded font-medium">采购招标寻源策略</span> 通常是降本空间最大的环节。
              </p>
              <button 
                onClick={handleExpandDimension}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg shadow-sm shadow-blue-600/20 transition font-bold flex justify-center items-center gap-2"
              >
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

function MenuItem({ icon, title, sub, onClick }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 p-2.5 hover:bg-blue-50 cursor-pointer rounded-lg transition group">
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