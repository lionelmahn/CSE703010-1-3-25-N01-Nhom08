import React from 'react';
import { ExternalLink } from 'lucide-react';
import { formatVnd, formatNumber } from '../utils';

const th = 'bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase text-slate-600 whitespace-nowrap';
const td = 'border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700 whitespace-nowrap';

// UC19 - bang theo thang (DR249-256). Click thang -> UC17. Du 12 thang.
const ByMonthTable = ({ rows, loading, onDrillMonth }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
        Báo cáo lương năm theo tháng
      </h3>
      <span className="text-[11px] text-slate-500">12 tháng</span>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Tháng</th>
            <th className={`${th} text-right`}>Quỹ lương (đã chốt)</th>
            <th className={`${th} text-right`}>Quỹ tạm tính</th>
            <th className={`${th} text-right`}>Bác sĩ có lương</th>
            <th className={`${th} text-right`}>Phiếu đã chốt</th>
            <th className={`${th} text-right`}>Phiếu chưa chốt</th>
            <th className={`${th} text-right`}>Chưa lập phiếu</th>
            <th className={`${th} text-right`}>Tổng ca</th>
            <th className={`${th} text-right`}>Giờ quy đổi</th>
            <th className={`${th} text-center`}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className={`${td} text-center text-slate-400`} colSpan={10}>
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.month} className="hover:bg-slate-50">
                <td
                  className={`${td} cursor-pointer font-semibold text-slate-900 hover:text-blue-600`}
                  onClick={() => onDrillMonth(row)}
                >
                  Tháng {row.month}
                  {row.is_provisional ? (
                    <span className="ml-1.5 inline-flex rounded border border-amber-200 bg-amber-50 px-1 text-[9px] font-bold text-amber-700">
                      tạm tính
                    </span>
                  ) : null}
                </td>
                <td className={`${td} text-right font-semibold text-slate-900`}>
                  {formatVnd(row.total_payroll_official)}
                </td>
                <td className={`${td} text-right text-slate-500`}>{formatVnd(row.total_payroll_provisional)}</td>
                <td className={`${td} text-right`}>{row.doctors_with_salary}</td>
                <td className={`${td} text-right text-emerald-700`}>{row.finalized_count}</td>
                <td className={`${td} text-right text-amber-700`}>{row.unfinalized_count}</td>
                <td className={`${td} text-right ${row.doctors_not_created ? 'text-rose-700' : ''}`}>
                  {row.doctors_not_created}
                </td>
                <td className={`${td} text-right`}>{row.total_shifts}</td>
                <td className={`${td} text-right`}>{formatNumber(row.total_converted_hours, 2)}</td>
                <td className={`${td} text-center`}>
                  <button
                    type="button"
                    onClick={() => onDrillMonth(row)}
                    title="Mở báo cáo lương tháng toàn bộ bác sĩ (UC17)"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                  >
                    <ExternalLink size={14} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default ByMonthTable;
