<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\DoctorAvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * UC8 - API doc thong tin bac si (role=bac_si) phuc vu dieu phoi.
 *
 * Doctor entity = User co role bac_si. Metadata (chuyen mon, lich lam viec,
 * nghi phep) lay tu staff/professional_profiles thong qua eager-load.
 *
 * KHONG expose mutate user/staff o day - thuoc nghiep vu khac (UC2/UC3).
 */
class DoctorController extends Controller
{
    public function __construct(
        private readonly DoctorAvailabilityService $availability,
    ) {
    }

    /**
     * UC8 - Danh sach bac si (filter theo branch / specialty / search).
     * Khong filter availability o day, chi load metadata.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'branch_id' => ['nullable', 'string', 'max:64'],
            'q' => ['nullable', 'string', 'max:191'],
        ]);

        $doctors = $this->availability->fetchActiveDoctors();

        $items = $doctors->map(function (User $u) {
            $staff = $u->staff;
            $specialty = null;
            $degree = null;
            if ($staff) {
                foreach ($staff->professionalProfiles ?? [] as $profile) {
                    if (! $degree && ! empty($profile->qualification_names)) {
                        $degree = implode(', ', $profile->qualification_names);
                    }
                    foreach ($profile->specialties ?? [] as $sp) {
                        if (! $specialty && ! empty($sp->specialty_name)) {
                            $specialty = $sp->specialty_name;
                            $degree = $degree ?: $sp->degree;
                        }
                    }
                }
            }
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'staff_id' => $staff?->id,
                'branch_id' => $staff?->branch_id,
                'branch_name' => $staff?->branch?->name,
                'specialty' => $specialty,
                'degree' => $degree,
                'status' => $u->status,
            ];
        });

        if (! empty($filters['branch_id']) && $filters['branch_id'] !== 'all') {
            $items = $items->filter(fn ($d) => $d['branch_id'] === $filters['branch_id']);
        }
        if (! empty($filters['q'])) {
            $term = mb_strtolower($filters['q']);
            $items = $items->filter(function ($d) use ($term) {
                return str_contains(mb_strtolower($d['name'] ?? ''), $term)
                    || str_contains(mb_strtolower($d['email'] ?? ''), $term)
                    || str_contains(mb_strtolower($d['specialty'] ?? ''), $term);
            });
        }

        return response()->json([
            'data' => $items->values()->all(),
        ]);
    }

    /**
     * UC8 - Lich kha dung cua bac si trong 1 ngay (work_schedule + appointments + leave).
     */
    public function availability(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
        ]);

        $date = Carbon::parse($data['date']);

        return response()->json($this->availability->availabilityOn($id, $date));
    }

    /**
     * UC8 - Workload bac si trong ngay (utilization, free_slots, ...).
     * Ho tro lay nhieu user trong cung ngay neu truyen ?user_ids=1,2,3.
     */
    public function workload(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'user_ids' => ['nullable', 'string', 'max:1000'],
            'branch_id' => ['nullable', 'string', 'max:64'],
        ]);

        $date = Carbon::parse($data['date']);

        if (! empty($data['user_ids'])) {
            $ids = collect(explode(',', $data['user_ids']))
                ->map(fn ($v) => (int) trim($v))
                ->filter()
                ->values()
                ->all();
            $items = collect($ids)->map(fn ($id) => $this->availability->workloadOn($id, $date));
        } else {
            $doctors = $this->availability->fetchActiveDoctors();
            if (! empty($data['branch_id']) && $data['branch_id'] !== 'all') {
                $doctors = $doctors->filter(fn (User $u) => $u->staff?->branch_id === $data['branch_id']);
            }
            $items = $doctors->map(fn (User $u) => array_merge(
                ['name' => $u->name, 'branch_id' => $u->staff?->branch_id],
                $this->availability->workloadOn($u->id, $date),
            ));
        }

        return response()->json([
            'data' => $items->values()->all(),
        ]);
    }
}
