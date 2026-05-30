import React from 'react';
import { TrendingUp, Wallet, RotateCcw, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatVnd } from '../lib/format';

const StatCard = ({ icon, label, value, tone = 'neutral', sub = null }) => {
  const toneClass =
    tone === 'positive' ? 'text-emerald-600 bg-emerald-50' :
    tone === 'negative' ? 'text-rose-600 bg-rose-50' :
    tone === 'warn' ? 'text-amber-600 bg-amber-50' :
    'text-slate-600 bg-slate-50';
  const IconComp = icon;
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`rounded-lg p-2 ${toneClass}`}>{IconComp ? <IconComp className="h-5 w-5" /> : null}</div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">{value}</div>
          {sub ? <div className="text-xs text-slate-500 mt-0.5">{sub}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * UC13 - Dashboard tong quan: doanh thu hom nay, hoan tien hom nay, tong outstanding,
 * breakdown theo method.
 */
export default function BillingDashboard({ data }) {
  if (!data) return null;
  const today = data.today || {};
  const breakdown = data.method_breakdown || {};
  const counts = data.counts || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="HĐ hôm nay" value={today.invoices_created || 0} sub={`${counts.pending || 0} chờ TT`} />
        <StatCard icon={Wallet} label="Doanh thu hôm nay" value={formatVnd(today.revenue_today || 0)} tone="positive" />
        <StatCard icon={RotateCcw} label="Hoàn tiền hôm nay" value={formatVnd(today.refunds_today || 0)} tone="negative" />
        <StatCard icon={TrendingUp} label="Doanh thu thuần" value={formatVnd(today.net_today || 0)} tone="positive" />
        <StatCard icon={AlertTriangle} label="Còn nợ" value={formatVnd(data.outstanding_total || 0)} tone="warn" sub={`${counts.partial || 0} HĐ đang thu, ${counts.overdue || 0} quá hạn`} />
        <StatCard icon={Wallet} label="Tiền mặt hôm nay" value={formatVnd(breakdown.cash || 0)} />
        <StatCard icon={Wallet} label="Chuyển khoản hôm nay" value={formatVnd(breakdown.bank_transfer || 0)} />
        <StatCard icon={Wallet} label="Thẻ hôm nay" value={formatVnd(breakdown.card || 0)} />
      </div>
    </div>
  );
}
