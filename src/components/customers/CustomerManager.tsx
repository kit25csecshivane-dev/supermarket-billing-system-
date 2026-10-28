/**
 * SBMS Customer CRM & Loyalty Management Module
 * Implements Chapter 14: Customer loyalty accounts, points accrual,
 * B2B customer GSTIN profiles, and customer purchase ledger.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Customer } from '../../types';
import { Users, Plus, Search, Award, ShoppingBag, X } from 'lucide-react';

export const CustomerManager: React.FC = () => {
  const { showNotification, triggerDbRefresh, dbVersion } = useApp();
  const customers = db.getCustomers();
  const invoices = db.getInvoices();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewCustOpen, setIsNewCustOpen] = useState<boolean>(false);
  const [selectedCustHistory, setSelectedCustHistory] = useState<Customer | null>(null);

  const [newCustomerData, setNewCustomerData] = useState<Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent' | 'createdAt'>>({
    name: '',
    mobile: '',
    email: '',
    companyName: '',
    gstin: '',
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerData.name.trim() || !newCustomerData.mobile.trim()) {
      showNotification('Customer name and mobile number are required', 'error');
      return;
    }

    const newCust: Customer = {
      id: `CUST${String(customers.length + 1).padStart(3, '0')}`,
      name: newCustomerData.name.trim(),
      mobile: newCustomerData.mobile.trim(),
      email: newCustomerData.email?.trim() || undefined,
      companyName: newCustomerData.companyName?.trim() || undefined,
      gstin: newCustomerData.gstin?.trim().toUpperCase() || undefined,
      loyaltyPoints: 50, // Welcome bonus points!
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveCustomer(newCust);
    triggerDbRefresh();
    setIsNewCustOpen(false);
    setNewCustomerData({
      name: '',
      mobile: '',
      email: '',
      companyName: '',
      gstin: '',
    });
    showNotification(`Customer ${newCust.name} registered with 50 bonus loyalty points!`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer CRM & Loyalty Program
          </h1>
          <p className="text-xs text-slate-500">
            Registered customer accounts, points accrual (1 point/₹100), and B2B GSTIN profiles
          </p>
        </div>

        <button
          onClick={() => setIsNewCustOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, or GSTIN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Mobile Number</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3 text-center">Loyalty Points</th>
                <th className="py-3 px-3 text-right">Lifetime Spend</th>
                <th className="py-3 px-3">B2B Profile / GSTIN</th>
                <th className="py-3 px-3 text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {c.name}
                    {c.companyName && (
                      <span className="text-[10px] text-slate-500 block font-normal">
                        {c.companyName}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono-numbers text-slate-700">{c.mobile}</td>
                  <td className="py-3 px-3 text-slate-600">{c.email || '—'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold font-mono-numbers text-xs">
                      {c.loyaltyPoints} pts
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                    ₹{c.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 font-mono-numbers text-slate-700">
                    {c.gstin ? (
                      <span className="text-blue-900 font-semibold">{c.gstin}</span>
                    ) : (
                      <span className="text-slate-400">Retail Consumer</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedCustHistory(c)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-50 rounded border border-blue-200"
                    >
                      View Purchases
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW CUSTOMER MODAL */}
      {isNewCustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Register Customer</h3>
              <button
                onClick={() => setIsNewCustOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, name: e.target.value })
                  }
                  placeholder="e.g. Meenakshi Sundaram"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">10-Digit Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newCustomerData.mobile}
                  onChange={(e) =>
                    setNewCustomerData({
                      ...newCustomerData,
                      mobile: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  B2B Tax Profile (Optional)
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCustomerData.companyName}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        companyName: e.target.value,
                      })
                    }
                    placeholder="Company / Firm Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    maxLength={15}
                    value={newCustomerData.gstin}
                    onChange={(e) =>
                      setNewCustomerData({
                        ...newCustomerData,
                        gstin: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Buyer GSTIN (e.g. 33AAACR1234F1Z8)"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewCustOpen(false)}
                  className="px-4 py-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 rounded hover:bg-blue-800"
                >
                  Save & Award Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PURCHASE HISTORY MODAL */}
      {selectedCustHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCustHistory.name} - Purchase Ledger
                </h3>
                <span className="text-xs text-slate-500 font-mono-numbers">
                  Mobile: {selectedCustHistory.mobile} · Loyalty Points: {selectedCustHistory.loyaltyPoints}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustHistory(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {invoices
                .filter((inv) => inv.customerId === selectedCustHistory.id)
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 font-mono-numbers">
                        {inv.invoiceNo}
                      </div>
                      <div className="text-slate-500 font-mono-numbers">
                        {new Date(inv.dateTime).toLocaleString('en-IN')} · {inv.itemCount} items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900 font-mono-numbers text-sm">
                        ₹{inv.netPayable.toFixed(2)}
                      </div>
                      <div className="text-slate-500 uppercase text-[10px]">
                        {inv.payments.map((p) => p.mode).join(' + ')}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedCustHistory(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
