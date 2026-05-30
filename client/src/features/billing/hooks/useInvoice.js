import { useCallback, useEffect, useRef, useState } from 'react';
import { billingApi } from '@/api/billingApi';

/**
 * UC13 - Hook tai chi tiet 1 hoa don.
 */
export default function useInvoice(invoiceId) {
  const [invoice, setInvoice] = useState(null);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!invoiceId) {
      setInvoice(null);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await billingApi.show(invoiceId);
      if (id !== reqId.current) return;
      setInvoice(res?.data?.invoice || null);
      setMeta({ amount_in_words: res?.data?.amount_in_words });
    } catch (err) {
      if (id !== reqId.current) return;
      setError(err?.response?.data?.message || err?.message || 'Khong the tai hoa don.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { invoice, meta, loading, error, refresh, setInvoice };
}
