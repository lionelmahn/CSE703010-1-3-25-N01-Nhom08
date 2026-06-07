import React, { useCallback, useEffect, useState } from 'react';
import { History, AlertCircle } from 'lucide-react';
import { salarySlipApi } from '@/api/salarySlipApi';
import { SLIP_AUDIT_ACTION_LABEL, formatDateTime, formatVnd } from '../utils';

const summarize = (details) => {
  if (!details || typeof details !== 'object') return '';
  if (details.total_amount !== undefined) return `Tổng lương: ${formatVnd(details.total_amount)}`;
  return '';
};

const SalarySlipAuditTimeline = ({ slipId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!slipId) return;
    setLoading(true);
    try {
      const { data } = await salarySlipApi.auditLogs(slipId);
      setLogs(data?.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [slipId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-[12px] text-slate-500">
        <AlertCircle className="h-7 w-7 text-slate-300" />
        Chưa có lịch sử thao tác.
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200" />
      <ul className="space-y-4">
        {logs.map((log) => (
          <li key={log.id} className="relative">
            <span className="absolute -left-[22px] top-1 grid h-4 w-4 place-items-center rounded-full border border-blue-500 bg-white">
              <History size={9} className="text-blue-500" />
            </span>
            <p className="text-[11px] text-slate-400">{formatDateTime(log.created_at)}</p>
            <p className="text-[12px] font-semibold text-slate-900">
              {SLIP_AUDIT_ACTION_LABEL[log.action] || log.action}
            </p>
            <p className="text-[11px] text-slate-500">
              {log.actor_name || 'Hệ thống'}
              {summarize(log.details) ? ` · ${summarize(log.details)}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalarySlipAuditTimeline;
