<?php

namespace Database\Seeders\Support;

use Illuminate\Support\Carbon;

/**
 * Tien ich dung chung cho bo du lieu mau "SMP".
 *
 *  - Cua so thoi gian ~24 thang (windowStart -> het thang hien tai) de phu cac
 *    bao cao theo nam/thang (UC16-UC19).
 *  - Cac "pool" noi dung nha khoa THUC TE (co dau tieng Viet) de tranh du lieu
 *    placeholder kieu "du lieu mau 1".
 *
 * Tat ca ham chon deu deterministic (theo seed nguyen) => seed lai cho ket qua
 * on dinh, de doi chieu.
 */
final class SampleData
{
    public const TZ = 'Asia/Ho_Chi_Minh';

    /** So nam lui ve qua khu tinh tu hom nay. */
    public const WINDOW_YEARS = 2;

    /* ===================================================================
     * Cua so thoi gian.
     * =================================================================== */

    public static function today(): Carbon
    {
        return Carbon::now(self::TZ)->startOfDay();
    }

    public static function windowStart(): Carbon
    {
        return self::today()->copy()->subYears(self::WINDOW_YEARS)->startOfMonth();
    }

    /**
     * Danh sach cac thang trong cua so: [['year'=>..,'month'=>..,'start'=>Carbon,'end'=>Carbon], ...]
     * end cua thang hien tai duoc cat ve hom nay (khong sinh du lieu tuong lai).
     *
     * @return array<int,array{year:int,month:int,start:Carbon,end:Carbon,is_current:bool}>
     */
    public static function months(): array
    {
        $today = self::today();
        $cursor = self::windowStart();
        $out = [];

        while ($cursor->lte($today)) {
            $monthEnd = $cursor->copy()->endOfMonth();
            $isCurrent = $cursor->isSameMonth($today);
            $out[] = [
                'year' => (int) $cursor->year,
                'month' => (int) $cursor->month,
                'start' => $cursor->copy(),
                'end' => $isCurrent ? $today->copy() : $monthEnd,
                'is_current' => $isCurrent,
            ];
            $cursor->addMonthNoOverflow()->startOfMonth();
        }

        return $out;
    }

    /* ===================================================================
     * Pool noi dung lam sang (nha khoa).
     * =================================================================== */

    /** @var array<int,string> */
    public const CHIEF_COMPLAINTS = [
        'Đau nhức răng hàm dưới bên phải',
        'Răng ê buốt khi ăn đồ lạnh',
        'Chảy máu chân răng khi đánh răng',
        'Sưng nướu vùng răng khôn',
        'Răng sâu có lỗ lớn, giắt thức ăn',
        'Khám định kỳ và lấy cao răng',
        'Răng cửa bị mẻ do cắn vật cứng',
        'Hôi miệng kéo dài, nướu sưng đỏ',
        'Đau khi nhai vùng răng hàm trên',
        'Răng lung lay, ăn nhai khó khăn',
        'Mất răng lâu ngày, muốn phục hình',
        'Răng ố vàng, muốn tẩy trắng thẩm mỹ',
    ];

    /** @var array<int,string> */
    public const SYMPTOMS = [
        'Ê buốt kéo dài 5-10 giây khi gặp kích thích lạnh',
        'Đau âm ỉ về đêm, tăng khi nằm',
        'Nướu sưng đỏ, dễ chảy máu khi chạm',
        'Giắt thức ăn vùng kẽ răng, khó vệ sinh',
        'Đau nhói khi cắn vào, giảm khi nghỉ',
        'Không đau, phát hiện tình cờ khi khám',
        'Há miệng hạn chế, đau vùng góc hàm',
    ];

    /** @var array<int,string> */
    public const DIAGNOSES = [
        'Sâu ngà răng 46',
        'Viêm tủy không hồi phục răng 36',
        'Viêm nha chu mạn toàn hàm',
        'Viêm quanh thân răng khôn 48',
        'Mẻ rìa cắn răng 11 chưa phạm tủy',
        'Mòn cổ răng 24, 25',
        'Cao răng độ 2, viêm nướu',
        'Sâu răng 16 độ 2',
        'Mất răng 36 đã lâu, tiêu xương nhẹ',
        'Răng nhiễm màu ngoại lai mức độ vừa',
    ];

    /** @var array<int,string> */
    public const CONCLUSIONS = [
        'Đã trám composite, hẹn tái khám sau 1 tuần',
        'Chỉ định điều trị tủy 2 buổi, hẹn buổi tiếp theo',
        'Lấy cao răng và đánh bóng, hướng dẫn vệ sinh răng miệng',
        'Nhổ răng khôn 48, kê đơn kháng sinh và giảm đau',
        'Trám thẩm mỹ phục hồi hình dáng răng, kết quả tốt',
        'Theo dõi và tái khám định kỳ 6 tháng',
        'Tư vấn cắm implant phục hình răng đã mất',
        'Tẩy trắng răng tại phòng khám, kết quả đạt yêu cầu',
    ];

    /** @var array<int,string> */
    public const TREATMENT_OUTCOMES = [
        'Hoàn tất điều trị, bệnh nhân hài lòng',
        'Triệu chứng giảm rõ sau can thiệp',
        'Cần theo dõi thêm ở lần tái khám',
        'Phục hồi chức năng ăn nhai tốt',
    ];

    /* ===================================================================
     * Pool noi dung phi lam sang.
     * =================================================================== */

    /** @var array<int,string> */
    public const APPOINTMENT_NOTES = [
        'Khách đặt lịch qua tổng đài',
        'Bệnh nhân cũ tái khám theo hẹn',
        'Khách đặt online từ website phòng khám',
        'Khách vãng lai đến trực tiếp',
        'Đặt lịch theo giới thiệu của người quen',
    ];

    /** @var array<int,string> */
    public const LEAVE_REASONS = [
        'Bận việc gia đình đột xuất',
        'Đi học nâng cao chuyên môn',
        'Nghỉ ốm theo chỉ định của bác sĩ',
        'Giải quyết việc cá nhân',
        'Tham dự hội nghị nha khoa',
    ];

    /** @var array<int,string> */
    public const SWAP_REASONS = [
        'Trùng lịch cá nhân, nhờ đồng nghiệp đổi ca',
        'Có lịch khám chuyên đề cần tham gia',
        'Đổi ca để cân đối lịch trực trong tuần',
    ];

    /** @var array<int,string> */
    public const REVIEW_NOTES_OK = [
        'Đã duyệt, sắp xếp người trực thay',
        'Đồng ý, đã cập nhật lịch làm việc',
        'Duyệt theo đề nghị của nhân viên',
    ];

    /** @var array<int,string> */
    public const REVIEW_NOTES_REJECT = [
        'Không duyệt do thiếu người trực trong ngày',
        'Từ chối vì lịch khám đã kín, cần có mặt',
        'Chưa duyệt, đề nghị sắp xếp thời điểm khác',
    ];

    /** @var array<int,string> */
    public const BOOKING_NOTES = [
        'Mong được khám trong khung giờ buổi sáng',
        'Cần tư vấn niềng răng cho con',
        'Đau răng nhiều ngày, mong được khám sớm',
        'Muốn lấy cao răng và kiểm tra tổng quát',
        'Hỏi về chi phí cắm implant',
    ];

    /** @var array<int,string> Dia chi thuc te HN/HCM/DN. */
    public const ADDRESSES = [
        '12 Hàng Bài, Hoàn Kiếm, Hà Nội',
        '88 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        '45 Cầu Giấy, Cầu Giấy, Hà Nội',
        '210 Trần Duy Hưng, Cầu Giấy, Hà Nội',
        '156 Xã Đàn, Đống Đa, Hà Nội',
        '67 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
        '320 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh',
        '45 Phan Xích Long, Phú Nhuận, TP. Hồ Chí Minh',
        '178 Cách Mạng Tháng Tám, Quận 10, TP. Hồ Chí Minh',
        '23 Bạch Đằng, Hải Châu, Đà Nẵng',
        '90 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng',
        '15 Lê Duẩn, Hải Châu, Đà Nẵng',
    ];

    /** @var array<int,string> */
    public const OCCUPATIONS = [
        'Giáo viên', 'Kỹ sư', 'Nhân viên văn phòng', 'Kinh doanh tự do',
        'Công nhân', 'Sinh viên', 'Bác sĩ', 'Kế toán', 'Nội trợ', 'Lái xe',
    ];

    /** @var array<int,string> */
    public const MEDICAL_HISTORIES = [
        'Cao huyết áp, đang điều trị ổn định',
        'Tiểu đường type 2',
        'Không ghi nhận bệnh nền',
        'Tiền sử viêm gan B',
        'Hen phế quản nhẹ',
    ];

    /** @var array<int,string> */
    public const ALLERGIES = [
        'Dị ứng Penicillin',
        'Dị ứng thuốc tê Lidocaine',
        'Chưa ghi nhận dị ứng',
        'Dị ứng hải sản',
    ];

    /* ===================================================================
     * Chon phan tu deterministic.
     * =================================================================== */

    /**
     * @template T
     * @param  array<int,T>  $pool
     * @return T
     */
    public static function pick(array $pool, int $seed)
    {
        return $pool[abs($seed) % count($pool)];
    }
}
