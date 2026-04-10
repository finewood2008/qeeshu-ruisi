import {
  appendTaskItem,
  readTaskItems,
  removeTaskItem,
  updateTaskItem,
} from './tasks';

describe('browser task storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('creates, updates and removes task items', () => {
    const created = appendTaskItem({
      title: '跟进销售驾驶舱首页',
      scope: '客户交付',
      note: '确认仪表盘展示字段',
    });

    expect(created).toHaveLength(1);
    expect(created[0].status).toBe('pending');
    expect(created[0].updatedAt).toBeTruthy();

    const updated = updateTaskItem(created[0].id, { status: 'completed' });
    expect(updated[0].status).toBe('completed');
    expect(updated[0].completedAt).toBeTruthy();
    expect(updated[0].archivedAt).toBeNull();

    const archived = updateTaskItem(created[0].id, { archivedAt: new Date().toISOString() });
    expect(archived[0].archivedAt).toBeTruthy();

    const restored = updateTaskItem(created[0].id, { archivedAt: null });
    expect(restored[0].archivedAt).toBeNull();

    const removed = removeTaskItem(created[0].id);
    expect(removed).toHaveLength(0);
    expect(readTaskItems()).toHaveLength(0);
  });
});
