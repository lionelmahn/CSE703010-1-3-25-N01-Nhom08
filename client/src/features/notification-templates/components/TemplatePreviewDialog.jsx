import React, { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { notificationTemplateApi } from '@/api/notificationTemplateApi';

import NotificationContentPreview from '@/features/notifications/components/NotificationContentPreview';

const TemplatePreviewDialog = ({ open, template, onClose }) => {
  const { toast } = useToast();
  const [varsJson, setVarsJson] = useState('{}');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && template) {
      const sample = {};
      (template.required_vars || []).forEach((v) => { sample[v] = `<${v}>`; });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVarsJson(JSON.stringify(sample, null, 2));
      setResult(null);
    }
  }, [open, template]);

  if (!template) return null;

  const run = async () => {
    let vars = {};
    try {
      vars = varsJson ? JSON.parse(varsJson) : {};
    } catch {
      toast({ variant: 'destructive', title: 'Loi', description: 'JSON khong hop le.' });
      return;
    }
    setLoading(true);
    try {
      const res = await notificationTemplateApi.preview(template.id, { vars });
      setResult(res?.data || res);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Loi',
        description: err?.response?.data?.message || err?.message || 'Khong the preview template.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview template: {template.code}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>Bien JSON</Label>
            <Textarea
              rows={12}
              value={varsJson}
              onChange={(e) => setVarsJson(e.target.value)}
              className="font-mono text-xs"
            />
            <Button onClick={run} disabled={loading} className="mt-2">
              {loading ? 'Dang render...' : 'Render preview'}
            </Button>
          </div>
          <div>
            {result ? (
              <NotificationContentPreview
                subject={result.subject}
                html={result.body_html}
                text={result.body_text}
              />
            ) : (
              <div className="rounded border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                Nhan "Render preview" de xem.
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose?.()}>Dong</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewDialog;
