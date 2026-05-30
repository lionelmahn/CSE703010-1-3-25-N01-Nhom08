import React from 'react';
import { CloudUpload, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * UC12 - Hien thi trang thai auto-save (UI8).
 */
export default function AutoSaveIndicator({ pending, lastSavedAt, error }) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-600">
        <AlertCircle className="h-3.5 w-3.5" />
        Lỗi tự lưu: {error}
      </span>
    );
  }
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <CloudUpload className="h-3.5 w-3.5 animate-pulse" />
        Đang lưu nháp...
      </span>
    );
  }
  if (lastSavedAt) {
    const ts = lastSavedAt instanceof Date
      ? lastSavedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '';
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Đã lưu nháp lúc {ts}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      Chưa có thay đổi cần lưu
    </span>
  );
}
