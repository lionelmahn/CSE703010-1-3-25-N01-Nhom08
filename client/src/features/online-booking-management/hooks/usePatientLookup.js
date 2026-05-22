import { useEffect, useRef, useState } from 'react';
import { patientsApi } from '@/api/patientsApi';

/**
 * Hook tim ho so benh nhan trung khop (theo phone, email, name).
 * Tu dong chay khi cac key thay doi (debounce 250ms).
 *
 * `refreshToken` cho phep caller buoc hook re-fetch ke ca khi phone/email/name
 * khong doi - vd. sau khi UC6.2 vua tao moi ho so qua create-patient, danh
 * sach lookup phai cap nhat ho so moi mac du SDT/email cua yeu cau khong doi.
 *
 * Tra ve danh sach ho so kha kha + loading.
 */
export const usePatientLookup = ({ phone, email, name, refreshToken } = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const hasInput = !!(phone || email || name);
    if (!hasInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
       
      setLoading(false);
      return undefined;
    }
    const id = ++reqId.current;
     
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await patientsApi.lookup({ phone, email, name });
        if (id !== reqId.current) return;
        setItems(Array.isArray(data) ? data : []);
      } catch {
        if (id !== reqId.current) return;
        setItems([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [phone, email, name, refreshToken]);

  return { items, loading };
};
