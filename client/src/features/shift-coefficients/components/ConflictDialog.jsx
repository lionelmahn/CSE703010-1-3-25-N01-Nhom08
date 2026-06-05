import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dayTypeLabel, formatCoefficient, formatDate, shiftTypeLabel } from '../utils';

const ConflictDialog = ({ open, payload, message, onClose, onAdjust }) => (
  <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
    <DialogContent className="max-w-xl bg-white">
      <DialogHeader>
        <DialogTitle>Phát hiện xung đột cấu hình</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 text-[12px]">
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
          {message || 'Khoảng hiệu lực bị trùng với cấu hình hiện có.'}
        </p>

        {payload && (
          <div className="rounded-md border border-slate-200 p-3">
            <h4 className="mb-2 text-[11px] font-extrabold uppercase text-slate-500">Cấu hình đang tạo</h4>
            <div className="grid grid-cols-[120px_1fr] gap-y-1">
              <span className="text-slate-500">Loại ngày</span><span>{dayTypeLabel(payload.day_type)}</span>
              <span className="text-slate-500">Loại ca</span><span>{shiftTypeLabel(payload.shift_type)}</span>
              <span className="text-slate-500">Hệ số</span><span>x{formatCoefficient(payload.coefficient)}</span>
              <span className="text-slate-500">Hiệu lực</span><span>{formatDate(payload.effective_from)} - {payload.effective_to ? formatDate(payload.effective_to) : 'Không thời hạn'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700">Đóng</button>
        <button type="button" onClick={onAdjust} className="h-10 rounded-md bg-slate-950 px-4 text-[12px] font-semibold text-white hover:bg-slate-800">Điều chỉnh</button>
      </div>
    </DialogContent>
  </Dialog>
);

export default ConflictDialog;
