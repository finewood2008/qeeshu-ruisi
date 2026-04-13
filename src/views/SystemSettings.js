import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  User, Settings as SettingsIcon, BellRing, Key, ChevronRight, LogOut, RefreshCw, Trash2, CheckCircle2, AlertCircle, Wifi, WifiOff, Cpu, Globe
} from 'lucide-react';
import DataSourceBadge from '../components/DataSourceBadge';
import { useAppShell } from '../AppShellContext';
import {
  clearUserSettings,
  createDefaultUserSettings,
  readUserSettings,
  writeUserSettings,
} from '../userSettings';
import { useSdkViewData } from '../hooks/useSdkViewData';
import { loadSystemSnapshot } from '../sdk/api';
import {
  canPersistRuntimeConfig,
  clearRuntimeConfig,
  getRuntimeConfigDraft,
  saveRuntimeConfig,
  qeeclawRuntime,
  checkHermesBridgeHealth,
} from '../sdk/runtime';

export default function SystemSettings({ activeTab: controlledActiveTab = 'profile', onChangeTab }) {
  const {
    confirmSensitiveAction,
    pushDesktopNotification,
    pushToast,
    requestDesktopNotificationPermission,
    userSettings,
  } = useAppShell();
  const avatarInputRef = useRef(null);
  const loader = useCallback(() => loadSystemSnapshot(), []);
  const { data, error, source } = useSdkViewData(loader);
  const runtimeDraft = useMemo(() => getRuntimeConfigDraft(), []);
  const storedSettings = useMemo(() => userSettings || readUserSettings(), [userSettings]);
  const defaultUserSettings = useMemo(() => createDefaultUserSettings(), []);
  const [activeTabState, setActiveTabState] = useState(controlledActiveTab);
  const [runtimeForm, setRuntimeForm] = useState(() => ({
    baseUrl: runtimeDraft.baseUrl,
    apiKey: runtimeDraft.apiKey,
    runtimeType: runtimeDraft.runtimeType || 'hermes',
  }));
  const [profileForm, setProfileForm] = useState(() => ({
    displayName: storedSettings?.profile?.displayName || defaultUserSettings.profile.displayName,
    avatarLabel: storedSettings?.profile?.avatarLabel || defaultUserSettings.profile.avatarLabel,
    avatarImage: storedSettings?.profile?.avatarImage || '',
    email: storedSettings?.profile?.email || '',
    title: storedSettings?.profile?.title || defaultUserSettings.profile.title,
  }));
  const [generalForm, setGeneralForm] = useState(() => ({
    language: storedSettings?.general?.language || '简体中文 (zh-CN)',
    tone: storedSettings?.general?.tone || '严谨专业 (适合直接用于正式交付件)',
    theme: storedSettings?.general?.theme || '浅色',
  }));
  const [notificationPrefs, setNotificationPrefs] = useState(() => ({
    dailyBrief: storedSettings?.notifications?.dailyBrief ?? true,
    assetComplete: storedSettings?.notifications?.assetComplete ?? true,
    healthAlert: storedSettings?.notifications?.healthAlert ?? true,
    frameworkUpdate: storedSettings?.notifications?.frameworkUpdate ?? false,
  }));
  const [securityState, setSecurityState] = useState(() => ({
    passwordUpdatedAt: storedSettings?.security?.passwordUpdatedAt || defaultUserSettings.security.passwordUpdatedAt,
    twoFactorEnabled: storedSettings?.security?.twoFactorEnabled ?? false,
    deactivationRequested: storedSettings?.security?.deactivationRequested ?? false,
  }));
  const [revealApiKey, setRevealApiKey] = useState(false);
  const [runtimeFeedback, setRuntimeFeedback] = useState(null);
  const [settingsFeedback, setSettingsFeedback] = useState(null);
  const runtimeStorageAvailable = canPersistRuntimeConfig();
  const [hermesBridgeHealth, setHermesBridgeHealth] = useState(null);
  const [hermesLoading, setHermesLoading] = useState(false);

  useEffect(() => {
    setActiveTabState(controlledActiveTab);
  }, [controlledActiveTab]);

  useEffect(() => {
    setProfileForm(storedSettings.profile);
    setGeneralForm(storedSettings.general);
    setNotificationPrefs(storedSettings.notifications);
    setSecurityState(storedSettings.security);
  }, [storedSettings]);

  const activeTab = controlledActiveTab ?? activeTabState;

  // Hermes Bridge 健康检查轮询
  useEffect(() => {
    if (runtimeForm.runtimeType !== 'hermes') return;
    if (activeTab !== 'access') return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const health = await checkHermesBridgeHealth();
        if (cancelled) return;
        setHermesBridgeHealth(health);
      } catch {
        // 静默失败
      }
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [runtimeForm.runtimeType, activeTab]);

  const handleTabChange = useCallback((nextTab) => {
    setActiveTabState(nextTab);
    if (typeof onChangeTab === 'function') {
      onChangeTab(nextTab);
    }
  }, [onChangeTab]);

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
        text: '本地接入配置已保存，页面正在刷新并重新连接 QeeClaw Platform。',
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

  const handleClearRuntime = async () => {
    const confirmed = await confirmSensitiveAction({
      title: '清除当前设备上的本地接入配置？',
      description: '这会删除本机保存的 baseUrl 与 API Key，并在刷新后回到接入页。',
      confirmLabel: '确认清除',
    });
    if (!confirmed) {
      return;
    }
    clearRuntimeConfig();
    setRuntimeFeedback({
      type: 'success',
      text: '本地接入配置已清除，页面正在刷新。',
    });
    window.setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const persistUserSettings = useCallback((nextValue, successText) => {
    writeUserSettings(nextValue);
    setSettingsFeedback({
      type: 'success',
      text: successText,
    });
    pushToast(successText, 'success');
  }, [pushToast]);

  const handleSaveProfile = () => {
    persistUserSettings({
      profile: profileForm,
      general: generalForm,
      notifications: notificationPrefs,
      security: securityState,
    }, '本地资料已保存到当前设备。');
  };

  const handleSaveGeneral = () => {
    persistUserSettings({
      profile: profileForm,
      general: generalForm,
      notifications: notificationPrefs,
      security: securityState,
    }, '交互偏好已保存到本地设备。');
  };

  const handleSaveNotifications = async () => {
    const nextSettings = {
      profile: profileForm,
      general: generalForm,
      notifications: notificationPrefs,
      security: securityState,
    };
    persistUserSettings({
      ...nextSettings,
    }, '通知订阅偏好已保存。');

    const hasDesktopNotificationsEnabled = notificationPrefs.assetComplete || notificationPrefs.healthAlert || notificationPrefs.frameworkUpdate || notificationPrefs.dailyBrief;
    if (!hasDesktopNotificationsEnabled) {
      return;
    }

    const permission = await requestDesktopNotificationPermission();
    if (permission === 'granted') {
      pushDesktopNotification(
        '企数睿思桌面提醒已启用',
        '后续资产处理完成、健康预警等事件会按你的本地偏好发送桌面提醒。',
        null,
      );
      pushToast('桌面提醒权限已启用，后续会按本地通知设置发送提醒。', 'success');
      return;
    }

    pushToast('当前浏览器/桌面容器未授予系统通知权限，通知设置仅保存到本地。', 'warning');
  };

  const handleChangePassword = () => {
    const nextSecurity = {
      ...securityState,
      passwordUpdatedAt: '刚刚',
    };
    setSecurityState(nextSecurity);
    persistUserSettings({
      profile: profileForm,
      general: generalForm,
      notifications: notificationPrefs,
      security: nextSecurity,
    }, '已更新本地安全记录，可继续轮换 API Key 或调整接入策略。');
  };

  const handleEnable2FA = () => {
    const nextSecurity = {
      ...securityState,
      twoFactorEnabled: !securityState.twoFactorEnabled,
    };
    setSecurityState(nextSecurity);
    persistUserSettings({
      profile: profileForm,
      general: generalForm,
      notifications: notificationPrefs,
      security: nextSecurity,
    }, nextSecurity.twoFactorEnabled ? '敏感操作二次确认已在本地偏好中启用。' : '敏感操作二次确认已关闭。');
  };

  const handleRequestDeactivation = () => {
    const nextSecurity = {
      ...securityState,
      deactivationRequested: !securityState.deactivationRequested,
    };
    setSecurityState(nextSecurity);
    persistUserSettings({
      profile: profileForm,
      general: generalForm,
      notifications: notificationPrefs,
      security: nextSecurity,
    }, nextSecurity.deactivationRequested
      ? '本地数据清理标记已记录；如需立即退出接入，可直接点击左下角“清除本地接入”。'
      : '本地数据清理标记已取消。');
  };

  const handleLogout = async () => {
    const confirmed = await confirmSensitiveAction({
      title: '清除当前设备上的本地接入与个人偏好？',
      description: '这会删除本机保存的 API Key、本地资料和通知偏好，并刷新回接入页。',
      confirmLabel: '确认退出',
    });
    if (!confirmed) {
      return;
    }

    clearUserSettings();
    clearRuntimeConfig();
    setProfileForm(defaultUserSettings.profile);
    setGeneralForm(defaultUserSettings.general);
    setNotificationPrefs(defaultUserSettings.notifications);
    setSecurityState(defaultUserSettings.security);
    setRuntimeForm({
      baseUrl: '',
      apiKey: '',
    });
    setRevealApiKey(false);
    setRuntimeFeedback({
      type: 'success',
      text: '已清除本地接入配置，页面即将返回接入页。',
    });
    setSettingsFeedback({
      type: 'success',
      text: '已退出当前本地接入，个人偏好与 API Key 都已清除。',
    });
    pushToast('已退出当前本地接入', 'success');
    window.setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleAvatarPick = useCallback(() => {
    avatarInputRef.current?.click();
  }, []);

  const handleAvatarSelected = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setProfileForm((current) => ({
        ...current,
        avatarImage: result,
        avatarLabel: current.displayName.trim().charAt(0) || current.avatarLabel,
      }));
      setSettingsFeedback({
        type: 'success',
        text: `已加载新头像「${file.name}」，点击“保存本地资料”后写入当前设备。`,
      });
      pushToast(`已选择头像文件「${file.name}」`, 'success');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }, [pushToast]);

  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Settings Navigation Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-2">本地偏好与接入</h2>
        <p className="mb-6 text-xs leading-5 text-gray-500">
          这里不是云端账号中心，只管理当前设备上的 API Key、本地显示资料与个人偏好。
        </p>
        <nav className="space-y-1 flex-1">
          <TabButton
            icon={<Key size={18} />} label="接入信息"
            active={activeTab === 'access'} onClick={() => handleTabChange('access')}
          />
          <TabButton 
            icon={<User size={18} />} label="本地资料" 
            active={activeTab === 'profile'} onClick={() => handleTabChange('profile')} 
          />
          <TabButton 
            icon={<SettingsIcon size={18} />} label="交互偏好" 
            active={activeTab === 'general'} onClick={() => handleTabChange('general')} 
          />
          <TabButton 
            icon={<BellRing size={18} />} label="通知与订阅" 
            active={activeTab === 'notifications'} onClick={() => handleTabChange('notifications')} 
          />
          <TabButton 
            icon={<Key size={18} />} label="接入安全与清理" 
            active={activeTab === 'security'} onClick={() => handleTabChange('security')} 
          />
        </nav>
        <div className="mt-auto border-t border-gray-200 pt-4">
           <button type="button" onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium w-full px-4 py-2 hover:bg-red-50 rounded-lg transition">
             <LogOut size={16} /> 清除本地接入
           </button>
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-auto bg-white p-8">
        <div className="max-w-3xl">
          {settingsFeedback ? (
            <div className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${
              settingsFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}>
              <div className="flex items-start gap-2">
                {settingsFeedback.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                <span>{settingsFeedback.text}</span>
              </div>
            </div>
          ) : null}

          {activeTab === 'access' && (
            <>
              <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">接入与认证状态</h3>
                    <p className="text-sm text-gray-500 mt-1">这里集中展示当前设备接入的平台环境、认证方式、路由模型和运行时信息。</p>
                  </div>
                  <DataSourceBadge source={source} error={error} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                  <StatusCard title="当前环境" value={data?.runtime?.baseUrlLabel || '未配置'} />
                  <StatusCard title="连接状态 / Runtime" value={data ? `${data.runtime.workspaceLabel} / ${data.runtime.runtimeLabel}` : '等待检测 / OpenClaw'} />
                  <StatusCard title="模型路由" value={data?.routeProfile?.resolvedModel || '未返回'} />
                  <StatusCard title="钱包余额" value={data ? `${data.wallet.balance} ${data.wallet.currency}` : '未返回'} />
                  <StatusCard title="运行时状态" value={data?.runtimeState?.runtimeStatus || 'unknown'} />
                  <StatusCard title="可用产品能力" value={data ? `${data.products.length} 项` : '未返回'} />
                </div>

                <div className="mt-5 rounded-xl border border-blue-100 bg-white/80 px-4 py-4 text-sm text-blue-900">
                  <div className="font-semibold">当前认证模式说明</div>
                  <p className="mt-2 leading-relaxed text-blue-800">
                    企数睿思当前不使用“用户名 + 密码”的独立登录页，而是使用
                    <span className="font-semibold"> `baseUrl + API Key` </span>
                    作为本地接入凭证。清除本地接入后，会删除当前设备保存的 API Key，并回到接入页。
                  </p>
                </div>
              </div>

              <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">接入与认证配置</h3>
                    <p className="text-sm text-gray-500 mt-1">客户本地只需要填写 `baseUrl + API Key`。保存后会写入当前浏览器/桌面容器的本地存储并自动刷新生效。</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                    <div className="text-xs uppercase tracking-wide text-gray-500">当前配置来源</div>
                    <div className="mt-2 font-semibold text-gray-900">
                      {runtimeDraft.hasStoredConfig ? '本地接入配置' : '环境变量 / 未配置'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-5 text-sm">
                  <StatusCard title="接入方式" value="baseUrl + API Key" />
                  <StatusCard title="当前 Runtime" value={runtimeDraft.runtimeType === 'hermes' ? '🧠 Hermes Agent' : runtimeDraft.runtimeType === 'openclaw' ? '🦀 OpenClaw' : runtimeDraft.runtimeType} />
                  <StatusCard title="默认 Scope" value={runtimeDraft.scope || 'mine'} />
                  <StatusCard title="本地保存" value={runtimeStorageAvailable ? '支持' : '当前环境不支持'} />
                </div>

                {/* Runtime 选择器 */}
                <div className="mt-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 p-5">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Cpu size={16} className="text-indigo-600" />
                    AI Runtime 引擎选择
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">选择底层 AI 推理引擎。Hermes Agent 是默认推荐引擎，支持 16+ 消息平台网关；OpenClaw 为传统引擎，兼容旧版配置。</p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRuntimeForm((c) => ({ ...c, runtimeType: 'hermes' }));
                        setRuntimeFeedback(null);
                      }}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                        runtimeForm.runtimeType === 'hermes'
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-200'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🧠</span>
                        <span className="text-sm font-bold text-gray-900">Hermes Agent</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">推荐</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">支持 16+ 消息平台 Gateway、多模型 Provider、流式推理</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRuntimeForm((c) => ({ ...c, runtimeType: 'openclaw' }));
                        setRuntimeFeedback(null);
                      }}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                        runtimeForm.runtimeType === 'openclaw'
                          ? 'border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-200'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🦀</span>
                        <span className="text-sm font-bold text-gray-900">OpenClaw</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-semibold">传统</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">经典平台 API 方式，稳定可靠，适合已有部署场景</p>
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Platform Base URL</label>
                    <input
                      type="text"
                      value={runtimeForm.baseUrl}
                      onChange={handleRuntimeFieldChange('baseUrl')}
                      placeholder="https://paas.qeeshu.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">示例：`https://paas.qeeshu.com`，不要带末尾斜杠。</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-bold text-gray-700">API Key</label>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">当前版本会把 API Key 保存在本地设备中，适合客户本地专机使用；若是共享设备，请谨慎保存。</p>
                  </div>
                </div>

                {runtimeFeedback ? (
                  <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
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

                {error ? (
                  <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <span>当前 SDK 连接异常：{error.message}</span>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
                  <p className="text-xs text-gray-500">
                    清除本地配置后，应用会回退到 `.env.local`；如果环境变量也未配置，则回到未接入状态。
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleClearRuntime}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <Trash2 size={16} />
                      清除本地配置
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRuntime}
                      disabled={!runtimeStorageAvailable}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                        runtimeStorageAvailable
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw size={16} />
                      保存并刷新接入
                    </button>
                  </div>
                </div>
              </div>

              {/* Hermes Bridge 状态面板 — 仅在选择 hermes 时显示 */}
              {runtimeForm.runtimeType === 'hermes' && (
                <div className="mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Globe size={20} className="text-indigo-600" />
                        Hermes Agent 运行状态
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Bridge 服务的实时状态。</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setHermesLoading(true);
                        try {
                          const health = await checkHermesBridgeHealth();
                          setHermesBridgeHealth(health);
                        } finally {
                          setHermesLoading(false);
                        }
                      }}
                      disabled={hermesLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={hermesLoading ? 'animate-spin' : ''} />
                      刷新状态
                    </button>
                  </div>

                  {/* Bridge 健康 */}
                  <div className="mb-5">
                    <div className={`rounded-xl border px-4 py-3 max-w-xs ${
                      hermesBridgeHealth?.ok
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {hermesBridgeHealth?.ok
                          ? <Wifi size={14} className="text-emerald-600" />
                          : <WifiOff size={14} className="text-gray-400" />}
                        <p className="text-xs uppercase tracking-wide text-gray-500">Bridge 服务</p>
                      </div>
                      <p className={`text-sm font-semibold ${
                        hermesBridgeHealth?.ok ? 'text-emerald-700' : 'text-gray-500'
                      }`}>
                        {hermesBridgeHealth === null ? '检测中...' : hermesBridgeHealth.ok ? `v${hermesBridgeHealth.version} 运行中` : hermesBridgeHealth.message || '未连接'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">本地个人偏好</h3>
                <p className="text-sm text-gray-500 mb-6">这里只管理当前设备上的头像、显示名称和个人备注，不对应云端账号中心。</p>
              </div>

              <div className="flex items-start gap-8">
                 {data?.profile ? (
                   <div className="w-64 rounded-xl border border-blue-100 bg-blue-50/60 p-4 shrink-0">
                     <div className="mb-3 flex items-center justify-between gap-2">
                       <p className="text-xs uppercase tracking-wider text-blue-600 font-bold">平台快照（只读）</p>
                       <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-blue-700">Read Only</span>
                     </div>
                     <p className="mb-3 text-xs leading-5 text-blue-800">
                       这部分来自当前 API Key 在平台侧可读取到的基础资料，仅用于帮助判断接入是否正常，不在这里编辑。
                     </p>
                     <div className="space-y-2 text-sm text-gray-700">
                       <p><span className="font-semibold text-gray-900">用户名：</span>{data.profile.username || '未返回'}</p>
                       <p><span className="font-semibold text-gray-900">角色：</span>{data.profile.role || '未返回'}</p>
                       <p><span className="font-semibold text-gray-900">企业认证：</span>{data.profile.isEnterpriseVerified ? '已认证' : '未认证'}</p>
                       <p><span className="font-semibold text-gray-900">团队数：</span>{data.profile.teams.length}</p>
                     </div>
                   </div>
                 ) : null}

                 {/* Avatar */}
                 <div className="flex flex-col items-center gap-3">
                   <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-inner">
                     {profileForm.avatarImage ? (
                       <img src={profileForm.avatarImage} alt="avatar" className="w-full h-full rounded-full object-cover" />
                     ) : (
                       profileForm.avatarLabel || profileForm.displayName.trim().charAt(0) || '企'
                     )}
                   </div>
                   <button
                     type="button"
                     className="text-sm text-blue-600 font-medium hover:underline"
                     onClick={handleAvatarPick}
                   >
                     更换头像
                   </button>
                 </div>
                 
                 {/* Form */}
                 <div className="flex-1 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">显示名称</label>
                     <input
                        type="text"
                        value={profileForm.displayName}
                        onChange={(event) => {
                          const nextDisplayName = event.target.value;
                          setProfileForm((current) => ({
                            ...current,
                            displayName: nextDisplayName,
                            avatarLabel: nextDisplayName.trim().charAt(0) || current.avatarLabel,
                          }));
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="例如：销售驾驶舱负责人"
                     />
                      <p className="text-xs text-gray-400 mt-1">用于当前设备本地界面展示，不会修改平台侧账号资料。</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">联系邮箱（本地备注）</label>
                      <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} placeholder="例如 sales.owner@company.com" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                      <p className="text-xs text-gray-400 mt-1">这是当前设备上的本地备注字段，便于客户自行记录联系人信息。</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">职位 / 头衔（本地）</label>
                      <select value={profileForm.title} onChange={(event) => setProfileForm((current) => ({ ...current, title: event.target.value }))} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-700">
                        <option value="">未设置</option>
                        <option>交付负责人</option>
                        <option>业务负责人</option>
                        <option>售前顾问</option>
                        <option>产品运营</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                      <button type="button" onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm">保存本地资料</button>
                    </div>
                 </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelected}
              />
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">本地交互偏好</h3>
                <p className="text-sm text-gray-500 mb-6">管理当前设备上的界面语言、默认输出语调与主题显示模式。</p>
              </div>

              <div className="space-y-6">
                <SettingRow title="系统界面语言">
                  <select value={generalForm.language} onChange={(event) => setGeneralForm((current) => ({ ...current, language: event.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option>简体中文 (zh-CN)</option>
                    <option>English (en-US)</option>
                  </select>
                </SettingRow>

                <SettingRow title="AI 助手默认输出语调">
                  <select value={generalForm.tone} onChange={(event) => setGeneralForm((current) => ({ ...current, tone: event.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option>严谨专业 (适合直接用于正式交付件)</option>
                    <option>客观中立 (适合内部研究与讨论)</option>
                    <option>通俗易懂 (适合制作新人培训材料)</option>
                  </select>
                </SettingRow>

                <SettingRow title="界面主题显示模式">
                   <div className="flex bg-gray-100 p-1 rounded-lg w-full">
                     {['浅色', '深色', '跟随系统'].map((theme) => (
                       <button
                         key={theme}
                         type="button"
                         onClick={() => setGeneralForm((current) => ({ ...current, theme }))}
                         className={`flex-1 py-1.5 text-sm font-medium rounded-md ${
                           generalForm.theme === theme ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                         }`}
                       >
                         {theme}
                       </button>
                     ))}
                   </div>
                </SettingRow>
                
                <hr className="border-gray-100" />
                
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={handleSaveGeneral} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm">保存交互偏好</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">本地通知与订阅</h3>
                <p className="text-sm text-gray-500 mb-6">管理当前设备上展示或触发的提醒策略，不代表平台侧统一消息中心。</p>
              </div>

              <div className="space-y-5">
                <ToggleRow title="每日摘要提醒" desc="在当前设备上保留一条本地摘要提醒，用于回看昨日资产处理和待跟进事项。" active={notificationPrefs.dailyBrief} onChange={(value) => setNotificationPrefs((current) => ({ ...current, dailyBrief: value }))} />
                <ToggleRow title="资产处理完成提醒" desc="当本地导入或平台上传的知识文件处理完成后，在当前设备上弹出提醒。" active={notificationPrefs.assetComplete} onChange={(value) => setNotificationPrefs((current) => ({ ...current, assetComplete: value }))} />
                <ToggleRow title="客户健康预警提醒" desc="当当前工作台识别到高优先级客户风险时，在当前设备上展示提醒。" active={notificationPrefs.healthAlert} onChange={(value) => setNotificationPrefs((current) => ({ ...current, healthAlert: value }))} />
                <ToggleRow title="方法论更新提醒" desc="当本地方法论配置或机构自有框架发生变更时，在当前设备上保留提醒记录。" active={notificationPrefs.frameworkUpdate} onChange={(value) => setNotificationPrefs((current) => ({ ...current, frameworkUpdate: value }))} />
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={handleSaveNotifications} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm">保存通知设置</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">接入安全与本地清理</h3>
                <p className="text-sm text-gray-500 mb-6">这里管理的是 API Key 使用安全、本地确认策略和设备数据清理动作，不是云端账号密码体系。</p>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">API Key 轮换记录</h4>
                      <p className="text-xs text-gray-500 mt-1">最近一次手动记录：{securityState.passwordUpdatedAt}</p>
                    </div>
                    <button type="button" onClick={handleChangePassword} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-100 transition">标记已轮换</button>
                  </div>
                  <p className="text-xs text-gray-500">当客户在平台侧更换 API Key 后，可以在这里更新本地记录，方便排查旧密钥是否仍残留在当前设备。</p>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">敏感操作二次确认</h4>
                      <p className="text-xs text-gray-500 mt-1">用于控制本地设备上的删除、清除接入等动作是否进入更谨慎的确认状态。当前状态：{securityState.twoFactorEnabled ? '已开启' : '未开启'}</p>
                    </div>
                    <button type="button" onClick={handleEnable2FA} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition">{securityState.twoFactorEnabled ? '关闭确认' : '立即开启'}</button>
                  </div>
                </div>

                <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-red-900">本地数据清理预案</h4>
                      <p className="text-xs text-red-700 mt-1">用于标记当前设备是否需要执行本地清理。真正的清除动作建议直接使用左下角“清除本地接入”。当前状态：{securityState.deactivationRequested ? '已标记' : '未标记'}</p>
                    </div>
                    <button type="button" onClick={handleRequestDeactivation} className="px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded hover:bg-red-100 transition">{securityState.deactivationRequested ? '已标记' : '记录清理'}</button>
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
      type="button"
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

function ToggleRow({ title, desc, active, onChange }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="pr-12">
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
      <button 
        type="button"
        onClick={() => onChange(!active)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`}></span>
      </button>
    </div>
  );
}

function StatusCard({ title, value }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900 break-all">{value}</p>
    </div>
  );
}
