import { useCallback, useEffect, useState } from 'react';
import { medicalRecordsApi } from '@/api/medicalRecordsApi';

/**
 * UC12 - Fetch + bulkUpsert tooth chart cho 1 phien kham.
 */
export default function useToothChart(examinationId) {
  const [entries, setEntries] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!examinationId) return;
    setLoading(true);
    setError(null);
    try {
      const [chart, stat] = await Promise.all([
        medicalRecordsApi.toothChart(examinationId),
        medicalRecordsApi.toothStatuses(),
      ]);
      setEntries(chart?.data || []);
      setStatuses(stat?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Khong the tai dental chart.');
    } finally {
      setLoading(false);
    }
  }, [examinationId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const upsert = useCallback(async (entry) => {
    if (!examinationId) return null;
    setSaving(true);
    try {
      const res = await medicalRecordsApi.upsertToothChart(examinationId, [entry]);
      setEntries(res?.data || []);
      return res?.data || [];
    } finally {
      setSaving(false);
    }
  }, [examinationId]);

  return { entries, statuses, loading, saving, error, refresh, upsert };
}
