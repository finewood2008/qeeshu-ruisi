import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { AppShellProvider } from '../AppShellContext';

jest.mock('../hooks/useSdkViewData', () => ({
  useSdkViewData: jest.fn(),
}));

const { useSdkViewData } = require('../hooks/useSdkViewData');

function renderDashboard() {
  return render(
    <AppShellProvider
      value={{
        navigateTo: jest.fn(),
        pushToast: jest.fn(),
      }}
    >
      <Dashboard />
    </AppShellProvider>,
  );
}

describe('Dashboard empty state', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows access guidance instead of fallback mock dashboard', () => {
    useSdkViewData.mockReturnValue({
      data: null,
      error: null,
      loading: false,
      source: 'mock',
    });

    renderDashboard();

    expect(screen.getByText('当前处于未接入状态')).toBeInTheDocument();
    expect(screen.queryByText('下午好，李顾问')).not.toBeInTheDocument();
  });

  test('shows empty state when recent assets are empty instead of fake platform documents', () => {
    useSdkViewData.mockReturnValue({
      data: {
        statusText: '运行良好',
        greeting: '欢迎进入企数睿思工作台',
        subtitle: '真实数据模式',
        healthScore: null,
        cards: [
          { title: 'A', value: '1', trend: '+1', trendText: 'x', type: 'info' },
          { title: 'B', value: '1', trend: '+1', trendText: 'x', type: 'warning' },
          { title: 'C', value: '1', trend: '+1', trendText: 'x', type: 'danger' },
          { title: 'D', value: '在线', trend: '1/1 在线', trendText: 'x', type: 'success' },
        ],
        projects: [],
        recentAssets: [],
        recommendation: {
          title: '等待更多真实知识资产进入索引',
          tag: '知识资产',
          description: '当前还没有可用于首页推荐的真实知识资产，已不再展示平台文档示例。',
        },
        crmAlerts: [],
      },
      error: null,
      loading: false,
      source: 'sdk',
    });

    renderDashboard();

    expect(screen.getByText('当前还没有真实入库资产')).toBeInTheDocument();
    expect(screen.queryByText('NexusAOS API 接口文档')).not.toBeInTheDocument();
  });

  test('renders completed tag for normalized knowledge asset states', () => {
    useSdkViewData.mockReturnValue({
      data: {
        statusText: '运行良好',
        greeting: '欢迎进入企数睿思工作台',
        subtitle: '真实数据模式',
        healthScore: null,
        cards: [
          { title: 'A', value: '1', trend: '+1', trendText: 'x', type: 'info' },
          { title: 'B', value: '1', trend: '+1', trendText: 'x', type: 'warning' },
          { title: 'C', value: '1', trend: '+1', trendText: 'x', type: 'danger' },
          { title: 'D', value: '在线', trend: '1/1 在线', trendText: 'x', type: 'success' },
        ],
        projects: [],
        recentAssets: [
          {
            name: '网站备案办事指南.pdf',
            type: 'pdf',
            date: '刚刚',
            tag: '已完成',
          },
        ],
        recommendation: {
          title: '等待更多真实知识资产进入索引',
          tag: '知识资产',
          description: '当前还没有可用于首页推荐的真实知识资产，已不再展示平台文档示例。',
        },
        crmAlerts: [],
      },
      error: null,
      loading: false,
      source: 'sdk',
    });

    renderDashboard();

    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.queryByText('待处理')).not.toBeInTheDocument();
  });
});
