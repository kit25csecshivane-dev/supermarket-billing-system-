/**
 * Supermarket Billing and Management System (SBMS)
 * Main Application Shell with Context, Navigation, and Role Protection
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BillingTerminal } from './components/billing/BillingTerminal';
import { Dashboard } from './components/dashboard/Dashboard';
import { ProductList } from './components/products/ProductList';
import { InventoryManager } from './components/inventory/InventoryManager';
import { PhysicalStockCount } from './components/inventory/PhysicalStockCount';
import { PurchaseManager } from './components/purchases/PurchaseManager';
import { InvoiceHistory } from './components/invoices/InvoiceHistory';
import { CustomerManager } from './components/customers/CustomerManager';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { SettingsManager } from './components/settings/SettingsManager';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, notification } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'billing':
        return <BillingTerminal />;
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductList />;
      case 'inventory':
        return <InventoryManager />;
      case 'stock_count':
        return <PhysicalStockCount />;
      case 'purchases':
        return <PurchaseManager />;
      case 'invoices':
        return <InvoiceHistory />;
      case 'customers':
        return <CustomerManager />;
      case 'reports':
        return <ReportsDashboard />;
      case 'settings':
        return <SettingsManager />;
      case 'audit_log':
        return <AuditLogViewer />;
      default:
        return <BillingTerminal />;
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">{renderActiveView()}</main>
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-xs transition-all max-w-md bg-white border-slate-200">
          {notification.type === 'success' && (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          {notification.type === 'warning' && (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          )}
          {notification.type === 'error' && (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          {notification.type === 'info' && (
            <Info className="h-5 w-5 text-blue-900 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-800 leading-snug">
            {notification.message}
          </span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
