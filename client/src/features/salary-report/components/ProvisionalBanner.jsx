import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

// UI8/VR7 - bao cao co phieu chua chot => danh dau du lieu tam tinh.
const ProvisionalBanner = ({ summary, onShowUnfinalized, onDismiss }) => {
  if (!summary?.is_provisional) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle className="shrink-0 text-amber-500" size={22} />
      <div className="mr-auto">
        <h3 className="text-[13px] font-extrabold text-amber-800">Dữ liệu tạm tính</h3>
        <p className="text-[11px] text-amber-700">
          Báo cáo đang chứa {summary.unfinalized_count} phiếu lương chưa chốt. Số liệu có thể thay đổi
          khi các phiếu được chốt. Tổng quỹ lương chính thức chỉ tính phiếu đã chốt.
        </p>
      </div>
      {onShowUnfinalized ? (
        <button
          type="button"
          onClick={onShowUnfinalized}
          className="h-8 shrink-0 rounded-md border border-amber-300 bg-white px-3 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
        >
          Xem phiếu chưa chốt
        </button>
      ) : null}
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="shrink-0 text-amber-400 hover:text-amber-600">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
};

export default ProvisionalBanner;
