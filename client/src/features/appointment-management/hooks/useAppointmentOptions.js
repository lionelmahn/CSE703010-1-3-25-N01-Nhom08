import { useCallback, useEffect, useState } from 'react';
import { appointmentApi } from '@/api/appointmentApi';

/**
 * UC7 - Hook lay options dung cho filter va form (patients, branches,
 * sources, time_slots, statuses).
 */
export const useAppointmentOptions = (patientQuery = '') => {
  const [data, setData] = useState({
    patients: [],
    branches: [],
    sources: [],
    time_slots: [],
    statuses: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentApi.options(q ? { patient_q: q } : {});
      setData({
        patients: res.patients || [],
        branches: res.branches || [],
        sources: res.sources || [],
        time_slots: res.time_slots || [],
        statuses: res.statuses || [],
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Khong the tai du lieu hau can');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(patientQuery);
  }, [patientQuery, load]);

  return { ...data, loading, error, reload: () => load(patientQuery) };
};

export default useAppointmentOptions;
