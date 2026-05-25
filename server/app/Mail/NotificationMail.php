<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * UC10 - Mailable chung dung cho moi notification.
 *
 * Subject + body_html da duoc NotificationService render san truoc khi tao
 * Mailable. View "emails.layouts.clinic" boc them header/footer phong kham.
 */
class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $renderedSubject;
    public string $renderedHtml;
    public ?string $renderedText;
    public ?string $headerColor;

    public function __construct(
        string $renderedSubject,
        string $renderedHtml,
        ?string $renderedText = null,
        ?string $headerColor = null,
    ) {
        $this->renderedSubject = $renderedSubject;
        $this->renderedHtml = $renderedHtml;
        $this->renderedText = $renderedText;
        $this->headerColor = $headerColor;
    }

    public function build(): self
    {
        $mail = $this->subject($this->renderedSubject)
            ->view('emails.layouts.clinic', [
                'content' => $this->renderedHtml,
                'title' => $this->renderedSubject,
                'headerColor' => $this->headerColor,
            ]);

        if (! empty($this->renderedText)) {
            $mail->text('emails.layouts.clinic-text', [
                'content' => $this->renderedText,
            ]);
        }

        return $mail;
    }
}
