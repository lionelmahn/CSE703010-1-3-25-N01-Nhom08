import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_SOURCE_LABEL, DATE_PRESETS } from '../constants';

/**
 * UC7 - Thanh filter cho danh sach lich hen (AC1, AC2, AC3, search).
 *
 * Bao gom: search, date (today/week/month/custom), branch, status, source.
 */
const formatDate = (d) => d.toISOString().slice(0, 10);

const computePreset = (preset) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (preset === DATE_PRESETS.TODAY) {
    return { date: formatDate(today), date_from: '', date_to: '' };
  }
  if (preset === DATE_PRESETS.WEEK) {
    const start = new Date(today);
    const day = (today.getDay() + 6) % 7; // monday = 0
    start.setDate(today.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { date: '', date_from: formatDate(start), date_to: formatDate(end) };
  }
  if (preset === DATE_PRESETS.MONTH) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { date: '', date_from: formatDate(start), date_to: formatDate(end) };
  }
  return { date: '', date_from: '', date_to: '' };
};

const AppointmentFilters = ({
  filters,
  setFilters,
  setFilter,
  resetFilters,
  branches = [],
  statuses = [],
  sources = [],
  onCreateClick,
  canCreate = true,
}) => {
  const applyPreset = (preset) => {
    const updates = computePreset(preset);
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const activePreset = filters.date
    ? DATE_PRESETS.TODAY
    : filters.date_from && filters.date_to
      ? DATE_PRESETS.WEEK
      : DATE_PRESETS.CUSTOM;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 lg:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Tim theo ho ten, SDT, ma lich hen..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => applyPreset(DATE_PRESETS.TODAY)} className={activePreset === DATE_PRESETS.TODAY ? 'bg-slate-900 text-white hover:bg-slate-800' : ''}>
          Hom nay
        </Button>
        <Button variant="outline" onClick={() => applyPreset(DATE_PRESETS.WEEK)}>Tuan</Button>
        <Button variant="outline" onClick={() => applyPreset(DATE_PRESETS.MONTH)}>Thang</Button>
        <Button variant="outline" onClick={resetFilters}>
          <X className="h-4 w-4 mr-1" />Reset
        </Button>
        {canCreate && (
          <Button onClick={onCreateClick} className="bg-slate-900 text-white hover:bg-slate-800">
            + Tao lich hen
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Ngay</label>
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilter('date', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Chi nhanh</label>
          <Select value={filters.branch_id || 'all'} onValueChange={(v) => setFilter('branch_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tat ca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca chi nhanh</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.label || b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Trang thai</label>
          <Select value={filters.status || 'all'} onValueChange={(v) => setFilter('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tat ca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca trang thai</SelectItem>
              {(statuses.length ? statuses : Object.keys(APPOINTMENT_STATUS_LABEL).map((id) => ({ id, label: APPOINTMENT_STATUS_LABEL[id] }))).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Nguon</label>
          <Select value={filters.source || 'all'} onValueChange={(v) => setFilter('source', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tat ca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca nguon</SelectItem>
              {(sources.length ? sources : Object.keys(APPOINTMENT_SOURCE_LABEL).map((id) => ({ id, label: APPOINTMENT_SOURCE_LABEL[id] }))).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default AppointmentFilters;
