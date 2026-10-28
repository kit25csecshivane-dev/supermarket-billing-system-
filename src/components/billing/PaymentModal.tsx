/**
 * SBMS Payment Processing Modal
 * Implements Cash, Card, Dynamic UPI QR, and Split/Mixed Payments (Chapter 6 of SBMS Report)
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentEntry, PaymentMode, Invoice } from '../../types';
import { db } from '../../services/database';
import {
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess }) => {
  const {
    calculation,
    currentUser,
    counterId,
    currentCustomer,
    isB2B,
    b2bGSTIN,
    clearCart,
    showNotification,
    triggerDbRefresh,
  } = useApp();

  const totalPayable = calculation.netPayable;

  // Active payment tab
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('cash');

  // Split payment list
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);

  // Cash Fields
  const [cashTendered, setCashTendered] = useState<number>(totalPayable);

  // Card Fields
  const [cardLast4, setCardLast4] = useState<string>('4242');
  const [cardNetwork, setCardNetwork] = useState<string>('RuPay');
  const [cardApprovalCode, setCardApprovalCode] = useState<string>(
    () => `AUTH${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [cardProcessing, setCardProcessing] = useState<boolean>(false);

  // UPI Fields
  const [upiStatus, setUpiStatus] = useState<'idle' | 'waiting' | 'approved'>('idle');
  const [upiRef, setUpiRef] = useState<string>(
    () => `UPI/${Date.now().toString().slice(-8)}`
  );

  // Current amount being allocated in the selected mode
  const totalPaidSoFar = useMemo(
    () => paymentEntries.reduce((sum, p) => sum + p.amount, 0),
    [paymentEntries]
  );

  const remainingBalance = Math.max(0, Math.round((totalPayable - totalPaidSoFar) * 100) / 100);

  // Default input amount for current mode
  const [inputAmount, setInputAmount] = useState<number>(remainingBalance);

  // Keep inputAmount synced when remainingBalance changes
  React.useEffect(() => {
    setInputAmount(remainingBalance);
    if (selectedMode === 'cash') {
      setCashTendered(remainingBalance);
    }
  }, [remainingBalance, selectedMode]);

  // Cash change due calculation
  const cashChangeDue = Math.max(0, Math.round((cashTendered - inputAmount) * 100) / 100);

  // Quick cash denomination handlers
  const handleCashDenom = (note: number) => {
    setCashTendered(note);
  };

  // Add partial payment entry (for split payments)
  const handleAddPaymentEntry = (entry: PaymentEntry) => {
    const updated = [...paymentEntries, entry];
    setPaymentEntries(updated);

    const newPaid = updated.reduce((sum, p) => sum + p.amount, 0);
    const newRem = Math.max(0, Math.round((totalPayable - newPaid) * 100) / 100);

    if (newRem <= 0) {
      showNotification('Total amount fully covered. Ready to complete sale.', 'success');
    }
  };

  const handleRemovePayment = (index: number) => {
    const updated = [...paymentEntries];
    updated.splice(index, 1);
    setPaymentEntries(updated);
  };

  // Process and finalize the sale
  const handleCompleteSale = () => {
    // If user hasn't added split entries yet, create one from current view
    let finalPayments = [...paymentEntries];

    if (finalPayments.length === 0) {
      if (selectedMode === 'cash') {
        if (cashTendered < totalPayable) {
          showNotification('Cash tendered cannot be less than total payable', 'error');
          return;
        }
        finalPayments = [
          {
            mode: 'cash',
            amount: totalPayable,
            tenderedCash: cashTendered,
            changeGiven: cashChangeDue,
            status: 'success',
            timestamp: new Date().toISOString(),
          },
        ];
      } else if (selectedMode === 'card') {
        finalPayments = [
          {
            mode: 'card',
            amount: totalPayable,
            cardLast4,
            cardNetwork,
            reference: cardApprovalCode,
            status: 'success',
            timestamp: new Date().toISOString(),
          },
        ];
      } else if (selectedMode === 'upi') {
        if (upiStatus !== 'approved') {
          showNotification('Please verify UPI payment confirmation before finalizing', 'warning');
          return;
        }
        finalPayments = [
          {
            mode: 'upi',
            amount: totalPayable,
            reference: upiRef,
            status: 'success',
            timestamp: new Date().toISOString(),
          },
        ];
      }
    } else {
      if (remainingBalance > 0) {
        showNotification(`Remaining balance ₹${remainingBalance} must be paid`, 'warning');
        return;
      }
    }

    try {
      const invoice = db.completeSale({
        calculation,
        payments: finalPayments,
        cashier: currentUser,
        counterId,
        customer: currentCustomer || undefined,
        isB2B,
        b2bGSTIN,
      });

      triggerDbRefresh();
      clearCart();
      showNotification(`Invoice ${invoice.invoiceNo} generated successfully!`, 'success');
      onSuccess(invoice);
    } catch (e: any) {
      showNotification(`Failed to complete transaction: ${e.message}`, 'error');
    }
  };

  // UPI dynamic payload
  const upiPayload = `upi://pay?pa=smkfresh@okaxis&pn=SMK%20Fresh%20Supermarket&am=${inputAmount.toFixed(2)}&tr=${upiRef}&cu=INR`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payment Settlement</h2>
            <p className="text-xs text-slate-500">
              Total Payable: <span className="font-bold text-blue-900 text-sm font-mono-numbers">₹{totalPayable.toFixed(2)}</span>
              {currentCustomer && ` · Customer: ${currentCustomer.name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Mode Selector (Left 4 cols) */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Payment Mode
            </div>

            <button
              onClick={() => setSelectedMode('cash')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                selectedMode === 'cash'
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span>Cash Payment</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode('card')}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                selectedMode === 'card'
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Card (Debit/Credit)</span>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedMode('upi');
                setUpiStatus('waiting');
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                selectedMode === 'upi'
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="h-4 w-4 text-purple-600" />
                <span>Dynamic UPI QR</span>
              </div>
            </button>

            {/* Split Payment Tracker */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Due:</span>
                <span className="font-mono-numbers font-semibold">₹{totalPayable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Allocated:</span>
                <span className="font-mono-numbers font-semibold text-emerald-600">
                  ₹{totalPaidSoFar.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Remaining:</span>
                <span
                  className={`font-mono-numbers ${
                    remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  ₹{remainingBalance.toFixed(2)}
                </span>
              </div>

              {/* Split Entries List */}
              {paymentEntries.length > 0 && (
                <div className="mt-2 space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400">
                    Split Lines ({paymentEntries.length})
                  </div>
                  {paymentEntries.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-semibold uppercase text-slate-800">{p.mode}: </span>
                        <span className="font-mono-numbers">₹{p.amount.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleRemovePayment(idx)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mode Form Details (Right 8 cols) */}
          <div className="md:col-span-8 p-6 space-y-5">
            {/* CASH MODE */}
            {selectedMode === 'cash' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">Cash Tendered</h3>
                  <span className="text-xs text-slate-500">
                    Amount to settle:{' '}
                    <strong className="text-slate-800 font-mono-numbers">₹{inputAmount.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tendered Cash (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full text-2xl font-bold font-mono-numbers text-slate-900 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                {/* Quick Indian Denomination Buttons */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-500">Fast Denominations:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCashDenom(inputAmount)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 font-mono-numbers"
                    >
                      Exact (₹{inputAmount.toFixed(0)})
                    </button>
                    {[100, 200, 500, 1000, 2000].map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => handleCashDenom(note)}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 font-mono-numbers"
                      >
                        ₹{note}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Due Callout */}
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                      Change Due to Customer
                    </div>
                    <div className="text-2xl font-black text-emerald-700 font-mono-numbers">
                      ₹{cashChangeDue.toFixed(2)}
                    </div>
                  </div>
                  {cashTendered < inputAmount && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      <span>Underpaid by ₹{(inputAmount - cashTendered).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Add to Split Button if partial */}
                {remainingBalance > 0 && inputAmount < totalPayable && (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddPaymentEntry({
                        mode: 'cash',
                        amount: Math.min(inputAmount, cashTendered),
                        tenderedCash: cashTendered,
                        changeGiven: cashChangeDue,
                        status: 'success',
                        timestamp: new Date().toISOString(),
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded border border-blue-900 text-blue-900 hover:bg-blue-50 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Partial Cash to Split Payment</span>
                  </button>
                )}
              </div>
            )}

            {/* CARD MODE */}
            {selectedMode === 'card' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">POS Card Terminal</h3>
                  <span className="text-xs text-slate-500">
                    Amount: <strong className="text-slate-800 font-mono-numbers">₹{inputAmount.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Card Network</label>
                    <select
                      value={cardNetwork}
                      onChange={(e) => setCardNetwork(e.target.value)}
                      className="mt-1 w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-900 focus:outline-none"
                    >
                      <option value="RuPay">RuPay (Domestic)</option>
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Masked Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                      className="mt-1 w-full text-xs font-mono-numbers px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-900 focus:outline-none"
                      placeholder="e.g. 4242"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Approval Code / Auth ID</label>
                  <input
                    type="text"
                    value={cardApprovalCode}
                    onChange={(e) => setCardApprovalCode(e.target.value)}
                    className="mt-1 w-full text-xs font-mono-numbers px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
                  />
                </div>

                <div className="p-3 bg-blue-50/60 rounded-md border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                  <span>Card Swipe / Dip Terminal Simulation</span>
                  <button
                    type="button"
                    disabled={cardProcessing}
                    onClick={() => {
                      setCardProcessing(true);
                      setTimeout(() => {
                        setCardProcessing(false);
                        setCardApprovalCode(`AUTH${Math.floor(100000 + Math.random() * 900000)}`);
                        showNotification('Card payment authorized by bank terminal', 'success');
                      }, 800);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-900 text-white rounded text-xs font-semibold hover:bg-blue-800"
                  >
                    {cardProcessing ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    <span>{cardProcessing ? 'Contacting Bank...' : 'Authorize Terminal'}</span>
                  </button>
                </div>

                {remainingBalance > 0 && inputAmount < totalPayable && (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddPaymentEntry({
                        mode: 'card',
                        amount: inputAmount,
                        cardLast4,
                        cardNetwork,
                        reference: cardApprovalCode,
                        status: 'success',
                        timestamp: new Date().toISOString(),
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded border border-blue-900 text-blue-900 hover:bg-blue-50 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Card Line to Split Payment</span>
                  </button>
                )}
              </div>
            )}

            {/* DYNAMIC UPI MODE */}
            {selectedMode === 'upi' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">NPCI Dynamic UPI QR</h3>
                  <span className="text-xs text-slate-500">
                    Amount: <strong className="text-slate-800 font-mono-numbers">₹{inputAmount.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* Visual QR Code Representation */}
                  <div className="h-36 w-36 bg-white p-2 rounded-lg border border-slate-300 shadow-xs flex flex-col items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      {/* Corner markers */}
                      <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="2" />
                      <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                      <rect x="13" y="13" width="9" height="9" fill="#0f172a" />

                      <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="2" />
                      <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                      <rect x="78" y="13" width="9" height="9" fill="#0f172a" />

                      <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="2" />
                      <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                      <rect x="13" y="78" width="9" height="9" fill="#0f172a" />

                      {/* Dynamic data dot matrix simulation */}
                      <rect x="35" y="10" width="8" height="6" fill="#0f172a" />
                      <rect x="48" y="15" width="12" height="6" fill="#0f172a" />
                      <rect x="35" y="25" width="25" height="8" fill="#0f172a" />
                      <rect x="10" y="38" width="20" height="8" fill="#0f172a" />
                      <rect x="35" y="40" width="14" height="12" fill="#0f172a" />
                      <rect x="55" y="42" width="18" height="10" fill="#0f172a" />
                      <rect x="80" y="40" width="12" height="12" fill="#0f172a" />
                      <rect x="40" y="60" width="22" height="10" fill="#0f172a" />
                      <rect x="68" y="62" width="14" height="8" fill="#0f172a" />
                      <rect x="35" y="75" width="30" height="10" fill="#0f172a" />
                      <rect x="75" y="80" width="15" height="12" fill="#0f172a" />
                    </svg>
                    <span className="text-[9px] font-bold text-slate-500 mt-1">BHIM UPI QR</span>
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <div>
                      <div className="text-slate-500 font-medium">UPI VPA:</div>
                      <div className="font-semibold text-slate-800">smkfresh@okaxis</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">Ref / Trxn ID:</div>
                      <div className="font-mono-numbers text-slate-700">{upiRef}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">Customer Prompt:</div>
                      <div className="text-slate-600">Scan using PhonePe, Google Pay, or Paytm</div>
                    </div>
                  </div>
                </div>

                {/* Gateway Status Box */}
                <div className="p-3 rounded-lg border flex items-center justify-between bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-2">
                    {upiStatus === 'approved' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <RefreshCw className="h-5 w-5 text-amber-600 animate-spin" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {upiStatus === 'approved'
                          ? 'UPI Payment Confirmed (Bank Ref: Verified)'
                          : 'Waiting for Customer Authorization on UPI App...'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-numbers">
                        {upiPayload.slice(0, 48)}...
                      </div>
                    </div>
                  </div>

                  {upiStatus !== 'approved' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUpiStatus('approved');
                        showNotification('UPI payment webhook callback received: SUCCESS', 'success');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shrink-0"
                    >
                      Simulate App Pay
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700">PAID</span>
                  )}
                </div>

                {remainingBalance > 0 && inputAmount < totalPayable && upiStatus === 'approved' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddPaymentEntry({
                        mode: 'upi',
                        amount: inputAmount,
                        reference: upiRef,
                        status: 'success',
                        timestamp: new Date().toISOString(),
                      });
                      setUpiStatus('waiting');
                      setUpiRef(`UPI/${Date.now().toString().slice(-8)}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded border border-blue-900 text-blue-900 hover:bg-blue-50 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add UPI Line to Split Payment</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="text-xs text-slate-500">
            Pressing Finalize will issue a permanent GST invoice number and commit inventory.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteSale}
              disabled={
                (selectedMode === 'cash' && cashTendered < (paymentEntries.length > 0 ? remainingBalance : totalPayable)) ||
                (selectedMode === 'upi' && paymentEntries.length === 0 && upiStatus !== 'approved')
              }
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>Finalize & Issue Bill (₹{totalPayable.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
