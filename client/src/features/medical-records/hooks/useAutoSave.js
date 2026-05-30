import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * UC12 - Auto-save voi debounce 30s.
 *
 * Goi `markDirty(values)` khi user thay doi form. Sau intervalMs khong co
 * thay doi moi -> trigger `saveFn(values)`. Co the goi `flush()` de force
 * save ngay (vd: truoc khi unmount).
 */
export default function useAutoSave({ saveFn, intervalMs = 30000, enabled = true }) {
  const [pending, setPending] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const valuesRef = useRef(null);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const dirtyRef = useRef(false);

  const performSave = useCallback(async () => {
    if (!enabled || inFlightRef.current) return;
    if (!dirtyRef.current) return;
    const values = valuesRef.current;
    if (!values) return;
    inFlightRef.current = true;
    setPending(true);
    setError(null);
    try {
      await saveFn(values);
      setLastSavedAt(new Date());
      dirtyRef.current = false;
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Khong the tu dong luu.');
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }, [enabled, saveFn]);

  const markDirty = useCallback((values) => {
    valuesRef.current = values;
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;
    timerRef.current = setTimeout(performSave, intervalMs);
  }, [enabled, intervalMs, performSave]);

  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await performSave();
  }, [performSave]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    markDirty,
    flush,
    pending,
    lastSavedAt,
    error,
    isDirty: () => dirtyRef.current,
  };
}
