import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, FileDown, Printer, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { salaryAnnualAllReportApi } from '@/api/salaryAnnualAllReportApi';
import AnnualAllFilters from '@/features/salary-annual-all-report/components/AnnualAllFilters';
import AnnualAllKpis from '@/features/salary-annual-all-report/components/AnnualAllKpis';
import AnnualAllAlerts from '@/features/salary-annual-all-report/components/AnnualAllAlerts';
import ViewModeTabs from '@/features/salary-annual-all-report/components/ViewModeTabs';
import ByDoctorTable from '@/features/salary-annual-all-report/components/ByDoctorTable';
import ByMonthTable from '@/features/salary-annual-all-report/components/ByMonthTable';
import DoctorMonthMatrix from '@/features/salary-annual-all-report/components/DoctorMonthMatrix';
import MissingPayrollPanel from '@/features/salary-annual-all-report/components/MissingPayrollPanel';
import StatusLegend from '@/features/salary-annual-all-report/components/StatusLegend';
import AnnualAllAnalytics from '@/features/salary-annual-all-report/components/AnnualAllAnalytics';
import { extractApiError } from '@/features/salary-annual-all-report/utils';

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_FILTERS = {
    year: CURRENT_YEAR,
    qualification_code: '',
    status: '',
    q: '',
};

const MIME = {
    csv: 'text/csv;charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
};

const cleanParams = (filters, view, page) => {
    const params = { year: filters.year, view, page, per_page: 20 };
    ['qualification_code', 'status', 'q'].forEach((key) => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
            params[key] = filters[key];
        }
    });
    return params;
};

const DRILL_HINT = [
    { label: 'Dòng bác sĩ → UC18' },
    { label: 'Tiêu đề tháng → UC17' },
    { label: 'Ô ma trận → UC16' },
];

const SalaryAnnualAllReport = () => {
    const navigate = useNavigate();
    const { userRole, hasPermission } = useAuth();
    const { toast } = useToast();

    const canExport = userRole === 'admin' || hasPermission('payroll.salary_report_annual_all.export');
    const canOpenSlip = userRole === 'admin' || hasPermission('payroll.salary_slip.view');

    const [options, setOptions] = useState({ branches: [], qualifications: [], statuses: [], years: [] });
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [view, setView] = useState('matrix');
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);

    const [summary, setSummary] = useState(null);
    const [doctorRows, setDoctorRows] = useState([]);
    const [doctorMeta, setDoctorMeta] = useState(null);
    const [monthRows, setMonthRows] = useState([]);
    const [matrix, setMatrix] = useState({ doctors: [], cells: {}, month_totals: [] });
    const [matrixMeta, setMatrixMeta] = useState(null);
    const [loading, setLoading] = useState(false);

    const exportParams = useMemo(() => cleanParams(filters, view, 1), [filters, view]);

    useEffect(() => {
        salaryAnnualAllReportApi
            .options()
            .then(({ data }) => setOptions(data?.data || { branches: [], qualifications: [], statuses: [], years: [] }))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        let active = true;
        const params = cleanParams(filters, view, page);
        const viewCall =
            view === 'month'
                ? salaryAnnualAllReportApi.months(params)
                : view === 'matrix'
                    ? salaryAnnualAllReportApi.matrix(params)
                    : salaryAnnualAllReportApi.doctors(params);

        setLoading(true);
        const timer = setTimeout(() => {
            Promise.all([salaryAnnualAllReportApi.summary(params), viewCall])
                .then(([summaryRes, viewRes]) => {
                    if (!active) return;
                    setSummary(summaryRes.data?.data || null);
                    if (view === 'month') {
                        setMonthRows(viewRes.data?.data || []);
                    } else if (view === 'matrix') {
                        setMatrix(viewRes.data?.data || { doctors: [], cells: {}, month_totals: [] });
                        setMatrixMeta(viewRes.data?.meta || null);
                    } else {
                        setDoctorRows(viewRes.data?.data || []);
                        setDoctorMeta(viewRes.data?.meta || null);
                    }
                })
                .catch((err) => {
                    if (!active) return;
                    setSummary(null);
                    toast({
                        variant: 'destructive',
                        title: 'Không tải được báo cáo',
                        description: extractApiError(err, 'Vui lòng kiểm tra lại năm báo cáo.'),
                    });
                })
                .finally(() => active && setLoading(false));
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [filters, view, page, reloadToken, toast]);

    const handleFilterChange = useCallback((patch) => {
        setFilters((prev) => ({ ...prev, ...patch }));
        setPage(1);
    }, []);

    const handleViewChange = (next) => {
        setView(next);
        setPage(1);
    };

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS);
        setPage(1);
    };

    // Drill-down (DR257-260).
    const drillDoctor = (row) =>
        navigate(`/payroll/salary-annual-report?staff_id=${row.staff_id}&year=${filters.year}`);
    const drillMonth = (row) =>
        navigate(`/payroll/salary-report?period_month=${row.month}&period_year=${filters.year}`);
    const drillCell = (staffId, month) =>
        navigate(`/payroll/salary-slips?staff_id=${staffId}&period_month=${month}&period_year=${filters.year}`);

    const downloadExport = async (format) => {
        try {
            const res = await salaryAnnualAllReportApi.export({ ...exportParams, format });
            const blob = new Blob([res.data], { type: MIME[format] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bao-cao-luong-nam-toan-bo-${filters.year}.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast({ title: 'Đã xuất báo cáo', description: `File ${format.toUpperCase()} đã được tạo.` });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Xuất báo cáo thất bại',
                description: extractApiError(err, 'Vui lòng thử lại.'),
            });
        }
    };

    const handlePrint = async () => {
        try {
            const res = await salaryAnnualAllReportApi.export({ ...exportParams, format: 'pdf' });
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

    const isEmpty = summary && summary.doctors_total === 0;

    const exportBtn =
        'inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50';

    return (
        <div className="min-h-full bg-[#f6f7fb] p-4 text-slate-900 lg:p-6">
            <header className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-950">Báo cáo tiền lương toàn bộ bác sĩ theo năm</h1>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                            <span>Báo cáo</span>
                            <ChevronRight size={12} />
                            <span>Tiền lương</span>
                            <ChevronRight size={12} />
                            <span className="font-semibold text-slate-600">Báo cáo lương năm — Toàn bộ bác sĩ</span>
                        </div>
                    </div>
                    {canExport ? (
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => downloadExport('xlsx')} className={exportBtn}>
                                <FileSpreadsheet size={14} /> Xuất Excel
                            </button>
                            <button type="button" onClick={() => downloadExport('pdf')} className={exportBtn}>
                                <FileDown size={14} /> Xuất PDF
                            </button>
                            <button type="button" onClick={handlePrint} className={exportBtn}>
                                <Printer size={14} /> In báo cáo
                            </button>
                        </div>
                    ) : null}
                </div>
            </header>

            <div className="space-y-4">
                <AnnualAllFilters
                    filters={filters}
                    options={options}
                    reportState={summary?.report_state}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                    onApply={() => setReloadToken((t) => t + 1)}
                    loading={loading}
                />

                <AnnualAllKpis summary={summary} />

                <AnnualAllAlerts summary={summary} onFilterStatus={(status) => handleFilterChange({ status })} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ViewModeTabs value={view} onChange={handleViewChange} />
                    <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-400">
                        <span className="font-semibold text-slate-500">Drill-down:</span>
                        {DRILL_HINT.map((h) => (
                            <span key={h.label} className="rounded border border-slate-200 bg-white px-2 py-0.5">
                                {h.label}
                            </span>
                        ))}
                    </div>
                </div>

                {isEmpty ? (
                    <section className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
                        <p className="text-[13px] font-semibold text-slate-600">Không có dữ liệu lương trong năm {filters.year}</p>
                        <p className="text-[12px] text-slate-400">Thử chọn năm khác hoặc điều chỉnh bộ lọc.</p>
                    </section>
                ) : view === 'matrix' ? (
                    <div className="space-y-3">
                        <StatusLegend />
                        <div className="grid gap-4 xl:grid-cols-4">
                            <div className="xl:col-span-3">
                                <DoctorMonthMatrix
                                    doctors={matrix.doctors}
                                    cells={matrix.cells}
                                    monthTotals={matrix.month_totals}
                                    meta={matrixMeta}
                                    loading={loading}
                                    onDrillCell={drillCell}
                                    onDrillMonth={drillMonth}
                                    onPageChange={setPage}
                                />
                            </div>
                            <div className="xl:col-span-1">
                                <MissingPayrollPanel
                                    cases={summary?.missing_cases}
                                    canOpenSlip={canOpenSlip}
                                    onOpenSlip={drillCell}
                                />
                            </div>
                        </div>
                    </div>
                ) : view === 'doctor' ? (
                    <ByDoctorTable
                        rows={doctorRows}
                        meta={doctorMeta}
                        loading={loading}
                        onDrillDoctor={drillDoctor}
                        onPageChange={setPage}
                    />
                ) : (
                    <ByMonthTable rows={monthRows} loading={loading} onDrillMonth={drillMonth} />
                )}

                <AnnualAllAnalytics summary={summary} />

                <p className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[11px] text-slate-400">
                    Mọi giá trị tiền tệ tính bằng VNĐ. Đây là màn hình báo cáo (chỉ đọc) — không cho phép lập, chốt, hủy chốt
                    hay điều chỉnh phiếu lương. Mọi thao tác xử lý phiếu phải thực hiện tại UC16.
                </p>
            </div>
        </div>
    );
};

export default SalaryAnnualAllReport;
