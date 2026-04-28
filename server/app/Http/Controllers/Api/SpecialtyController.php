<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServicePackage;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ServicePackageController extends Controller
{
    public function index()
    {
        return response()->json(ServicePackage::with('services')->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        // Validate cơ bản
        $request->validate([
            'name' => 'required',
            'package_price' => 'required|numeric',
            'services' => 'required|array'
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Tự sinh mã PKxxx
            $latest = ServicePackage::orderBy('id', 'desc')->first();
            $nextId = $latest ? $latest->id + 1 : 1;
            $code = 'PK' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

            // 2. Tạo gói
            $package = ServicePackage::create(array_merge($request->all(), ['package_code' => $code]));

            // 3. Lưu dịch vụ thành phần và tính tổng giá gốc
            $totalOriginalPrice = 0;
            foreach ($request->services as $item) {
                $service = \App\Models\Service::find($item['service_id']);
                $totalOriginalPrice += ($service->price * $item['quantity']);
                $package->services()->attach($item['service_id'], ['quantity' => $item['quantity']]);
            }

            // 4. Cập nhật lại giá gốc tổng hợp
            $package->update(['original_price' => $totalOriginalPrice]);

            AuditLog::create([
                'admin_id' => Auth::id(),
                'admin_name' => Auth::user()->name,
                'action' => 'Tạo gói dịch vụ',
                'details' => "Tạo gói {$code} với tổng giá gốc " . number_format($totalOriginalPrice)
            ]);

            return response()->json($package, 201);
        });
    }

    public function destroy(ServicePackage $servicePackage)
    {
        if ($servicePackage->status === 'draft') {
            $servicePackage->services()->detach();
            $servicePackage->delete();
            return response()->json(['message' => 'Đã xóa gói nháp']);
        }
        $servicePackage->update(['status' => 'inactive']);
        return response()->json(['message' => 'Đã ngừng áp dụng gói']);
    }
}