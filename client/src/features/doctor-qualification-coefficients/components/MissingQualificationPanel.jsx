import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatCoefficient, typeLabel } from '../utils';

const MissingQualificationPanel = ({ data, onCreate }) => {
  const missing = data?.missing || [];
  if (!missing.length) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800">
        Tất cả học hàm/học vị mặc định đã có cấu hình tại ngày đang chọn.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
        <AlertTriangle size={15} className="text-amber-600" />
        <div>
          <h3 className="text-[13px] font-extrabold text-amber-900">Thiếu cấu hình hệ số</h3>
          <p className="text-[11px] text-amber-700">{missing.length} học hàm/học vị đang dùng hệ số mặc định 1.00.</p>
        </div>
      </div>
      <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-5">
        {missing.map((item) => (
          <article key={item.qualification_code} className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
            <div className="text-[12px] font-bold text-slate-950">{item.qualification_name}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              {typeLabel(item.qualification_type)} · Ưu tiên {item.priority} · Mặc định {formatCoefficient(1)}
            </div>
            {onCreate ? (
              <button
                type="button"
                onClick={() => onCreate({
                  qualification_code: item.qualification_code,
                  qualification_type: item.qualification_type,
                  priority: item.priority,
                  coefficient: 1,
                  effective_from: data?.date,
                })}
                className="mt-3 rounded-md border border-amber-300 px-3 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
              >
                Cấu hình
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};

export default MissingQualificationPanel;
