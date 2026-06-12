import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatVnd, formatNumber, MONTH_STATUS_LABEL, MONTH_STATUS_STYLES } from '../utils';

const th = 'bg-slate-50 px-2 py-2 text-[10px] font-bold uppercase text-slate-600 whitespace-nowrap';
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// UC19 - ma tran Bac si x 12 thang (DR257-260). Click o -> UC16.
const DoctorMonthMatrix = ({ doctors, cells, monthTotals, meta, loading, onDrillCell, onDrillMonth, onPageChange }) => {
  const totalsByMonth = (monthTotals || []).reduce((acc, m) => {
    acc[m.month] = m;
    return acc;
  }, {});

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
          Ma trận lương Bác sĩ × 12 tháng
        </h3>
        <span className="text-[11px] text-slate-500">{meta?.total ?? 0} bác sĩ · nhấp ô để mở phiếu (UC16)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} sticky left-0 z-10 bg-slate-50 text-left`}>Bác sĩ</th>
              {MONTHS.map((m) => (
                <th key={m} className={`${th} text-right`}>
                  <button
                    type="button"
                    onClick={() => onDrillMonth?.({ month: m })}
                    title="Mở báo cáo lương tháng (UC17)"
                    className="font-bold uppercase text-slate-600 hover:text-blue-600"
                  >
                    T{m}
                  </button>
                </th>
              ))}
              <th className={`${th} text-right`}>Tổng năm</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="border-t border-slate-100 px-3 py-3 text-center text-[11px] text-slate-400" colSpan={14}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : doctors.length ? (
              doctors.map((doc) => {
                const docCells = cells[doc.staff_id] || {};
                return (
                  <tr key={doc.staff_id} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 border-t border-slate-100 bg-white px-2 py-2 text-[11px] hover:bg-slate-50">
                      <span className="block font-semibold text-slate-900">{doc.full_name}</span>
                      <span className="block text-[10px] text-slate-400">{doc.employee_code}</span>
                    </td>
                    {MONTHS.map((m) => {
                      const cell = docCells[m] || { status: 'no_shifts', total_amount: null };
                      const clickable = cell.status !== 'no_shifts';
                      return (
                        <td key={m} className="border-t border-slate-100 px-1 py-1 text-right">
                          <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => onDrillCell(doc.staff_id, m, cell.payroll_id)}
                            title={MONTH_STATUS_LABEL[cell.status]}
                            className={`w-full rounded border px-1.5 py-1 text-[10px] font-semibold ${
                              MONTH_STATUS_STYLES[cell.status]
                            } ${clickable ? 'cursor-pointer hover:ring-1 hover:ring-blue-400' : 'cursor-default'}`}
                          >
                            {cell.total_amount !== null && cell.total_amount !== undefined
                              ? formatNumber(cell.total_amount, 0)
                              : cell.status === 'not_created'
                                ? 'Chưa lập'
                                : '—'}
                          </button>
                        </td>
                      );
                    })}
                    <td className="border-t border-slate-100 px-2 py-2 text-right text-[11px] font-bold text-slate-900">
                      {formatVnd(doc.total_amount)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="border-t border-slate-100 px-3 py-3 text-center text-[11px] text-slate-400" colSpan={14}>
                  Không có bác sĩ nào khớp bộ lọc trong năm này.
                </td>
              </tr>
            )}
          </tbody>
          {doctors.length ? (
            <tfoot>
              <tr className="bg-slate-50">
                <td className="sticky left-0 z-10 bg-slate-50 px-2 py-2 text-[10px] font-bold uppercase text-slate-600">
                  Quỹ lương đã chốt
                </td>
                {MONTHS.map((m) => (
                  <td key={m} className="px-1 py-2 text-right text-[10px] font-semibold text-slate-700">
                    {totalsByMonth[m] ? formatNumber(totalsByMonth[m].total_payroll_official, 0) : '—'}
                  </td>
                ))}
                <td className="px-2 py-2" />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
          <span>
            Trang {meta.current_page}/{meta.last_page}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => onPageChange(meta.current_page - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => onPageChange(meta.current_page + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default DoctorMonthMatrix;
