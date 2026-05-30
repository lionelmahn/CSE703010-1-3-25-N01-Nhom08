import { useCallback, useEffect, useState } from 'react';
import { medicalRecordsApi } from '@/api/medicalRecordsApi';

/**
 * UC12 - Fetch + cache 1 phien kham theo id. Tu cap nhat luc save thanh cong.
 */
export default function useExaminationSession(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOnce = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await medicalRecordsApi.show(id);
      setData(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Khong the tai phien kham.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOnce();
  }, [fetchOnce]);

  return {
    session: data,
    setSession: setData,
    loading,
    error,
    refresh: fetchOnce,
  };
}
