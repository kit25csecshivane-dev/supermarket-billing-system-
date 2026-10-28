/**
 * Store Profile & Tax Configuration Settings
 * Editable store information, GSTIN, FSSAI, receipt customization, and user PINs
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreSettings } from '../../types';
import { INITIAL_USERS } from '../../services/database';
import { Settings, Save, Shield, Store, Receipt, Users, Check } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const { settings, updateStoreSettings, currentUser } = useApp();
  const [form, setForm] = useState<StoreSettings>({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(form);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Store Profile & Tax Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Configure Indian supermarket metadata, GST compliance, and receipt layout
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Section 1: Store & Entity Information */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Store className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-bold text-slate-900">Supermarket Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store Legal Name</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Branch Name</label>
              <input
                type="text"
                value={form.branchName}
                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Address Line 1</label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Area / City / Pincode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                  placeholder="Pincode"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">State & State Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
                <input
                  type="text"
                  value={form.stateCode}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                  className="w-14 px-2 py-2 border border-slate-300 rounded font-mono-numbers text-center"
                  title="State Code (e.g. 33)"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Official GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers font-bold"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">FSSAI License #</label>
              <input
                type="text"
                value={form.fssaiNumber}
                onChange={(e) => setForm({ ...form, fssaiNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Receipt Customization */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Receipt className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-bold text-slate-900">Thermal Receipt Layout (80mm)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Receipt Footer Message
              </label>
              <textarea
                value={form.receiptFooterMessage}
                onChange={(e) => setForm({ ...form, receiptFooterMessage: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Return Policy Window (Days)
              </label>
              <input
                type="number"
                min="0"
                value={form.returnPolicyDays}
                onChange={(e) =>
                  setForm({ ...form, returnPolicyDays: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Printed on thermal slips: "Returns within X days with bill"
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Configurable GST Rate Slabs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-900" />
              <h2 className="text-sm font-bold text-slate-900">
                GST Rate Slabs (GST Council 2025/2026)
              </h2>
            </div>
            <span className="text-xs text-slate-500">Editable tax policy rates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-800 text-sm block">0% (Nil Rate)</span>
              <span className="text-[11px] text-slate-500">Fresh vegetables, unbranded grains</span>
            </div>
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="font-bold text-emerald-800 text-sm block">5% Rate</span>
              <span className="text-[11px] text-slate-500">
                Packaged staples, edible oil, soaps, tea
              </span>
            </div>
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
              <span className="font-bold text-blue-900 text-sm block">18% Standard</span>
              <span className="text-[11px] text-slate-500">Electricals, appliances, processed foods</span>
            </div>
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50">
              <span className="font-bold text-purple-900 text-sm block">40% Special</span>
              <span className="text-[11px] text-slate-500">Aerated beverages & luxury items</span>
            </div>
          </div>
        </div>

        {/* Section 4: Demo Role Credentials */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Users className="h-4 w-4 text-blue-900" />
            <h2 className="text-sm font-bold text-slate-900">
              User Accounts & Role Permissions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Demo User</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Override PIN</th>
                  <th className="py-2.5 px-3">Access Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_USERS.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 font-bold uppercase text-[10px] text-blue-900">
                      {u.role.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3 font-mono-numbers text-slate-600">{u.username}</td>
                    <td className="py-2.5 px-3 font-mono-numbers text-slate-800">{u.pin}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {u.role === 'admin'
                        ? 'Full System & Settings'
                        : u.role === 'manager'
                        ? 'Products, Overrides & Reports'
                        : u.role === 'cashier'
                        ? 'Billing POS Terminal'
                        : u.role === 'store_keeper'
                        ? 'Inventory, Stock & GRN'
                        : 'GST Reports & Reconciliation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs shadow-xs"
          >
            <Save className="h-4 w-4" />
            <span>Save Store Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
