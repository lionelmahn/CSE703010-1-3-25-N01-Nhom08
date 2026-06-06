import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Plus, Wand2 } from 'lucide-react';
import Pagination from '@/features/service-package/components/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { serviceComplexityApi } from '@/api/serviceComplexityApi';
import { useServiceComplexities } from '@/features/service-complexity/hooks/useServiceComplexities';
import AuditLogDrawer from '@/features/service-complexity/components/AuditLogDrawer';
import BulkServiceComplexityDialog from '@/features/service-complexity/components/BulkServiceComplexityDialog';
import EffectiveComplexityMatrix from '@/features/service-complexity/components/EffectiveComplexityMatrix';
import MissingComplexityPanel from '@/features/service-complexity/components/MissingComplexityPanel';
import QuickServiceLevelsDialog from '@/features/service-complexity/components/QuickServiceLevelsDialog';
import ServiceComplexityFilterBar from '@/features/service-complexity/components/ServiceComplexityFilterBar';
import ServiceComplexityFormDrawer from '@/features/service-complexity/components/ServiceComplexityFormDrawer';
import ServiceComplexityTable from '@/features/service-complexity/components/ServiceComplexityTable';
import StopServiceComplexityDialog from '@/features/service-complexity/components/StopServiceComplexityDialog';
import VersionTimelineDrawer from '@/features/service-complexity/components/VersionTimelineDrawer';
import { extractApiError, todayInputValue } from '@/features/service-complexity/utils';

const sortRows = (rows) => [...rows].sort((a, b) => {
    const byDate = new Date(b.effective_from || 0) - new Date(a.effective_from || 0);
    if (byDate !== 0) return byDate;
    return Number(b.id || 0) - Number(a.id || 0);
});

const ServiceComplexitySettings = () => {
    const { userRole, hasPermission } = useAuth();
    const canManage = userRole === 'admin' || hasPermission('payroll.service_complexity.manage');

    const {
        items,
        meta,
        options,
        loading,
        optionsLoading,
        error,
        filters,
        setFilter,
        resetFilters,
        page,
        setPage,
        perPage,
        setPerPage,
        refetch,
        refetchOptions,
    } = useServiceComplexities();

    const rows = useMemo(() => sortRows(items), [items]);
    const activeCount = useMemo(() => rows.filter((item) => item.status === 'active').length, [rows]);

    const [matrixDate, setMatrixDate] = useState(todayInputValue());
    const [matrixGroupId, setMatrixGroupId] = useState('all');
    const [matrixServiceId, setMatrixServiceId] = useState('all');
    const [matrix, setMatrix] = useState(null);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [matrixError, setMatrixError] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [formInitial, setFormInitial] = useState(null);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [quickState, setQuickState] = useState({ open: false, service: null });
    const [quickError, setQuickError] = useState('');
    const [quickSaving, setQuickSaving] = useState(false);

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkError, setBulkError] = useState('');
    const [bulkSaving, setBulkSaving] = useState(false);

    const [stopState, setStopState] = useState({ open: false, coefficient: null });
    const [stopError, setStopError] = useState('');
    const [stopSaving, setStopSaving] = useState(false);
    const [auditCoefficient, setAuditCoefficient] = useState(null);
    const [historyCoefficient, setHistoryCoefficient] = useState(null);

    const loadMatrix = useCallback(async () => {
        setMatrixLoading(true);
        setMatrixError('');
        try {
            const { data } = await serviceComplexityApi.effective({
                date: matrixDate,
                group_id: matrixGroupId,
                service_id: matrixServiceId,
            });
            setMatrix(data || null);
        } catch (err) {
            setMatrix(null);
            setMatrixError(extractApiError(err, 'Không tải được ma trận hiệu lực.'));
        } finally {
            setMatrixLoading(false);
        }
    }, [matrixDate, matrixGroupId, matrixServiceId]);

    useEffect(() => {
        loadMatrix();
    }, [loadMatrix]);

    const reloadAll = async () => {
        await Promise.all([refetch(), refetchOptions(), loadMatrix()]);
    };

    const openCreate = (preset = null) => {
        setFormInitial(preset || null);
        setFormError('');
        setFormOpen(true);
    };

    const handleCreate = async (payload) => {
        setSaving(true);
        setFormError('');
        try {
            await serviceComplexityApi.create(payload);
            setFormOpen(false);
            await reloadAll();
        } catch (err) {
            setFormError(extractApiError(err, 'Lưu cấu hình hệ số phức tạp thất bại.'));
        } finally {
            setSaving(false);
        }
    };

    const handleQuickCreate = async (payload) => {
        setQuickSaving(true);
        setQuickError('');
        try {
            await serviceComplexityApi.bulkCreate(payload);
            setQuickState({ open: false, service: null });
            await reloadAll();
        } catch (err) {
            setQuickError(extractApiError(err, 'Lưu nhanh 4 mức thất bại.'));
        } finally {
            setQuickSaving(false);
        }
    };

    const handleBulkCreate = async (payload) => {
        setBulkSaving(true);
        setBulkError('');
        try {
            await serviceComplexityApi.bulkCreate(payload);
            setBulkOpen(false);
            await reloadAll();
        } catch (err) {
            setBulkError(extractApiError(err, 'Lưu ma trận hàng loạt thất bại.'));
        } finally {
            setBulkSaving(false);
        }
    };

    const openStop = (coefficient) => {
        setStopError('');
        setStopState({ open: true, coefficient });
    };

    const handleStop = async (payload) => {
        if (!stopState.coefficient) return;
        setStopSaving(true);
        setStopError('');
        try {
            await serviceComplexityApi.stop(stopState.coefficient.id, payload);
            setStopState({ open: false, coefficient: null });
            await reloadAll();
        } catch (err) {
            setStopError(extractApiError(err, 'Ngừng áp dụng thất bại.'));
        } finally {
            setStopSaving(false);
        }
    };

    return (
        <div className="min-h-full bg-[#f6f7fb] p-4 text-slate-900 lg:p-6">
            <header className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-950">Thiết lập hệ số phức tạp dịch vụ</h1>
                        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
                            Quản lý hệ số cộng thêm cho UC12 theo dịch vụ, mức xử lý và khoảng hiệu lực. Thay đổi bằng cách tạo phiên bản mới hoặc ngừng áp dụng.
                        </p>
                    </div>
                    {canManage ? (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setQuickState({ open: true, service: null })}
                                className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-200 px-4 text-[12px] font-semibold text-blue-700 hover:bg-blue-50"
                            >
                                <Wand2 size={14} /> Cấu hình nhanh
                            </button>
                            <button
                                type="button"
                                onClick={() => setBulkOpen(true)}
                                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Layers size={14} /> Ma trận nhiều dịch vụ
                            </button>
                            <button
                                type="button"
                                onClick={() => openCreate()}
                                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700"
                            >
                                <Plus size={14} /> Tạo phiên bản mới
                            </button>
                        </div>
                    ) : null}
                </div>
                <div className="grid gap-3 px-5 py-4 md:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-[11px] font-semibold uppercase text-slate-500">Tổng phiên bản</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-950">{meta.total || 0}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-[11px] font-semibold uppercase text-emerald-700">Đang áp dụng trên trang</div>
                        <div className="mt-1 text-2xl font-extrabold text-emerald-800">{activeCount}</div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="text-[11px] font-semibold uppercase text-amber-700">Ô thiếu trong ma trận</div>
                        <div className="mt-1 text-2xl font-extrabold text-amber-800">{matrix?.missing_count || 0}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-[11px] font-semibold uppercase text-slate-500">Dịch vụ có thể cấu hình</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-950">{options?.services?.length || 0}</div>
                    </div>
                </div>
            </header>

            <main className="space-y-4">
                <EffectiveComplexityMatrix
                    data={matrix}
                    date={matrixDate}
                    loading={matrixLoading || optionsLoading}
                    options={options}
                    groupId={matrixGroupId}
                    serviceId={matrixServiceId}
                    onChangeDate={setMatrixDate}
                    onChangeGroup={setMatrixGroupId}
                    onChangeService={setMatrixServiceId}
                    onRefresh={loadMatrix}
                    onCreate={canManage ? openCreate : undefined}
                    onQuick={canManage ? (service) => {
                        setQuickError('');
                        setQuickState({ open: true, service });
                    } : undefined}
                />

                {matrixError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">{matrixError}</div>
                ) : null}

                <MissingComplexityPanel data={matrix} onCreate={canManage ? openCreate : undefined} />

                <ServiceComplexityFilterBar
                    filters={filters}
                    setFilter={setFilter}
                    resetFilters={resetFilters}
                    options={options}
                />

                {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">{error}</div>
                ) : null}

                <ServiceComplexityTable
                    rows={rows}
                    loading={loading}
                    selectedId={historyCoefficient?.id || auditCoefficient?.id}
                    canManage={canManage}
                    onHistory={setHistoryCoefficient}
                    onAudit={setAuditCoefficient}
                    onStop={openStop}
                />

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Pagination
                        page={page}
                        lastPage={meta.last_page}
                        perPage={perPage}
                        total={meta.total}
                        onChangePage={setPage}
                        onChangePerPage={setPerPage}
                    />
                </div>
            </main>

            <ServiceComplexityFormDrawer
                open={formOpen}
                initialValues={formInitial}
                options={options}
                onClose={() => setFormOpen(false)}
                onSubmit={handleCreate}
                saving={saving}
                error={formError}
            />

            <QuickServiceLevelsDialog
                open={quickState.open}
                service={quickState.service}
                options={options}
                onClose={() => setQuickState({ open: false, service: null })}
                onSubmit={handleQuickCreate}
                saving={quickSaving}
                error={quickError}
            />

            <BulkServiceComplexityDialog
                open={bulkOpen}
                options={options}
                onClose={() => setBulkOpen(false)}
                onSubmit={handleBulkCreate}
                saving={bulkSaving}
                error={bulkError}
            />

            <StopServiceComplexityDialog
                open={stopState.open}
                coefficient={stopState.coefficient}
                onClose={() => setStopState({ open: false, coefficient: null })}
                onSubmit={handleStop}
                saving={stopSaving}
                error={stopError}
            />

            <AuditLogDrawer
                open={!!auditCoefficient}
                coefficient={auditCoefficient}
                onClose={() => setAuditCoefficient(null)}
            />

            <VersionTimelineDrawer
                open={!!historyCoefficient}
                coefficient={historyCoefficient}
                rows={rows}
                onClose={() => setHistoryCoefficient(null)}
            />
        </div>
    );
};

export default ServiceComplexitySettings;
