import React, { useState } from 'react';
import { 
  User, Settings as SettingsIcon, BellRing, Key, Palette, ChevronRight, LogOut, CheckCircle2
} from 'lucide-react';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Settings Navigation Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-6">个人账号与偏好</h2>
        <nav className="space-y-1 flex-1">
          <TabButton 
            icon={<User size={18} />} label="个人资料" 
            active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} 
          />
          <TabButton 
            icon={<SettingsIcon size={18} />} label="系统交互偏好" 
            active={activeTab === 'general'} onClick={() => setActiveTab('general')} 
          />
          <TabButton 
            icon={<BellRing size={18} />} label="通知与订阅" 
            active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} 
          />
          <TabButton 
            icon={<Key size={18} />} label="安全与密码" 
            active={activeTab === 'security'} onClick={() => setActiveTab('security')} 
          />
        </nav>
        <div className="mt-auto border-t border-gray-200 pt-4">
           <button className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium w-full px-4 py-2 hover:bg-red-50 rounded-lg transition">
             <LogOut size={16} /> 退出登录
           </button>
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-auto bg-white p-8">
        <div className="max-w-3xl">
          
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">个人资料设置</h3>
                <p className="text-sm text-gray-500 mb-6">更新您的头像、基本信息和咨询顾问等级。</p>
              </div>

              <div className="flex items-start gap-8">
                 {/* Avatar */}
                 <div className="flex flex-col items-center gap-3">
                   <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-inner">
                     李
                   </div>
                   <button className="text-sm text-blue-600 font-medium hover:underline">更换头像</button>
                 </div>
                 
                 {/* Form */}
                 <div className="flex-1 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">真实姓名</label>
                      <input type="text" defaultValue="李顾问" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">联系邮箱</label>
                      <input type="email" defaultValue="li.consultant@stm-consulting.com" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-500 cursor-not-allowed" readOnly />
                      <p className="text-xs text-gray-400 mt-1">企业邮箱不支持自行修改，请联系 IT 部门。</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">职位 / 头衔</label>
                      <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-500" disabled>
                        <option>高级咨询师 (Senior Consultant)</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm">保存个人资料</button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">系统交互偏好</h3>
                <p className="text-sm text-gray-500 mb-6">管理企数睿思对您个人的基础行为偏好设置。</p>
              </div>

              <div className="space-y-6">
                <SettingRow title="系统界面语言">
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option>简体中文 (zh-CN)</option>
                    <option>English (en-US)</option>
                  </select>
                </SettingRow>

                <SettingRow title="AI 助手默认输出语调">
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option>严谨专业 (适合直接用于正式交付件)</option>
                    <option>客观中立 (适合内部研究与讨论)</option>
                    <option>通俗易懂 (适合制作新人培训材料)</option>
                  </select>
                </SettingRow>

                <SettingRow title="界面主题显示模式">
                   <div className="flex bg-gray-100 p-1 rounded-lg w-full">
                     <button className="flex-1 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md text-gray-900">浅色</button>
                     <button className="flex-1 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">深色</button>
                     <button className="flex-1 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">跟随系统</button>
                   </div>
                </SettingRow>
                
                <hr className="border-gray-100" />
                
                <div className="flex justify-end pt-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm">保存交互偏好</button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && activeTab !== 'general' && (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
               <SettingsIcon size={48} className="mb-4 text-gray-200" />
               <h3 className="text-lg font-medium text-gray-600 mb-2">此设置项正在开发中</h3>
               <p className="text-sm">当前仅支持演示“个人资料”与“系统交互偏好”功能。</p>
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
    <div className="flex items-center justify-between py-2 border-b border-gray-50 pb-4">
      <label className="text-sm font-bold text-gray-800">{title}</label>
      <div className="w-72">
        {children}
      </div>
    </div>
  );
}