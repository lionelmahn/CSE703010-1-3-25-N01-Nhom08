<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\AdjustInvoiceRequest;
use App\Http\Requests\Billing\CancelInvoiceRequest;
use App\Http\Requests\Billing\CreateInvoiceRequest;
use App\Http\Requests\Billing\DiscountRequest;
use App\Http\Requests\Billing\SurchargeRequest;
use App\Models\ExaminationSession;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoices) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) ($request->query('per_page', 20))));
        $query = Invoice::query()->with([
            'patient:id,patient_code,full_name,phone',
            'doctor:id,name',
            'examination:id,code,status',
        ]);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', (int) $patientId);
        }

        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(CreateInvoiceRequest $request): JsonResponse
    {
        $session = ExaminationSession::findOrFail((int) $request->input('examination_id'));
        $invoice = $this->invoices->createFromExamination($session, $request->user());

        return response()->json(['data' => $this->showPayload($invoice->id)], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->showPayload($id)]);
    }

    public function discount(int $id, DiscountRequest $request): JsonResponse
    {
        $this->invoices->applyDiscount($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->showPayload($id)]);
    }

    public function surcharge(int $id, SurchargeRequest $request): JsonResponse
    {
        $this->invoices->applySurcharge($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->showPayload($id)]);
    }

    public function cancel(int $id, CancelInvoiceRequest $request): JsonResponse
    {
        $this->invoices->cancel($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->showPayload($id)]);
    }

    public function adjust(int $id, AdjustInvoiceRequest $request): JsonResponse
    {
        $this->invoices->adjust($id, $request->validated(), $request->user());

        return response()->json(['data' => $this->showPayload($id)]);
    }

    public function print(int $id): JsonResponse
    {
        $invoice = Invoice::with(['items', 'payments' => function ($q) {
            $q->whereNull('voided_at');
        }, 'patient', 'doctor', 'branch'])->findOrFail($id);

        return response()->json([
            'data' => [
                'invoice' => $invoice,
                'meta' => [
                    'printed_at' => now()->toIso8601String(),
                    'amount_in_words' => $this->amountInWords((float) $invoice->total),
                ],
            ],
        ]);
    }

    private function showPayload(int $id): array
    {
        $invoice = Invoice::with([
            'items',
            'payments' => function ($q) {
                $q->whereNull('voided_at');
            },
            'adjustments',
            'patient:id,patient_code,full_name,phone,dob,gender',
            'doctor:id,name,email',
            'examination',
            'branch:id,name',
        ])->findOrFail($id);

        return [
            'invoice' => $invoice,
            'amount_in_words' => $this->amountInWords((float) $invoice->total),
        ];
    }

    /**
     * Mot helper rat don gian doc tien thanh chu (VND) - chi support so
     * nguyen. Khong dung cho rang buoc phap ly; chu yeu UX hien thi.
     */
    private function amountInWords(float $amount): string
    {
        $amount = (int) round($amount);
        if ($amount <= 0) {
            return 'Khong dong';
        }

        $units = ['', 'mot', 'hai', 'ba', 'bon', 'nam', 'sau', 'bay', 'tam', 'chin'];

        $readThree = function ($num, $full = false) use ($units) {
            $h = intdiv($num, 100);
            $t = intdiv($num % 100, 10);
            $u = $num % 10;
            $out = '';
            if ($full || $h > 0) {
                $out .= $units[$h].' tram';
            }
            if ($t > 1) {
                $out .= ' '.$units[$t].' muoi';
                if ($u > 0) {
                    $out .= ' '.$units[$u];
                }
            } elseif ($t === 1) {
                $out .= ' muoi';
                if ($u > 0) {
                    $out .= ' '.($u === 5 ? 'lam' : $units[$u]);
                }
            } else {
                if ($u > 0) {
                    if ($full || $h > 0) {
                        $out .= ' linh '.$units[$u];
                    } else {
                        $out .= $units[$u];
                    }
                }
            }

            return trim($out);
        };

        $billion = intdiv($amount, 1_000_000_000);
        $million = intdiv($amount % 1_000_000_000, 1_000_000);
        $thousand = intdiv($amount % 1_000_000, 1_000);
        $rest = $amount % 1_000;

        $parts = [];
        if ($billion > 0) {
            $parts[] = $readThree($billion).' ty';
        }
        if ($million > 0) {
            $parts[] = $readThree($million, $billion > 0).' trieu';
        }
        if ($thousand > 0) {
            $parts[] = $readThree($thousand, $million > 0 || $billion > 0).' nghin';
        }
        if ($rest > 0) {
            $parts[] = $readThree($rest, ($million + $billion + $thousand) > 0);
        }

        $result = implode(' ', array_filter($parts));

        return ucfirst(trim($result)).' dong';
    }
}
