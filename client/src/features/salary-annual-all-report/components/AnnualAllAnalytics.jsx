import React, { useState } from 'react';
import { formatVnd, formatNumber, STATUS_DIST_COLORS, percent } from '../utils';

const PAD_X = 6;
const PAD_TOP = 10;
const PAD_BOTTOM = 14;

const ChartCard = ({ title, hint, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">{title}</h3>
      {hint ? <span className="text-[10.5px] text-slate-400">{hint}</span> : null}
    </div>
    {children}
  </section>
);

// Bieu do duong (SVG thuan) - dung cho quy luong + ti le hoan thanh.
const MiniLineChart = ({ points, formatValue, color = '#0f172a', target }) => {
  const [hover, setHover] = useState(null);
  const data = points || [];
  if (!data.length) return <div className="h-56 w-full" />;

  const values = data.map((p) => Number(p.value || 0));
  const max = Math.max(...values, target || 0, 1);
  const xAt = (i) => (data.length <= 1 ? 50 : PAD_X + (i / (data.length - 1)) * (100 - 2 * PAD_X));
  const yAt = (v) => PAD_TOP + (1 - v / max) * (100 - PAD_TOP - PAD_BOTTOM);
  const line = data.map((p, i) => `${xAt(i)},${yAt(Number(p.value || 0))}`).join(' ');

  return (
    <div className="relative h-56 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD_TOP + t * (100 - PAD_TOP - PAD_BOTTOM);
          return (
            <line key={t} x1={PAD_X} y1={y} x2={100 - PAD_X} y2={y} stroke="#e2e8f0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          );
        })}
        {target ? (
          <line
            x1={PAD_X}
            y1={yAt(target)}
            x2={100 - PAD_X}
            y2={yAt(target)}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="3 2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>

      {data.map((p, i) => (
        <div
          key={p.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${xAt(i)}%`, top: `${yAt(Number(p.value || 0))}%` }}
        >
          <button
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            aria-label={p.label}
            className={`block cursor-pointer rounded-full border-2 bg-white p-0 transition-all ${
              hover === i ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'
            }`}
            style={{ borderColor: color }}
          />
        </div>
      ))}

      {hover !== null
        ? (() => {
            const p = data[hover];
            const left = xAt(hover);
            const top = yAt(Number(p.value || 0));
            const anchorX = left < 14 ? '0' : left > 86 ? '-100%' : '-50%';
            return (
              <div
                className="pointer-events-none absolute z-10 w-40 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
                style={{ left: `${left}%`, top: `calc(${top}% - 12px)`, transform: `translate(${anchorX}, -100%)` }}
              >
                <p className="text-[11px] font-bold text-slate-700">{p.label}</p>
                <p className="mt-0.5 text-[13px] font-extrabold text-slate-900">{formatValue(p.value)}</p>
              </div>
            );
          })()
        : null}

      <div className="absolute inset-x-0 bottom-0 flex justify-between px-[6%] text-[9px] font-medium text-slate-400">
        {data.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
};

// Bieu do tron (donut) phan bo trang thai.
const DonutChart = ({ segments }) => {
  const total = segments.reduce((acc, s) => acc + s.count, 0);
  const r = 38;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
          {total > 0 &&
            segments.map((s) => {
              if (!s.count) return null;
              const len = (s.count / total) * c;
              const seg = (
                <circle
                  key={s.key}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-extrabold text-slate-900">{formatNumber(total)}</span>
          <span className="text-[9px] font-semibold uppercase text-slate-400">Bản ghi</span>
        </div>
      </div>

      <ul className="grid flex-1 gap-1.5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[11px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="mr-auto text-slate-600">{s.label}</span>
            <span className="font-bold text-slate-800">{s.count}</span>
            <span className="w-12 text-right text-slate-400">{percent(s.count, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Bieu do thanh ngang top 5 bac si.
const HBarList = ({ items }) => {
  const max = Math.max(...items.map((i) => i.total_amount), 1);
  if (!items.length) return <p className="py-8 text-center text-[12px] text-slate-400">Chưa có dữ liệu.</p>;

  return (
    <ul className="grid gap-2.5">
      {items.map((it, idx) => (
        <li key={it.staff_id} className="text-[11px]">
          <div className="mb-1 flex items-center justify-between">
            <span className="truncate font-semibold text-slate-700">
              {idx + 1}. {it.full_name}
            </span>
            <span className="ml-2 shrink-0 font-bold text-slate-900">{formatVnd(it.total_amount)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.max(2, (it.total_amount / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

// UC19 - khu phan tich: 4 bieu do tong hop tu summary.
const AnnualAllAnalytics = ({ summary }) => {
  if (!summary) return null;

  const fundPoints = (summary.monthly_series || []).map((m) => ({ label: `T${m.month}`, value: m.fund }));
  const completionPoints = (summary.monthly_series || []).map((m) => ({ label: `T${m.month}`, value: m.completion }));
  const segments = (summary.status_distribution || []).map((s) => ({ ...s, color: STATUS_DIST_COLORS[s.key] }));

  return (
    <div>
      <h2 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-slate-600">Phân tích tiền lương</h2>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <ChartCard title="Quỹ lương theo tháng" hint="VNĐ (đã chốt)">
          <MiniLineChart points={fundPoints} formatValue={formatVnd} color="#0f172a" />
        </ChartCard>
        <ChartCard title="Phân bố trạng thái phiếu">
          <DonutChart segments={segments} />
        </ChartCard>
        <ChartCard title="Top 5 bác sĩ theo lương năm" hint="VNĐ">
          <HBarList items={summary.top_doctors || []} />
        </ChartCard>
        <ChartCard title="Tỉ lệ hoàn thành theo tháng" hint="% phiếu đã chốt">
          <MiniLineChart points={completionPoints} formatValue={(v) => `${formatNumber(v, 1)}%`} color="#10b981" target={100} />
        </ChartCard>
      </div>
    </div>
  );
};

export default AnnualAllAnalytics;
