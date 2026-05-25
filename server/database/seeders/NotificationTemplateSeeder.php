<?php

namespace Database\Seeders;

use App\Models\AppNotification;
use App\Models\AppNotificationTemplate;
use Illuminate\Database\Seeder;

/**
 * UC10 - Seed 7 mau email mac dinh cho cac event nghiep vu.
 *
 * Idempotent qua updateOrCreate(['code' => ...]). Mau khong ghi de version
 * neu admin da chinh sua sau khi seed (kiem tra version > 1 thi skip).
 */
class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->templates() as $payload) {
            $existing = AppNotificationTemplate::where('code', $payload['code'])->first();
            if ($existing && $existing->version > 1) {
                // Admin da chinh sua - khong ghi de.
                continue;
            }
            AppNotificationTemplate::updateOrCreate(
                ['code' => $payload['code']],
                array_merge($payload, [
                    'is_active' => $payload['is_active'] ?? true,
                    'version' => $existing ? $existing->version : 1,
                ])
            );
        }
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function templates(): array
    {
        return [
            [
                'code' => AppNotification::TYPE_REQUEST_RECEIVED,
                'type' => AppNotification::TYPE_REQUEST_RECEIVED,
                'name' => 'Da tiep nhan yeu cau dat lich',
                'subject' => '[{{clinic_name}}] Da tiep nhan yeu cau dat lich {{request_code}}',
                'body_html' => <<<'HTML'
<h2 style="color:#2563eb;margin-top:0;">Da tiep nhan yeu cau dat lich</h2>
<p>Xin chao <strong>{{recipient_name}}</strong>,</p>
<p>Chung toi da nhan duoc yeu cau dat lich <strong>{{request_code}}</strong> cua quy khach. Day la <em>yeu cau dat lich</em>, chua phai lich hen chinh thuc - le tan se lien he xac nhan trong thoi gian som nhat.</p>
<table style="border-collapse:collapse;margin:12px 0;">
    <tr><td style="padding:4px 12px;font-weight:600;">Ho ten:</td><td style="padding:4px 12px;">{{recipient_name}}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:600;">Dien thoai:</td><td style="padding:4px 12px;">{{recipient_phone}}</td></tr>
    @if(!empty($preferred_date))
    <tr><td style="padding:4px 12px;font-weight:600;">Ngay mong muon:</td><td style="padding:4px 12px;">{{preferred_date}}</td></tr>
    @endif
    @if(!empty($preferred_time_slot))
    <tr><td style="padding:4px 12px;font-weight:600;">Khung gio mong muon:</td><td style="padding:4px 12px;">{{preferred_time_slot}}</td></tr>
    @endif
    @if(!empty($branch_name))
    <tr><td style="padding:4px 12px;font-weight:600;">Chi nhanh:</td><td style="padding:4px 12px;">{{branch_name}}</td></tr>
    @endif
</table>
<p>Neu can ho tro gap, vui long lien he hotline <strong>{{clinic_hotline}}</strong>.</p>
<p>Tran trong,<br>{{clinic_name}}</p>
HTML,
                'body_text' => "Xin chao {{recipient_name}},\n\nChung toi da nhan yeu cau dat lich {{request_code}} cua quy khach. Day la yeu cau dat lich, chua phai lich hen chinh thuc - le tan se lien he xac nhan som.\n\nHotline: {{clinic_hotline}}\n\nTran trong,\n{{clinic_name}}",
                'required_vars' => ['recipient_name', 'request_code', 'recipient_phone', 'clinic_name', 'clinic_hotline'],
            ],
            [
                'code' => AppNotification::TYPE_APPOINTMENT_CONFIRMATION,
                'type' => AppNotification::TYPE_APPOINTMENT_CONFIRMATION,
                'name' => 'Xac nhan lich hen',
                'subject' => '[{{clinic_name}}] Xac nhan lich hen {{appointment_code}}',
                'body_html' => <<<'HTML'
<h2 style="color:#16a34a;margin-top:0;">Xac nhan lich hen</h2>
<p>Xin chao <strong>{{recipient_name}}</strong>,</p>
<p>Chung toi xac nhan lich hen <strong>{{appointment_code}}</strong> tai {{clinic_name}}.</p>
<table style="border-collapse:collapse;margin:12px 0;">
    <tr><td style="padding:4px 12px;font-weight:600;">Ma lich hen:</td><td style="padding:4px 12px;">{{appointment_code}}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:600;">Ngay hen:</td><td style="padding:4px 12px;">{{appointment_date}}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:600;">Khung gio:</td><td style="padding:4px 12px;">{{appointment_time_slot}}</td></tr>
    @if(!empty($branch_name))
    <tr><td style="padding:4px 12px;font-weight:600;">Chi nhanh:</td><td style="padding:4px 12px;">{{branch_name}}</td></tr>
    @endif
    @if(!empty($services_list))
    <tr><td style="padding:4px 12px;font-weight:600;vertical-align:top;">Dich vu:</td><td style="padding:4px 12px;">{{services_list}}</td></tr>
    @endif
</table>
<p>Vui long co mat truoc gio hen 10 phut. Neu can thay doi, lien he hotline <strong>{{clinic_hotline}}</strong>.</p>
<p>Tran trong,<br>{{clinic_name}}</p>
HTML,
                'body_text' => "Xin chao {{recipient_name}},\n\nChung toi xac nhan lich hen {{appointment_code}} vao {{appointment_date}} ({{appointment_time_slot}}).\n\nHotline: {{clinic_hotline}}\n\nTran trong,\n{{clinic_name}}",
                'required_vars' => ['recipient_name', 'appointment_code', 'appointment_date', 'appointment_time_slot', 'clinic_name', 'clinic_hotline'],
            ],
            [
                'code' => AppNotification::TYPE_ALTERNATIVE_PROPOSED,
                'type' => AppNotification::TYPE_ALTERNATIVE_PROPOSED,
                'name' => 'De xuat khung gio thay the',
                'subject' => '[{{clinic_name}}] De xuat khung gio thay the cho yeu cau {{request_code}}',
                'body_html' => <<<'HTML'
<h2 style="color:#f59e0b;margin-top:0;">De xuat khung gio thay the</h2>
<p>Xin chao <strong>{{recipient_name}}</strong>,</p>
<p>Khung gio quy khach lua chon cho yeu cau <strong>{{request_code}}</strong> hien khong con cho. Chung toi de xuat cac khung gio thay the sau:</p>
<ul>
    @foreach(($proposed_slots ?? []) as $slot)
        <li>{{ $slot['date'] ?? '' }} - {{ $slot['time_slot'] ?? ($slot['slot'] ?? '') }}</li>
    @endforeach
</ul>
@if(!empty($message_body))
<p><em>Ghi chu them: {{message_body}}</em></p>
@endif
<p>Vui long phan hoi qua hotline <strong>{{clinic_hotline}}</strong> hoac email <strong>{{clinic_email}}</strong> de xac nhan khung gio phu hop.</p>
<p>Tran trong,<br>{{clinic_name}}</p>
HTML,
                'body_text' => "Xin chao {{recipient_name}},\n\nKhung gio cho yeu cau {{request_code}} khong con cho. Vui long lien he hotline {{clinic_hotline}} de chon khung gio thay the.\n\nTran trong,\n{{clinic_name}}",
                'required_vars' => ['recipient_name', 'request_code', 'clinic_name', 'clinic_hotline'],
            ],
            [
                'code' => AppNotification::TYPE_REQUEST_REJECTED,
                'type' => AppNotification::TYPE_REQUEST_REJECTED,
                'name' => 'Tu choi yeu cau dat lich',
                'subject' => '[{{clinic_name}}] Yeu cau dat lich {{request_code}} chua duoc xac nhan',
                'body_html' => <<<'HTML'
<h2 style="color:#dc2626;margin-top:0;">Yeu cau dat lich chua duoc xac nhan</h2>
<p>Xin chao <strong>{{recipient_name}}</strong>,</p>
<p>Chung toi rat tiec phai thong bao yeu cau <strong>{{request_code}}</strong> chua the xac nhan voi ly do sau:</p>
<blockquote style="margin:12px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #dc2626;color:#7f1d1d;">{{reject_reason}}</blockquote>
<p>Quy khach co the gui yeu cau khac vao thoi diem phu hop hon hoac lien he hotline <strong>{{clinic_hotline}}</strong> de duoc ho tro.</p>
<p>Tran trong,<br>{{clinic_name}}</p>
HTML,
                'body_text' => "Xin chao {{recipient_name}},\n\nYeu cau {{request_code}} chua duoc xac nhan. Ly do: {{reject_reason}}.\n\nLien he hotline {{clinic_hotline}} de duoc ho tro.\n\nTran trong,\n{{clinic_name}}",
                'required_vars' => ['recipient_name', 'request_code', 'reject_reason', 'clinic_name', 'clinic_hotline'],
            ],
            [
                'code' => AppNotification::TYPE_APPOINTMENT_RESCHEDULED,
                'type' => AppNotification::TYPE_APPOINTMENT_RESCHEDULED,
                'name' => 'Doi lich hen',
                'subject' => '[{{clinic_name}}] Lich hen {{appointment_code}} da doi sang ngay moi',
                'body_html' => <<<'HTML'
<h2 style="color:#2563eb;margin-top:0;">Lich hen da duoc doi</h2>
<p>Xin chao <strong>{{recipient_name}}</strong>,</p>
<p>Lich hen <strong>{{appointment_code}}</strong> cua quy khach da duoc doi sang khung gio moi nhu sau:</p>
<table style="border-collapse:collapse;margin:12px 0;">
    @if(!empty($old_appointment_date))
    <tr><td style="padding:4px 12px;font-weight:600;">Ngay cu:</td><td style="padding:4px 12px;color:#6b7280;text-decoration:line-through;">{{old_appointment_date}} ({{old_time_slot}})</td></tr>
    @endif
    <tr><td style="padding:4px 12px;font-weight:600;">Ngay moi:</td><td style="padding:4px 12px;color:#16a34a;font-weight:600;">{{appointment_date}} ({{appointment_time_slot}})</td></tr>
    @if(!empty($branch_name))
    <tr><td style="padding:4px 12px;font-weight:600;">Chi nhanh:</td><td style="padding:4px 12px;">{{branch_name}}</td></tr>
    @endif
    @if(!empty($reschedule_reason))
    <tr><td style="padding:4px 12px;font-weight:600;vertical-align:top;">Ly do:</td><td style="padding:4px 12px;">{{reschedule_reason}}</td></tr>
    @endif
</table>
<p>Neu khung gio moi chua phu hop, vui long lien he hotline <strong>{{clinic_hotline}}</strong>.</p>
<p>Tran trong,<br>{{clinic_name}}</p>
HTML,
                'body_text' => "Xin chao {{recipient_name}},\n\nLich hen {{appointment_code}} da doi sang {{appointment_date}} ({{appointment_time_slot}}).\n\nHotline: {{clinic_hotline}}\n\nTran trong,\n{{clinic_name}}",
                'required_vars' => ['recipient_name', 'appointment_code', 'appointment_date', 'appointment_time_slot', 'clinic_name', 'clinic_hotline'],
            ],
            [
                'code' => AppNotification::TYPE_APPOINTMENT_CANCELLED,
                'type' => AppNotification::TYPE_APPOINTMENT_CANCELLED,
                'name' => 'Huy lich hen',
                'subject' => '[{{clinic_name}}] Lich hen {{appointment_code}} da bi huy',
                'body_html' => <<<'HTML'
<h2 style="color:#dc2626;margin-top:0;">Lich hen da bi huy</h2>
<p>Xin chao <strong>{{recipient_name}}</strong>,</p>
<p>Lich hen <strong>{{appointment_code}}</strong> ngay {{appointment_date}} ({{appointment_time_slot}}) cua quy khach da bi huy.</p>
@if(!empty($cancel_reason))
<blockquote style="margin:12px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #dc2626;color:#7f1d1d;">Ly do huy: {{cancel_reason}}</blockquote>
@endif
<p>Quy khach co the dat lich moi qua website hoac hotline <strong>{{clinic_hotline}}</strong>.</p>
<p>Tran trong,<br>{{clinic_name}}</p>
HTML,
                'body_text' => "Xin chao {{recipient_name}},\n\nLich hen {{appointment_code}} ngay {{appointment_date}} ({{appointment_time_slot}}) da bi huy. Hotline: {{clinic_hotline}}.\n\nTran trong,\n{{clinic_name}}",
                'required_vars' => ['recipient_name', 'appointment_code', 'appointment_date', 'appointment_time_slot', 'clinic_name', 'clinic_hotline'],
            ],
            [
                'code' => AppNotification::TYPE_REMINDER_24H,
                'type' => AppNotification::TYPE_REMINDER_24H,
                'name' => 'Nhac lich truoc 24 gio',
                'subject' => '[{{clinic_name}}] Nhac lich hen ngay mai - {{appointment_code}}',
                'body_html' => <<<'HTML'
<h2 style="color:#2563eb;margin-top:0;">Nhac lich hen</h2>
<p>Xin chao <strong>{{recipient_name}}</strong>,</p>
<p>{{clinic_name}} xin nhac lich hen cua quy khach se dien ra vao ngay mai:</p>
<table style="border-collapse:collapse;margin:12px 0;">
    <tr><td style="padding:4px 12px;font-weight:600;">Ma lich hen:</td><td style="padding:4px 12px;">{{appointment_code}}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:600;">Ngay hen:</td><td style="padding:4px 12px;">{{appointment_date}}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:600;">Khung gio:</td><td style="padding:4px 12px;">{{appointment_time_slot}}</td></tr>
    @if(!empty($branch_name))
    <tr><td style="padding:4px 12px;font-weight:600;">Chi nhanh:</td><td style="padding:4px 12px;">{{branch_name}}</td></tr>
    @endif
</table>
<p>Vui long co mat truoc gio hen 10 phut. Neu khong the den dung gio, lien he hotline <strong>{{clinic_hotline}}</strong> de doi/huy lich.</p>
<p>Tran trong,<br>{{clinic_name}}</p>
HTML,
                'body_text' => "Xin chao {{recipient_name}},\n\nNhac lich hen {{appointment_code}} vao {{appointment_date}} ({{appointment_time_slot}}). Hotline: {{clinic_hotline}}.\n\nTran trong,\n{{clinic_name}}",
                'required_vars' => ['recipient_name', 'appointment_code', 'appointment_date', 'appointment_time_slot', 'clinic_name', 'clinic_hotline'],
            ],
        ];
    }
}
