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
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->string('package_code')->unique(); // PKxxx
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('original_price', 15, 2)->default(0); // Tổng giá các dịch vụ lẻ
            $table->decimal('package_price', 15, 2)->default(0);  // Giá bán thực tế
            $table->integer('usage_limit_days')->nullable();      // Thời hạn sử dụng (ví dụ: 365 ngày)
            $table->enum('status', ['draft', 'active', 'inactive', 'hidden'])->default('draft');
            $table->enum('visibility', ['public', 'internal'])->default('internal');
            $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_packages');
    }
};
