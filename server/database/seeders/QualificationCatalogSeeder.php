<?php

namespace Database\Seeders;

use App\Models\QualificationCatalog;
use Illuminate\Database\Seeder;

class QualificationCatalogSeeder extends Seeder
{
    public function run(): void
    {
        foreach (QualificationCatalog::defaultRows() as $row) {
            QualificationCatalog::query()->updateOrCreate(
                ['code' => $row['code']],
                $row
            );
        }
    }
}
