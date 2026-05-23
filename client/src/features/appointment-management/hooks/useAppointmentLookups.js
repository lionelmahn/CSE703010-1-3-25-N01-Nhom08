import { useEffect, useState } from 'react';
import { serviceCatalogApi } from '@/api/serviceCatalogApi';
import axiosClient from '@/api/axiosClient';

/**
 * UC7 + UC8 - Map id -> name cho branches va services de tranh in raw id ra UI.
 *
 * Cache o module-level (single-flight) de tat ca dialog/page dung chung 1 lan fetch.
 *
 * Branches fetch tu /api/branches (tra ve id = integer DB id, match voi appointment.branch_id).
 * Khong dung /api/appointments/options vi BE rewrite id = code khien lookup mismatch.
 */
let cache = null;
let inflight = null;

const fetchLookups = async () => {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const [brResp, svcResp] = await Promise.all([
      axiosClient.get('/branches').catch(() => ({ data: [] })),
      serviceCatalogApi.list({ per_page: 999 }).catch(() => ({})),
    ]);

    const branches = Array.isArray(brResp?.data)
      ? brResp.data
      : Array.isArray(brResp?.data?.data)
        ? brResp.data.data
        : [];

    const services = Array.isArray(svcResp?.data)
      ? svcResp.data
      : Array.isArray(svcResp?.data?.data)
        ? svcResp.data.data
        : Array.isArray(svcResp?.items)
          ? svcResp.items
          : [];

    cache = {
      branches,
      services,
    };
    return cache;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
};

const matches = (item, key) => {
  if (item == null || key == null) return false;
  const k = String(key);
  return (
    String(item.id) === k
    || String(item.code) === k
    || String(item.service_code) === k
  );
};

export const getBranchName = (branches, key) => {
  if (!key) return '';
  const found = (branches || []).find((b) => matches(b, key));
  return found?.label || found?.name || '';
};

export const getServiceName = (services, key) => {
  if (key == null || key === '') return '';
  const found = (services || []).find((s) => matches(s, key));
  return found?.name || '';
};

const toIdArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const getServiceNames = (services, ids) =>
  toIdArray(ids)
    .map((id) => getServiceName(services, id))
    .filter(Boolean);

/**
 * Hook: tra ve { branches, services, getBranchName, getServiceNames, loading }.
 * Khong reload khi component unmount/mount lai vi cache module.
 */
export const useAppointmentLookups = () => {
  const [data, setData] = useState(cache || { branches: [], services: [] });
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    if (cache) return () => { alive = false; };
    fetchLookups()
      .then((res) => { if (alive) setData(res); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return {
    branches: data.branches,
    services: data.services,
    getBranchName: (key) => getBranchName(data.branches, key),
    getServiceName: (key) => getServiceName(data.services, key),
    getServiceNames: (ids) => getServiceNames(data.services, ids),
    loading,
  };
};

export default useAppointmentLookups;
