/**
 * SBMS Invoices & Returns History Module
 * Implements Chapter 4.5 & 9: Complete sales ledger, duplicate reprint marking,
 * Credit Note returns, and void transaction audit trail.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Invoice } from '../../types';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Eye,
  AlertCircle,
  X,
  Lock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const InvoiceHistory: React.FC = () => {
  const {
    currentUser,
    setReceiptToPrint,
    setIsDuplicatePrint,
    setShowReceiptModal,
    showNotification,
    triggerDbRefresh,
    dbVersion,
  } = useApp();

  const invoices = db.getInvoices();

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'cancelled'>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [voidInvoiceTarget, setVoidInvoiceTarget] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Customer returned goods');
  const [managerPin, setManagerPin] = useState<string>('');

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.customerMobile && inv.customerMobile.includes(searchTerm));

      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

      const matchPayment =
        paymentModeFilter === 'all' ||
        inv.payments.some((p) => p.mode === paymentModeFilter);

      return matchSearch && matchStatus && matchPayment;
    });
  }, [invoices, searchTerm, statusFilter, paymentModeFilter, dbVersion]);

  // Handle Void / Return submission
  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidInvoiceTarget) return;

    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      if (managerPin !== '1234') {
        showNotification('Invalid Manager Override PIN (Demo PIN: 1234)', 'error');
        return;
      }
    }

    const ok = db.voidInvoice(voidInvoiceTarget.id, voidReason, currentUser);
    if (ok) {
      triggerDbRefresh();
      setVoidInvoiceTarget(null);
      setManagerPin('');
      showNotification(
        `Invoice ${voidInvoiceTarget.invoiceNo} voided. Stock returned to ledger.`,
        'success'
      );
    } else {
      showNotification('Failed to void invoice', 'error');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Invoices & Credit Notes History
          </h1>
          <p className="text-xs text-slate-500">
            GST invoice series (continuous numbers), thermal reprinting, and returns
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, cashier, customer..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid & Issued</option>
            <option value="cancelled">Voided / Returned</option>
          </select>

          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash Only</option>
            <option value="card">Card Terminal</option>
            <option value="upi">UPI Digital</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Gross</th>
                <th className="py-3 px-3 text-right">GST Total</th>
                <th className="py-3 px-3 text-right">Net Payable</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const isVoid = inv.status === 'cancelled';
                return (
                  <tr
                    key={inv.id}
                    className={`transition-colors ${
                      isVoid ? 'bg-red-50/40 text-slate-400' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono-numbers font-bold text-slate-900">
                      {inv.invoiceNo}
                      {inv.isB2B && (
                        <span className="ml-1 text-[9px] font-bold bg-blue-100 text-blue-800 px-1 py-0.2 rounded">
                          B2B
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono-numbers text-slate-600">
                      {new Date(inv.dateTime).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      {new Date(inv.dateTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{inv.cashierName}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {inv.customerName || <span className="text-slate-400">Walk-in</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers">{inv.itemCount}</td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      ₹{inv.grossAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                      ₹{(inv.cgstAmount + inv.sgstAmount + inv.igstAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      ₹{inv.netPayable.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {inv.payments.map((p) => p.mode).join(' + ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isVoid
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1 text-slate-500 hover:text-blue-900 rounded hover:bg-slate-100"
                          title="View Invoice Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setReceiptToPrint(inv);
                            setIsDuplicatePrint(true);
                            setShowReceiptModal(true);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-900 rounded hover:bg-slate-100"
                          title="Reprint Duplicate Thermal Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {!isVoid && (
                          <button
                            onClick={() => setVoidInvoiceTarget(inv)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                            title="Process Return / Void Bill"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tax Invoice {selectedInvoice.invoiceNo}
                </h3>
                <span className="text-xs text-slate-500 font-mono-numbers">
                  {new Date(selectedInvoice.dateTime).toLocaleString('en-IN')} · Cashier:{' '}
                  {selectedInvoice.cashierName}
                </span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Lines Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Net</th>
                      <th className="p-2 text-center">GST %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-slate-900">{l.productName}</td>
                        <td className="p-2 text-center font-mono-numbers">
                          {l.quantity} {l.unit}
                        </td>
                        <td className="p-2 text-right font-mono-numbers">₹{l.rate.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono-numbers font-bold">
                          ₹{l.netAmount.toFixed(2)}
                        </td>
                        <td className="p-2 text-center font-mono-numbers">{l.gstRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GST Slab Summary */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                  GST Rate Slab Analysis
                </div>
                {selectedInvoice.gstSummary.map((slab) => (
                  <div key={slab.gstRate} className="flex justify-between text-slate-600 text-[11px]">
                    <span>
                      {slab.gstRate}% Slab (Net ₹{slab.netAmount.toFixed(2)})
                    </span>
                    <span className="font-mono-numbers">
                      Taxable: ₹{slab.taxableValue.toFixed(2)} | CGST: ₹{slab.cgst.toFixed(2)} | SGST: ₹
                      {slab.sgst.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payments */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">Payments Tendered:</span>
                  <div className="font-medium text-slate-800">
                    {selectedInvoice.payments.map((p, idx) => (
                      <span key={idx} className="mr-3 uppercase font-mono-numbers">
                        {p.mode}: ₹{p.amount.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Total Net Paid:</span>
                  <span className="text-xl font-black font-mono-numbers text-blue-900">
                    ₹{selectedInvoice.netPayable.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setReceiptToPrint(selectedInvoice);
                  setIsDuplicatePrint(true);
                  setShowReceiptModal(true);
                  setSelectedInvoice(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-900 text-white rounded hover:bg-blue-800 flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Reprint Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID / SALES RETURN MODAL */}
      {voidInvoiceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Void Invoice / Sales Return</span>
              </h3>
              <button
                onClick={() => setVoidInvoiceTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVoid} className="space-y-4 pt-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Voiding Invoice <strong className="font-mono-numbers">{voidInvoiceTarget.invoiceNo}</strong> will mark it
                as CANCELLED, generate a linked Credit Note, and automatically restore all items back into the stock ledger.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Return</label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                >
                  <option value="Customer returned goods within policy">
                    Customer returned goods within policy
                  </option>
                  <option value="Damaged / defective item replaced">
                    Damaged / defective item replaced
                  </option>
                  <option value="Incorrect item or quantity scanned">
                    Incorrect item or quantity scanned
                  </option>
                  <option value="Payment transaction dispute">Payment transaction dispute</option>
                </select>
              </div>

              {currentUser.role !== 'admin' && currentUser.role !== 'manager' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-red-800 font-semibold">
                    <Lock className="h-4 w-4" />
                    <span>Manager Authorization PIN Required</span>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    placeholder="Enter 4-digit PIN (1234)"
                    className="w-full px-3 py-1.5 border border-red-300 rounded text-center tracking-widest font-mono-numbers text-xs bg-white"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setVoidInvoiceTarget(null)}
                  className="px-4 py-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Confirm Credit Note & Reverse Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
