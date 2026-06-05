import React from 'react';
import { CalendarDays, Clock, ScrollText } from 'lucide-react';
import { formatDate, formatDateTime, formatVnd, parseChangeNote } from '../utils';
import { DesignPanelHeader, PANEL_CLASS, RateSummaryCard } from './DesignParts';
import StatusBadge from './StatusBadge';

const CurrentHourlyRatePanel = ({ current, loading, onView }) => {
  const note = parseChangeNote(current?.note);

  return (
    <section className={PANEL_CLASS}>
      <DesignPanelHeader title="Mức đang áp dụng" right={current ? <StatusBadge status={current.status} /> : null} />
      <div className="p-4">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Mức tiền cơ bản/giờ đang áp dụng
                </p>
                <h3 className="mt-2 text-3xl font-extrabold text-slate-950">
                  {loading ? 'Đang tải...' : current ? formatVnd(current.hourly_rate) : 'Chưa thiết lập'}
                </h3>
                <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-500">
                  Áp dụng chung cho cấu hình tính lương. Khi thay đổi, hệ thống tạo phiên bản mới theo ngày hiệu lực để giữ lịch sử.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <RateSummaryCard
                label="Hiệu lực từ"
                value={formatDate(current?.effective_from)}
                detail="Ngày bắt đầu áp dụng"
                tone="green"
              />
              <RateSummaryCard
                label="Hiệu lực đến"
                value={current?.effective_to ? formatDate(current.effective_to) : 'Không thời hạn'}
                detail="Ngày kết thúc nếu có"
                tone="blue"
              />
              <RateSummaryCard
                label="Đơn vị tiền"
                value={current?.currency || 'VND'}
                detail="Chỉ hỗ trợ VND"
                tone="violet"
              />
            </div>
          </div>

          <div className="grid gap-3 text-[12px]">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <Clock size={13} /> Metadata
              </div>
              <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2">
                <dt className="text-slate-500">Người tạo</dt>
                <dd className="font-medium text-slate-900">{current?.creator?.name || 'Hệ thống'}</dd>
                <dt className="text-slate-500">Cập nhật</dt>
                <dd className="font-medium text-slate-900">{formatDateTime(current?.updated_at || current?.created_at)}</dd>
                <dt className="text-slate-500">Lý do</dt>
                <dd className="font-medium text-slate-900">{note.reason}</dd>
              </dl>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <CalendarDays size={13} /> Thao tác nhanh
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!current}
                  onClick={() => onView?.(current)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ScrollText size={14} /> Xem chi tiết
                </button>
                <button
                  type="button"
                  disabled={!current}
                  onClick={() => onView?.(current)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Lịch sử phiên bản
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentHourlyRatePanel;
