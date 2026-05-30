import React from 'react';
import { Activity } from 'lucide-react';
import { formatDateTime } from '../lib/format';

const ACTION_LABEL = {
  'invoice.create': 'Tạo hóa đơn',
  'invoice.discount.apply': 'Áp dụng giảm giá',
  'invoice.surcharge.apply': 'Áp dụng phụ thu',
  'invoice.adjust': 'Điều chỉnh hóa đơn',
  'invoice.cancel': 'Hủy hóa đơn',
  'payment.create': 'Ghi nhận thanh toán',
  'payment.refund': 'Hoàn tiền',
};

/**
 * UC13 - Timeline audit log (chi nhung action thuoc UC13).
 */
export default function AuditTimeline({ items = [] }) {
  if (!items.length) {
    return <div className="text-sm text-slate-500 italic">Chưa có hoạt động nào.</div>;
  }

  return (
    <ol className="space-y-3">
      {items.map((entry) => {
        const meta = entry.metadata || {};
        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900">
                {ACTION_LABEL[entry.action] || entry.action}
              </div>
              <div className="text-xs text-slate-500">
                {entry.actor_name || 'Hệ thống'} · {formatDateTime(entry.created_at)}
                {meta.invoice_code ? ` · ${meta.invoice_code}` : ''}
                {meta.amount ? ` · ${Intl.NumberFormat('vi-VN').format(Math.round(meta.amount))} ₫` : ''}
              </div>
              {meta.reason ? <div className="text-xs text-slate-500 mt-0.5">Lý do: {meta.reason}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
