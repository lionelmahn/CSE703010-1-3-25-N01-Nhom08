/**
 * UC7 - Validate du lieu phia FE (VR1-VR14).
 *
 * Cac validate o day la layer dau tien de cai thien UX. Backend phai re-validate.
 */

import { APPOINTMENT_STATUS } from './constants';

const RESCHEDULE_ALLOWED = [
  APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT,
  APPOINTMENT_STATUS.DOCTOR_ASSIGNED,
  APPOINTMENT_STATUS.CONFIRMED,
];

const CANCEL_ALLOWED = [
  APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT,
  APPOINTMENT_STATUS.DOCTOR_ASSIGNED,
  APPOINTMENT_STATUS.CONFIRMED,
];

const EDIT_ALLOWED = [
  APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT,
  APPOINTMENT_STATUS.DOCTOR_ASSIGNED,
  APPOINTMENT_STATUS.CONFIRMED,
];

const todayDateString = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export const canEdit = (appointment) =>
  appointment && EDIT_ALLOWED.includes(appointment.status);

export const canReschedule = (appointment) =>
  appointment && RESCHEDULE_ALLOWED.includes(appointment.status);

export const canCancel = (appointment) =>
  appointment && CANCEL_ALLOWED.includes(appointment.status)
    && appointment.status !== APPOINTMENT_STATUS.COMPLETED;

/**
 * VR1 - patient_id, VR2 - date, VR3 - time_slot, VR14 - branch.
 * Form payload: { patient_id, appointment_date, time_slot, branch_id, service_ids, source, notes }.
 */
export const validateCreateForm = (form, { timeSlots = [] } = {}) => {
  const errors = {};
  if (!form.patient_id) errors.patient_id = 'Vui long chon ho so benh nhan.';
  if (!form.branch_id) errors.branch_id = 'Vui long chon chi nhanh.';
  if (!form.appointment_date) {
    errors.appointment_date = 'Vui long chon ngay hen.';
  } else if (form.appointment_date < todayDateString()) {
    errors.appointment_date = 'Ngay hen khong duoc o qua khu.';
  }
  if (!form.time_slot) {
    errors.time_slot = 'Vui long chon khung gio hen.';
  } else {
    const slot = timeSlots.find((s) => s.id === form.time_slot);
    if (slot && slot.break) {
      errors.time_slot = 'Khung gio nay la ca nghi.';
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
};

export const validateRescheduleForm = (form, { timeSlots = [] } = {}) => {
  const errors = {};
  if (!form.appointment_date) errors.appointment_date = 'Vui long chon ngay hen moi.';
  else if (form.appointment_date < todayDateString()) errors.appointment_date = 'Ngay hen khong duoc o qua khu.';
  if (!form.time_slot) errors.time_slot = 'Vui long chon khung gio moi.';
  else {
    const slot = timeSlots.find((s) => s.id === form.time_slot);
    if (slot && slot.break) errors.time_slot = 'Khung gio nay la ca nghi.';
  }
  if (!form.reason || form.reason.trim().length < 3) {
    errors.reason = 'Vui long nhap ly do doi lich (toi thieu 3 ky tu).';
  }
  return { ok: Object.keys(errors).length === 0, errors };
};

export const validateCancelForm = (form) => {
  const errors = {};
  if (!form.reason || form.reason.trim().length < 3) {
    errors.reason = 'Vui long nhap ly do huy lich (toi thieu 3 ky tu).';
  }
  return { ok: Object.keys(errors).length === 0, errors };
};
