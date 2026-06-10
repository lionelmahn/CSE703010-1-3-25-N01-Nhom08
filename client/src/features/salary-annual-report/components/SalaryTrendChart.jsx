import React, { useState } from 'react';
import MonthStatusBadge from './MonthStatusBadge';
import { formatVnd } from '../utils';

// Vung dem (theo %) cua khung ve.
const PAD_X = 6;
const PAD_TOP = 10;
const PAD_BOTTOM = 14;

// SalaryTrendChart - bieu do duong xu huong luong 12 thang (SVG thuan, khong
// them thu viin). Hover diem -> tooltip Thang / Luong / Trang thai.
const SalaryTrendChart = ({ months }) => {
  const [hover, setHover] = useState(null);
  const data = months || [];

  if (!data.length) return null;

  const values = data.map((m) => Number(m.total_amount || 0));
  const max = Math.max(...values, 1);

  const xAt = (i) => (data.length <= 1 ? 50 : PAD_X + (i / (data.length - 1)) * (100 - 2 * PAD_X));
  const yAt = (v) => PAD_TOP + (1 - v / max) * (100 - PAD_TOP - PAD_BOTTOM);

  const points = data.map((m, i) => `${xAt(i)},${yAt(Number(m.total_amount || 0))}`).join(' ');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
          Xu hướng lương theo tháng
        </h3>
        <span className="text-[11px] text-slate-500">Lương hằng tháng (VNĐ)</span>
      </div>

      <div className="relative h-72 w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD_TOP + t * (100 - PAD_TOP - PAD_BOTTOM);
            return (
              <line
                key={t}
                x1={PAD_X}
                y1={y}
                x2={100 - PAD_X}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          <polyline
            points={points}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Diem du lieu + vung hover (overlay HTML -> diem tron, de hover) */}
        {data.map((m, i) => {
          const active = hover === i;
          return (
            <div
              key={m.month}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${xAt(i)}%`, top: `${yAt(Number(m.total_amount || 0))}%` }}
            >
              <button
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                aria-label={`Tháng ${m.month}`}
                className={`block cursor-pointer rounded-full border-2 border-slate-900 bg-white p-0 transition-all ${
                  active ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'
                }`}
              />
            </div>
          );
        })}

        {/* Tooltip */}
        {hover !== null
          ? (() => {
              const m = data[hover];
              const left = xAt(hover);
              const top = yAt(Number(m.total_amount || 0));
              const anchorX = left < 14 ? '0' : left > 86 ? '-100%' : '-50%';
              return (
                <div
                  className="pointer-events-none absolute z-10 w-44 rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg"
                  style={{ left: `${left}%`, top: `calc(${top}% - 14px)`, transform: `translate(${anchorX}, -100%)` }}
                >
                  <p className="text-[11px] font-bold text-slate-700">
                    Tháng {String(m.month).padStart(2, '0')}/{m.year}
                  </p>
                  <p className="mt-0.5 text-[13px] font-extrabold text-slate-900">
                    {m.total_amount != null ? formatVnd(m.total_amount) : '--'}
                  </p>
                  <div className="mt-1">
                    <MonthStatusBadge status={m.status} />
                  </div>
                </div>
              );
            })()
          : null}

        {/* Nhan truc thang */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-[6%] text-[9px] font-medium text-slate-400">
          {data.map((m) => (
            <span key={m.month}>T{m.month}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SalaryTrendChart;
