import React from 'react';
import { History, Plus, StopCircle, X } from 'lucide-react';
import {
  STATUS_LABEL,
  formatDate,
  formatDateTime,
  formatVnd,
  parseChangeNote,
  versionLabel,
} from '../utils';
import { VersionTimeline } from './DesignParts';
import StatusBadge from './StatusBadge';

const DetailRow = ({ label, value, children }) => (
  <>
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-semibold text-slate-900">{children || value || '-'}</dd>
  </>
);

const HourlyRateDetailDrawer = ({ open, rate, rates = [], canManage, onClose, onCreate, onStop, onAudit }) => {
  if (!open || !rate) return null;

  const canStop = canManage && ['active', 'upcoming'].includes(rate.status);
  const note = parseChangeNote(rate.note);
  const label = versionLabel(rates, rate);
  const status = STATUS_LABEL[rate.status] || rate.status || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-3 lg:items-center">
      <div className="w-full max-w-[860px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
          <h3 className="text-[13px] font-extrabold text-slate-950">
            Chi tiết cấu hình - {label} ({status})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid max-h-[76vh] overflow-y-auto text-[12px] md:grid-cols-[1fr_1fr]">
          <section className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">
              Thông tin chung
            </h4>
            <dl className="mt-4 grid grid-cols-[118px_1fr] gap-x-3 gap-y-2 text-[11px]">
              <DetailRow label="Phiên bản" value={label} />
              <DetailRow label="Mức tiền/giờ" value={`${formatVnd(rate.hourly_rate)} / giờ`} />
              <DetailRow label="Hiệu lực từ" value={formatDate(rate.effective_from)} />
              <DetailRow
                label="Hiệu lực đến"
                value={rate.effective_to ? formatDate(rate.effective_to) : 'Không thời hạn'}
              />
              <DetailRow label="Trạng thái">
                <StatusBadge status={rate.status} />
              </DetailRow>
              <DetailRow label="Lý do thay đổi" value={note.reason} />
              <DetailRow label="Chi tiết lý do" value={note.detail} />
              <DetailRow label="Người tạo" value={rate.creator?.name || 'Hệ thống'} />
              <DetailRow label="Ngày tạo" value={formatDateTime(rate.created_at)} />
              <DetailRow label="Người cập nhật" value={rate.updater?.name || rate.creator?.name || 'Hệ thống'} />
              <DetailRow label="Ngày cập nhật" value={formatDateTime(rate.updated_at || rate.created_at)} />
            </dl>
          </section>

          <section className="space-y-5 p-4">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Hiệu lực</h4>
              <div className="mt-2">
                <VersionTimeline rates={rates} selectedId={rate.id} limit={3} className="min-h-[112px]" />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Thao tác</h4>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                Phiên bản hiện tại không thể chỉnh sửa. Khi đổi mức tiền, hãy tạo phiên bản mới theo ngày hiệu lực.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {canManage && (
                  <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-[12px] font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus size={14} /> Tạo phiên bản mới
                  </button>
                )}
                {canStop && (
                  <button
                    type="button"
                    onClick={() => onStop?.(rate)}
                    className="inline-flex h-10 min-w-[170px] items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <StopCircle size={14} /> Ngừng áp dụng phiên bản này
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAudit?.(rate)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <History size={14} /> Xem lịch sử thay đổi
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HourlyRateDetailDrawer;
