import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Search from './Search';
import { AppShellProvider } from '../AppShellContext';

jest.mock('../hooks/useSdkViewData', () => ({
  useSdkViewData: jest.fn(),
}));

jest.mock('../sdk/api', () => ({
  listDocumentChatMessages: jest.fn(),
  loadSearchSnapshot: jest.fn(),
  sendDocumentChatMessage: jest.fn(),
}));

const { useSdkViewData } = require('../hooks/useSdkViewData');
const { listDocumentChatMessages, sendDocumentChatMessage } = require('../sdk/api');

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function renderSearch() {
  return render(
    <AppShellProvider
      value={{
        consumePendingSearchIntent: jest.fn(() => null),
        navigateTo: jest.fn(),
        pushNotificationEvent: jest.fn(),
        pushToast: jest.fn(),
      }}
    >
      <Search />
    </AppShellProvider>,
  );
}

describe('Search empty state', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows empty state instead of mock search results', () => {
    useSdkViewData.mockReturnValue({
      data: null,
      error: null,
      loading: false,
      source: 'mock',
    });

    renderSearch();

    expect(screen.getByText('当前还没有接入真实知识库')).toBeInTheDocument();
    expect(screen.queryByText('XX重工 2022年制造成本全面优化项目结项报告')).not.toBeInTheDocument();
  });

  test('uses real sdk document chat flow when available', async () => {
    listDocumentChatMessages.mockResolvedValue([]);
    sendDocumentChatMessage.mockResolvedValue([
      { role: 'user', content: '这份资料里最值得复用的诊断框架是什么？' },
      { role: 'ai', content: '建议先复用经营诊断框架，再补证据链和行动建议。' },
    ]);
    useSdkViewData.mockReturnValue({
      data: [
        {
          id: 'doc-1',
          title: '制造业经营诊断手册',
          type: 'pdf',
          match: 92,
          date: '4/9',
          summary: '已完成索引。',
          highlight: '命中当前问题。',
          insights: ['可复用经营诊断框架。'],
        },
      ],
      error: null,
      loading: false,
      source: 'sdk',
    });

    renderSearch();

    fireEvent.change(screen.getByPlaceholderText('继续追问当前案例...'), {
      target: { value: '这份资料里最值得复用的诊断框架是什么？' },
    });
    fireEvent.click(screen.getAllByRole('button').at(-1));

    await waitFor(() => {
      expect(sendDocumentChatMessage).toHaveBeenCalled();
    });
    expect(await screen.findByText('建议先复用经营诊断框架，再补证据链和行动建议。')).toBeInTheDocument();
  });
});
