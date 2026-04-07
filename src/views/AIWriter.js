import React, { useState } from 'react';
import { 
  FileEdit, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Wand2, 
  AlignLeft,
  Bold,
  Italic,
  List,
  Save,
  Download
} from 'lucide-react';

export default function AIWriter() {
  const [content, setContent] = useState(
    "一、 项目背景\n客户目前面临市场竞争加剧，利润空间被压缩的困境。因此希望引入专业咨询团队进行成本优化。\n\n二、 核心问题诊断\n1. 人力成本偏高\n2. 生产效率低下"
  );

  return (
    <div className="flex h-full gap-6">
      {/* Editor Area (Left) */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-gray-500">
            <button className="p-2 hover:bg-gray-200 rounded"><Bold size={18} /></button>
            <button className="p-2 hover:bg-gray-200 rounded"><Italic size={18} /></button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button className="p-2 hover:bg-gray-200 rounded"><AlignLeft size={18} /></button>
            <button className="p-2 hover:bg-gray-200 rounded"><List size={18} /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">已自动保存 14:23</span>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded bg-white shadow-sm">
              <Save size={16} /> 保存
            </button>
            <button className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded shadow-sm">
              <Download size={16} /> 导出 Word
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-8 bg-gray-50 overflow-auto">
          <div className="max-w-3xl mx-auto bg-white min-h-full p-12 shadow-sm border border-gray-200 rounded">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">A集团降本增效初步诊断方案</h1>
            <textarea 
              className="w-full h-full min-h-[500px] resize-none border-none focus:outline-none text-gray-800 leading-relaxed text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始撰写您的报告..."
            />
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar (Right) */}
      <div className="w-96 flex flex-col gap-4">
        {/* Quality Check Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <CheckCircle2 size={18} className="text-emerald-500" />
              方法论完整性审查
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">及格 65分</span>
          </div>
          <div className="p-4 space-y-3">
            <CheckItem text="项目背景与目标明确" passed={true} />
            <CheckItem text="核心问题诊断" passed={true} />
            <CheckItem text="STM标准化解决框架" passed={false} suggestion="缺失：未引入标准评估模型" />
            <CheckItem text="风险提示与规避建议" passed={false} suggestion="建议补充政策及实施风险" />
          </div>
        </div>

        {/* AI Suggestions Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-blue-100 bg-blue-50 flex items-center gap-2 font-semibold text-blue-900">
            <Wand2 size={18} />
            BrainBox 撰写建议
          </div>
          <div className="p-5 flex-1 overflow-auto space-y-6">
            
            <SuggestionCard 
              title="扩充诊断维度"
              content="检测到您仅列出了'人力'和'效率'。根据相似行业案例，建议补充关于'供应链采购'和'能源消耗'的诊断维度。"
              actionText="一键生成扩充草稿"
            />

            <SuggestionCard 
              title="插入成功案例"
              content="您正在描述'人力成本优化'。找到库中《B公司定岗定编优化方案》，其数据对比图表极具说服力。"
              actionText="预览图表并插入"
              highlight={true}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ text, passed, suggestion }) {
  return (
    <div className="flex items-start gap-3">
      {passed ? (
        <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
      )}
      <div>
        <p className={`text-sm ${passed ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{text}</p>
        {!passed && suggestion && (
          <p className="text-xs text-red-600 mt-1">{suggestion}</p>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({ title, content, actionText, highlight }) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white'}`}>
      <h4 className="font-semibold text-gray-900 text-sm mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{content}</p>
      <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded shadow-sm transition font-medium">
        {actionText}
      </button>
    </div>
  );
}