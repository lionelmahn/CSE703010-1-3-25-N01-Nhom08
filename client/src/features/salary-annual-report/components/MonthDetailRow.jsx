import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { salarySlipApi } from '@/api/salarySlipApi';
import { formatShiftTime } from '@/features/salary-slips/utils';
import { formatVnd, formatNumber, formatDate } from '../utils';

const sth = 'px-3 py-1.5 text-left text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap';
const std = 'border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-700 whitespace-nowrap';

// Bang con chi tiet tung ca cua phieu luong (UC16 detail), tai khi mo rong dong.
const MonthDetailRow = ({ payrollId, colSpan }) => {
  const [details, setDetails] = useState(null); // null = dang tai, [] = rong
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    salarySlipApi
      .show(payrollId)
      .then(({ data }) => {
        if (active) setDetails(data?.data?.details || []);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setDetails([]);
        }
      });
    return () => {
      active = false;
    };
  }, [payrollId]);

  return (
    <tr className="bg-slate-50/60">
      <td colSpan={colSpan} className="px-4 py-3">
        {details === null ? (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Loader2 size={13} className="animate-spin" /> Đang tải chi tiết ca...
          </div>
        ) : error ? (
          <p className="text-[11px] text-rose-500">Không tải được chi tiết phiếu lương.</p>
        ) : !details.length ? (
          <p className="text-[11px] text-slate-400">Phiếu chưa có chi tiết ca.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={sth}>Ngày</th>
                  <th className={sth}>Ca làm</th>
                  <th className={`${sth} text-right`}>Giờ</th>
                  <th className={`${sth} text-right`}>Hệ số ca</th>
                  <th className={`${sth} text-right`}>Hệ số BN</th>
                  <th className={`${sth} text-right`}>Giờ quy đổi</th>
                  <th className={`${sth} text-right`}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d) => (
                  <tr key={d.id}>
                    <td className={std}>{formatDate(d.work_date)}</td>
                    <td className={std}>
                      {d.shift_name}
                      <span className="ml-1 text-slate-400">({formatShiftTime(d.start_time, d.end_time)})</span>
                    </td>
                    <td className={`${std} text-right`}>{formatNumber(d.shift_hours, 2)}</td>
                    <td className={`${std} text-right`}>{formatNumber(d.shift_coefficient, 2)}</td>
                    <td className={`${std} text-right`}>{formatNumber(d.total_patient_coefficient, 2)}</td>
                    <td className={`${std} text-right`}>{formatNumber(d.converted_hours, 2)}</td>
                    <td className={`${std} text-right font-semibold text-slate-900`}>{formatVnd(d.shift_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </td>
    </tr>
  );
};

export default MonthDetailRow;
