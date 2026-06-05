import React, { useCallback, useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { hourlyRateApi } from '@/api/hourlyRateApi';
import { ACTION_LABEL, STATUS_LABEL, formatDateTime, formatVnd, versionLabel } from '../utils';

const inputClass =
  'mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500';

const AuditLogDrawer = ({ open, rate, rates = [], onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: 'all', actor: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!rate?.id) return;
    setLoading(true);
    try {
      const { data } = await hourlyRateApi.auditLogs(rate.id, filters);
      setLogs(data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, rate]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [open, fetchLogs]);

  if (!open) return null;

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <aside className="h-full w-full max-w-5xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-950">
              Lịch sử thay đổi - {rate ? `${versionLabel(rates, rate)} (${STATUS_LABEL[rate.status] || rate.status})` : 'Mức tiền/giờ'}
            </h3>
            <p className="mt-1 text-[12px] text-slate-500">
              Theo dõi thao tác tạo, tự động kết thúc và ngừng áp dụng phiên bản.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-5 text-[12px]">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <label>
              Hành động
              <select value={filters.action} onChange={(event) => setFilter('action', event.target.value)} className={inputClass}>
                <option value="all">Tất cả</option>
                <option value="hourly_rate.created">Tạo phiên bản</option>
                <option value="hourly_rate.stopped">Ngừng áp dụng</option>
                <option value="hourly_rate.superseded">Kết thúc phiên bản cũ</option>
              </select>
            </label>
            <label>
              Người dùng
              <input
                value={filters.actor}
                onChange={(event) => setFilter('actor', event.target.value)}
                className={inputClass}
                placeholder="Tên người thao tác"
              />
            </label>
            <label>
              Từ ngày
              <input type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} className={inputClass} />
            </label>
            <label>
              Đến ngày
              <input type="date" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} className={inputClass} />
            </label>
            <button
              type="button"
              onClick={fetchLogs}
              className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-[12px] font-semibold text-white hover:bg-slate-800"
            >
              <Filter size={13} /> Lọc
            </button>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="min-w-full text-left text-[12px]">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.06em] text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-3 font-extrabold">Thời gian</th>
                  <th className="px-3 py-3 font-extrabold">Người dùng</th>
                  <th className="px-3 py-3 font-extrabold">Hành động</th>
                  <th className="px-3 py-3 font-extrabold">Chi tiết</th>
                  <th className="px-3 py-3 font-extrabold">Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      Đang tải lịch sử thay đổi...
                    </td>
                  </tr>
                ) : logs.length ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-3 py-3">{formatDateTime(log.created_at)}</td>
                      <td className="px-3 py-3">{log.actor_name || '-'}</td>
                      <td className="px-3 py-3">{ACTION_LABEL[log.action] || log.action}</td>
                      <td className="px-3 py-3">
                        {log.details?.hourly_rate
                          ? `Tạo phiên bản - ${formatVnd(log.details.hourly_rate)}`
                          : log.details?.new_effective_to
                            ? `Kết thúc hiệu lực: ${log.details.new_effective_to}`
                            : log.details?.reason_detail || log.details?.reason || '-'}
                      </td>
                      <td className="px-3 py-3 text-slate-500">-</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      Chưa có lịch sử thay đổi phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-9 min-w-[120px] rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AuditLogDrawer;
