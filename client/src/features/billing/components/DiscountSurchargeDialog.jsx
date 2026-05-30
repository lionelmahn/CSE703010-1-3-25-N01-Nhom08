import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DISCOUNT_REASONS, SURCHARGE_REASONS } from '../constants';
import { formatNumberInput, parseNumberInput, formatVnd } from '../lib/format';

/**
 * UC13 - Dialog ap dung giam gia / phu thu cho hoa don.
 * mode = "discount" | "surcharge".
 */
export default function DiscountSurchargeDialog({
  open, onOpenChange, mode = 'discount', invoice, onConfirm, loading,
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const init = mode === 'discount'
        ? invoice?.discount_amount
        : invoice?.surcharge_amount;
      /* eslint-disable react-hooks/set-state-in-effect */
      setAmount(init ? formatNumberInput(init) : '');
      setReason(mode === 'discount' ? invoice?.discount_reason || '' : invoice?.surcharge_reason || '');
      setNote(mode === 'discount' ? invoice?.discount_note || '' : '');
      setError('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, mode, invoice]);

  const isDiscount = mode === 'discount';
  const presets = isDiscount ? DISCOUNT_REASONS : SURCHARGE_REASONS;
  const subtotal = Number(invoice?.subtotal || 0);

  const handleSubmit = () => {
    setError('');
    const numeric = parseNumberInput(amount);
    if (numeric < 0) return setError('Số tiền phải >= 0.');
    if (numeric > 0 && !reason.trim()) return setError('Vui lòng nhập lý do.');
    if (isDiscount && numeric > subtotal) {
      return setError(`Giảm giá không được vượt tạm tính (${formatVnd(subtotal)}).`);
    }
    onConfirm?.({ amount: numeric, reason: reason.trim() || null, note: note.trim() || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDiscount ? <TrendingDown className="h-4 w-4 text-emerald-500" /> : <TrendingUp className="h-4 w-4 text-amber-500" />}
            {isDiscount ? 'Áp dụng giảm giá' : 'Áp dụng phụ thu'}
          </DialogTitle>
          <DialogDescription>
            Hóa đơn {invoice?.code} · Tạm tính {formatVnd(subtotal)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Số tiền</Label>
            <Input
              value={amount}
              inputMode="numeric"
              onChange={(e) => setAmount(formatNumberInput(parseNumberInput(e.target.value)))}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-xs">Lý do {parseNumberInput(amount) > 0 && <span className="text-rose-500">*</span>}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do..."
              list={`presets-${mode}`}
            />
            <datalist id={`presets-${mode}`}>
              {presets.map((r) => <option value={r} key={r} />)}
            </datalist>
            <div className="mt-1 flex flex-wrap gap-1">
              {presets.map((r) => (
                <Button
                  key={r}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-6"
                  onClick={() => setReason(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Ghi chú</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          {error ? (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
