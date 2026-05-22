/**
 * UC6.2 - Frontend validators (VR1-VR12).
 *
 * Tat ca tra ve { ok, errors } voi errors la map field -> message.
 * Khi tat ca action chi can `disable submit + show toast` co the dung helper
 * `firstError`.
 */

import {
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
  TIME_SLOTS,
} from '@/features/online-booking/data';
import {
  INTERNAL_NOTE_MAX_LENGTH,
  PROCESSABLE_STATUSES,
  REQUEST_STATUS,
  TERMINAL_STATUSES,
} from './constants';

const ok = () => ({ ok: true, errors: {} });
const fail = (errors) => ({ ok: false, errors });

export const firstError = (errors) => Object.values(errors || {})[0] || '';

// VR1: yeu cau dang o trang thai cho phep xu ly.
export const canProcessRequest = (request, { isAdmin = false } = {}) => {
  if (!request) return fail({ status: 'Khong tim thay yeu cau' });
  if (TERMINAL_STATUSES.includes(request.status)) {
    if (!isAdmin) {
      return fail({ status: 'Yeu cau da o trang thai ket thuc, khong the xu ly tiep' });
    }
  }
  if (request.status === REQUEST_STATUS.REJECTED && !isAdmin) {
    return fail({ status: 'Yeu cau da bi tu choi, chi admin moi co the mo lai' });
  }
  if (!PROCESSABLE_STATUSES.includes(request.status) && !isAdmin) {
    return fail({ status: 'Trang thai hien tai khong cho phep thao tac nay' });
  }
  return ok();
};

// VR2: phai lien ket / tao ho so benh nhan truoc khi xac nhan.
// VR3 + VR4: ngay/gio hen hop le.
// VR11 + VR12: dich vu + chi nhanh con active.
// VR8: khong tao thua appointment.
export const validateConfirmPayload = (request, payload) => {
  const errors = {};

  if (!request) {
    errors.request = 'Khong tim thay yeu cau';
    return fail(errors);
  }
  if (request.appointment_id) {
    errors.duplicate = 'Yeu cau nay da co lich hen, khong the tao moi'; // VR8
    return fail(errors);
  }
  if (!request.patient_id) {
    errors.patient = 'Vui long lien ket hoac tao ho so benh nhan truoc'; // VR2
  }

  if (!payload?.date) {
    errors.date = 'Ngay hen khong hop le'; // VR3
  } else {
    const d = new Date(payload.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(d.getTime())) {
      errors.date = 'Ngay hen khong hop le';
    } else if (d.getTime() < today.getTime()) {
      errors.date = 'Ngay hen khong duoc o qua khu';
    }
  }

  if (!payload?.time_slot_id || !TIME_SLOTS.some((t) => t.id === payload.time_slot_id && !t.break)) {
    errors.time_slot = 'Khung gio khong hop le hoac la khung nghi trua'; // VR4
  }

  const service = BOOKING_SERVICES.find((s) => s.id === payload?.service_id || (Array.isArray(payload?.service_ids) && payload.service_ids.includes(s.id)));
  if (!service) {
    errors.service = 'Vui long chon dich vu';
  } else if (!service.active) {
    errors.service = `Dich vu "${service.label}" da tam ngung tiep nhan`; // VR11
  }

  const branch = CLINIC_BRANCHES.find((b) => b.id === payload?.branch_id);
  if (!branch) {
    errors.branch = 'Vui long chon chi nhanh';
  } else if (!branch.active) {
    errors.branch = `Chi nhanh "${branch.label}" hien khong tiep nhan`; // VR12
  }

  return Object.keys(errors).length === 0 ? ok() : fail(errors);
};

// VR6: phai co it nhat 1 khung gio thay the hop le.
export const validateProposePayload = (request, payload) => {
  const errors = {};
  if (!request) {
    errors.request = 'Khong tim thay yeu cau';
    return fail(errors);
  }
  const slots = Array.isArray(payload?.slots) ? payload.slots : [];
  if (slots.length === 0) {
    errors.slots = 'Vui long them it nhat mot khung gio thay the'; // VR6
    return fail(errors);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  slots.forEach((slot, idx) => {
    if (!slot?.date) {
      errors[`slot_${idx}_date`] = `Khung ${idx + 1}: thieu ngay`;
      return;
    }
    const d = new Date(slot.date);
    if (Number.isNaN(d.getTime()) || d.getTime() < today.getTime()) {
      errors[`slot_${idx}_date`] = `Khung ${idx + 1}: ngay khong hop le`;
    }
    if (!slot?.time_slot_id || !TIME_SLOTS.some((t) => t.id === slot.time_slot_id && !t.break)) {
      errors[`slot_${idx}_time`] = `Khung ${idx + 1}: chua chon khung gio hop le`;
    }
  });

  if (!payload?.reason || String(payload.reason).trim().length < 5) {
    errors.reason = 'Vui long nhap ly do de xuat (it nhat 5 ky tu)';
  }

  return Object.keys(errors).length === 0 ? ok() : fail(errors);
};

// VR5: phai nhap ly do tu choi.
export const validateRejectPayload = (payload) => {
  const errors = {};
  const reason = String(payload?.reason || '').trim();
  if (!reason || reason.length < 5) {
    errors.reason = 'Ly do tu choi bat buoc nhap (it nhat 5 ky tu)';
  } else if (reason.length > 500) {
    errors.reason = 'Ly do tu choi khong qua 500 ky tu';
  }
  return Object.keys(errors).length === 0 ? ok() : fail(errors);
};

// VR10: ghi chu noi bo do dai + xss.
export const validateInternalNote = (note) => {
  const errors = {};
  if (note && String(note).length > INTERNAL_NOTE_MAX_LENGTH) {
    errors.internal_note = `Ghi chu khong duoc qua ${INTERNAL_NOTE_MAX_LENGTH} ky tu`;
  }
  if (note && /<script/i.test(note)) {
    errors.internal_note = 'Ghi chu chua noi dung khong hop le';
  }
  return Object.keys(errors).length === 0 ? ok() : fail(errors);
};

// Validate khi tao patient moi (so toi thieu).
export const validateNewPatient = (payload) => {
  const errors = {};
  if (!payload?.name || String(payload.name).trim().length < 2) {
    errors.name = 'Vui long nhap ho ten';
  }
  if (!payload?.phone || String(payload.phone).replace(/\D/g, '').length < 9) {
    errors.phone = 'So dien thoai khong hop le';
  }
  if (payload?.email && !/^[\w._%+-]+@[\w.-]+\.[a-z]{2,}$/i.test(payload.email)) {
    errors.email = 'Email khong hop le';
  }
  return Object.keys(errors).length === 0 ? ok() : fail(errors);
};
