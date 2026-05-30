import { useEffect, useState } from 'react';
import { medicalRecordsApi } from '@/api/medicalRecordsApi';

/**
 * UC12 - Lay options (processing levels, status, coefficients) tu BE.
 */
export default function useExaminationOptions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await medicalRecordsApi.options();
        if (!cancel) setData(res?.data || null);
      } catch {
        if (!cancel) setData(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  return { options: data, loading };
}
