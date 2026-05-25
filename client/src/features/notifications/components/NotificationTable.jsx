import React from 'react';

import NotificationStatusBadge from './NotificationStatusBadge';
import NotificationTypeBadge from './NotificationTypeBadge';
import { CHANNEL_LABEL, SOURCE_LABEL } from '../constants';

const formatDateTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return iso;
  }
};

const NotificationTable = ({ items = [], loading, error, onSelect, selectedId }) => {
  if (loading) {
    return <div className="rounded border border-gray-200 bg-white p-10 text-center text-gray-500">Dang tai...</div>;
  }
  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }
  if (!items.length) {
    return <div className="rounded border border-gray-200 bg-white p-10 text-center text-gray-500">Chua co thong bao nao.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-600">
          <tr>
            <th className="px-3 py-2">Ma</th>
            <th className="px-3 py-2">Loai</th>
            <th className="px-3 py-2">Trang thai</th>
            <th className="px-3 py-2">Kenh</th>
            <th className="px-3 py-2">Nguoi nhan</th>
            <th className="px-3 py-2">Tieu de</th>
            <th className="px-3 py-2">Nguon</th>
            <th className="px-3 py-2">Lap lich</th>
            <th className="px-3 py-2">Gui luc</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white text-sm">
          {items.map((n) => {
            const active = n.id === selectedId;
            return (
              <tr
                key={n.id}
                onClick={() => onSelect?.(n.id)}
                className={`cursor-pointer transition ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{n.code}</td>
                <td className="px-3 py-2"><NotificationTypeBadge type={n.type} /></td>
                <td className="px-3 py-2"><NotificationStatusBadge status={n.status} /></td>
                <td className="px-3 py-2 text-gray-700">{CHANNEL_LABEL[n.channel] || n.channel}</td>
                <td className="px-3 py-2 text-gray-700">
                  <div className="font-medium">{n.recipient_name || '-'}</div>
                  <div className="text-xs text-gray-500">{n.recipient_email || '-'}</div>
                </td>
                <td className="px-3 py-2 max-w-[280px] truncate text-gray-700" title={n.subject}>{n.subject || '-'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{SOURCE_LABEL[n.source] || n.source}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{formatDateTime(n.scheduled_send_at)}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{formatDateTime(n.sent_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default NotificationTable;
