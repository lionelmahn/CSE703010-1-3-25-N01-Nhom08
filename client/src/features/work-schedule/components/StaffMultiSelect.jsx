import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ROLE_LABEL } from '../constants';

// Searchable multi-select staff picker (client-side filtering — staffList is
// already loaded, ~<=200 rows). Replaces the slow native <select> dropdown.
const StaffMultiSelect = ({ staffList = [], value = [], onChange, branches = [] }) => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');

    const branchOf = (s) => s.branch_id ?? s.branch?.id ?? null;
    const hasBranchData = useMemo(
        () => staffList.some((s) => branchOf(s) != null),
        [staffList]
    );

    // Roles actually present in the staff list (for the role filter + quick-add).
    const presentRoles = useMemo(() => {
        const set = new Set(staffList.map((s) => s.role_slug).filter(Boolean));
        return Array.from(set);
    }, [staffList]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return staffList.filter((s) => {
            if (q && !(s.full_name || '').toLowerCase().includes(q)) return false;
            if (roleFilter !== 'all' && s.role_slug !== roleFilter) return false;
            if (branchFilter !== 'all' && String(branchOf(s) ?? '') !== branchFilter) return false;
            return true;
        });
    }, [staffList, search, roleFilter, branchFilter]);

    const selectedSet = useMemo(() => new Set(value.map(Number)), [value]);

    const addMany = (ids) => {
        const next = new Set(value.map(Number));
        ids.forEach((id) => next.add(Number(id)));
        onChange(Array.from(next));
    };

    const toggle = (id) => {
        const num = Number(id);
        if (selectedSet.has(num)) {
            onChange(value.filter((v) => Number(v) !== num));
        } else {
            onChange([...value, num]);
        }
    };

    const selectAllFiltered = () => {
        addMany(filtered.filter((s) => s.status === 'working').map((s) => s.id));
    };

    const selectAllRole = (role) => {
        addMany(
            staffList
                .filter((s) => s.role_slug === role && s.status === 'working')
                .map((s) => s.id)
        );
    };

    const selectedStaff = useMemo(
        () => value.map((id) => staffList.find((s) => Number(s.id) === Number(id))).filter(Boolean),
        [value, staffList]
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="border rounded-md">
                <div className="px-3 py-2 border-b bg-gray-50 text-xs font-medium text-gray-700">
                    Tìm và chọn nhân sự
                </div>
                <div className="p-3 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="text"
                            placeholder="Tìm theo tên nhân sự..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 min-w-[140px] border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả vai trò</option>
                            {presentRoles.map((r) => (
                                <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>
                            ))}
                        </select>
                        {hasBranchData && (
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Tất cả chi nhánh</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={String(b.id)}>{b.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={selectAllFiltered}
                            className="px-2 py-1 border rounded text-[11px] bg-white hover:bg-blue-50 text-blue-700"
                        >
                            + Chọn tất cả (đã lọc)
                        </button>
                        {presentRoles.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => selectAllRole(r)}
                                className="px-2 py-1 border rounded text-[11px] bg-white hover:bg-gray-50 text-gray-700"
                            >
                                + Tất cả {ROLE_LABEL[r] || r}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y border rounded">
                        {filtered.length === 0 && (
                            <div className="text-xs text-gray-500 p-2">Không có nhân sự phù hợp</div>
                        )}
                        {filtered.map((s) => {
                            const isSelected = selectedSet.has(Number(s.id));
                            const notWorking = s.status !== 'working';
                            return (
                                <button
                                    type="button"
                                    key={s.id}
                                    onClick={() => toggle(s.id)}
                                    disabled={notWorking}
                                    className={`w-full flex justify-between items-center px-3 py-1.5 text-xs text-left ${notWorking
                                            ? 'opacity-50 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-blue-50'
                                                : 'hover:bg-blue-50'
                                        }`}
                                >
                                    <span>
                                        <span className="font-medium text-gray-700">{s.full_name}</span>
                                        <span className="text-gray-500"> · {ROLE_LABEL[s.role_slug] || s.role_slug}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        {notWorking && (
                                            <span className="text-[10px] text-orange-600">{s.status}</span>
                                        )}
                                        {isSelected && !notWorking && (
                                            <span className="text-[10px] text-blue-600 font-medium">✓ Đã chọn</span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="border rounded-md">
                <div className="px-3 py-2 border-b bg-gray-50 text-xs font-medium text-gray-700 flex justify-between items-center">
                    <span>Đã chọn ({selectedStaff.length})</span>
                    {selectedStaff.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            className="text-[11px] text-red-500 hover:text-red-700"
                        >
                            Bỏ chọn tất cả
                        </button>
                    )}
                </div>
                <div className="p-3">
                    {selectedStaff.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center">Chưa chọn nhân sự nào</div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedStaff.map((s) => (
                                <span
                                    key={s.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px]"
                                >
                                    {s.full_name}
                                    <span className="text-blue-500">· {ROLE_LABEL[s.role_slug] || s.role_slug}</span>
                                    <button
                                        type="button"
                                        onClick={() => toggle(s.id)}
                                        className="ml-0.5 hover:text-blue-900"
                                        title="Bỏ chọn"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffMultiSelect;
