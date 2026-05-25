import React from 'react';

import { Button } from '@/components/ui/button';

const TemplateList = ({ items = [], loading, error, onEdit, onPreview, onToggle }) => {
  if (loading) return <div className="rounded border border-gray-200 bg-white p-10 text-center text-gray-500">Dang tai...</div>;
  if (error) return <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!items.length) return <div className="rounded border border-gray-200 bg-white p-10 text-center text-gray-500">Chua co template nao.</div>;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
          <tr>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Ten</th>
            <th className="px-3 py-2">Loai</th>
            <th className="px-3 py-2">Tieu de</th>
            <th className="px-3 py-2 text-center">Trang thai</th>
            <th className="px-3 py-2 text-right">Hanh dong</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white text-sm">
          {items.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs">{t.code}</td>
              <td className="px-3 py-2 font-medium">{t.name}</td>
              <td className="px-3 py-2 text-xs text-gray-600">{t.type}</td>
              <td className="px-3 py-2 max-w-[320px] truncate" title={t.subject}>{t.subject}</td>
              <td className="px-3 py-2 text-center">
                <span className={`inline-flex rounded border px-2 py-0.5 text-xs ${t.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-100 text-gray-600'}`}>
                  {t.is_active ? 'Bat' : 'Tat'}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onPreview?.(t)}>Preview</Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit?.(t)}>Sua</Button>
                  <Button variant="outline" size="sm" onClick={() => onToggle?.(t)}>{t.is_active ? 'Tat' : 'Bat'}</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TemplateList;
