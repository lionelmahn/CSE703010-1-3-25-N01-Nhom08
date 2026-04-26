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
        // Kiểm tra nghiệp vụ đặc tả (Quy tắc 6)
        if ($request->status === 'active') {
            if (empty($request->price)) {
                return response()->json(['message' => 'Dịch vụ phải có giá tiền mới được phép Đang áp dụng.'], 422);
            }
            if (empty($request->specialties)) {
                return response()->json(['message' => 'Phải chọn ít nhất một chuyên môn để áp dụng dịch vụ.'], 422);
            }
        }

        return DB::transaction(function () use ($request) {
            // SỬA TẠI ĐÂY: Loại bỏ specialties để tránh lỗi Unknown column
            $service = Service::create($request->except('specialties'));

            // Lưu chuyên môn (N-N) vào bảng trung gian
            if ($request->has('specialties')) {
                $service->specialties()->sync($request->specialties);
            }

            // Xử lý upload hình ảnh/tài liệu
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

            AuditLog::create([
                'admin_id' => Auth::id(),
                'admin_name' => Auth::user()->name ?? 'Admin',
                'action' => 'Tạo dịch vụ',
                'details' => "Tạo mới dịch vụ mã: {$service->service_code}"
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
            // Kiểm tra xem đã có chuyên môn nào chưa (từ request hoặc từ DB cũ)
            if (empty($request->specialties) && $service->specialties()->count() === 0) {
                 return response()->json(['message' => 'Dịch vụ cần ít nhất một chuyên môn để Đang áp dụng.'], 422);
            }
        }

        return DB::transaction(function () use ($request, $service) {
            $oldPrice = $service->price;
            
            // SỬA TẠI ĐÂY: Loại bỏ specialties để tránh lỗi Unknown column
            $service->update($request->except('specialties'));

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

            // Ghi log thay đổi giá (Quy tắc 10)
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
        $service->update(['status' => 'inactive']);

        AuditLog::create([
            'admin_id' => Auth::id(),
            'admin_name' => Auth::user()->name ?? 'Admin',
            'action' => 'Vô hiệu hóa dịch vụ',
            'details' => "Chuyển trạng thái dịch vụ {$service->service_code} sang Ngừng áp dụng"
        ]);

        return response()->json(['message' => 'Đã chuyển trạng thái dịch vụ sang Ngừng áp dụng theo quy tắc hệ thống.']);
    }
}