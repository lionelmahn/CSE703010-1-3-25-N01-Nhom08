import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SIDEBAR_ITEMS_BY_PATH } from '@/config/sidebarItems';

/**
 * Lightweight breadcrumb derived from the current pathname + the sidebar
 * config. We deliberately stop at depth 2 — the project does not have
 * deep route hierarchies and a tall breadcrumb would only add noise.
 */
const Breadcrumb = () => {
  const { pathname } = useLocation();
  const current = SIDEBAR_ITEMS_BY_PATH[pathname];

  if (!current) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
      <Link to="/dashboard" className="transition-colors hover:text-teal-600">
        Tổng quan
      </Link>
      {pathname !== '/dashboard' && (
        <>
          <ChevronRight size={14} aria-hidden="true" className="text-slate-300" />
          <span className="font-medium text-slate-700">{current.label}</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;
