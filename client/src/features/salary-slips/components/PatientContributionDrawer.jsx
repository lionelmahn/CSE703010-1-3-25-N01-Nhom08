import React from 'react';
import { X } from 'lucide-react';
import { formatCoefficient, formatDate, formatShiftTime } from '../utils';

const PatientContributionDrawer = ({ open, shift, onClose }) => {
  if (!open || !shift) return null;

  const items = shift.examination_breakdown || [];
  const patientCount = new Set(items.map((i) => i.patient_id)).size;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-[460px] overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-[13px] font-extrabold text-slate-900">Đóng góp hệ số bệnh nhân</h3>
            <p className="text-[11px] text-slate-500">
              {formatDate(shift.work_date)} · {shift.shift_name || shift.shift_template_code}{' '}
              ({formatShiftTime(shift.start_time, shift.end_time)})
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-slate-200 p-4 text-center">
          <div>
            <p className="text-[11px] text-slate-500">Tổng hệ số BN</p>
            <p className="mt-1 text-[20px] font-extrabold text-slate-950">
              {formatCoefficient(shift.total_patient_coefficient)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Số bệnh nhân</p>
            <p className="mt-1 text-[20px] font-extrabold text-slate-950">{patientCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Số dịch vụ</p>
            <p className="mt-1 text-[20px] font-extrabold text-slate-950">{items.length}</p>
          </div>
        </div>

        <div className="p-4">
          {items.length ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">
                    Bệnh nhân
                  </th>
                  <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">
                    Dịch vụ
                  </th>
                  <th className="bg-slate-50 px-3 py-2 text-right text-[10.5px] font-bold text-slate-600">
                    Hệ số
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700">
                      {item.patient_name || `BN #${item.patient_id ?? '-'}`}
                    </td>
                    <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700">
                      {item.service_name || '-'}
                    </td>
                    <td className="border-t border-slate-100 px-3 py-2 text-right text-[11px] text-slate-700">
                      {formatCoefficient(item.complexity_coefficient)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-900">Tổng cộng</td>
                  <td className="border-t border-slate-100 px-3 py-2" />
                  <td className="border-t border-slate-100 px-3 py-2 text-right text-[11px] text-slate-900">
                    {formatCoefficient(shift.total_patient_coefficient)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-center text-[12px] text-slate-500">
              Ca làm này không có lượt khám hoàn tất nào.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientContributionDrawer;
