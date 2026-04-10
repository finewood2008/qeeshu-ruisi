import {
  loadBrowserCrmSnapshot,
  saveBrowserCrmCustomer,
  saveBrowserCrmOpportunity,
} from './crm';

describe('browser CRM storage fallback', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('loads empty CRM snapshot in browser mode by default', () => {
    const snapshot = loadBrowserCrmSnapshot();

    expect(snapshot.clients).toHaveLength(0);
    expect(snapshot.note).toMatch(/浏览器本地存储/);
  });

  test('persists customer and opportunity into browser local storage', () => {
    const customer = saveBrowserCrmCustomer({
      name: '浏览器测试客户',
      industry: '企业服务',
      owner: '测试联系人',
      healthScore: 85,
    });

    saveBrowserCrmOpportunity({
      customerId: customer.id,
      title: '浏览器环境商机',
      stage: 'proposal',
      probability: 0.7,
    });

    const snapshot = loadBrowserCrmSnapshot();
    const target = snapshot.clients.find((item) => item.id === customer.id);

    expect(target).toBeTruthy();
    expect(target.projectsCount).toBeGreaterThan(0);
    expect(target.projects.some((item) => item.name === '浏览器环境商机')).toBe(true);
  });

  test('cleans legacy seeded browser CRM rows automatically', () => {
    window.localStorage.setItem('qeeshu_ruisi_browser_crm_v1', JSON.stringify({
      version: 1,
      customers: [
        { id: 'seed-customer-a', name: '旧演示客户' },
      ],
      opportunities: [
        { id: 'seed-opp-a1', customerId: 'seed-customer-a', title: '旧演示商机' },
      ],
    }));

    const snapshot = loadBrowserCrmSnapshot();

    expect(snapshot.clients).toHaveLength(0);
  });
});
