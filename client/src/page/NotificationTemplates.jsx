import React, { useState } from 'react';
import { Mail, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { notificationTemplateApi } from '@/api/notificationTemplateApi';

import { useNotificationTemplates } from '@/features/notification-templates/hooks/useNotificationTemplates';
import TemplateList from '@/features/notification-templates/components/TemplateList';
import TemplateEditDialog from '@/features/notification-templates/components/TemplateEditDialog';
import TemplatePreviewDialog from '@/features/notification-templates/components/TemplatePreviewDialog';

/**
 * UC10 - Trang quan ly mau email (admin only).
 *
 * Permission: notification_templates.view de xem, notification_templates.update de sua.
 */
const NotificationTemplatesPage = () => {
  const { toast } = useToast();
  const { items, loading, error, filters, setFilters, refresh } = useNotificationTemplates();
  const [editTpl, setEditTpl] = useState(null);
  const [previewTpl, setPreviewTpl] = useState(null);

  const handleToggle = async (t) => {
    try {
      await notificationTemplateApi.toggle(t.id, { is_active: !t.is_active });
      toast({ title: t.is_active ? 'Da tat template' : 'Da bat template' });
      refresh();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Loi',
        description: err?.response?.data?.message || err?.message || 'Khong the doi trang thai.',
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Mail className="size-5 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900">Mau email he thong (UC10)</h1>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="w-72">
          <label className="mb-1 block text-xs font-medium text-gray-600">Tim kiem</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={filters.q || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Code, ten, tieu de..."
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-gray-600">Trang thai</label>
          <Select
            value={filters.is_active || 'all'}
            onValueChange={(v) => setFilters((prev) => ({ ...prev, is_active: v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca</SelectItem>
              <SelectItem value="active">Dang bat</SelectItem>
              <SelectItem value="inactive">Da tat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={refresh} className="ml-auto" type="button">Lam moi</Button>
      </div>

      <TemplateList
        items={items}
        loading={loading}
        error={error}
        onEdit={(t) => setEditTpl(t)}
        onPreview={(t) => setPreviewTpl(t)}
        onToggle={handleToggle}
      />

      <TemplateEditDialog
        open={!!editTpl}
        template={editTpl}
        onClose={() => setEditTpl(null)}
        onSaved={refresh}
      />
      <TemplatePreviewDialog
        open={!!previewTpl}
        template={previewTpl}
        onClose={() => setPreviewTpl(null)}
      />
    </div>
  );
};

export default NotificationTemplatesPage;
