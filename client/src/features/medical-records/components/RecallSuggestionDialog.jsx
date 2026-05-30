import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * UC12 - Dialog luu de xuat tai kham (khong tu tao appointment).
 */
export default function RecallSuggestionDialog({
  open, onOpenChange, onConfirm, loading, initial,
}) {
  const [date, setDate] = useState(initial?.recall_date ? String(initial.recall_date).slice(0, 10) : '');
  const [note, setNote] = useState(initial?.recall_note || '');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(initial?.recall_date ? String(initial.recall_date).slice(0, 10) : '');
      setNote(initial?.recall_note || '');
    }
  }, [open, initial]);

  const today = new Date().toISOString().slice(0, 10);
  const localError = date && date < today ? 'Ngày tái khám không được trong quá khứ.' : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-violet-500" /> Đề xuất tái khám
          </DialogTitle>
          <DialogDescription>
            UC12 chỉ lưu đề xuất; lịch hẹn tái khám sẽ do bệnh nhân hoặc tiếp tân tạo sau (UC4/UC6).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Ngày tái khám đề xuất <span className="text-rose-500">*</span></Label>
            <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            {localError ? <p className="text-[11px] text-rose-600 mt-1">{localError}</p> : null}
          </div>
          <div>
            <Label className="text-xs">Ghi chú</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
            Huỷ
          </Button>
          <Button
            disabled={!date || !!localError || loading}
            onClick={() => onConfirm?.({ recall_date: date, recall_note: note || null })}
          >
            {loading ? 'Đang lưu...' : 'Lưu đề xuất'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
