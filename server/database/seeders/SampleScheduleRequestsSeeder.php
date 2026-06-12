<?php

namespace Database\Seeders;

use App\Models\LeaveRequest;
use App\Models\ShiftSwapRequest;
use App\Models\Staff;
use App\Models\User;
use App\Models\WorkSchedule;
use Database\Seeders\Support\SampleData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Du lieu mau don nghi phep + doi ca, phu du trang thai (pending/approved/
 * rejected/cancelled), gan vao cac ca lam viec sap toi cua bac si.
 *
 * Idempotent: xoa cac don gan voi schedule cua bac si trong khoang xu ly roi tao lai.
 */
class SampleScheduleRequestsSeeder extends Seeder
{
    private array $statuses = [
        LeaveRequest::STATUS_PENDING,
        LeaveRequest::STATUS_APPROVED,
        LeaveRequest::STATUS_REJECTED,
        LeaveRequest::STATUS_CANCELLED,
    ];

    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();
        $today = SampleData::today();
        $rangeStart = $today->copy()->toDateString();
        $rangeEnd = $today->copy()->addDays(21)->toDateString();

        $doctors = Staff::query()
            ->where('role_slug', 'bac_si')->where('status', 'working')
            ->whereNotNull('user_id')->orderBy('id')->get();
        if ($doctors->count() < 2) {
            return;
        }

        // Lay 1 ca sap toi cho moi bac si (trong 3 tuan toi).
        $scheduleByStaff = [];
        foreach ($doctors as $doctor) {
            $schedule = WorkSchedule::query()
                ->where('staff_id', $doctor->id)
                ->whereBetween('work_date', [$rangeStart, $rangeEnd])
                ->orderBy('work_date')
                ->first();
            if ($schedule) {
                $scheduleByStaff[$doctor->id] = $schedule;
            }
        }

        $this->clearOld(array_map(fn ($s) => $s->id, $scheduleByStaff));

        // ----- Don nghi phep: phu du 4 trang thai -----
        $i = 0;
        foreach ($scheduleByStaff as $staffId => $schedule) {
            $status = $this->statuses[$i % count($this->statuses)];
            $reviewed = in_array($status, [LeaveRequest::STATUS_APPROVED, LeaveRequest::STATUS_REJECTED], true);

            LeaveRequest::create([
                'work_schedule_id' => $schedule->id,
                'staff_id' => $staffId,
                'requested_by' => $this->userIdOf($staffId, $doctors),
                'reason' => SampleData::pick(SampleData::LEAVE_REASONS, $i),
                'status' => $status,
                'review_note' => $reviewed
                    ? ($status === LeaveRequest::STATUS_APPROVED
                        ? SampleData::pick(SampleData::REVIEW_NOTES_OK, $i)
                        : SampleData::pick(SampleData::REVIEW_NOTES_REJECT, $i))
                    : null,
                'reviewed_at' => $reviewed ? Carbon::now()->subDays(1) : null,
                'reviewed_by' => $reviewed ? $admin?->id : null,
            ]);
            $i++;
        }

        // ----- Don doi ca: ghep cap cac bac si lien tiep -----
        $pairs = array_values($scheduleByStaff);
        $staffIds = array_keys($scheduleByStaff);
        $swapStatuses = [
            ShiftSwapRequest::STATUS_PENDING,
            ShiftSwapRequest::STATUS_APPROVED,
            ShiftSwapRequest::STATUS_REJECTED,
        ];
        $j = 0;
        for ($k = 0; $k + 1 < count($pairs); $k += 2) {
            $reqSchedule = $pairs[$k];
            $tgtSchedule = $pairs[$k + 1];
            $status = $swapStatuses[$j % count($swapStatuses)];
            $reviewed = in_array($status, [ShiftSwapRequest::STATUS_APPROVED, ShiftSwapRequest::STATUS_REJECTED], true);

            ShiftSwapRequest::create([
                'requester_schedule_id' => $reqSchedule->id,
                'requester_staff_id' => $staffIds[$k],
                'target_staff_id' => $staffIds[$k + 1],
                'target_schedule_id' => $tgtSchedule->id,
                'requested_by' => $this->userIdOf($staffIds[$k], $doctors),
                'reason' => SampleData::pick(SampleData::SWAP_REASONS, $j),
                'status' => $status,
                'review_note' => $reviewed
                    ? ($status === ShiftSwapRequest::STATUS_APPROVED
                        ? SampleData::pick(SampleData::REVIEW_NOTES_OK, $j)
                        : SampleData::pick(SampleData::REVIEW_NOTES_REJECT, $j))
                    : null,
                'reviewed_at' => $reviewed ? Carbon::now()->subDays(1) : null,
                'reviewed_by' => $reviewed ? $admin?->id : null,
            ]);
            $j++;
        }
    }

    private function userIdOf(int $staffId, $doctors): ?int
    {
        return optional($doctors->firstWhere('id', $staffId))->user_id;
    }

    private function clearOld(array $scheduleIds): void
    {
        if (empty($scheduleIds)) {
            return;
        }
        LeaveRequest::whereIn('work_schedule_id', $scheduleIds)->delete();
        ShiftSwapRequest::whereIn('requester_schedule_id', $scheduleIds)->delete();
    }
}
