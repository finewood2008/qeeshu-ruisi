import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppShellProvider } from '../AppShellContext';
import Assets from './Assets';
import { persistKnowledgeDocument } from '../sdk/api';

jest.mock('../hooks/useSdkViewData', () => ({
  useSdkViewData: () => ({
    data: {
      title: 'SDK Runtime',
      runtimeLabel: 'OpenClaw',
      statusLabel: 'ready',
      onlineText: '1/1 在线',
      watchDir: 'cloud://knowledge',
      lastSyncAt: '刚刚',
      telemetryMode: 'estimated',
      assetCount: 0,
      indexedCount: 0,
      processingCount: 0,
      files: [],
    },
    error: null,
    source: 'sdk',
    loading: false,
  }),
}));

jest.mock('../sdk/api', () => ({
  loadAssetsSnapshot: jest.fn(),
  persistKnowledgeDocument: jest.fn().mockResolvedValue({ ok: true }),
  reindexKnowledgeDocument: jest.fn(),
  deleteKnowledgeDocument: jest.fn(),
}));

function renderAssets() {
  return render(
    <AppShellProvider
      value={{
        confirmSensitiveAction: jest.fn().mockResolvedValue(true),
        navigateTo: jest.fn(),
        pushDesktopNotification: jest.fn(),
        pushToast: jest.fn(),
      }}
    >
      <Assets />
    </AppShellProvider>,
  );
}

test('uploads selected file into platform knowledge base in sdk mode', async () => {
  renderAssets();

  const file = new File(['pdf'], 'sales-playbook.pdf', { type: 'application/pdf' });
  const fileInput = document.querySelector('input[type="file"]');

  expect(fileInput).not.toBeNull();
  fireEvent.change(fileInput, { target: { files: [file] } });

  expect(screen.getByText('上传知识文件到平台知识库')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('文件名'), { target: { value: 'sales-playbook-v2.pdf' } });

  const submitButtons = screen.getAllByRole('button', { name: /上传到知识库/ });
  fireEvent.click(submitButtons[submitButtons.length - 1]);

  await waitFor(() => {
    expect(persistKnowledgeDocument).toHaveBeenCalledWith(expect.objectContaining({
      title: 'sales-playbook-v2.pdf',
      filename: 'sales-playbook-v2.pdf',
      file,
      contentType: 'application/pdf',
      sourceName: 'sales-playbook-v2.pdf',
    }));
  });
});
