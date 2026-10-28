/**
 * Supermarket Billing Terminal (Point of Sale)
 * High-speed POS interface with USB scanner support, quick-scan demo bar,
 * live GST & discount calculations, and receipt printing.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Product, Customer, Invoice } from '../../types';
import { PaymentModal } from './PaymentModal';
import { HeldBillsModal } from './HeldBillsModal';
import { ThermalReceipt } from './ThermalReceipt';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Pause,
  Play,
  RotateCcw,
  CreditCard,
  User as UserIcon,
  Check,
  Tag,
  Building,
  Sparkles,
  Zap,
} from 'lucide-react';

export const BillingTerminal: React.FC = () => {
  const {
    cart,
    addToCart,
    updateCartItemQty,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    calculation,
    currentCustomer,
    setCurrentCustomer,
    appliedCoupon,
    setAppliedCoupon,
    billDiscountRupees,
    setBillDiscountRupees,
    isInterState,
    setIsInterState,
    isB2B,
    setIsB2B,
    b2bGSTIN,
    setB2BGSTIN,
    handleBarcodeScanned,
    heldBillsCount,
    holdCurrentBill,
    settings,
    receiptToPrint,
    setReceiptToPrint,
    showReceiptModal,
    setShowReceiptModal,
    isDuplicatePrint,
    setIsDuplicatePrint,
    showNotification,
  } = useApp();

  // Barcode input state
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [customerSearchPhone, setCustomerSearchPhone] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Keep cursor focused in barcode input for physical keyboard-wedge scanner
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart]);

  // Global hotkeys (F4: Clear, F6: Hold, F8: Checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) holdCurrentBill();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('Clear current bill?')) clearCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, holdCurrentBill, clearCart]);

  // Barcode submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const res = handleBarcodeScanned(barcodeInput.trim());
    if (res.success) {
      setBarcodeInput('');
    }
  };

  // Search filter
  const allProducts = db.getProducts();
  const searchResults = searchQuery.trim()
    ? allProducts
        .filter(
          (p) =>
            p.active &&
            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.barcode.includes(searchQuery))
        )
        .slice(0, 8)
    : [];

  // Customer search
  const handleCustomerLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerSearchPhone.trim()) return;
    const cust = db.findCustomerByMobile(customerSearchPhone.trim());
    if (cust) {
      setCurrentCustomer(cust);
      setShowCustomerModal(false);
      showNotification(`Attached customer: ${cust.name} (${cust.loyaltyPoints} points)`, 'success');
    } else {
      showNotification('Customer not found. You can register them below.', 'info');
    }
  };

  // Quick seed benchmark bill from Chapter 5.5
  const loadBenchmarkSampleItems = () => {
    clearCart();
    // 1. Toor Dal 1kg x 2 (5%)
    const toorDal = allProducts.find((p) => p.id === 'P00123');
    if (toorDal) addToCart(toorDal, 2, 0);

    // 2. Biscuits 100g x 3 with 10% line discount (5%)
    const biscuits = allProducts.find((p) => p.id === 'P00124');
    if (biscuits) addToCart(biscuits, 3, 10);

    // 3. Shampoo 180ml x 1 (5%)
    const shampoo = allProducts.find((p) => p.id === 'P00125');
    if (shampoo) addToCart(shampoo, 1, 0);

    // 4. Cold Drink 600ml x 2 (40%)
    const coldDrink = allProducts.find((p) => p.id === 'P00126');
    if (coldDrink) addToCart(coldDrink, 2, 0);

    // 5. LED Bulb 9W x 1 (18%)
    const ledBulb = allProducts.find((p) => p.id === 'P00127');
    if (ledBulb) addToCart(ledBulb, 1, 0);

    // 6. Tomato loose x 1.35 kg (0%)
    const tomato = allProducts.find((p) => p.id === 'P00128');
    if (tomato) addToCart(tomato, 1.35, 0);

    showNotification('Loaded Worked Example Basket from Chapter 5.5 (Total: ₹861.00)', 'success');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100 p-3 lg:p-5">
      {/* Top Action Bar: Barcode Scanner & Search */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Main Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="md:col-span-5 relative">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-blue-900 pointer-events-none">
                <Barcode className="h-5 w-5" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or type code and press Enter..."
                className="w-full pl-11 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold font-mono-numbers text-slate-900 focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-md text-xs font-semibold hover:bg-blue-800 transition-colors"
              >
                Enter
              </button>
            </div>
          </form>

          {/* Product Search Fallback */}
          <div className="md:col-span-4 relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search by product name or category..."
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none"
              />
            </div>

            {/* Live Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-40 max-h-64 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      addToCart(prod, 1);
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                      showNotification(`Added ${prod.name}`, 'success');
                    }}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-blue-50 transition-colors text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{prod.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono-numbers">
                        {prod.code} · Barcode: {prod.barcode} · Stock: {prod.currentStock} {prod.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono-numbers">
                        ₹{prod.sellingPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">GST {prod.gstRate}%</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Demonstration Quick Actions */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <button
              onClick={loadBenchmarkSampleItems}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
              title="Loads the worked example bill from Chapter 5.5 of the study report (Total: Rs. 861.00)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Load Report Bill (₹861)</span>
            </button>
          </div>
        </div>

        {/* Quick Click-to-Scan Bar for rapid evaluation & testing */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> Quick Scan:
          </span>
          {[
            { name: 'Toor Dal 1kg', barcode: '8901234567890' },
            { name: 'Biscuits 100g', barcode: '8901030012345' },
            { name: 'Shampoo 180ml', barcode: '8901030098765' },
            { name: 'Cold Drink 600ml', barcode: '8901764012012' },
            { name: 'LED Bulb 9W', barcode: '8902894561234' },
            { name: 'Tomato 1.35kg (Weighed)', barcode: '2000001001358' },
            { name: 'Amul Butter 500g', barcode: '8901262010053' },
            { name: 'Basmati Rice 5kg', barcode: '8901112223334' },
          ].map((item) => (
            <button
              key={item.barcode}
              onClick={() => handleBarcodeScanned(item.barcode)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 rounded-md font-medium whitespace-nowrap transition-colors"
            >
              + {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main POS Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Column: Scanned Cart Table (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Current Basket</h2>
              <span className="text-xs text-slate-500 font-mono-numbers">
                ({cart.length} distinct items · {calculation.totalItemsCount} units)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {heldBillsCount > 0 && (
                <button
                  onClick={() => setShowHeldModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-md hover:bg-amber-200"
                >
                  <Play className="h-3 w-3" />
                  <span>Resume Held ({heldBillsCount})</span>
                </button>
              )}
              {cart.length > 0 && (
                <>
                  <button
                    onClick={() => holdCurrentBill()}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    title="Hold Bill (F6)"
                  >
                    <Pause className="h-3 w-3" />
                    <span>Hold (F6)</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all items from this bill?')) clearCart();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                    title="Clear Bill (F4)"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Clear (F4)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Scanned Items Table */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Barcode className="h-12 w-12 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="font-semibold text-slate-600 text-sm">Basket is empty</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Scan a barcode with your scanner, search for an item, or click any sample item above to start billing.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-3 text-right">MRP</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Gross</th>
                    <th className="py-2.5 px-3 text-right">Disc</th>
                    <th className="py-2.5 px-3 text-right">Net Amount</th>
                    <th className="py-2.5 px-2 text-center">GST %</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {calculation.lineItems.map((line, idx) => {
                    const originalCartItem = cart.find(
                      (ci) => ci.product.id === line.product.id
                    );
                    return (
                      <tr key={line.product.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono-numbers">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{line.product.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono-numbers">
                            HSN: {line.product.hsnCode} · {line.product.unit}
                            {line.product.batches?.[0]?.batchNumber && (
                              <span> · Batch: {line.product.batches[0].batchNumber}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-400 line-through">
                          ₹{line.product.mrp.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers font-medium text-slate-800">
                          ₹{line.rate.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                updateCartItemQty(line.product.id, line.quantity - (line.product.isWeighed ? 0.25 : 1))
                              }
                              className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              step={line.product.isWeighed ? '0.05' : '1'}
                              min="0.01"
                              value={line.quantity}
                              onChange={(e) =>
                                updateCartItemQty(line.product.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-14 text-center font-mono-numbers font-bold text-xs py-1 border border-slate-200 rounded focus:border-blue-900 focus:outline-none"
                            />
                            <button
                              onClick={() =>
                                updateCartItemQty(line.product.id, line.quantity + (line.product.isWeighed ? 0.25 : 1))
                              }
                              className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-700">
                          ₹{line.grossAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers">
                          {line.discountAmount > 0 ? (
                            <span className="text-red-600 font-semibold">
                              -₹{line.discountAmount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-300">0.00</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-slate-900">
                          ₹{line.netAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-numbers ${
                              line.taxRate === 40
                                ? 'bg-purple-100 text-purple-800'
                                : line.taxRate === 18
                                ? 'bg-blue-100 text-blue-800'
                                : line.taxRate === 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {line.taxRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => removeFromCart(line.product.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Summary & Total Calculation (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div className="space-y-4">
            {/* Customer & Tax Configurations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Customer Profile
                </span>
                {currentCustomer ? (
                  <button
                    onClick={() => setCurrentCustomer(null)}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Clear Customer
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="text-[11px] font-semibold text-blue-900 hover:underline flex items-center gap-1"
                  >
                    <UserIcon className="h-3 w-3" />
                    <span>Attach Customer</span>
                  </button>
                )}
              </div>

              {currentCustomer ? (
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs">
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>{currentCustomer.name}</span>
                    <span className="font-mono-numbers">{currentCustomer.mobile}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-blue-700 mt-1">
                    <span>Loyalty Points: {currentCustomer.loyaltyPoints}</span>
                    <span>Total Spent: ₹{currentCustomer.totalSpent.toFixed(0)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Walk-in Retail Consumer (No registration required)
                </div>
              )}
            </div>

            {/* B2B / Inter-State Options */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-slate-200 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={isB2B}
                  onChange={(e) => setIsB2B(e.target.checked)}
                  className="rounded text-blue-900 focus:ring-0"
                />
                <span className="font-medium text-slate-700">B2B Invoice</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-slate-200 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={isInterState}
                  onChange={(e) => setIsInterState(e.target.checked)}
                  className="rounded text-blue-900 focus:ring-0"
                />
                <span className="font-medium text-slate-700">Inter-State (IGST)</span>
              </label>
            </div>

            {isB2B && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Buyer GSTIN</label>
                <input
                  type="text"
                  maxLength={15}
                  value={b2bGSTIN}
                  onChange={(e) => setB2BGSTIN(e.target.value.toUpperCase())}
                  placeholder="e.g. 33AAACR1234F1Z8"
                  className="w-full text-xs font-mono-numbers px-3 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>
            )}

            {/* Coupon / Voucher Code */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={appliedCoupon}
                  onChange={(e) => setAppliedCoupon(e.target.value.toUpperCase())}
                  placeholder="Promo / Coupon (e.g. WELCOME50)"
                  className="w-full pl-8 pr-2 py-1.5 text-xs font-mono-numbers border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>
              {appliedCoupon && (
                <button
                  onClick={() => setAppliedCoupon('')}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
            </div>

            {calculation.appliedOfferDescription && (
              <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                {calculation.appliedOfferDescription}
              </div>
            )}

            {/* Financial Breakdown Table (Section 5.4/5.5) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Total</span>
                <span className="font-mono-numbers font-semibold text-slate-900">
                  ₹{calculation.grossTotal.toFixed(2)}
                </span>
              </div>

              {calculation.totalDiscount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Total Discount</span>
                  <span className="font-mono-numbers">
                    -₹{calculation.totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Taxable Value</span>
                <span className="font-mono-numbers font-medium text-slate-800">
                  ₹{calculation.taxableValue.toFixed(2)}
                </span>
              </div>

              {/* GST Breakdown */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-[11px]">
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  GST Summary (Tax-Inclusive MRP)
                </div>
                {calculation.gstSummary.map((slab) => (
                  <div key={slab.gstRate} className="flex justify-between text-slate-600">
                    <span>
                      {slab.gstRate}% Slab (Net ₹{slab.netAmount.toFixed(2)})
                    </span>
                    <span className="font-mono-numbers font-medium">
                      {isInterState
                        ? `IGST: ₹${slab.igst.toFixed(2)}`
                        : `CGST: ₹${slab.cgst.toFixed(2)} + SGST: ₹${slab.sgst.toFixed(2)}`}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
                  <span>Total GST</span>
                  <span className="font-mono-numbers">₹{calculation.totalGST.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Round off</span>
                <span className="font-mono-numbers">
                  {calculation.roundOff >= 0
                    ? `+₹${calculation.roundOff.toFixed(2)}`
                    : `-₹${Math.abs(calculation.roundOff).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* NET PAYABLE & CHECKOUT BUTTON */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="rounded-xl bg-blue-900 p-4 text-white flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  Net Payable Amount
                </div>
                <div className="text-3xl font-black font-mono-numbers leading-tight mt-0.5">
                  ₹{calculation.netPayable.toFixed(2)}
                </div>
              </div>
              {calculation.totalDiscount > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-emerald-300 font-medium block">You Save</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono-numbers">
                    ₹{calculation.totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (cart.length === 0) {
                  showNotification('Please add at least one item before checkout', 'warning');
                  return;
                }
                setShowPaymentModal(true);
              }}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
            >
              <CreditCard className="h-4 w-4" />
              <span>Collect Payment (F8)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Lookup / Register Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Attach Customer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Search by 10-digit mobile number to accrue loyalty points
            </p>
            <form onSubmit={handleCustomerLookup} className="space-y-3">
              <input
                type="tel"
                value={customerSearchPhone}
                onChange={(e) => setCustomerSearchPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono-numbers focus:border-blue-900 focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  Search / Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Held Bills Modal */}
      {showHeldModal && <HeldBillsModal onClose={() => setShowHeldModal(false)} />}

      {/* Payment Settlement Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(invoice: Invoice) => {
            setShowPaymentModal(false);
            setReceiptToPrint(invoice);
            setIsDuplicatePrint(false);
            setShowReceiptModal(true);
          }}
        />
      )}

      {/* Thermal Receipt Preview & Printing Modal */}
      {showReceiptModal && receiptToPrint && (
        <ThermalReceipt
          invoice={receiptToPrint}
          settings={settings}
          isDuplicate={isDuplicatePrint}
          onClose={() => {
            setShowReceiptModal(false);
            setReceiptToPrint(null);
          }}
        />
      )}
    </div>
  );
};
