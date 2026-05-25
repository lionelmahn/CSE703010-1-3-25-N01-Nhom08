<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'subject' => ['required', 'string', 'max:255'],
            'body_html' => ['required', 'string', 'max:65535'],
            'body_text' => ['nullable', 'string', 'max:65535'],
            'required_vars' => ['nullable', 'array'],
            'required_vars.*' => ['string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
