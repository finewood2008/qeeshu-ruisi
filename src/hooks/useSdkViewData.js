import { useEffect, useState } from 'react';
import { qeeclawRuntime, shouldPreferLiveData } from '../sdk/runtime';
import { normalizeSdkError } from '../sdk/error-utils';

function normalizeError(error) {
  return normalizeSdkError(error, {
    hasCredentials: qeeclawRuntime.hasCredentials,
    defaultMessage: 'QeeClaw SDK 请求失败',
  });
}

function resolveSource(allowOfflineLoad, offlineSource) {
  if (shouldPreferLiveData()) {
    return qeeclawRuntime.resolvedMode;
  }
  if (allowOfflineLoad) {
    return offlineSource;
  }
  return 'unconfigured';
}

export function useSdkViewData(loader, options = {}) {
  const allowOfflineLoad = options.allowOfflineLoad === true;
  const offlineSource = options.offlineSource || 'browser';
  const initialSource = resolveSource(allowOfflineLoad, offlineSource);
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: shouldPreferLiveData() || allowOfflineLoad,
    source: initialSource,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!shouldPreferLiveData() && !allowOfflineLoad) {
        setState({
          data: null,
          error: null,
          loading: false,
          source: 'unconfigured',
        });
        return;
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
        source: resolveSource(allowOfflineLoad, offlineSource),
      }));

      try {
        const data = await loader();
        if (cancelled) {
          return;
        }
        setState({
          data,
          error: null,
          loading: false,
          source: resolveSource(allowOfflineLoad, offlineSource),
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const normalizedError = normalizeError(error);
        if (qeeclawRuntime.mode === 'sdk' || qeeclawRuntime.resolvedMode === 'local' || allowOfflineLoad) {
          setState({
            data: null,
            error: normalizedError,
            loading: false,
            source: resolveSource(allowOfflineLoad, offlineSource),
          });
          return;
        }

        setState({
          data: null,
          error: normalizedError,
          loading: false,
          source: 'unconfigured',
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [allowOfflineLoad, loader, offlineSource]);

  return state;
}
