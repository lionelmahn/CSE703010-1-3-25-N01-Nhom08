@php
    $clinicName = config('clinic.name');
    $clinicHotline = config('clinic.hotline');
    $clinicEmail = config('clinic.email');
@endphp
{!! $content !!}

--
{{ $clinicName }}
@if($clinicHotline)Hotline: {{ $clinicHotline }}@endif
@if($clinicEmail)Email: {{ $clinicEmail }}@endif
