<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Appointment;
use App\Models\OnlineBookingRequest;
use App\Models\Patient;

/**
 * Helper map Eloquent model -> shape mockData/mockStore o frontend.
 *
 * FE rang buoc 1 so key cu the (preferred_time_slot_id, history, processed_by
 * la string ten/role) ma DB column khong giong y. Tach transformer ra de cac
 * controller dung chung va de unit-test sau.
 */
trait TransformsBookingResponses
{
    protected function transformRequest(OnlineBookingRequest $request): array
    {
        $request->loadMissing(['patient', 'appointment', 'processor:id,name', 'histories.actor:id,name']);

        return [
            'id' => $request->id,
            'code' => $request->code,
            'status' => $request->status,
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'need' => $request->need,
            'service_ids' => $request->service_ids ?? [],
            'branch_id' => $request->branch_id,
            'preferred_date' => optional($request->preferred_date)->toDateString(),
            'preferred_time_slot' => $request->preferred_time_slot,
            'preferred_time_slot_id' => $request->preferred_time_slot,
            'customer_note' => $request->customer_note,
            'internal_note' => $request->internal_note,
            'patient_id' => $request->patient_id,
            'patient' => $request->patient ? $this->transformPatient($request->patient) : null,
            'appointment_id' => $request->appointment_id,
            'appointment_code' => $request->appointment?->code,
            'appointment' => $request->appointment ? $this->transformAppointment($request->appointment) : null,
            'email_status' => $request->email_status,
            'processed_by' => $request->processor?->name,
            'processed_by_id' => $request->processed_by,
            'processed_at' => optional($request->processed_at)?->toIso8601String(),
            'source' => $request->source,
            'submitted_at' => optional($request->submitted_at)?->toIso8601String(),
            'device' => $request->device,
            'ip' => $request->ip,
            'proposed_slots' => $request->proposed_slots ?? [],
            'reject_reason' => $request->reject_reason,
            'history' => $request->histories
                ? $request->histories->map(fn ($h) => [
                    'id' => $h->id,
                    'action' => $h->action,
                    'actor' => $h->actor?->name ?? $h->actor_name ?? 'He thong',
                    'actor_id' => $h->actor_id,
                    'note' => $h->note,
                    'metadata' => $h->metadata,
                    'at' => optional($h->created_at)?->toIso8601String(),
                ])->values()->all()
                : [],
            'created_at' => optional($request->created_at)->toIso8601String(),
            'updated_at' => optional($request->updated_at)->toIso8601String(),
        ];
    }

    protected function transformPatient(Patient $patient): array
    {
        return [
            'id' => $patient->id,
            'code' => $patient->patient_code,
            'name' => $patient->full_name,
            'phone' => $patient->phone,
            'email' => $patient->email,
            'gender' => $patient->gender,
            'birthdate' => optional($patient->dob)->toDateString(),
            'age' => $patient->age(),
            'address' => $patient->address,
            'active' => (bool) $patient->is_active,
            'last_visit_at' => optional($patient->last_visit_at)?->toIso8601String(),
        ];
    }

    protected function transformAppointment(Appointment $appointment): array
    {
        return [
            'id' => $appointment->id,
            'code' => $appointment->code,
            'online_booking_request_id' => $appointment->online_booking_request_id,
            'patient_id' => $appointment->patient_id,
            'appointment_date' => optional($appointment->appointment_date)->toDateString(),
            'time_slot' => $appointment->time_slot,
            'service_ids' => $appointment->service_ids ?? [],
            'branch_id' => $appointment->branch_id,
            'status' => $appointment->status,
            'assigned_doctor_id' => $appointment->assigned_doctor_id,
            'created_by' => $appointment->created_by,
            'created_at' => optional($appointment->created_at)->toIso8601String(),
        ];
    }
}
