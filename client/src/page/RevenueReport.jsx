import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Download,
  FileText,
  Filter,
  LineChart,
  RefreshCcw,
  Search,
  Stethoscope,
  Wallet,
  X,
} from 'lucide-react';
import { revenueApi } from '@/api/revenueApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import InvoiceStatusBadge from '@/features/billing/components/InvoiceStatusBadge';
import { formatDate, formatDateTime, formatVnd, paymentMethodLabel } from '@/features/billing/lib/format';

const ALL = '__all__';
const CHART_COLORS = ['#0f172a', '#0284c7', '#16a34a', '#f59e0b', '#dc2626', '#64748b'];

function toInputDate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function rangeForPreset(key) {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  if (key === 'yesterday') {
    from.setDate(today.getDate() - 1);
    to.setDate(today.getDate() - 1);
  } else if (key === '7d') {
    from.setDate(today.getDate() - 6);
  } else if (key === '30d') {
    from.setDate(today.getDate() - 29);
  } else if (key === 'month') {
    from.setDate(1);
  }

  return { from: toInputDate(from), to: toInputDate(to) };
}

const DEFAULT_FILTERS = {
  ...rangeForPreset('today'),
  branch_id: '',
  doctor_id: '',
  service_group_id: '',
  service_id: '',
  method: '',
  invoice_status: '',
  cashier_id: '',
};

function cleanParams(filters, extra = {}) {
  return Object.fromEntries(
    Object.entries({ ...filters, ...extra }).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

function errorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function useOptions() {
  const [options, setOptions] = useState({
    branches: [],
    doctors: [],
    cashiers: [],
    service_groups: [],
    services: [],
    methods: [],
    invoice_statuses: [],
  });

  useEffect(() => {
    let cancelled = false;
    revenueApi.options()
      .then((res) => {
        if (!cancelled) setOptions(res?.data || {});
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  return options;
}

function FilterSelect({ label, value, onChange, options, getValue = (o) => String(o.id), getLabel = (o) => o.name, disabled = false }) {
  return (
    <div className="min-w-[160px] flex-1">
      <Label className="text-xs text-slate-500">{label}</Label>
      <Select disabled={disabled} value={value || ALL} onValueChange={(next) => onChange(next === ALL ? '' : next)}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Tất cả" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả</SelectItem>
          {(options || []).map((option) => (
            <SelectItem key={getValue(option)} value={getValue(option)}>
              {getLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RevenueFilters({ filters, options, onChange, onReset }) {
  const setPreset = (preset) => onChange(rangeForPreset(preset));
  const services = useMemo(() => {
    if (!filters.service_group_id) return options.services || [];
    return (options.services || []).filter((service) => String(service.service_group_id || '') === String(filters.service_group_id));
  }, [filters.service_group_id, options.services]);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <div>
            <Label className="text-xs text-slate-500">Từ ngày</Label>
            <Input className="mt-1" type="date" value={filters.from} onChange={(e) => onChange({ from: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Đến ngày</Label>
            <Input className="mt-1" type="date" value={filters.to} onChange={(e) => onChange({ to: e.target.value })} />
          </div>
          <FilterSelect label="Chi nhánh" value={filters.branch_id} onChange={(v) => onChange({ branch_id: v })} options={options.branches} />
          <FilterSelect label="Bác sĩ" value={filters.doctor_id} onChange={(v) => onChange({ doctor_id: v })} options={options.doctors} />
          <FilterSelect label="Nhóm dịch vụ" value={filters.service_group_id} onChange={(v) => onChange({ service_group_id: v, service_id: '' })} options={options.service_groups} />
          <FilterSelect label="Dịch vụ" value={filters.service_id} onChange={(v) => onChange({ service_id: v })} options={services} disabled={services.length === 0} />
          <FilterSelect label="Thu ngân" value={filters.cashier_id} onChange={(v) => onChange({ cashier_id: v })} options={options.cashiers} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <FilterSelect
            label="Phương thức TT"
            value={filters.method}
            onChange={(v) => onChange({ method: v })}
            options={options.methods || []}
            getValue={(o) => o.value}
            getLabel={(o) => o.label}
          />
          <FilterSelect
            label="Trạng thái HĐ"
            value={filters.invoice_status}
            onChange={(v) => onChange({ invoice_status: v })}
            options={options.invoice_statuses || []}
            getValue={(o) => o.value}
            getLabel={(o) => o.label}
          />
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full gap-2" onClick={onReset}>
              <X className="h-4 w-4" /> Xóa bộ lọc
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['today', 'Hôm nay'],
            ['yesterday', 'Hôm qua'],
            ['7d', '7 ngày qua'],
            ['30d', '30 ngày qua'],
            ['month', 'Tháng này'],
          ].map(([key, label]) => (
            <Button key={key} type="button" variant="secondary" size="sm" onClick={() => setPreset(key)}>
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ icon, label, value, sub, tone = 'neutral', onClick }) {
  const iconNode = icon ? React.createElement(icon, { className: 'h-5 w-5' }) : null;
  const toneClass = {
    positive: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    neutral: 'bg-slate-100 text-slate-700',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[132px] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
        {iconNode}
      </div>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 break-words text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      {sub ? <div className="mt-2 text-xs text-slate-500">{sub}</div> : null}
    </button>
  );
}

function EmptyState({ title = 'Không có dữ liệu', description = 'Thử thay đổi bộ lọc hoặc khoảng thời gian.' }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <Search className="mb-3 h-8 w-8 text-slate-300" />
      <div className="font-semibold text-slate-700">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{description}</div>
    </div>
  );
}

function TrendChart({ series }) {
  const values = (series || []).map((item) => Number(item.revenue || 0));
  const max = Math.max(...values.map((v) => Math.abs(v)), 1);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 20 : 20 + (index * 420) / (values.length - 1);
    const y = 190 - ((value + max) / (max * 2)) * 160;
    return `${x},${y}`;
  }).join(' ');

  if (!series?.length) return <EmptyState />;

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Xu hướng doanh thu</h4>
        <span className="text-xs text-slate-500">Theo thời điểm thanh toán</span>
      </div>
      <div className="relative h-[240px] overflow-hidden rounded-lg bg-slate-50">
        <svg viewBox="0 0 460 220" className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <pattern id="revenue-grid" width="46" height="32" patternUnits="userSpaceOnUse">
              <path d="M 46 0 L 0 0 0 32" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="460" height="220" fill="url(#revenue-grid)" />
          <line x1="20" y1="110" x2="440" y2="110" stroke="#cbd5e1" strokeDasharray="4 4" />
          <polyline points={points} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {points.split(' ').map((point, index) => {
            const [cx, cy] = point.split(',');
            return <circle key={`${point}-${index}`} cx={cx} cy={cy} r="4" fill="#0f172a" />;
          })}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500 sm:grid-cols-6">
        {series.slice(-6).map((item) => (
          <div key={item.key} className="truncate">
            <span className="font-medium text-slate-700">{item.label}</span>
            <br />
            {formatVnd(item.revenue)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Donut({ rows, total, label }) {
  const data = (rows || []).filter((row) => Number(row.revenue || 0) > 0);
  const stops = data.reduce((acc, row, index) => {
    const pct = total > 0 ? (Number(row.revenue || 0) / total) * 100 : 0;
    const start = acc.cursor;
    const end = start + pct;

    return {
      cursor: end,
      stops: [...acc.stops, `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`],
    };
  }, { cursor: 0, stops: [] }).stops;

  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
      <div
        className="mx-auto grid h-40 w-40 place-items-center rounded-full"
        style={{ background: stops.length ? `conic-gradient(${stops.join(', ')})` : '#e2e8f0' }}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center text-xs">
          <div>
            <div className="font-bold text-slate-900">{formatVnd(total || 0)}</div>
            <div className="text-slate-500">{label}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.length ? data.slice(0, 6).map((row, index) => (
          <div key={row.anchor || row.id || row.method} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="truncate">{row.label || row.name}</span>
            </span>
            <span className="font-medium tabular-nums">{row.percentage}%</span>
          </div>
        )) : <EmptyState />}
      </div>
    </div>
  );
}

function BarList({ rows, onOpen, dimension }) {
  const max = Math.max(...(rows || []).map((row) => Math.abs(Number(row.revenue || row.amount || 0))), 1);
  if (!rows?.length) return <EmptyState />;

  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((row) => {
        const amount = Number(row.revenue ?? row.amount ?? 0);
        const width = `${Math.max(3, Math.min(100, (Math.abs(amount) / max) * 100))}%`;
        return (
          <button
            key={row.anchor || row.id || row.label}
            type="button"
            onClick={() => onOpen?.({ dimension, anchor: row.anchor || String(row.id ?? 'none'), title: row.name || row.label })}
            className="block w-full rounded-lg p-2 text-left transition hover:bg-slate-50"
          >
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{row.name || row.label}</span>
              <span className="shrink-0 tabular-nums text-slate-900">{formatVnd(amount)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-slate-800" style={{ width }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DimensionTable({ rows, onOpen, dimension, nameHeader = 'Tên' }) {
  if (!rows?.length) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>{nameHeader}</TableHead>
            <TableHead>Doanh thu</TableHead>
            <TableHead>Tổng thu</TableHead>
            <TableHead>Hoàn / ĐC âm</TableHead>
            <TableHead>Hóa đơn</TableHead>
            <TableHead>Tỷ trọng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.anchor || row.id || row.name}>
              <TableCell>
                <button
                  type="button"
                  className="text-left font-medium text-slate-800 hover:text-sky-700"
                  onClick={() => onOpen?.({ dimension, anchor: row.anchor || String(row.id ?? 'none'), title: row.name })}
                >
                  {row.name}
                </button>
                {row.code ? <div className="text-xs text-slate-500">{row.code}</div> : null}
              </TableCell>
              <TableCell className="font-semibold tabular-nums">{formatVnd(row.revenue)}</TableCell>
              <TableCell>{formatVnd(row.gross_payments)}</TableCell>
              <TableCell>{formatVnd(Number(row.refunds || 0) + Number(row.negative_adjustments || 0))}</TableCell>
              <TableCell>{row.invoice_count}</TableCell>
              <TableCell>{row.percentage}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OverviewTab({ summary, trend, methods, branches, granularity, onGranularityChange, onOpen }) {
  const kpi = summary || {};
  const methodRows = methods?.data || [];
  const branchRows = branches?.data || [];
  const delta = kpi.comparison?.revenue_delta_percent;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={Wallet} label="Tổng doanh thu" value={formatVnd(kpi.total_revenue)} sub={delta === null ? 'Chưa có kỳ trước' : `${delta || 0}% so với kỳ trước`} tone="positive" onClick={() => onOpen({ dimension: 'overall', anchor: '', title: 'Tổng doanh thu' })} />
        <KpiCard icon={FileText} label="Tổng hóa đơn" value={kpi.invoice_count || 0} sub={`${kpi.transaction_count || 0} giao dịch`} onClick={() => onOpen({ dimension: 'overall', anchor: '', title: 'Hóa đơn phát sinh doanh thu' })} />
        <KpiCard icon={AlertTriangle} label="Công nợ" value={formatVnd(kpi.outstanding_total)} sub="Hóa đơn chưa thu đủ" tone="warning" />
        <KpiCard icon={RefreshCcw} label="Hoàn tiền / ĐC âm" value={formatVnd(Number(kpi.refunds || 0) + Number(kpi.negative_adjustments || 0))} sub="Đã trừ khỏi doanh thu" tone="danger" />
        <KpiCard icon={BarChart3} label="Giá trị HĐ TB" value={formatVnd(kpi.average_invoice_value)} sub="Theo hóa đơn có thu tiền" />
        <KpiCard icon={LineChart} label="Tỷ lệ thu hồi nợ" value={`${kpi.recovery_rate || 0}%`} sub="Doanh thu / doanh thu + nợ" tone="positive" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_.9fr_.75fr]">
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div />
              <Tabs value={granularity} onValueChange={onGranularityChange}>
                <TabsList>
                  <TabsTrigger value="day">Ngày</TabsTrigger>
                  <TabsTrigger value="week">Tuần</TabsTrigger>
                  <TabsTrigger value="month">Tháng</TabsTrigger>
                  <TabsTrigger value="year">Năm</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <TrendChart series={trend?.series || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cơ cấu theo phương thức TT</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut rows={methodRows} total={methods?.total || 0} label="Tổng" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top chi nhánh</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList rows={branchRows} dimension="branch" onOpen={onOpen} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GroupTab({ title, rows, dimension, icon: Icon, onOpen }) {
  const total = rows?.total || 0;
  const data = rows?.data || [];
  const invoiceCount = data.reduce((sum, row) => sum + Number(row.invoice_count || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard icon={Icon} label={title} value={formatVnd(total)} sub={`${data.length} dòng thống kê`} tone="positive" />
        <KpiCard icon={FileText} label="Hóa đơn liên quan" value={invoiceCount} sub="Đếm distinct theo nhóm" />
        <KpiCard icon={BarChart3} label="Dòng cao nhất" value={data[0]?.name || '-'} sub={formatVnd(data[0]?.revenue || 0)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList rows={data} dimension={dimension} onOpen={onOpen} />
          </CardContent>
        </Card>
        <DimensionTable rows={data} dimension={dimension} onOpen={onOpen} nameHeader={title} />
      </div>
    </div>
  );
}

function DebtTab({ summary, list }) {
  const buckets = summary?.buckets || [];
  const invoices = list?.data || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard icon={AlertTriangle} label="Tổng công nợ" value={formatVnd(summary?.total_debt || 0)} sub={`${summary?.invoice_count || 0} hóa đơn`} tone="warning" />
        <KpiCard icon={FileText} label="Hóa đơn quá hạn" value={summary?.overdue_invoice_count || 0} sub={formatVnd(summary?.overdue_debt || 0)} tone="danger" />
        <KpiCard icon={LineChart} label="Bucket lớn nhất" value={buckets[0]?.label || '-'} sub={formatVnd(buckets[0]?.amount || 0)} />
        <KpiCard icon={Wallet} label="Mở hàng đợi thu tiền" value="UC13" sub="Xem và thu nợ tại /invoices" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[.7fr_1.3fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aging công nợ</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList rows={buckets.map((b) => ({ ...b, name: b.label, revenue: b.amount, anchor: b.label }))} />
            <Button className="mt-4 w-full" variant="outline" asChild>
              <Link to="/invoices?tab=overdue">Mở hàng đợi thu tiền</Link>
            </Button>
          </CardContent>
        </Card>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Hóa đơn</TableHead>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Đã thu</TableHead>
                <TableHead>Còn nợ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length ? invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link className="font-medium text-sky-700 hover:underline" to={`/invoices/${invoice.id}`}>
                      {invoice.code}
                    </Link>
                    <div className="text-xs text-slate-500">{formatDate(invoice.created_at)}</div>
                  </TableCell>
                  <TableCell>{invoice.patient_name_snapshot}</TableCell>
                  <TableCell><InvoiceStatusBadge status={invoice.status} /></TableCell>
                  <TableCell>{formatVnd(invoice.total)}</TableCell>
                  <TableCell>{formatVnd(invoice.amount_paid)}</TableCell>
                  <TableCell className="font-semibold text-amber-700">{formatVnd(invoice.amount_due)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6}><EmptyState title="Không có công nợ" /></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function DrillDownDrawer({ open, onClose, context, filters }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return null;
      setLoading(true);
      return revenueApi.details(cleanParams(filters, {
        dimension: context?.dimension || 'overall',
        anchor: context?.anchor || '',
        per_page: 20,
      }))
        .then((res) => {
          if (!cancelled) setPayload(res?.data || null);
        })
        .catch(() => {
          if (!cancelled) setPayload(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [context, filters, open]);

  if (!open) return null;

  const invoices = payload?.invoices?.data || [];
  const payments = payload?.payments?.data || [];

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-label="Dong" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-5xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <div className="text-xs text-slate-500">Dashboard / Thống kê doanh thu / Chi tiết</div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{context?.title || 'Chi tiết doanh thu'}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? <EmptyState title="Đang tải chi tiết" description="" /> : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <KpiCard icon={Wallet} label="Doanh thu" value={formatVnd(payload?.summary?.total_revenue || 0)} />
                <KpiCard icon={FileText} label="Hóa đơn" value={payload?.summary?.invoice_count || 0} />
                <KpiCard icon={BarChart3} label="Giao dịch" value={payload?.summary?.transaction_count || 0} />
                <KpiCard icon={RefreshCcw} label="Hoàn / ĐC âm" value={formatVnd(Number(payload?.summary?.refunds || 0) + Number(payload?.summary?.negative_adjustments || 0))} tone="danger" />
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Hóa đơn liên quan</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Số hóa đơn</TableHead>
                        <TableHead>Bệnh nhân</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead>Đã thu</TableHead>
                        <TableHead>Công nợ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length ? invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell><Link className="font-medium text-sky-700 hover:underline" to={`/invoices/${invoice.id}`}>{invoice.code}</Link></TableCell>
                          <TableCell>{invoice.patient_name_snapshot}</TableCell>
                          <TableCell>{formatVnd(invoice.total)}</TableCell>
                          <TableCell>{formatVnd(invoice.amount_paid)}</TableCell>
                          <TableCell>{formatVnd(invoice.amount_due)}</TableCell>
                          <TableCell><InvoiceStatusBadge status={invoice.status} /></TableCell>
                        </TableRow>
                      )) : <TableRow><TableCell colSpan={6}><EmptyState /></TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Giao dịch thanh toán</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã GD</TableHead>
                        <TableHead>Hóa đơn</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length ? payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.code}</TableCell>
                          <TableCell>{payment.invoice_code}</TableCell>
                          <TableCell>{payment.type === 'refund' ? 'Hoàn tiền' : 'Thu tiền'}</TableCell>
                          <TableCell>{paymentMethodLabel(payment.method)}</TableCell>
                          <TableCell className={payment.type === 'refund' ? 'text-rose-700' : 'text-slate-900'}>{formatVnd(payment.amount)}</TableCell>
                          <TableCell>{formatDateTime(payment.paid_at)}</TableCell>
                        </TableRow>
                      )) : <TableRow><TableCell colSpan={6}><EmptyState /></TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ExportDialog({ open, onOpenChange, filters }) {
  const { toast } = useToast();
  const [type, setType] = useState('overview');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await revenueApi.export(cleanParams(filters, { type, format }));
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue-${type}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Xuất báo cáo', description: 'File báo cáo đã được tạo.' });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Xuất báo cáo', description: errorMessage(error, 'Không thể xuất báo cáo.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xuất báo cáo doanh thu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Loại báo cáo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Doanh thu tổng quan</SelectItem>
                <SelectItem value="by-branch">Theo chi nhánh</SelectItem>
                <SelectItem value="by-doctor">Theo bác sĩ</SelectItem>
                <SelectItem value="by-service">Theo dịch vụ</SelectItem>
                <SelectItem value="debt">Công nợ</SelectItem>
                <SelectItem value="invoice-details">Chi tiết hóa đơn</SelectItem>
                <SelectItem value="payment-details">Chi tiết giao dịch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Định dạng</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV mở bằng Excel</SelectItem>
                <SelectItem value="xlsx">Excel compatible CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Khoảng thời gian: <b>{filters.from}</b> đến <b>{filters.to}</b>. File xuất dùng cùng bộ lọc hiện tại.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={loading}>
            <Download className="h-4 w-4" /> {loading ? 'Đang xuất...' : 'Xuất báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RevenueReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasPermission, userRole } = useAuth();
  const options = useOptions();

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...Object.fromEntries(searchParams.entries()),
  }));
  const [tab, setTab] = useState('overview');
  const [granularity, setGranularity] = useState('day');
  const [serviceGroupBy, setServiceGroupBy] = useState('service');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [drawer, setDrawer] = useState({ open: false, dimension: 'overall', anchor: '', title: '' });
  const [exportOpen, setExportOpen] = useState(false);

  const canExport = userRole === 'admin' || hasPermission?.('reports.export');
  const requestParams = useMemo(() => cleanParams(filters), [filters]);

  useEffect(() => {
    setSearchParams(cleanParams(filters), { replace: true });
  }, [filters, setSearchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const base = requestParams;
      const [summary, trend, methods, branches] = await Promise.all([
        revenueApi.summary(base),
        revenueApi.trend({ ...base, granularity }),
        revenueApi.byMethod(base),
        revenueApi.byBranch(base),
      ]);

      const next = {
        summary: summary?.data || {},
        trend: trend?.data || {},
        methods: methods?.data || {},
        branches: branches?.data || {},
      };

      if (tab === 'doctor') {
        const doctors = await revenueApi.byDoctor(base);
        next.doctors = doctors?.data || {};
      } else if (tab === 'service') {
        const services = await revenueApi.byService({ ...base, group_by: serviceGroupBy });
        next.services = services?.data || {};
      } else if (tab === 'debt') {
        const [debtSummary, debtList] = await Promise.all([
          revenueApi.debtSummary(base),
          revenueApi.debtList({ ...base, per_page: 20 }),
        ]);
        next.debtSummary = debtSummary?.data || {};
        next.debtList = debtList || {};
      }

      setData(next);
      setLastUpdated(new Date());
    } catch (error) {
      toast({ variant: 'destructive', title: 'Thống kê doanh thu', description: errorMessage(error, 'Không thể tải báo cáo.') });
    } finally {
      setLoading(false);
    }
  }, [granularity, requestParams, serviceGroupBy, tab, toast]);

  useEffect(() => {
    Promise.resolve().then(loadData);
  }, [loadData]);

  const updateFilters = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const openDetails = (context) => setDrawer({ open: true, ...context });

  return (
    <div className="animate-in fade-in space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" /> Dashboard / Thống kê doanh thu
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Báo cáo doanh thu</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastUpdated ? <span className="text-xs text-slate-500">Cập nhật: {lastUpdated.toLocaleString('vi-VN')}</span> : null}
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </Button>
          {canExport ? (
            <Button onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4" /> Xuất Excel
            </Button>
          ) : null}
        </div>
      </div>

      <RevenueFilters filters={filters} options={options} onChange={updateFilters} onReset={resetFilters} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="branch"><Building2 className="mr-1 h-4 w-4" /> Theo chi nhánh</TabsTrigger>
          <TabsTrigger value="doctor"><Stethoscope className="mr-1 h-4 w-4" /> Theo bác sĩ</TabsTrigger>
          <TabsTrigger value="service"><BarChart3 className="mr-1 h-4 w-4" /> Theo dịch vụ</TabsTrigger>
          <TabsTrigger value="debt"><AlertTriangle className="mr-1 h-4 w-4" /> Công nợ</TabsTrigger>
        </TabsList>

        {loading ? <EmptyState title="Đang tải báo cáo" description="Dữ liệu đang được tổng hợp từ UC13." /> : null}

        <TabsContent value="overview">
          <OverviewTab
            summary={data.summary}
            trend={data.trend}
            methods={data.methods}
            branches={data.branches}
            granularity={granularity}
            onGranularityChange={setGranularity}
            onOpen={openDetails}
          />
        </TabsContent>
        <TabsContent value="branch">
          <GroupTab title="Doanh thu theo chi nhánh" rows={data.branches} dimension="branch" icon={Building2} onOpen={openDetails} />
        </TabsContent>
        <TabsContent value="doctor">
          <GroupTab title="Doanh thu theo bác sĩ" rows={data.doctors} dimension="doctor" icon={Stethoscope} onOpen={openDetails} />
        </TabsContent>
        <TabsContent value="service">
          <div className="mb-4 flex justify-end">
            <div className="w-full max-w-xs">
              <Label className="text-xs text-slate-500">Nhóm hiển thị</Label>
              <Select value={serviceGroupBy} onValueChange={setServiceGroupBy}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Theo dịch vụ</SelectItem>
                  <SelectItem value="service_group">Theo nhóm dịch vụ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <GroupTab
            title={serviceGroupBy === 'service_group' ? 'Doanh thu theo nhóm dịch vụ' : 'Doanh thu theo dịch vụ'}
            rows={data.services}
            dimension={serviceGroupBy === 'service_group' ? 'service_group' : 'service'}
            icon={BarChart3}
            onOpen={openDetails}
          />
        </TabsContent>
        <TabsContent value="debt">
          <DebtTab summary={data.debtSummary} list={data.debtList} />
        </TabsContent>
      </Tabs>

      <DrillDownDrawer open={drawer.open} onClose={() => setDrawer((current) => ({ ...current, open: false }))} context={drawer} filters={filters} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} filters={filters} />
    </div>
  );
}
