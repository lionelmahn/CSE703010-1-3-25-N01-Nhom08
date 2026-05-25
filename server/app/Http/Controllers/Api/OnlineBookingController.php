<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\TransformsBookingResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\OnlineBooking\ConfirmOnlineBookingRequest;
use App\Http\Requests\OnlineBooking\ProposeAlternativeRequest;
use App\Http\Requests\OnlineBooking\RejectOnlineBookingRequest;
use App\Mail\AlternativeTimeProposalMail;
use App\Mail\AppointmentConfirmationMail;
use App\Mail\RequestRejectionMail;
use App\Models\AppNotification;
use App\Models\OnlineBookingRequest;
use App\Models\Patient;
use App\Services\NotificationService;
use App\Services\OnlineBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/**
 * UC6.2 - API noi bo xu ly yeu cau dat lich (le tan + admin).
 *
 * Tat ca route trong file nay phai duoc bao boc auth:sanctum +
 * permission middleware o routes/api.php. Controller chi tap trung vao
 * dieu phoi - business logic nam o `OnlineBookingService`.
 */
class OnlineBookingController extends Controller
{
    use TransformsBookingResponses;

    public function __construct(
        private readonly OnlineBookingService $service,
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'status', 'branch_id', 'service_id', 'date_from', 'date_to', 'q', 'per_page', 'page',
        ]);

        $paginator = $this->service->listRequests($filters);
        $counts = $this->service->statusCounts();

        return response()->json([
            'data' => collect($paginator->items())->map(fn ($r) => $this->transformRequest($r))->all(),
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'counts' => $counts,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $request = $this->service->findRequest($id);

        return response()->json([
            'data' => $this->transformRequest($request),
        ]);
    }

    public function startProcessing(int $id, Request $request): JsonResponse
    {
        $updated = $this->service->startProcessing(
            $this->service->findRequest($id),
            $request->user(),
        );

        return response()->json(['data' => $this->transformRequest($updated)]);
    }

    public function linkPatient(int $id, Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
        ]);
        $patient = Patient::findOrFail($data['patient_id']);
        $updated = $this->service->linkPatient(
            $this->service->findRequest($id),
            $patient,
            $request->user(),
        );

        return response()->json(['data' => $this->transformRequest($updated)]);
    }

    public function createPatient(int $id, Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient' => ['required', 'array'],
            'patient.name' => ['required', 'string', 'min:2', 'max:100'],
            'patient.phone' => ['required', 'string', 'regex:/^(0|\+84)[0-9]{9,10}$/'],
            'patient.email' => ['nullable', 'email', 'max:191'],
            'patient.gender' => ['nullable', 'string', 'max:20'],
            'patient.birthdate' => ['nullable', 'date'],
            'patient.address' => ['nullable', 'string', 'max:255'],
        ]);

        $patient = $this->service->createPatient(
            $this->service->findRequest($id),
            $data['patient'],
            $request->user(),
        );

        $updated = $this->service->findRequest($id);

        return response()->json([
            'data' => $this->transformRequest($updated),
            'patient' => $this->transformPatient($patient),
        ]);
    }

    public function confirm(int $id, ConfirmOnlineBookingRequest $request): JsonResponse
    {
        $result = $this->service->confirmAppointment(
            $this->service->findRequest($id),
            $request->validated(),
            $request->user(),
        );

        // UC10 - Email da duoc dispatch trong OnlineBookingService voi co che
        // DB::afterCommit, khong goi safeSendMail truc tiep tai day nua.

        return response()->json([
            'data' => $this->transformRequest($this->service->findRequest($id)),
            'appointment' => $this->transformAppointment($result['appointment']),
        ]);
    }

    public function proposeAlternative(int $id, ProposeAlternativeRequest $request): JsonResponse
    {
        $updated = $this->service->proposeAlternative(
            $this->service->findRequest($id),
            $request->validated(),
            $request->user(),
        );

        // UC10 - Email da duoc dispatch trong OnlineBookingService.

        return response()->json([
            'data' => $this->transformRequest($this->service->findRequest($id)),
        ]);
    }

    public function reject(int $id, RejectOnlineBookingRequest $request): JsonResponse
    {
        $updated = $this->service->rejectRequest(
            $this->service->findRequest($id),
            $request->validated()['reason'],
            $request->user(),
        );

        // UC10 - Email da duoc dispatch trong OnlineBookingService.

        return response()->json([
            'data' => $this->transformRequest($this->service->findRequest($id)),
        ]);
    }

    public function reopen(int $id, Request $request): JsonResponse
    {
        $updated = $this->service->reopen(
            $this->service->findRequest($id),
            $request->user(),
        );

        return response()->json(['data' => $this->transformRequest($updated)]);
    }

    /**
     * UC10 - Endpoint chuyen tiep. Sprint sau co the bo, FE moi dung
     * /api/notifications de gui thu cong. Hien tai map kind -> NotificationService.
     */
    public function sendEmail(int $id, Request $request): JsonResponse
    {
        $data = $request->validate([
            'kind' => ['required', 'string', 'in:ER-01,ER-02,ER-03,ER-04'],
        ]);

        $bookingRequest = $this->service->findRequest($id);

        $type = match ($data['kind']) {
            'ER-01' => AppNotification::TYPE_APPOINTMENT_CONFIRMATION,
            'ER-02' => AppNotification::TYPE_ALTERNATIVE_PROPOSED,
            'ER-03' => AppNotification::TYPE_REQUEST_REJECTED,
            default => AppNotification::TYPE_APPOINTMENT_CONFIRMATION,
        };

        try {
            $this->notifications->dispatchManual($type, $request->user(), [
                'online_booking_request_id' => $bookingRequest->id,
                'appointment_id' => $bookingRequest->appointment_id,
            ]);
            // Backward-compatible voi UC6.2 hien tai: cap nhat email_status de
            // UI cu khong vo cot trang thai gui email.
            $this->service->markEmail(
                $bookingRequest,
                $data['kind'],
                OnlineBookingRequest::EMAIL_STATUS_SENT,
                $request->user(),
            );
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::warning('uc6.2.send_email_via_uc10_failed', [
                'request_id' => $bookingRequest->id,
                'error' => $e->getMessage(),
            ]);
            $this->service->markEmail(
                $bookingRequest,
                $data['kind'],
                OnlineBookingRequest::EMAIL_STATUS_FAILED,
                $request->user(),
                $e->getMessage(),
            );
        }

        return response()->json(['data' => $this->transformRequest($this->service->findRequest($id))]);
    }

    public function resendEmail(int $id, Request $request): JsonResponse
    {
        return $this->sendEmail($id, $request);
    }

    public function updateInternalNote(int $id, Request $request): JsonResponse
    {
        $data = $request->validate([
            'internal_note' => ['nullable', 'string', 'max:500'],
        ]);

        $updated = $this->service->updateInternalNote(
            $this->service->findRequest($id),
            $data['internal_note'] ?? null,
            $request->user(),
        );

        return response()->json(['data' => $this->transformRequest($updated)]);
    }

    /**
     * Goi Mail::send + capture exception thanh email_status / history.
     * Khong rollback DB neu mail fail (BR-17, BR-18).
     */
    private function safeSendMail(OnlineBookingRequest $request, $mailable, $actor, string $kind): OnlineBookingRequest
    {
        if (! $request->email) {
            return $this->service->markEmail(
                $request,
                $kind,
                OnlineBookingRequest::EMAIL_STATUS_FAILED,
                $actor,
                'Request khong co email.',
            );
        }

        try {
            Mail::to($request->email)->send($mailable);
            return $this->service->markEmail(
                $request,
                $kind,
                OnlineBookingRequest::EMAIL_STATUS_SENT,
                $actor,
            );
        } catch (\Throwable $e) {
            Log::warning('online-booking email failed', [
                'request_id' => $request->id,
                'kind' => $kind,
                'error' => $e->getMessage(),
            ]);
            return $this->service->markEmail(
                $request,
                $kind,
                OnlineBookingRequest::EMAIL_STATUS_FAILED,
                $actor,
                $e->getMessage(),
            );
        }
    }

    private function mailableForKind(string $kind, OnlineBookingRequest $request)
    {
        return match ($kind) {
            'ER-01' => new AppointmentConfirmationMail($request, $request->appointment),
            'ER-02' => new AlternativeTimeProposalMail($request, $request->proposed_slots ?? [], null),
            'ER-03' => new RequestRejectionMail($request, $request->reject_reason ?? ''),
            default => new AppointmentConfirmationMail($request, $request->appointment),
        };
    }
}
