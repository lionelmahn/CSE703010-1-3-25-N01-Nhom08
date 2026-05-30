import React from 'react';
import SidebarItem from './SidebarItem';

/**
 * Renders one section of the sidebar: a small section title (hidden when
 * the sidebar is collapsed) and the list of items belonging to the group.
 */
const SidebarGroup = ({ group, collapsed = false, badgeValues = {}, onNavigate }) => {
  if (!group.items?.length) return null;

  return (
    <div className="space-y-1">
      {!collapsed ? (
        <p className="truncate px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {group.label}
        </p>
      ) : (
        <div className="mx-3 my-2 border-t border-slate-800" aria-hidden="true" />
      )}

      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            badgeCount={item.badge ? badgeValues[item.badge] || 0 : 0}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};

export default SidebarGroup;
