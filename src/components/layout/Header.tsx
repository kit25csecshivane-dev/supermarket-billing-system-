/**
 * Top Navigation Bar following the Top Bar Contract in frontend-design
 * Zone 1: Brand wordmark
 * Zone 2: Navigation breadcrumb / context
 * Zone 3: Quick Role Switcher, Counter Badge, and System Clock
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { INITIAL_USERS } from '../../services/database';
import { Store, UserCheck, Clock, Monitor } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, setCurrentUser, counterId, activeTab } = useApp();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
          ' ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'billing':
        return 'Billing & Point of Sale';
      case 'dashboard':
        return 'Executive Management Dashboard';
      case 'products':
        return 'Product & Barcode Catalog';
      case 'inventory':
        return 'Inventory & Stock Ledger';
      case 'stock_count':
        return 'Physical Stock Count & Variance';
      case 'purchases':
        return 'Supplier Purchases & GRN';
      case 'invoices':
        return 'Invoices & Credit Notes History';
      case 'customers':
        return 'Customer CRM & Loyalty';
      case 'reports':
        return 'GST & Financial Reports';
      case 'settings':
        return 'Store Profile & Tax Slabs';
      case 'audit_log':
        return 'Security Audit Logs';
      default:
        return 'Supermarket Management';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-white font-bold text-lg shadow-sm">
          <Store className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
            SMK Fresh
          </span>
          <span className="text-xs text-slate-500 font-medium tracking-wide">
            Supermarket POS & ERP
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Context */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400 font-normal">Supermarket</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800">{getBreadcrumbTitle()}</span>
      </div>

      {/* Zone 3: Active Counter, Role Switcher, and Indian Time */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Terminal Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
          <Monitor className="h-3.5 w-3.5 text-slate-500" />
          <span>{counterId}</span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono-numbers">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{timeStr}</span>
        </div>

        {/* Quick Demo Role Switcher */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <UserCheck className="h-4 w-4 text-slate-500" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
              Role Demo
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const target = INITIAL_USERS.find((u) => u.id === e.target.value);
                if (target) setCurrentUser(target);
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent cursor-pointer focus:outline-none border-b border-transparent hover:border-slate-300 py-0.5"
              title="Switch user demo role"
            >
              {INITIAL_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
