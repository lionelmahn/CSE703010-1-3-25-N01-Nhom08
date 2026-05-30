import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

/**
 * UC12 - Form edit ghi chu / status cho 1 rang chon trong dental chart.
 */
export default function ToothNoteEditor({
  toothFdi,
  initial,
  statuses = [],
  onSave,
  onCancel,
  disabled,
  saving,
}) {
  const [statusId, setStatusId] = useState(initial?.tooth_status_id || '');
  const [note, setNote] = useState(initial?.note || '');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setStatusId(initial?.tooth_status_id || '');
    setNote(initial?.note || '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initial, toothFdi]);

  if (!toothFdi) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
        Bấm vào một răng để xem/sửa ghi chú.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          Răng {toothFdi}
        </h3>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={disabled}>
          Đóng
        </Button>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Trạng thái</label>
        <Select value={statusId ? String(statusId) : ''} onValueChange={(v) => setStatusId(v ? Number(v) : '')} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="-- Không xác định --" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.code ? `${s.code} · ` : ''}{s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Ghi chú</label>
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú lâm sàng cho răng này..."
          disabled={disabled}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          onClick={() => onSave?.({ tooth_fdi: toothFdi, tooth_status_id: statusId || null, note: note || null })}
          disabled={disabled || saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu răng'}
        </Button>
      </div>
    </div>
  );
}
