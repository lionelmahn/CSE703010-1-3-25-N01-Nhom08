import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { salaryReportApi } from '@/api/salaryReportApi';
import { extractApiError } from '../utils';

const FORMATS = [
  { value: 'xlsx', label: 'Excel (.xlsx)', desc: 'Bảng tính chi tiết, có thể chỉnh sửa' },
  { value: 'pdf', label: 'PDF', desc: 'Báo cáo định dạng chuẩn để in/lưu trữ' },
  { value: 'csv', label: 'CSV', desc: 'Mở bằng Excel hoặc công cụ khác' },
];

const MIME = {
  csv: 'text/csv;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

const ExportDialog = ({ open, params, onClose }) => {
  const { toast } = useToast();
  const [format, setFormat] = useState('xlsx');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const res = await salaryReportApi.export({ ...params, format });
      const blob = new Blob([res.data], { type: MIME[format] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const period = `${params.period_year}-${String(params.period_month).padStart(2, '0')}`;
      link.download = `bao-cao-luong-${period}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Đã xuất báo cáo', description: `File ${format.toUpperCase()} đã được tạo.` });
      onClose();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Xuất báo cáo thất bại',
        description: extractApiError(err, 'Vui lòng thử lại.'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-[14px] font-extrabold text-slate-900">
            Xuất báo cáo lương {String(params.period_month).padStart(2, '0')}/{params.period_year}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 p-4">
          <p className="text-[11px] text-slate-500">Báo cáo được xuất theo bộ lọc hiện tại.</p>
          {FORMATS.map((f) => (
            <label
              key={f.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                format === f.value ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="export-format"
                className="mt-0.5"
                checked={format === f.value}
                onChange={() => setFormat(f.value)}
              />
              <span>
                <span className="block text-[12px] font-bold text-slate-800">{f.label}</span>
                <span className="block text-[11px] text-slate-500">{f.desc}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Download size={14} /> {busy ? 'Đang xuất...' : 'Xuất báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
