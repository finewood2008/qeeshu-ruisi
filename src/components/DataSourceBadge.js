import React from 'react';

export default function DataSourceBadge({
  source,
  error,
  className = '',
  variant = 'default',
  label,
  title,
}) {
  const isSdk = source === 'sdk';
  const isBrowser = source === 'browser';
  const isLocal = source === 'local' || isBrowser;
  const hasError = Boolean(error);
  const errorMessage = typeof error?.message === 'string' ? error.message : '';

  const wrapperClass = hasError
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : variant === 'hybrid'
      ? isLocal
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : 'bg-sky-50 text-sky-700 border-sky-200'
      : isSdk
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : isLocal
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  const dotClass = hasError
    ? 'bg-rose-500'
    : variant === 'hybrid'
      ? isLocal
        ? 'bg-indigo-500'
        : 'bg-sky-500'
      : isSdk
        ? 'bg-emerald-500'
        : isLocal
          ? 'bg-indigo-500'
        : 'bg-amber-500';

  const fallbackLabel = hasError
    ? isSdk
      ? 'QeeClaw SDK 接口受限'
      : isLocal
        ? isBrowser
          ? '浏览器本地数据异常'
          : '本地桌面数据异常'
        : 'SDK 请求失败'
    : variant === 'hybrid'
      ? isSdk
        ? 'QeeClaw SDK / 真实接入'
        : isLocal
          ? isBrowser
            ? '浏览器本地数据'
            : '本地桌面数据'
          : '未接入真实数据'
      : isSdk
        ? 'QeeClaw SDK 实时数据'
        : isLocal
          ? isBrowser
            ? '浏览器本地数据'
            : '本地桌面数据'
          : '未接入真实数据';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${wrapperClass} ${className}`.trim()}
      title={title || (hasError && errorMessage ? errorMessage : label || fallbackLabel)}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`}></span>
      <span>{label || fallbackLabel}</span>
    </div>
  );
}
