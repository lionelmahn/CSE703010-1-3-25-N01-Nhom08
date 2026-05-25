import React from 'react';

import { STATUS_TAB_LABEL, STATUS_TAB_ORDER } from '../constants';

/**
 * UC10 - Tabs lo theo status. Mac dinh focus "Tat ca", nhung "That bai"
 * va "Cho gui" duoc lam noi bat de le tan xu ly ngay (theo yeu cau).
 */
const NotificationStatusTabs = ({ value = 'all', counts = {}, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
      {STATUS_TAB_ORDER.map((key) => {
        const active = value === key;
        const count = key === 'all'
          ? Object.values(counts).reduce((s, n) => s + (Number(n) || 0), 0)
          : Number(counts[key] || 0);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {STATUS_TAB_LABEL[key] || key}
            <span className={`ml-1.5 text-[11px] ${active ? 'text-blue-100' : 'text-gray-500'}`}>({count})</span>
          </button>
        );
      })}
    </div>
  );
};

export default NotificationStatusTabs;
