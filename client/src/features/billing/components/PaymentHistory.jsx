import React from 'react';
import { ArrowUpRight, RotateCcw, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatVnd, paymentMethodLabel } from '../lib/format';

/**
 * UC13 - Lich su payment + refund (chua sap xep theo hoa don).
 */
export default function PaymentHistory({ payments = [], onPrintReceipt }) {
  if (!payments.length) {
    return <div className="text-sm text-slate-500 italic">Chưa có giao dịch nào.</div>;
  }
  const sorted = [...payments].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {sorted.map((p) => {
        const isRefund = p.type === 'refund';
        return (
          <li key={p.id} className="flex items-start gap-3 px-3 py-2">
            <div className={`mt-0.5 rounded-full p-2 ${isRefund ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isRefund ? <RotateCcw className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs text-slate-700">{p.code}</div>
                <div className={`tabular-nums font-semibold ${isRefund ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isRefund ? '-' : '+'}
                  {formatVnd(p.amount)}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {paymentMethodLabel(p.method)} · {formatDateTime(p.paid_at)}
                {p.reference_code ? ` · Ref ${p.reference_code}` : ''}
              </div>
              {p.note ? <div className="text-xs text-slate-500 mt-0.5">{p.note}</div> : null}
            </div>
            {!isRefund && onPrintReceipt && (
              <Button size="sm" variant="ghost" onClick={() => onPrintReceipt(p)}>
                <Receipt className="h-4 w-4" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
