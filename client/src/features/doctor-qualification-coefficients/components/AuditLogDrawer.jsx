/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { doctorQualificationCoefficientApi } from '@/api/doctorQualificationCoefficientApi';
import { actionLabel, extractApiError, formatDateTime } from '../utils';

const AuditLogDrawer = ({ open, coefficient, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !coefficient?.id) return;
    let active = true;
    setLoading(true);
    setError('');
    doctorQualificationCoefficientApi.auditLogs(coefficient.id)
      .then(({ data }) => {
        if (active) setLogs(data || []);
      })
      .catch((err) => {
        if (active) setError(extractApiError(err, 'Không tải được audit log.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [coefficient?.id, open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[780px] gap-0 overflow-hidden rounded-xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase text-slate-950">
            Nhật ký thao tác
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(92vh-68px)] overflow-y-auto p-4 text-[12px]">
          {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div> : null}
          {loading ? <div className="py-8 text-center text-slate-500">Đang tải audit log...</div> : null}
          {!loading && logs.length === 0 ? <div className="py-8 text-center text-slate-500">Chưa có audit log.</div> : null}
          <div className="space-y-2">
            {logs.map((log) => (
              <article key={log.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-slate-950">{actionLabel(log.action)}</div>
                  <div className="text-[11px] text-slate-500">{formatDateTime(log.created_at)}</div>
                </div>
                <div className="mt-1 text-slate-600">Người thao tác: {log.actor_name || '-'}</div>
                <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-slate-50 p-2 text-[10px] text-slate-600">
                  {JSON.stringify(log.details || {}, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDrawer;
