import React from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatDateTime, formatVnd, paymentMethodLabel } from '../lib/format';

/**
 * UC13 - Drawer hien thi phieu thu (in 80mm). Dung window.print()
 * voi CSS @page voi class .print-area.
 */
export default function ReceiptDrawer({ open, onOpenChange, payload }) {
  if (!open || !payload) return null;
  const { invoice, payment, items = [], meta = {}, kind = 'payment' } = payload;
  const isReceipt = kind === 'payment';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="font-semibold text-slate-800">
            {isReceipt ? 'Phiếu thu' : 'Hóa đơn'}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="gap-1" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> In
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange?.(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="print-area px-4 py-5 text-sm text-slate-800 space-y-2 font-mono">
          <div className="text-center font-bold text-base">
            {isReceipt ? 'PHIẾU THU' : 'HÓA ĐƠN DỊCH VỤ'}
          </div>
          <div className="text-center text-xs text-slate-500">Phòng khám nha khoa</div>

          <div className="mt-3 space-y-1">
            {isReceipt ? (
              <>
                <div>Mã PT: <span className="font-bold">{payment?.code}</span></div>
                <div>Mã HĐ: {invoice?.code}</div>
              </>
            ) : (
              <div>Mã HĐ: <span className="font-bold">{invoice?.code}</span></div>
            )}
            <div>Bệnh nhân: {invoice?.patient_name_snapshot}</div>
            {invoice?.patient_phone_snapshot ? <div>SĐT: {invoice.patient_phone_snapshot}</div> : null}
            <div>Ngày: {formatDateTime(payment?.paid_at || invoice?.exam_date || new Date())}</div>
          </div>

          {!isReceipt && items.length > 0 && (
            <div className="mt-2 border-t border-dashed border-slate-300 pt-2 space-y-1">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between gap-2">
                  <div className="text-xs">
                    <div>{it.service_name_snapshot}</div>
                    <div className="text-slate-500">{it.quantity} x {formatVnd(it.unit_price_snapshot)}</div>
                  </div>
                  <div className="font-semibold tabular-nums">{formatVnd(it.line_total)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 border-t border-dashed border-slate-300 pt-2 space-y-1">
            {!isReceipt && (
              <>
                <div className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(invoice?.subtotal)}</span></div>
                {Number(invoice?.discount_amount) > 0 && (
                  <div className="flex justify-between"><span>Giảm</span><span>- {formatVnd(invoice?.discount_amount)}</span></div>
                )}
                {Number(invoice?.surcharge_amount) > 0 && (
                  <div className="flex justify-between"><span>Phụ thu</span><span>+ {formatVnd(invoice?.surcharge_amount)}</span></div>
                )}
              </>
            )}
            {isReceipt ? (
              <>
                <div className="flex justify-between">
                  <span>Phương thức</span>
                  <span>{paymentMethodLabel(payment?.method)}</span>
                </div>
                {payment?.reference_code ? (
                  <div className="flex justify-between"><span>Mã GD</span><span>{payment.reference_code}</span></div>
                ) : null}
                <div className="flex justify-between font-bold">
                  <span>Số tiền thu</span>
                  <span>{formatVnd(payment?.amount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span>{formatVnd(invoice?.total)}</span>
              </div>
            )}
          </div>

          {meta?.amount_in_words && !isReceipt ? (
            <div className="text-xs italic mt-2">Bằng chữ: {meta.amount_in_words}</div>
          ) : null}
          <div className="text-center text-xs text-slate-500 mt-3 italic">
            Cảm ơn quý khách!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
