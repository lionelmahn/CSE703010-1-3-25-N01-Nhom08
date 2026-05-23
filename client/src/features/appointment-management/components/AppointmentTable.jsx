import React from 'react';
import { Loader2, CalendarOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';
import { APPOINTMENT_SOURCE_LABEL } from '../constants';
import { useAppointmentLookups } from '../hooks/useAppointmentLookups';

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('vi-VN');
};

const formatSlot = (slot) => {
  if (!slot) return '-';
  if (slot === '17-1730') return '17:00 - 17:30';
  const [a, b] = slot.split('-');
  return `${a}:00 - ${b}:00`;
};

/**
 * UC7 - Bang lich hen (AC1 - hien thi danh sach).
 */
const AppointmentTable = ({
  items = [],
  loading,
  error,
  onRowClick,
  meta = {},
  page,
  setPage,
}) => {
  const isEmpty = !loading && items.length === 0;
  const lastPage = meta.last_page || 1;
  const { getBranchName } = useAppointmentLookups();

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Ma lich hen</TableHead>
              <TableHead>Benh nhan</TableHead>
              <TableHead>Lien lac</TableHead>
              <TableHead>Ngay hen</TableHead>
              <TableHead>Khung gio</TableHead>
              <TableHead>Chi nhanh</TableHead>
              <TableHead>Bac si</TableHead>
              <TableHead>Nguon</TableHead>
              <TableHead>Trang thai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-slate-500">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Dang tai...
                </TableCell>
              </TableRow>
            )}
            {!loading && isEmpty && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">
                  <CalendarOff className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  Khong co lich hen nao phu hop bo loc.
                </TableCell>
              </TableRow>
            )}
            {!loading && items.map((a) => (
              <TableRow
                key={a.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onRowClick?.(a)}
              >
                <TableCell className="font-mono text-xs">{a.code}</TableCell>
                <TableCell>
                  <div className="text-sm font-semibold text-slate-800">{a.patient?.name || '-'}</div>
                  <div className="text-xs text-slate-500">{a.patient?.code}</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div>{a.patient?.phone || '-'}</div>
                  <div className="text-slate-400">{a.patient?.email || ''}</div>
                </TableCell>
                <TableCell className="text-sm">{formatDate(a.appointment_date)}</TableCell>
                <TableCell className="text-sm">{formatSlot(a.time_slot)}</TableCell>
                <TableCell className="text-xs">{getBranchName(a.branch_id) || a.branch_id || '-'}</TableCell>
                <TableCell className="text-xs">{a.assigned_doctor?.name || <span className="text-slate-400">Chua phan cong</span>}</TableCell>
                <TableCell className="text-xs">{APPOINTMENT_SOURCE_LABEL[a.source] || a.source || '-'}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
        <div>
          Tong: <b className="text-slate-700">{meta.total ?? 0}</b> lich hen
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            Truoc
          </Button>
          <span>
            Trang <b>{page}</b> / <b>{lastPage}</b>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage || loading}
            onClick={() => setPage(Math.min(lastPage, page + 1))}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentTable;
