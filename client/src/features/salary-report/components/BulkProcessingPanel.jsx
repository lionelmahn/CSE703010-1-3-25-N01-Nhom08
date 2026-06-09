import React from 'react';
import { FilePlus2, RefreshCw, X } from 'lucide-react';
import { BULK_RESULT_LABEL, BULK_RESULT_STYLES, formatVnd } from '../utils';

// Panel #3 + UI11 - lap/tinh lai hang loat + ket qua tung bac si.
const BulkProcessingPanel = ({
  selectedCount,
  canManage,
  busy,
  results,
  onBulkCreate,
  onBulkRecalculate,
  onClearSelection,
  onClearResults,
}) => {
  if (!canManage) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">Xử lý hàng loạt</h3>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
          Đã chọn {selectedCount} bác sĩ
        </span>
        {selectedCount > 0 ? (
          <button type="button" onClick={onClearSelection} className="text-[11px] text-slate-500 hover:text-slate-700">
            Bỏ chọn
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={busy || selectedCount === 0}
            onClick={onBulkCreate}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <FilePlus2 size={14} /> Lập phiếu hàng loạt
          </button>
          <button
            type="button"
            disabled={busy || selectedCount === 0}
            onClick={onBulkRecalculate}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} /> Tính lại hàng loạt
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        * Hệ thống chỉ lập phiếu cho bác sĩ chưa có phiếu và tính lại phiếu chưa chốt. Không hỗ trợ chốt phiếu hàng loạt.
      </p>

      {results?.length ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-[11px] font-bold uppercase text-slate-600">Kết quả xử lý</span>
            <button type="button" onClick={onClearResults} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {results.map((r) => (
                <tr key={r.staff_id} className="border-t border-slate-100 first:border-t-0">
                  <td className="px-3 py-2 text-[11px] font-semibold text-slate-800">{r.full_name}</td>
                  <td className={`px-3 py-2 text-[11px] font-bold ${BULK_RESULT_STYLES[r.status] || 'text-slate-600'}`}>
                    {BULK_RESULT_LABEL[r.status] || r.status}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-600">{r.message}</td>
                  <td className="px-3 py-2 text-right text-[11px] font-semibold text-slate-900">
                    {r.total_amount != null ? formatVnd(r.total_amount) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};

export default BulkProcessingPanel;
