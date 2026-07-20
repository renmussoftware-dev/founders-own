import { useCallback, useEffect, useState } from 'react';
import { getRcCredentials } from '@/integrations/rcCredentials';
import { getOverview } from '@/integrations/revenuecat';
import { useStore } from '@/store/useStore';

/**
 * Loads the founder's RevenueCat connection from secure storage and fetches
 * live overview metrics. Safe to call from any screen; state is cached in the
 * store so repeated mounts don't refetch until refresh() is called.
 */
export function useRevenueData() {
  const connected = useStore(s => s.rcConnected);
  const projectName = useStore(s => s.rcProjectName);
  const overview = useStore(s => s.rcOverview);
  const setRcConnection = useStore(s => s.setRcConnection);
  const setRcOverview = useStore(s => s.setRcOverview);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cred = await getRcCredentials();
    if (!cred) {
      // No stored key. Don't clobber an already-loaded overview (e.g. the dev
      // sample); only mark disconnected on a truly empty state.
      const current = useStore.getState().rcOverview;
      if (!current) setRcConnection({ connected: false, projectName: null });
      return current;
    }
    setRcConnection({ connected: true, projectName: cred.projectName });
    setLoading(true);
    setError(null);
    try {
      const ov = await getOverview(cred.apiKey, cred.projectId);
      setRcOverview(ov);
      return ov;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load RevenueCat metrics.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setRcConnection, setRcOverview]);

  useEffect(() => {
    // Fetch once per mount when nothing is cached yet.
    if (!overview) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, projectName, overview, loading, error, refresh };
}
