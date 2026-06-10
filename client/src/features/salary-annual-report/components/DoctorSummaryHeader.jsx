import React from 'react';
import { GraduationCap, Stethoscope, CalendarDays } from 'lucide-react';
import { formatCoefficient, formatDate } from '../utils';

const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-[12px] text-slate-600">
    <Icon size={14} className="shrink-0 text-slate-400" />
    <span className="text-slate-400">{label}</span>
    <span className="truncate font-medium text-slate-700">{value || '--'}</span>
  </div>
);

// UI3 - thong tin tong quan bac si: ma, ho ten, hoc ham/hoc vi, khoa, ngay vao lam.
const DoctorSummaryHeader = ({ doctor }) => {
  if (!doctor) return null;

  const academic = doctor.academic_display || doctor.qualification_name;

  return (
    <section className="flex h-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-200 text-[15px] font-bold text-slate-600">
        {initials(doctor.full_name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {doctor.employee_code}
          </span>
          {doctor.doctor_coefficient != null ? (
            <span className="text-[11px] text-slate-400">Hệ số {formatCoefficient(doctor.doctor_coefficient)}</span>
          ) : null}
        </div>
        <h2 className="mt-1 truncate text-[16px] font-extrabold text-slate-900">{doctor.full_name}</h2>

        <div className="mt-2 space-y-1.5">
          <InfoRow icon={GraduationCap} label="Học hàm / Học vị:" value={academic} />
          <InfoRow icon={Stethoscope} label="Khoa / Chuyên môn:" value={doctor.specialty} />
          <InfoRow icon={CalendarDays} label="Ngày vào làm:" value={doctor.hire_date ? formatDate(doctor.hire_date) : null} />
        </div>
      </div>
    </section>
  );
};

export default DoctorSummaryHeader;
