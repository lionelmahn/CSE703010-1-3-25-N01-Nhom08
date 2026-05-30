import React, { useState } from 'react';
import {
  Banknote,
  Calendar,
  ChevronLeft,
  FileText,
  GitMerge,
  History,
  Loader2,
  Pencil,
  Receipt,
  RefreshCw,
  Stethoscope,
  User,
  XCircle,
} from 'lucide-react';

import StatusBadge from './StatusBadge';
import { DETAIL_TABS, PATIENT_STATUS } from '../constants';
import {
  calculateAge,
  buildInitials,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
} from '../utils';

const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-[110px_1fr] items-start">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 break-words">{value || '—'}</span>
  </div>
);

const StatCard = ({ icon: IconComponent, value, label }) => (
  <div className="border rounded-lg p-3 bg-gray-50/50 flex flex-col items-center text-center">
    {IconComponent ? <IconComponent size={16} className="text-gray-400 mb-1" /> : null}
    <div className="font-bold text-gray-900 text-sm">{value}</div>
    <div className="text-[10px] text-gray-500">{label}</div>
  </div>
);

/**
 * UC5 - Panel chi tiet ho so benh nhan ben phai list.
 *
 * Goi action callback ra ngoai cho PatientList page xu ly dialog.
 */
const PatientDetailPanel = ({
  patient,
  loading = false,
  error = null,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
  onMerge,
  onShowHistory,
  onRefresh,
}) => {
  const [tab, setTab] = useState(DETAIL_TABS.GENERAL);

  if (!patient && !loading) {
    return (
      <div className="bg-white border rounded-lg shadow-sm flex flex-col items-center justify-center text-center p-10 text-sm text-gray-500 h-full">
        <User size={32} className="text-gray-300 mb-3" />
        <p>Chọn một hồ sơ bên trái để xem chi tiết.</p>
      </div>
    );
  }

  if (loading && !patient) {
    return (
      <div className="bg-white border rounded-lg shadow-sm flex items-center justify-center text-sm text-gray-500 h-full gap-2 min-h-[300px]">
        <Loader2 size={16} className="animate-spin" /> Đang tải hồ sơ...
      </div>
    );
  }

  const isMerged = patient.status === PATIENT_STATUS.MERGED;
  const isInactive = patient.status === PATIENT_STATUS.INACTIVE;
  const age = calculateAge(patient.dob);
  const stats = {
    appointments: Number(patient.appointments_count || 0),
    booking_requests: Number(patient.online_booking_requests_count || 0),
    debt: Number(patient.total_debt || 0),
    loyalty: Number(patient.loyalty_points || 0),
  };

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      {/*
        Header: title on its own row, action buttons wrap to a second row
        below when the panel is narrow. This keeps the title legible
        regardless of how many conditional actions are visible (refresh
        + edit + (de)activate + merge + history = up to 5 buttons).
      */}
      <div className="flex min-w-0 flex-col gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 xl:hidden"
            aria-label="Đóng chi tiết"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
            Chi tiết hồ sơ bệnh nhân
          </h2>
        </div>
        <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
          <button
            type="button"
            onClick={() => onRefresh?.()}
            className="flex items-center gap-1.5 rounded border bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            title="Tải lại"
            aria-label="Tải lại"
          >
            <RefreshCw size={12} />
          </button>
          {!isMerged && (
            <button
              type="button"
              onClick={() => onEdit?.(patient)}
              className="flex items-center gap-1.5 rounded border bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={12} /> Chỉnh sửa
            </button>
          )}
          {!isMerged && !isInactive && (
            <button
              type="button"
              onClick={() => onDeactivate?.(patient)}
              className="flex items-center gap-1.5 rounded border bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <XCircle size={12} /> Ngừng hoạt động
            </button>
          )}
          {isInactive && (
            <button
              type="button"
              onClick={() => onReactivate?.(patient)}
              className="flex items-center gap-1.5 rounded border bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <RefreshCw size={12} /> Mở lại hồ sơ
            </button>
          )}
          {!isMerged && (
            <button
              type="button"
              onClick={() => onMerge?.(patient)}
              className="flex items-center gap-1.5 rounded border bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <GitMerge size={12} /> Gộp hồ sơ
            </button>
          )}
          <button
            type="button"
            onClick={() => onShowHistory?.(patient)}
            className="flex items-center gap-1.5 rounded border bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <History size={12} /> Lịch sử
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-100 text-red-700 text-xs px-4 py-2">{error}</div>
      )}

      {/*
        Identity section is horizontal when the panel takes the full
        page width (md/lg viewports stacked under the table) and stacks
        vertically again on `xl+` where the panel is locked to 420px,
        because three columns can't fit comfortably in 420px.
      */}
      <div className="flex flex-col items-start gap-4 border-b bg-gray-50/30 p-4 sm:flex-row xl:flex-col">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500">
          {buildInitials(patient.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-gray-500 mb-0.5">{patient.patient_code}</div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-bold text-gray-900 text-base">{patient.full_name}</h3>
            <StatusBadge status={patient.status} size="xs" />
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {patient.gender && (
              <span className="bg-gray-100 border text-gray-600 px-1.5 py-0.5 rounded">👤 {patient.gender}</span>
            )}
            {age !== null && (
              <span className="bg-gray-100 border text-gray-600 px-1.5 py-0.5 rounded">🎂 {age} tuổi</span>
            )}
            {patient.source && (
              <span className="bg-gray-100 border text-gray-600 px-1.5 py-0.5 rounded">📌 {patient.source}</span>
            )}
          </div>
          {patient.merged_into && (
            <p className="text-[11px] text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-1 mt-2">
              Hồ sơ này đã được gộp vào: <strong>{patient.merged_into.patient_code} - {patient.merged_into.full_name}</strong>
            </p>
          )}
        </div>
        <div className="min-w-0 space-y-0.5 text-left text-[11px] text-gray-500 sm:text-right xl:w-full xl:text-left">
          <div>Ngày tạo: <span className="font-medium text-gray-900">{formatDateTime(patient.created_at)}</span></div>
          {patient.created_by && <div>Người tạo: <span className="font-medium text-gray-900">{patient.created_by}</span></div>}
          <div>Cập nhật: <span className="font-medium text-gray-900">{formatDateTime(patient.updated_at)}</span></div>
          {patient.updated_by && <div>Người cập nhật: <span className="font-medium text-gray-900">{patient.updated_by}</span></div>}
          {patient.last_visit_at && (
            <div>Lần khám gần nhất: <span className="font-medium text-gray-900">{formatDate(patient.last_visit_at)}</span></div>
          )}
        </div>
      </div>

      <div className="flex border-b text-xs px-2 bg-white overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab(DETAIL_TABS.GENERAL)}
          className={`px-3 py-2 whitespace-nowrap border-b-2 ${tab === DETAIL_TABS.GENERAL ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Thông tin chung
        </button>
        <button
          type="button"
          onClick={() => setTab(DETAIL_TABS.APPOINTMENTS)}
          className={`px-3 py-2 whitespace-nowrap border-b-2 ${tab === DETAIL_TABS.APPOINTMENTS ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Lịch hẹn ({stats.appointments})
        </button>
        <button
          type="button"
          onClick={() => setTab(DETAIL_TABS.NOTES)}
          className={`px-3 py-2 whitespace-nowrap border-b-2 ${tab === DETAIL_TABS.NOTES ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Ghi chú & y tế
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === DETAIL_TABS.GENERAL && (
          /*
            Two-column on tablet (panel is full-width); single column on
            xl+ where the panel is locked to 420px and a two-column grid
            would squeeze both halves uncomfortably.
          */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] xl:grid-cols-1">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2.5 uppercase text-[11px]">Thông tin cá nhân</h4>
                <div className="space-y-2 text-[12px]">
                  <InfoRow label="Họ và tên" value={patient.full_name} />
                  <InfoRow label="Ngày sinh" value={formatDate(patient.dob)} />
                  <InfoRow label="Giới tính" value={patient.gender} />
                  <InfoRow label="Số điện thoại" value={formatPhone(patient.phone)} />
                  <InfoRow label="Email" value={patient.email} />
                  <InfoRow label="CCCD/CMND" value={patient.id_number} />
                  <InfoRow label="Địa chỉ" value={patient.address} />
                  <InfoRow label="Nghề nghiệp" value={patient.occupation} />
                  <InfoRow label="Hôn nhân" value={patient.marital_status} />
                </div>
              </div>
              {patient.deactivation_reason && (
                <div className="border-l-4 border-gray-300 bg-gray-50 px-3 py-2 rounded text-[11px] text-gray-700">
                  <strong>Lý do ngừng hoạt động:</strong> {patient.deactivation_reason}
                </div>
              )}
              {patient.force_create_reason && (
                <div className="border-l-4 border-amber-300 bg-amber-50 px-3 py-2 rounded text-[11px] text-amber-800">
                  <strong>Lý do tạo trùng:</strong> {patient.force_create_reason}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2.5 uppercase text-[11px]">Tổng quan</h4>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard icon={Calendar} value={stats.appointments} label="Lịch hẹn" />
                  <StatCard icon={FileText} value={stats.booking_requests} label="Yêu cầu online" />
                  <StatCard icon={Receipt} value={stats.loyalty} label="Điểm thưởng" />
                  <StatCard icon={Banknote} value={formatCurrency(stats.debt)} label="Công nợ" />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2.5 uppercase text-[11px]">Thông tin y tế</h4>
                <div className="space-y-2 text-[12px]">
                  <InfoRow label="Tiền sử bệnh" value={patient.medical_history} />
                  <InfoRow label="Dị ứng" value={patient.allergies} />
                </div>
              </div>

              {patient.merged_from && patient.merged_from.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2.5 uppercase text-[11px]">Các hồ sơ đã gộp vào</h4>
                  <ul className="space-y-1 text-[11px] text-gray-700">
                    {patient.merged_from.map((mp) => (
                      <li key={mp.id} className="flex items-center gap-2">
                        <Stethoscope size={12} className="text-gray-400" />
                        <span><strong>{mp.patient_code}</strong> - {mp.full_name} ({formatDate(mp.merged_at)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === DETAIL_TABS.APPOINTMENTS && (
          <div className="text-xs text-gray-600 space-y-2">
            <p>
              Hệ thống ghi nhận <strong>{stats.appointments}</strong> lịch hẹn và <strong>{stats.booking_requests}</strong> yêu cầu online liên kết với hồ sơ này.
            </p>
            <p className="text-gray-500">
              Chi tiết lịch hẹn được quản lý ở UC7 (đang triển khai). Khi UC7 hoàn thiện, danh sách lịch sẽ hiển thị tại đây.
            </p>
          </div>
        )}

        {tab === DETAIL_TABS.NOTES && (
          <div className="space-y-3 text-[12px]">
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2.5 uppercase text-[11px]">Tiền sử bệnh</h4>
              <p className="text-gray-700 whitespace-pre-line">{patient.medical_history || 'Không ghi nhận.'}</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2.5 uppercase text-[11px]">Dị ứng</h4>
              <p className="text-gray-700 whitespace-pre-line">{patient.allergies || 'Không ghi nhận.'}</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2.5 uppercase text-[11px]">Ghi chú lễ tân</h4>
              <p className="text-gray-700 whitespace-pre-line">{patient.notes || 'Không có ghi chú.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailPanel;
