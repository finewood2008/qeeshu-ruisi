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

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">通知与订阅</h3>
                <p className="text-sm text-gray-500 mb-6">管理企数睿思对您发送的各类提醒和摘要报告。</p>
              </div>

              <div className="space-y-5">
                <ToggleRow title="每日智能简报 (Email)" desc="每天早上 8:00 发送昨日系统处理的资产摘要及今日重要预警客户。" active={true} />
                <ToggleRow title="资产处理完成通知 (App)" desc="当您上传的超大文档或录音被系统 NPU 向量化处理完毕时提醒。" active={true} />
                <ToggleRow title="高优先级客户健康度预警" desc="当您负责的 CRM 客户综合健康度骤降或触发红线时，立即发送企微消息。" active={true} />
                <ToggleRow title="内部理论框架更新通知" desc="当机构超管上传或更新了新的“自有理论框架”时进行通知。" active={false} />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">安全与密码</h3>
                <p className="text-sm text-gray-500 mb-6">保护您的企数睿思账户安全。</p>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">登录密码</h4>
                      <p className="text-xs text-gray-500 mt-1">上次修改：30 天前</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-100 transition">修改密码</button>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">双重验证 (2FA)</h4>
                      <p className="text-xs text-gray-500 mt-1">为您的账户增加一层额外的安全保护。当前状态：未开启</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition">立即开启</button>
                  </div>
                </div>

                <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-red-900">注销账户</h4>
                      <p className="text-xs text-red-700 mt-1">永久删除您的个人配置和历史交互记录，此操作不可逆。</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded hover:bg-red-100 transition">申请注销</button>
                  </div>
                </div>
              </div>
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