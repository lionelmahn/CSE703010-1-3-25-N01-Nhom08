import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { salaryReportApi } from '@/api/salaryReportApi';
import SalaryReportFilters from '@/features/salary-report/components/SalaryReportFilters';
import SalaryReportKpis from '@/features/salary-report/components/SalaryReportKpis';
import ProvisionalBanner from '@/features/salary-report/components/ProvisionalBanner';
import SalaryReportTable from '@/features/salary-report/components/SalaryReportTable';
import BulkProcessingPanel from '@/features/salary-report/components/BulkProcessingPanel';
import ExportDialog from '@/features/salary-report/components/ExportDialog';
import { extractApiError } from '@/features/salary-report/utils';

const now = new Date();

const DEFAULT_FILTERS = {
    period_month: now.getMonth() + 1,
    period_year: now.getFullYear(),
    branch_id: '',
    qualification_code: '',
    status: '',
    q: '',
    only_finalized: false,
    only_missing: false,
};

const cleanParams = (filters, page) => {
    const params = { page, per_page: 20 };
    Object.entries(filters).forEach(([key, value]) => {
        if (value === '' || value === false || value === null || value === undefined) return;
        params[key] = value;
    });
    return params;
};

const SalaryReport = () => {
    const navigate = useNavigate();
    const { userRole, hasPermission } = useAuth();
    const { toast } = useToast();

    const canManage = userRole === 'admin' || hasPermission('payroll.salary_slip.manage');
    const canExport = userRole === 'admin' || hasPermission('payroll.salary_report.export');

    const [options, setOptions] = useState({ branches: [], qualifications: [], statuses: [] });
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);

    const [summary, setSummary] = useState(null);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);

    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkResults, setBulkResults] = useState([]);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    const exportParams = useMemo(
        () => cleanParams(filters, 1),
        [filters],
    );

    useEffect(() => {
        salaryReportApi
            .options()
            .then(({ data }) => setOptions(data?.data || { branches: [], qualifications: [], statuses: [] }))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        let active = true;
        const params = cleanParams(filters, page);
        setLoading(true);
        const timer = setTimeout(() => {
            Promise.all([salaryReportApi.summary(params), salaryReportApi.doctors(params)])
                .then(([summaryRes, rowsRes]) => {
                    if (!active) return;
                    setSummary(summaryRes.data?.data || null);
                    setRows(rowsRes.data?.data || []);
                    setMeta(rowsRes.data?.meta || null);
                })
                .catch((err) => {
                    if (!active) return;
                    setSummary(null);
                    setRows([]);
                    setMeta(null);
                    toast({
                        variant: 'destructive',
                        title: 'Không tải được báo cáo',
                        description: extractApiError(err, 'Vui lòng kiểm tra lại kỳ báo cáo.'),
                    });
                })
                .finally(() => active && setLoading(false));
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [filters, page, toast]);

    const handleFilterChange = useCallback((patch) => {
        setFilters((prev) => ({ ...prev, ...patch }));
        setPage(1);
    }, []);

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS);
        setPage(1);
        setSelectedIds([]);
    };

    const toggleId = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const toggleAllVisible = (pageIds) =>
        setSelectedIds((prev) => {
            const allSelected = pageIds.every((id) => prev.includes(id));
            return allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])];
        });

    const drillDown = (row) =>
        navigate(
            `/payroll/salary-slips?staff_id=${row.staff_id}&period_month=${filters.period_month}&period_year=${filters.period_year}`,
        );

    const reload = () => setFilters((prev) => ({ ...prev }));

    const runBulk = async (apiCall, successTitle) => {
        if (!selectedIds.length) return;
        setBulkBusy(true);
        try {
            const { data } = await apiCall({
                staff_ids: selectedIds,
                period_month: filters.period_month,
                period_year: filters.period_year,
            });
            const result = data?.data || {};
            setBulkResults(result.results || []);
            const s = result.summary || {};
            toast({
                title: successTitle,
                description: `Lập: ${s.created || 0} · Tính lại: ${s.recalculated || 0} · Bỏ qua: ${s.skipped || 0} · Lỗi: ${s.failed || 0}`,
            });
            setSelectedIds([]);
            reload();
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Xử lý hàng loạt thất bại',
                description: extractApiError(err, 'Vui lòng thử lại.'),
            });
        } finally {
            setBulkBusy(false);
        }
    };

    const handlePrint = async () => {
        try {
            const res = await salaryReportApi.export({ ...exportParams, format: 'pdf' });
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
                    <h1 className="text-xl font-extrabold text-slate-950">Báo cáo tiền lương bác sĩ theo tháng</h1>
                    <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
                        Tổng hợp lương toàn bộ bác sĩ trong một kỳ từ phiếu lương đã lập (UC16). Tổng quỹ lương chính
                        thức chỉ tính các phiếu đã chốt. Nhấp vào bác sĩ để mở/lập phiếu lương chi tiết.
                    </p>
                </div>
            </header>

            <div className="space-y-4">
                <SalaryReportFilters
                    filters={filters}
                    options={options}
                    reportState={summary?.report_state}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                    onExport={() => setExportOpen(true)}
                    onPrint={handlePrint}
                    canExport={canExport}
                    loading={loading}
                />

                <ProvisionalBanner
                    summary={summary}
                    onShowUnfinalized={() => handleFilterChange({ status: 'calculated', only_finalized: false, only_missing: false })}
                />

                <SalaryReportKpis summary={summary} />

                <SalaryReportTable
                    rows={rows}
                    meta={meta}
                    loading={loading}
                    selectedIds={selectedIds}
                    onToggle={toggleId}
                    onToggleAllVisible={toggleAllVisible}
                    onDrillDown={drillDown}
                    onPageChange={setPage}
                />

                <BulkProcessingPanel
                    selectedCount={selectedIds.length}
                    canManage={canManage}
                    busy={bulkBusy}
                    results={bulkResults}
                    onBulkCreate={() => runBulk(salaryReportApi.bulkCreate, 'Đã lập phiếu hàng loạt')}
                    onBulkRecalculate={() => runBulk(salaryReportApi.bulkRecalculate, 'Đã tính lại hàng loạt')}
                    onClearSelection={() => setSelectedIds([])}
                    onClearResults={() => setBulkResults([])}
                />
            </div>

            <ExportDialog open={exportOpen} params={exportParams} onClose={() => setExportOpen(false)} />
        </div>
    );
};

export default SalaryReport;
