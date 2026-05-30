import React, { useEffect, useState } from 'react';
import { GitBranch } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ADJUSTMENT_TYPES, ADJUSTMENT_TYPE_LABELS } from '../constants';
import { formatNumberInput, parseNumberInput, formatVnd } from '../lib/format';

/**
 * UC13 - Dialog dieu chinh hoa don (positive | negative).
 */
export default function AdjustInvoiceDialog({ open, onOpenChange, invoice, onConfirm, loading }) {
  const [type, setType] = useState(ADJUSTMENT_TYPES.POSITIVE);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setType(ADJUSTMENT_TYPES.POSITIVE);
      setAmount('');
      setReason('');
      setNote('');
      setError('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const handleSubmit = () => {
    setError('');
    const numeric = parseNumberInput(amount);
    if (numeric <= 0) return setError('Số tiền phải > 0.');
    if (!reason.trim()) return setError('Vui lòng nhập lý do.');
    onConfirm?.({ type, amount: numeric, reason: reason.trim(), note: note.trim() || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-violet-500" /> Điều chỉnh hóa đơn
          </DialogTitle>
          <DialogDescription>Hóa đơn {invoice?.code} · Tổng hiện tại {formatVnd(invoice?.total || 0)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Loại điều chỉnh</Label>
            <div className="flex gap-2">
              {Object.values(ADJUSTMENT_TYPES).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={type === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType(t)}
                >
                  {ADJUSTMENT_TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </div>
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
            <Label className="text-xs">Lý do <span className="text-rose-500">*</span></Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do..." />
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
