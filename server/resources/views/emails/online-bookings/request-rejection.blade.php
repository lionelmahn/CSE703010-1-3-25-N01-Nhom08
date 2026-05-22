<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Yeu cau dat lich</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937;">
    <h2 style="color: #dc2626;">Tu choi yeu cau dat lich</h2>
    <p>Xin chao {{ $request->name }},</p>
    <p>Chung toi rat tiec phai thong bao yeu cau <strong>{{ $request->code }}</strong> chua duoc xac nhan voi ly do sau:</p>
    <blockquote style="margin: 16px 0; padding: 12px 16px; background: #fef2f2; border-left: 4px solid #dc2626; color: #7f1d1d;">{{ $reason }}</blockquote>
    <p>Quy khach co the gui yeu cau khac vao thoi diem phu hop hon hoac lien he hotline (028) 1234 5678 de duoc ho tro.</p>
    <p style="color: #6b7280; margin-top: 32px;">Tran trong,<br>Dental Pro</p>
</body>
</html>
