<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequest extends FormRequest
{
    /**
     * Xác định xem người dùng có quyền gọi request này không.
     */
    public function authorize(): bool
    {
        return true; // Middleware phân quyền Role đã chặn sẵn ở Route rồi
    }

    /**
     * Các luật kiểm tra dữ liệu đầu vào.
     */
    public function rules(): array
    {
        // Lấy ID của dịch vụ đang được update từ trên đường dẫn (Route)
        $service = $this->route('service');
        $serviceId = $service instanceof \App\Models\Service ? $service->id : $service;

        return [
            'service_code' => [
                'required',
                'string',
                // Kiểm tra trùng mã trong bảng services, NHƯNG bỏ qua dịch vụ hiện tại
                Rule::unique('services', 'service_code')->ignore($serviceId),
            ],
            'name' => 'required|string|max:255',
            'service_group' => 'required|string',
            'price' => 'nullable|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'status' => 'required|in:draft,active,hidden,inactive',
            'visibility' => 'required|in:public,internal',
            
            // Xử lý luồng thêm mảng các chuyên môn (Ngoại lệ E4)
            'specialties' => 'nullable|array', 
            'specialties.*' => 'exists:specialties,id'
        ];
    }

    /**
     * Tùy chỉnh câu thông báo lỗi trả về cho Frontend.
     */
    public function messages(): array
    {
        return [
            'service_code.required' => 'Mã dịch vụ không được bỏ trống.',
            'service_code.unique' => 'Mã dịch vụ này đã tồn tại trong hệ thống. Vui lòng nhập mã khác.',
            'name.required' => 'Tên dịch vụ không được bỏ trống.',
            'duration_minutes.required' => 'Thời gian thực hiện không được bỏ trống.',
            'specialties.*.exists' => 'Có một chuyên môn được chọn không hợp lệ hoặc đã bị xóa.'
        ];
    }
}