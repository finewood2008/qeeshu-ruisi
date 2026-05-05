import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  KeyRound,
  Link2,
  RefreshCw,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import {
  canPersistRuntimeConfig,
  getRuntimeConfigDraft,
  saveRuntimeConfig,
} from '../sdk/runtime';

function RuntimeInfoCard({ title, value, desc }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{desc}</div>
    </div>
  );
}

export default function ConnectWorkspace({ onOpenSettings, onSwitchToLogin }) {
  const runtimeDraft = useMemo(() => getRuntimeConfigDraft(), []);
  const runtimeStorageAvailable = canPersistRuntimeConfig();
  const [runtimeForm, setRuntimeForm] = useState(() => ({
    baseUrl: runtimeDraft.baseUrl,
    apiKey: runtimeDraft.apiKey,
  }));
  const [revealApiKey, setRevealApiKey] = useState(false);
  const [runtimeFeedback, setRuntimeFeedback] = useState(null);

  const handleRuntimeFieldChange = (field) => (event) => {
    const { value } = event.target;
    setRuntimeForm((current) => ({
      ...current,
      [field]: value,
    }));
    setRuntimeFeedback(null);
  };

  const handleSaveRuntime = () => {
    try {
      saveRuntimeConfig(runtimeForm);
      setRuntimeFeedback({
        type: 'success',
        text: '本地接入配置已保存，页面正在刷新并连接 QeeClaw Platform。',
      });
      window.setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (runtimeConfigError) {
      setRuntimeFeedback({
        type: 'error',
        text: runtimeConfigError instanceof Error ? runtimeConfigError.message : '保存本地接入配置失败。',
      });
    }
  };

  return (
    <div className="min-h-full rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#f8fafc_0%,#eff6ff_45%,#ecfeff_100%)] p-8 shadow-sm">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Rocket size={14} />
                首次接入引导
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-900">
                用 `baseUrl + API Key`
                <br />
                接入你的 QeeClaw Cloud 能力
              </h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
                企数睿思不需要独立远程后端。客户本地安装后，只要拿到平台地址和 API Key，就能启用云端鉴权、计费与模型能力；CRM、知识库、会话与审计数据默认保存在当前设备本地。
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <RuntimeInfoCard title="需要准备" value="2 项信息" desc="baseUrl 与 API Key" />
                <RuntimeInfoCard title="默认 Runtime" value="Hermes Agent" desc="支持 16+ 消息平台网关" />
                <RuntimeInfoCard title="数据位置" value="本地优先" desc="业务数据默认落在当前设备" />
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-cyan-200">推荐线上地址</div>
                    <div className="mt-2 text-2xl font-black tracking-tight">https://paas.qeeshu.com</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                    云端仅用于鉴权 / 计费 / 模型调用
                    <div className="mt-1 font-mono text-xs text-cyan-200/80">本地业务数据不会先上传云端</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900">
                  <Link2 size={18} className="text-blue-600" />
                  <span className="font-semibold">Base URL</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">填写平台根地址即可。当前主要用于云端鉴权、钱包余额与模型调用，不承载客户业务主数据。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900">
                  <KeyRound size={18} className="text-blue-600" />
                  <span className="font-semibold">API Key</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">客户只需要一枚 `sk-...` 风格的 API Key。当前版本采用直接 API Key 模式，不需要 AppKey 换短期票据。</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span className="font-semibold">本地保存</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">接入配置与业务数据都会保存在当前设备本地，更适合客户专机或桌面端，不需要改源码或环境变量。</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-7 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <Cloud size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">填写接入信息</h3>
                <p className="mt-1 text-sm text-slate-500">保存后立即刷新，启用云端能力并继续使用本地数据层。</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Platform Base URL</label>
                <input
                  type="text"
                  value={runtimeForm.baseUrl}
                  onChange={handleRuntimeFieldChange('baseUrl')}
                  placeholder="https://paas.qeeshu.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <p className="mt-2 text-xs text-slate-400">示例：`https://paas.qeeshu.com`</p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700">API Key</label>
                  <button
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    onClick={() => setRevealApiKey((current) => !current)}
                  >
                    {revealApiKey ? '隐藏 API Key' : '显示 API Key'}
                  </button>
                </div>
                <input
                  type={revealApiKey ? 'text' : 'password'}
                  value={runtimeForm.apiKey}
                  onChange={handleRuntimeFieldChange('apiKey')}
                  placeholder="请输入客户 API Key，例如 sk-xxx"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <p className="mt-2 text-xs text-slate-400">当前设备会本地保存 API Key。若为共享设备，请谨慎配置。</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">配置来源</div>
                <div className="mt-2 font-semibold text-slate-900">
                  {runtimeDraft.hasStoredConfig ? '本地接入配置' : '首次配置'}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">本地存储</div>
                <div className="mt-2 font-semibold text-slate-900">
                  {runtimeStorageAvailable ? '可用' : '当前环境不支持'}
                </div>
              </div>
            </div>

            {runtimeFeedback ? (
              <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                runtimeFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}>
                <div className="flex items-start gap-2">
                  {runtimeFeedback.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                  <span>{runtimeFeedback.text}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              <button
                onClick={handleSaveRuntime}
                disabled={!runtimeStorageAvailable}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                  runtimeStorageAvailable
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20'
                    : 'cursor-not-allowed bg-slate-300'
                }`}
              >
                <RefreshCw size={16} />
                保存并启用云端能力
              </button>

              {onSwitchToLogin ? (
                <button
                  onClick={onSwitchToLogin}
                  className="flex w-full items-center justify-center rounded-xl border border-blue-400/50 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  使用平台账号密码登录
                </button>
              ) : null}

              <button
                onClick={onOpenSettings}
                className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                打开系统设置页查看更多接入诊断
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
