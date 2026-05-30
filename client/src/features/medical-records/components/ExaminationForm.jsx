import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * UC12 - Form 4 buoc theo Main Flow:
 *  - Tab 1 Lý do: chief_complaint, symptoms.
 *  - Tab 2 Lâm sàng: clinical_findings, vitals (placeholder).
 *  - Tab 3 Chẩn đoán: diagnosis, clinical_notes.
 *  - Tab 4 Kết luận: treatment_outcome, conclusion, recall.
 *
 * Bao gom `recall_date` + `recall_note` o tab 4 vi day la action A2 cua plan
 * (tai sao DR -> set xong recall thi se save thanh field record).
 */

const SectionLabel = ({ children, required }) => (
  <Label className="text-xs font-semibold text-slate-700 mb-1 block">
    {children}
    {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
  </Label>
);

function Field({ label, required, children, hint, error }) {
  return (
    <div className="space-y-1">
      <SectionLabel required={required}>{label}</SectionLabel>
      {children}
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
      {error ? <p className="text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function ExaminationForm({
  values,
  onChange,
  disabled,
  errors = {},
}) {
  const v = values || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <Tabs defaultValue="reason" className="w-full">
      <TabsList className="bg-slate-100 p-1 rounded-xl">
        <TabsTrigger value="reason" className="text-xs data-[state=active]:bg-white">1. Lý do</TabsTrigger>
        <TabsTrigger value="clinical" className="text-xs data-[state=active]:bg-white">2. Lâm sàng</TabsTrigger>
        <TabsTrigger value="diagnosis" className="text-xs data-[state=active]:bg-white">3. Chẩn đoán</TabsTrigger>
        <TabsTrigger value="outcome" className="text-xs data-[state=active]:bg-white">4. Kết luận</TabsTrigger>
      </TabsList>

      <TabsContent value="reason" className="space-y-3 mt-4">
        <Field label="Lý do đến khám" required error={errors.chief_complaint}>
          <Textarea
            rows={3}
            disabled={disabled}
            value={v.chief_complaint || ''}
            onChange={set('chief_complaint')}
            placeholder="VD: Đau răng hàm dưới khi nhai..."
          />
        </Field>
        <Field label="Triệu chứng" error={errors.symptoms}>
          <Textarea
            rows={3}
            disabled={disabled}
            value={v.symptoms || ''}
            onChange={set('symptoms')}
            placeholder="Triệu chứng kèm theo, thời gian xuất hiện..."
          />
        </Field>
      </TabsContent>

      <TabsContent value="clinical" className="space-y-3 mt-4">
        <Field label="Khám lâm sàng" error={errors.clinical_findings}>
          <Textarea
            rows={5}
            disabled={disabled}
            value={v.clinical_findings || ''}
            onChange={set('clinical_findings')}
            placeholder="Răng sâu, mảng bám, nha chu, sưng nề, đau khi gõ..."
          />
        </Field>
      </TabsContent>

      <TabsContent value="diagnosis" className="space-y-3 mt-4">
        <Field label="Chẩn đoán" required error={errors.diagnosis}>
          <Textarea
            rows={4}
            disabled={disabled}
            value={v.diagnosis || ''}
            onChange={set('diagnosis')}
            placeholder="VD: Sâu răng #36 ngà sâu..."
          />
        </Field>
        <Field label="Ghi chú lâm sàng" error={errors.clinical_notes}>
          <Textarea
            rows={3}
            disabled={disabled}
            value={v.clinical_notes || ''}
            onChange={set('clinical_notes')}
            placeholder="Ghi chú thêm cho hồ sơ..."
          />
        </Field>
      </TabsContent>

      <TabsContent value="outcome" className="space-y-3 mt-4">
        <Field label="Kết quả điều trị (lượt khám này)" error={errors.treatment_outcome}>
          <Textarea
            rows={3}
            disabled={disabled}
            value={v.treatment_outcome || ''}
            onChange={set('treatment_outcome')}
            placeholder="Kết quả thực hiện hôm nay..."
          />
        </Field>
        <Field label="Kết luận" required error={errors.conclusion}>
          <Textarea
            rows={3}
            disabled={disabled}
            value={v.conclusion || ''}
            onChange={set('conclusion')}
            placeholder="Tổng kết tình trạng, hướng điều trị tiếp theo..."
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ngày đề xuất tái khám" error={errors.recall_date}>
            <Input
              type="date"
              disabled={disabled}
              value={v.recall_date ? String(v.recall_date).slice(0, 10) : ''}
              onChange={set('recall_date')}
            />
          </Field>
          <Field label="Ghi chú tái khám" error={errors.recall_note}>
            <Input
              type="text"
              disabled={disabled}
              value={v.recall_note || ''}
              onChange={set('recall_note')}
              placeholder="VD: Tái khám đánh giá sau trám"
            />
          </Field>
        </div>
      </TabsContent>
    </Tabs>
  );
}
