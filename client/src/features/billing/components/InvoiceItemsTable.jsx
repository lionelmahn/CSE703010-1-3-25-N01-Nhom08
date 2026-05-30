import React from 'react';
import { formatVnd } from '../lib/format';

/**
 * UC13 - Bang danh sach dich vu trong hoa don (snapshot).
 */
export default function InvoiceItemsTable({ items = [] }) {
  if (!items.length) {
    return <div className="text-sm text-slate-500 italic">Chưa có dịch vụ nào.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">Mã DV</th>
            <th className="px-3 py-2">Tên dịch vụ</th>
            <th className="px-3 py-2">Răng</th>
            <th className="px-3 py-2 text-right">Đơn giá</th>
            <th className="px-3 py-2 text-right">SL</th>
            <th className="px-3 py-2 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => {
            const teeth = Array.isArray(row.tooth_codes) ? row.tooth_codes : [];
            return (
              <tr key={row.id}>
                <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.service_code_snapshot}</td>
                <td className="px-3 py-2 text-slate-900">{row.service_name_snapshot}</td>
                <td className="px-3 py-2 text-slate-700">{teeth.length ? teeth.join(', ') : '—'}</td>
                <td className="px-3 py-2 text-right text-slate-700 tabular-nums">{formatVnd(row.unit_price_snapshot)}</td>
                <td className="px-3 py-2 text-right text-slate-700 tabular-nums">{row.quantity}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900 tabular-nums">{formatVnd(row.line_total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
