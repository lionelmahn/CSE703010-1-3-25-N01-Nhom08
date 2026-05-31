import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APPOINTMENT_STATUS_LABEL } from '../constants';

const formatLabel = (view, date) => {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return date;
  if (view === 'day') {
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  if (view === 'week') {
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `Tuan ${monday.toLocaleDateString('vi-VN')} - ${sunday.toLocaleDateString('vi-VN')}`;
  }
  return d.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
};

/**
 * UC7 - Header cho calendar: toggle Ngay/Tuan/Thang, nav, filter.
 */
const CalendarHeader = ({
  view,
  setView,
  date,
  shift,
  onPrevious,
  onNext,
  goToday,
  branches = [],
  branchId,
  setBranchId,
  doctors = [],
  doctorId,
  setDoctorId,
  status,
  setStatus,
  loading,
}) => {
  const handlePrevious = () => {
    if (onPrevious) onPrevious();
    else shift?.(-1);
  };

  const handleNext = () => {
    if (onNext) onNext();
    else shift?.(1);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrevious}
          title="Truoc"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => goToday?.()}
        >
          Hom nay
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleNext}
          title="Sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="ml-2 text-sm font-semibold text-slate-800 capitalize">
          {formatLabel(view, date)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={branchId || 'all'} onValueChange={setBranchId}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Chi nhanh: Tat ca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Chi nhanh: Tat ca</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name || b.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={doctorId || 'all'} onValueChange={setDoctorId}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Bac si: Tat ca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bac si: Tat ca</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name || d.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status || 'all'} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Trang thai: Tat ca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Trang thai: Tat ca</SelectItem>
            {Object.entries(APPOINTMENT_STATUS_LABEL).map(([id, label]) => (
              <SelectItem key={id} value={id}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-2 inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          {['day', 'week', 'month'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={
                'px-3 py-1.5 text-xs font-semibold ' +
                (view === v
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50')
              }
            >
              {v === 'day' ? 'Ngay' : v === 'week' ? 'Tuan' : 'Thang'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
