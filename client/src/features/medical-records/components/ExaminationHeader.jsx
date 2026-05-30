import React from 'react';
import { ArrowLeft, Save, CheckCircle2, Lock, Unlock, MoreHorizontal, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { statusLabel, statusToneClass, ageFromDob, formatDateTime } from '../lib/format';

/**
 * UC12 - Header phien kham (mini-card BN + action buttons).
 *
 * Phia phai co cac nut: Luu nhap, Hoan tat benh an, Khoa ho so, More.
 * Hien thi/ẩn tuy theo trang thai.
 */
export default function ExaminationHeader({
  session,
  onBack,
  onSaveDraft,
  onComplete,
  onLock,
  onUnlock,
  onGoToBilling,
  canEdit,
  canLock,
  canUnlock,
  canBilling,
  savingDraft,
  completing,
}) {
  if (!session) return null;
  const patient = session.patient || {};
  const doctor = session.doctor || {};
  const appointment = session.appointment || {};
  const age = ageFromDob(patient.dob);
  const isLocked = session.status === 'da_khoa';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách
          </Button>
          <div className="text-sm font-bold uppercase tracking-wide text-slate-800">
            Clinical Examination Workspace
          </div>
          <code className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-mono">{session.code}</code>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Button variant="outline" size="sm" onClick={onSaveDraft} disabled={savingDraft}>
              <Save className="h-4 w-4 mr-1" />
              {savingDraft ? 'Đang lưu...' : 'Lưu nháp'}
            </Button>
          ) : null}
          {canEdit ? (
            <Button size="sm" onClick={onComplete} disabled={completing} className="bg-slate-900 hover:bg-slate-800">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {completing ? 'Đang hoàn tất...' : 'Hoàn tất bệnh án'}
            </Button>
          ) : null}
          {canBilling && session.status === 'cho_thanh_toan' ? (
            <Button size="sm" onClick={onGoToBilling} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Receipt className="h-4 w-4 mr-1" />
              Chuyển thanh toán
            </Button>
          ) : null}
          {canLock && !isLocked ? (
            <Button variant="outline" size="sm" onClick={onLock}>
              <Lock className="h-4 w-4 mr-1" />
              Khóa hồ sơ
            </Button>
          ) : null}
          {canUnlock && isLocked ? (
            <Button variant="outline" size="sm" onClick={onUnlock}>
              <Unlock className="h-4 w-4 mr-1" />
              Mở khóa
            </Button>
          ) : null}
          <Button variant="outline" size="icon" className="h-8 w-8" title="More">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-3 lg:grid-cols-[1.2fr_1fr_0.8fr_0.7fr]">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-full bg-slate-200 ring-1 ring-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
            {(patient.full_name || '?').slice(0, 1)}
          </span>
          <div className="text-xs leading-5">
            <p>
              <b className="text-sm text-slate-900">{patient.full_name || '—'}</b>
              {patient.gender ? <span className="text-slate-500"> ({patient.gender}{age != null ? `, ${age} tuổi` : ''})</span> : null}
            </p>
            <p className="text-slate-500">
              ID: <span className="font-mono">{patient.patient_code || '—'}</span>
              {patient.phone ? <>  ·  SĐT: {patient.phone}</> : null}
            </p>
          </div>
        </div>

        <div className="text-xs leading-5">
          <p className="text-slate-500">Lịch hẹn</p>
          <p>
            <b>{appointment.code || '—'}</b>
            {appointment.appointment_date ? (
              <span className="text-slate-500"> · {formatDateTime(appointment.appointment_date)} {appointment.time_slot ? `· ${appointment.time_slot}` : ''}</span>
            ) : null}
          </p>
        </div>

        <div className="text-xs leading-5">
          <p className="text-slate-500">Bác sĩ điều trị</p>
          <p><b>{doctor.name || '—'}</b></p>
        </div>

        <div className="text-xs leading-5">
          <p className="text-slate-500">Trạng thái</p>
          <Badge variant="outline" className={`${statusToneClass(session.status)} text-xs font-semibold mt-0.5`}>
            {statusLabel(session.status)}
          </Badge>
          {session.unlinked_shift ? (
            <p className="mt-1 text-[11px] text-amber-600">⚠ Chưa khớp ca làm việc (E5)</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
