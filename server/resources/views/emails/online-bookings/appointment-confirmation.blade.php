<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Xac nhan lich hen</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937;">
    <h2 style="color: #16a34a;">Xac nhan lich hen Dental Pro</h2>
    <p>Xin chao {{ $request->name }},</p>
    <p>Chung toi xac nhan lich hen cho yeu cau dat lich <strong>{{ $request->code }}</strong> cua quy khach.</p>
    @if($appointment)
        <table style="border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 4px 12px; font-weight: 600;">Ma lich hen:</td><td style="padding: 4px 12px;">{{ $appointment->code }}</td></tr>
            <tr><td style="padding: 4px 12px; font-weight: 600;">Ngay hen:</td><td style="padding: 4px 12px;">{{ optional($appointment->appointment_date)->format('d/m/Y') }}</td></tr>
            <tr><td style="padding: 4px 12px; font-weight: 600;">Khung gio:</td><td style="padding: 4px 12px;">{{ $appointment->time_slot }}</td></tr>
            <tr><td style="padding: 4px 12px; font-weight: 600;">Chi nhanh:</td><td style="padding: 4px 12px;">{{ $appointment->branch_id }}</td></tr>
        </table>
    @endif
    <p>Vui long co mat truoc gio hen 10 phut. Neu can thay doi, lien he hotline (028) 1234 5678.</p>
    <p style="color: #6b7280; margin-top: 32px;">Tran trong,<br>Dental Pro</p>
</body>
</html>
