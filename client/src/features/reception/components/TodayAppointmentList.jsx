import React from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppointmentRowCard from './AppointmentRowCard';
import { ARRIVAL_FILTER_TABS } from '../constants';

/**
 * UC11 - Cot trai man /reception: list lich hen + search + filter + date nav (UI1-UI6).
 */
const TodayAppointmentList = ({
  items,
  loading,
  counts,
  filters,
  setFilter,
  page,
  meta,
  setPage,
  branches = [],
  activeAppointmentId,
  onSelect,
  onRefresh,
}) => {
  const todayStr = filters.date || new Date().toISOString().slice(0, 10);

  const shiftDate = (days) => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() + days);
    setFilter('date', d.toISOString().slice(0, 10));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => shiftDate(-1)}
            aria-label="Ngay truoc"
          >
            <ChevronLeft size={16} />
          </Button>
          <Input
            type="date"
            value={todayStr}
            onChange={(e) => setFilter('date', e.target.value)}
            className="h-9 flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => shiftDate(1)}
            aria-label="Ngay sau"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={onRefresh}
            aria-label="Lam moi"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Tim ten, SDT, ma BN..."
            className="h-9 pl-7"
          />
        </div>
        {branches.length > 0 && (
          <Select value={filters.branch_id || 'all'} onValueChange={(v) => setFilter('branch_id', v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Chi nhanh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca chi nhanh</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id || b.code} value={String(b.id || b.code)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Tabs value={filters.arrival_filter || 'all'} onValueChange={(v) => setFilter('arrival_filter', v)}>
          <TabsList className="grid w-full grid-cols-5">
            {ARRIVAL_FILTER_TABS.map((tab) => {
              const c = counts?.[tab.value === 'all' ? 'all' : tab.value];
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="text-[11px]">
                  {tab.label}
                  {typeof c === 'number' && <span className="ml-1 rounded bg-slate-100 px-1 text-[10px] text-slate-600">{c}</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading && items.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Dang tai...</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Khong co lich hen.</p>
        ) : (
          <div className="space-y-2">
            {items.map((apt) => (
              <AppointmentRowCard
                key={apt.id}
                appointment={apt}
                active={activeAppointmentId === apt.id}
                onClick={onSelect}
              />
            ))}
          </div>
        )}
      </div>

      {meta?.last_page > 1 && (
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-500">
          <span>Trang {meta.current_page}/{meta.last_page} ({meta.total} lich)</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Truoc
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={page >= meta.last_page}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayAppointmentList;
