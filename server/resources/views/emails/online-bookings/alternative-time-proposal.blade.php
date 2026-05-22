<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>De xuat khung gio khac</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937;">
    <h2 style="color: #2563eb;">De xuat khung gio khac</h2>
    <p>Xin chao {{ $request->name }},</p>
    <p>Khung gio quy khach lua chon hien khong con cho. Chung toi xin de xuat cac khung gio thay the sau cho yeu cau <strong>{{ $request->code }}</strong>:</p>
    <ul>
        @foreach($slots as $slot)
            <li>{{ \Carbon\Carbon::parse($slot['date'])->format('d/m/Y') }} - {{ $slot['time_slot'] }}</li>
        @endforeach
    </ul>
    @if($messageBody)
        <p><em>Ghi chu them: {{ $messageBody }}</em></p>
    @endif
    <p>Vui long phan hoi qua hotline (028) 1234 5678 hoac email phongkham@dental.vn de xac nhan khung gio phu hop.</p>
    <p style="color: #6b7280; margin-top: 32px;">Tran trong,<br>Dental Pro</p>
</body>
</html>
