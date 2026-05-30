import React from 'react';
import { ChevronRight, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import MoneyText from './MoneyText';
import { formatDateTime } from '../lib/format';

const Empty = ({ loading }) => (
  <div className="text-center py-12 text-slate-500 text-sm">
    {loading ? 'Đang tải hóa đơn...' : 'Không có hóa đơn nào ở tab này.'}
  </div>
);

/**
 * UC13 - Bang queue hoa don. Click row mo detail panel ben phai
 * (master-detail) hoac navigate /invoices/:id (fallback).
 */
export default function BillingQueueList({ items = [], selectedId, loading, onSelect }) {
  if (!items.length) return <Empty loading={loading} />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Mã HĐ</th>
            <th className="px-4 py-3">Bệnh nhân</th>
            <th className="px-4 py-3">Bác sĩ</th>
            <th className="px-4 py-3">Ngày khám</th>
            <th className="px-4 py-3 text-right">Tổng</th>
            <th className="px-4 py-3 text-right">Còn lại</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => {
            const isSelected = selectedId && Number(selectedId) === Number(row.id);
            return (
              <tr
                key={row.id}
                onClick={() => onSelect?.(row)}
                className={`cursor-pointer transition ${isSelected ? 'bg-sky-50/60' : 'hover:bg-slate-50'}`}
              >
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                  {row.code}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">
                    {row.patient_name_snapshot || row.patient?.full_name || '—'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.patient?.patient_code}
                    {row.patient_phone_snapshot ? ` · ${row.patient_phone_snapshot}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                    {row.doctor?.name || '—'}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{formatDateTime(row.exam_date)}</td>
                <td className="px-4 py-3 text-right">
                  <MoneyText value={row.total} className="font-semibold" />
                </td>
                <td className="px-4 py-3 text-right">
                  <MoneyText value={row.amount_due} className="font-semibold text-amber-700" />
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(row);
                    }}
                  >
                    Mở
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
