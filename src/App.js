import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BrainCircuit,
  CheckCircle2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Search as SearchIcon,
  Settings as SettingsIcon,
  X,
  Users,
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import Search from './views/Search';
import AIWriter from './views/AIWriter';
import CRM from './views/CRM';
import Assets from './views/Assets';
import Tasks from './views/Tasks';
import SettingsMethodology from './views/Settings';
import SystemSettings from './views/SystemSettings';
import ConnectWorkspace from './views/ConnectWorkspace';
import PlatformLogin from './views/PlatformLogin';
import { useRuntimeSnapshot } from './hooks/useRuntimeSnapshot';
import { AppShellProvider } from './AppShellContext';
import { saveRuntimeConfig } from './sdk/runtime';
import {
  addDesktopNotificationEvent,
  clearDesktopNotificationEvents,
  listDesktopNotificationEvents,
  markAllDesktopNotificationEventsRead,
} from './desktop/client';
import {
  readUserSettings,
  USER_SETTINGS_UPDATED_EVENT,
} from './userSettings';
import {
  appendNotificationEvent,
  clearNotificationEvents,
  countUnreadNotificationEvents,
  markAllNotificationEventsRead,
  readNotificationEvents,
} from './browser-storage/notifications';
import {
  appendTaskItem,
  removeTaskItem,
  readTaskItems,
  updateTaskItem,
} from './browser-storage/tasks';

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
      <span className={active ? 'text-white' : 'text-gray-400'}>{icon}</span>
      {label}
    </button>
  );
}

export default function STMBoxWorkbench() {
  const {
    runtime,
    error: runtimeError,
    loading: runtimeLoading,
    source: runtimeSource,
  } = useRuntimeSnapshot();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [onboardingMode, setOnboardingMode] = useState('login'); // 'login' | 'apikey'
  const [settingsTab, setSettingsTab] = useState('access');
  const [toasts, setToasts] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState(() => readTaskItems());
  const [pendingSearchIntent, setPendingSearchIntent] = useState(null);
  const [pendingWriterImport, setPendingWriterImport] = useState(null);
  const [userSettings, setUserSettings] = useState(() => readUserSettings());
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [notificationEvents, setNotificationEvents] = useState(() => readNotificationEvents());
  const unreadNotificationCount = useMemo(() => countUnreadNotificationEvents(notificationEvents), [notificationEvents]);
  const shouldShowOnboarding = runtime.resolvedMode === 'unconfigured' && activeTab !== 'settings-system';

  const formatEventTime = useCallback((value) => {
    if (!value) {
      return '刚刚';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '刚刚';
    }
    return parsed.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const pushNotificationEvent = useCallback((title, detail, level = 'info') => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      detail,
      level,
      createdAt: new Date().toISOString(),
      read: false,
      readAt: null,
    };
    const persist = runtime.resolvedMode === 'local'
      ? addDesktopNotificationEvent(entry)
      : Promise.resolve(appendNotificationEvent(entry));
    persist.then((events) => {
      setNotificationEvents(Array.isArray(events) ? events : []);
    }).catch(() => {
      setNotificationEvents((current) => [entry, ...current]);
    });
  }, [runtime.resolvedMode]);

  const pushToast = useCallback((message, tone = 'info', options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    if (options.recordEvent !== false) {
      pushNotificationEvent(
        tone === 'success' ? '操作成功' : tone === 'warning' ? '注意事项' : '系统提示',
        message,
        tone,
      );
    }
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2600);
  }, [pushNotificationEvent]);

  useEffect(() => {
    let cancelled = false;
    async function syncNotificationCenter() {
      if (runtime.resolvedMode === 'local') {
        const events = await listDesktopNotificationEvents();
        if (!cancelled) {
          setNotificationEvents(Array.isArray(events) ? events : []);
        }
        return;
      }
      if (!cancelled) {
        setNotificationEvents(readNotificationEvents());
      }
    }
    syncNotificationCenter();
    return () => {
      cancelled = true;
    };
  }, [runtime.resolvedMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncUserSettings = () => {
      setUserSettings(readUserSettings());
    };

    const handleCustomUpdate = () => {
      syncUserSettings();
    };

    const handleStorage = (event) => {
      if (event.key) {
        syncUserSettings();
      }
    };

    window.addEventListener(USER_SETTINGS_UPDATED_EVENT, handleCustomUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(USER_SETTINGS_UPDATED_EVENT, handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const requestDesktopNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      return await Notification.requestPermission();
    } catch (error) {
      return 'denied';
    }
  }, []);

  const pushDesktopNotification = useCallback((title, body, preferenceKey = null) => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return false;
    }

    if (preferenceKey && !userSettings.notifications?.[preferenceKey]) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        body,
        tag: `qeeshu-ruisi-${preferenceKey || 'general'}`,
      });
      window.setTimeout(() => {
        notification.close();
      }, 4200);
      return true;
    } catch (error) {
      return false;
    }
  }, [userSettings.notifications]);

  const confirmSensitiveAction = useCallback((options) => {
    if (!userSettings.security?.twoFactorEnabled) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      setConfirmDialog({
        title: options?.title || '确认继续执行该操作？',
        description: options?.description || '这是一个敏感操作，请再次确认。',
        confirmLabel: options?.confirmLabel || '确认继续',
        cancelLabel: options?.cancelLabel || '取消',
        tone: options?.tone || 'danger',
        resolve,
      });
    });
  }, [userSettings.security?.twoFactorEnabled]);

  const closeConfirmDialog = useCallback((confirmed) => {
    if (confirmDialog?.resolve) {
      confirmDialog.resolve(confirmed);
    }
    setConfirmDialog(null);
  }, [confirmDialog]);

  const navigateTo = useCallback((tab, options = {}) => {
    if (tab === 'settings-system' && options.settingsTab) {
      setSettingsTab(options.settingsTab);
    }
    if (tab === 'search' && options.query) {
      setPendingSearchIntent({
        id: `${Date.now()}`,
        query: options.query,
      });
    }
    if (tab === 'write' && options.writerImport) {
      setPendingWriterImport({
        id: `${Date.now()}`,
        ...options.writerImport,
      });
    }
    setActiveTab(tab);
  }, []);

  const consumePendingSearchIntent = useCallback(() => {
    const current = pendingSearchIntent;
    setPendingSearchIntent(null);
    return current;
  }, [pendingSearchIntent]);

  const consumePendingWriterImport = useCallback(() => {
    const current = pendingWriterImport;
    setPendingWriterImport(null);
    return current;
  }, [pendingWriterImport]);

  const handleCreateTask = useCallback((payload) => {
    const nextTasks = appendTaskItem(payload);
    setTasks(Array.isArray(nextTasks) ? nextTasks : []);
    setActiveTab('tasks');
    setTaskModalOpen(false);
    pushNotificationEvent(
      `已创建跟进事项「${payload.title}」`,
      `事项范围：${payload.scope}${payload.note ? `；备注：${payload.note}` : ''}`,
      'success',
    );
    pushToast(`跟进事项「${payload.title}」已创建`, 'success', { recordEvent: false });
  }, [pushNotificationEvent, pushToast]);

  const handleUpdateTaskStatus = useCallback((taskId, status) => {
    const current = tasks.find((item) => String(item.id) === String(taskId));
    const nextTasks = updateTaskItem(taskId, { status });
    setTasks(Array.isArray(nextTasks) ? nextTasks : []);
    if (current) {
      const label = status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : '待处理';
      pushToast(`事项「${current.title}」已更新为${label}`, 'success', { recordEvent: false });
    }
  }, [tasks, pushToast]);

  const handleEditTask = useCallback((taskId, updates) => {
    const current = tasks.find((item) => String(item.id) === String(taskId));
    const nextTasks = updateTaskItem(taskId, updates);
    setTasks(Array.isArray(nextTasks) ? nextTasks : []);
    if (current) {
      const nextTitle = updates?.title?.trim() || current.title;
      pushNotificationEvent(
        `已更新跟进事项「${nextTitle}」`,
        `范围：${updates?.scope || current.scope}${updates?.note ? `；备注：${updates.note}` : ''}`,
        'success',
      );
      pushToast(`事项「${nextTitle}」已保存`, 'success', { recordEvent: false });
    }
  }, [tasks, pushNotificationEvent, pushToast]);

  const handleDeleteTask = useCallback((taskId) => {
    const current = tasks.find((item) => String(item.id) === String(taskId));
    const nextTasks = removeTaskItem(taskId);
    setTasks(Array.isArray(nextTasks) ? nextTasks : []);
    if (current) {
      pushToast(`事项「${current.title}」已删除`, 'success', { recordEvent: false });
    }
  }, [tasks, pushToast]);

  const handleArchiveTask = useCallback((taskId) => {
    const current = tasks.find((item) => String(item.id) === String(taskId));
    const nextTasks = updateTaskItem(taskId, { archivedAt: new Date().toISOString() });
    setTasks(Array.isArray(nextTasks) ? nextTasks : []);
    if (current) {
      pushToast(`事项「${current.title}」已归档`, 'success', { recordEvent: false });
    }
  }, [tasks, pushToast]);

  const handleRestoreTask = useCallback((taskId) => {
    const current = tasks.find((item) => String(item.id) === String(taskId));
    const nextTasks = updateTaskItem(taskId, { archivedAt: null });
    setTasks(Array.isArray(nextTasks) ? nextTasks : []);
    if (current) {
      pushToast(`事项「${current.title}」已恢复到列表`, 'success', { recordEvent: false });
    }
  }, [tasks, pushToast]);

  const handleGlobalSearch = useCallback(() => {
    const normalized = searchQuery.trim();
    if (!normalized) {
      pushToast('请输入要检索的内容', 'warning');
      return;
    }
    navigateTo('search', { query: normalized });
  }, [navigateTo, pushToast, searchQuery]);

  const appShellValue = useMemo(() => ({
    activeTab,
    confirmSensitiveAction,
    navigateTo,
    openTaskComposer: () => {
      setActiveTab('tasks');
      setTaskModalOpen(true);
    },
    pushNotificationEvent,
    pushDesktopNotification,
    pushToast,
    requestDesktopNotificationPermission,
    pendingSearchIntent,
    consumePendingSearchIntent,
    pendingWriterImport,
    consumePendingWriterImport,
    userSettings,
  }), [activeTab, confirmSensitiveAction, consumePendingSearchIntent, consumePendingWriterImport, navigateTo, pendingSearchIntent, pendingWriterImport, pushDesktopNotification, pushNotificationEvent, pushToast, requestDesktopNotificationPermission, userSettings]);

  const handleOpenNotifications = useCallback(() => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (!nextOpen || unreadNotificationCount <= 0) {
      return;
    }
    if (runtime.resolvedMode === 'local') {
      markAllDesktopNotificationEventsRead().then((events) => {
        setNotificationEvents(Array.isArray(events) ? events : []);
      }).catch(() => {});
      return;
    }
    setNotificationEvents(markAllNotificationEventsRead());
  }, [notificationsOpen, runtime.resolvedMode, unreadNotificationCount]);

  const handleClearNotifications = useCallback(() => {
    if (runtime.resolvedMode === 'local') {
      clearDesktopNotificationEvents().then((events) => {
        setNotificationEvents(Array.isArray(events) ? events : []);
      }).catch(() => {});
      return;
    }
    clearNotificationEvents();
    setNotificationEvents([]);
  }, [runtime.resolvedMode]);

  const renderContent = () => {
    if (shouldShowOnboarding) {
      if (onboardingMode === 'login') {
        return (
          <PlatformLogin
            onLoginSuccess={({ baseUrl, apiKey, token, username }) => {
              try {
                saveRuntimeConfig({ baseUrl, apiKey: apiKey || token });
                window.setTimeout(() => window.location.reload(), 400);
              } catch (err) {
                // 降级：直接刷新
                window.location.reload();
              }
            }}
            onSwitchToApiKey={() => setOnboardingMode('apikey')}
          />
        );
      }
      return (
        <ConnectWorkspace
          onOpenSettings={() => setActiveTab('settings-system')}
          onSwitchToLogin={() => setOnboardingMode('login')}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
        return <Search />;
      case 'write':
        return <AIWriter />;
      case 'crm':
        return <CRM />;
      case 'assets':
        return <Assets />;
      case 'tasks':
        return (
          <Tasks
            tasks={tasks}
            onOpenComposer={() => setTaskModalOpen(true)}
            onUpdateStatus={handleUpdateTaskStatus}
            onEditTask={handleEditTask}
            onArchiveTask={handleArchiveTask}
            onRestoreTask={handleRestoreTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'settings-methodology':
        return <SettingsMethodology />;
      case 'settings-system':
        return <SystemSettings activeTab={settingsTab} onChangeTab={setSettingsTab} />;
      default:
        return (
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
    <AppShellProvider value={appShellValue}>
      <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
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

        <div className="px-4 pt-4">
          <div className={`rounded-xl border px-3 py-3 text-xs ${
            runtime.resolvedMode === 'sdk'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              : runtime.resolvedMode === 'local'
                ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          }`}>
            <p className="font-semibold">{runtime.modeLabel}</p>
            <p className="mt-1 opacity-80">{runtime.runtimeLabel} · {runtime.workspaceLabel}</p>
            <p className="mt-1 truncate opacity-70">{runtime.baseUrlLabel}</p>
            {runtimeLoading ? <p className="mt-1 opacity-60">正在检测本地 QeeClaw...</p> : null}
            {runtimeError ? (
              <p className="mt-1 text-[11px] opacity-90">
                SDK 连接异常：{runtimeError.message}
              </p>
            ) : null}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          <NavItem icon={<LayoutDashboard size={18} />} label="智能工作台" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<CheckCircle2 size={18} />} label="跟进事项" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavItem icon={<SearchIcon size={18} />} label="知识库诊断检索" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          <NavItem icon={<FileText size={18} />} label="AI 撰写助手" active={activeTab === 'write'} onClick={() => setActiveTab('write')} />
          <NavItem icon={<Users size={18} />} label="客户 CRM" active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} />
          <NavItem icon={<FolderOpen size={18} />} label="资产管理" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <NavItem icon={<BrainCircuit size={18} />} label="方法论" active={activeTab === 'settings-methodology'} onClick={() => setActiveTab('settings-methodology')} />

          <div
            className="mt-4 flex items-center justify-between px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 transition cursor-pointer rounded-lg group"
            onClick={() => setActiveTab('settings-system')}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {userSettings.profile?.avatarImage ? (
                  <img
                    src={userSettings.profile.avatarImage}
                    alt={userSettings.profile.displayName || 'avatar'}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  userSettings.profile?.avatarLabel || userSettings.profile?.displayName?.trim().charAt(0) || '企'
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition">
                  {userSettings.profile?.displayName || '当前用户'}
                </p>
                <p className="text-xs text-gray-400">本地偏好与接入</p>
              </div>
            </div>
            <SettingsIcon size={14} className="text-gray-500 group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center bg-gray-100/80 border border-gray-200 rounded-lg px-4 py-2 w-[28rem] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
            <SearchIcon size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="全局搜索案例、客户或 SDK 模块..."
              className="bg-transparent border-none focus:outline-none w-full text-sm text-gray-700 placeholder-gray-400"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleGlobalSearch();
                }
              }}
            />
          </div>

          <div className="flex items-center gap-5">
            <div className={`hidden xl:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              runtimeSource === 'sdk'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : runtimeSource === 'local'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${runtimeSource === 'sdk' ? 'bg-emerald-500' : runtimeSource === 'local' ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
              {runtimeError ? 'QeeClaw SDK 异常' : runtime.sourceLabel}
            </div>
            <button
              className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
              onClick={handleOpenNotifications}
            >
              <Bell size={20} />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full border-2 border-white bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              ) : null}
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 transition-all flex items-center gap-2"
              onClick={() => {
                setActiveTab('tasks');
                setTaskModalOpen(true);
              }}
            >
              新建跟进事项
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {runtime.resolvedMode === 'local' ? (
            <div className="relative z-10 mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">当前运行在本地桌面数据模式</p>
                  <p className="mt-1 text-sm text-indigo-800">
                    现在展示的是 Electron 本地 SQLite 数据与桌面服务层。配置 `baseUrl + API Key` 后，可继续接入云端授权、计费与控制面。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('settings-system')}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  查看桌面接入配置
                </button>
              </div>
            </div>
          ) : !runtime.hasCredentials && !shouldShowOnboarding ? (
            <div className="relative z-10 mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber-900">当前未配置 QeeClaw Platform 连接</p>
                  <p className="mt-1 text-sm text-amber-800">
                    当前尚未接入真实平台。前往"本地偏好与接入"页面，填写平台提供的 `baseUrl + API Key` 后即可启用真实链路。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('settings-system')}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                >
                  前往配置接入
                </button>
              </div>
            </div>
          ) : runtimeError ? (
            <div className="relative z-10 mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-rose-900">QeeClaw Platform 连接异常</p>
                  <p className="mt-1 text-sm text-rose-800">
                    {runtimeError.message}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('settings-system')}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  查看接入诊断
                </button>
              </div>
            </div>
          ) : null}

          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
          <div className="relative z-10 h-full">{renderContent()}</div>
        </div>
      </main>
      {notificationsOpen ? (
        <div className="absolute right-10 top-20 z-40 w-[26rem] rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">系统通知</p>
              <p className="mt-1 text-xs text-gray-500">当前设备上的真实操作事件、本地事项与状态提醒</p>
            </div>
            <div className="flex items-center gap-2">
              {notificationEvents.length > 0 ? (
                <button onClick={handleClearNotifications} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                  清空
                </button>
              ) : null}
              <button onClick={() => setNotificationsOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-3 px-4 py-4">
            {notificationEvents.length > 0 ? notificationEvents.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CheckCircle2 size={15} className={item.level === 'warning' ? 'text-amber-500' : item.level === 'success' ? 'text-emerald-500' : 'text-blue-500'} />
                  {item.title}
                  {!item.read ? <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">未读</span> : null}
                </div>
                <p className="mt-2 text-xs text-gray-600">{item.detail}</p>
                <p className="mt-2 text-[11px] text-gray-400">{formatEventTime(item.createdAt)}</p>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-gray-700">还没有通知记录</p>
                <p className="mt-1 text-xs text-gray-500">后续接入事件、保存动作、资产操作和本地事项都会写到这里。</p>
              </div>
            )}
            {tasks.length > 0 ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-blue-900">最近跟进事项</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      setActiveTab('tasks');
                    }}
                    className="text-xs font-medium text-blue-700 hover:underline"
                  >
                    查看全部
                  </button>
                </div>
                <div className="mt-2 space-y-2 text-xs text-blue-800">
                  {tasks.slice(0, 3).map((item) => (
                    <div key={item.id}>{item.title} · {item.scope}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {taskModalOpen ? (
        <TaskComposer
          onClose={() => setTaskModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      ) : null}

      {confirmDialog ? (
        <SensitiveActionConfirmDialog
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          tone={confirmDialog.tone}
          onCancel={() => closeConfirmDialog(false)}
          onConfirm={() => closeConfirmDialog(true)}
        />
      ) : null}

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 space-y-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
              item.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : item.tone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
      </div>
    </AppShellProvider>
  );
}

function SensitiveActionConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone,
  onCancel,
  onConfirm,
}) {
  const confirmClassName = tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-lg font-bold text-gray-900">{title}</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-5">
          <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmClassName}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskComposer({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '新跟进事项',
    scope: '客户跟进',
    note: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-lg font-bold text-gray-900">新建跟进事项</p>
            <p className="mt-1 text-sm text-gray-500">用于记录当前设备上的客户跟进、验证事项或待办动作。</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">任务标题</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">任务范围</span>
            <input
              value={form.scope}
              onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">备注</span>
            <textarea
              rows={4}
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button
              onClick={() => onSubmit(form)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <CheckCircle2 size={14} />
              创建事项
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
