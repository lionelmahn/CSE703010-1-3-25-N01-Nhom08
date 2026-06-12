import React from 'react';
import { Users, CalendarRange, Grid3x3 } from 'lucide-react';
import { VIEW_MODES } from '../utils';

const ICONS = { doctor: Users, month: CalendarRange, matrix: Grid3x3 };

// UC19 - chuyen 3 che do xem: theo bac si / theo thang / ma tran.
const ViewModeTabs = ({ value, onChange }) => (
  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
    {VIEW_MODES.map((mode) => {
      const Icon = ICONS[mode.value];
      const active = value === mode.value;
      return (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
            active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Icon size={14} /> {mode.label}
        </button>
      );
    })}
  </div>
);

export default ViewModeTabs;
