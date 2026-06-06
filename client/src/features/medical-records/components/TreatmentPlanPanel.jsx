import React, { useCallback, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { medicalRecordsApi } from '@/api/medicalRecordsApi';
import ServiceRowEditor from './ServiceRowEditor';
import { formatVnd, LEVEL_LABELS } from '../lib/format';

/**
 * UC12 - Bang chi dinh dich vu (treatment plan).
 *
 * Props:
 *  - items: ExaminationServiceItem[]
 *  - services: catalog Service[]
 *  - canEdit: cho add/edit/delete.
 *  - onAdd, onUpdate, onRemove: handlers tu page (goi API + refresh).
 *  - options: tu /examinations/options (processing_levels + map coef).
 */
export default function TreatmentPlanPanel({
  items = [],
  services = [],
  canEdit,
  options,
  onAdd,
  onUpdate,
  onRemove,
  saving,
  errors = {},
}) {
  const [mode, setMode] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const total = items.reduce((s, it) => s + Number(it.subtotal_snapshot || 0), 0);

  const levelLabels = useMemo(() => {
    const arr = options?.processing_levels;
    if (!Array.isArray(arr) || arr.length === 0) return LEVEL_LABELS;
    return arr.reduce((acc, l) => ({ ...acc, [l.value]: l.label }), {});
  }, [options]);

  const defaultCoefByLevel = useMemo(() => {
    const arr = options?.processing_levels;
    if (!Array.isArray(arr)) return {};
    return arr.reduce((acc, l) => ({ ...acc, [l.value]: Number(l.default_coefficient || 0) }), {});
  }, [options]);

  const coefficientPreviewer = useCallback(async (serviceId, level) => {
    const fallback = defaultCoefByLevel[level] ?? 0;
    if (!serviceId || !level) return fallback;

    try {
      const response = await medicalRecordsApi.serviceComplexityPreview({
        service_id: serviceId,
        processing_level: level,
      });
      return Number(response?.data?.coefficient ?? fallback);
    } catch {
      return fallback;
    }
  }, [defaultCoefByLevel]);

  const editingItem = useMemo(
    () => items.find((it) => it.id === editingId),
    [items, editingId],
  );

  const handleAdd = async (payload) => {
    try {
      await onAdd?.(payload);
      setMode(null);
    } catch {
      // server errors get displayed via parent (errors prop).
    }
  };

  const handleEdit = async (payload) => {
    try {
      await onUpdate?.(editingId, payload);
      setEditingId(null);
      setMode(null);
    } catch {
      // server errors displayed.
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
          Chỉ định dịch vụ ({items.length}/50)
        </h2>
        {canEdit && mode == null ? (
          <Button size="sm" onClick={() => { setEditingId(null); setMode('add'); }}>
            <Plus className="h-4 w-4 mr-1" /> Thêm dịch vụ
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Mã / Tên</th>
              <th className="px-4 py-2">Răng</th>
              <th className="px-4 py-2">Mức xử lý</th>
              <th className="px-4 py-2 text-right">Đơn giá</th>
              <th className="px-4 py-2 text-right">SL</th>
              <th className="px-4 py-2 text-right">HSPT</th>
              <th className="px-4 py-2 text-right">Thành tiền</th>
              <th className="px-4 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
                  Chưa có dịch vụ nào trong phiên khám.
                </td>
              </tr>
            ) : null}
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900 text-sm">{it.service_name}</div>
                  <div className="font-mono text-xs text-slate-500">{it.service_code}</div>
                </td>
                <td className="px-4 py-2 text-xs">
                  {Array.isArray(it.tooth_codes) && it.tooth_codes.length
                    ? it.tooth_codes.join(', ')
                    : '—'}
                </td>
                <td className="px-4 py-2 text-xs text-slate-700">
                  {levelLabels?.[it.processing_level] || it.processing_level}
                </td>
                <td className="px-4 py-2 text-right">{formatVnd(it.unit_price_snapshot)}</td>
                <td className="px-4 py-2 text-right">{it.quantity}</td>
                <td className="px-4 py-2 text-right">+{Number(it.complexity_coefficient ?? 0).toFixed(1)}</td>
                <td className="px-4 py-2 text-right font-semibold">{formatVnd(it.subtotal_snapshot)}</td>
                <td className="px-4 py-2 text-right">
                  {it.is_paid ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                      <Lock className="h-3 w-3" /> Đã thanh toán
                    </span>
                  ) : canEdit ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => { setEditingId(it.id); setMode('edit'); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500 hover:text-rose-600"
                        onClick={() => {
                          if (window.confirm(`Xoá dịch vụ "${it.service_name}"?`)) {
                            onRemove?.(it.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 ? (
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={6} className="px-4 py-2 text-right text-xs uppercase text-slate-500">
                  Tổng tạm tính
                </td>
                <td className="px-4 py-2 text-right font-bold">{formatVnd(total)}</td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {mode === 'add' ? (
        <div className="border-t border-slate-100 p-4">
          <ServiceRowEditor
            mode="add"
            services={services}
            levels={levelLabels}
            coefficientPreviewer={coefficientPreviewer}
            onSave={handleAdd}
            onCancel={() => setMode(null)}
            saving={saving}
            errors={errors}
          />
        </div>
      ) : null}

      {mode === 'edit' && editingItem ? (
        <div className="border-t border-slate-100 p-4">
          <ServiceRowEditor
            mode="edit"
            item={editingItem}
            services={services}
            levels={levelLabels}
            coefficientPreviewer={coefficientPreviewer}
            onSave={handleEdit}
            onCancel={() => { setMode(null); setEditingId(null); }}
            saving={saving}
            errors={errors}
          />
        </div>
      ) : null}
    </div>
  );
}
