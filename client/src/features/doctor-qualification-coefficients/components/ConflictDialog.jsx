import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { formatCoefficient, typeLabel } from '../utils';

const ConflictDialog = ({ open, payload, message, onClose, onAdjust }) => (
  <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
    <DialogContent className="w-[calc(100vw-24px)] max-w-[560px] gap-0 overflow-hidden rounded-xl bg-white p-0">
      <DialogHeader className="border-b border-slate-200 px-4 py-3">
        <DialogTitle className="flex items-center gap-2 text-[13px] font-extrabold uppercase text-slate-950">
          <AlertTriangle size={16} className="text-amber-600" /> Phát hiện xung đột cấu hình
        </DialogTitle>
      </DialogHeader>
      <div className="p-4 text-[12px]">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
          {message || 'Khoảng hiệu lực bị trùng với cấu hình hiện có.'}
        </div>
        {payload ? (
          <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-2 rounded-lg border border-slate-200 p-3">
            <dt className="text-slate-500">Qualification</dt>
            <dd className="font-semibold">{payload.qualification_code}</dd>
            <dt className="text-slate-500">Loại</dt>
            <dd>{typeLabel(payload.qualification_type)}</dd>
            <dt className="text-slate-500">Hệ số</dt>
            <dd>{formatCoefficient(payload.coefficient)}</dd>
            <dt className="text-slate-500">Hiệu lực</dt>
            <dd>{payload.effective_from || '-'} - {payload.effective_to || '-'}</dd>
          </dl>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-200 px-5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
          Đóng
        </button>
        <button type="button" onClick={onAdjust} className="h-10 rounded-md bg-slate-950 px-5 text-[12px] font-semibold text-white hover:bg-slate-800">
          Điều chỉnh dữ liệu
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

export default ConflictDialog;
