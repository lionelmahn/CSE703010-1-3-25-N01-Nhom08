<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\OnlineBookingRequest;
use App\Models\OnlineBookingRequestHistory;
use App\Models\Patient;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
use Database\Seeders\Support\SampleData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Du lieu mau yeu cau dat lich online, phu DU TRANG THAI (cho xu ly / dang xu ly
 * / de xuat lich khac / da tao lich hen / tu choi / da huy / qua han), trai deu
 * trong ~30 ngay gan nhat.
 *
 * Noi dung thuc te (SampleData). Tien to ma SMP-OLB- chi o truong ma.
 * Idempotent: xoa theo tien to ma roi tao lai.
 */
class SampleOnlineBookingSeeder extends Seeder
{
    public function run(): void
    {
        $branchCode = Branch::value('code') ?? 'PK1-HN';
        $service = Service::query()->where('status', Service::STATUS_ACTIVE)->orderBy('id')->first();
        if (! $service) {
            return;
        }
        $receptionist = Staff::query()->where('role_slug', 'le_tan')->whereNotNull('user_id')->first()?->user
            ?? User::where('username', 'admin')->first();
        $patients = Patient::query()->orderBy('id')->limit(40)->get();
        $today = SampleData::today();

        $cases = [
            // [status, daysAgo, processed?]
            [OnlineBookingRequest::STATUS_PENDING, 0, false],
            [OnlineBookingRequest::STATUS_PENDING, 1, false],
            [OnlineBookingRequest::STATUS_PROCESSING, 1, true],
            [OnlineBookingRequest::STATUS_PROCESSING, 2, true],
            [OnlineBookingRequest::STATUS_PROPOSE_OTHER, 2, true],
            [OnlineBookingRequest::STATUS_APPOINTMENT_CREATED, 3, true],
            [OnlineBookingRequest::STATUS_APPOINTMENT_CREATED, 5, true],
            [OnlineBookingRequest::STATUS_REJECTED, 4, true],
            [OnlineBookingRequest::STATUS_CANCELED, 6, true],
            [OnlineBookingRequest::STATUS_EXPIRED, 10, false],
            [OnlineBookingRequest::STATUS_EXPIRED, 14, false],
        ];

        $this->clearOld();

        DB::transaction(function () use ($cases, $service, $branchCode, $receptionist, $patients, $today) {
            foreach ($cases as $idx => [$status, $daysAgo, $processed]) {
                $submittedAt = $today->copy()->subDays($daysAgo)->setTime(8 + ($idx % 8), 30);
                $preferredDate = $today->copy()->subDays(max(0, $daysAgo - 1));

                // Mot phan gan benh nhan da co, phan con lai la khach moi (lead).
                $patient = ($idx % 2 === 0 && $patients->isNotEmpty())
                    ? $patients[$idx % $patients->count()]
                    : null;

                $name = $patient?->full_name ?? SampleData::pick([
                    'Nguyễn Thành Trung', 'Trần Khánh Linh', 'Phạm Quốc Bảo', 'Lê Thuý Hằng',
                    'Hoàng Minh Đức', 'Vũ Ngọc Mai', 'Đặng Hải Yến', 'Bùi Tuấn Kiệt',
                ], $idx);
                $phone = $patient?->phone ?? '0977'.str_pad((string) (100000 + $idx), 6, '0', STR_PAD_LEFT);

                $proposedSlots = $status === OnlineBookingRequest::STATUS_PROPOSE_OTHER
                    ? [
                        ['date' => $preferredDate->toDateString(), 'time_slot' => '15:00 - 15:30'],
                        ['date' => $preferredDate->toDateString(), 'time_slot' => '16:00 - 16:30'],
                    ]
                    : null;

                $booking = OnlineBookingRequest::create([
                    'code' => 'SMP-OLB-'.str_pad((string) ($idx + 1), 3, '0', STR_PAD_LEFT),
                    'name' => $name,
                    'phone' => $phone,
                    'email' => $patient?->email ?? 'lead'.$idx.'@example.com',
                    'need' => 'examination',
                    'service_ids' => [(string) $service->id],
                    'branch_id' => $branchCode,
                    'preferred_date' => $preferredDate->toDateString(),
                    'preferred_time_slot' => '09:00 - 09:30',
                    'customer_note' => SampleData::pick(SampleData::BOOKING_NOTES, $idx),
                    'status' => $status,
                    'patient_id' => $patient?->id,
                    'processed_by' => $processed ? $receptionist?->id : null,
                    'processed_at' => $processed ? $submittedAt->copy()->addHours(2) : null,
                    'email_status' => OnlineBookingRequest::EMAIL_STATUS_NONE,
                    'source' => 'landing_page',
                    'submitted_at' => $submittedAt,
                    'proposed_slots' => $proposedSlots,
                    'reject_reason' => $status === OnlineBookingRequest::STATUS_REJECTED
                        ? 'Khung giờ khách chọn đã kín, khách không đồng ý dời lịch.'
                        : null,
                ]);

                OnlineBookingRequestHistory::create([
                    'request_id' => $booking->id,
                    'action' => 'created_from_seed',
                    'actor_id' => $processed ? $receptionist?->id : null,
                    'actor_name' => $processed ? ($receptionist?->name ?? 'Lễ tân') : 'Khách hàng',
                    'note' => 'Yêu cầu đặt lịch gửi từ website phòng khám.',
                    'metadata' => ['seed_code' => $booking->code],
                    'created_at' => $submittedAt,
                ]);
            }
        });
    }

    private function clearOld(): void
    {
        $ids = OnlineBookingRequest::where('code', 'like', 'SMP-OLB-%')->pluck('id');
        if ($ids->isNotEmpty()) {
            OnlineBookingRequestHistory::whereIn('request_id', $ids)->delete();
            OnlineBookingRequest::whereIn('id', $ids)->delete();
        }
    }
}
