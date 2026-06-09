<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #0f172a; font-size: 10px; }
        h1 { font-size: 16px; margin: 0 0 2px; }
        .muted { color: #64748b; font-size: 10px; }
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
    <h1>Báo cáo tiền lương bác sĩ - Kỳ {{ $period }}</h1>
    <div class="muted">Xuất lúc {{ now('Asia/Ho_Chi_Minh')->format('H:i d/m/Y') }}
        @if($summary['is_provisional'])
            <span class="provisional">— Dữ liệu tạm tính (còn phiếu chưa chốt)</span>
        @endif
    </div>

    <table class="kpis">
        <tr>
            <td><div class="label">Tổng quỹ lương (đã chốt)</div><div class="value">{{ number_format($summary['total_payroll_official'], 0, ',', '.') }} đ</div></td>
            <td><div class="label">Bác sĩ có lương</div><div class="value">{{ $summary['doctors_with_salary'] }}</div></td>
            <td><div class="label">Phiếu đã chốt</div><div class="value">{{ $summary['finalized_count'] }}</div></td>
            <td><div class="label">Phiếu chưa chốt</div><div class="value">{{ $summary['unfinalized_count'] }}</div></td>
            <td><div class="label">Chưa lập phiếu</div><div class="value">{{ $summary['doctors_without_slip'] }}</div></td>
        </tr>
        <tr>
            <td><div class="label">Tổng ca làm</div><div class="value">{{ $summary['total_shifts'] }}</div></td>
            <td><div class="label">Tổng giờ làm</div><div class="value">{{ number_format($summary['total_shift_hours'], 2, ',', '.') }}</div></td>
            <td><div class="label">Tổng giờ quy đổi</div><div class="value">{{ number_format($summary['total_converted_hours'], 2, ',', '.') }}</div></td>
            <td><div class="label">Tổng hệ số BN</div><div class="value">{{ number_format($summary['total_patient_coefficient'], 2, ',', '.') }}</div></td>
            <td><div class="label">Quỹ lương tạm tính</div><div class="value">{{ number_format($summary['total_payroll_provisional'], 0, ',', '.') }} đ</div></td>
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
                        <td class="{{ $i >= 5 && $i <= 10 ? 'right' : '' }}">{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr><td colspan="{{ count($headers) }}">Không có dữ liệu phiếu lương trong kỳ.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
