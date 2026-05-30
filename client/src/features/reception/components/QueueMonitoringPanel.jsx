import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import QueueSummaryStrip from './QueueSummaryStrip';

const KPI_LABELS = {
  total_checked_in: 'Tong check-in',
  waiting: 'Dang cho',
  in_progress: 'Dang kham',
  completed: 'Hoan tat',
  no_show: 'Khong den',
};

/**
 * UC11 - Panel "Theo doi hang cho" - Tab 2 (UI12).
 *
 * Hien thi:
 *  - QueueSummaryStrip (5 chip KPI).
 *  - KPI grid chi tiet (total_checked_in, waiting, in_progress, completed, no_show).
 *  - Alerts (canh bao qua han, etc).
 *  - Table OverdueQueue (BN cho qua 30 phut).
 */
const QueueMonitoringPanel = ({ summary, stats, avgWaitMin }) => {
  const kpi = stats?.kpi || {};
  const alerts = stats?.alerts || [];
  const overdue = stats?.overdue || [];

  return (
    <div className="space-y-4">
      <QueueSummaryStrip summary={summary} avgWaitMin={avgWaitMin} />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {Object.entries(KPI_LABELS).map(([key, label]) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{kpi[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                alert.severity === 'warning'
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-red-300 bg-red-50 text-red-800'
              }`}
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-2.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Clock size={14} /> BN cho qua han (&gt; 30 phut)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Ma cho</th>
                <th className="px-4 py-2 text-left">Benh nhan</th>
                <th className="px-4 py-2 text-left">Bac si</th>
                <th className="px-4 py-2 text-left">Trang thai</th>
                <th className="px-4 py-2 text-right">Cho (phut)</th>
              </tr>
            </thead>
            <tbody>
              {overdue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    Khong co BN cho qua han.
                  </td>
                </tr>
              ) : (
                overdue.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{row.code}</td>
                    <td className="px-4 py-2 font-semibold text-slate-800">{row.patient?.name || '--'}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">{row.assigned_doctor?.name || 'Chua co'}</td>
                    <td className="px-4 py-2 text-xs">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">{row.bucket}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-red-600">{row.wait_minutes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QueueMonitoringPanel;
