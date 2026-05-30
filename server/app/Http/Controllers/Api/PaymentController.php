<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\CreatePaymentRequest;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function store(int $invoiceId, CreatePaymentRequest $request): JsonResponse
    {
        $rows = $request->input('payments', []);
        $invoice = $this->payments->createPayments($invoiceId, $rows, $request->user());

        return response()->json([
            'data' => [
                'invoice' => $invoice,
            ],
        ], Response::HTTP_CREATED);
    }

    public function receipt(int $paymentId, Request $request): JsonResponse
    {
        $payment = PaymentTransaction::query()
            ->with(['invoice.patient', 'invoice.doctor', 'invoice.branch'])
            ->findOrFail($paymentId);

        /** @var Invoice $invoice */
        $invoice = $payment->invoice;

        return response()->json([
            'data' => [
                'payment' => $payment,
                'invoice' => $invoice,
                'meta' => [
                    'printed_at' => now()->toIso8601String(),
                ],
            ],
        ]);
    }
}
