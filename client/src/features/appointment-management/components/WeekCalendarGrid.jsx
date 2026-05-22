import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { cardClassForStatus, formatSlotLabel } from './calendarCardClass';

/**
 * UC7 - Week view: 7 cot ngay x cac slot. Card hien ten BN ngan gon.
 */
const WeekCalendarGrid = ({ data, loading, onAppointmentClick, onEmptyClick }) => {
  if (loading) {
    return (
      <div className="grid place-items-center rounded-xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
        <Loader2 className="mb-2 h-6 w-6 animate-spin" />
        Dang tai lich hen...
      </div>
    );
  }
  if (!data) return null;

  const { slots = [], days = [], cells = {} } = data;
  const gridTemplate = `60px repeat(${days.length || 7}, minmax(120px, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="grid text-[12px]" style={{ gridTemplateColumns: gridTemplate }}>
        <div className="border-b border-slate-200 bg-slate-50 p-2"></div>
        {days.map((d) => (
          <div
            key={d.date}
            className={
              'border-b border-l border-slate-200 p-2 text-center ' +
              (d.is_today ? 'bg-blue-50 font-semibold' : 'bg-slate-50')
            }
          >
            <div className="text-[12px] capitalize text-slate-800">{d.weekday}</div>
            <div className="text-[11px] text-slate-500">{d.day_of_month}</div>
          </div>
        ))}

        {slots.map((slot) => (
          <React.Fragment key={slot.id}>
            <div
              className={
                'border-b border-slate-200 p-2 text-[11px] ' +
                (slot.break ? 'bg-slate-50 text-slate-400 italic' : 'text-slate-500')
              }
            >
              {slot.label || formatSlotLabel(slot.id)}
            </div>
            {days.map((day) => {
              const items = cells?.[day.date]?.[slot.id] || [];
              if (slot.break) {
                return (
                  <div
                    key={day.date + ':' + slot.id}
                    className="border-b border-l border-slate-200 bg-slate-50 p-1"
                  ></div>
                );
              }
              return (
                <div
                  key={day.date + ':' + slot.id}
                  className="space-y-1 border-b border-l border-slate-200 bg-white p-1"
                >
                  {items.map((apt) => (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => onAppointmentClick?.(apt)}
                      className={'block w-full truncate rounded border p-1 text-left text-[10px] ' + cardClassForStatus(apt.status)}
                    >
                      <span className="font-semibold">{apt.patient?.name || 'Khong xac dinh'}</span>
                      {apt.assigned_doctor?.name && (
                        <span className="ml-1 opacity-70">- {apt.assigned_doctor.name}</span>
                      )}
                    </button>
                  ))}
                  {items.length === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onEmptyClick?.({
                          appointment_date: day.date,
                          time_slot: slot.id,
                        })
                      }
                      className="group flex h-full min-h-[28px] w-full items-center justify-center text-slate-200 hover:text-slate-400"
                      title="Tao lich hen"
                    >
                      <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                    </button>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeekCalendarGrid;
