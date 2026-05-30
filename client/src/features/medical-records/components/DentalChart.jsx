import React, { useMemo } from 'react';

/**
 * UC12 - Dental Chart SVG don gian voi 32 rang FDI numbering.
 *
 * Quadrants (theo FDI):
 *  - 1x (11-18): Upper right (BN nhin -> phia phai ben tren)
 *  - 2x (21-28): Upper left
 *  - 3x (31-38): Lower left
 *  - 4x (41-48): Lower right
 *
 * Hien thi tu trai sang phai (goc nhin nguoi xem):
 *   row 1: 18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28
 *   row 2: 48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38
 *
 * Click -> onSelect(toothFdi). Co the disable.
 */
const TOP_ROW = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28'];
const BOTTOM_ROW = ['48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38'];

export default function DentalChart({ entries = [], onSelect, selectedFdi, disabled }) {
  const map = useMemo(() => {
    const m = new Map();
    entries.forEach((e) => {
      if (!e?.tooth_fdi) return;
      m.set(String(e.tooth_fdi), e);
    });
    return m;
  }, [entries]);

  const renderTooth = (fdi) => {
    const entry = map.get(fdi);
    const isSelected = selectedFdi === fdi;
    const color = entry?.status?.color || (entry?.note ? '#fde68a' : '#ffffff');
    const stroke = isSelected ? '#3b82f6' : entry ? '#475569' : '#cbd5e1';
    return (
      <button
        key={fdi}
        type="button"
        disabled={disabled}
        onClick={() => onSelect?.(fdi)}
        title={entry?.status?.name ? `${fdi} - ${entry.status.name}` : fdi}
        className={`relative flex h-10 w-8 flex-col items-center justify-center rounded text-[10px] font-semibold transition ${disabled ? 'cursor-default opacity-80' : 'hover:ring-2 hover:ring-blue-200'}`}
        style={{ background: color, border: `2px solid ${stroke}` }}
      >
        <span className="leading-none">{fdi}</span>
        {entry?.note ? (
          <span className="absolute -bottom-1 right-0 h-1.5 w-1.5 rounded-full bg-amber-500" />
        ) : null}
      </button>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-center text-[10px] uppercase tracking-wide text-slate-400 mb-1">
        Hàm trên · Phải ← → Trái
      </div>
      <div className="flex items-center justify-center gap-1 mb-1">
        {TOP_ROW.slice(0, 8).map(renderTooth)}
        <div className="w-2" />
        {TOP_ROW.slice(8).map(renderTooth)}
      </div>
      <div className="h-px bg-slate-200 my-2" />
      <div className="flex items-center justify-center gap-1">
        {BOTTOM_ROW.slice(0, 8).map(renderTooth)}
        <div className="w-2" />
        {BOTTOM_ROW.slice(8).map(renderTooth)}
      </div>
      <div className="text-center text-[10px] uppercase tracking-wide text-slate-400 mt-1">
        Hàm dưới
      </div>
    </div>
  );
}
