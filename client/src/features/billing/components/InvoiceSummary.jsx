import React from 'react';
import { formatVnd } from '../lib/format';

const Row = ({ label, value, tone = 'neutral', strong = false }) => (
  <div className={`flex items-center justify-between text-sm ${strong ? 'pt-2 mt-2 border-t border-slate-200' : ''}`}>
    <span className={tone === 'muted' ? 'text-slate-500' : 'text-slate-700'}>{label}</span>
    <span
      className={`tabular-nums ${strong ? 'font-bold text-lg' : 'font-medium'} ${
        tone === 'negative' ? 'text-rose-600' : tone === 'positive' ? 'text-emerald-600' : 'text-slate-900'
      }`}
    >
      {value}
    </span>
  </div>
);

/**
 * UC13 - Khoi tong ket hoa don (subtotal, discount, surcharge, total, paid, due).
 */
export default function InvoiceSummary({ invoice, meta = {} }) {
  if (!invoice) return null;
  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount_amount || 0);
  const surcharge = Number(invoice.surcharge_amount || 0);
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.amount_paid || 0);
  const due = Number(invoice.amount_due || 0);

  const positiveAdj = (invoice.adjustments || [])
    .filter((a) => a.type === 'positive')
    .reduce((s, a) => s + Number(a.amount || 0), 0);
  const negativeAdj = (invoice.adjustments || [])
    .filter((a) => a.type === 'negative')
    .reduce((s, a) => s + Number(a.amount || 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
      <Row label="Tạm tính" value={formatVnd(subtotal)} />
      {discount > 0 && <Row label={`Giảm giá${invoice.discount_reason ? ' · ' + invoice.discount_reason : ''}`} value={`- ${formatVnd(discount)}`} tone="negative" />}
      {surcharge > 0 && <Row label={`Phụ thu${invoice.surcharge_reason ? ' · ' + invoice.surcharge_reason : ''}`} value={`+ ${formatVnd(surcharge)}`} tone="positive" />}
      {positiveAdj > 0 && <Row label="Điều chỉnh (tăng)" value={`+ ${formatVnd(positiveAdj)}`} tone="positive" />}
      {negativeAdj > 0 && <Row label="Điều chỉnh (giảm)" value={`- ${formatVnd(negativeAdj)}`} tone="negative" />}
      <Row label="Tổng tiền" value={formatVnd(total)} strong />
      {meta?.amount_in_words ? (
        <div className="text-xs text-slate-500 italic pt-1">{meta.amount_in_words}</div>
      ) : null}
      <Row label="Đã thanh toán" value={formatVnd(paid)} tone="muted" />
      <Row label="Còn phải trả" value={formatVnd(due)} tone="negative" strong={due > 0} />
    </div>
  );
}
