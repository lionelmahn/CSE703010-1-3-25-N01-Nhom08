import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FileText, Search, Filter, X, Receipt, Activity } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { billingApi } from '@/api/billingApi';
import useBillingQueue from '@/features/billing/hooks/useBillingQueue';
import useInvoice from '@/features/billing/hooks/useInvoice';
import useBillingDashboard from '@/features/billing/hooks/useBillingDashboard';
import useBillingAuditLogs from '@/features/billing/hooks/useBillingAuditLogs';
import BillingQueueList from '@/features/billing/components/BillingQueueList';
import InvoiceDetailPanel from '@/features/billing/components/InvoiceDetailPanel';
import PaymentDialog from '@/features/billing/components/PaymentDialog';
import DiscountSurchargeDialog from '@/features/billing/components/DiscountSurchargeDialog';
import CancelInvoiceDialog from '@/features/billing/components/CancelInvoiceDialog';
import AdjustInvoiceDialog from '@/features/billing/components/AdjustInvoiceDialog';
import RefundDialog from '@/features/billing/components/RefundDialog';
import ReceiptDrawer from '@/features/billing/components/ReceiptDrawer';
import BillingDashboard from '@/features/billing/components/BillingDashboard';
import AuditTimeline from '@/features/billing/components/AuditTimeline';
import { TAB_DEFS } from '@/features/billing/constants';

/**
 * UC13 - Master-detail workspace cho thanh toan chi phi kham benh.
 *
 *   left: queue (tab pending/partial/overdue/paid/cancelled) + filter
 *   right: detail panel (action toolbar + tabs overview/items/payments/adjustments)
 *
 * Tich hop: query "?examinationId=ID" tu UC12 mo san hoa don tuong ung.
 */
export default function InvoiceManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const queueState = useBillingQueue({ pollMs: 0 });
  const { filters, setFilter, items, counts, loading: queueLoading, refresh: refreshQueue, meta: queueMeta, page, setPage } = queueState;

  const [selectedId, setSelectedId] = useState(params.id ? Number(params.id) : null);
  const [view, setView] = useState('queue'); // queue | dashboard | audit
  const invoiceHook = useInvoice(selectedId);
  const {
    invoice: selectedInvoice,
    meta: invoiceMeta,
    loading: invoiceLoading,
    error: invoiceError,
    refresh: refreshInvoice,
  } = invoiceHook;

  const dashboardHook = useBillingDashboard({ pollMs: 0 });
  const auditHook = useBillingAuditLogs();

  // Dialog state.
  const [payOpen, setPayOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [surchargeOpen, setSurchargeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPayload, setReceiptPayload] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const can = useMemo(() => ({
    pay: hasPermission?.('payments.create'),
    refund: hasPermission?.('payments.refund'),
    discount: hasPermission?.('invoices.discount'),
    cancel: hasPermission?.('invoices.cancel'),
    adjust: hasPermission?.('invoices.adjust'),
    print: hasPermission?.('invoices.print'),
  }), [hasPermission]);

  // Tu URL: ?examinationId=X -> auto-create invoice cho phien va select.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const examId = q.get('examinationId');
    if (!examId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await billingApi.create(Number(examId));
        if (cancelled) return;
        const inv = res?.data?.invoice;
        if (inv?.id) {
          setSelectedId(inv.id);
          refreshQueue();
          // Clean up query string but keep base path.
          navigate('/invoices', { replace: true });
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Không thể tạo hóa đơn',
          description: err?.response?.data?.message || err?.message,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [location.search, navigate, refreshQueue, toast]);

  const handleSelect = useCallback((row) => {
    setSelectedId(row.id);
  }, []);

  const handleAction = useCallback(async (label, action) => {
    setActionLoading(true);
    try {
      await action();
      await Promise.all([refreshInvoice(), refreshQueue()]);
      toast({ title: label, description: 'Thao tác thành công.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: label,
        description: err?.response?.data?.message || err?.message || 'Có lỗi xảy ra.',
      });
    } finally {
      setActionLoading(false);
    }
  }, [refreshInvoice, refreshQueue, toast]);

  const handlePay = (payments) => handleAction('Ghi nhận thanh toán', async () => {
    await billingApi.createPayments(selectedId, payments);
    setPayOpen(false);
  });
  const handleDiscount = (payload) => handleAction('Áp dụng giảm giá', async () => {
    await billingApi.discount(selectedId, payload);
    setDiscountOpen(false);
  });
  const handleSurcharge = (payload) => handleAction('Áp dụng phụ thu', async () => {
    await billingApi.surcharge(selectedId, payload);
    setSurchargeOpen(false);
  });
  const handleCancel = (payload) => handleAction('Hủy hóa đơn', async () => {
    await billingApi.cancel(selectedId, payload);
    setCancelOpen(false);
  });
  const handleAdjust = (payload) => handleAction('Điều chỉnh hóa đơn', async () => {
    await billingApi.adjust(selectedId, payload);
    setAdjustOpen(false);
  });
  const handleRefund = (payload) => handleAction('Hoàn tiền', async () => {
    await billingApi.refund(selectedId, payload);
    setRefundOpen(false);
  });

  const handlePrintInvoice = async () => {
    try {
      const res = await billingApi.print(selectedId);
      setReceiptPayload({
        kind: 'invoice',
        invoice: res?.data?.invoice,
        items: res?.data?.invoice?.items || [],
        meta: res?.data?.meta || {},
      });
      setReceiptOpen(true);
    } catch (err) {
      toast({ variant: 'destructive', title: 'In hóa đơn', description: err?.response?.data?.message || err?.message });
    }
  };

  const handlePrintReceipt = async (payment) => {
    try {
      const res = await billingApi.receipt(payment.id);
      setReceiptPayload({
        kind: 'payment',
        payment: res?.data?.payment,
        invoice: res?.data?.invoice,
      });
      setReceiptOpen(true);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Phiếu thu', description: err?.response?.data?.message || err?.message });
    }
  };

  return (
    <div className="animate-in fade-in p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
          <FileText className="text-teal-600" /> Thanh toán hóa đơn
        </h3>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="queue">Hàng đợi</TabsTrigger>
            <TabsTrigger value="dashboard">
              <Receipt className="h-3.5 w-3.5 mr-1" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="h-3.5 w-3.5 mr-1" /> Audit log
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-3">
            <Tabs value={filters.tab} onValueChange={(v) => setFilter('tab', v)}>
              <TabsList className="flex-wrap">
                {TAB_DEFS.map((t) => (
                  <TabsTrigger key={t.key} value={t.key}>
                    {t.label}
                    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">
                      {counts[t.key] || 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={filters.q}
                  onChange={(e) => setFilter('q', e.target.value)}
                  placeholder="Mã HĐ / tên BN / SĐT"
                  className="pl-8"
                />
              </div>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => setFilter('from', e.target.value)}
                className="w-[150px]"
              />
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setFilter('to', e.target.value)}
                className="w-[150px]"
              />
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => {
                setFilter('q', '');
                setFilter('from', '');
                setFilter('to', '');
              }}>
                <X className="h-3.5 w-3.5" /> Xóa
              </Button>
            </div>

            <BillingQueueList
              items={items}
              loading={queueLoading}
              selectedId={selectedId}
              onSelect={handleSelect}
            />

            {queueMeta?.last_page > 1 ? (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div>
                  Trang {queueMeta.current_page} / {queueMeta.last_page} · {queueMeta.total} hóa đơn
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Trang trước
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= queueMeta.last_page} onClick={() => setPage(page + 1)}>
                    Trang sau
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white min-h-[400px]">
            <InvoiceDetailPanel
              invoice={selectedInvoice}
              meta={invoiceMeta}
              loading={invoiceLoading}
              error={invoiceError}
              can={can}
              onOpenPay={() => setPayOpen(true)}
              onOpenDiscount={() => setDiscountOpen(true)}
              onOpenSurcharge={() => setSurchargeOpen(true)}
              onOpenCancel={() => setCancelOpen(true)}
              onOpenAdjust={() => setAdjustOpen(true)}
              onOpenRefund={() => setRefundOpen(true)}
              onOpenReceipt={handlePrintReceipt}
              onPrint={handlePrintInvoice}
              onRefresh={refreshInvoice}
            />
          </div>
        </div>
      )}

      {view === 'dashboard' && (
        <BillingDashboard data={dashboardHook.data} />
      )}

      {view === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <AuditTimeline items={auditHook.items} />
          {auditHook.meta?.last_page > 1 ? (
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
              <div>
                Trang {auditHook.meta.current_page} / {auditHook.meta.last_page}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={auditHook.page <= 1} onClick={() => auditHook.setPage(auditHook.page - 1)}>Trước</Button>
                <Button size="sm" variant="outline" disabled={auditHook.page >= auditHook.meta.last_page} onClick={() => auditHook.setPage(auditHook.page + 1)}>Sau</Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Dialogs */}
      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} invoice={selectedInvoice} onConfirm={handlePay} loading={actionLoading} />
      <DiscountSurchargeDialog open={discountOpen} onOpenChange={setDiscountOpen} mode="discount" invoice={selectedInvoice} onConfirm={handleDiscount} loading={actionLoading} />
      <DiscountSurchargeDialog open={surchargeOpen} onOpenChange={setSurchargeOpen} mode="surcharge" invoice={selectedInvoice} onConfirm={handleSurcharge} loading={actionLoading} />
      <CancelInvoiceDialog open={cancelOpen} onOpenChange={setCancelOpen} invoice={selectedInvoice} onConfirm={handleCancel} loading={actionLoading} />
      <AdjustInvoiceDialog open={adjustOpen} onOpenChange={setAdjustOpen} invoice={selectedInvoice} onConfirm={handleAdjust} loading={actionLoading} />
      <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} invoice={selectedInvoice} onConfirm={handleRefund} loading={actionLoading} />
      <ReceiptDrawer open={receiptOpen} onOpenChange={setReceiptOpen} payload={receiptPayload} />
    </div>
  );
}
