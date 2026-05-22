<?php

namespace App\Mail;

use App\Models\Appointment;
use App\Models\OnlineBookingRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * UC6.2 - ER-01: Email xac nhan lich hen.
 */
class AppointmentConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public OnlineBookingRequest $request,
        public ?Appointment $appointment,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Xac nhan lich hen - '.($this->appointment?->code ?? $this->request->code),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.online-bookings.appointment-confirmation',
            with: [
                'request' => $this->request,
                'appointment' => $this->appointment,
            ],
        );
    }
}
