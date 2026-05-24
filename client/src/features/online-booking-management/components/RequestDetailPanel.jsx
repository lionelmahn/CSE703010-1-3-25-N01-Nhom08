import React, { useEffect, useState } from 'react';
import { History, Mail, MoreHorizontal, ChevronLeft } from 'lucide-react';

import StatusBadge from './StatusBadge';
import {
  EMAIL_STATUS_LABEL,
  INTERNAL_NOTE_MAX_LENGTH,
} from '../constants';
import {
  formatDateOnly,
  formatDateTime,
  formatPhone,
  getBranchLabel,
  getServiceLabels,
  getTimeSlotLabel,
  sanitizeInternalNote,
} from '../utils';
import useOnlineBookingCatalogs from '../hooks/useOnlineBookingCatalogs';

const InfoRow = ({ label, value, valueClassName = '' }) => (
  <div className="grid grid-cols-[110px_1fr] items-start gap-2">
    <span className="text-gray-500">{label}</span>
    <span className={`text-gray-900 ${valueClassName}`}>{value || '-'}</span>
  </div>
);

const RequestDetailPanel = ({
  request,
  onClose,
  onUpdateInternalNote,
  onResendEmail,
  submitting,
}) => {
  const catalogs = useOnlineBookingCatalogs();
  const [internalNote, setInternalNote] = useState('');
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    if (!request) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInternalNote(request.internal_note || '');

    setSavedNote(request.internal_note || '');
  }, [request?.id, request?.internal_note]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!request) {
    return (
      <div className="flex-[1] bg-white border rounded-lg shadow-sm flex flex-col items-center justify-center text-gray-400 text-xs min-h-[400px]">
        <div>Chon mot yeu cau o danh sach ben trai</div>
        <div className="text-[11px] mt-1">de xem chi tiet va xu ly.</div>
      </div>
    );
  }

  const noteDirty = sanitizeInternalNote(internalNote) !== savedNote;
  const noteCount = (internalNote || '').length;
  const noteOverflow = noteCount > INTERNAL_NOTE_MAX_LENGTH;

  const saveNote = async () => {
    const clean = sanitizeInternalNote(internalNote);
    await onUpdateInternalNote(clean);
    setSavedNote(clean);
  };

  return (
    <div className="flex-[1] bg-white border rounded-lg shadow-sm flex flex-col min-w-0">
      <div className="px-4 py-3 flex justify-between items-center border-b">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Bo chon"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-semibold text-gray-800 text-[13px] truncate">
            Chi tiet yeu cau: {request.code}
          </h2>
          <StatusBadge status={request.status} />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            className="px-2.5 py-1.5 border rounded bg-white text-gray-700 hover:bg-gray-50 text-[11px] font-medium flex items-center gap-1.5"
            title="Xem lich su xu ly"
          >
            <History size={12} /> Lich su
          </button>
          <button
            type="button"
            onClick={() => onResendEmail(request.status)}
            disabled={submitting || !request.email_status || request.email_status === 'none'}
            className="px-2.5 py-1.5 border rounded bg-white text-gray-700 hover:bg-gray-50 text-[11px] font-medium flex items-center gap-1.5 disabled:opacity-50"
            title="Gui lai email phan hoi"
          >
            <Mail size={12} /> Gui lai email
          </button>
          <button
            type="button"
            disabled
            className="px-2 py-1.5 border rounded bg-white text-gray-500 text-[11px] disabled:opacity-50"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-gray-800 mb-3 uppercase text-[11px]">Thong tin yeu cau</h3>
          <div className="space-y-2 text-[11px]">
            <InfoRow label="Ma yeu cau" value={<span className="font-medium">{request.code}</span>} />
            <InfoRow label="Ho va ten" value={<span className="font-medium">{request.name}</span>} />
            <InfoRow label="So dien thoai" value={<span className="font-medium">{formatPhone(request.phone)}</span>} />
            <InfoRow label="Email" value={<span className="font-medium">{request.email}</span>} />
            <InfoRow label="Dich vu quan tam" value={getServiceLabels(request.service_ids, catalogs.services)} />
            <InfoRow label="Chi nhanh" value={getBranchLabel(request.branch_id, catalogs.branches)} />
            <InfoRow label="Ngay mong muon" value={<span className="font-medium">{formatDateOnly(request.preferred_date)}</span>} />
            <InfoRow label="Khung gio mong muon" value={<span className="font-medium">{getTimeSlotLabel(request.preferred_time_slot_id, catalogs.timeSlots)}</span>} />
            <InfoRow label="Ghi chu" value={<span className="leading-tight">{request.customer_note}</span>} />
            <InfoRow label="Nguon tiep nhan" value="Landing page" />
            <InfoRow label="Ngay gui yeu cau" value={formatDateTime(request.submitted_at)} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2 uppercase text-[11px]">Thong tin khac</h3>
            <div className="space-y-2 text-[11px]">
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <span className="text-gray-500">Trang thai hien tai</span>
                <span><StatusBadge status={request.status} size="xs" /></span>
              </div>
              <InfoRow label="Nguoi xu ly" value={request.processed_by || '-'} />
              <InfoRow label="Ngay xu ly" value={request.processed_at ? formatDateTime(request.processed_at) : '-'} />
              <InfoRow label="Ma lich hen" value={request.appointment_code ? <span className="font-medium text-green-700">{request.appointment_code}</span> : '-'} />
              <InfoRow label="Email gui" value={EMAIL_STATUS_LABEL[request.email_status] || 'Chua gui'} />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-1.5">
              <h3 className="font-bold text-gray-800 uppercase text-[11px]">Ghi chu noi bo</h3>
              <button
                type="button"
                onClick={saveNote}
                disabled={!noteDirty || noteOverflow || submitting}
                className="text-[10px] text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
              >
                Luu ghi chu
              </button>
            </div>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Nhap ghi chu noi bo (khong hien thi cho khach hang)..."
              className={`w-full border rounded px-2 py-1.5 flex-1 min-h-[80px] focus:outline-none resize-none text-[11px] bg-yellow-50/30 ${noteOverflow ? 'border-red-300' : ''}`}
            />
            <div className={`text-right text-[10px] mt-0.5 ${noteOverflow ? 'text-red-500' : 'text-gray-400'}`}>
              {noteCount}/{INTERNAL_NOTE_MAX_LENGTH}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPanel;
