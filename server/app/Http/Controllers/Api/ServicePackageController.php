<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServicePackage;
use App\Models\Service;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ServicePackageController extends Controller
{
    public function index()
    {
        $packages = ServicePackage::with('services')->orderBy('id', 'desc')->get();
        return response()->json($packages);
    }

    public function store(Request $request)
    {
        // Kiểm tra ràng buộc
        $request->validate([
            'name' => 'required|string|max:255',
            'package_price' => 'required|numeric|min:0',
            'services' => 'required|array|min:1',
        ]);

        return DB::transaction(function () use ($request) {
            $latest = ServicePackage::orderBy('id', 'desc')->first();
            $nextId = $latest ? $latest->id + 1 : 1;
            $packageCode = 'PK' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

            $packageData = $request->only([
                'name', 'description', 'package_price', 'discount_value', 
                'discount_type', 'valid_from', 'valid_to', 'usage_limit_days', 
                'conditions', 'visibility', 'status', 'notes'
            ]);
            $packageData['package_code'] = $packageCode;

            $package = ServicePackage::create($packageData);

            $totalOriginalPrice = 0;
            foreach ($request->services as $item) {
                $service = Service::find($item['service_id']);
                if ($service) {
                    $totalOriginalPrice += ($service->price * $item['quantity']);
                    $package->services()->attach($item['service_id'], [
                        'quantity' => $item['quantity']
                    ]);
                }
            }

            $package->update(['original_price' => $totalOriginalPrice]);

            AuditLog::create([
                'admin_id' => Auth::id(),
                'admin_name' => Auth::user()->name ?? 'Admin',
                'action' => 'Tạo gói dịch vụ',
                'details' => "Tạo gói {$packageCode}: {$package->name}"
            ]);

            return response()->json([
                'message' => 'Tạo gói dịch vụ thành công',
                'data' => $package->load('services')
            ], 201);
        });
    }

    // ĐÃ SỬA CHỖ NÀY: Dùng trực tiếp $id thay vì ServicePackage $package
    public function update(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            // Tìm chính xác gói dịch vụ bằng ID
            $servicePackage = ServicePackage::findOrFail($id);

            $servicePackage->update($request->only([
                'name', 'description', 'package_price', 'discount_value', 
                'discount_type', 'valid_from', 'valid_to', 'usage_limit_days', 
                'conditions', 'visibility', 'status', 'notes'
            ]));

            // Cập nhật lại danh sách dịch vụ con
            if ($request->has('services')) {
                // Xóa các dịch vụ cũ
                $servicePackage->services()->detach();
                
                $totalOriginalPrice = 0;
                // Thêm lại các dịch vụ mới
                foreach ($request->services as $item) {
                    $service = Service::find($item['service_id']);
                    if ($service) {
                        $totalOriginalPrice += ($service->price * $item['quantity']);
                        $servicePackage->services()->attach($item['service_id'], [
                            'quantity' => $item['quantity']
                        ]);
                    }
                }
                // Tính lại giá trị thực
                $servicePackage->update(['original_price' => $totalOriginalPrice]);
            }

            AuditLog::create([
                'admin_id' => Auth::id(),
                'admin_name' => Auth::user()->name ?? 'Admin',
                'action' => 'Cập nhật gói dịch vụ',
                'details' => "Chỉnh sửa trạng thái / thông tin gói {$servicePackage->package_code}"
            ]);

            return response()->json([
                'message' => 'Cập nhật thành công',
                'data' => $servicePackage->load('services')
            ]);
        });
    }

    // ĐÃ SỬA CHỖ NÀY: Dùng trực tiếp $id
    public function destroy($id)
    {
        return DB::transaction(function () use ($id) {
            // Tìm chính xác gói dịch vụ bằng ID
            $servicePackage = ServicePackage::findOrFail($id);

            if ($servicePackage->status === 'draft') {
                $servicePackage->services()->detach();
                $servicePackage->delete();
                
                AuditLog::create([
                    'admin_id' => Auth::id(),
                    'admin_name' => Auth::user()->name ?? 'Admin',
                    'action' => 'Xóa gói dịch vụ',
                    'details' => "Xóa vĩnh viễn bản nháp gói: {$servicePackage->package_code}"
                ]);

                return response()->json(['message' => 'Đã xóa vĩnh viễn bản nháp gói dịch vụ']);
            }

            $servicePackage->update(['status' => 'inactive']);

            AuditLog::create([
                'admin_id' => Auth::id(),
                'admin_name' => Auth::user()->name ?? 'Admin',
                'action' => 'Vô hiệu hóa gói',
                'details' => "Chuyển gói {$servicePackage->package_code} sang Ngừng áp dụng"
            ]);

            return response()->json(['message' => 'Đã chuyển trạng thái gói sang Ngừng áp dụng']);
        });
    }
}