import React, { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { notificationTemplateApi } from '@/api/notificationTemplateApi';

const TemplateEditDialog = ({ open, template, onClose, onSaved }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body_html: '',
    body_text: '',
    required_vars: '',
    is_active: true,
  });

  useEffect(() => {
    if (open && template) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: template.name || '',
        subject: template.subject || '',
        body_html: template.body_html || '',
        body_text: template.body_text || '',
        required_vars: Array.isArray(template.required_vars)
          ? template.required_vars.join(', ')
          : (template.required_vars || ''),
        is_active: !!template.is_active,
      });
    }
  }, [open, template]);

  if (!template) return null;

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const required = form.required_vars
        ? form.required_vars.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await notificationTemplateApi.update(template.id, {
        name: form.name,
        subject: form.subject,
        body_html: form.body_html,
        body_text: form.body_text || null,
        required_vars: required,
        is_active: form.is_active,
      });
      toast({ title: 'Da luu template' });
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Loi',
        description: err?.response?.data?.message || err?.message || 'Khong the luu template.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sua template: {template.code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Ten</Label>
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </div>
          <div>
            <Label>Tieu de</Label>
            <Input value={form.subject} onChange={(e) => setField('subject', e.target.value)} />
          </div>
          <div>
            <Label>Bien bat buoc (phay phan tach)</Label>
            <Input
              value={form.required_vars}
              onChange={(e) => setField('required_vars', e.target.value)}
              placeholder="VD: clinic_name, request_code"
            />
          </div>
          <div>
            <Label>Body HTML</Label>
            <Textarea
              rows={10}
              value={form.body_html}
              onChange={(e) => setField('body_html', e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <Label>Body Text (tuy chon)</Label>
            <Textarea
              rows={6}
              value={form.body_text}
              onChange={(e) => setField('body_text', e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setField('is_active', e.target.checked)}
            />
            Bat su dung template
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose?.()} disabled={submitting}>Huy</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Dang luu...' : 'Luu'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateEditDialog;
