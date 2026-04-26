<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Mặc định cho phép vì đã có Middleware Role chặn ở Route
    }

    public function rules(): array
    {
        return [
            'service_code' => 'required|unique:services,service_code',
            'name' => 'required|string|max:255',
            'service_group' => 'required|string',
            'price' => 'nullable|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'status' => 'required|in:draft,active,hidden,inactive',
            'visibility' => 'required|in:public,internal',
            'specialties' => 'nullable|array', // Mảng chứa ID các chuyên môn
            'specialties.*' => 'exists:specialties,id'
        ];
    }

    public function messages(): array
    {
        return [
            'service_code.unique' => 'Mã dịch vụ này đã tồn tại trong hệ thống.',
            'name.required' => 'Tên dịch vụ không được bỏ trống.'
        ];
    }
}