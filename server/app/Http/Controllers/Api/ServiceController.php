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
    public function index()
    {
        $services = Service::with(['specialties', 'attachments'])->orderBy('id', 'desc')->get();
        return response()->json($services);
    }

    public function store(StoreServiceRequest $request)
    {
        if ($request->status === 'active') {
            if (empty($request->price)) {
                return response()->json(['message' => 'Dịch vụ phải có giá tiền mới được phép Đang áp dụng.'], 422);
            }
            if (empty($request->specialties)) {
                return response()->json(['message' => 'Phải chọn ít nhất một chuyên môn để áp dụng dịch vụ.'], 422);
            }
        }

        return DB::transaction(function () use ($request) {
            $validatedData = $request->validated();
            $latestService = Service::orderBy('id', 'desc')->first();
            $nextId = $latestService ? $latestService->id + 1 : 1;
            $validatedData['service_code'] = 'DV' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

            $service = Service::create($validatedData);

            if (!empty($request->specialties)) {
                $service->specialties()->sync($request->specialties);
            }

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

            return response()->json(['message' => 'Tạo dịch vụ thành công', 'data' => $service], 201);
        });
    }

    public function update(UpdateServiceRequest $request, Service $service)
    {
        return DB::transaction(function () use ($request, $service) {
            $oldPrice = $service->price;
            $service->update($request->validated());

            if (isset($request->specialties)) {
                $service->specialties()->sync($request->specialties);
            }

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

    public function destroy(Service $service)
    {
        return DB::transaction(function () use ($service) {
            if ($service->status === 'draft') {
                $service->specialties()->detach();
                $service->delete();

                AuditLog::create([
                    'admin_id' => Auth::id(),
                    'admin_name' => Auth::user()->name ?? 'Admin',
                    'action' => 'Xóa vĩnh viễn',
                    'details' => "Đã xóa vĩnh viễn bản nháp: {$service->name}"
                ]);

                return response()->json(['message' => 'Đã xóa vĩnh viễn bản nháp thành công']);
            }

            $service->update(['status' => 'inactive']);

            AuditLog::create([
                'admin_id' => Auth::id(),
                'admin_name' => Auth::user()->name ?? 'Admin',
                'action' => 'Vô hiệu hóa',
                'details' => "Chuyển {$service->service_code} sang Ngừng áp dụng"
            ]);

            return response()->json(['message' => 'Đã chuyển sang trạng thái Ngừng áp dụng']);
        });
    }
}