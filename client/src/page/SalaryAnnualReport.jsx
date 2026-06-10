import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { salaryAnnualReportApi } from '@/api/salaryAnnualReportApi';
import AnnualReportFilters from '@/features/salary-annual-report/components/AnnualReportFilters';
import DoctorSummaryHeader from '@/features/salary-annual-report/components/DoctorSummaryHeader';
import AnnualReportKpis from '@/features/salary-annual-report/components/AnnualReportKpis';
import SalaryTrendChart from '@/features/salary-annual-report/components/SalaryTrendChart';
import PayrollHealthAlerts from '@/features/salary-annual-report/components/PayrollHealthAlerts';
import PayrollTimeline from '@/features/salary-annual-report/components/PayrollTimeline';
import AnnualMonthsTable from '@/features/salary-annual-report/components/AnnualMonthsTable';
import AnnualExportDialog from '@/features/salary-annual-report/components/AnnualExportDialog';
import ProvisionalBanner from '@/features/salary-report/components/ProvisionalBanner';
import { extractApiError } from '@/features/salary-annual-report/utils';

const CURRENT_YEAR = new Date().getFullYear();

const SalaryAnnualReport = () => {
    const navigate = useNavigate();
    const { userRole, hasPermission } = useAuth();
    const { toast } = useToast();

    const canViewAll = userRole === 'admin' || hasPermission('payroll.salary_report_annual.view');
    const selfView = !canViewAll;
    const canExport =
        userRole === 'admin' ||
        hasPermission(canViewAll ? 'payroll.salary_report_annual.export' : 'payroll.salary_report_annual.export_own');
    const canOpenSlip = userRole === 'admin' || hasPermission('payroll.salary_slip.view');

    const [options, setOptions] = useState({ statuses: [], years: [] });
    const [doctor, setDoctor] = useState(null);
    const [year, setYear] = useState(CURRENT_YEAR);
    const [status, setStatus] = useState(''); // loc phia client cho bang
    const [reloadToken, setReloadToken] = useState(0);

    const [summary, setSummary] = useState(null);
    const [months, setMonths] = useState([]); // luon 12 thang (khong loc server)
    const [loading, setLoading] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    const staffId = selfView ? undefined : doctor?.id;
    const ready = selfView || !!doctor?.id;

    // Tham so lay du lieu: KHONG gui status (panel/KPI luon dung 12 thang).
    const fetchParams = useMemo(() => {
        const params = { year };
        if (staffId) params.staff_id = staffId;
        return params;
    }, [staffId, year]);

    // Tham so xuat file: co kem status hien tai.
    const exportParams = useMemo(() => {
        const params = { year };
        if (staffId) params.staff_id = staffId;
        if (status) params.status = status;
        return params;
    }, [staffId, year, status]);

    // Bang loc theo trang thai phia client; panel/chart/timeline dung months day du.
    const tableMonths = useMemo(
        () => (status ? months.filter((m) => m.status === status) : months),
        [months, status],
    );

    useEffect(() => {
        salaryAnnualReportApi
            .options()
            .then(({ data }) => setOptions(data?.data || { statuses: [], years: [] }))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!ready) {
            setSummary(null);
            setMonths([]);
            return undefined;
        }
        let active = true;
        setLoading(true);
        const timer = setTimeout(() => {
            Promise.all([salaryAnnualReportApi.summary(fetchParams), salaryAnnualReportApi.months(fetchParams)])
                .then(([summaryRes, monthsRes]) => {
                    if (!active) return;
                    setSummary(summaryRes.data?.data || null);
                    setMonths(monthsRes.data?.data || []);
                })
                .catch((err) => {
                    if (!active) return;
                    setSummary(null);
                    setMonths([]);
                    toast({
                        variant: 'destructive',
                        title: 'Không tải được báo cáo',
                        description: extractApiError(err, 'Vui lòng kiểm tra lại bác sĩ và năm báo cáo.'),
                    });
                })
                .finally(() => active && setLoading(false));
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [ready, fetchParams, reloadToken, toast]);

    const resolvedStaffId = selfView ? summary?.doctor?.staff_id : doctor?.id;
    const drillDown = useCallback(
        (row) => {
            if (!resolvedStaffId) return;
            navigate(`/payroll/salary-slips?staff_id=${resolvedStaffId}&period_month=${row.month}&period_year=${row.year}`);
        },
        [navigate, resolvedStaffId],
    );

    const handleReset = () => {
        setDoctor(null);
        setYear(CURRENT_YEAR);
        setStatus('');
    };

    const handlePrint = async () => {
        try {
            const res = await salaryAnnualReportApi.export({ ...exportParams, format: 'pdf' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Không tạo được bản in',
                description: extractApiError(err, 'Vui lòng thử lại.'),
            });
        }
    };

    return (
        <div className="min-h-full bg-[#f6f7fb] p-4 text-slate-900 lg:p-6">
            <header className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h1 className="text-xl font-extrabold text-slate-950">Báo cáo tiền lương bác sĩ theo năm</h1>
                    <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
                        Tổng hợp lương của một bác sĩ trong 12 tháng từ phiếu lương đã lập (UC16). Tổng lương năm chính
                        thức chỉ tính các phiếu đã chốt. Nhấp vào tháng để mở/lập phiếu lương chi tiết.
                    </p>
                </div>
            </header>

            <div className="space-y-4">
                <AnnualReportFilters
                    doctor={doctor}
                    year={year}
                    status={status}
                    options={options}
                    selfView={selfView}
                    loading={loading}
                    onSelectDoctor={setDoctor}
                    onYearChange={setYear}
                    onStatusChange={setStatus}
                    onApply={() => setReloadToken((t) => t + 1)}
                    onReset={handleReset}
                />

                {!ready ? (
                    <section className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                            <UserRound size={22} />
                        </span>
                        <p className="text-[13px] font-semibold text-slate-600">Chọn bác sĩ để xem báo cáo lương năm</p>
                        <p className="text-[12px] text-slate-400">Sử dụng bộ lọc phía trên để chọn bác sĩ và năm báo cáo.</p>
                    </section>
                ) : (
                    <>
                        <div className="grid gap-4 xl:grid-cols-4">
                            <div className="xl:col-span-1">
                                <DoctorSummaryHeader doctor={summary?.doctor} />
                            </div>
                            <div className="xl:col-span-3">
                                <AnnualReportKpis summary={summary} />
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            <SalaryTrendChart months={months} />
                            <PayrollHealthAlerts months={months} onFilter={setStatus} />
                            <PayrollTimeline months={months} year={year} />
                        </div>

                        <ProvisionalBanner
                            summary={summary ? { ...summary, unfinalized_count: summary.months_unfinalized } : null}
                            onShowUnfinalized={() => setStatus('calculated')}
                        />

                        <AnnualMonthsTable
                            months={tableMonths}
                            summary={summary}
                            year={year}
                            loading={loading}
                            canOpenSlip={canOpenSlip}
                            canExport={canExport}
                            onDrillDown={drillDown}
                            onExport={() => setExportOpen(true)}
                            onPrint={handlePrint}
                        />
                    </>
                )}
            </div>

            <AnnualExportDialog open={exportOpen} params={exportParams} onClose={() => setExportOpen(false)} />
        </div>
    );
};

export default SalaryAnnualReport;
