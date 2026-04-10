export const USER_SETTINGS_STORAGE_KEY = 'qeeshu_ruisi_user_settings_v1';
export const USER_SETTINGS_UPDATED_EVENT = 'qeeshu:local-user-settings-updated';

export function createDefaultUserSettings() {
  return {
    profile: {
      displayName: '',
      avatarLabel: '企',
      avatarImage: '',
      email: '',
      title: '',
    },
    general: {
      language: '简体中文 (zh-CN)',
      tone: '严谨专业 (适合直接用于正式交付件)',
      theme: '浅色',
    },
    notifications: {
      dailyBrief: true,
      assetComplete: true,
      healthAlert: true,
      frameworkUpdate: false,
    },
    security: {
      passwordUpdatedAt: '未记录',
      twoFactorEnabled: false,
      deactivationRequested: false,
    },
  };
}

function normalizeUserSettings(rawValue) {
  const defaults = createDefaultUserSettings();
  if (!rawValue || typeof rawValue !== 'object') {
    return defaults;
  }

  return {
    profile: {
      ...defaults.profile,
      ...(rawValue.profile || {}),
    },
    general: {
      ...defaults.general,
      ...(rawValue.general || {}),
    },
    notifications: {
      ...defaults.notifications,
      ...(rawValue.notifications || {}),
    },
    security: {
      ...defaults.security,
      ...(rawValue.security || {}),
    },
  };
}

export function readUserSettings() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultUserSettings();
  }

  try {
    const raw = window.localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
    return normalizeUserSettings(raw ? JSON.parse(raw) : null);
  } catch (error) {
    return createDefaultUserSettings();
  }
}

function emitUserSettingsUpdated(payload) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(USER_SETTINGS_UPDATED_EVENT, { detail: payload }));
}

export function writeUserSettings(payload) {
  const normalized = normalizeUserSettings(payload);

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  }

  emitUserSettingsUpdated(normalized);
  return normalized;
}

export function clearUserSettings() {
  const defaults = createDefaultUserSettings();

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(USER_SETTINGS_STORAGE_KEY);
  }

  emitUserSettingsUpdated(defaults);
  return defaults;
}
