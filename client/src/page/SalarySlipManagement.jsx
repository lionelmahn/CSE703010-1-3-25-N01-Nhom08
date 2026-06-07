import React, { useCallback, useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { salarySlipApi } from '@/api/salarySlipApi';
import SalarySlipHeaderBar from '@/features/salary-slips/components/SalarySlipHeaderBar';
import SalarySlipSummary from '@/features/salary-slips/components/SalarySlipSummary';
import SalarySlipDataCheck from '@/features/salary-slips/components/SalarySlipDataCheck';
import SalarySlipFormula from '@/features/salary-slips/components/SalarySlipFormula';
import SalarySlipIssues from '@/features/salary-slips/components/SalarySlipIssues';
import SalarySlipShiftTable from '@/features/salary-slips/components/SalarySlipShiftTable';
import PatientContributionDrawer from '@/features/salary-slips/components/PatientContributionDrawer';
import FinalizeSalarySlipDialog from '@/features/salary-slips/components/FinalizeSalarySlipDialog';
import SalarySlipDetailDrawer from '@/features/salary-slips/components/SalarySlipDetailDrawer';
import DoctorPickerDialog from '@/features/salary-slips/components/DoctorPickerDialog';
import StatusBadge from '@/features/salary-slips/components/StatusBadge';
import { extractApiError, formatVnd } from '@/features/salary-slips/utils';

const now = new Date();

const SalarySlipManagement = () => {
    const { userRole, hasPermission } = useAuth();
    const { toast } = useToast();
    const canManage = userRole === 'admin' || hasPermission('payroll.salary_slip.manage');

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const [view, setView] = useState(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [contributionShift, setContributionShift] = useState(null);
    const [finalizeOpen, setFinalizeOpen] = useState(false);
    const [detailSlipId, setDetailSlipId] = useState(null);

    const [recent, setRecent] = useState([]);

    const slipStatus = view?.existing_slip_status || 'none';
    const hasSlip = Boolean(view?.existing_slip_id);

    const loadRecent = useCallback(async () => {
        try {
            const { data } = await salarySlipApi.list({ per_page: 8 });
            setRecent(data?.data || []);
        } catch {
            setRecent([]);
        }
    }, []);

    useEffect(() => {
        loadRecent();
    }, [loadRecent]);

    const loadWorkspace = useCallback(
        async (staffId, targetMonth, targetYear) => {
            if (!staffId) {
                toast({ variant: 'destructive', title: 'Vui lòng chọn bác sĩ' });
                return;
            }
            setLoading(true);
            try {
                const { data } = await salarySlipApi.preview({
                    staff_id: staffId,
                    period_month: targetMonth,
                    period_year: targetYear,
                });
                setView(data?.data || null);
            } catch (err) {
                setView(null);
                toast({
                    variant: 'destructive',
                    title: 'Không tính được phiếu lương',
                    description: extractApiError(err, 'Vui lòng kiểm tra lại bác sĩ và kỳ lương.'),
                });
            } finally {
                setLoading(false);
            }
        },
        [toast],
    );

    const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
        loadWorkspace(doctor.id, month, year);
    };

    const handleChangeMonth = (m) => {
        setMonth(m);
        if (selectedDoctor) loadWorkspace(selectedDoctor.id, m, year);
        else setView(null);
    };

    const handleChangeYear = (y) => {
        setYear(y);
        if (selectedDoctor) loadWorkspace(selectedDoctor.id, month, y);
        else setView(null);
    };

    const handleCreate = async () => {
        if (!selectedDoctor) return;
        setBusy(true);
        try {
            await salarySlipApi.create({ staff_id: selectedDoctor.id, period_month: month, period_year: year });
            toast({ title: 'Đã tạo phiếu lương', description: 'Phiếu ở trạng thái Đã tính.' });
            await Promise.all([loadWorkspace(selectedDoctor.id, month, year), loadRecent()]);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Tạo phiếu lương thất bại',
                description: extractApiError(err, 'Vui lòng thử lại.'),
            });
        } finally {
            setBusy(false);
        }
    };

    const handleRecalculate = async () => {
        if (!view?.existing_slip_id) return;
        setBusy(true);
        try {
            await salarySlipApi.recalculate(view.existing_slip_id);
            toast({ title: 'Đã tính lại phiếu lương' });
            await Promise.all([loadWorkspace(selectedDoctor.id, month, year), loadRecent()]);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Tính lại thất bại',
                description: extractApiError(err, 'Vui lòng thử lại.'),
            });
        } finally {
            setBusy(false);
        }
    };

    const handleFinalize = async () => {
        if (!view?.existing_slip_id) return;
        setBusy(true);
        try {
            await salarySlipApi.finalize(view.existing_slip_id);
            toast({ title: 'Đã chốt phiếu lương' });
            setFinalizeOpen(false);
            await Promise.all([loadWorkspace(selectedDoctor.id, month, year), loadRecent()]);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Không thể chốt phiếu lương',
                description: extractApiError(err, 'Còn dữ liệu chưa hợp lệ.'),
            });
            await loadWorkspace(selectedDoctor.id, month, year);
        } finally {
            setBusy(false);
        }
    };

    const handleComingSoon = () =>
        toast({ title: 'Tính năng đang phát triển', description: 'Chức năng này sẽ sớm ra mắt.' });

    const openRecent = (slip) => {
        const doctor = {
            id: slip.staff_id,
            full_name: slip.staff?.full_name || slip.doctor_name_snapshot,
            employee_code: slip.staff?.employee_code || '',
        };
        setSelectedDoctor(doctor);
        setMonth(slip.period_month);
        setYear(slip.period_year);
        loadWorkspace(slip.staff_id, slip.period_month, slip.period_year);
    };

    return (
        <div className="min-h-full bg-[#f6f7fb] p-4 text-slate-900 lg:p-6">
            <header className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h1 className="text-xl font-extrabold text-slate-950">Lập phiếu lương bác sĩ</h1>
                    <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
                        Chọn bác sĩ và kỳ lương để tính, kiểm tra chi tiết từng ca và chốt phiếu lương tháng. Phiếu đã
                        chốt là nguồn dữ liệu cho các báo cáo lương.
                    </p>
                </div>
            </header>

            <div className="space-y-4">
                <SalarySlipHeaderBar
                    selectedDoctor={selectedDoctor}
                    month={month}
                    year={year}
                    onChangeMonth={handleChangeMonth}
                    onChangeYear={handleChangeYear}
                    onOpenPicker={() => setPickerOpen(true)}
                    slipStatus={slipStatus}
                    hasSlip={hasSlip}
                    lastCalcAt={view?.existing_slip_calculated_at}
                    lastCalcBy={view?.existing_slip_calculated_by}
                    canFinalize={view?.can_finalize}
                    canManage={canManage}
                    loading={loading}
                    busy={busy}
                    onCalculate={() => selectedDoctor && loadWorkspace(selectedDoctor.id, month, year)}
                    onCreate={handleCreate}
                    onRecalculate={handleRecalculate}
                    onFinalize={() => setFinalizeOpen(true)}
                    onExport={handleComingSoon}
                    onPrint={handleComingSoon}
                />

                {view && (
                    <>
                        <SalarySlipSummary view={view} slipStatus={slipStatus} />

                        {view.existing_slip_id && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setDetailSlipId(view.existing_slip_id)}
                                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Eye size={14} /> Xem chi tiết phiếu
                                </button>
                            </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-3">
                            <SalarySlipDataCheck view={view} />
                            <SalarySlipFormula totalAmount={view.totals?.total_amount} />
                            <SalarySlipIssues issues={view.issues} />
                        </div>

                        <SalarySlipShiftTable view={view} loading={loading} onOpenContribution={setContributionShift} />
                    </>
                )}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-slate-700">
                            Phiếu lương gần đây
                        </h3>
                    </div>
                    {recent.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">Mã phiếu</th>
                                        <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">Bác sĩ</th>
                                        <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">Kỳ</th>
                                        <th className="bg-slate-50 px-3 py-2 text-right text-[10.5px] font-bold text-slate-600">Tổng lương</th>
                                        <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">Trạng thái</th>
                                        <th className="bg-slate-50 px-3 py-2 text-center text-[10.5px] font-bold text-slate-600">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((slip) => (
                                        <tr key={slip.id} onClick={() => openRecent(slip)} className="cursor-pointer hover:bg-slate-50">
                                            <td className="border-t border-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-800">
                                                {slip.code}
                                            </td>
                                            <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700">
                                                {slip.staff?.full_name || slip.doctor_name_snapshot}
                                            </td>
                                            <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700">
                                                {String(slip.period_month).padStart(2, '0')}/{slip.period_year}
                                            </td>
                                            <td className="border-t border-slate-100 px-3 py-2 text-right text-[11px] font-semibold text-slate-900">
                                                {formatVnd(slip.total_amount)}
                                            </td>
                                            <td className="border-t border-slate-100 px-3 py-2 text-[11px]">
                                                <StatusBadge status={slip.status} />
                                            </td>
                                            <td className="border-t border-slate-100 px-3 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailSlipId(slip.id);
                                                    }}
                                                    title="Xem chi tiết phiếu"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="px-4 py-8 text-center text-[12px] text-slate-500">Chưa có phiếu lương nào.</p>
                    )}
                </section>
            </div>

            <DoctorPickerDialog
                open={pickerOpen}
                periodMonth={month}
                periodYear={year}
                currentStaffId={selectedDoctor?.id}
                onSelect={handleSelectDoctor}
                onClose={() => setPickerOpen(false)}
            />

            <PatientContributionDrawer
                open={!!contributionShift}
                shift={contributionShift}
                onClose={() => setContributionShift(null)}
            />

            <FinalizeSalarySlipDialog
                open={finalizeOpen}
                view={view}
                saving={busy}
                onClose={() => setFinalizeOpen(false)}
                onConfirm={handleFinalize}
            />

            <SalarySlipDetailDrawer
                open={!!detailSlipId}
                slipId={detailSlipId}
                onClose={() => setDetailSlipId(null)}
            />
        </div>
    );
};

export default SalarySlipManagement;
