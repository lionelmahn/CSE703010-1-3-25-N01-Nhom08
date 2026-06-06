import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { serviceComplexityApi } from '@/api/serviceComplexityApi';
import { extractApiError, formatCoefficient, formatDateTime } from '../utils';

const ACTION_LABELS = {
  'service_complexity.created': 'Tạo cấu hình',
  'service_complexity.superseded': 'Cập nhật phiên bản cũ',
  'service_complexity.stopped': 'Ngừng áp dụng',
  'service_complexity.default_used': 'Fallback +0.00',
};

const actionLabel = (action) => ACTION_LABELS[action] || action;

const AuditLogDrawer = ({ open, coefficient, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: 'all', actor: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !coefficient?.id) return;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await serviceComplexityApi.auditLogs(coefficient.id, filters);
        setLogs(data || []);
      } catch (err) {
        setError(extractApiError(err, 'Không tải được audit log.'));
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [coefficient?.id, filters, open]);

  if (!open || !coefficient) return null;

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <section className="h-full w-full max-w-[760px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
          <h3 className="text-[14px] font-extrabold text-slate-950">Audit log - {coefficient.code}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5 text-[12px]">
          <div className="grid gap-2 md:grid-cols-4">
            <select
              value={filters.action}
              onChange={(event) => updateFilter('action', event.target.value)}
              className="h-9 rounded-md border border-slate-200 px-2"
            >
              <option value="all">Tất cả hành động</option>
              {Object.entries(ACTION_LABELS).map(([action, label]) => (
                <option key={action} value={action}>{label}</option>
              ))}
            </select>
            <input
              value={filters.actor}
              onChange={(event) => updateFilter('actor', event.target.value)}
              placeholder="Người thao tác"
              className="h-9 rounded-md border border-slate-200 px-2"
            />
            <input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className="h-9 rounded-md border border-slate-200 px-2" />
            <input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className="h-9 rounded-md border border-slate-200 px-2" />
          </div>

          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</div> : null}

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-[680px] w-full text-[11px]">
              <thead className="bg-slate-50 text-left uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Thời gian</th>
                  <th className="px-3 py-2">Người dùng</th>
                  <th className="px-3 py-2">Hành động</th>
                  <th className="px-3 py-2">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Đang tải...</td></tr> : null}
                {!loading && logs.length === 0 ? <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Chưa có audit log.</td></tr> : null}
                {!loading && logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2">{formatDateTime(log.created_at)}</td>
                    <td className="px-3 py-2">{log.actor_name || 'System'}</td>
                    <td className="px-3 py-2 font-semibold">{actionLabel(log.action)}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {log.details?.coefficient !== undefined
                        ? `+${formatCoefficient(log.details.coefficient)}`
                        : log.details?.reason || log.details?.new_effective_to || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuditLogDrawer;
