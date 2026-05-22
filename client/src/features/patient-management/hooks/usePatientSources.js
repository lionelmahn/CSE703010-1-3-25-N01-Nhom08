import { useEffect, useState } from 'react';

import { patientsApi } from '@/api/patientsApi';

import { DEFAULT_SOURCES } from '../constants';

/**
 * UC5 - load danh sach nguon tiep nhan (cho filter va form).
 *
 * Backend tra ve hop nhat DEFAULT_SOURCES + nguon thuc te trong DB.
 */
export const usePatientSources = () => {
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await patientsApi.sources();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setSources(data);
        }
      } catch (caught) {
        console.warn('Failed to load patient sources', caught);
        if (!cancelled) setSources(DEFAULT_SOURCES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { sources, loading };
};
