<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ToothStatus;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ToothStatusController extends Controller
{
    // A1. Lấy danh sách (Phân quyền: Bác sĩ thấy ít hơn Admin)
    public function index()
{
    $user = Auth::user();
    $role = $user->roles->first()->slug;

    // Admin: Thấy tất cả để quản lý
    if ($role === 'admin') {
        return response()->json(ToothStatus::orderBy('sort_order')->get());
    }

    // Bác sĩ/Lễ tân: Chỉ thấy những cái Đã duyệt + Đang hoạt động để khám bệnh
    return response()->json(
        ToothStatus::where('approval_status', 'approved')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
        );
}

    // A1. Thêm mới / Gửi đề xuất
    public function store(Request $request)
    {
        $request->validate([
            'status_code' => 'required|unique:tooth_statuses,status_code',
            'name' => 'required',
            'status_group' => 'required|in:normal,pathology,treated,monitored,missing',
            'color_code' => 'required',
        ]);

        $user = Auth::user();
        $isAdmin = $user->roles->first()->slug === 'admin';

        $status = ToothStatus::create([
            'status_code' => strtoupper($request->status_code),
            'name' => $request->name,
            'status_group' => $request->status_group,
            'color_code' => $request->color_code,
            'description' => $request->description,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => true,
            'created_by' => $user->id,
            'approval_status' => $isAdmin ? 'approved' : 'pending'
        ]);

        // Ghi log
        AuditLog::create([
            'admin_id' => $user->id,
            'admin_name' => $user->name,
            'action' => $isAdmin ? 'Tạo trạng thái răng' : 'Gửi đề xuất trạng thái răng',
            'details' => "Tạo trạng thái: {$status->name} ({$status->status_code})"
        ]);

        return response()->json(['message' => 'Thành công', 'data' => $status]);
    }

    // --- BỔ SUNG HÀM UPDATE (FILE BẠN GỬI ĐANG THIẾU CÁI NÀY) ---
    public function update(Request $request, $id)
    {
        $status = ToothStatus::findOrFail($id);
        
        $request->validate([
            'status_code' => 'required|unique:tooth_statuses,status_code,'.$id,
            'name' => 'required',
            'status_group' => 'required',
            'color_code' => 'required',
        ]);

        $status->update($request->all());

        return response()->json(['message' => 'Cập nhật thành công', 'data' => $status]);
    }

    // A1.3 Admin phê duyệt đề xuất
    public function approve(Request $request, $id)
    {
        if (Auth::user()->roles->first()->slug !== 'admin') {
            return response()->json(['message' => 'Bạn không có quyền'], 403);
        }

        $status = ToothStatus::findOrFail($id);
        $status->update(['approval_status' => $request->action === 'approve' ? 'approved' : 'rejected']);

        // Ghi log duyệt
        AuditLog::create([
            'admin_id' => Auth::id(),
            'admin_name' => Auth::user()->name,
            'action' => 'Phê duyệt trạng thái răng',
            'details' => "Trạng thái hành động: {$request->action} cho {$status->name}"
        ]);

        return response()->json(['message' => 'Đã xử lý đề xuất']);
    }

    // A2 & E3: Xử lý xóa hoặc ngừng sử dụng
    public function destroy($id)
    {
        $status = ToothStatus::findOrFail($id);

        // Logic kiểm tra E3: Nếu đã dùng trong hồ sơ bệnh án (sau này bạn nối bảng sẽ dùng DB::table)
        $isUsed = false; 

        if ($isUsed) {
            $status->update(['is_active' => false]);
            return response()->json(['message' => 'Đã chuyển sang trạng thái Ngừng sử dụng vì dữ liệu đang được dùng'], 200);
        }

        $status->delete();
        return response()->json(['message' => 'Xóa thành công']);
    }
}