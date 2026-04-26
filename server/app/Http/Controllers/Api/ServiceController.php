<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\AuditLog;
use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    // Lấy danh sách kèm theo chuyên môn và file đính kèm
    public function index()
    {
        $services = Service::with(['specialties', 'attachments'])->orderBy('id', 'desc')->get();
        return response()->json($services);
    }

    // Thêm mới dịch vụ
    public function store(StoreServiceRequest $request)
{
    // 1. Kiểm tra nghiệp vụ (Quy tắc 6)
    if ($request->status === 'active') {
        if (empty($request->price)) {
            return response()->json(['message' => 'Dịch vụ phải có giá tiền mới được phép Đang áp dụng.'], 422);
        }
        if (empty($request->specialties)) {
            return response()->json(['message' => 'Phải chọn ít nhất một chuyên môn để áp dụng dịch vụ.'], 422);
        }
    }

    return DB::transaction(function () use ($request) {
        // --- LOGIC TỰ SINH MÃ DỊCH VỤ ---
        // Lấy dịch vụ có ID lớn nhất để sinh mã tiếp theo
        $latestService = Service::orderBy('id', 'desc')->first();
        $nextNumber = 1;

        if ($latestService && preg_match('/DV(\d+)/', $latestService->service_code, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        }
        
        // Định dạng DV + 3 chữ số (ví dụ: DV001)
        $autoCode = 'DV' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        // 2. Chuẩn bị dữ liệu (Loại bỏ các trường không thuộc bảng services)
        $data = $request->except(['specialties', 'attachments']);
        $data['service_code'] = $autoCode; // Gán mã tự sinh vào
        $data['commission_rate'] = $data['commission_rate'] ?? 0;

        // 3. Tạo dịch vụ
        $service = Service::create($data);

        // 4. Lưu chuyên môn (Quan hệ N-N)
        if ($request->has('specialties')) {
            $service->specialties()->sync($request->specialties);
        }

        // 5. Lưu file đính kèm
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('service_attachments', 'public');
                $service->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->extension()
                ]);
            }
        }

        // 6. Ghi log lịch sử
        AuditLog::create([
            'admin_id' => Auth::id(),
            'admin_name' => Auth::user()->name ?? 'Admin',
            'action' => 'Tạo dịch vụ',
            'details' => "Hệ thống tự sinh mã dịch vụ: {$autoCode}"
        ]);

        return response()->json(['message' => 'Tạo dịch vụ thành công', 'data' => $service], 201);
    });
}

    // Cập nhật dịch vụ
    public function update(UpdateServiceRequest $request, Service $service)
{
    if ($request->status === 'active') {
        if (empty($request->price)) {
            return response()->json(['message' => 'Dịch vụ phải có giá tiền mới được phép Đang áp dụng.'], 422);
        }
        if (empty($request->specialties) && $service->specialties()->count() === 0) {
             return response()->json(['message' => 'Dịch vụ cần ít nhất một chuyên môn để Đang áp dụng.'], 422);
        }
    }

    return DB::transaction(function () use ($request, $service) {
        $oldPrice = $service->price;
        
        // BƯỚC 1: Lấy dữ liệu từ request, loại bỏ các trường không thuộc bảng services
        $updateData = $request->except(['specialties', 'attachments']);

        // BƯỚC 2: Xử lý triệt để lỗi NULL commission_rate
        // Nếu trong request không gửi commission_rate, ta lấy giá trị cũ. 
        // Nếu giá trị cũ vẫn null (do data rác), ta ép nó về 0.
        if (!isset($updateData['commission_rate'])) {
            $updateData['commission_rate'] = $service->commission_rate ?? 0;
        }

        // BƯỚC 3: Cập nhật
        $service->update($updateData);

        // Cập nhật chuyên môn (N-N)
        if ($request->has('specialties')) {
            $service->specialties()->sync($request->specialties);
        }

        // Upload thêm file mới (nếu có)
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('service_attachments', 'public');
                $service->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->extension()
                ]);
            }
        }

        // Ghi log thay đổi giá
        if ($oldPrice != $service->price) {
            AuditLog::create([
                'admin_id' => Auth::id(),
                'admin_name' => Auth::user()->name ?? 'Admin',
                'action' => 'Sửa giá dịch vụ',
                'details' => "Đổi giá {$service->service_code} từ " . number_format($oldPrice) . " sang " . number_format($service->price)
            ]);
        }

        return response()->json(['message' => 'Cập nhật dịch vụ thành công', 'data' => $service]);
    });
}
   // Xóa dịch vụ (Quy tắc 7: Không xóa vật lý)
    public function destroy(Service $service)
    {
        // SỬA TẠI ĐÂY: Dùng Query Builder để chỉ update đúng status, né lỗi dirty attributes
        \App\Models\Service::where('id', $service->id)->update(['status' => 'inactive']);

        AuditLog::create([
            'admin_id' => Auth::id(),
            'admin_name' => Auth::user()->name ?? 'Admin',
            'action' => 'Vô hiệu hóa dịch vụ',
            'details' => "Chuyển trạng thái dịch vụ {$service->service_code} sang Ngừng áp dụng"
        ]);

        return response()->json(['message' => 'Đã chuyển trạng thái dịch vụ sang Ngừng áp dụng theo quy tắc hệ thống.']);
    }
}