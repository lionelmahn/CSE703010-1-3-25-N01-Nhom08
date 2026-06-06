import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { levelDefault, levelLabel } from '../utils';

const MissingComplexityPanel = ({ data, onCreate }) => {
  const missing = data?.missing || [];
  if (!data || Number(data.missing_count || 0) === 0) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700">
        Tất cả dịch vụ trong bộ lọc hiện tại đã có đủ 4 mức hệ số.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <h2 className="text-[13px] font-extrabold text-amber-900">Thiếu cấu hình cho UC12</h2>
            <p className="mt-1 text-[12px] text-amber-800">
              Còn {data.missing_count} ô chưa có hệ số. UC12 sẽ fallback +0.00 và ghi audit warning khi gặp trường hợp này.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {missing.slice(0, 12).map((item) => (
          <button
            key={`${item.service_id}-${item.processing_level}`}
            type="button"
            onClick={() => onCreate?.({
              service_id: item.service_id,
              processing_level: item.processing_level,
              coefficient: levelDefault(item.processing_level),
              effective_from: data.date,
            })}
            className="rounded-md border border-amber-200 bg-white px-3 py-2 text-left text-[11px] text-amber-900 hover:bg-amber-100"
            disabled={!onCreate}
          >
            <span className="block font-bold">{item.service_code} - {item.service_name}</span>
            <span>{levelLabel(item.processing_level)}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default MissingComplexityPanel;
