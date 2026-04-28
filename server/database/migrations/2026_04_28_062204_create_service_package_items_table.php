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
        Schema::create('service_package_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('service_packages')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services');
            $table->integer('quantity')->default(1); // Số lần sử dụng dịch vụ này trong gói
            $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_package_items');
    }
};
