@php
    $clinicName = config('clinic.name');
    $clinicLogo = config('clinic.logo_url');
    $clinicHotline = config('clinic.hotline');
    $clinicEmail = config('clinic.email');
    $clinicWebsite = config('clinic.website');
    $clinicAddress = config('clinic.address');
    $headerColor = $headerColor ?? '#2563eb';
    $title = $title ?? $clinicName;
    /** @var string $content - inline HTML cua template (Blade da render xong). */
@endphp
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="background:{{ $headerColor }};padding:20px 24px;color:#ffffff;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    @if($clinicLogo)
                                        <td width="56" valign="middle">
                                            <img src="{{ $clinicLogo }}" alt="{{ $clinicName }}" height="40" style="display:block;border:0;outline:none;text-decoration:none;height:40px;width:auto;">
                                        </td>
                                    @endif
                                    <td valign="middle" style="color:#ffffff;font-weight:700;font-size:18px;">
                                        {{ $clinicName }}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;color:#1f2937;font-size:14px;line-height:1.6;">
                            {!! $content !!}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.6;border-top:1px solid #e5e7eb;">
                            <div><strong>{{ $clinicName }}</strong></div>
                            @if($clinicAddress)
                                <div>{{ $clinicAddress }}</div>
                            @endif
                            <div>
                                @if($clinicHotline) Hotline: {{ $clinicHotline }} @endif
                                @if($clinicEmail) &nbsp;|&nbsp; Email: {{ $clinicEmail }} @endif
                            </div>
                            @if($clinicWebsite)
                                <div>{{ $clinicWebsite }}</div>
                            @endif
                            <div style="margin-top:8px;font-size:11px;color:#9ca3af;">
                                Email tu dong tu he thong {{ $clinicName }}. Vui long khong tra loi truc tiep.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
