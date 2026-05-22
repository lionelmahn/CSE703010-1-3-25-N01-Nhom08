import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

import { REASON_MAX_LENGTH } from '../constants';

/**
 * UC5 - dialog xac nhan chuyen ho so sang "Ngung hoat dong" (A3).
 *
 * BE se kiem tra con nghiep vu dang dien ra (E8). Neu fail BE tra 422.
 */
const DeactivateDialog = ({ open, patient, submitting = false, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white border rounded-lg shadow-xl w-full max-w-md flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-center border-b">
          <h2 className="font-semibold text-gray-800 text-sm">Chuyển hồ sơ sang Ngừng hoạt động</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 text-xs">
          <div className="bg-orange-50 border border-orange-100 text-orange-800 p-2 rounded flex items-start gap-2">
            <AlertTriangle size={14} className="text-orange-500 mt-0.5" />
            <span>
              Hồ sơ <strong>{patient?.patient_code || ''} - {patient?.full_name || ''}</strong> sẽ chuyển sang trạng thái <strong>Ngừng hoạt động</strong>. Bệnh nhân sẽ không xuất hiện ở các flow tiếp nhận / đặt lịch mới cho đến khi được mở lại.
            </span>
          </div>
          <div>
            <label className="text-gray-500 mb-1 block">Lý do (tuỳ chọn)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={REASON_MAX_LENGTH}
              placeholder="VD: Bệnh nhân yêu cầu tạm ngừng liên hệ"
              className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">{reason.length}/{REASON_MAX_LENGTH} ký tự</p>
          </div>
        </div>

        <div className="p-2.5 border-t flex justify-between bg-gray-50 text-xs">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-1.5 border rounded bg-white hover:bg-gray-100">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSubmit?.(reason.trim() || null)}
            disabled={submitting}
            className="px-4 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateDialog;
