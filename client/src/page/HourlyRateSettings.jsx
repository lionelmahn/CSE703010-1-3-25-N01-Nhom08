import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hourlyRateApi } from '@/api/hourlyRateApi';
import { useHourlyRates } from '@/features/hourly-rates/hooks/useHourlyRates';
import CurrentHourlyRatePanel from '@/features/hourly-rates/components/CurrentHourlyRatePanel';
import HourlyRateFilterBar from '@/features/hourly-rates/components/HourlyRateFilterBar';
import HourlyRateTable from '@/features/hourly-rates/components/HourlyRateTable';
import HourlyRateFormDialog from '@/features/hourly-rates/components/HourlyRateFormDialog';
import StopHourlyRateDialog from '@/features/hourly-rates/components/StopHourlyRateDialog';
import HourlyRateDetailDrawer from '@/features/hourly-rates/components/HourlyRateDetailDrawer';
import AuditLogDrawer from '@/features/hourly-rates/components/AuditLogDrawer';
import ConflictDialog from '@/features/hourly-rates/components/ConflictDialog';
import Pagination from '@/features/service-package/components/Pagination';
import {
    extractApiError,
    findLocalOverlap,
    formatDate,
    hasOverlapError,
    sortRatesDesc,
    versionLabel,
} from '@/features/hourly-rates/utils';

const HourlyRateSettings = () => {
    const { userRole, hasPermission } = useAuth();
    const canManage = userRole === 'admin' || hasPermission('payroll.hourly_rate.manage');

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
    } = useHourlyRates();

    const sortedItems = useMemo(() => sortRatesDesc(items), [items]);

    const [current, setCurrent] = useState(null);
    const [currentLoading, setCurrentLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [formError, setFormError] = useState('');
    const [lastPayload, setLastPayload] = useState(null);
    const [saving, setSaving] = useState(false);
    const [stopState, setStopState] = useState({ open: false, rate: null });
    const [stopError, setStopError] = useState('');
    const [stopSaving, setStopSaving] = useState(false);
    const [detailRate, setDetailRate] = useState(null);
    const [auditRate, setAuditRate] = useState(null);
    const [conflictState, setConflictState] = useState({ open: false, payload: null, message: '' });

    const loadCurrent = useCallback(async () => {
        setCurrentLoading(true);
        try {
            const { data } = await hourlyRateApi.current();
            setCurrent(data?.data || null);
        } catch {
            setCurrent(null);
        } finally {
            setCurrentLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCurrent();
    }, [loadCurrent]);

    const reloadAll = async () => {
        await Promise.all([refetch(), loadCurrent()]);
    };

    const openCreate = () => {
        setFormError('');
        setDetailRate(null);
        setFormOpen(true);
    };

    const openDetail = (rate) => {
        if (!rate) return;
        setDetailRate(rate);
    };

    const openStop = (rate) => {
        setStopError('');
        setDetailRate(null);
        setStopState({ open: true, rate });
    };

    const openAudit = (rate) => {
        setDetailRate(null);
        setAuditRate(rate);
    };

    const handleCreate = async (payload) => {
        setFormError('');
        setLastPayload(payload);

        const localConflict = findLocalOverlap(sortedItems, payload);
        if (localConflict) {
            setConflictState({
                open: true,
                payload,
                message: `Khoảng hiệu lực trùng với ${versionLabel(sortedItems, localConflict)} (${formatDate(
                    localConflict.effective_from,
                )} - ${localConflict.effective_to ? formatDate(localConflict.effective_to) : 'không thời hạn'}).`,
            });
            return;
        }

        setSaving(true);
        try {
            const { data } = await hourlyRateApi.create(payload);
            setFormOpen(false);
            setDetailRate(data || null);
            await reloadAll();
        } catch (err) {
            if (hasOverlapError(err)) {
                setConflictState({
                    open: true,
                    payload,
                    message: extractApiError(err, 'Khoảng hiệu lực bị trùng với phiên bản hiện có.'),
                });
            } else {
                setFormError(extractApiError(err, 'Lưu cấu hình mức tiền/giờ thất bại.'));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleStop = async (payload) => {
        if (!stopState.rate) return;
        setStopSaving(true);
        setStopError('');
        try {
            const { data } = await hourlyRateApi.stop(stopState.rate.id, payload);
            setStopState({ open: false, rate: null });
            setDetailRate(data || null);
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
                        <h1 className="text-xl font-extrabold text-slate-950">Thiết lập mức tiền cơ bản/giờ</h1>
                        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">
                            Quản lý phiên bản mức tiền/giờ theo ngày hiệu lực. Khi thay đổi mức tiền, tạo phiên bản mới thay vì sửa trực tiếp phiên bản đã dùng.
                        </p>
                    </div>
                    {canManage && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700"
                        >
                            <Plus size={14} /> Tạo phiên bản mới
                        </button>
                    )}
                </div>
            </header>

            <div className="mb-4">
                <CurrentHourlyRatePanel
                    current={current}
                    loading={currentLoading}
                    onView={openDetail}
                />
            </div>

            <main className="min-w-0 space-y-4">
                <HourlyRateFilterBar filters={filters} setFilter={setFilter} resetFilters={resetFilters} />
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
                        {error}
                    </div>
                )}
                <HourlyRateTable
                    rows={sortedItems}
                    loading={loading}
                    selectedId={detailRate?.id}
                    canManage={canManage}
                    onView={openDetail}
                    onStop={openStop}
                    onAudit={openAudit}
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

            <HourlyRateDetailDrawer
                open={!!detailRate}
                rate={detailRate}
                rates={sortedItems}
                canManage={canManage}
                onClose={() => setDetailRate(null)}
                onCreate={openCreate}
                onStop={openStop}
                onAudit={openAudit}
            />

            <HourlyRateFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleCreate}
                saving={saving}
                error={formError}
                rates={sortedItems}
                current={current}
            />

            <StopHourlyRateDialog
                open={stopState.open}
                rate={stopState.rate}
                rates={sortedItems}
                onClose={() => setStopState({ open: false, rate: null })}
                onSubmit={handleStop}
                saving={stopSaving}
                error={stopError}
            />

            <AuditLogDrawer open={!!auditRate} rate={auditRate} rates={sortedItems} onClose={() => setAuditRate(null)} />

            <ConflictDialog
                open={conflictState.open}
                payload={conflictState.payload || lastPayload}
                message={conflictState.message}
                onClose={() => setConflictState({ open: false, payload: null, message: '' })}
                onAdjust={() => setConflictState({ open: false, payload: null, message: '' })}
                onCreateAfter={() => setConflictState({ open: false, payload: null, message: '' })}
            />
        </div>
    );
};

export default HourlyRateSettings;
