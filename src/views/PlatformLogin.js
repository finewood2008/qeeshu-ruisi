import React, { useState } from 'react';
import { BrainCircuit, Loader2, Server, Lock, Phone, AlertCircle, KeyRound } from 'lucide-react';

const DEFAULT_PLATFORM_URL = 'https://paas.qeeshu.com';

export default function PlatformLogin({ onLoginSuccess, onSwitchToApiKey }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [platformUrl, setPlatformUrl] = useState(DEFAULT_PLATFORM_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setErrorMsg('请输入手机号和密码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setErrorMsg('请输入正确的11位手机号');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('密码长度至少8位');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const baseUrl = (platformUrl || DEFAULT_PLATFORM_URL).replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (data.code !== 0 || !data.data?.token) {
        setErrorMsg(data.message || '登录失败，请检查账号密码');
        return;
      }

      const { token, user, default_app_key } = data.data;
      // 优先使用 app_key 作为 API Key（与 SDK 鉴权一致），降级使用 user token
      const apiKey = default_app_key?.app_key || token;

      onLoginSuccess({
        baseUrl,
        apiKey,
        token,
        username: user?.username || user?.full_name || phone,
        user,
      });

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setErrorMsg('无法连接平台，请检查网络或平台地址是否正确');
      } else {
        setErrorMsg(`登录失败: ${err.message || '未知错误'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#0A0F1C]">
      {/* 极客风格动态背景层 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0A0F1C_100%)] opacity-80"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-6 transition-all transform hover:scale-[1.01] duration-500">
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          
          {/* 左上角玻璃反光 */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>

          <div className="text-center mb-10">
             <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 mb-5 relative group cursor-pointer transition transform hover:rotate-3">
               <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition"></div>
               <BrainCircuit size={32} />
             </div>
             <h1 className="text-3xl font-bold text-white tracking-wide font-sans">企数睿思终端</h1>
             <p className="text-sm text-blue-200/70 mt-2">登录 NexusAOS 平台，接入 AI 调度网络</p>
          </div>

          {errorMsg && (
            <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-200 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="text-rose-400" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">手机号</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                  <Phone size={18} />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入注册手机号"
                  maxLength={11}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
               <div className="flex justify-between items-center ml-1">
                 <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">密码</label>
               </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full relative overflow-hidden group bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-3.5 transition-all outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className={`flex items-center justify-center gap-2 relative z-10 transition-transform ${isLoading ? 'scale-95' : 'scale-100'}`}>
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    正在登录...
                  </>
                ) : (
                  <>
                    <Server size={18} className="opacity-70 group-hover:opacity-100" />
                    登录并接入平台
                  </>
                )}
              </span>
              {!isLoading && (
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-0"></div>
              )}
            </button>
          </form>

          {showAdvanced && (
            <div className="mt-4 space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">平台地址</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                  <Server size={18} />
                </div>
                <input 
                  type="text" 
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  placeholder="https://paas.qeeshu.com"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showAdvanced ? '收起高级选项' : '高级选项'}
            </button>
            {onSwitchToApiKey && (
              <button
                type="button"
                onClick={onSwitchToApiKey}
                className="flex items-center gap-1.5 text-xs text-blue-400/80 hover:text-blue-300 transition-colors"
              >
                <KeyRound size={12} />
                使用 API Key 直接接入
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 注入行内动画定义 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
