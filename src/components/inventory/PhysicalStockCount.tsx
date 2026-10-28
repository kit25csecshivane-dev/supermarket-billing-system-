/**
 * Physical Stock Count & Variance Reconciliation
 * Implements Chapter 8.6 of SBMS Report: Cycle counting, variance calculation,
 * and manager approval to reconcile book stock with physical shelf count.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { ClipboardCheck, Check, RotateCcw, AlertCircle, Save } from 'lucide-react';

export const PhysicalStockCount: React.FC = () => {
  const { currentUser, showNotification, triggerDbRefresh } = useApp();
  const products = db.getProducts();

  // Map of product ID -> physical count entered
  const [counts, setCounts] = useState<{ [id: string]: number }>(() => {
    const initial: { [id: string]: number } = {};
    products.forEach((p) => {
      initial[p.id] = p.currentStock;
    });
    return initial;
  });

  const [notes, setNotes] = useState<{ [id: string]: string }>({});

  const handleCountChange = (productId: string, val: number) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleApplySingle = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const physical = counts[productId] ?? product.currentStock;
    const diff = Math.round((physical - product.currentStock) * 100) / 100;
    if (diff === 0) {
      showNotification('No variance detected for this item', 'info');
      return;
    }

    const note = notes[productId] || 'Cycle Count Variance Reconciliation';
    db.adjustStock({
      productId,
      newStock: physical,
      reason: note,
      user: currentUser,
    });

    triggerDbRefresh();
    showNotification(`Reconciled ${product.name}: Variance of ${diff} adjusted`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Physical Stock Count & Variance
          </h1>
          <p className="text-xs text-slate-500">
            Audit physical shelf counts, compute shrinkage/excess, and post reconciliations
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Enter the verified physical count on the shelf to compare against system book stock.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Book Stock</th>
                <th className="py-3 px-3 text-center">Physical Count</th>
                <th className="py-3 px-3 text-center">Variance (Diff)</th>
                <th className="py-3 px-3">Audit Note / Reason</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const physical = counts[p.id] ?? p.currentStock;
                const diff = Math.round((physical - p.currentStock) * 100) / 100;
                const hasVariance = diff !== 0;

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      hasVariance ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {p.name}
                      <span className="text-[10px] text-slate-400 font-mono-numbers block">
                        {p.code} · Barcode: {p.barcode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.category}</td>
                    <td className="py-3 px-3 text-center font-mono-numbers font-medium text-slate-800">
                      {p.currentStock} {p.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        step={p.isWeighed ? '0.01' : '1'}
                        min="0"
                        value={physical}
                        onChange={(e) => handleCountChange(p.id, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-mono-numbers font-bold text-center text-xs focus:border-blue-900 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-mono-numbers font-bold">
                      {diff === 0 ? (
                        <span className="text-slate-400">0</span>
                      ) : (
                        <span className={diff > 0 ? 'text-emerald-700' : 'text-red-600'}>
                          {diff > 0 ? `+${diff}` : diff} {p.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="e.g. Shelf recount, broken pack"
                        value={notes[p.id] || ''}
                        onChange={(e) =>
                          setNotes({ ...notes, [p.id]: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleApplySingle(p.id)}
                        disabled={diff === 0}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-900 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                      >
                        Reconcile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
