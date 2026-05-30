import React, { useState } from 'react';
import { Unlock } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * UC12 - Dialog Mo khoa ho so (admin-only).
 */
export default function UnlockRecordDialog({ open, onOpenChange, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const localError = touched && reason.trim().length < 5
    ? 'Lý do tối thiểu 5 ký tự.' : null;

  const handleConfirm = () => {
    setTouched(true);
    if (reason.trim().length < 5) return;
    onConfirm?.(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-amber-500" /> Mở khoá hồ sơ
          </DialogTitle>
          <DialogDescription>
            Hành động này chỉ Admin có quyền thực hiện và được ghi vào lịch sử bệnh án.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Lý do mở khoá <span className="text-rose-500">*</span></Label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Cần bổ sung kết quả X-ray bị thiếu."
          />
          {localError ? <p className="text-[11px] text-rose-600">{localError}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            Huỷ
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Đang mở khoá...' : 'Xác nhận mở khoá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
