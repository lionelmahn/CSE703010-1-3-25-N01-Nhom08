<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServicePrice;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PriceListController extends Controller
{
    // Lấy danh sách (Đã sửa lỗi dấu chấm thành dấu ->)
    public function index()
    {
        // 1. Lấy danh sách kèm giá hiện tại theo giờ VN
        $services = Service::with(['currentPrice'])->orderBy('id', 'desc')->get();

        // 2. SMART SYNC: Tự động cập nhật bảng service gốc nếu đến giờ nhảy giá tương lai
        foreach ($services as $service) {
            // SỬA TẠI ĐÂY: Dùng -> thay vì .
            if ($service->currentPrice && $service->currentPrice->price != $service->price) {
                $service->update(['price' => $service->currentPrice->price]);
            }
        }

        return response()->json($services);
    }

    public function history($serviceId)
    {
        $prices = ServicePrice::where('service_id', $serviceId)
            ->orderBy('effective_from', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($prices);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'price' => 'required|numeric|min:1',
            'apply_type' => 'required|in:now,future',
            'effective_from' => 'nullable|date|required_if:apply_type,future'
        ]);

        return DB::transaction(function () use ($request) {
            $user = Auth::user();
            $isAdmin = $user->roles->first()->slug === 'admin';
            $now = Carbon::now('Asia/Ho_Chi_Minh');
            
            $effectiveFrom = $request->apply_type === 'now' ? $now : Carbon::parse($request->effective_from, 'Asia/Ho_Chi_Minh');

            if ($isAdmin) {
                $this->handleActivePriceReplacement($request->service_id, $effectiveFrom);
            }

            $priceRecord = ServicePrice::create([
                'service_id' => $request->service_id,
                'price' => $request->price,
                'effective_from' => $effectiveFrom,
                'status' => $isAdmin ? 'approved' : 'pending',
                'note' => $request->note
            ]);

            if ($isAdmin && $request->apply_type === 'now') {
                Service::where('id', $request->service_id)->update(['price' => $request->price]);
            }

            return response()->json(['message' => 'Thành công', 'data' => $priceRecord]);
        });
    }

    public function approve(Request $request, $id)
    {
        $priceRecord = ServicePrice::findOrFail($id);
        $now = Carbon::now('Asia/Ho_Chi_Minh');

        if ($request->action === 'approve') {
            return DB::transaction(function () use ($priceRecord, $now) {
                $this->handleActivePriceReplacement($priceRecord->service_id, $priceRecord->effective_from);
                $priceRecord->update(['status' => 'approved']);

                if (Carbon::parse($priceRecord->effective_from)->lte($now)) {
                    Service::where('id', $priceRecord->service_id)->update(['price' => $priceRecord->price]);
                }

                return response()->json(['message' => 'Đã phê duyệt']);
            });
        }

        $priceRecord->update(['status' => 'rejected']);
        return response()->json(['message' => 'Đã từ chối']);
    }

    private function handleActivePriceReplacement($serviceId, $effectiveFrom) {
        ServicePrice::where('service_id', $serviceId)
            ->where('status', 'approved')
            ->where(function($q) use ($effectiveFrom) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>', $effectiveFrom);
            })
            ->update(['effective_to' => $effectiveFrom]);
    }
}