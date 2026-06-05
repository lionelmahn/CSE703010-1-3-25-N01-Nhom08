import React, { useMemo } from 'react';
import { History, Plus, StopCircle, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  dayTypeLabel,
  formatCoefficient,
  formatDate,
  formatDateTime,
  shiftTypeLabel,
  sortCoefficientsAsc,
  versionLabel,
} from '../utils';

const DetailRow = ({ label, value, children }) => (
  <>
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-semibold text-slate-900">{children || value || '-'}</dd>
  </>
);

const EffectiveTimeline = ({ rows, selected }) => {
  const group = useMemo(() => sortCoefficientsAsc(
    rows.filter((row) => row.day_type === selected?.day_type && row.shift_type === selected?.shift_type),
  ), [rows, selected?.day_type, selected?.shift_type]);

  if (group.length === 0) {
    return <p className="rounded-md bg-slate-50 px-3 py-3 text-[11px] text-slate-500">Chưa có timeline hiệu lực.</p>;
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start gap-3">
        {group.map((row) => {
          const active = row.id === selected?.id;
          return (
            <div key={row.id} className="w-28 text-center">
              <div className="relative mb-2 flex items-center justify-center">
                <span className="absolute left-0 right-0 top-1/2 h-px bg-slate-200" />
                <span className={`relative z-10 h-3 w-3 rounded-full border-2 bg-white ${active ? 'border-blue-500' : 'border-slate-300'}`} />
              </div>
              <p className="text-[10px] text-slate-500">{formatDate(row.effective_from)}</p>
              <p className="mt-1 text-[11px] font-extrabold text-slate-950">{versionLabel(rows, row)}</p>
              <p className="text-[11px] text-slate-700">x{formatCoefficient(row.coefficient)}</p>
              <p className="mt-1 text-[10px] text-slate-500">{row.status === 'active' ? 'Đang áp dụng' : row.status === 'upcoming' ? 'Sắp áp dụng' : 'Hết hiệu lực'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UsageNote = ({ coefficient }) => {
  const usage = coefficient?.payroll_usage || coefficient?.usage_summary;

  if (!usage) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[11px] leading-5 text-slate-600">
        Chưa có dữ liệu phiếu lương UC18 để tính kỳ sử dụng, số nhân sự bị ảnh hưởng hoặc tác động lương.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[11px]">
        <dt className="text-slate-600">Kỳ sử dụng</dt>
        <dd className="font-semibold text-slate-950">{usage.period || '-'}</dd>
        <dt className="text-slate-600">Nhân sự bị ảnh hưởng</dt>
        <dd className="font-semibold text-slate-950">{usage.affected_staff ?? '-'}</dd>
        <dt className="text-slate-600">Tác động lương</dt>
        <dd className="font-semibold text-emerald-600">{usage.salary_impact || '-'}</dd>
      </dl>
    </div>
  );
};

const ShiftCoefficientDetailDrawer = ({ open, coefficient, rows = [], canManage, onClose, onCreate, onStop, onAudit }) => {
  if (!open || !coefficient) return null;

  const canStop = canManage && ['active', 'upcoming'].includes(coefficient.status);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-3 lg:items-center">
      <div className="w-full max-w-[920px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-slate-950">
            Chi tiết cấu hình - {versionLabel(rows, coefficient)}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="grid max-h-[78vh] overflow-y-auto text-[12px] md:grid-cols-[1fr_0.95fr]">
          <section className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Thông tin chung</h4>
            <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[11px]">
              <DetailRow label="Mã" value={coefficient.code} />
              <DetailRow label="Tên" value={coefficient.name} />
              <DetailRow label="Phiên bản" value={versionLabel(rows, coefficient)} />
              <DetailRow label="Loại ngày" value={dayTypeLabel(coefficient.day_type)} />
              <DetailRow label="Loại ca" value={shiftTypeLabel(coefficient.shift_type)} />
              <DetailRow label="Hệ số" value={`x${formatCoefficient(coefficient.coefficient)}`} />
              <DetailRow label="Hiệu lực từ" value={formatDate(coefficient.effective_from)} />
              <DetailRow label="Hiệu lực đến" value={coefficient.effective_to ? formatDate(coefficient.effective_to) : 'Không thời hạn'} />
              <DetailRow label="Trạng thái"><StatusBadge status={coefficient.status} /></DetailRow>
              <DetailRow label="Lý do" value={coefficient.change_reason} />
              <DetailRow label="Ghi chú" value={coefficient.note} />
              <DetailRow label="Người tạo" value={coefficient.creator?.name || 'Hệ thống'} />
              <DetailRow label="Ngày tạo" value={formatDateTime(coefficient.created_at)} />
              <DetailRow label="Người cập nhật" value={coefficient.updater?.name || coefficient.creator?.name || 'Hệ thống'} />
              <DetailRow label="Ngày cập nhật" value={formatDateTime(coefficient.updated_at || coefficient.created_at)} />
            </dl>
          </section>

          <section className="space-y-5 p-4">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Dòng thời gian hiệu lực</h4>
              <div className="mt-3"><EffectiveTimeline rows={rows} selected={coefficient} /></div>
            </div>

            <div>
              <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Lưu ý</h4>
              <UsageNote coefficient={coefficient} />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-slate-950">Thao tác</h4>
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                Không sửa trực tiếp phiên bản đã lưu. Khi thay đổi hệ số, tạo phiên bản mới theo ngày hiệu lực mới.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onCreate?.({ day_type: coefficient.day_type, shift_type: coefficient.shift_type })}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-[12px] font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus size={14} /> Tạo phiên bản mới
                  </button>
                )}
                {canStop && (
                  <button type="button" onClick={() => onStop?.(coefficient)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-800 hover:bg-slate-50">
                    <StopCircle size={14} /> Ngừng áp dụng
                  </button>
                )}
                <button type="button" onClick={() => onAudit?.(coefficient)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-800 hover:bg-slate-50">
                  <History size={14} /> Nhật ký thao tác
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShiftCoefficientDetailDrawer;
