import React from 'react';
import { ExternalLink, FileQuestion } from 'lucide-react';

const th = 'px-2 py-2 text-left text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap';
const td = 'border-t border-slate-100 px-2 py-2 text-[11px] text-slate-700 whitespace-nowrap';

// UC19 - panel "Chua lap phieu" canh ma tran (A2/DR236). Click -> mo UC16 de lap.
const MissingPayrollPanel = ({ cases, canOpenSlip, onOpenSlip, limit = 8 }) => {
  const list = cases || [];
  const shown = list.slice(0, limit);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
          Chưa lập phiếu (có ca làm)
        </h3>
        <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
          {list.length}
        </span>
      </div>

      {shown.length ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Bác sĩ</th>
                <th className={th}>Tháng</th>
                <th className={`${th} text-right`}>Số ca</th>
                <th className={`${th} text-center`}>Mở</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={`${c.staff_id}-${c.month}`} className="hover:bg-slate-50">
                  <td className={`${td} font-semibold text-slate-800`}>{c.full_name}</td>
                  <td className={td}>Tháng {c.month}</td>
                  <td className={`${td} text-right`}>{c.shift_count}</td>
                  <td className={`${td} text-center`}>
                    <button
                      type="button"
                      disabled={!canOpenSlip}
                      onClick={() => onOpenSlip(c.staff_id, c.month)}
                      title={canOpenSlip ? 'Lập phiếu lương (UC16)' : 'Bạn không có quyền lập phiếu'}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-40"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length > limit ? (
            <div className="border-t border-slate-100 px-4 py-2 text-center text-[11px] text-slate-500">
              và {list.length - limit} trường hợp khác…
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <FileQuestion size={22} className="text-slate-300" />
          <p className="text-[12px] font-semibold text-slate-500">Không có trường hợp chưa lập phiếu</p>
          <p className="text-[11px] text-slate-400">Mọi bác sĩ có ca làm đều đã có phiếu lương.</p>
        </div>
      )}
    </section>
  );
};

export default MissingPayrollPanel;
