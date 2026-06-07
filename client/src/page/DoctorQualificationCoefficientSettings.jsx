/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import Pagination from '@/features/service-package/components/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { doctorQualificationCoefficientApi } from '@/api/doctorQualificationCoefficientApi';
import { useDoctorQualificationCoefficients } from '@/features/doctor-qualification-coefficients/hooks/useDoctorQualificationCoefficients';
import AuditLogDrawer from '@/features/doctor-qualification-coefficients/components/AuditLogDrawer';
import BulkQualificationDialog from '@/features/doctor-qualification-coefficients/components/BulkQualificationDialog';
import ConflictDialog from '@/features/doctor-qualification-coefficients/components/ConflictDialog';
import EffectiveQualificationMatrix from '@/features/doctor-qualification-coefficients/components/EffectiveQualificationMatrix';
import MissingQualificationPanel from '@/features/doctor-qualification-coefficients/components/MissingQualificationPanel';
import QualificationCoefficientFilterBar from '@/features/doctor-qualification-coefficients/components/QualificationCoefficientFilterBar';
import QualificationCoefficientFormDrawer from '@/features/doctor-qualification-coefficients/components/QualificationCoefficientFormDrawer';
import QualificationCoefficientTable from '@/features/doctor-qualification-coefficients/components/QualificationCoefficientTable';
import QualificationDetailDrawer from '@/features/doctor-qualification-coefficients/components/QualificationDetailDrawer';
import StopQualificationDialog from '@/features/doctor-qualification-coefficients/components/StopQualificationDialog';
import VersionTimelineDrawer from '@/features/doctor-qualification-coefficients/components/VersionTimelineDrawer';
import {
    extractApiError,
    findLocalOverlap,
    formatDate,
    hasOverlapError,
    sortRows,
    todayInputValue,
} from '@/features/doctor-qualification-coefficients/utils';

const DoctorQualificationCoefficientSettings = () => {
    const { userRole, hasPermission } = useAuth();
    const canManage = userRole === 'admin' || hasPermission('payroll.doctor_qualification_coefficient.manage');

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
    } = useDoctorQualificationCoefficients();

    const rows = useMemo(() => sortRows(items), [items]);
    const activeCount = useMemo(() => rows.filter((item) => item.status === 'active').length, [rows]);

    const [matrixDate, setMatrixDate] = useState(todayInputValue());
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
            const { data } = await doctorQualificationCoefficientApi.effective({ date: matrixDate });
            setMatrix(data || null);
        } catch (err) {
            setMatrix(null);
            setMatrixError(extractApiError(err, 'Không tải được ma trận hệ số học hàm/học vị.'));
        } finally {
            setMatrixLoading(false);
        }
    }, [matrixDate]);

    useEffect(() => {
        loadMatrix();
    }, [loadMatrix]);

    const reloadAll = async () => {
        await Promise.all([refetch(), refetchOptions(), loadMatrix()]);
    };

    const openCreate = (preset = null) => {
        setFormInitial(preset ? {
            ...preset,
            effective_from: preset.effective_from || matrixDate || todayInputValue(),
        } : null);
        setFormError('');
        setDetailCoefficient(null);
        setFormOpen(true);
    };

    const handleCreate = async (payload) => {
        setFormError('');
        const localConflict = findLocalOverlap(rows, payload);
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
            const { data } = await doctorQualificationCoefficientApi.create(payload);
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
                setFormError(extractApiError(err, 'Lưu cấu hình hệ số bác sĩ thất bại.'));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleBulkCreate = async (payload) => {
        setBulkSaving(true);
        setBulkError('');
        try {
            const { data } = await doctorQualificationCoefficientApi.bulkCreate(payload);
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
            const { data } = await doctorQualificationCoefficientApi.stop(stopState.coefficient.id, payload);
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
                        <h1 className="text-xl font-extrabold text-slate-950">Thiết lập hệ số bác sĩ theo học hàm/học vị</h1>
                        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
                            Quản lý hệ số đầu vào cho tính lương bác sĩ theo phiên bản thời gian, không ghi đè cấu hình cũ.
                        </p>
                    </div>
                    {canManage ? (
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setBulkOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                                <Layers size={14} /> Nhập hàng loạt
                            </button>
                            <button type="button" onClick={() => openCreate()} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700">
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
                        <div className="text-[11px] font-semibold uppercase text-amber-700">Thiếu cấu hình</div>
                        <div className="mt-1 text-2xl font-extrabold text-amber-800">{matrix?.missing_count || 0}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-[11px] font-semibold uppercase text-slate-500">Danh mục Phase 1</div>
                        <div className="mt-1 text-2xl font-extrabold text-slate-950">{options?.qualifications?.length || 5}</div>
                    </div>
                </div>
            </header>

            <main className="space-y-4">
                <EffectiveQualificationMatrix
                    data={matrix}
                    date={matrixDate}
                    loading={matrixLoading || optionsLoading}
                    options={options}
                    onChangeDate={setMatrixDate}
                    onRefresh={loadMatrix}
                    onCreate={canManage ? openCreate : undefined}
                />
                {matrixError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">{matrixError}</div> : null}
                <MissingQualificationPanel data={matrix} onCreate={canManage ? openCreate : undefined} />
                <QualificationCoefficientFilterBar filters={filters} setFilter={setFilter} resetFilters={resetFilters} />
                {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">{error}</div> : null}
                <QualificationCoefficientTable
                    rows={rows}
                    loading={loading}
                    selectedId={detailCoefficient?.id || historyCoefficient?.id || auditCoefficient?.id}
                    canManage={canManage}
                    onView={setDetailCoefficient}
                    onStop={openStop}
                    onHistory={(coefficient) => {
                        setDetailCoefficient(null);
                        setHistoryCoefficient(coefficient);
                    }}
                    onAudit={(coefficient) => {
                        setDetailCoefficient(null);
                        setAuditCoefficient(coefficient);
                    }}
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

            <QualificationCoefficientFormDrawer open={formOpen} initialValues={formInitial} options={options} onClose={() => setFormOpen(false)} onSubmit={handleCreate} saving={saving} error={formError} />
            <BulkQualificationDialog open={bulkOpen} options={options} onClose={() => setBulkOpen(false)} onSubmit={handleBulkCreate} saving={bulkSaving} error={bulkError} />
            <StopQualificationDialog open={stopState.open} coefficient={stopState.coefficient} onClose={() => setStopState({ open: false, coefficient: null })} onSubmit={handleStop} saving={stopSaving} error={stopError} />
            <QualificationDetailDrawer
                open={!!detailCoefficient}
                coefficient={detailCoefficient}
                rows={rows}
                options={options}
                canManage={canManage}
                onClose={() => setDetailCoefficient(null)}
                onCreate={openCreate}
                onStop={openStop}
                onAudit={(coefficient) => {
                    setDetailCoefficient(null);
                    setAuditCoefficient(coefficient);
                }}
                onHistory={(coefficient) => {
                    setDetailCoefficient(null);
                    setHistoryCoefficient(coefficient);
                }}
            />
            <AuditLogDrawer open={!!auditCoefficient} coefficient={auditCoefficient} onClose={() => setAuditCoefficient(null)} />
            <VersionTimelineDrawer open={!!historyCoefficient} coefficient={historyCoefficient} rows={rows} onClose={() => setHistoryCoefficient(null)} />
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

export default DoctorQualificationCoefficientSettings;
