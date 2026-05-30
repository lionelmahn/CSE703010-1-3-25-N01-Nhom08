import React from 'react';
import { AlertTriangle, Calendar, ClipboardList } from 'lucide-react';
import { formatDate, ageFromDob } from '../lib/format';

/**
 * UC12 - Cot trai trong workspace: thong tin BN + canh bao + lich hen + lich su.
 *
 * Du lieu lay tu session.patient + session.appointment + visit_history props.
 */
export default function PatientSidebar({ session, visitHistory = [] }) {
  if (!session) return null;
  const patient = session.patient || {};
  const appointment = session.appointment || {};
  const alerts = patient.medical_alerts || [];
  const age = ageFromDob(patient.dob);

  return (
    <aside className="space-y-4 border-r border-slate-100 bg-white p-4 lg:max-w-[260px]">
      <section className="border-b border-slate-100 pb-4">
        <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
          Thông tin bệnh nhân
        </h2>
        <dl className="grid grid-cols-[88px_1fr] gap-y-1.5 text-xs">
          <dt className="text-slate-500">Ngày sinh</dt>
          <dd>{formatDate(patient.dob)}{age != null ? ` (${age} tuổi)` : ''}</dd>
          <dt className="text-slate-500">Giới tính</dt>
          <dd>{patient.gender || '—'}</dd>
          <dt className="text-slate-500">Điện thoại</dt>
          <dd>{patient.phone || '—'}</dd>
          <dt className="text-slate-500">Địa chỉ</dt>
          <dd className="text-slate-700 line-clamp-2">{patient.address || '—'}</dd>
          <dt className="text-slate-500">Bảo hiểm</dt>
          <dd>{patient.insurance_provider || '—'}</dd>
        </dl>
      </section>

      <section className="border-b border-slate-100 pb-4">
        <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
          Cảnh báo y tế
        </h2>
        {alerts.length === 0 ? (
          <p className="text-xs text-slate-400">Không có cảnh báo</p>
        ) : (
          <div className="space-y-1.5">
            {alerts.map((a, i) => (
              <p key={i} className="flex items-center gap-1 text-xs text-rose-600">
                <AlertTriangle className="h-3 w-3" />
                {a.label || a}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="border-b border-slate-100 pb-4">
        <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
          Lịch hẹn hôm nay
        </h2>
        <div className="text-xs text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatDate(appointment.appointment_date)} {appointment.time_slot ? `· ${appointment.time_slot}` : ''}</span>
          </div>
          {appointment.code ? (
            <p className="font-mono text-slate-500">{appointment.code}</p>
          ) : null}
          {appointment.notes ? (
            <p className="text-slate-600 italic line-clamp-2">"{appointment.notes}"</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
          Lịch sử khám
        </h2>
        {visitHistory.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có phiên khám trước.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {visitHistory.slice(0, 5).map((v) => (
              <li key={v.id} className="flex items-start gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                <div className="min-w-0">
                  <div className="truncate">
                    <span className="font-mono">{v.code}</span>
                    <span className="text-slate-500"> · {formatDate(v.started_at)}</span>
                  </div>
                  <p className="text-slate-500 line-clamp-1">{v.diagnosis || '—'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
