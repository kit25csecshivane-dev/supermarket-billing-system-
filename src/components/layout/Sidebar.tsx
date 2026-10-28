/**
 * SBMS Sidebar Navigation
 * Enforces role-based visibility and navigation according to Table 2.1 of SBMS report.
 */

import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  Layers,
  ClipboardCheck,
  Truck,
  Receipt,
  Users,
  BarChart3,
  Settings,
  ShieldAlert,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, heldBillsCount } = useApp();

  const navItems: NavItem[] = [
    {
      id: 'billing',
      label: 'Billing / POS',
      icon: ShoppingCart,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'accountant'],
    },
    {
      id: 'products',
      label: 'Products & Barcode',
      icon: Package,
      roles: ['admin', 'manager', 'store_keeper'],
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Layers,
      roles: ['admin', 'manager', 'store_keeper'],
    },
    {
      id: 'stock_count',
      label: 'Stock Count & Diff',
      icon: ClipboardCheck,
      roles: ['admin', 'manager', 'store_keeper'],
    },
    {
      id: 'purchases',
      label: 'Purchases & GRN',
      icon: Truck,
      roles: ['admin', 'manager', 'store_keeper'],
    },
    {
      id: 'invoices',
      label: 'Invoices & Returns',
      icon: Receipt,
      roles: ['admin', 'manager', 'cashier', 'accountant'],
    },
    {
      id: 'customers',
      label: 'Customers & Loyalty',
      icon: Users,
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      id: 'reports',
      label: 'GST & Sales Reports',
      icon: BarChart3,
      roles: ['admin', 'manager', 'accountant'],
    },
    {
      id: 'settings',
      label: 'Store Settings',
      icon: Settings,
      roles: ['admin'],
    },
    {
      id: 'audit_log',
      label: 'Security & Audit',
      icon: ShieldAlert,
      roles: ['admin', 'manager'],
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Modules
        </div>
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.id === 'billing' && heldBillsCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono-numbers ${
                      isActive
                        ? 'bg-amber-400 text-slate-900 font-bold'
                        : 'bg-amber-100 text-amber-800 font-semibold'
                    }`}
                    title={`${heldBillsCount} held bills waiting`}
                  >
                    {heldBillsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Status Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-sm">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {currentUser.name}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
