<?php

namespace App\Http\Requests\Notification;

use App\Models\AppNotification;
use App\Services\NotificationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendManualNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(NotificationService::MANUAL_DISPATCH_TYPES)],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'online_booking_request_id' => ['nullable', 'integer', 'exists:online_booking_requests,id'],
            'recipient_email' => ['nullable', 'email:rfc', 'max:191'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            if (! $this->input('appointment_id') && ! $this->input('online_booking_request_id')) {
                $v->errors()->add(
                    'appointment_id',
                    'Bat buoc gan voi appointment hoac online_booking_request.'
                );
            }
        });
    }
}
