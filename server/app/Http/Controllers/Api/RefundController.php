<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\RefundRequest;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class RefundController extends Controller
{
    public function __construct(private readonly RefundService $refunds) {}

    public function store(int $invoiceId, RefundRequest $request): JsonResponse
    {
        $invoice = $this->refunds->refund($invoiceId, $request->validated(), $request->user());

        return response()->json([
            'data' => [
                'invoice' => $invoice,
            ],
        ], Response::HTTP_CREATED);
    }
}
