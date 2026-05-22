import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { cardClassForStatus, formatSlotLabel } from './calendarCardClass';

/**
 * UC7 - Day view bam sat HTML thiet ke.
 *
 * Layout: grid `[60px gio | 1fr/ghe | ... | 80px Slot trong]`.
 *  - Cot dau: thoi diem.
 *  - Moi cot ghe = 1 bac si co lich hen trong ngay (Ghe N / Dr.X).
 *  - Cot cuoi: dem so chair con trong cho slot do.
 *  - Empty cell click -> mo dialog tao moi pre-fill date/slot/branch/doctor.
 *  - Card click -> mo dialog detail.
 *  - Lich chua phan cong bac si hien rieng o danh sach phia duoi.
 */
const DayCalendarGrid = ({ data, loading, onAppointmentClick, onEmptyClick }) => {
  if (loading) {
    return (
      <div className="grid place-items-center rounded-xl border border-slate-200 bg-white py-20 text-sm text-slate-500">
        <Loader2 className="mb-2 h-6 w-6 animate-spin" />
        Dang tai lich hen...
      </div>
    );
  }
  if (!data) return null;

  const { chairs = [], slots = [], cells = {}, unassigned = [], slot_free_counts: freeCounts = {} } = data;
  const gridTemplate = `60px repeat(${chairs.length || 1}, minmax(140px, 1fr)) 80px`;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div
          className="grid text-[12px]"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {/* HEADER ROW */}
          <div className="border-b border-slate-200 bg-slate-50 p-2"></div>
          {chairs.length === 0 ? (
            <div className="col-span-1 border-b border-l border-slate-200 bg-slate-50 p-2 text-center text-slate-400">
              Chua co lich hen voi bac si phu trach trong ngay nay
            </div>
          ) : (
            chairs.map((c) => (
              <div
                key={c.chair_no}
                className="border-b border-l border-slate-200 bg-slate-50 p-2 text-center"
              >
                <div className="text-[12px] font-bold text-slate-800">{c.label}</div>
                <div className="text-[11px] font-normal text-slate-500">{c.doctor?.name}</div>
              </div>
            ))
          )}
          <div className="border-b border-l border-slate-200 bg-slate-50 p-2 text-center text-[11px] font-semibold text-slate-600">
            Slot trong
          </div>

          {/* SLOT ROWS */}
          {slots.map((slot) => {
            const free = freeCounts[slot.id] ?? 0;
            return (
              <React.Fragment key={slot.id}>
                <div
                  className={
                    'border-b border-slate-200 p-2 text-[11px] ' +
                    (slot.break ? 'bg-slate-50 text-slate-400 italic' : 'text-slate-500')
                  }
                >
                  {slot.label || formatSlotLabel(slot.id)}
                  {slot.break && <div className="text-[10px]">Nghi trua</div>}
                </div>

                {chairs.length === 0 ? (
                  <div className="border-b border-l border-slate-200 bg-white p-1"></div>
                ) : (
                  chairs.map((chair) => {
                    const apt = cells?.[chair.doctor?.id]?.[slot.id];
                    if (apt) {
                      return (
                        <button
                          key={chair.chair_no + ':' + slot.id}
                          type="button"
                          onClick={() => onAppointmentClick?.(apt)}
                          className="m-1 rounded-lg border p-2 text-center text-[11px] hover:shadow"
                          style={{ minHeight: 64 }}
                        >
                          <div className={'rounded-md border p-1 ' + cardClassForStatus(apt.status)}>
                            <div className="truncate text-[12px] font-semibold">
                              {apt.patient?.name || 'Khong xac dinh'}
                            </div>
                            <div className="text-[10px] font-normal opacity-80">
                              {formatSlotLabel(apt.time_slot)}
                            </div>
                            {apt.code && (
                              <div className="text-[10px] font-mono opacity-60">{apt.code}</div>
                            )}
                          </div>
                        </button>
                      );
                    }
                    if (slot.break) {
                      return (
                        <div
                          key={chair.chair_no + ':' + slot.id}
                          className="border-b border-l border-slate-200 bg-slate-50 p-1"
                        ></div>
                      );
                    }
                    return (
                      <button
                        key={chair.chair_no + ':' + slot.id}
                        type="button"
                        onClick={() =>
                          onEmptyClick?.({
                            appointment_date: data.date,
                            time_slot: slot.id,
                            doctor: chair.doctor,
                          })
                        }
                        className="group flex items-center justify-center border-b border-l border-slate-200 bg-white p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-500"
                        title="Tao lich hen cho khung gio nay"
                      >
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                      </button>
                    );
                  })
                )}

                <div
                  className={
                    'border-b border-l border-slate-200 p-2 text-center text-[12px] font-semibold ' +
                    (slot.break ? 'bg-slate-50 text-slate-400' : 'text-slate-700')
                  }
                >
                  {slot.break ? '-' : free}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-700">
            Lich chua phan cong bac si ({unassigned.length})
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => onAppointmentClick?.(apt)}
                className={'rounded-lg border p-2 text-left hover:shadow ' + cardClassForStatus(apt.status)}
              >
                <div className="text-[12px] font-semibold">{apt.patient?.name || 'Khong xac dinh'}</div>
                <div className="text-[11px]">{formatSlotLabel(apt.time_slot)}</div>
                <div className="text-[10px] font-mono opacity-60">{apt.code}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayCalendarGrid;
