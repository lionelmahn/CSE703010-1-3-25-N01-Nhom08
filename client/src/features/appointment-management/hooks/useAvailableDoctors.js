import { useCallback, useEffect, useRef, useState } from 'react';
import { appointmentApi } from '@/api/appointmentApi';

/**
 * UC8 - Tai danh sach bac si ung vien cho 1 lich hen (kem fit_score + blockers).
 *
 * Phai truyen `appointmentId`. Khi id thay doi (null hoac doi appointment),
 * hook auto-refresh.
 */
export const useAvailableDoctors = (appointmentId) => {
  const [appointment, setAppointment] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!appointmentId) {
      setAppointment(null);
      setCandidates([]);
      return;
    }
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const data = await appointmentApi.availableDoctors(appointmentId);
      if (id !== reqId.current) return;
      setAppointment(data?.appointment ?? null);
      setCandidates(Array.isArray(data?.candidates) ? data.candidates : []);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai danh sach bac si');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { appointment, candidates, loading, error, refresh };
};

export default useAvailableDoctors;
