/**
 * SBMS Security Audit Log Viewer
 * Implements Chapter 9.3: Immutable audit trail for manager price overrides,
 * invoice cancellations, stock adjustments, and tax revisions.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { ShieldAlert, Search, Filter, Lock } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { dbVersion } = useApp();
  const logs = db.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.oldValue && log.oldValue.includes(searchTerm)) ||
      (log.newValue && log.newValue.includes(searchTerm));

    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Security & Compliance Audit Log
          </h1>
          <p className="text-xs text-slate-500">
            Immutable system event logs for price overrides, bill voids, and stock adjustments
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by user or action..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-900 focus:outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Sensitive Actions</option>
          <option value="price_override">Price / Product Changes</option>
          <option value="bill_void">Invoice Voids & Credit Notes</option>
          <option value="stock_adjustment">Stock Adjustments</option>
          <option value="tax_change">Tax Slabs & Store Profile</option>
          <option value="system_login">User Session Switches</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">User & Role</th>
                <th className="py-3 px-3 text-center">Action Category</th>
                <th className="py-3 px-3">Event Details</th>
                <th className="py-3 px-3">Previous State</th>
                <th className="py-3 px-3">Updated State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono-numbers whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] uppercase font-bold text-blue-900">
                        {log.userRole.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.action === 'bill_void'
                            ? 'bg-red-100 text-red-800'
                            : log.action === 'price_override'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">{log.details}</td>
                    <td className="py-3 px-3 font-mono-numbers text-slate-500 text-[11px]">
                      {log.oldValue || '—'}
                    </td>
                    <td className="py-3 px-3 font-mono-numbers text-slate-800 text-[11px] font-medium">
                      {log.newValue || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
