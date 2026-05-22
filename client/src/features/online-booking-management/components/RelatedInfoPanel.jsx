import React from 'react';
import { Mail, RotateCw } from 'lucide-react';

import {
  ACTION_LABELS,
  EMAIL_STATUS,
  EMAIL_STATUS_LABEL,
} from '../constants';
import { formatDateTime } from '../utils';

const TimelineEntry = ({ entry, isLast }) => {
  const isFailed = entry.action === 'email_failed';
  const isRejected = entry.action === 'request_rejected';
  const isCreated = entry.action === 'appointment_created';
  const isCurrent = isLast;

  const dotColor = isFailed
    ? 'border-red-500 bg-red-100'
    : isRejected
      ? 'border-amber-500 bg-amber-100'
      : isCreated
        ? 'border-green-500 bg-green-100'
        : isCurrent
          ? 'border-blue-500 bg-blue-100'
          : 'border-gray-300 bg-white';

  return (
    <div className="relative pl-6 pb-4">
      {!isLast && (
        <div className="absolute left-[7px] top-3 bottom-0 w-px bg-gray-200" aria-hidden />
      )}
      <div
        className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 ${dotColor}`}
        aria-hidden
      />
      <div className="text-[10px] text-gray-500 mb-0.5">{formatDateTime(entry.at)}</div>
      <div className={`font-medium text-[11px] ${isFailed ? 'text-red-600' : 'text-gray-900'}`}>
        {ACTION_LABELS[entry.action] || entry.action}
      </div>
      {entry.note && <div className="text-[10px] text-gray-600 mt-0.5 leading-snug">{entry.note}</div>}
      <div className="text-[9px] text-gray-400 mt-0.5">{entry.actor || 'He thong'}</div>
    </div>
  );
};

const RelatedInfoPanel = ({
  request,
  isAdmin,
  onStartProcessing,
  onResendEmail,
  submitting,
}) => {
  if (!request) return null;

  const history = Array.isArray(request.history) ? [...request.history].sort((a, b) => (a.at || '').localeCompare(b.at || '')) : [];

  const canResend = [EMAIL_STATUS.FAILED, EMAIL_STATUS.PENDING_RETRY].includes(request.email_status);

  return (
    <div className="flex-1 bg-white border rounded-lg shadow-sm flex flex-col min-w-0 min-h-0 relative overflow-hidden">
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <div className="md:flex-1 border-b md:border-b-0 md:border-r flex flex-col p-4 bg-blue-50/30 min-h-0">
          <h3 className="font-semibold text-gray-800 text-[12px] mb-3">Thong tin lien quan</h3>
          <div className="space-y-2 text-[11px]">
            <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Ma yeu cau</span><span className="font-medium text-gray-900 truncate">{request.code}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Nguon</span><span className="text-gray-900">Landing page</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Ngay gui</span><span className="text-gray-900">{formatDateTime(request.submitted_at)}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Thiet bi</span><span className="text-gray-900 truncate">{request.device || '-'}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">IP</span><span className="text-gray-900">{request.ip || '-'}</span></div>
            <div className="w-full h-px bg-gray-200 my-1" />
            <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Trang thai</span><span className="text-gray-900 font-medium">{request.status}</span></div>
            <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Email gui</span><span className="text-gray-900">{EMAIL_STATUS_LABEL[request.email_status] || 'Chua gui'}</span></div>
            {request.appointment_code && (
              <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Lich hen</span><span className="text-green-700 font-medium">{request.appointment_code}</span></div>
            )}
            {request.proposed_slots?.length > 0 && (
              <div className="grid grid-cols-[90px_1fr]"><span className="text-gray-500">Da de xuat</span><span className="text-gray-900">{request.proposed_slots.length} khung</span></div>
            )}
          </div>
        </div>

        <div className="md:flex-1 flex flex-col p-4 min-h-0">
          <h3 className="font-semibold text-gray-800 text-[12px] mb-3 border-b pb-2">Lich su xu ly</h3>
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {history.length === 0 ? (
              <div className="text-xs text-gray-400 italic">Chua co lich su.</div>
            ) : (
              history.map((entry, idx) => (
                <TimelineEntry key={idx} entry={entry} isLast={idx === history.length - 1} />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="border-t bg-white p-2.5 flex flex-wrap justify-end gap-2 text-[11px]">
        {request.status === 'cho_xu_ly' && (
          <button
            type="button"
            onClick={onStartProcessing}
            disabled={submitting}
            className="px-3 py-1.5 border rounded bg-white text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCw size={12} /> Danh dau dang xu ly
          </button>
        )}
        {canResend && (
          <button
            type="button"
            onClick={() => onResendEmail(request.status)}
            disabled={submitting}
            className="px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            <Mail size={12} /> Gui lai email
          </button>
        )}
        {isAdmin && ['da_tu_choi', 'da_huy'].includes(request.status) && (
          <span className="text-[10px] text-amber-700 italic ml-auto">
            * Hanh dong mo lai dat o tab "Xu ly yeu cau"
          </span>
        )}
      </div>
    </div>
  );
};

export default RelatedInfoPanel;
