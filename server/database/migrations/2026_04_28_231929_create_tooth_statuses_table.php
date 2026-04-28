<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tooth_statuses', function (Blueprint $table) {
    $table->id();
    $table->string('status_code')->unique(); // E1: Duy nhất
    $table->string('name');
    $table->enum('status_group', ['normal', 'pathology', 'treated', 'monitored', 'missing']); // Quy tắc 5
    $table->string('color_code'); // E4: Màu hiển thị
    $table->string('icon')->nullable(); // <-- ĐÂY LÀ HÌNH TRẠNG THÁI
    $table->text('description')->nullable();
    $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('approved');
    $table->boolean('is_active')->default(true); // Quy tắc 6
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
    $table->integer('sort_order')->default(0);
   
});
    }

    public function down(): void {
        Schema::dropIfExists('tooth_statuses');
    }
};