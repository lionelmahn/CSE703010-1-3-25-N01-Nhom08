import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { receptionApi } from '@/api/receptionApi';
import { RECEPTION_QUEUE_REFRESH_MS } from '../constants';

const DEFAULT_QUEUE = {
  buckets: { unassigned: [], waiting: [], ready: [], in_progress: [] },
  summary: { total_active: 0, unassigned: 0, waiting: 0, ready: 0, in_progress: 0 },
  avg_wait_min: 0,
};

/**
 * UC11 - Fetch + poll hang cho. `15s` polling theo UI11 spec ("dashboard").
 *
 * @param {{ branchId?:string, doctorId?:number|null, pollMs?:number }} opts
 */
export const useReceptionQueue = ({ branchId = 'all', doctorId = null, pollMs = RECEPTION_QUEUE_REFRESH_MS } = {}) => {
  const [data, setData] = useState(DEFAULT_QUEUE);
  const [stats, setStats] = useState({ kpi: {}, overdue: [], alerts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const params = useMemo(() => {
    const out = {};
    if (branchId && branchId !== 'all') out.branch_id = branchId;
    if (doctorId) out.doctor_id = doctorId;
    return out;
  }, [branchId, doctorId]);

  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const [queue, statsRes] = await Promise.all([
        receptionApi.queue(params),
        receptionApi.queueStats(params),
      ]);
      if (id !== reqId.current) return;
      setData(queue || DEFAULT_QUEUE);
      setStats(statsRes || { kpi: {}, overdue: [], alerts: [] });
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai hang cho.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const timer = setInterval(refresh, pollMs);
    return () => clearInterval(timer);
  }, [refresh, pollMs]);

  return { data, stats, loading, error, refresh };
};

export default useReceptionQueue;
