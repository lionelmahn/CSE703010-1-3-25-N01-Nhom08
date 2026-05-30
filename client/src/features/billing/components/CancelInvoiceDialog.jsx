import React, { useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CANCEL_REASONS } from '../constants';

/**
 * UC13 - Dialog huy hoa don. Yeu cau ly do.
 */
export default function CancelInvoiceDialog({ open, onOpenChange, invoice, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setReason('');
      setNote('');
      setError('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const paid = Number(invoice?.amount_paid || 0);

  const handleSubmit = () => {
    setError('');
    if (!reason.trim()) return setError('Vui lòng nhập lý do hủy.');
    if (paid > 0) return setError('Hóa đơn đã thanh toán một phần. Vui lòng hoàn tiền trước khi hủy.');
    onConfirm?.({ reason: reason.trim(), note: note.trim() || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-rose-500" /> Hủy hóa đơn
          </DialogTitle>
          <DialogDescription>
            Hóa đơn {invoice?.code} sẽ chuyển sang trạng thái <strong>Đã hủy</strong>. Các dịch vụ
            sẽ được reset trạng thái thanh toán để có thể tạo hóa đơn mới.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Lý do <span className="text-rose-500">*</span></Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy..."
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {CANCEL_REASONS.map((r) => (
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
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>

          {error ? (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>Đóng</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
