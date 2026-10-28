/**
 * SBMS Inventory & Stock Management Module
 * Implements Chapter 8: Stock movements, FEFO batch expiry alerts,
 * stock ledger audit trail, and manager-approved stock adjustments.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Product, StockLedgerEntry } from '../../types';
import {
  Layers,
  AlertTriangle,
  History,
  SlidersHorizontal,
  Search,
  Calendar,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { currentUser, showNotification, triggerDbRefresh, dbVersion } = useApp();
  const products = db.getProducts();
  const ledger = db.getStockLedger();

  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'ledger' | 'expiry'>('stock');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Stock Adjustment Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustedStockValue, setAdjustedStockValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Damaged / Spoilage');
  const [managerPin, setManagerPin] = useState<string>('');

  // Calculations
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.active && p.currentStock <= p.reorderLevel),
    [products, dbVersion]
  );

  const totalInventoryValue = useMemo(
    () => products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0),
    [products, dbVersion]
  );

  // Expiring items within 30 days
  const expiringItems = useMemo(() => {
    const today = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(today.getDate() + 30);
    const dateLimit = thirtyDaysAhead.toISOString().split('T')[0];

    const list: {
      product: Product;
      batch: string;
      expiryDate: string;
      quantity: number;
      daysRemaining: number;
    }[] = [];

    products.forEach((p) => {
      p.batches?.forEach((b) => {
        if (b.expiryDate && b.expiryDate <= dateLimit) {
          const expTime = new Date(b.expiryDate).getTime();
          const diffDays = Math.ceil((expTime - today.getTime()) / (1000 * 3600 * 24));
          list.push({
            product: p,
            batch: b.batchNumber,
            expiryDate: b.expiryDate,
            quantity: b.quantity,
            daysRemaining: diffDays,
          });
        }
      });
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [products, dbVersion]);

  // Filtered Stock
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm)
    );
  }, [products, searchTerm, dbVersion]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return ledger.filter(
      (l) =>
        l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.referenceDoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ledger, searchTerm, dbVersion]);

  // Handle Adjustment Submit
  const handlePerformAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    // Verify Manager Rights or PIN
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      if (managerPin !== '1234') {
        showNotification('Invalid Manager Override PIN (Demo PIN: 1234)', 'error');
        return;
      }
    }

    db.adjustStock({
      productId: adjustModalProduct.id,
      newStock: adjustedStockValue,
      reason: adjustmentReason,
      user: currentUser,
    });

    triggerDbRefresh();
    setAdjustModalProduct(null);
    setManagerPin('');
    showNotification(`Stock adjusted for ${adjustModalProduct.name} to ${adjustedStockValue}`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500">
            Real-time balance, immutable stock ledger, and FEFO expiry tracking
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('stock')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'stock'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Stock ({products.length})
          </button>
          <button
            onClick={() => setActiveSubTab('expiry')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'expiry'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Batch & Expiry</span>
            {expiringItems.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'ledger'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Ledger ({ledger.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Inventory Value
          </span>
          <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
            ₹{totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">At weighted purchase cost</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Reorder Stock Alerts
          </span>
          <div className="text-xl font-bold font-mono-numbers text-amber-700 mt-1">
            {lowStockProducts.length} Items
          </div>
          <span className="text-[11px] text-slate-400">Needs replenishment from suppliers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Near-Expiry Batches (&le; 30 Days)
          </span>
          <div className="text-xl font-bold font-mono-numbers text-purple-700 mt-1">
            {expiringItems.length} Batches
          </div>
          <span className="text-[11px] text-slate-400">FEFO priority markdown candidate</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products or ledger documents..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-900 focus:outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: CURRENT STOCK TABLE */}
      {activeSubTab === 'stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">On Hand</th>
                  <th className="py-3 px-3 text-center">Reorder Lvl</th>
                  <th className="py-3 px-3 text-right">Total Value</th>
                  <th className="py-3 px-3 text-center">Stock Health</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.reorderLevel;
                  const isOut = p.currentStock <= 0;
                  const itemValue = p.currentStock * p.purchasePrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {p.name}
                        <span className="text-[10px] text-slate-400 font-mono-numbers block">
                          {p.code} · Barcode: {p.barcode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.category}</td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                        ₹{p.purchasePrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-800">
                        ₹{p.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono-numbers font-bold">
                        <span className={isOut ? 'text-red-600' : isLow ? 'text-amber-700' : 'text-slate-800'}>
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono-numbers text-slate-500">
                        {p.reorderLevel} {p.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-medium text-slate-800">
                        ₹{itemValue.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOut
                              ? 'bg-red-50 text-red-700'
                              : isLow
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Reorder Alert' : 'Healthy'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setAdjustModalProduct(p);
                            setAdjustedStockValue(p.currentStock);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-50 rounded border border-blue-200"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: BATCH & EXPIRY TABLE (FEFO) */}
      {activeSubTab === 'expiry' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              FEFO Batch Expiry Schedule
            </h3>
            <span className="text-xs text-slate-500">
              Earliest-expiring batches are automatically prioritized for billing deduction
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Batch Number</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3 text-center">Days Remaining</th>
                  <th className="py-3 px-3 text-right">Batch Qty</th>
                  <th className="py-3 px-3 text-center">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item.product.name}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Category: {item.product.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-numbers font-medium text-slate-800">
                      {item.batch}
                    </td>
                    <td className="py-3 px-3 font-mono-numbers text-slate-700">
                      {item.expiryDate}
                    </td>
                    <td className="py-3 px-3 text-center font-mono-numbers">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.daysRemaining <= 7
                            ? 'bg-red-100 text-red-800 font-bold'
                            : item.daysRemaining <= 15
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-yellow-50 text-yellow-800'
                        }`}
                      >
                        {item.daysRemaining <= 0 ? 'EXPIRED' : `${item.daysRemaining} days left`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold">
                      {item.quantity} {item.product.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {item.daysRemaining <= 7 ? 'Markdown 30%' : 'Front Shelf Rotation'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: STOCK LEDGER AUDIT TRAIL */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Immutable Stock Movement Ledger
            </h3>
            <span className="text-xs text-slate-500">
              Every document (Sale, GRN, Adjustment) leaves an auditable trail
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3 text-center">Movement Type</th>
                  <th className="py-3 px-3 text-right">Change</th>
                  <th className="py-3 px-3 text-right">Prev Stock</th>
                  <th className="py-3 px-3 text-right">New Stock</th>
                  <th className="py-3 px-3">Ref Doc</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono-numbers whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      {new Date(row.date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.productName}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          row.type === 'sale'
                            ? 'bg-blue-50 text-blue-800'
                            : row.type === 'purchase_receipt'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {row.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-numbers font-bold ${
                        row.quantityChange > 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-500">
                      {row.previousStock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-800">
                      {row.newStock}
                    </td>
                    <td className="py-3 px-3 font-mono-numbers text-slate-700">{row.referenceDoc}</td>
                    <td className="py-3 px-3 text-slate-700">{row.userName}</td>
                    <td className="py-3 px-3 text-slate-500">{row.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Manual Stock Adjustment</h3>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePerformAdjustment} className="space-y-4 pt-4 text-xs">
              <div>
                <span className="text-slate-500 block">Product:</span>
                <span className="font-bold text-sm text-slate-900">
                  {adjustModalProduct.name} ({adjustModalProduct.code})
                </span>
                <span className="text-[11px] text-slate-500 block font-mono-numbers">
                  Current Book Stock: {adjustModalProduct.currentStock} {adjustModalProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Adjusted Physical Stock Count
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustedStockValue}
                  onChange={(e) => setAdjustedStockValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Variance</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                >
                  <option value="Damaged / Broken in transit">Damaged / Broken in transit</option>
                  <option value="Product Expiry Spoilage">Product Expiry Spoilage</option>
                  <option value="Physical Count Miscount Correction">
                    Physical Count Miscount Correction
                  </option>
                  <option value="Pest damage / Wastage">Pest damage / Wastage</option>
                  <option value="Supplier short delivery">Supplier short delivery</option>
                </select>
              </div>

              {currentUser.role !== 'admin' && currentUser.role !== 'manager' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold">
                    <Lock className="h-4 w-4" />
                    <span>Manager Approval Required</span>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    placeholder="Enter 4-digit Manager PIN (1234)"
                    className="w-full px-3 py-1.5 border border-amber-300 rounded text-center tracking-widest font-mono-numbers text-xs bg-white"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 rounded hover:bg-blue-800"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
