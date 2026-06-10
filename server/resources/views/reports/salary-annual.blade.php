<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #0f172a; font-size: 10px; }
        h1 { font-size: 16px; margin: 0 0 2px; }
        .muted { color: #64748b; font-size: 10px; }
        .doctor { margin: 6px 0 4px; font-size: 11px; }
        .doctor strong { font-size: 12px; }
        .kpis { width: 100%; margin: 10px 0 12px; border-collapse: collapse; }
        .kpis td { border: 1px solid #e5e7eb; padding: 6px 8px; }
        .kpis .label { color: #64748b; font-size: 9px; text-transform: uppercase; }
        .kpis .value { font-size: 13px; font-weight: bold; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th, table.data td { border: 1px solid #e5e7eb; padding: 4px 6px; }
        table.data th { background: #f8fafc; font-size: 9px; text-align: left; text-transform: uppercase; }
        table.data td { font-size: 9px; }
        .right { text-align: right; }
        .provisional { color: #b45309; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Báo cáo tiền lương bác sĩ - Năm {{ $year }}</h1>
    <div class="muted">Xuất lúc {{ now('Asia/Ho_Chi_Minh')->format('H:i d/m/Y') }}
        @if($summary['is_provisional'])
            <span class="provisional">— Dữ liệu tạm tính (còn phiếu chưa chốt)</span>
        @endif
    </div>

    @if($doctor)
        <div class="doctor">
            <strong>{{ $doctor['full_name'] }}</strong>
            ({{ $doctor['employee_code'] }})
            @if(!empty($doctor['academic_display'])) — {{ $doctor['academic_display'] }} @endif
        </div>
        <div class="muted">
            @if(!empty($doctor['specialty'])) Khoa/Chuyên môn: {{ $doctor['specialty'] }} @endif
            @if(!empty($doctor['branch_name'])) · {{ $doctor['branch_name'] }} @endif
            @if(!empty($doctor['hire_date'])) · Ngày vào làm: {{ \Carbon\Carbon::parse($doctor['hire_date'])->format('d/m/Y') }} @endif
        </div>
    @endif

    <table class="kpis">
        <tr>
            <td><div class="label">Tổng lương năm (đã chốt)</div><div class="value">{{ number_format($summary['total_payroll_official'], 0, ',', '.') }} đ</div></td>
            <td><div class="label">Tháng có phiếu</div><div class="value">{{ $summary['months_with_slip'] }}</div></td>
            <td><div class="label">Tháng đã chốt</div><div class="value">{{ $summary['months_finalized'] }}</div></td>
            <td><div class="label">Tháng chưa chốt</div><div class="value">{{ $summary['months_unfinalized'] }}</div></td>
            <td><div class="label">Tháng chưa lập phiếu</div><div class="value">{{ $summary['months_not_created'] }}</div></td>
        </tr>
        <tr>
            <td><div class="label">Tổng ca làm</div><div class="value">{{ $summary['total_shifts'] }}</div></td>
            <td><div class="label">Tổng giờ làm</div><div class="value">{{ number_format($summary['total_shift_hours'], 2, ',', '.') }}</div></td>
            <td><div class="label">Tổng giờ quy đổi</div><div class="value">{{ number_format($summary['total_converted_hours'], 2, ',', '.') }}</div></td>
            <td><div class="label">Tổng hệ số BN</div><div class="value">{{ number_format($summary['total_patient_coefficient'], 2, ',', '.') }}</div></td>
            <td><div class="label">Lương tạm tính</div><div class="value">{{ number_format($summary['total_payroll_provisional'], 0, ',', '.') }} đ</div></td>
        </tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                @foreach($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    @foreach($row as $i => $cell)
                        <td class="{{ $i >= 2 && $i <= 6 ? 'right' : '' }}">{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($headers) }}">Không có dữ liệu phiếu lương trong năm.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
