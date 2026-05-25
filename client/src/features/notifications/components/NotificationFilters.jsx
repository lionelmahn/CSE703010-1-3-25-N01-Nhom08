import React from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  CHANNEL,
  CHANNEL_LABEL,
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_LABEL,
  SOURCE,
  SOURCE_LABEL,
} from '../constants';

/**
 * UC10 - Bo filter: type/channel/source/date range/search.
 * Tab status duoc bao boi NotificationStatusTabs nen day khong co status select.
 */
const NotificationFilters = ({ filters, setFilter, onReset }) => {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex w-full items-center gap-2 md:w-72">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={filters.q || ''}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Tim ma, email, ten, tieu de..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="w-40">
        <label className="mb-1 block text-xs font-medium text-gray-600">Loai</label>
        <Select value={filters.type || 'all'} onValueChange={(v) => setFilter('type', v)}>
          <SelectTrigger><SelectValue placeholder="Loai" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            {Object.values(NOTIFICATION_TYPE).map((t) => (
              <SelectItem key={t} value={t}>{NOTIFICATION_TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-32">
        <label className="mb-1 block text-xs font-medium text-gray-600">Kenh</label>
        <Select value={filters.channel || 'all'} onValueChange={(v) => setFilter('channel', v)}>
          <SelectTrigger><SelectValue placeholder="Kenh" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            {Object.values(CHANNEL).map((c) => (
              <SelectItem key={c} value={c}>{CHANNEL_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <label className="mb-1 block text-xs font-medium text-gray-600">Nguon</label>
        <Select value={filters.source || 'all'} onValueChange={(v) => setFilter('source', v)}>
          <SelectTrigger><SelectValue placeholder="Nguon" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            {Object.values(SOURCE).map((s) => (
              <SelectItem key={s} value={s}>{SOURCE_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Tu ngay</label>
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => setFilter('date_from', e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Den ngay</label>
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => setFilter('date_to', e.target.value)}
        />
      </div>

      <Button variant="outline" onClick={onReset} className="ml-auto" type="button">
        <X className="mr-1 size-4" /> Xoa loc
      </Button>
    </div>
  );
};

export default NotificationFilters;
