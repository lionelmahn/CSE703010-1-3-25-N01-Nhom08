import React, { useState } from 'react';
import {
  Printer, Wallet, RotateCcw, Ban, GitBranch, TrendingDown, TrendingUp, RefreshCw, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoiceSummary from './InvoiceSummary';
import PaymentHistory from './PaymentHistory';
import { formatDateTime, formatDate } from '../lib/format';

/**
 * UC13 - Panel chi tiet 1 hoa don (cot phai trong master-detail).
 *
 * Slots actions su dung permission cua user de show/hide.
 */
export default function InvoiceDetailPanel({
  invoice, meta = {}, loading, error, can = {},
  onOpenPay, onOpenDiscount, onOpenSurcharge, onOpenAdjust,
  onOpenCancel, onOpenRefund, onOpenReceipt, onPrint, onRefresh, onBack,
}) {
  const [tab, setTab] = useState('overview');

  if (!invoice) {
    const message = loading
      ? 'Đang tải hóa đơn...'
      : error || 'Chọn một hóa đơn ở danh sách bên trái để xem chi tiết.';

    return (
      <div className={`flex h-full items-center justify-center px-4 text-center text-sm ${error ? 'text-rose-600' : 'text-slate-500'}`}>
        {message}
      </div>
    );
  }

  const status = invoice.status;
  const mutable = ['pending', 'partial', 'paid'].includes(status);
  const due = Number(invoice.amount_due || 0);
  const paid = Number(invoice.amount_paid || 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          {onBack && (
            <Button variant="ghost" size="sm" className="mb-1 -ml-2 gap-1 text-slate-500" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="font-mono font-bold text-slate-900">{invoice.code}</div>
            <InvoiceStatusBadge status={status} />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{invoice.patient_name_snapshot}</span>
            {invoice.patient_phone_snapshot ? ` · ${invoice.patient_phone_snapshot}` : ''}
            {invoice.exam_date ? ` · Khám ${formatDateTime(invoice.exam_date)}` : ''}
            {invoice.doctor?.name ? ` · BS ${invoice.doctor.name}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <Button size="sm" variant="ghost" onClick={onRefresh} title="Tải lại">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {can.print && (
            <Button size="sm" variant="outline" className="gap-1" onClick={onPrint}>
              <Printer className="h-4 w-4" /> In
            </Button>
          )}
          {can.pay && mutable && due > 0 && (
            <Button size="sm" className="gap-1" onClick={onOpenPay}>
              <Wallet className="h-4 w-4" /> Thanh toán
            </Button>
          )}
          {can.refund && paid > 0 && status !== 'cancelled' && (
            <Button size="sm" variant="outline" className="gap-1 text-rose-600" onClick={onOpenRefund}>
              <RotateCcw className="h-4 w-4" /> Hoàn tiền
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="items">Dịch vụ ({invoice.items?.length || 0})</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán ({invoice.payments?.length || 0})</TabsTrigger>
            <TabsTrigger value="adjustments">Điều chỉnh ({invoice.adjustments?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-3">
            <InvoiceSummary invoice={invoice} meta={meta} />

            <div className="flex flex-wrap gap-2">
              {can.discount && mutable && (
                <>
                  <Button size="sm" variant="outline" className="gap-1" onClick={onOpenDiscount}>
                    <TrendingDown className="h-4 w-4" /> Giảm giá
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={onOpenSurcharge}>
                    <TrendingUp className="h-4 w-4" /> Phụ thu
                  </Button>
                </>
              )}
              {can.adjust && mutable && (
                <Button size="sm" variant="outline" className="gap-1" onClick={onOpenAdjust}>
                  <GitBranch className="h-4 w-4" /> Điều chỉnh
                </Button>
              )}
              {can.cancel && status !== 'cancelled' && status !== 'refunded' && paid === 0 && (
                <Button size="sm" variant="outline" className="gap-1 text-rose-600" onClick={onOpenCancel}>
                  <Ban className="h-4 w-4" /> Hủy hóa đơn
                </Button>
              )}
            </div>

            {status === 'cancelled' && (
              <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <div className="font-medium">Đã hủy</div>
                <div className="text-xs text-slate-500">
                  {invoice.cancelled_reason}{invoice.cancelled_at ? ` · ${formatDateTime(invoice.cancelled_at)}` : ''}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <div className="font-medium text-xs uppercase mb-0.5">Ghi chú</div>
                {invoice.notes}
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="mt-3">
            <InvoiceItemsTable items={invoice.items || []} />
          </TabsContent>

          <TabsContent value="payments" className="mt-3">
            <PaymentHistory payments={invoice.payments || []} onPrintReceipt={onOpenReceipt} />
          </TabsContent>

          <TabsContent value="adjustments" className="mt-3 space-y-2">
            {(invoice.adjustments || []).length === 0 && (
              <div className="text-sm text-slate-500 italic">Chưa có điều chỉnh.</div>
            )}
            {(invoice.adjustments || []).map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {a.type === 'positive' ? 'Tăng thêm' : 'Giảm trừ'}
                  </span>
                  <span className={`tabular-nums font-semibold ${a.type === 'positive' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {a.type === 'positive' ? '+' : '-'}
                    {Intl.NumberFormat('vi-VN').format(Math.round(a.amount))} ₫
                  </span>
                </div>
                <div className="text-xs text-slate-500">{a.reason} · {formatDate(a.created_at)}</div>
                {a.note ? <div className="text-xs text-slate-500 mt-0.5">{a.note}</div> : null}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
