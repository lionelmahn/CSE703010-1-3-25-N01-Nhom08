import axiosClient from './axiosClient';
import {
  BOOKING_SERVICES,
  CLINIC_BRANCHES,
  REQUEST_STATUS,
  SOURCE_LANDING_PAGE,
  TIME_SLOTS,
} from '@/features/online-booking/data';
import { generateLocalRequestCode } from '@/features/online-booking/utils';

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

const USE_MOCK_FALLBACK = true;

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
  return {
    code: generateLocalRequestCode(),
    status: REQUEST_STATUS.PENDING,
    source: payload?.source || SOURCE_LANDING_PAGE,
    submitted_at: new Date().toISOString(),
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
