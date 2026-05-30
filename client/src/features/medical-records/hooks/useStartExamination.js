import { useCallback, useState } from 'react';
import { medicalRecordsApi } from '@/api/medicalRecordsApi';

/**
 * UC12 - POST /api/examinations/start.
 *
 * Tu Reception (UC11) bac si bam "Bat dau kham" -> goi hook nay voi
 * appointment_id -> nhan ve examination_session vua tao -> redirect sang
 * workspace.
 */
export default function useStartExamination() {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async (appointmentId) => {
    setStarting(true);
    setError(null);
    try {
      const data = await medicalRecordsApi.start(appointmentId);
      return data?.data;
    } catch (err) {
      const msg = err?.response?.data?.message
        || Object.values(err?.response?.data?.errors || {})[0]?.[0]
        || err?.message
        || 'Khong the bat dau phien kham.';
      setError(msg);
      throw err;
    } finally {
      setStarting(false);
    }
  }, []);

  return { start, starting, error };
}
