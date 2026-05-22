import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

import { FORCE_REASON_PRESETS } from '../constants';
import { formatDate, formatPhone, matchScoreTone, truncate } from '../utils';

/**
 * UC5 - Dialog hien thi danh sach ho so nghi trung khi tao moi (A2).
 *
 * Hai action chinh:
 *  - "Liên kết" voi ho so da chon -> tra ve ho so cu cho caller xu ly tiep.
 *  - "Tao ho so moi" -> bat buoc nhap ly do (force_create_reason) roi continue.
 */
const DuplicateCheckDialog = ({
  open,
  duplicates = [],
  inputSummary = {},
  loading = false,
  onClose,
  onLink,
  onForceCreate,
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [action, setAction] = useState('create');
  const [reasonPreset, setReasonPreset] = useState('');
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(duplicates[0]?.id || null);
    setAction(duplicates.length > 0 ? 'link' : 'create');
    setReasonPreset('');
    setReasonText('');
  }, [open, duplicates]);

  if (!open) return null;

  const handleContinue = () => {
    if (action === 'link') {
      const target = duplicates.find((d) => d.id === selectedId);
      if (!target) return;
      onLink?.(target);
      return;
    }
    const finalReason = reasonPreset === 'Khác (vui lòng nhập chi tiết)'
      ? reasonText.trim()
      : reasonPreset || reasonText.trim();
    if (!finalReason) {
      setReasonText('');
      return;
    }
    onForceCreate?.(finalReason);
  };

  const continueDisabled = loading
    || (action === 'link' && !selectedId)
    || (action === 'create' && !(reasonPreset || reasonText.trim()))
    || (action === 'create' && reasonPreset === 'Khác (vui lòng nhập chi tiết)' && !reasonText.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-center border-b">
          <h2 className="font-semibold text-gray-800 text-sm">Phát hiện hồ sơ nghi trùng</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 text-xs">
          <div className="bg-orange-50 border border-orange-100 text-orange-800 p-2 rounded flex items-start gap-2">
            <AlertTriangle size={14} className="text-orange-500 mt-0.5" />
            <span>Hệ thống tìm thấy các hồ sơ có thông tin tương tự. Vui lòng kiểm tra trước khi tiếp tục.</span>
          </div>

          <div>
            <div className="font-bold text-gray-800 border-b pb-1 mb-2">Thông tin vừa nhập</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-700">
              {inputSummary.full_name && (
                <div className="flex gap-1"><span className="text-gray-500">Họ tên:</span> <span className="font-medium">{inputSummary.full_name}</span></div>
              )}
              {inputSummary.phone && (
                <div className="flex gap-1"><span className="text-gray-500">SĐT:</span> <span className="font-medium">{formatPhone(inputSummary.phone)}</span></div>
              )}
              {inputSummary.email && (
                <div className="flex gap-1"><span className="text-gray-500">Email:</span> <span className="font-medium">{inputSummary.email}</span></div>
              )}
              {inputSummary.id_number && (
                <div className="flex gap-1"><span className="text-gray-500">CCCD:</span> <span className="font-medium">{inputSummary.id_number}</span></div>
              )}
              {inputSummary.dob && (
                <div className="flex gap-1"><span className="text-gray-500">DOB:</span> <span className="font-medium">{formatDate(inputSummary.dob)}</span></div>
              )}
            </div>
          </div>

          <div>
            <div className="font-bold text-gray-800 mb-2">Danh sách hồ sơ nghi trùng ({duplicates.length})</div>
            {duplicates.length === 0 ? (
              <div className="border rounded p-4 text-center text-gray-500 text-xs">Không phát hiện trùng.</div>
            ) : (
              <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-gray-50 border-b text-gray-500">
                    <tr>
                      <th className="p-2 font-medium w-8"></th>
                      <th className="p-2 font-medium">Mã BN</th>
                      <th className="p-2 font-medium">Họ tên</th>
                      <th className="p-2 font-medium">Ngày sinh</th>
                      <th className="p-2 font-medium">SĐT</th>
                      <th className="p-2 font-medium">Email</th>
                      <th className="p-2 font-medium text-center">Độ trùng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicates.map((d) => (
                      <tr
                        key={d.id}
                        className={`border-b cursor-pointer ${selectedId === d.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        onClick={() => { setSelectedId(d.id); setAction('link'); }}
                      >
                        <td className="p-2 text-center">
                          <input
                            type="radio"
                            checked={selectedId === d.id && action === 'link'}
                            onChange={() => { setSelectedId(d.id); setAction('link'); }}
                            className="accent-slate-800"
                          />
                        </td>
                        <td className="p-2 font-medium text-gray-900">{d.patient_code}</td>
                        <td className="p-2 text-gray-900">{d.full_name}</td>
                        <td className="p-2">{formatDate(d.dob)}</td>
                        <td className="p-2">{formatPhone(d.phone)}</td>
                        <td className="p-2 text-gray-500" title={d.email || ''}>{truncate(d.email || '-', 22)}</td>
                        <td className={`p-2 text-center font-bold ${matchScoreTone(d.score)}`}>
                          {Math.round(Number(d.score) || 0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-2 mt-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="radio"
                name="duplicate-action"
                value="link"
                checked={action === 'link'}
                onChange={() => setAction('link')}
                disabled={duplicates.length === 0}
                className="accent-slate-800"
              />
              Liên kết / sử dụng hồ sơ đã chọn
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-900">
              <input
                type="radio"
                name="duplicate-action"
                value="create"
                checked={action === 'create'}
                onChange={() => setAction('create')}
                className="accent-slate-800"
              />
              Tạo hồ sơ mới (cần lý do)
            </label>

            {action === 'create' && (
              <div className="pl-5 space-y-2">
                <label className="text-gray-500 block">Chọn lý do *</label>
                <select
                  value={reasonPreset}
                  onChange={(e) => setReasonPreset(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Chọn lý do --</option>
                  {FORCE_REASON_PRESETS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {reasonPreset === 'Khác (vui lòng nhập chi tiết)' && (
                  <textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    rows={2}
                    placeholder="Nhập chi tiết lý do..."
                    className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-2.5 border-t flex justify-between bg-gray-50 text-xs">
          <button type="button" onClick={onClose} className="px-4 py-1.5 border rounded bg-white hover:bg-gray-100">Hủy</button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={continueDisabled}
            className="px-4 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateCheckDialog;
