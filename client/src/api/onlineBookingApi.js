import axiosClient from './axiosClient';
import {
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
  REQUEST_STATUS,
  SOURCE_LANDING_PAGE,
  TIME_SLOTS,
} from '@/features/online-booking/data';
import { generateLocalRequestCode } from '@/features/online-booking/utils';
// Mock store dung chung voi UC6.2 (xu ly yeu cau dat lich online). Khi backend
// Laravel san sang, mock fallback duoi day se khong chay nua va store nay co the
// duoc deprecate.
import { mockCreateRequest } from '@/features/online-booking-management/mockStore';

/**
 * Service gọi API UC6.1 - Gửi yêu cầu đặt lịch online.
 *
 * Hệ thống Laravel hiện tại CHƯA expose route `/public/online-bookings`,
 * `/public/clinic-services`, `/public/clinic-branches`, `/public/time-slots`.
 *
 * Service này được thiết kế theo "API-first": luôn thử gọi axios trước,
 * nếu backend trả về 404 (chưa có route) hoặc network error thì fallback
 * sang mock để demo flow đầy đủ. Khi Laravel sẵn sàng chỉ cần:
 *   - Xoá khối `try/catch` fallback bên dưới (hoặc đặt cờ `USE_MOCK_FALLBACK`)
 *   - Bảo đảm response body khớp interface đang dùng ở các Step.
 *
 * Interface response cho `submit`:
 *   {
 *     code: string,            // DR1 - OLB + năm + số thứ tự
 *     status: string,          // DR11 - mặc định "cho_xu_ly"
 *     source: string,          // DR10 - mặc định "landing_page"
 *     submitted_at: string,    // DR13 - ISO datetime
 *     email_sent: boolean      // AC16 - tiếp nhận qua email hay không
 *   }
 */

const USE_MOCK_FALLBACK = false;

const isMockableError = (error) => {
  if (!error) return false;
  if (error.response) {
    // Backend chưa có route hoặc method chưa hỗ trợ -> fallback mock để demo.
    return error.response.status === 404 || error.response.status === 405;
  }
  // Lỗi network (server chưa chạy, CORS chưa cấu hình...) -> cũng mock.
  return !!error.request;
};

const mockSubmit = async (payload) => {
  // Mô phỏng độ trễ mạng để UI có thể test loading/disabled state.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const emailSent = Boolean(payload?.email) && Math.random() > 0.05; // ~A3
  // Ghi vao shared mock store de yeu cau xuat hien o queue UC6.2 cua le tan.
  let saved = null;
  try {
    saved = mockCreateRequest({
      name: payload?.name,
      phone: payload?.phone,
      email: payload?.email,
      service_ids: payload?.service_ids || (payload?.service_id ? [payload.service_id] : []),
      branch_id: payload?.branch_id || payload?.branch,
      preferred_date: payload?.preferred_date || payload?.date,
      preferred_time_slot_id: payload?.preferred_time_slot_id || payload?.time_slot_id,
      customer_note: payload?.note || payload?.customer_note,
      source: payload?.source || SOURCE_LANDING_PAGE,
      device: payload?.device,
      ip: payload?.ip,
    });
  } catch {
    // Neu store fail (vi du SSR), van tra ve mock payload toi thieu.
    saved = null;
  }
  return {
    code: saved?.code || generateLocalRequestCode(),
    status: saved?.status || REQUEST_STATUS.PENDING,
    source: saved?.source || payload?.source || SOURCE_LANDING_PAGE,
    submitted_at: saved?.submitted_at || new Date().toISOString(),
    email_sent: emailSent,
    payload,
    _mock: true,
  };
};

export const onlineBookingApi = {
  /**
   * Gửi yêu cầu đặt lịch online.
   * @param {object} payload - shape ở buildBookingPayload trong validation.js.
   */
  submit: async (payload) => {
    try {
      const response = await axiosClient.post('/public/online-bookings', payload);
      return response.data;
    } catch (error) {
      if (USE_MOCK_FALLBACK && isMockableError(error)) {
        return mockSubmit(payload);
      }
      throw error;
    }
  },

  /**
   * Lấy danh sách dịch vụ public hiển thị trên form (E12: chỉ dịch vụ active).
   */
  getServices: async () => {
    try {
      const response = await axiosClient.get('/public/clinic-services');
      return response.data;
    } catch (error) {
      if (USE_MOCK_FALLBACK && isMockableError(error)) {
        return BOOKING_SERVICES;
      }
      throw error;
    }
  },

  /**
   * Lấy danh sách chi nhánh public (E12: chỉ chi nhánh active).
   */
  getBranches: async () => {
    try {
      const response = await axiosClient.get('/public/clinic-branches');
      return response.data;
    } catch (error) {
      if (USE_MOCK_FALLBACK && isMockableError(error)) {
        return CLINIC_BRANCHES;
      }
      throw error;
    }
  },

  /**
   * Lấy danh sách khung giờ tiếp nhận (VR9 / VR10 - working hours, ca nghỉ).
   */
  getTimeSlots: async () => {
    try {
      const response = await axiosClient.get('/public/time-slots');
      return response.data;
    } catch (error) {
      if (USE_MOCK_FALLBACK && isMockableError(error)) {
        return TIME_SLOTS;
      }
      throw error;
    }
  },
};

export default onlineBookingApi;
