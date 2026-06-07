import React from 'react';
import { AlertCircle, ListTree } from 'lucide-react';
import { formatVnd, formatCoefficient, formatDate, formatShiftTime } from '../utils';

const th = 'bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600';
const td = 'border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700';

const SalarySlipShiftTable = ({ view, loading, onOpenContribution }) => {
  const details = view?.details || [];
  const totals = view?.totals;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
          Bảng lương theo ca làm
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : !details.length ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <AlertCircle className="h-8 w-8 text-slate-300" />
          <div className="text-[12px] text-slate-500">Chưa có ca làm hợp lệ trong kỳ đã chọn.</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Ngày</th>
                <th className={th}>Ca làm</th>
                <th className={`${th} text-right`}>Giờ làm</th>
                <th className={`${th} text-right`}>Hệ số ca</th>
                <th className={`${th} text-right`}>Hệ số BN</th>
                <th className={`${th} text-right`}>Giờ chuyển đổi</th>
                <th className={`${th} text-right`}>Hệ số BS</th>
                <th className={`${th} text-right`}>Tiền/giờ</th>
                <th className={`${th} text-right`}>Lương ca</th>
                <th className={`${th} text-center`}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {details.map((row, index) => (
                <tr key={row.work_schedule_id || index} className="hover:bg-slate-50">
                  <td className={td}>{formatDate(row.work_date)}</td>
                  <td className={td}>
                    {(row.shift_name || row.shift_template_code || 'Ca')}{' '}
                    <span className="text-slate-400">
                      ({formatShiftTime(row.start_time, row.end_time)})
                    </span>
                  </td>
                  <td className={`${td} text-right`}>{formatCoefficient(row.shift_hours)}</td>
                  <td className={`${td} text-right`}>{formatCoefficient(row.shift_coefficient)}</td>
                  <td className={`${td} text-right`}>{formatCoefficient(row.total_patient_coefficient)}</td>
                  <td className={`${td} text-right`}>{formatCoefficient(row.converted_hours)}</td>
                  <td className={`${td} text-right`}>{formatCoefficient(row.doctor_coefficient)}</td>
                  <td className={`${td} text-right`}>{formatVnd(row.hourly_rate)}</td>
                  <td className={`${td} text-right font-semibold text-slate-900`}>{formatVnd(row.shift_amount)}</td>
                  <td className={`${td} text-center`}>
                    <button
                      type="button"
                      onClick={() => onOpenContribution(row)}
                      title="Xem đóng góp hệ số bệnh nhân"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
                    >
                      <ListTree size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {totals && (
                <tr className="bg-slate-100 font-bold">
                  <td className={`${td} font-bold`}>Tổng cộng</td>
                  <td className={td} />
                  <td className={`${td} text-right`}>{formatCoefficient(totals.total_shift_hours)}</td>
                  <td className={td} />
                  <td className={`${td} text-right`}>{formatCoefficient(totals.total_patient_coefficient)}</td>
                  <td className={`${td} text-right`}>{formatCoefficient(totals.total_converted_hours)}</td>
                  <td className={td} />
                  <td className={td} />
                  <td className={`${td} text-right`}>{formatVnd(totals.total_amount)}</td>
                  <td className={td} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default SalarySlipShiftTable;
