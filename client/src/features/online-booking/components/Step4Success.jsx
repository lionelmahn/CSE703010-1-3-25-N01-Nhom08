import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Home, Info, RefreshCw, Clock, User as UserIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { REQUEST_STATUS_LABEL, SOURCE_LANDING_PAGE } from '../data';
import { formatDateTimeVi } from '../utils';

const SOURCE_LABEL = {
  [SOURCE_LANDING_PAGE]: 'Landing page',
};

const Step4Success = ({ result, email, onCreateAnother, hideHomeAction = false }) => {
  const submittedAt = result?.submitted_at
    ? formatDateTimeVi(result.submitted_at)
    : formatDateTimeVi(new Date());

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold text-green-600 mb-2">
        Gửi yêu cầu thành công!
      </h3>
      <p className="text-sm text-gray-600 mb-6 max-w-sm">
        Cảm ơn bạn đã gửi yêu cầu đặt lịch. Chúng tôi đã tiếp nhận thông tin
        và sẽ liên hệ xác nhận trong thời gian sớm nhất.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 w-full max-w-md mb-6">
        <div className="text-sm text-gray-500 mb-1">Mã yêu cầu của bạn</div>
        <div className="text-2xl font-bold text-gray-900 tracking-wider mb-4">
          {result?.code || '---'}
        </div>

        <div className="space-y-3 text-sm text-left">
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <span className="text-gray-500 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Trạng thái:
            </span>
            <span>
              <Badge variant="secondary" className="rounded-md">
                {REQUEST_STATUS_LABEL[result?.status] || 'Chờ xử lý'}
              </Badge>
            </span>
          </div>
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <span className="text-gray-500 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Nguồn tiếp nhận:
            </span>
            <span className="font-medium text-gray-900">
              {SOURCE_LABEL[result?.source] || 'Landing page'}
            </span>
          </div>
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <span className="text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Thời gian gửi:
            </span>
            <span className="font-medium text-gray-900">{submittedAt}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 text-left p-3 rounded-lg w-full max-w-md mb-2">
        <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
        {result?.email_sent === false ? (
          <p>
            Hệ thống tạm thời chưa gửi được email tiếp nhận. Yêu cầu của bạn{' '}
            <span className="font-semibold">vẫn được lưu</span> và lễ tân sẽ
            liên hệ qua số điện thoại đã đăng ký.
          </p>
        ) : (
          <p>
            Email xác nhận đã được gửi đến{' '}
            <span className="font-bold text-gray-900">{email}</span>.
            <br />
            Vui lòng kiểm tra hộp thư (bao gồm thư rác/spam).
          </p>
        )}
      </div>

      <p className="text-[11px] text-gray-400 italic max-w-md">
        Email này chỉ xác nhận chúng tôi đã tiếp nhận yêu cầu. Lịch hẹn chính
        thức sẽ được lễ tân xác nhận sau khi kiểm tra.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-3 w-full border-t border-gray-100 pt-6 mt-6">
        {!hideHomeAction && (
          <Button variant="outline" asChild className="rounded-lg">
            <Link to="/">
              <Home className="w-4 h-4" /> Quay về trang chủ
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onCreateAnother}
          className="rounded-lg"
        >
          <CalendarPlus className="w-4 h-4" /> Đặt lịch khác
        </Button>
      </div>
    </div>
  );
};

export default Step4Success;
