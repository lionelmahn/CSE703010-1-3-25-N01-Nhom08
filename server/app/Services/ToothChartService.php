<?php

namespace App\Services;

use App\Models\ExaminationHistory;
use App\Models\ExaminationSession;
use App\Models\ExaminationToothChart;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * UC12 - Quan ly so do rang cua mot phien kham (DR68).
 *
 * Upsert bulk de phu hop pattern FE click & drag tren dental chart.
 */
class ToothChartService
{
    /**
     * @return array<int, array<string,mixed>>
     */
    public function listForExamination(int $examinationId): array
    {
        return ExaminationToothChart::query()
            ->where('examination_id', $examinationId)
            ->with('status:id,name,code,color,icon')
            ->orderBy('tooth_fdi')
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'tooth_fdi' => $row->tooth_fdi,
                'tooth_status_id' => $row->tooth_status_id,
                'note' => $row->note,
                'status' => $row->status ? [
                    'id' => $row->status->id,
                    'code' => $row->status->code,
                    'name' => $row->status->name,
                    'color' => $row->status->color,
                ] : null,
            ])
            ->toArray();
    }

    /**
     * Upsert nhieu rang trong 1 transaction. payload mong:
     *  entries: [
     *    { tooth_fdi: '36', tooth_status_id: 5, note: 'Sau rang' }
     *  ]
     *
     * @param  array<int, array<string,mixed>>  $entries
     */
    public function bulkUpsert(int $examinationId, array $entries, User $actor): array
    {
        return DB::transaction(function () use ($examinationId, $entries, $actor) {
            /** @var ExaminationSession $session */
            $session = ExaminationSession::query()->lockForUpdate()->findOrFail($examinationId);

            if (! $session->isEditable()) {
                throw ValidationException::withMessages([
                    'status' => 'Phien khong o trang thai cho phep cap nhat so do rang (SR).',
                ])->status(409);
            }

            $validFdi = ExaminationToothChart::validFdiCodes();
            $touched = [];
            $beforeSnapshot = $session->toothChart()->get()
                ->keyBy('tooth_fdi')
                ->map(fn ($row) => [
                    'tooth_status_id' => $row->tooth_status_id,
                    'note' => $row->note,
                ])
                ->toArray();

            foreach ($entries as $entry) {
                if (! is_array($entry)) {
                    continue;
                }
                $fdi = (string) ($entry['tooth_fdi'] ?? '');
                if (! in_array($fdi, $validFdi, true)) {
                    throw ValidationException::withMessages([
                        'tooth_fdi' => 'Ma rang khong hop le: '.$fdi,
                    ]);
                }

                $statusId = $entry['tooth_status_id'] ?? null;
                $note = isset($entry['note'])
                    ? trim(strip_tags((string) $entry['note']))
                    : null;

                if ($statusId === null && ($note === null || $note === '')) {
                    // Xoa neu khong co status va note.
                    $session->toothChart()->where('tooth_fdi', $fdi)->delete();
                } else {
                    ExaminationToothChart::updateOrCreate(
                        ['examination_id' => $session->id, 'tooth_fdi' => $fdi],
                        [
                            'tooth_status_id' => $statusId ? (int) $statusId : null,
                            'note' => $note,
                        ]
                    );
                }
                $touched[] = $fdi;
            }

            $session->touch();

            ExaminationHistory::create([
                'examination_id' => $session->id,
                'action' => 'tooth_chart_update',
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'before' => $beforeSnapshot,
                'after' => ['touched_fdi' => $touched],
                'created_at' => Carbon::now(),
            ]);

            return $this->listForExamination($session->id);
        });
    }
}
