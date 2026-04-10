function copyErrorMeta(target, source) {
  if (!source || typeof source !== 'object') {
    return target;
  }

  const metadataKeys = ['name', 'status', 'code', 'details'];
  metadataKeys.forEach((key) => {
    if (key in source) {
      target[key] = source[key];
    }
  });

  if (source instanceof Error && source.stack) {
    target.stack = source.stack;
  }

  return target;
}

function extractErrorText(error) {
  if (!error) {
    return '';
  }

  if (typeof error === 'string') {
    return error;
  }

  const segments = [];
  if (error instanceof Error && error.message) {
    segments.push(error.message);
  }

  if (typeof error === 'object') {
    const details = error.details;
    if (typeof details === 'string') {
      segments.push(details);
    } else if (details && typeof details === 'object') {
      const detailMessage = details.message || details.msg || details.detail;
      if (typeof detailMessage === 'string') {
        segments.push(detailMessage);
      }
      try {
        segments.push(JSON.stringify(details));
      } catch (jsonError) {
        // Ignore non-serializable details payloads.
      }
    }
  }

  return segments.join(' | ');
}

function createNormalizedError(message, source) {
  return copyErrorMeta(new Error(message), source);
}

export function normalizeSdkError(error, options = {}) {
  const {
    hasCredentials = false,
    context = 'general',
    defaultMessage = 'QeeClaw SDK 请求失败',
  } = options;

  const errorText = extractErrorText(error);

  if (/OpenClaw 连接已断开|与 OpenClaw 通信失败|本地 QeeClaw|未连接到平台/i.test(errorText)) {
    return createNormalizedError(
      '本地 QeeClaw / OpenClaw 当前未连接到平台。请先启动本地 QeeClaw，再刷新页面重试。',
      error,
    );
  }

  if (/API Key expired|Token expired or invalid, please login again|Missing Authorization header|Missing token/i.test(errorText)) {
    return createNormalizedError(
      '当前 API Key 无效、缺失或已过期。请检查系统设置中的 API Key 是否正确。',
      error,
    );
  }

  if (/User token expired or invalid|User account not found or inactive/i.test(errorText)) {
    if (hasCredentials && (context === 'workspace-context' || context === 'team-context')) {
      return createNormalizedError(
        '当前 API Key 已接入平台，但这个请求仍依赖用户登录态接口，暂时无法自动解析当前工作空间。请先启动本地 QeeClaw，或补充 API Key 可访问的工作空间上下文接口。',
        error,
      );
    }

    if (hasCredentials) {
      return createNormalizedError(
        '当前 API Key 已生效，但本页仍有接口只接受用户登录态，线上后端大概率还未发布完整的 API Key 鉴权兼容改动。',
        error,
      );
    }
  }

  if (/Failed to fetch|Load failed|NetworkError|fetch failed|Network request failed/i.test(errorText)) {
    return createNormalizedError(
      '无法连接到 QeeClaw Platform。请检查 baseUrl、网络连通性，以及网关 / CORS 配置。',
      error,
    );
  }

  if (/QeeClaw request timed out/i.test(errorText)) {
    if (context === 'knowledge-upload') {
      return createNormalizedError(
        '知识文件上传超时。通常是本地 QeeClaw 响应慢、平台上传接口处理时间过长，或当前文件较大。请稍后重试；如果持续出现，请检查本地 QeeClaw 是否稳定在线，以及平台 `/api/platform/knowledge/upload` 是否处理正常。',
        error,
      );
    }

    return createNormalizedError(
      'QeeClaw 请求超时。请检查本地 QeeClaw 与平台连接是否稳定后重试。',
      error,
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(defaultMessage);
}
