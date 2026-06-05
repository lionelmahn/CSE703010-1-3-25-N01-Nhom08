import React from 'react';
import {
  STATUS_DOT_STYLES,
  STATUS_LABEL,
  STATUS_TEXT_STYLES,
  formatDate,
  formatNumber,
  sortRatesAsc,
  versionLabel,
} from '../utils';

export const PANEL_CLASS = 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm';

export const DesignPanelHeader = ({ title, right }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
    <h2 className="truncate text-[12px] font-extrabold uppercase tracking-[0.1em] text-slate-900">
      {title}
    </h2>
    {right}
  </div>
);

export const RateSummaryCard = ({ label, value, detail, tone = 'slate' }) => {
  const tones = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-lg border p-3 ${tones[tone] || tones.slate}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] opacity-75">{label}</div>
      <div className="mt-1 text-[15px] font-extrabold">{value}</div>
      {detail && <div className="mt-1 text-[11px] opacity-75">{detail}</div>}
    </div>
  );
};

export const VersionTimeline = ({ rates = [], selectedId, draftRate = null, limit = 4, className = '' }) => {
  const source = draftRate ? [...rates.filter((rate) => rate.id !== draftRate.id), draftRate] : rates;
  const timeline = sortRatesAsc(source).slice(-limit);

  if (!timeline.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[12px] text-slate-500">
        Chưa có dữ liệu phiên bản.
      </div>
    );
  }

  return (
    <div className={`relative px-3 py-4 ${className}`}>
      <div className="absolute left-[12%] right-[12%] top-[38px] border-t-2 border-blue-200" />
      <div
        className="relative grid gap-3 text-center text-[10px]"
        style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}
      >
        {timeline.map((rate) => {
          const selected = selectedId === rate.id;
          const isDraft = rate.id === draftRate?.id;
          const dot = STATUS_DOT_STYLES[rate.status] || STATUS_DOT_STYLES.expired;
          const statusText = STATUS_TEXT_STYLES[rate.status] || STATUS_TEXT_STYLES.expired;

          return (
            <div key={rate.id} className={selected || isDraft ? 'text-slate-950' : 'text-slate-500'}>
              <p className={`mb-3 ${selected || isDraft ? 'font-bold' : ''}`}>{formatDate(rate.effective_from)}</p>
              <span
                className={`mx-auto block h-4 w-4 rounded-full border-2 bg-white ${dot} ${
                  selected || isDraft ? 'ring-4 ring-blue-50' : ''
                }`}
              />
              <p className="mt-3 font-extrabold">{versionLabel(source, rate)}</p>
              <p>{formatNumber(rate.hourly_rate)}</p>
              <p className={`font-semibold ${statusText}`}>
                {isDraft ? 'Sắp áp dụng' : STATUS_LABEL[rate.status] || rate.status || '-'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
