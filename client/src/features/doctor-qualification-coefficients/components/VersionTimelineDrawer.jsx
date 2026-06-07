import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCoefficient, formatDate, formatDateTime, versionLabel } from '../utils';
import StatusBadge from './StatusBadge';

const VersionTimelineDrawer = ({ open, coefficient, rows = [], onClose }) => {
  const versions = coefficient
    ? [...rows]
      .filter((item) =>
        item.qualification_code === coefficient.qualification_code &&
        item.qualification_type === coefficient.qualification_type)
      .sort((a, b) => new Date(b.effective_from || b.created_at || 0) - new Date(a.effective_from || a.created_at || 0))
    : [];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[720px] gap-0 overflow-hidden rounded-xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase text-slate-950">
            Lịch sử phiên bản {coefficient ? `- ${coefficient.qualification_name}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(92vh-68px)] overflow-y-auto p-4 text-[12px]">
          {versions.length === 0 ? <div className="py-8 text-center text-slate-500">Chưa có lịch sử phiên bản.</div> : null}
          <div className="relative pl-8">
            {versions.length > 0 ? <div className="absolute bottom-4 left-[13px] top-2 w-px bg-slate-200" /> : null}
            <div className="space-y-4">
              {versions.map((item) => (
                <article key={item.id} className="relative rounded-lg border border-slate-200 bg-white p-3">
                  <span className="absolute -left-[25px] top-4 h-3 w-3 rounded-full border border-blue-500 bg-white" />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-slate-950">{versionLabel(rows, item)} · {formatCoefficient(item.coefficient)}</div>
                      <div className="mt-1 text-slate-500">{formatDate(item.effective_from)} - {formatDate(item.effective_to)}</div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 text-slate-600">
                    Tạo bởi {item.creator?.name || '-'} · {formatDateTime(item.created_at)}
                  </div>
                  {item.change_reason || item.note ? (
                    <div className="mt-1 text-slate-500">{item.change_reason || ''} {item.note || ''}</div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VersionTimelineDrawer;
