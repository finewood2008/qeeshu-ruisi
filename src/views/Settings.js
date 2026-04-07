import React, { useState } from 'react';
import { 
  BookOpen, SlidersHorizontal, Library, CheckCircle2, 
  ToggleRight, ToggleLeft, UploadCloud, ShieldCheck,
  Globe, Building, AlertCircle, X, Info
} from 'lucide-react';

// --- Mock Data for Framework Details ---
const frameworkDetails = {
  mckinsey: {
    title: "麦肯锡 7S 模型 (McKinsey 7S Framework)",
    desc: "用于分析企业内部组织的结构和效能，强调各项要素之间的协同性。",
    dimensions: ["Strategy (战略)", "Structure (结构)", "Systems (制度)", "Shared Values (共同价值观)", "Style (风格)", "Staff (员工)", "Skills (技能)"],
    application: "当“企数睿思”激活此模型时，在诊断企业数字化转型受阻时，会自动扫描报告中是否仅关注了‘系统(Systems)’，而忽视了‘员工技能(Skills)’或‘企业文化(Shared Values)’的匹配度。",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/McKinsey_7S_Framework.svg/512px-McKinsey_7S_Framework.svg.png"
  },
  bcg: {
    title: "波士顿矩阵 (BCG Matrix)",
    desc: "用于大型企业进行业务组合分析，基于市场增长率和相对市场份额评估各项业务。",
    dimensions: ["Stars (明星业务)", "Cash Cows (现金牛业务)", "Question Marks (问题业务)", "Dogs (瘦狗业务)"],
    application: "激活此模型后，AI 在处理多业务线客户时，会自动根据其各业务的营收增速和市场占有率数据，生成气泡图，并建议资源分配策略（如：用现金牛业务的利润去投资明星业务）。",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/BCG_Matrix.svg/512px-BCG_Matrix.svg.png"
  },
  porter: {
    title: "波特五力模型 (Porter's Five Forces)",
    desc: "用于分析行业竞争态势和市场吸引力的经典战略框架。",
    dimensions: ["现有竞争者的竞争能力", "潜在进入者的威胁", "替代品的威胁", "供应商的讨价还价能力", "购买者的讨价还价能力"],
    application: "当遇到“新市场进入可行性分析”类需求时，企数睿思会自动按照这五个维度，去全网或内网知识库中爬取相关情报，生成全面的竞争格局风险提示。",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Porter%27s_Five_Forces_Model.svg/512px-Porter%27s_Five_Forces_Model.svg.png"
  }
};

export default function Settings() {
  const [strategy, setStrategy] = useState('mixed');
  const [frameworks, setFrameworks] = useState({
    mckinsey: true,
    bcg: true,
    porter: true,
    scor: false,
    pestel: true,
    swot: true,
  });

  // Modal State
  const [selectedFramework, setSelectedFramework] = useState(null);

  const toggleFramework = (e, key) => {
    e.stopPropagation(); // 阻止冒泡，避免触发打开 Modal
    setFrameworks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openFrameworkModal = (key) => {
    // 只有我们预先写了 mock 数据的才可以点开，为了演示效果
    if(frameworkDetails[key]) {
      setSelectedFramework(frameworkDetails[key]);
    } else {
      setSelectedFramework({
        title: key.toUpperCase() + " 模型",
        desc: "该模型详细说明正在由企数睿思知识工程团队完善中...",
        dimensions: ["维度 1", "维度 2", "维度 3"],
        application: "激活后，企数睿思将在相关诊断场景中优先调用此模型的分析逻辑。"
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden relative">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <SlidersHorizontal className="text-blue-600" />
            系统与方法论设置
          </h2>
          <p className="text-sm text-gray-500 mt-1">配置 企数睿思 (QEESHU RUISI) 的底层思考逻辑与参考框架</p>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition shadow-sm">
          保存全部更改
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 relative">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Strategy Setting */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <BrainIcon className="text-blue-600" />
              <h3 className="font-bold text-lg text-gray-900">AI 思考策略与框架调用优先级</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <StrategyCard 
                  id="mixed" current={strategy} onClick={() => setStrategy('mixed')}
                  title="智能混合模式 (推荐)" 
                  icon={<ShieldCheck size={24} />}
                  desc="优先依赖机构自有理论框架，在自有框架缺乏相关维度时，智能调用权威公开框架作为补充。"
                />
                <StrategyCard 
                  id="private" current={strategy} onClick={() => setStrategy('private')}
                  title="严格私有模式" 
                  icon={<Building size={24} />}
                  desc="仅严格依据本地上传的机构自有知识库与方法论进行诊断，杜绝一切外部知识，确保绝对独特视角。"
                />
                <StrategyCard 
                  id="public" current={strategy} onClick={() => setStrategy('public')}
                  title="通用公开模式" 
                  icon={<Globe size={24} />}
                  desc="主要依赖内置的全球经典管理学理论进行分析，适合初创机构或标准化程度高的行业研究。"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Built-in Global Frameworks */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="text-blue-600" size={20} />
                  <h3 className="font-bold text-gray-900">预置全球经典咨询框架库</h3>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">已激活 {Object.values(frameworks).filter(Boolean).length} 项</span>
              </div>
              <div className="p-2">
                <FrameworkToggle 
                  title="麦肯锡 7S 模型" desc="组织诊断与战略落地一致性分析" 
                  active={frameworks.mckinsey} 
                  onToggle={(e) => toggleFramework(e, 'mckinsey')} 
                  onClick={() => openFrameworkModal('mckinsey')}
                />
                <FrameworkToggle 
                  title="波士顿矩阵 (BCG Matrix)" desc="业务组合与市场份额/增长率分析" 
                  active={frameworks.bcg} 
                  onToggle={(e) => toggleFramework(e, 'bcg')} 
                  onClick={() => openFrameworkModal('bcg')}
                />
                <FrameworkToggle 
                  title="波特五力模型" desc="行业竞争格局与吸引力评估" 
                  active={frameworks.porter} 
                  onToggle={(e) => toggleFramework(e, 'porter')} 
                  onClick={() => openFrameworkModal('porter')}
                />
                <FrameworkToggle 
                  title="SCOR 供应链参考模型" desc="深度供应链诊断、绩效与流程优化" 
                  active={frameworks.scor} 
                  onToggle={(e) => toggleFramework(e, 'scor')} 
                  onClick={() => openFrameworkModal('scor')}
                />
                <FrameworkToggle 
                  title="PESTEL 宏观环境分析" desc="政、经、社、技、环、法多维度外部扫描" 
                  active={frameworks.pestel} 
                  onToggle={(e) => toggleFramework(e, 'pestel')} 
                  onClick={() => openFrameworkModal('pestel')}
                />
                <FrameworkToggle 
                  title="SWOT 分析模型" desc="优势、劣势、机会、威胁基础诊断" 
                  active={frameworks.swot} 
                  onToggle={(e) => toggleFramework(e, 'swot')} 
                  onClick={() => openFrameworkModal('swot')}
                />
              </div>
            </div>

            {/* Proprietary Frameworks */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-purple-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="text-purple-600" size={20} />
                  <h3 className="font-bold text-gray-900">机构自有理论框架管理 (IP)</h3>
                </div>
                <button className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition shadow-sm">
                  <UploadCloud size={14} /> 导入新框架
                </button>
              </div>
              <div className="p-6 flex-1 bg-gray-50/50">
                
                {strategy === 'public' && (
                  <div className="mb-4 flex items-start gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200 text-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    您当前选择了“通用公开模式”，自有框架的调用优先级将被降低。
                  </div>
                )}

                <div className="space-y-3">
                  <ProprietaryItem title="供应链四象限评估模型_V2.0" date="2023.11 更新" />
                  <ProprietaryItem title="企业数字化成熟度度量体系 (六维)" date="2024.01 更新" />
                  <ProprietaryItem title="零售门店坪效诊断漏斗模型" date="2023.08 更新" />
                </div>
                
                <div className="mt-6 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 bg-white hover:bg-gray-50 hover:border-blue-400 transition cursor-pointer">
                  <UploadCloud size={32} className="mb-2 text-gray-400" />
                  <p className="text-sm font-bold text-gray-700">拖拽或点击上传内部培训手册/方法论文档</p>
                  <p className="text-xs mt-1">支持 PDF, PPT, Word 等格式，AI 将自动提炼结构作为私有判断框架</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- Framework Detail Modal (Floating Layer) --- */}
      {selectedFramework && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedFramework(null)}></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all animate-fade-in-up">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="text-blue-600" size={20}/>
                {selectedFramework.title}
              </h3>
              <button onClick={() => setSelectedFramework(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Introduction */}
              <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                {selectedFramework.desc}
              </p>

              {/* Visualization Placeholder */}
              <div className="w-full h-48 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center mb-8 relative overflow-hidden group">
                {selectedFramework.imageUrl ? (
                  <>
                     <div className="absolute inset-0 bg-white opacity-90 mix-blend-overlay"></div>
                     <p className="text-gray-400 font-medium z-10 flex items-center gap-2">
                       <ImageIcon size={20} />
                       框架结构图谱可视化
                     </p>
                  </>
                ) : (
                  <p className="text-gray-400 font-medium flex items-center gap-2"><ImageIcon size={20} /> 模型结构图谱可视化</p>
                )}
              </div>

              {/* Dimensions */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-900 mb-3 border-l-4 border-blue-500 pl-2">包含诊断维度</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFramework.dimensions.map((dim, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
                      {dim}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Application Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                  <Info size={18} />
                  企数睿思 AI 调用场景说明
                </h4>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  {selectedFramework.application}
                </p>
              </div>

            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
               <button 
                 onClick={() => setSelectedFramework(null)}
                 className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
               >
                 确认并关闭
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub components

function StrategyCard({ id, current, onClick, title, desc, icon }) {
  const active = current === id;
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
        active 
          ? 'border-blue-600 bg-blue-50/30 shadow-md ring-1 ring-blue-600' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {icon}
        </div>
        {active && <CheckCircle2 className="text-blue-600" size={20} />}
      </div>
      <h4 className={`font-bold text-base mb-2 ${active ? 'text-blue-900' : 'text-gray-900'}`}>{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function FrameworkToggle({ title, desc, active, onToggle, onClick }) {
  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-white hover:shadow-sm hover:border-gray-300 border border-transparent rounded-lg transition group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-[15px] font-bold text-gray-900 group-hover:text-blue-700 transition">{title}</h4>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">点击查看详情</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
      <div 
        className={`ml-4 transition-colors ${active ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 hover:text-gray-400'}`}
        onClick={onToggle}
      >
        {active ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
      </div>
    </div>
  );
}

function ProprietaryItem({ title, date }) {
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center group hover:border-purple-300 transition">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 text-purple-600 p-1.5 rounded">
          <BookOpen size={16} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800 group-hover:text-purple-700 transition">{title}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">{date}</p>
        </div>
      </div>
      <div className="text-emerald-500 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
        <CheckCircle2 size={12} /> 优先调用
      </div>
    </div>
  );
}

// Missing icon fix
import { Image as ImageIcon } from 'lucide-react';

function BrainIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  );
}