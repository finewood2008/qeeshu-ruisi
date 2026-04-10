import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AIWriter from './AIWriter';
import { AppShellProvider } from '../AppShellContext';

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div style={{ width: 800, height: 240 }}>{children}</div>,
  };
});

jest.mock('../hooks/useSdkViewData', () => ({
  useSdkViewData: jest.fn(),
}));

jest.mock('../sdk/api', () => ({
  generateWriterBlocks: jest.fn(),
  listWriterDrafts: jest.fn(() => Promise.resolve([])),
  loadWriterDraft: jest.fn(() => Promise.resolve(null)),
  loadWriterSnapshot: jest.fn(),
  persistWriterDraft: jest.fn(),
  recordAiExecutionLog: jest.fn(() => Promise.resolve([])),
  runWriterMethodologyCheck: jest.fn(() => Promise.resolve(null)),
}));

const { useSdkViewData } = require('../hooks/useSdkViewData');
const { generateWriterBlocks } = require('../sdk/api');

function renderWriter() {
  return render(
    <AppShellProvider
      value={{
        confirmSensitiveAction: jest.fn(() => Promise.resolve(true)),
        consumePendingWriterImport: jest.fn(() => null),
        pushNotificationEvent: jest.fn(),
        pushToast: jest.fn(),
      }}
    >
      <AIWriter />
    </AppShellProvider>,
  );
}

describe('AIWriter real generation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('inserts real generated blocks when capability is enabled', async () => {
    useSdkViewData.mockReturnValue({
      data: {
        routeProfile: {
          resolvedModel: 'gpt-4.1',
          resolvedProviderName: 'OpenAI',
          candidateCount: 1,
          resolutionReason: 'default route',
        },
        usage: { totalCalls: 0 },
        cost: { totalAmount: 0, primaryCurrency: 'CNY' },
        quota: { dailySpent: 0, dailyRemaining: 100, monthlySpent: 0, monthlyRemaining: 1000, currency: 'CNY' },
        providerSummary: [{ providerName: 'OpenAI', visibleCount: 1, configured: true }],
        products: [],
        capabilities: {
          blockGenerate: true,
          methodologyCheck: true,
          chartGenerate: true,
          imageGenerate: false,
        },
        missingApis: ['image generate / 智能配图'],
      },
      error: null,
      loading: false,
      source: 'sdk',
    });
    generateWriterBlocks.mockResolvedValue({
      note: '已补充一段可直接落报告的分析。',
      blocks: [
        {
          id: 'generated-1',
          type: 'p',
          content: '这是一次真实生成的销售方案分析段落。',
          aiGenerated: true,
        },
      ],
    });

    renderWriter();

    fireEvent.change(screen.getByPlaceholderText(/在此输入正文/i), {
      target: { value: '我们需要先梳理客户经营现状、销售漏斗和当前推进障碍。' },
    });
    fireEvent.click(screen.getByRole('button', { name: /插入正文块/i }));
    fireEvent.click(screen.getByRole('button', { name: /自动润色/i }));

    await waitFor(() => {
      expect(generateWriterBlocks).toHaveBeenCalled();
    });
    expect(await screen.findByText('这是一次真实生成的销售方案分析段落。')).toBeInTheDocument();
  });

  test('disables ai actions when draft context is still empty', () => {
    useSdkViewData.mockReturnValue({
      data: {
        routeProfile: {
          resolvedModel: 'gpt-4.1',
          resolvedProviderName: 'OpenAI',
          candidateCount: 1,
          resolutionReason: 'default route',
        },
        usage: { totalCalls: 0 },
        cost: { totalAmount: 0, primaryCurrency: 'CNY' },
        quota: { dailySpent: 0, dailyRemaining: 100, monthlySpent: 0, monthlyRemaining: 1000, currency: 'CNY' },
        providerSummary: [],
        products: [],
        capabilities: {
          blockGenerate: true,
          methodologyCheck: true,
          chartGenerate: true,
          imageGenerate: false,
        },
        missingApis: [],
      },
      error: null,
      loading: false,
      source: 'sdk',
    });

    renderWriter();

    expect(screen.getByRole('button', { name: /自动润色/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /优先补齐/i })).toBeDisabled();
  });
});
