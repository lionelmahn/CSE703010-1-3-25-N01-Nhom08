import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { shiftCoefficientApi } from '@/api/shiftCoefficientApi';
import Pagination from '@/features/service-package/components/Pagination';
import { useShiftCoefficients } from '@/features/shift-coefficients/hooks/useShiftCoefficients';
import CurrentCoefficientMatrix from '@/features/shift-coefficients/components/CurrentCoefficientMatrix';
import MissingCoefficientPanel from '@/features/shift-coefficients/components/MissingCoefficientPanel';
import ShiftCoefficientFilterBar from '@/features/shift-coefficients/components/ShiftCoefficientFilterBar';
import ShiftCoefficientTable from '@/features/shift-coefficients/components/ShiftCoefficientTable';
import ShiftCoefficientFormDrawer from '@/features/shift-coefficients/components/ShiftCoefficientFormDrawer';
import BulkCoefficientDialog from '@/features/shift-coefficients/components/BulkCoefficientDialog';
import StopCoefficientDialog from '@/features/shift-coefficients/components/StopCoefficientDialog';
import ShiftCoefficientDetailDrawer from '@/features/shift-coefficients/components/ShiftCoefficientDetailDrawer';
import AuditLogDrawer from '@/features/shift-coefficients/components/AuditLogDrawer';
import ConflictDialog from '@/features/shift-coefficients/components/ConflictDialog';
import VersionHistoryTimeline from '@/features/shift-coefficients/components/VersionHistoryTimeline';
import {
    dayTypeLabel,
    extractApiError,
    findLocalOverlap,
    formatDate,
    hasOverlapError,
    shiftTypeLabel,
    sortCoefficientsDesc,
    todayInputValue,
} from '@/features/shift-coefficients/utils';

const ShiftCoefficientSettings = () => {
    const { userRole, hasPermission } = useAuth();
    const canManage = userRole === 'admin' || hasPermission('payroll.shift_coefficient.manage');

    const {
        items,
        meta,
        loading,
        error,
        filters,
        setFilter,
        resetFilters,
        setPage,
        perPage,
        setPerPage,
        refetch,
    } = useShiftCoefficients();

    const sortedItems = useMemo(() => sortCoefficientsDesc(items), [items]);
    const [effectiveDate, setEffectiveDate] = useState(todayInputValue());
    const [matrix, setMatrix] = useState(null);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [matrixError, setMatrixError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [formInitial, setFormInitial] = useState(null);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkError, setBulkError] = useState('');
    const [bulkSaving, setBulkSaving] = useState(false);
    const [detailCoefficient, setDetailCoefficient] = useState(null);
    const [auditCoefficient, setAuditCoefficient] = useState(null);
    const [historyCoefficient, setHistoryCoefficient] = useState(null);
    const [stopState, setStopState] = useState({ open: false, coefficient: null });
    const [stopError, setStopError] = useState('');
    const [stopSaving, setStopSaving] = useState(false);
    const [conflictState, setConflictState] = useState({ open: false, payload: null, message: '' });

    const loadMatrix = useCallback(async () => {
        setMatrixLoading(true);
        setMatrixError('');
        try {
            const { data } = await shiftCoefficientApi.effective({ date: effectiveDate });
            setMatrix(data || null);
        } catch (err) {
            setMatrixError(extractApiError(err, 'Không tải được matrix hệ số đang hiệu lực.'));
            setMatrix(null);
        } finally {
            setMatrixLoading(false);
        }
    }, [effectiveDate]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadMatrix();
    }, [loadMatrix]);

    const reloadAll = async () => {
        await Promise.all([refetch(), loadMatrix()]);
    };

    const openCreate = (preset = null) => {
        setFormInitial(preset ? {
            day_type: preset.day_type,
            shift_type: preset.shift_type,
            name: `${dayTypeLabel(preset.day_type)} - ${shiftTypeLabel(preset.shift_type)}`,
            effective_from: effectiveDate || todayInputValue(),
        } : null);
        setFormError('');
        setDetailCoefficient(null);
        setFormOpen(true);
    };

    const handleCreate = async (payload) => {
        setFormError('');

        const localConflict = findLocalOverlap(sortedItems, payload);
        if (localConflict) {
            setConflictState({
                open: true,
                payload,
                message: `Khoảng hiệu lực trùng với ${localConflict.code} (${formatDate(localConflict.effective_from)} - ${localConflict.effective_to ? formatDate(localConflict.effective_to) : 'không thời hạn'}).`,
            });
            return;
        }

        setSaving(true);
        try {
            const { data } = await shiftCoefficientApi.create(payload);
            setFormOpen(false);
            setDetailCoefficient(data || null);
            await reloadAll();
        } catch (err) {
            if (hasOverlapError(err)) {
                setConflictState({
                    open: true,
                    payload,
                    message: extractApiError(err, 'Khoảng hiệu lực bị trùng với cấu hình hiện có.'),
                });
            } else {
                setFormError(extractApiError(err, 'Lưu cấu hình hệ số ca thất bại.'));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleBulkCreate = async (payload) => {
        setBulkSaving(true);
        setBulkError('');
        try {
            const { data } = await shiftCoefficientApi.bulkCreate(payload);
            setBulkOpen(false);
            setDetailCoefficient(data?.data?.[0] || null);
            await reloadAll();
        } catch (err) {
            setBulkError(extractApiError(err, 'Lưu hàng loạt cấu hình thất bại.'));
        } finally {
            setBulkSaving(false);
        }
    };

    const openStop = (coefficient) => {
        setStopError('');
        setDetailCoefficient(null);
        setStopState({ open: true, coefficient });
    };

    const handleStop = async (payload) => {
        if (!stopState.coefficient) return;
        setStopSaving(true);
        setStopError('');
        try {
            const { data } = await shiftCoefficientApi.stop(stopState.coefficient.id, payload);
            setStopState({ open: false, coefficient: null });
            setDetailCoefficient(data || null);
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
                        <h1 className="text-xl font-extrabold text-slate-950">Thiết lập hệ số ca làm việc</h1>
                        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
                            Quản lý hệ số nhân lương theo loại ngày, ca làm việc và khoảng hiệu lực. Khi thay đổi hệ số, tạo phiên bản mới thay vì sửa trực tiếp.
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setBulkOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                                <Layers size={14} /> Nhập hàng loạt
                            </button>
                            <button type="button" onClick={() => openCreate()} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700">
                                <Plus size={14} /> Tạo phiên bản mới
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="space-y-4">
                <CurrentCoefficientMatrix
                    data={matrix}
                    date={effectiveDate}
                    loading={matrixLoading}
                    onChangeDate={setEffectiveDate}
                    onRefresh={loadMatrix}
                    onCreate={canManage ? openCreate : undefined}
                />

                {matrixError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">{matrixError}</div>}

                <MissingCoefficientPanel data={matrix} onCreate={canManage ? openCreate : undefined} />

                <ShiftCoefficientFilterBar filters={filters} setFilter={setFilter} resetFilters={resetFilters} />

                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">{error}</div>}

                <ShiftCoefficientTable
                    rows={sortedItems}
                    loading={loading}
                    selectedId={detailCoefficient?.id}
                    canManage={canManage}
                    onView={setDetailCoefficient}
                    onStop={openStop}
                    onHistory={(coefficient) => {
                        setDetailCoefficient(null);
                        setHistoryCoefficient(coefficient);
                    }}
                />

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Pagination
                        page={meta.current_page}
                        lastPage={meta.last_page}
                        perPage={perPage}
                        total={meta.total}
                        onChangePage={setPage}
                        onChangePerPage={setPerPage}
                    />
                </div>
            </main>

            <ShiftCoefficientFormDrawer
                open={formOpen}
                initialValues={formInitial}
                onClose={() => setFormOpen(false)}
                onSubmit={handleCreate}
                saving={saving}
                error={formError}
            />

            <BulkCoefficientDialog
                open={bulkOpen}
                onClose={() => setBulkOpen(false)}
                onSubmit={handleBulkCreate}
                saving={bulkSaving}
                error={bulkError}
            />

            <StopCoefficientDialog
                open={stopState.open}
                coefficient={stopState.coefficient}
                onClose={() => setStopState({ open: false, coefficient: null })}
                onSubmit={handleStop}
                saving={stopSaving}
                error={stopError}
            />

            <ShiftCoefficientDetailDrawer
                open={!!detailCoefficient}
                coefficient={detailCoefficient}
                rows={sortedItems}
                canManage={canManage}
                onClose={() => setDetailCoefficient(null)}
                onCreate={openCreate}
                onStop={openStop}
                onAudit={(coefficient) => {
                    setDetailCoefficient(null);
                    setAuditCoefficient(coefficient);
                }}
            />

            <AuditLogDrawer open={!!auditCoefficient} coefficient={auditCoefficient} onClose={() => setAuditCoefficient(null)} />

            <VersionHistoryTimeline
                open={!!historyCoefficient}
                coefficient={historyCoefficient}
                rows={sortedItems}
                onClose={() => setHistoryCoefficient(null)}
            />

            <ConflictDialog
                open={conflictState.open}
                payload={conflictState.payload}
                message={conflictState.message}
                onClose={() => setConflictState({ open: false, payload: null, message: '' })}
                onAdjust={() => setConflictState({ open: false, payload: null, message: '' })}
            />
        </div>
    );
};

export default ShiftCoefficientSettings;
