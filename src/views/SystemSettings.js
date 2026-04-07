import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Shield, Server, BellRing, Key, Palette, ChevronRight, CheckCircle2, ShieldCheck
} from 'lucide-react';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Settings Navigation Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-6">系统设置</h2>
        <nav className="space-y-1 flex-1">
          <TabButton 
            icon={<SettingsIcon size={18} />} label="基础常规设置" 
            active={activeTab === 'general'} onClick={() => setActiveTab('general')} 
          />
          <TabButton 
            icon={<Server size={18} />} label="边缘节点与同步" 
            active={activeTab === 'edge'} onClick={() => setActiveTab('edge')} 
          />
          <TabButton 
            icon={<ShieldCheck size={18} />} label="数据安全与隐私" 
            active={activeTab === 'security'} onClick={() => setActiveTab('security')} 
          />
          <TabButton 
            icon={<BellRing size={18} />} label="消息与预警通知" 
            active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} 
          />
          <TabButton 
            icon={<Key size={18} />} label="第三方 API 密钥" 
            active={activeTab === 'api'} onClick={() => setActiveTab('api')} 
          />
          <TabButton 
            icon={<Palette size={18} />} label="企业品牌定制 (白标)" 
            active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} 
          />
        </nav>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-auto bg-white p-8">
        <div className="max-w-3xl">
          
          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">基础常规设置</h3>
                <p className="text-sm text-gray-500 mb-6">管理企数睿思系统的基础行为偏好。</p>
              </div>

              <div className="space-y-6">
                <SettingRow title="系统语言 (Language)">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option>简体中文 (zh-CN)</option>
                    <option>English (en-US)</option>
                  </select>
                </SettingRow>

                <SettingRow title="AI 助手输出语调偏好">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option>严谨专业 (适合正式交付件)</option>
                    <option>客观中立 (适合内部研究)</option>
                    <option>通俗易懂 (适合新人培训)</option>
                  </select>
                </SettingRow>

                <SettingRow title="主题显示模式">
                   <div className="flex bg-gray-100 p-1 rounded-lg w-max">
                     <button className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md text-gray-900">浅色</button>
                     <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">深色</button>
                     <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">跟随系统</button>
                   </div>
                </SettingRow>
                
                <hr className="border-gray-100" />
                
                <div className="flex justify-end pt-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm">保存修改</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">数据安全与隐私</h3>
                <p className="text-sm text-gray-500 mb-6">企数睿思严格遵循金融级保密标准，配置资产脱敏规则。</p>
              </div>

              <div className="space-y-5">
                <ToggleRow title="入库文档自动脱敏 (PII 移除)" desc="上传文件前自动识别并掩码客户名称、财务数据及联系方式。" active={true} />
                <ToggleRow title="边缘计算物理隔离模式" desc="切断所有外部公有云大模型请求，仅使用 Qee-Box 本地局域网模型进行推理。" active={false} />
                <ToggleRow title="高管访谈录音不可逆加密" desc="音频资产在完成文字转写与特征提取后，自动销毁原始音频文件。" active={true} />
                <ToggleRow title="限制敏感洞察的跨项目引用" desc="A项目的独家商业洞察，禁止在B项目的 AI 生成中被作为历史知识调用。" active={true} />
                
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2"><Shield size={16}/> 数据清理操作</h4>
                  <p className="text-xs text-amber-700 mb-3">清空本地向量数据库将导致所有检索和推荐失效，此操作不可逆。</p>
                  <button className="px-4 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded hover:bg-amber-100 transition">清空本地向量索引库</button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'general' && activeTab !== 'security' && (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
               <SettingsIcon size={48} className="mb-4 text-gray-200" />
               <h3 className="text-lg font-medium text-gray-600 mb-2">此设置项正在开发中</h3>
               <p className="text-sm">仅基础常规设置和数据安全提供演示视图。</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition ${
        active 
          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
          : 'text-gray-600 hover:bg-white hover:border-gray-200 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {active && <ChevronRight size={16} className="text-blue-400" />}
    </button>
  );
}

function SettingRow({ title, children }) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm font-bold text-gray-800">{title}</label>
      <div className="w-64">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, active }) {
  const [isOn, setIsOn] = useState(active);
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="pr-12">
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isOn ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOn ? 'translate-x-5' : 'translate-x-0'}`}></span>
      </button>
    </div>
  );
}