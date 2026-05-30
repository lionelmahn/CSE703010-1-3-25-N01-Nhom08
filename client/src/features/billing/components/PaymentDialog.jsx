import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Plus, Trash2, Wallet, Building2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PAYMENT_METHODS, METHODS_REQUIRE_REF } from '../constants';
import { formatVnd, parseNumberInput, formatNumberInput } from '../lib/format';

const METHOD_OPTIONS = [
  { value: PAYMENT_METHODS.CASH, label: 'Tiền mặt', icon: Wallet },
  { value: PAYMENT_METHODS.BANK_TRANSFER, label: 'Chuyển khoản', icon: Building2 },
  { value: PAYMENT_METHODS.CARD, label: 'Quẹt thẻ', icon: CreditCard },
];

const emptyRow = (method = 'cash') => ({
  method,
  amount: '',
  reference_code: '',
  note: '',
});

/**
 * UC13 - Dialog ghi nhan thanh toan. Cho phep them nhieu method
 * trong cung 1 lan (multi-payment, max 5).
 *
 * Quy tac validate (FE):
 *  - Tong amount > 0 va <= amount_due.
 *  - Method bank_transfer/card phai co reference_code.
 */
export default function PaymentDialog({ open, onOpenChange, invoice, onConfirm, loading }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setRows([emptyRow()]);
      setSubmitError('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const due = Number(invoice?.amount_due || 0);

  const total = useMemo(
    () => rows.reduce((s, r) => s + parseNumberInput(r.amount), 0),
    [rows],
  );

  const change = total - due;

  const updateRow = (idx, key, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const addRow = () => {
    if (rows.length >= 5) return;
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const setAmountFull = (idx) => {
    updateRow(idx, 'amount', formatNumberInput(due));
  };

  const handleSubmit = () => {
    setSubmitError('');
    if (total <= 0) {
      setSubmitError('Vui lòng nhập số tiền > 0.');
      return;
    }
    if (total > due) {
      setSubmitError(`Tổng vượt số còn phải trả (${formatVnd(due)}).`);
      return;
    }
    for (const r of rows) {
      const amt = parseNumberInput(r.amount);
      if (amt <= 0) {
        setSubmitError('Mỗi dòng phải có số tiền > 0.');
        return;
      }
      if (METHODS_REQUIRE_REF.includes(r.method) && !r.reference_code?.trim()) {
        setSubmitError('Chuyển khoản / Thẻ phải nhập mã giao dịch.');
        return;
      }
    }
    onConfirm?.(rows.map((r) => ({
      method: r.method,
      amount: parseNumberInput(r.amount),
      reference_code: r.reference_code || null,
      note: r.note || null,
    })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            Ghi nhận thanh toán
          </DialogTitle>
          <DialogDescription>
            Hóa đơn {invoice?.code} · Còn phải trả{' '}
            <span className="font-semibold text-rose-600">{formatVnd(due)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {METHOD_OPTIONS.map((m) => {
                    const Icon = m.icon;
                    const active = row.method === m.value;
                    return (
                      <Button
                        key={m.value}
                        type="button"
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        onClick={() => updateRow(idx, 'method', m.value)}
                        className="gap-1"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {m.label}
                      </Button>
                    );
                  })}
                </div>
                {rows.length > 1 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(idx)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Số tiền</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={row.amount}
                      inputMode="numeric"
                      onChange={(e) => updateRow(idx, 'amount', formatNumberInput(parseNumberInput(e.target.value)))}
                      placeholder="0"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => setAmountFull(idx)}>
                      Trả hết
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">
                    Mã giao dịch {METHODS_REQUIRE_REF.includes(row.method) && <span className="text-rose-500">*</span>}
                  </Label>
                  <Input
                    value={row.reference_code}
                    onChange={(e) => updateRow(idx, 'reference_code', e.target.value)}
                    placeholder="VCB12345..."
                    disabled={!METHODS_REQUIRE_REF.includes(row.method)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Ghi chú</Label>
                <Input
                  value={row.note}
                  onChange={(e) => updateRow(idx, 'note', e.target.value)}
                  placeholder="Tùy chọn"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={rows.length >= 5} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Thêm phương thức
          </Button>

          <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Tổng nhập</span>
              <span className="font-semibold tabular-nums">{formatVnd(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Còn lại sau giao dịch</span>
              <span className="font-semibold tabular-nums">{formatVnd(Math.max(due - total, 0))}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Tiền thừa (vượt số còn phải trả)</span>
                <span className="font-semibold tabular-nums">{formatVnd(change)}</span>
              </div>
            )}
          </div>

          {submitError ? (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-1">
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
