import { useMemo } from 'react';
import {
  EARLY_THRESHOLD_MIN,
  LATE_LIMIT,
  ON_TIME_LATE_LIMIT,
} from '../constants';

/**
 * UC11 - Tinh `arrival_flag` o FE de hien thi truoc khi user submit (UI4).
 * Server cung tinh lai (BR17) - day chi la goi y de FE highlight radio dung.
 *
 * @param {{ appointmentDate: string, timeSlot: string }} appointment
 * @param {Date} [now]
 */
export const computeArrivalFlag = (appointment, now = new Date()) => {
  if (!appointment?.time_slot || !appointment?.appointment_date) return 'on_time';
  const slot = String(appointment.time_slot);
  const [startRaw] = slot.split('-');
  if (!startRaw) return 'on_time';
  const hour = parseInt(startRaw.slice(0, 2), 10);
  const min = startRaw.length > 2 ? parseInt(startRaw.slice(2), 10) : 0;
  if (Number.isNaN(hour)) return 'on_time';

  const start = new Date(appointment.appointment_date);
  start.setHours(hour, min, 0, 0);

  const diffMin = Math.round((now.getTime() - start.getTime()) / 60000);
  if (diffMin <= -EARLY_THRESHOLD_MIN) return 'early';
  if (diffMin <= ON_TIME_LATE_LIMIT) return 'on_time';
  if (diffMin <= LATE_LIMIT) return 'late';
  return 'very_late';
};

export const useArrivalFlag = (appointment) => useMemo(
  () => computeArrivalFlag(appointment),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [appointment?.time_slot, appointment?.appointment_date],
);

export default useArrivalFlag;
