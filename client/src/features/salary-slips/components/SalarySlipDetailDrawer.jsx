import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { salarySlipApi } from '@/api/salarySlipApi';
import StatusBadge from './StatusBadge';
import SalarySlipFormula from './SalarySlipFormula';
import SalarySlipShiftTable from './SalarySlipShiftTable';
import SalarySlipAuditTimeline from './SalarySlipAuditTimeline';
import PatientContributionDrawer from './PatientContributionDrawer';
import {
  formatVnd,
  formatCoefficient,
  formatHours,
  formatDate,
  formatDateTime,
  formatShiftTime,
} from '../utils';

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5 text-[11px] last:border-0">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-800">{value}</span>
  </div>
);

const SalarySlipDetailDrawer = ({ open, slipId, onClose }) => {
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [contributionShift, setContributionShift] = useState(null);

  const fetchSlip = useCallback(async () => {
    if (!open || !slipId) return;
    setLoading(true);
    try {
      const { data } = await salarySlipApi.show(slipId);
      setSlip(data?.data || null);
    } catch {
      setSlip(null);
    } finally {
      setLoading(false);
    }
  }, [open, slipId]);

  useEffect(() => {
    setTab('overview');
    fetchSlip();
  }, [fetchSlip]);

  const shiftView = useMemo(() => {
    if (!slip) return null;
    return {
      details: slip.details || [],
      totals: {
        total_shift_hours: slip.total_shift_hours,
        total_patient_coefficient: slip.total_patient_coefficient,
        total_converted_hours: slip.total_converted_hours,
        total_amount: slip.total_amount,
      },
    };
  }, [slip]);

  const examinationRows = useMemo(() => {
    if (!slip?.details) return [];
    return slip.details.flatMap((detail) =>
      (detail.examination_breakdown || []).map((item) => ({
        ...item,
        work_date: detail.work_date,
        shift_name: detail.shift_name || detail.shift_template_code,
      })),
    );
  }, [slip]);

  if (!open) return null;

  const tabs = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'formula', label: 'Công thức' },
    { key: 'shifts', label: `Ca làm (${slip?.details?.length || 0})` },
    { key: 'examinations', label: `Lượt khám (${examinationRows.length})` },
    { key: 'history', label: 'Lịch sử thao tác' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[640px] flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-[13px] font-extrabold text-slate-900">
              Chi tiết phiếu lương {slip?.code ? `· ${slip.code}` : ''}
            </h3>
            <p className="text-[11px] text-slate-500">
              {slip
                ? `${slip.staff?.full_name || slip.doctor_name_snapshot} · Kỳ ${String(
                    slip.period_month,
                  ).padStart(2, '0')}/${slip.period_year}`
                : 'Đang tải...'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto border-b border-slate-200 px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 py-2 text-[11px] font-semibold ${
                tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading || !slip ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-4">
                  <section className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-[12px] font-extrabold text-slate-800">Thông tin phiếu</h4>
                      <StatusBadge status={slip.status} />
                    </div>
                    <Row label="Bác sĩ" value={`${slip.staff?.full_name || slip.doctor_name_snapshot}`} />
                    <Row label="Kỳ lương" value={`${String(slip.period_month).padStart(2, '0')}/${slip.period_year}`} />
                    <Row label="Người lập" value={`${slip.creator?.name || '-'} · ${formatDateTime(slip.calculated_at)}`} />
                    <Row
                      label="Người chốt"
                      value={slip.finalized_at ? `${slip.finalizer?.name || '-'} · ${formatDateTime(slip.finalized_at)}` : '-'}
                    />
                  </section>

                  <section className="rounded-xl border border-slate-200 p-4">
                    <h4 className="mb-2 text-[12px] font-extrabold text-slate-800">Tổng hợp</h4>
                    <Row label="Tổng số ca" value={slip.total_shifts} />
                    <Row label="Tổng giờ làm việc" value={formatHours(slip.total_shift_hours)} />
                    <Row label="Tổng hệ số bệnh nhân" value={formatCoefficient(slip.total_patient_coefficient)} />
                    <Row label="Tổng giờ chuyển đổi" value={formatHours(slip.total_converted_hours)} />
                    <Row label="Tổng lương" value={<span className="text-slate-900">{formatVnd(slip.total_amount)}</span>} />
                  </section>

                  <section className="rounded-xl border border-slate-200 p-4">
                    <h4 className="mb-2 text-[12px] font-extrabold text-slate-800">Hệ số & mức tiền áp dụng</h4>
                    <Row label="Học hàm / Học vị" value={slip.qualification_name_snapshot || 'Mặc định'} />
                    <Row label="Hệ số bác sĩ" value={formatCoefficient(slip.doctor_coefficient_snapshot)} />
                    <Row label="Mức tiền cơ bản/giờ" value={slip.hourly_rate_snapshot ? formatVnd(slip.hourly_rate_snapshot) : '-'} />
                  </section>
                </div>
              )}

              {tab === 'formula' && <SalarySlipFormula totalAmount={slip.total_amount} />}

              {tab === 'shifts' && (
                <SalarySlipShiftTable view={shiftView} loading={false} onOpenContribution={setContributionShift} />
              )}

              {tab === 'examinations' && (
                <section className="overflow-hidden rounded-xl border border-slate-200">
                  {examinationRows.length ? (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">Ngày / Ca</th>
                          <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">Bệnh nhân</th>
                          <th className="bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold text-slate-600">Dịch vụ</th>
                          <th className="bg-slate-50 px-3 py-2 text-right text-[10.5px] font-bold text-slate-600">Hệ số</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examinationRows.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700">
                              {formatDate(item.work_date)} · {item.shift_name}
                            </td>
                            <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700">
                              {item.patient_name || `BN #${item.patient_id ?? '-'}`}
                            </td>
                            <td className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-700">
                              {item.service_name || '-'}
                            </td>
                            <td className="border-t border-slate-100 px-3 py-2 text-right text-[11px] text-slate-700">
                              {formatCoefficient(item.complexity_coefficient)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="py-10 text-center text-[12px] text-slate-500">
                      Không có lượt khám hoàn tất nào gắn với ca trong kỳ này.
                    </p>
                  )}
                </section>
              )}

              {tab === 'history' && <SalarySlipAuditTimeline slipId={slip.id} />}
            </>
          )}
        </div>
      </div>

      <PatientContributionDrawer
        open={!!contributionShift}
        shift={contributionShift}
        onClose={() => setContributionShift(null)}
      />
    </div>
  );
};

export default SalarySlipDetailDrawer;
