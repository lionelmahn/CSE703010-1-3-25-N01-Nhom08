import { useCallback, useEffect, useState } from 'react';
import { medicalRecordsApi } from '@/api/medicalRecordsApi';

/**
 * UC12 - Search service catalog cho treatment plan picker.
 */
export default function useServiceCatalog() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const res = await medicalRecordsApi.serviceCatalog({ q: query || '' });
      setItems(res?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Khong the tai danh sach dich vu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search('');
  }, [search]);

  return { items, q, setQ, loading, error, search };
}
