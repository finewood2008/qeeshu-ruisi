import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CRM from './CRM';
import { AppShellProvider } from '../AppShellContext';

jest.mock('../hooks/useSdkViewData', () => ({
  useSdkViewData: jest.fn(),
}));

jest.mock('../sdk/runtime', () => ({
  shouldUseDesktopBusinessData: jest.fn(),
  canUseBrowserBusinessData: jest.fn(),
}));

jest.mock('../sdk/api', () => ({
  loadCrmSnapshot: jest.fn(),
  persistCrmCustomer: jest.fn(),
  persistCrmOpportunity: jest.fn(),
}));

const { useSdkViewData } = require('../hooks/useSdkViewData');
const { shouldUseDesktopBusinessData, canUseBrowserBusinessData } = require('../sdk/runtime');

function renderCRM() {
  return render(
    <AppShellProvider
      value={{
        navigateTo: jest.fn(),
        pushNotificationEvent: jest.fn(),
        pushToast: jest.fn(),
      }}
    >
      <CRM />
    </AppShellProvider>,
  );
}

describe('CRM local management actions', () => {
  beforeEach(() => {
    shouldUseDesktopBusinessData.mockReturnValue(true);
    canUseBrowserBusinessData.mockReturnValue(false);
    useSdkViewData.mockReturnValue({
      data: {
        clients: [
          {
            id: 'customer-1',
            name: 'A重工集团',
            industry: '机械制造',
            projectsCount: 2,
            score: 92,
            trend: 'up',
            status: '优质客户，建议推进二期数字化转型项目',
            contact: {
              name: '张建国',
              role: 'CIO',
              phone: '138-0000-0000',
              email: 'zhangjg@a-heavy.com',
            },
            address: '江苏省苏州市工业园区',
            description: '客户简介',
            aiDiagnosis: '客户目前现金流充裕，建议推进下一阶段项目。',
            projects: [
              { name: '一期项目', date: '2026.01 - 2026.03', status: '进行中' },
            ],
            assets: [
              { name: 'A重工_诊断报告.pdf', type: 'PDF' },
            ],
          },
        ],
        stats: {
          healthy: 1,
          renew: 0,
          warning: 0,
        },
      },
      error: null,
      source: 'sdk',
      loading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows import customer action when desktop local CRM is available', () => {
    renderCRM();

    const importButton = screen.getByRole('button', { name: /导入新客户/i });
    expect(importButton).toBeEnabled();
  });

  test('keeps edit and create opportunity actions enabled in customer detail', () => {
    renderCRM();

    fireEvent.click(screen.getByText('A重工集团'));

    expect(screen.getByRole('button', { name: /编辑资料/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /新建商机项目/i })).toBeEnabled();
  });

  test('enables local CRM actions in pure browser mode', () => {
    shouldUseDesktopBusinessData.mockReturnValue(false);
    canUseBrowserBusinessData.mockReturnValue(true);
    useSdkViewData.mockReturnValue({
      data: {
        clients: [],
        stats: {
          healthy: 0,
          renew: 0,
          warning: 0,
        },
      },
      error: null,
      source: 'browser',
      loading: false,
    });

    renderCRM();

    expect(screen.getByRole('button', { name: /导入新客户/i })).toBeEnabled();
    expect(screen.getByText('浏览器本地 CRM 开发数据')).toBeInTheDocument();
    expect(screen.getByText('当前还没有客户数据')).toBeInTheDocument();
  });
});
