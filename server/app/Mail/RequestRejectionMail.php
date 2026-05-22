<?php

namespace App\Mail;

use App\Models\OnlineBookingRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * UC6.2 - ER-03: Email tu choi yeu cau.
 */
class RequestRejectionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public OnlineBookingRequest $request,
        public string $reason,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tu choi yeu cau dat lich - '.$this->request->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.online-bookings.request-rejection',
            with: [
                'request' => $this->request,
                'reason' => $this->reason,
            ],
        );
    }
}
