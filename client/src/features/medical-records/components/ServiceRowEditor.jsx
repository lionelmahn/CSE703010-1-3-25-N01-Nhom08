import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { formatVnd, calcSubtotal, LEVEL_LABELS } from '../lib/format';

const FDI_RE = /^[1-4][1-8]$/;

/**
 * UC12 - Editor 1 dong dich vu (add hoac edit).
 *
 * Props:
 *  - mode: 'add' | 'edit'.
 *  - item: ExaminationServiceItem (cho mode edit) - chua snapshot fields.
 *  - services: array Service active.
 *  - levels: map { level_key => label } tu options endpoint.
 *  - coefficientPreviewer(serviceId, level): callback tra ra he so server
 *    de hien thi preview (server van la nguon su that).
 */
export default function ServiceRowEditor({
  mode,
  item,
  services = [],
  levels = LEVEL_LABELS,
  coefficientPreviewer,
  defaultCoefficient = 0,
  onSave,
  onCancel,
  saving,
  errors = {},
}) {
  const [serviceId, setServiceId] = useState(item?.service_id || '');
  const [processingLevel, setProcessingLevel] = useState(item?.processing_level || 'thong_thuong');
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [complexityReason, setComplexityReason] = useState(item?.complexity_reason || '');
  const [toothCodesRaw, setToothCodesRaw] = useState(
    Array.isArray(item?.tooth_codes) ? item.tooth_codes.join(', ') : '',
  );
  const [touched, setTouched] = useState(false);

  const selectedService = services.find((s) => String(s.id) === String(serviceId));
  const unitPrice = mode === 'edit' ? Number(item?.unit_price_snapshot || 0) : Number(selectedService?.price || 0);
  const coefficient = coefficientPreviewer?.(serviceId, processingLevel) ?? defaultCoefficient;
  const subtotal = calcSubtotal(unitPrice, quantity, coefficient);

  useEffect(() => {
    if (item) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setServiceId(item.service_id || '');
      setProcessingLevel(item.processing_level || 'thong_thuong');
      setQuantity(item.quantity || 1);
      setComplexityReason(item.complexity_reason || '');
      setToothCodesRaw(Array.isArray(item.tooth_codes) ? item.tooth_codes.join(', ') : '');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [item]);

  const toothCodes = toothCodesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const invalidToothCodes = toothCodes.filter((c) => !FDI_RE.test(c));
  const requiresReason = Number(coefficient || 0) > 0;
  const localError = (() => {
    if (mode === 'add' && !serviceId) return 'Vui lòng chọn dịch vụ.';
    if (invalidToothCodes.length) return `Mã răng FDI không hợp lệ: ${invalidToothCodes.join(', ')}`;
    if (requiresReason && !complexityReason) return 'Cần lý do khi hệ số phức tạp > 0.';
    return null;
  })();

  const submit = () => {
    setTouched(true);
    if (localError) return;
    const payload = {
      service_id: serviceId ? Number(serviceId) : undefined,
      processing_level: processingLevel,
      quantity: Number(quantity) || 1,
      complexity_reason: complexityReason || null,
      tooth_codes: toothCodes,
    };
    if (mode === 'edit') delete payload.service_id;
    onSave?.(payload);
  };

  const err = (k) => errors?.[k]?.[0];

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          {mode === 'add' ? 'Thêm dịch vụ' : `Sửa dịch vụ #${item?.id}`}
        </h3>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className={mode === 'edit' ? 'md:col-span-2' : ''}>
          <Label className="text-xs">Dịch vụ {mode === 'add' ? <span className="text-rose-500">*</span> : null}</Label>
          {mode === 'add' ? (
            <Select value={serviceId ? String(serviceId) : ''} onValueChange={(v) => setServiceId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="-- Chọn dịch vụ --" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code} · {s.name} · {formatVnd(s.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-slate-800 mt-1">
              <span className="font-mono">{item?.service_code}</span> · {item?.service_name}
              <span className="text-slate-500"> · {formatVnd(unitPrice)}</span>
            </div>
          )}
          {err('service_id') ? <p className="text-[11px] text-rose-600 mt-1">{err('service_id')}</p> : null}
        </div>

        <div>
          <Label className="text-xs">Mức độ xử lý</Label>
          <Select value={processingLevel} onValueChange={setProcessingLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(levels).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err('processing_level') ? <p className="text-[11px] text-rose-600 mt-1">{err('processing_level')}</p> : null}
        </div>

        <div>
          <Label className="text-xs">Số lần / số lượng</Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs">Mã răng FDI (cách nhau dấu phẩy)</Label>
          <Input
            value={toothCodesRaw}
            placeholder="VD: 36, 47"
            onChange={(e) => setToothCodesRaw(e.target.value)}
          />
          {invalidToothCodes.length ? (
            <p className="text-[11px] text-rose-600 mt-1">Không hợp lệ: {invalidToothCodes.join(', ')}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs">
            Lý do phức tạp {requiresReason ? <span className="text-rose-500">*</span> : null}
          </Label>
          <Textarea
            rows={2}
            value={complexityReason}
            onChange={(e) => setComplexityReason(e.target.value)}
            placeholder="Bắt buộc khi hệ số phức tạp lớn hơn 0..."
            disabled={!requiresReason && !complexityReason}
          />
          {err('complexity_reason') ? (
            <p className="text-[11px] text-rose-600 mt-1">{err('complexity_reason')}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg bg-white border border-slate-200 p-2 text-xs text-slate-700 flex justify-between">
        <div>
          Hệ số phức tạp: <b>+{Number(coefficient).toFixed(1)}</b>
          <span className="text-slate-400"> · Giá đơn vị: {formatVnd(unitPrice)} · SL: {quantity}</span>
        </div>
        <div>
          Tạm tính: <b className="text-blue-700">{formatVnd(subtotal)}</b>
        </div>
      </div>

      {(touched && localError) ? <p className="text-[11px] text-rose-600">{localError}</p> : null}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Hủy</Button>
        <Button size="sm" onClick={submit} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Đang lưu...' : 'Lưu dịch vụ'}
        </Button>
      </div>
    </div>
  );
}
