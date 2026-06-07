import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatCoefficient,
  formatDate,
  formatDateTime,
  qualificationsFromOptions,
  typeLabel,
  versionLabel,
} from '../utils';
import StatusBadge from './StatusBadge';

const QualificationDetailDrawer = ({
  open,
  coefficient,
  rows,
  options,
  canManage,
  onClose,
  onCreate,
  onStop,
  onAudit,
  onHistory,
}) => {
  const qualifications = qualificationsFromOptions(options);
  const canStop = ['active', 'upcoming'].includes(coefficient?.status);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[760px] gap-0 overflow-hidden rounded-xl bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-4 py-3">
          <DialogTitle className="text-[13px] font-extrabold uppercase text-slate-950">
            Chi tiết hệ số học hàm/học vị
          </DialogTitle>
        </DialogHeader>

        {coefficient ? (
          <div className="max-h-[calc(92vh-68px)] overflow-y-auto p-4 text-[12px]">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3 md:col-span-2">
                <div className="text-[11px] font-semibold text-slate-500">Học hàm/học vị</div>
                <div className="mt-1 text-[16px] font-extrabold text-slate-950">{coefficient.qualification_name}</div>
                <div className="font-mono text-[10px] text-slate-500">{coefficient.qualification_code}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Phiên bản</div>
                <div className="mt-1 text-[16px] font-extrabold text-slate-950">{versionLabel(rows, coefficient)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Trạng thái</div>
                <div className="mt-2"><StatusBadge status={coefficient.status} /></div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Loại</div>
                <div className="mt-1 font-bold text-slate-950">{typeLabel(coefficient.qualification_type)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Ưu tiên</div>
                <div className="mt-1 font-bold text-slate-950">{coefficient.priority}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Hệ số</div>
                <div className="mt-1 text-[18px] font-extrabold text-slate-950">{formatCoefficient(coefficient.coefficient)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Mã cấu hình</div>
                <div className="mt-1 font-mono text-[11px] font-bold text-slate-950">{coefficient.code}</div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <section className="rounded-lg border border-slate-200 p-3">
                <h4 className="mb-2 text-[11px] font-extrabold uppercase text-slate-950">Khoảng hiệu lực</h4>
                <dl className="grid grid-cols-[110px_1fr] gap-y-2">
                  <dt className="text-slate-500">Từ ngày</dt>
                  <dd className="font-semibold">{formatDate(coefficient.effective_from)}</dd>
                  <dt className="text-slate-500">Đến ngày</dt>
                  <dd className="font-semibold">{formatDate(coefficient.effective_to)}</dd>
                  <dt className="text-slate-500">Lý do</dt>
                  <dd>{coefficient.change_reason || '-'}</dd>
                  <dt className="text-slate-500">Ghi chú</dt>
                  <dd>{coefficient.note || '-'}</dd>
                </dl>
              </section>
              <section className="rounded-lg border border-slate-200 p-3">
                <h4 className="mb-2 text-[11px] font-extrabold uppercase text-slate-950">Thứ tự ưu tiên mặc định</h4>
                <ol className="space-y-1">
                  {qualifications.map((item) => (
                    <li key={item.code} className={`rounded px-2 py-1 ${item.code === coefficient.qualification_code ? 'bg-blue-50 font-bold text-blue-700' : ''}`}>
                      {item.priority}. {item.name}
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <section className="mt-3 rounded-lg border border-slate-200 p-3">
              <h4 className="mb-2 text-[11px] font-extrabold uppercase text-slate-950">Thông tin thao tác</h4>
              <dl className="grid gap-y-2 md:grid-cols-[150px_1fr_150px_1fr]">
                <dt className="text-slate-500">Người tạo</dt>
                <dd>{coefficient.creator?.name || '-'}</dd>
                <dt className="text-slate-500">Thời gian tạo</dt>
                <dd>{formatDateTime(coefficient.created_at)}</dd>
                <dt className="text-slate-500">Cập nhật bởi</dt>
                <dd>{coefficient.updater?.name || '-'}</dd>
                <dt className="text-slate-500">Cập nhật lúc</dt>
                <dd>{formatDateTime(coefficient.updated_at)}</dd>
              </dl>
            </section>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => onHistory?.(coefficient)} className="h-9 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                Lịch sử
              </button>
              <button type="button" onClick={() => onAudit?.(coefficient)} className="h-9 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                Audit log
              </button>
              {canManage ? (
                <button type="button" onClick={() => onCreate?.({
                  qualification_code: coefficient.qualification_code,
                  qualification_type: coefficient.qualification_type,
                  priority: coefficient.priority,
                  coefficient: coefficient.coefficient,
                })} className="h-9 rounded-md border border-blue-200 px-4 text-[12px] font-semibold text-blue-700 hover:bg-blue-50">
                  Tạo bản mới
                </button>
              ) : null}
              {canManage && canStop ? (
                <button type="button" onClick={() => onStop?.(coefficient)} className="h-9 rounded-md bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700">
                  Ngừng áp dụng
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default QualificationDetailDrawer;
