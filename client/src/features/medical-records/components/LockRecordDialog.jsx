import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * UC12 - Dialog Khoa ho so (action `lock`).
 *
 * Phi-functional: yeu cau ly do truoc khi khoa. Sau khi khoa, ho so se
 * khong the chinh sua tru khi co Admin mo khoa.
 */
export default function LockRecordDialog({ open, onOpenChange, onConfirm, loading }) {
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
            <Lock className="h-4 w-4 text-rose-500" /> Khoá hồ sơ bệnh án
          </DialogTitle>
          <DialogDescription>
            Sau khi khoá, hồ sơ sẽ không thể chỉnh sửa. Chỉ Admin mới có thể mở lại.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Lý do khoá <span className="text-rose-500">*</span></Label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Đã hoàn tất điều trị và kiểm tra chéo."
          />
          {localError ? <p className="text-[11px] text-rose-600">{localError}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            Huỷ
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Đang khoá...' : 'Xác nhận khoá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
