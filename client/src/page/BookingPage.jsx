import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Placeholder cho UC6.1 - Đặt lịch khám online.
 * Khi UC6.1 hoàn thành sẽ thay nội dung bằng form đặt lịch đầy đủ
 * (chọn dịch vụ, bác sĩ, khung giờ, xác thực OTP, ...).
 */
const BookingPage = () => {
  const [params] = useSearchParams();
  const name = params.get('name');
  const phone = params.get('phone');
  const service = params.get('service');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <CalendarClock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Đặt lịch khám online
        </h1>
        <p className="text-gray-600 leading-relaxed mb-6">
          Tính năng đặt lịch trực tuyến (UC6.1) đang được hoàn thiện. Vui lòng
          để lại thông tin liên hệ hoặc gọi <strong>1900 1234</strong> để được
          tư vấn viên hỗ trợ trong vòng 15 phút.
        </p>

        {(name || phone || service) && (
          <div className="text-left bg-blue-50/60 border border-blue-100 rounded-2xl p-4 mb-6 text-sm text-gray-700 space-y-1">
            <div className="font-semibold text-blue-700 mb-1">
              Thông tin vừa gửi
            </div>
            {name && <div><span className="text-gray-500">Họ tên:</span> {name}</div>}
            {phone && <div><span className="text-gray-500">Số điện thoại:</span> {phone}</div>}
            {service && <div><span className="text-gray-500">Dịch vụ:</span> {service}</div>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" /> Về trang chủ
            </Link>
          </Button>
          <Button asChild className="rounded-full px-6 bg-blue-600 hover:bg-blue-700">
            <a href="tel:19001234">Gọi 1900 1234</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
