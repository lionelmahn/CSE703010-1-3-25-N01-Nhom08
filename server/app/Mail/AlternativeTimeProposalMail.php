<?php

namespace App\Mail;

use App\Models\OnlineBookingRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * UC6.2 - ER-02: Email de xuat khung gio khac.
 */
class AlternativeTimeProposalMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public OnlineBookingRequest $request,
        public array $proposedSlots,
        public ?string $messageBody = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'De xuat khung gio khac - '.$this->request->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.online-bookings.alternative-time-proposal',
            with: [
                'request' => $this->request,
                'slots' => $this->proposedSlots,
                'messageBody' => $this->messageBody,
            ],
        );
    }
}
