import React from 'react';
import { Badge } from '@/components/ui/badge';
import { invoiceStatusLabel, invoiceStatusToneClass } from '../lib/format';

/**
 * UC13 - Hien thi trang thai hoa don bang badge mau.
 */
export default function InvoiceStatusBadge({ status, className = '' }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${invoiceStatusToneClass(status)} ${className}`}
    >
      {invoiceStatusLabel(status)}
    </Badge>
  );
}
