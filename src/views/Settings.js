import React, { useState } from 'react';
import { 
  BookOpen, SlidersHorizontal, Library, CheckCircle2, 
  ToggleRight, ToggleLeft, UploadCloud, ShieldCheck,
  Globe, Building, AlertCircle
} from 'lucide-react';

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

  const toggleFramework = (key) => {
    setFrameworks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden">
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
      <div className="flex-1 overflow-auto p-8">
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
                  active={frameworks.mckinsey} onToggle={() => toggleFramework('mckinsey')} 
                />
                <FrameworkToggle 
                  title="波士顿矩阵 (BCG Matrix)" desc="业务组合与市场份额/增长率分析" 
                  active={frameworks.bcg} onToggle={() => toggleFramework('bcg')} 
                />
                <FrameworkToggle 
                  title="波特五力模型" desc="行业竞争格局与吸引力评估" 
                  active={frameworks.porter} onToggle={() => toggleFramework('porter')} 
                />
                <FrameworkToggle 
                  title="SCOR 供应链参考模型" desc="深度供应链诊断、绩效与流程优化" 
                  active={frameworks.scor} onToggle={() => toggleFramework('scor')} 
                />
                <FrameworkToggle 
                  title="PESTEL 宏观环境分析" desc="政、经、社、技、环、法多维度外部扫描" 
                  active={frameworks.pestel} onToggle={() => toggleFramework('pestel')} 
                />
                <FrameworkToggle 
                  title="SWOT 分析模型" desc="优势、劣势、机会、威胁基础诊断" 
                  active={frameworks.swot} onToggle={() => toggleFramework('swot')} 
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
    </div>
  );
}

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

function FrameworkToggle({ title, desc, active, onToggle }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 cursor-pointer" onClick={onToggle}>
      <div>
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <div className={active ? 'text-blue-600' : 'text-gray-300'}>
        {active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
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