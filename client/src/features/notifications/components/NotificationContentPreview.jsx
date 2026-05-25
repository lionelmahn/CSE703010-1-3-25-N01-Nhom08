import React from 'react';

/**
 * UC10 - Preview noi dung HTML/text trong iframe sandbox de tranh XSS.
 */
const NotificationContentPreview = ({ subject, html, text }) => {
  const safeHtml = typeof html === 'string' ? html : '';
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tieu de</div>
        <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">{subject || '-'}</div>
      </div>
      {safeHtml && (
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Noi dung HTML</div>
          <iframe
            title="Notification HTML preview"
            sandbox=""
            srcDoc={safeHtml}
            className="h-64 w-full rounded border border-gray-200 bg-white"
          />
        </div>
      )}
      {text && (
        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Noi dung text</div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-xs">{text}</pre>
        </div>
      )}
    </div>
  );
};

export default NotificationContentPreview;
