import { useCallback } from 'react';
import { useSdkViewData } from './useSdkViewData';
import { getRuntimeSnapshot, loadRuntimeSnapshot } from '../sdk/api';

export function useRuntimeSnapshot() {
  const loader = useCallback(() => loadRuntimeSnapshot(), []);
  const state = useSdkViewData(loader);

  return {
    ...state,
    runtime: state.data || getRuntimeSnapshot(),
  };
}
