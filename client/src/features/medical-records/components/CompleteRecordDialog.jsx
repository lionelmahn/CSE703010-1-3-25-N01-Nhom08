import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * UC12 - Dialog xac nhan hoan tat ho so benh an.
 *
 * Sau khi xac nhan, BE se snapshot service items + chuyen status sang
 * cho_thanh_toan, ghi history, tao du lieu cho UC13.
 */
export default function CompleteRecordDialog({
  open, onOpenChange, onConfirm, loading, checklist = [],
}) {
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const missing = checklist.filter((c) => !c.ok);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Hoàn tất hồ sơ bệnh án
          </DialogTitle>
          <DialogDescription>
            Hồ sơ sẽ chuyển sang trạng thái "Chờ thanh toán" và snapshot giá / hệ số phức tạp cho UC13.
          </DialogDescription>
        </DialogHeader>

        {checklist.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="font-semibold text-slate-800 mb-1">Kiểm tra trước khi hoàn tất</div>
            <ul className="space-y-1">
              {checklist.map((c) => (
                <li key={c.key} className={c.ok ? 'text-emerald-700' : 'text-rose-600'}>
                  {c.ok ? '✓' : '⚠'} {c.label}
                </li>
              ))}
            </ul>
            {missing.length > 0 ? (
              <p className="text-rose-600 mt-2">
                Còn {missing.length} mục cần bổ sung. Vẫn có thể hoàn tất nếu chấp nhận rủi ro, nhưng server có thể từ chối (VR4/VR5/VR7).
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2 mt-2">
          <Label className="text-xs">Ghi chú hoàn tất (tuỳ chọn)</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
          Tôi xác nhận đã ghi nhận đầy đủ và muốn chuyển sang chờ thanh toán.
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            Huỷ
          </Button>
          <Button
            disabled={!confirmed || loading}
            onClick={() => onConfirm?.({ completion_note: note || null, confirmed: true })}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Đang hoàn tất...' : 'Xác nhận hoàn tất'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
