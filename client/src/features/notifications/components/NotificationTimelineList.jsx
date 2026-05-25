import React from 'react';

import { EVENT_LABEL } from '../constants';

const formatDateTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return iso;
  }
};

const NotificationTimelineList = ({ events = [] }) => {
  if (!events.length) {
    return <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">Chua co su kien nao.</div>;
  }
  return (
    <ol className="space-y-2 text-sm">
      {events.map((e) => (
        <li key={e.id} className="rounded border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-800">{EVENT_LABEL[e.event] || e.event}</span>
            <span className="text-xs text-gray-500">{formatDateTime(e.created_at)}</span>
          </div>
          {(e.actor_name || e.actor_id) && (
            <div className="mt-1 text-xs text-gray-600">Boi: {e.actor_name || `User #${e.actor_id}`}</div>
          )}
          {e.error_message && (
            <div className="mt-1 text-xs text-red-600">Loi: {e.error_message}</div>
          )}
        </li>
      ))}
    </ol>
  );
};

export default NotificationTimelineList;
