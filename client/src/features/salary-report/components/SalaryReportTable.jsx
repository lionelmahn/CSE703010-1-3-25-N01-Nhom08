import React from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Plus } from 'lucide-react';
import ReportStatusBadge from './ReportStatusBadge';
import { formatVnd, formatNumber, formatCoefficient, formatDash } from '../utils';

const th = 'bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase text-slate-600 whitespace-nowrap';
const td = 'border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700 whitespace-nowrap';

const SalaryReportTable = ({
  rows,
  meta,
  loading,
  selectedIds,
  onToggle,
  onToggleAllVisible,
  onDrillDown,
  onPageChange,
}) => {
  const pageIds = rows.map((r) => r.staff_id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const startIndex = ((meta?.current_page || 1) - 1) * (meta?.per_page || 20);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
          Danh sách phiếu lương theo bác sĩ
        </h3>
        <span className="text-[11px] text-slate-500">{meta?.total ?? 0} bác sĩ</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>
                <input type="checkbox" checked={allChecked} onChange={() => onToggleAllVisible(pageIds)} />
              </th>
              <th className={th}>STT</th>
              <th className={th}>Mã BS</th>
              <th className={th}>Họ và tên</th>
              <th className={th}>Học hàm/Học vị</th>
              <th className={`${th} text-right`}>Hệ số BS</th>
              <th className={`${th} text-right`}>Số ca</th>
              <th className={`${th} text-right`}>Giờ làm</th>
              <th className={`${th} text-right`}>Giờ quy đổi</th>
              <th className={`${th} text-right`}>Hệ số BN</th>
              <th className={`${th} text-right`}>Lương (VNĐ)</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-center`}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={`${td} text-center text-slate-400`} colSpan={13}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row, i) => {
                const checked = selectedIds.includes(row.staff_id);
                const missing = row.status === 'not_created';
                return (
                  <tr
                    key={row.staff_id}
                    className={`hover:bg-slate-50 ${checked ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className={td}>
                      <input type="checkbox" checked={checked} onChange={() => onToggle(row.staff_id)} />
                    </td>
                    <td className={td}>{startIndex + i + 1}</td>
                    <td className={`${td} font-semibold text-slate-800`}>{row.employee_code}</td>
                    <td className={`${td} cursor-pointer font-semibold text-slate-900 hover:text-blue-600`} onClick={() => onDrillDown(row)}>
                      {row.full_name}
                    </td>
                    <td className={td}>{row.qualification_name || '--'}</td>
                    <td className={`${td} text-right`}>{formatDash(row.doctor_coefficient, formatCoefficient)}</td>
                    <td className={`${td} text-right`}>{row.total_shifts}</td>
                    <td className={`${td} text-right`}>{formatNumber(row.total_shift_hours, 2)}</td>
                    <td className={`${td} text-right`}>{formatDash(row.total_converted_hours, (v) => formatNumber(v, 2))}</td>
                    <td className={`${td} text-right`}>{formatDash(row.total_patient_coefficient, (v) => formatNumber(v, 2))}</td>
                    <td className={`${td} text-right font-semibold text-slate-900`}>
                      {formatDash(row.total_amount, formatVnd)}
                    </td>
                    <td className={td}>
                      <ReportStatusBadge status={row.status} />
                    </td>
                    <td className={`${td} text-center`}>
                      <button
                        type="button"
                        onClick={() => onDrillDown(row)}
                        title={missing ? 'Lập phiếu lương' : 'Mở phiếu lương'}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      >
                        {missing ? <Plus size={14} /> : <ExternalLink size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className={`${td} text-center text-slate-400`} colSpan={13}>
                  Không có bác sĩ nào khớp bộ lọc trong kỳ này.
                </td>
              </tr>
            )}
          </tbody>
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

export default SalaryReportTable;
