import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PAYMENT_METHODS, METHODS_REQUIRE_REF, REFUND_REASONS } from '../constants';
import { paymentMethodLabel, formatNumberInput, parseNumberInput, formatVnd } from '../lib/format';

const METHOD_OPTIONS = [PAYMENT_METHODS.CASH, PAYMENT_METHODS.BANK_TRANSFER, PAYMENT_METHODS.CARD];

/**
 * UC13 - Dialog hoan tien. Yeu cau ly do + method (BT/Card phai co ref).
 */
export default function RefundDialog({ open, onOpenChange, invoice, onConfirm, loading }) {
  const [method, setMethod] = useState(PAYMENT_METHODS.CASH);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const paid = Number(invoice?.amount_paid || 0);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setMethod(PAYMENT_METHODS.CASH);
      setAmount(formatNumberInput(paid));
      setReference('');
      setAccountInfo('');
      setReason('');
      setNote('');
      setError('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, paid]);

  const handleSubmit = () => {
    setError('');
    const numeric = parseNumberInput(amount);
    if (numeric <= 0) return setError('Số tiền phải > 0.');
    if (numeric > paid) return setError(`Hoàn không vượt số đã thanh toán (${formatVnd(paid)}).`);
    if (!reason.trim()) return setError('Vui lòng nhập lý do hoàn tiền.');
    if (METHODS_REQUIRE_REF.includes(method) && !reference.trim()) {
      return setError('Phương thức chuyển khoản / thẻ phải nhập mã giao dịch.');
    }
    onConfirm?.({
      method,
      amount: numeric,
      reason: reason.trim(),
      reference_code: reference.trim() || null,
      account_info: accountInfo.trim() || null,
      note: note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-rose-500" /> Hoàn tiền
          </DialogTitle>
          <DialogDescription>
            Hóa đơn {invoice?.code} · Đã thanh toán {formatVnd(paid)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Phương thức hoàn</Label>
            <div className="flex gap-2 flex-wrap">
              {METHOD_OPTIONS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={method === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMethod(m)}
                >
                  {paymentMethodLabel(m)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Số tiền hoàn</Label>
            <Input
              value={amount}
              inputMode="numeric"
              onChange={(e) => setAmount(formatNumberInput(parseNumberInput(e.target.value)))}
            />
          </div>
          {METHODS_REQUIRE_REF.includes(method) && (
            <>
              <div>
                <Label className="text-xs">Mã giao dịch <span className="text-rose-500">*</span></Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Thông tin tài khoản nhận</Label>
                <Input value={accountInfo} onChange={(e) => setAccountInfo(e.target.value)} placeholder="STK / chủ TK" />
              </div>
            </>
          )}
          <div>
            <Label className="text-xs">Lý do <span className="text-rose-500">*</span></Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do..." />
            <div className="mt-1 flex flex-wrap gap-1">
              {REFUND_REASONS.map((r) => (
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
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
