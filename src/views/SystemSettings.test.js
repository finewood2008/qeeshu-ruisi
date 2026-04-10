import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppShellProvider } from '../AppShellContext';
import SystemSettings from './SystemSettings';
import { createDefaultUserSettings } from '../userSettings';

jest.mock('../hooks/useSdkViewData', () => ({
  useSdkViewData: () => ({
    data: null,
    error: null,
    source: 'mock',
    loading: false,
  }),
}));

function renderSystemSettings() {
  function Wrapper() {
    const [tab, setTab] = useState('profile');

    return (
      <AppShellProvider
        value={{
          confirmSensitiveAction: jest.fn().mockResolvedValue(true),
          pushDesktopNotification: jest.fn(),
          pushToast: jest.fn(),
          requestDesktopNotificationPermission: jest.fn().mockResolvedValue('granted'),
          userSettings: createDefaultUserSettings(),
        }}
      >
        <SystemSettings activeTab={tab} onChangeTab={setTab} />
      </AppShellProvider>
    );
  }

  return render(<Wrapper />);
}

test('switches system settings tabs when clicking sidebar buttons', () => {
  renderSystemSettings();

  fireEvent.click(screen.getByRole('button', { name: '交互偏好' }));
  expect(screen.getByText('本地交互偏好')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '通知与订阅' }));
  expect(screen.getByText('本地通知与订阅')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '接入安全与清理' }));
  expect(screen.getByText('接入安全与本地清理')).toBeInTheDocument();
});

test('shows access tab content independently', () => {
  function Wrapper() {
    const [tab, setTab] = useState('access');

    return (
      <AppShellProvider
        value={{
          confirmSensitiveAction: jest.fn().mockResolvedValue(true),
          pushDesktopNotification: jest.fn(),
          pushToast: jest.fn(),
          requestDesktopNotificationPermission: jest.fn().mockResolvedValue('granted'),
          userSettings: createDefaultUserSettings(),
        }}
      >
        <SystemSettings activeTab={tab} onChangeTab={setTab} />
      </AppShellProvider>
    );
  }

  render(<Wrapper />);
  expect(screen.getByText('接入与认证状态')).toBeInTheDocument();
  expect(screen.queryByText('本地交互偏好')).not.toBeInTheDocument();
});
