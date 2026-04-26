<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void 
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('service_code')->unique(); // Mã dịch vụ (bắt buộc)
            $table->string('name'); // Tên dịch vụ
            $table->string('service_group'); // Nhóm dịch vụ (Cột bị thiếu nè)
            $table->text('description')->nullable(); // Mô tả
            $table->decimal('price', 15, 2)->nullable(); // Giá tiền
            $table->integer('duration_minutes')->default(30); // Thời lượng thực hiện
            $table->enum('status', ['draft', 'active', 'hidden', 'inactive'])->default('draft'); // Trạng thái
            $table->enum('visibility', ['public', 'internal'])->default('internal'); // Tầm nhìn
            $table->integer('commission_rate')->default(0); // Tỉ lệ hoa hồng 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
