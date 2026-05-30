import React from 'react';
import { Stethoscope, ChevronRight, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  formatDateTime,
  statusLabel,
  statusToneClass,
  ageFromDob,
} from '../lib/format';

const Empty = ({ loading }) => (
  <div className="text-center py-12 text-slate-500 text-sm">
    {loading ? 'Đang tải danh sách...' : 'Chưa có phiên khám nào ở tab này.'}
  </div>
);

/**
 * UC12 - Bang worklist hồ sơ bệnh án.
 */
export default function WorklistTable({ items = [], loading, onOpen }) {
  if (!items.length) return <Empty loading={loading} />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Mã BA</th>
            <th className="px-4 py-3">Bệnh nhân</th>
            <th className="px-4 py-3">Bác sĩ</th>
            <th className="px-4 py-3">Bắt đầu</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => {
            const patient = row.patient || {};
            const doctor = row.doctor || {};
            const age = ageFromDob(patient.dob);
            return (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold">{row.code}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{patient.full_name || '—'}</div>
                  <div className="text-xs text-slate-500">
                    {patient.patient_code}
                    {age != null ? ` · ${age} tuổi` : ''}
                    {patient.phone ? ` · ${patient.phone}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{doctor.name || '—'}</td>
                <td className="px-4 py-3 text-slate-700">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {formatDateTime(row.started_at)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={`${statusToneClass(row.status)} text-xs font-medium`}
                  >
                    {row.status === 'da_khoa' ? <Lock className="h-3 w-3 mr-1" /> : null}
                    {statusLabel(row.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => onOpen?.(row)}
                  >
                    Mở hồ sơ
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
