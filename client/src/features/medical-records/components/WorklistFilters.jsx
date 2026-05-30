import React from 'react';
import { Search, RefreshCw, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * UC12 - Bar bộ lọc cho worklist.
 */
export default function WorklistFilters({ filters, setFilter, onRefresh, onReset, loading }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Tìm BA-..., tên bệnh nhân, mã BN, SĐT"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          className="pl-9"
        />
      </div>
      <Input
        type="date"
        value={filters.from || ''}
        onChange={(e) => setFilter('from', e.target.value)}
        className="w-[150px]"
      />
      <span className="text-slate-400 text-sm">→</span>
      <Input
        type="date"
        value={filters.to || ''}
        onChange={(e) => setFilter('to', e.target.value)}
        className="w-[150px]"
      />
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Đặt lại
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>
    </div>
  );
}
