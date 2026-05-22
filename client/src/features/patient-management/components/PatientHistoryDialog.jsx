import React from 'react';
import { Loader2, X } from 'lucide-react';

import { ACTION_LABELS, HISTORY_TABS } from '../constants';
import { formatDateTime } from '../utils';

/**
 * UC5 - Dialog hien thi lich su thay doi & truy cap cua mot ho so.
 *
 * Mockup HTML co 2 tab "Lich su thay doi" / "Lich su truy cap".
 * Backend hien chua tach 2 luong - dung 1 timeline va tab "Truy cap" loc theo action.
 */
const PatientHistoryDialog = ({ open, history = [], loading = false, onClose }) => {
  const [tab, setTab] = React.useState(HISTORY_TABS.CHANGES);
  if (!open) return null;

  const items = history.filter((h) =>
    tab === HISTORY_TABS.ACCESS ? h.action === 'viewed' : h.action !== 'viewed',
  );

  const describe = (item) => {
    if (item.note) return item.note;
    if (item.before && item.after) {
      const diff = Object.keys(item.after).map((k) => `${k}`).join(', ');
      return diff ? `Thay đổi: ${diff}` : ACTION_LABELS[item.action] || item.action;
    }
    return ACTION_LABELS[item.action] || item.action || '—';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white border rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-center border-b">
          <h2 className="font-semibold text-gray-800 text-sm">Lịch sử thay đổi & truy cập</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b text-xs px-2 bg-white">
          <button
            type="button"
            onClick={() => setTab(HISTORY_TABS.CHANGES)}
            className={`px-3 py-2 border-b-2 ${tab === HISTORY_TABS.CHANGES ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Lịch sử thay đổi
          </button>
          <button
            type="button"
            onClick={() => setTab(HISTORY_TABS.ACCESS)}
            className={`px-3 py-2 border-b-2 ${tab === HISTORY_TABS.ACCESS ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Lịch sử truy cập
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-gray-500 text-xs">
              <Loader2 size={14} className="animate-spin" /> Đang tải...
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-xs">Chưa có dữ liệu.</div>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead className="bg-gray-50 border-b text-gray-500 sticky top-0">
                <tr>
                  <th className="p-2 font-medium">Thời gian</th>
                  <th className="p-2 font-medium">Người thao tác</th>
                  <th className="p-2 font-medium">Hành động</th>
                  <th className="p-2 font-medium">Nội dung</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 align-top">
                    <td className="p-2 text-gray-500 whitespace-nowrap">{formatDateTime(item.at)}</td>
                    <td className="p-2 whitespace-nowrap">{item.actor_name || 'Hệ thống'}</td>
                    <td className="p-2 whitespace-nowrap">{ACTION_LABELS[item.action] || item.action}</td>
                    <td className="p-2 leading-tight">{describe(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-2.5 border-t flex justify-end bg-gray-50 text-xs">
          <button type="button" onClick={onClose} className="px-6 py-1.5 border rounded bg-white hover:bg-gray-100 font-medium">Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryDialog;
