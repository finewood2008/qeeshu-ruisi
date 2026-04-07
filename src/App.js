import React, { useState } from 'react';
import { 
  Search as SearchIcon, 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Settings as SettingsIcon, 
  Bell, 
  FileText,
  BrainCircuit,
} from 'lucide-react';

// Import Views
import Dashboard from './views/Dashboard';
import Search from './views/Search';
import AIWriter from './views/AIWriter';
import CRM from './views/CRM';
import Assets from './views/Assets';
import SettingsMethodology from './views/Settings';
import SystemSettings from './views/SystemSettings';

export default function STMBoxWorkbench() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'search': return <Search />;
      case 'write': return <AIWriter />;
      case 'crm': return <CRM />;
      case 'assets': return <Assets />;
      case 'settings-methodology': return <SettingsMethodology />;
      case 'settings-system': return <SystemSettings />;
      default: return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <BrainCircuit size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium">{activeTab} 模块设置开发中...</h2>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-gray-300 flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/50">
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-wide">企数睿思</h1>
            <p className="text-xs text-blue-400 font-medium">QEESHU RUISI</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          <NavItem icon={<LayoutDashboard size={18} />} label="智能工作台" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<SearchIcon size={18} />} label="知识库诊断检索" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          <NavItem icon={<FileText size={18} />} label="AI 撰写助手" active={activeTab === 'write'} onClick={() => setActiveTab('write')} />
          <NavItem icon={<Users size={18} />} label="客户 CRM" active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} />
          <NavItem icon={<FolderOpen size={18} />} label="硬件资产管理" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <NavItem icon={<BrainCircuit size={18} />} label="方法论" active={activeTab === 'settings-methodology'} onClick={() => setActiveTab('settings-methodology')} />
          
          <div 
            className="mt-4 flex items-center justify-between px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 transition cursor-pointer rounded-lg group"
            onClick={() => setActiveTab('settings-system')}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                李
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition">李顾问</p>
                <p className="text-xs text-gray-400">高级咨询师</p>
              </div>
            </div>
            <SettingsIcon size={14} className="text-gray-500 group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center bg-gray-100/80 border border-gray-200 rounded-lg px-4 py-2 w-[28rem] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
            <SearchIcon size={16} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="全局搜索案例、客户或系统功能..." 
              className="bg-transparent border-none focus:outline-none w-full text-sm text-gray-700 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-5">
            <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 transition-all flex items-center gap-2">
              新建任务
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          {/* Subtle background pattern for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
          
          <div className="relative z-10 h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

// Sidebar Nav Item Component
function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
        active 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-gray-400'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}