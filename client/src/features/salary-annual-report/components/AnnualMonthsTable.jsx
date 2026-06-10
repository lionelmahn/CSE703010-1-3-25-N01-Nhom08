import React, { useState } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Plus, Download, Printer } from 'lucide-react';
import MonthStatusBadge from './MonthStatusBadge';
import MonthDetailRow from './MonthDetailRow';
import { formatVnd, formatNumber, formatDateTime, formatDash } from '../utils';

const COL_COUNT = 14;
const th = 'bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase text-slate-600 whitespace-nowrap';
const td = 'border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700 whitespace-nowrap';

// MONTHLY PAYROLL OVERVIEW - bang day du cot + mo rong tung ca + dong TOTAL + footer.
const AnnualMonthsTable = ({ months, summary, year, loading, canOpenSlip, canExport, onDrillDown, onExport, onPrint }) => {
  const [expanded, setExpanded] = useState(() => new Set());

  const toggle = (m) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
          Bảng lương theo tháng ({year})
        </h3>
        {canExport ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer size={13} /> In
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              <Download size={13} /> Xuất báo cáo
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} w-8`} />
              <th className={th}>Tháng</th>
              <th className={th}>Mã phiếu</th>
              <th className={`${th} text-right`}>Số ca</th>
              <th className={`${th} text-right`}>Giờ làm</th>
              <th className={`${th} text-right`}>Giờ quy đổi</th>
              <th className={`${th} text-right`}>Hệ số BN</th>
              <th className={`${th} text-right`}>Lương (VNĐ)</th>
              <th className={th}>Trạng thái</th>
              <th className={th}>Ngày tạo</th>
              <th className={th}>Ngày chốt</th>
              <th className={th}>Người tạo</th>
              <th className={th}>Người chốt</th>
              <th className={`${th} text-center`}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={`${td} text-center text-slate-400`} colSpan={COL_COUNT}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : months.length ? (
              months.map((row) => {
                const notCreated = row.status === 'not_created';
                const noShifts = row.status === 'no_shifts';
                const canDrill = canOpenSlip && !noShifts;
                const canExpand = canOpenSlip && !!row.payroll_id;
                const isOpen = expanded.has(row.month);
                return (
                  <React.Fragment key={row.month}>
                    <tr className="hover:bg-slate-50">
                      <td className={`${td} text-center`}>
                        {canExpand ? (
                          <button
                            type="button"
                            onClick={() => toggle(row.month)}
                            className="text-slate-400 hover:text-slate-700"
                            aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
                          >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : null}
                      </td>
                      <td className={`${td} font-semibold text-slate-800`}>
                        {String(row.month).padStart(2, '0')}/{row.year}
                      </td>
                      <td className={td}>{row.payroll_code || '--'}</td>
                      <td className={`${td} text-right`}>{row.total_shifts}</td>
                      <td className={`${td} text-right`}>{formatNumber(row.total_shift_hours, 2)}</td>
                      <td className={`${td} text-right`}>{formatDash(row.total_converted_hours, (v) => formatNumber(v, 2))}</td>
                      <td className={`${td} text-right`}>{formatDash(row.total_patient_coefficient, (v) => formatNumber(v, 2))}</td>
                      <td className={`${td} text-right font-semibold text-slate-900`}>{formatDash(row.total_amount, formatVnd)}</td>
                      <td className={td}>
                        <MonthStatusBadge status={row.status} />
                      </td>
                      <td className={`${td} text-slate-500`}>{row.calculated_at ? formatDateTime(row.calculated_at) : '--'}</td>
                      <td className={`${td} text-slate-500`}>{row.finalized_at ? formatDateTime(row.finalized_at) : '--'}</td>
                      <td className={td}>{row.created_by_name || '--'}</td>
                      <td className={td}>{row.finalized_by_name || '--'}</td>
                      <td className={`${td} text-center`}>
                        {canDrill ? (
                          <button
                            type="button"
                            onClick={() => onDrillDown(row)}
                            title={notCreated ? 'Lập phiếu lương' : 'Mở phiếu lương'}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          >
                            {notCreated ? <Plus size={14} /> : <ExternalLink size={14} />}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                    {isOpen && canExpand ? <MonthDetailRow payrollId={row.payroll_id} colSpan={COL_COUNT} /> : null}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td className={`${td} text-center text-slate-400`} colSpan={COL_COUNT}>
                  Không có dữ liệu khớp bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
          {summary && months.length ? (
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td className={`${td} border-t-2 border-slate-200`} />
                <td className={`${td} border-t-2 border-slate-200`} colSpan={2}>
                  TỔNG ({year})
                </td>
                <td className={`${td} border-t-2 border-slate-200 text-right`}>{summary.total_shifts}</td>
                <td className={`${td} border-t-2 border-slate-200 text-right`}>{formatNumber(summary.total_shift_hours, 2)}</td>
                <td className={`${td} border-t-2 border-slate-200 text-right`}>{formatNumber(summary.total_converted_hours, 2)}</td>
                <td className={`${td} border-t-2 border-slate-200 text-right`}>{formatNumber(summary.total_patient_coefficient, 2)}</td>
                <td className={`${td} border-t-2 border-slate-200 text-right`}>{formatVnd(summary.total_payroll_official)}</td>
                <td className={`${td} border-t-2 border-slate-200`} colSpan={6} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
        <span>Hiển thị {months.length ? `1 - ${months.length}` : 0} của 12 tháng</span>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-slate-500">12 / trang</span>
      </div>
    </section>
  );
};

export default AnnualMonthsTable;
