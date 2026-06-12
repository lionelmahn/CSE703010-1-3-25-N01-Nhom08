import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ROLE_LABEL, WORK_ROLE_OPTIONS, WEEKDAY_LABEL } from '../constants';
import { fmtVnDate, toYmd, trimTime } from '../utils';
import StaffMultiSelect from './StaffMultiSelect';

const DOCTOR_SUB_ROLES = WORK_ROLE_OPTIONS.filter((r) => r.roles.includes('bac_si'));

// Frontend mirror of the backend deriveWorkRole() — display only.
const deriveWorkRole = (roleSlug, doctorSubRole) => {
    if (roleSlug === 'bac_si') return doctorSubRole;
    if (roleSlug === 'le_tan') return 'reception';
    if (roleSlug === 'ke_toan') return 'accountant';
    return 'support';
};

const workRoleLabel = (value) =>
    WORK_ROLE_OPTIONS.find((r) => r.value === value)?.label || value;

const buildEmptyForm = () => ({
    staff_ids: [],
    work_dates: [toYmd(new Date())],
    branch_id: '',
    shift_template_id: '',
    start_time: '',
    end_time: '',
    doctor_sub_role: 'doctor_treatment',
    room: '',
    notes: '',
    status: 'scheduled',
    skip_conflicts: true,
});

const ScheduleBulkFormModal = ({
    open,
    initialData,
    staffList = [],
    branches = [],
    templates = [],
    weekDays = [],
    onClose,
    onSubmit,
}) => {
    const [form, setForm] = useState(buildEmptyForm);
    const [saving, setSaving] = useState(false);
    const [extraDate, setExtraDate] = useState('');
    const [conflicts, setConflicts] = useState([]);

    useEffect(() => {
        if (!open) return;
        const base = buildEmptyForm();
        if (initialData?.staff_ids?.length) base.staff_ids = initialData.staff_ids.map(Number);
        if (initialData?.work_dates?.length) base.work_dates = initialData.work_dates;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(base);
        setConflicts([]);
        setExtraDate('');
    }, [open, initialData]);

    const setField = (key, value) => {
        setForm((prev) => {
            const next = { ...prev, [key]: value };
            if (key === 'shift_template_id' && value) {
                const tpl = templates.find((t) => String(t.id) === String(value));
                if (tpl) {
                    next.start_time = trimTime(tpl.start_time);
                    next.end_time = trimTime(tpl.end_time);
                }
            }
            return next;
        });
    };

    const weekDayYmds = useMemo(() => weekDays.map((d) => toYmd(d)), [weekDays]);

    const toggleDate = (ymd) => {
        setForm((prev) => {
            const has = prev.work_dates.includes(ymd);
            return {
                ...prev,
                work_dates: has
                    ? prev.work_dates.filter((d) => d !== ymd)
                    : [...prev.work_dates, ymd],
            };
        });
    };

    const addExtraDate = () => {
        if (!extraDate) return;
        setForm((prev) =>
            prev.work_dates.includes(extraDate)
                ? prev
                : { ...prev, work_dates: [...prev.work_dates, extraDate] }
        );
        setExtraDate('');
    };

    const extraDates = useMemo(
        () => form.work_dates.filter((d) => !weekDayYmds.includes(d)).sort(),
        [form.work_dates, weekDayYmds]
    );

    const selectedStaff = useMemo(
        () => form.staff_ids.map((id) => staffList.find((s) => Number(s.id) === Number(id))).filter(Boolean),
        [form.staff_ids, staffList]
    );

    const hasDoctors = useMemo(
        () => selectedStaff.some((s) => s.role_slug === 'bac_si'),
        [selectedStaff]
    );

    // Group selected staff by role for the mapping summary.
    const roleSummary = useMemo(() => {
        const map = new Map();
        selectedStaff.forEach((s) => {
            const role = s.role_slug || 'other';
            map.set(role, (map.get(role) || 0) + 1);
        });
        return Array.from(map.entries()).map(([role, count]) => ({
            role,
            count,
            workRoleLabel: workRoleLabel(deriveWorkRole(role, form.doctor_sub_role)),
        }));
    }, [selectedStaff, form.doctor_sub_role]);

    const canSubmit =
        form.staff_ids.length > 0 &&
        form.work_dates.length > 0 &&
        (form.shift_template_id || (form.start_time && form.end_time));

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSaving(true);
        setConflicts([]);
        try {
            const payload = {
                staff_ids: form.staff_ids,
                work_dates: form.work_dates,
                status: form.status,
                skip_conflicts: form.skip_conflicts,
            };
            if (form.branch_id) payload.branch_id = Number(form.branch_id);
            if (form.shift_template_id) payload.shift_template_id = Number(form.shift_template_id);
            if (form.start_time) payload.start_time = form.start_time;
            if (form.end_time) payload.end_time = form.end_time;
            if (form.room) payload.room = form.room;
            if (form.notes) payload.notes = form.notes;
            if (hasDoctors) payload.doctor_sub_role = form.doctor_sub_role;

            const res = await onSubmit(payload);
            if (res?.ok) {
                if (res.conflicts?.length) {
                    setConflicts(res.conflicts);
                } else {
                    onClose();
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const staffName = (id) =>
        staffList.find((s) => Number(s.id) === Number(id))?.full_name || `#${id}`;

    const flattenErrors = (errors) =>
        errors && typeof errors === 'object'
            ? Object.values(errors).flat().join(' • ')
            : '';

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-white rounded-xl p-0 overflow-hidden border shadow-xl">
                <div className="px-6 py-4 border-b bg-slate-50">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-slate-800">
                            Tạo lịch làm việc hàng loạt
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <form onSubmit={submit} className="p-6 grid grid-cols-2 gap-4 max-h-[72vh] overflow-y-auto text-xs">
                    {/* Staff multi-select */}
                    <div className="col-span-2">
                        <label className="block text-gray-600 mb-1 font-medium">
                            Nhân sự <span className="text-red-500">*</span>
                        </label>
                        <StaffMultiSelect
                            staffList={staffList}
                            value={form.staff_ids}
                            onChange={(ids) => setField('staff_ids', ids)}
                            branches={branches}
                        />
                    </div>

                    {/* Multi-day picker */}
                    <div className="col-span-2">
                        <label className="block text-gray-600 mb-1 font-medium">
                            Ngày áp dụng <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {weekDays.map((d) => {
                                const ymd = toYmd(d);
                                const checked = form.work_dates.includes(ymd);
                                const dayIdx = d.getDay();
                                return (
                                    <button
                                        type="button"
                                        key={ymd}
                                        onClick={() => toggleDate(ymd)}
                                        className={`px-2 py-1 rounded border text-[11px] ${checked
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {WEEKDAY_LABEL[dayIdx]} {String(d.getDate()).padStart(2, '0')}/
                                        {String(d.getMonth() + 1).padStart(2, '0')}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="date"
                                value={extraDate}
                                onChange={(e) => setExtraDate(e.target.value)}
                                className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={addExtraDate}
                                className="px-2 py-1 border rounded text-[11px] bg-white hover:bg-gray-50"
                            >
                                + Thêm ngày khác
                            </button>
                        </div>
                        {extraDates.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {extraDates.map((d) => (
                                    <span
                                        key={d}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px]"
                                    >
                                        {fmtVnDate(d)}
                                        <button type="button" onClick={() => toggleDate(d)} className="hover:text-gray-900">
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Shift config */}
                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">Ca chuẩn</label>
                        <select
                            value={form.shift_template_id}
                            onChange={(e) => setField('shift_template_id', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Tùy chỉnh giờ</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({trimTime(t.start_time)} - {trimTime(t.end_time)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">Chi nhánh</label>
                        <select
                            value={form.branch_id}
                            onChange={(e) => setField('branch_id', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">-- Không gán --</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">
                            Giờ bắt đầu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={form.start_time}
                            onChange={(e) => setField('start_time', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">
                            Giờ kết thúc <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={form.end_time}
                            onChange={(e) => setField('end_time', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">Phòng / Khu vực</label>
                        <input
                            type="text"
                            value={form.room}
                            onChange={(e) => setField('room', e.target.value)}
                            placeholder="VD: PK1, Phòng kế toán..."
                            className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">Trạng thái</label>
                        <select
                            value={form.status}
                            onChange={(e) => setField('status', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="scheduled">Đã lên lịch</option>
                            <option value="confirmed">Đã xác nhận</option>
                        </select>
                    </div>

                    {/* Doctor sub-role (only when a doctor is selected) */}
                    {hasDoctors && (
                        <div className="col-span-2">
                            <label className="block text-gray-600 mb-1 font-medium">Vai trò bác sĩ</label>
                            <select
                                value={form.doctor_sub_role}
                                onChange={(e) => setField('doctor_sub_role', e.target.value)}
                                className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {DOCTOR_SUB_ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Role mapping summary */}
                    {roleSummary.length > 0 && (
                        <div className="col-span-2 rounded border bg-slate-50 px-3 py-2 text-[11px] text-gray-600">
                            <div className="font-medium text-gray-700 mb-1">Vai trò công việc sẽ gán:</div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {roleSummary.map((r) => (
                                    <span key={r.role}>
                                        {ROLE_LABEL[r.role] || r.role} ({r.count}) →{' '}
                                        <span className="text-gray-800 font-medium">{r.workRoleLabel}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="col-span-2">
                        <label className="block text-gray-600 mb-1 font-medium">Ghi chú</label>
                        <textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setField('notes', e.target.value)}
                            className="w-full border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                        <input
                            id="skip_conflicts"
                            type="checkbox"
                            checked={form.skip_conflicts}
                            onChange={(e) => setField('skip_conflicts', e.target.checked)}
                            className="h-3.5 w-3.5"
                        />
                        <label htmlFor="skip_conflicts" className="text-gray-600">
                            Bỏ qua các lịch trùng/không hợp lệ (E1–E5) và tạo phần còn lại
                        </label>
                    </div>

                    {/* Conflict result table */}
                    {conflicts.length > 0 && (
                        <div className="col-span-2 border border-orange-200 rounded">
                            <div className="px-3 py-2 border-b bg-orange-50 text-[11px] font-medium text-orange-700">
                                {conflicts.length} lịch bị bỏ qua
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                <table className="w-full text-[11px]">
                                    <thead>
                                        <tr className="text-gray-500 border-b bg-gray-50/50">
                                            <th className="py-1.5 px-3 text-left">Nhân sự</th>
                                            <th className="py-1.5 px-3 text-left w-24">Ngày</th>
                                            <th className="py-1.5 px-3 text-left">Lý do</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conflicts.map((c, idx) => (
                                            <tr key={`${c.staff_id}-${c.work_date}-${idx}`} className="border-b">
                                                <td className="py-1.5 px-3">{staffName(c.staff_id)}</td>
                                                <td className="py-1.5 px-3">{fmtVnDate(c.work_date)}</td>
                                                <td className="py-1.5 px-3 text-orange-700">{flattenErrors(c.errors)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 border rounded text-gray-700 hover:bg-gray-50"
                        >
                            {conflicts.length > 0 ? 'Đóng' : 'Hủy'}
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !canSubmit}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving
                                ? 'Đang lưu...'
                                : `Tạo lịch (${form.staff_ids.length} NS × ${form.work_dates.length} ngày)`}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleBulkFormModal;
