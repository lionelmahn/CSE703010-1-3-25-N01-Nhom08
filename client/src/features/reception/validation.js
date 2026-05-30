/**
 * UC11 - Validate input FE truoc khi goi API. Mirror server FormRequest.
 */
import { ARRIVAL_FLAGS } from './constants';

export const validateCheckInPayload = (payload) => {
  const errors = {};
  if (payload.arrival_flag && !ARRIVAL_FLAGS[payload.arrival_flag]) {
    errors.arrival_flag = 'Co thoi gian den khong hop le.';
  }
  if (payload.note && payload.note.length > 500) {
    errors.note = 'Ghi chu khong duoc qua 500 ky tu.';
  }
  return errors;
};

export const validateNoShowPayload = (payload) => {
  const errors = {};
  if (!payload.reason || payload.reason.trim().length < 3) {
    errors.reason = 'Vui long chon ly do khong den.';
  } else if (payload.reason.length > 191) {
    errors.reason = 'Ly do khong duoc qua 191 ky tu.';
  }
  if (payload.note && payload.note.length > 500) {
    errors.note = 'Ghi chu khong duoc qua 500 ky tu.';
  }
  return errors;
};

export const validateCancelCheckInPayload = (payload) => {
  const errors = {};
  if (!payload.reason || payload.reason.trim().length < 3) {
    errors.reason = 'Vui long nhap ly do huy check-in.';
  } else if (payload.reason.length > 191) {
    errors.reason = 'Ly do khong duoc qua 191 ky tu.';
  }
  if (payload.note && payload.note.length > 500) {
    errors.note = 'Ghi chu khong duoc qua 500 ky tu.';
  }
  return errors;
};
