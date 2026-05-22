import { useCallback, useEffect, useRef, useState } from 'react';

import { patientsApi } from '@/api/patientsApi';

/**
 * UC5 - load chi tiet ho so benh nhan + history.
 *
 * Khi `patientId` thay doi, tu dong fetch lai.
 */
export const usePatientDetail = (patientId) => {
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  const reqId = useRef(0);
  const historyReqId = useRef(0);

  const fetchPatient = useCallback(async (id) => {
    if (!id) {
      setPatient(null);
      return null;
    }
    setLoading(true);
    setError(null);
    const ticket = ++reqId.current;
    try {
      const data = await patientsApi.show(id);
      if (ticket !== reqId.current) return null;
      setPatient(data);
      return data;
    } catch (caught) {
      if (ticket !== reqId.current) return null;
      setError(caught?.response?.data?.message || caught?.message || 'Không thể tải hồ sơ.');
      setPatient(null);
      return null;
    } finally {
      if (ticket === reqId.current) setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (id) => {
    if (!id) {
      setHistory([]);
      return [];
    }
    setHistoryLoading(true);
    const ticket = ++historyReqId.current;
    try {
      const data = await patientsApi.history(id);
      if (ticket !== historyReqId.current) return [];
      setHistory(data);
      return data;
    } catch (caught) {
      if (ticket !== historyReqId.current) return [];
      console.warn('Failed to load patient history', caught);
      setHistory([]);
      return [];
    } finally {
      if (ticket === historyReqId.current) setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!patientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatient(null);
      setHistory([]);
      setError(null);
      return;
    }
    fetchPatient(patientId);
    fetchHistory(patientId);
  }, [patientId, fetchPatient, fetchHistory]);

  const refresh = useCallback(async () => {
    if (!patientId) return null;
    const [data] = await Promise.all([fetchPatient(patientId), fetchHistory(patientId)]);
    return data;
  }, [patientId, fetchPatient, fetchHistory]);

  return {
    patient,
    history,
    loading,
    historyLoading,
    error,
    refresh,
  };
};
