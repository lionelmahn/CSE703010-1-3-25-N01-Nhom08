import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const SalarySlipIssues = ({ issues = [] }) => {
  if (!issues.length) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[12px] text-emerald-700">
          <CheckCircle2 size={16} /> Không có cảnh báo. Dữ liệu đủ điều kiện để chốt.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
        Cảnh báo &amp; thông báo ({issues.length})
      </h3>
      <ul className="space-y-2">
        {issues.map((issue, index) => {
          const isError = issue.severity === 'error';
          return (
            <li
              key={`${issue.type}-${index}`}
              className={`flex items-start gap-3 rounded-lg border p-3 text-[11px] ${
                isError
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {isError ? (
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              ) : (
                <Info size={15} className="mt-0.5 shrink-0" />
              )}
              <span>{issue.message}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default SalarySlipIssues;
