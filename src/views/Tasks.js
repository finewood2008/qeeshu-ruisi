import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  FilePenLine,
  ListTodo,
  Plus,
  RotateCcw,
  Search,
  Archive,
  Trash2,
} from 'lucide-react';

const filterOptions = [
  { value: 'all', label: '全部事项' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

function formatTime(value) {
  if (!value) {
    return '刚刚';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '刚刚';
  }
  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusMeta(status) {
  if (status === 'completed') {
    return {
      label: '已完成',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 size={14} className="text-emerald-600" />,
    };
  }
  if (status === 'in_progress') {
    return {
      label: '进行中',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: <Clock3 size={14} className="text-blue-600" />,
    };
  }
  return {
    label: '待处理',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Circle size={14} className="text-amber-600" />,
  };
}

function StatCard({ title, value, tone }) {
  const palette = tone === 'blue'
    ? 'bg-blue-50 border-blue-100 text-blue-700'
    : tone === 'emerald'
      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
      : 'bg-amber-50 border-amber-100 text-amber-700';

  return (
    <div className={`rounded-2xl border p-5 ${palette}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

export default function Tasks({
  tasks,
  onOpenComposer,
  onUpdateStatus,
  onEditTask,
  onArchiveTask,
  onRestoreTask,
  onDeleteTask,
}) {
  const [filter, setFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const sortedTasks = useMemo(() => {
    const normalizeTime = (value) => {
      const parsed = new Date(value || 0);
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    const priority = {
      in_progress: 0,
      pending: 1,
      completed: 2,
    };

    return [...tasks].sort((left, right) => {
      const statusGap = (priority[left.status] ?? 99) - (priority[right.status] ?? 99);
      if (statusGap !== 0) {
        return statusGap;
      }

      if (left.status === 'completed' && right.status === 'completed') {
        return normalizeTime(right.completedAt) - normalizeTime(left.completedAt);
      }

      return normalizeTime(right.updatedAt || right.createdAt) - normalizeTime(left.updatedAt || left.createdAt);
    });
  }, [tasks]);

  const activeTasks = useMemo(() => sortedTasks.filter((item) => !item.archivedAt), [sortedTasks]);
  const archivedTasks = useMemo(() => sortedTasks.filter((item) => item.archivedAt), [sortedTasks]);

  const scopeOptions = useMemo(() => {
    const uniqueScopes = Array.from(new Set(tasks.map((item) => item.scope).filter(Boolean)));
    return ['all', ...uniqueScopes];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return activeTasks.filter((item) => {
      const matchesStatus = filter === 'all' ? true : item.status === filter;
      const matchesScope = scopeFilter === 'all' ? true : item.scope === scopeFilter;
      const haystack = `${item.title} ${item.scope} ${item.note || ''}`.toLowerCase();
      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesStatus && matchesScope && matchesSearch;
    });
  }, [activeTasks, filter, scopeFilter, searchQuery]);

  const stats = useMemo(() => ({
    pending: activeTasks.filter((item) => item.status === 'pending').length,
    inProgress: activeTasks.filter((item) => item.status === 'in_progress').length,
    completed: activeTasks.filter((item) => item.status === 'completed').length,
    archived: archivedTasks.length,
  }), [activeTasks, archivedTasks.length]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white px-6 py-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-600">
            <ListTodo size={16} />
            本地事项中心
          </div>
          <h2 className="mt-3 text-3xl font-black text-gray-900">跟进事项</h2>
          <p className="mt-2 text-sm text-gray-600">
            当前页用于管理本地客户跟进、联调事项和待办动作。事项保存在当前设备，不依赖远程后端。
          </p>
        </div>
        <button
          onClick={onOpenComposer}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          新建跟进事项
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard title="待处理" value={stats.pending} tone="amber" />
        <StatCard title="进行中" value={stats.inProgress} tone="blue" />
        <StatCard title="已完成" value={stats.completed} tone="emerald" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900">事项列表</div>
            <div className="mt-1 text-xs text-gray-500">支持搜索、按范围筛选、推进、归档和删除。</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索事项标题或备注..."
                className="w-64 rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-700 outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-400"
            >
              {scopeOptions.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? '全部范围' : item}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    filter === item.value
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <CalendarClock size={24} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">当前还没有事项</h3>
              <p className="mt-2 text-sm leading-7 text-gray-500">
                可以先新建客户跟进、知识整理或联调待办事项，后续再按状态推进。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((item) => {
                const meta = getStatusMeta(item.status);
                return (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-gray-900">{item.title}</div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                            {meta.icon}
                            {meta.label}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600 border border-gray-200">
                            {item.scope}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">创建时间：{formatTime(item.createdAt)}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          最近更新：{formatTime(item.updatedAt || item.createdAt)}
                          {item.completedAt ? ` · 完成于 ${formatTime(item.completedAt)}` : ''}
                        </div>
                        {item.note ? (
                          <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-700">
                            {item.note}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTask(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <FilePenLine size={13} />
                          编辑
                        </button>
                        {item.status !== 'pending' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(item.id, 'pending')}
                            className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
                          >
                            标记待处理
                          </button>
                        ) : null}
                        {item.status !== 'in_progress' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(item.id, 'in_progress')}
                            className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            标记进行中
                          </button>
                        ) : null}
                        {item.status !== 'completed' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(item.id, 'completed')}
                            className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            标记已完成
                          </button>
                        ) : null}
                        {item.status === 'completed' ? (
                          <button
                            type="button"
                            onClick={() => onArchiveTask(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Archive size={13} />
                            归档
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onDeleteTask(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            <div className="text-base font-semibold text-gray-900">已归档事项</div>
            <div className="mt-1 text-xs text-gray-500">已完成并归档的事项会保留在本地，可随时恢复。</div>
          </div>
          <button
            type="button"
            onClick={() => setShowArchived((current) => !current)}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {showArchived ? '收起归档' : `查看归档 (${stats.archived})`}
          </button>
        </div>
        {showArchived ? (
          <div className="p-6">
            {archivedTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500">
                当前还没有归档事项。
              </div>
            ) : (
              <div className="space-y-4">
                {archivedTasks.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-gray-900">{item.title}</div>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-200">
                            已归档
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600 border border-gray-200">
                            {item.scope}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          完成于：{formatTime(item.completedAt)} · 归档保留于当前设备
                        </div>
                        {item.note ? (
                          <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-700">
                            {item.note}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onRestoreTask(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <RotateCcw size={13} />
                          恢复
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {editingTask ? (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(payload) => {
            onEditTask(editingTask.id, payload);
            setEditingTask(null);
          }}
        />
      ) : null}
    </div>
  );
}

function TaskEditModal({ task, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: task.title || '',
    scope: task.scope || '',
    note: task.note || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm px-6">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-lg font-bold text-gray-900">编辑跟进事项</p>
            <p className="mt-1 text-sm text-gray-500">可以更新标题、范围和备注，变更会保存在当前设备。</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            x
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">事项标题</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">事项范围</span>
            <input
              value={form.scope}
              onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">备注</span>
            <textarea
              rows={5}
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              取消
            </button>
            <button
              onClick={() => onSubmit(form)}
              disabled={!form.title.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              保存修改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
