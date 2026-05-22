/**
 * UC5 - Frontend validation (giong rules o Laravel Form Request).
 *
 * Validation rules (theo dac ta):
 *  VR1: full_name bat buoc, max 191.
 *  VR2: phone bat buoc, dung dinh dang VN (E2).
 *  VR3: email optional, dung dinh dang neu nhap (E3).
 *  VR4: dob optional, khong tuong lai, khong qua 150 nam (E4).
 *  VR5: id_number optional, 9-12 chu so.
 *  VR6: source bat buoc.
 *  VR7: gender optional, thuoc {Nam, Nữ, Khác}.
 */

import {
  isValidDob,
  isValidEmail,
  isValidIdNumber,
  isValidVietnamPhone,
} from './utils';
import { GENDER_OPTIONS } from './constants';

const GENDER_VALUES = GENDER_OPTIONS.map((opt) => opt.value);

export const validatePatientForm = (values, { isUpdate = false } = {}) => {
  const errors = {};

  // VR1
  const fullName = String(values?.full_name || '').trim();
  if (!fullName) {
    errors.full_name = 'Vui lòng nhập họ và tên.';
  } else if (fullName.length > 191) {
    errors.full_name = 'Họ và tên không vượt quá 191 ký tự.';
  }

  // VR2
  const phone = String(values?.phone || '').trim();
  if (!phone) {
    errors.phone = 'Vui lòng nhập số điện thoại.';
  } else if (!isValidVietnamPhone(phone)) {
    errors.phone = 'Số điện thoại không đúng định dạng (VD: 0901234567).';
  }

  // VR3
  if (values?.email) {
    if (!isValidEmail(values.email)) {
      errors.email = 'Email không đúng định dạng.';
    } else if (String(values.email).length > 191) {
      errors.email = 'Email không vượt quá 191 ký tự.';
    }
  }

  // VR4
  if (values?.dob && !isValidDob(values.dob)) {
    errors.dob = 'Ngày sinh không hợp lệ.';
  }

  // VR5
  if (values?.id_number && !isValidIdNumber(values.id_number)) {
    errors.id_number = 'CCCD/CMND phải gồm 9–12 chữ số.';
  }

  // VR6
  if (!isUpdate) {
    const source = String(values?.source || '').trim();
    if (!source) {
      errors.source = 'Vui lòng chọn nguồn tiếp nhận.';
    }
  } else if (values?.source !== undefined) {
    const source = String(values?.source || '').trim();
    if (!source) {
      errors.source = 'Nguồn tiếp nhận không được để trống.';
    }
  }

  // VR7
  if (values?.gender && !GENDER_VALUES.includes(values.gender)) {
    errors.gender = 'Giới tính không hợp lệ.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateMergeForm = ({ primaryId, secondaryIds }) => {
  const errors = {};
  if (!primaryId) {
    errors.primary_id = 'Vui lòng chọn hồ sơ chính.';
  }
  if (!Array.isArray(secondaryIds) || secondaryIds.length === 0) {
    errors.secondary_ids = 'Vui lòng chọn ít nhất một hồ sơ phụ để gộp.';
  } else if (secondaryIds.includes(primaryId)) {
    errors.secondary_ids = 'Hồ sơ chính không thể đồng thời là hồ sơ phụ.';
  } else if (secondaryIds.length > 10) {
    errors.secondary_ids = 'Chỉ cho phép gộp tối đa 10 hồ sơ trong một lần.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const extractServerErrors = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const errors = {};
  const fieldErrors = data?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    Object.entries(fieldErrors).forEach(([key, value]) => {
      errors[key] = Array.isArray(value) ? value[0] : String(value);
    });
  }
  return {
    status,
    message: data?.message || data?.error || error?.message || 'Đã xảy ra lỗi.',
    code: data?.code,
    duplicates: Array.isArray(data?.duplicates) ? data.duplicates : null,
    errors,
  };
};
