import { useEffect, useState } from 'react';
import { mockListRequests } from '../mockStore';

/**
 * Hook tra ve so yeu cau dang Cho xu ly + Dang xu ly (cho sidebar badge).
 * - Refresh khi mounted, khi storage thay doi tu tab khac, va moi 30s.
 * - Khong block render neu mock store loi.
 */
export const usePendingRequestCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const compute = () => {
      try {
        const result = mockListRequests({ per_page: 1, page: 1 });
        const counts = result?.counts || {};
        setCount((counts.cho_xu_ly || 0) + (counts.dang_xu_ly || 0));
      } catch {
        setCount(0);
      }
    };
     
    compute();
    const onStorage = (e) => {
      if (!e?.key || e.key === 'dental_pro_uc62_store_v1') compute();
    };
    window.addEventListener('storage', onStorage);
    const id = setInterval(compute, 30000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, []);

  return count;
};
