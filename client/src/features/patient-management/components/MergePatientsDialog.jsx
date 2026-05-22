import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Search, X } from 'lucide-react';

import { patientsApi } from '@/api/patientsApi';

import { NOTE_MAX_LENGTH, PATIENT_STATUS } from '../constants';
import { formatDate, formatPhone } from '../utils';
import { validateMergeForm } from '../validation';

const STEPS = [
  { key: 'primary', label: 'Chọn hồ sơ chính' },
  { key: 'secondary', label: 'Chọn hồ sơ phụ' },
  { key: 'confirm', label: 'Xác nhận' },
];

/**
 * UC5 (A4) - dialog gop ho so benh nhan trung.
 *
 * 3 buoc: chon primary -> chon secondary tu danh sach search -> xac nhan.
 */
const MergePatientsDialog = ({ open, primary, submitting = false, onClose, onSubmit }) => {
  const [step, setStep] = useState(0);
  const [primaryPatient, setPrimaryPatient] = useState(primary || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedSecondaryIds, setSelectedSecondaryIds] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(0);
    setPrimaryPatient(primary || null);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedSecondaryIds([]);
    setNote('');
  }, [open, primary]);

  // Auto-search debounce.
  useEffect(() => {
    if (!open || step !== 1) return undefined;
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return undefined;
    }
    let cancelled = false;
    const handler = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await patientsApi.lookup({ q: searchTerm.trim(), limit: 20 });
        if (!cancelled) {
          setSearchResults(
            results
              .filter((r) => r.id !== primaryPatient?.id && r.status !== PATIENT_STATUS.MERGED),
          );
        }
      } catch (caught) {
        console.warn('Failed to lookup patients for merge', caught);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [searchTerm, open, step, primaryPatient]);

  const selectedSecondaries = useMemo(
    () => searchResults.filter((r) => selectedSecondaryIds.includes(r.id)),
    [searchResults, selectedSecondaryIds],
  );

  const { isValid, errors } = validateMergeForm({
    primaryId: primaryPatient?.id,
    secondaryIds: selectedSecondaryIds,
  });

  if (!open) return null;

  const toggleSecondary = (id) => {
    setSelectedSecondaryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    if (!isValid || submitting) return;
    onSubmit?.({
      primary_id: primaryPatient.id,
      secondary_ids: selectedSecondaryIds,
      note: note.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-center border-b">
          <h2 className="font-semibold text-gray-800 text-sm">Gộp hồ sơ bệnh nhân</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 flex justify-between items-start relative border-b">
          <div className="absolute left-8 right-8 top-3.5 h-px bg-gray-200" />
          {STEPS.map((s, idx) => (
            <div key={s.key} className="flex flex-col items-center gap-1 bg-white px-1 relative z-10">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-semibold ${
                  idx <= step ? 'border-slate-800 text-slate-800' : 'border-gray-300 text-gray-400'
                }`}
              >
                {idx + 1}
              </div>
              <span className={`text-[10px] ${idx <= step ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 text-xs">
          {step === 0 && (
            <>
              <div className="font-bold text-gray-800">Hồ sơ chính (sẽ giữ lại)</div>
              {primaryPatient ? (
                <div className="border-2 border-slate-800 bg-slate-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">{primaryPatient.patient_code} - {primaryPatient.full_name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {formatDate(primaryPatient.dob)} • {formatPhone(primaryPatient.phone)} • {primaryPatient.email || '—'}
                  </div>
                </div>
              ) : (
                <div className="border rounded p-3 text-gray-500">Chưa chọn hồ sơ chính.</div>
              )}
              <p className="text-gray-500 mt-2">
                Hồ sơ chính sẽ giữ nguyên tất cả dữ liệu. Các hồ sơ phụ sẽ chuyển trạng thái <strong>Đã gộp</strong>.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="font-bold text-gray-800">Tìm hồ sơ phụ để gộp</div>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập mã, họ tên hoặc SĐT..."
                  className="w-full border rounded pl-7 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {searching ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 size={14} className="animate-spin" /> Đang tìm...</div>
              ) : searchTerm.length < 2 ? (
                <div className="text-gray-500">Gõ ít nhất 2 ký tự để tìm.</div>
              ) : searchResults.length === 0 ? (
                <div className="text-gray-500">Không có hồ sơ nào khớp (loại trừ hồ sơ chính và hồ sơ đã gộp).</div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-auto">
                  {searchResults.map((p) => {
                    const checked = selectedSecondaryIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`border rounded-lg p-2 flex gap-2 cursor-pointer items-center ${checked ? 'border-slate-800 bg-slate-50' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSecondary(p.id)}
                          className="accent-slate-800"
                        />
                        <div className="text-[11px] text-gray-700">
                          <div><strong>{p.patient_code}</strong> - {p.full_name}</div>
                          <div className="text-gray-500">
                            {formatDate(p.dob)} • {formatPhone(p.phone)} • {p.email || '—'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedSecondaryIds.length > 0 && (
                <p className="text-[11px] text-gray-500 mt-2">
                  Đã chọn {selectedSecondaryIds.length} hồ sơ phụ.
                </p>
              )}
              {errors.secondary_ids && (
                <p className="text-[11px] text-red-600">{errors.secondary_ids}</p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="font-bold text-gray-800">Xác nhận gộp hồ sơ</div>
              <div className="border rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-gray-500">Hồ sơ chính: </span>
                  <span className="font-medium text-gray-900">{primaryPatient?.patient_code} - {primaryPatient?.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Hồ sơ phụ sẽ gộp ({selectedSecondaries.length}):</span>
                  <ul className="list-disc list-inside text-gray-700 mt-1 space-y-0.5">
                    {selectedSecondaries.map((p) => (
                      <li key={p.id}>{p.patient_code} - {p.full_name}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <label className="text-gray-500 block mb-1">Ghi chú gộp hồ sơ (tuỳ chọn)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={NOTE_MAX_LENGTH}
                  placeholder="VD: cùng SĐT, xác minh từ bệnh nhân"
                  className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="bg-orange-50 border border-orange-100 text-orange-800 p-2 rounded flex items-start gap-2">
                <AlertTriangle size={14} className="text-orange-500 mt-0.5" />
                <span className="text-[11px]">
                  Sau khi gộp, hồ sơ phụ sẽ chuyển sang trạng thái "Đã gộp" và toàn bộ lịch hẹn / yêu cầu online sẽ được chuyển về hồ sơ chính. Thao tác này được ghi nhận vào lịch sử của cả hồ sơ chính và phụ.
                </span>
              </div>
            </>
          )}
        </div>

        <div className="p-2.5 border-t flex justify-between bg-gray-50 text-xs">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="px-4 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Quay lại
            </button>
          ) : (
            <button type="button" onClick={onClose} className="px-4 py-1.5 border rounded bg-white hover:bg-gray-100">
              Hủy
            </button>
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={(step === 0 && !primaryPatient) || (step === 1 && selectedSecondaryIds.length === 0)}
              className="px-4 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium disabled:opacity-50"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || submitting}
              className="px-4 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Xác nhận gộp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergePatientsDialog;
