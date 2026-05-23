import { useCallback, useEffect, useRef, useState } from 'react';
import { doctorApi } from '@/api/doctorApi';

/**
 * UC8 - Lich kha dung cua 1 bac si trong 1 ngay (work_schedule + appointments + leave).
 *
 * Dung de hien preview trong AssignDoctorDialog (cot 3) va dispatch timeline.
 */
export const useDoctorAvailability = (userId, date) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId || !date) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const res = await doctorApi.availability(userId, date);
      if (id !== reqId.current) return;
      setData(res || null);
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai lich bac si');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
};

export default useDoctorAvailability;
