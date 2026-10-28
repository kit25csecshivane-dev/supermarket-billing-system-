/**
 * SBMS Purchases & Supplier Management Module
 * Implements Chapter 8.2 & Chapter 13: Suppliers master, Goods Receipt Notes (GRN),
 * Input GST tracking, batch recording, and automated reorder recommendations.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Supplier, GoodsReceiptNote, Product } from '../../types';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export const PurchaseManager: React.FC = () => {
  const { currentUser, showNotification, triggerDbRefresh, dbVersion } = useApp();
  const suppliers = db.getSuppliers();
  const grns = db.getGRNs();
  const products = db.getProducts();

  const [activeTab, setActiveTab] = useState<'grn' | 'suppliers' | 'reorder'>('grn');
  const [isNewGRNOpen, setIsNewGRNOpen] = useState<boolean>(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState<boolean>(false);

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id' | 'active'>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  // New GRN Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ''
  );
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [grnItems, setGrnItems] = useState<
    {
      productId: string;
      productName: string;
      quantity: number;
      purchaseRate: number;
      mrp: number;
      batchNumber: string;
      expiryDate: string;
      gstRate: number;
    }[]
  >([]);

  // Reorder Suggestions (items below reorder level)
  const reorderSuggestions = useMemo(() => {
    return products
      .filter((p) => p.active && p.currentStock <= p.reorderLevel)
      .map((p) => {
        const leadDays = 3;
        const avgDailySales = Math.max(2, Math.round(p.reorderLevel / 5));
        const suggestedQty = Math.max(10, p.reorderLevel * 2 - p.currentStock);
        const estCost = suggestedQty * p.purchasePrice;

        return {
          product: p,
          currentStock: p.currentStock,
          reorderLevel: p.reorderLevel,
          suggestedQty,
          estCost,
        };
      });
  }, [products, dbVersion]);

  // Handle Add Item to GRN
  const handleAddGrnLine = (product: Product) => {
    setGrnItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: 20,
        purchaseRate: product.purchasePrice,
        mrp: product.mrp,
        batchNumber: `GRN-${Date.now().toString().slice(-4)}`,
        expiryDate: '2028-12-31',
        gstRate: product.gstRate,
      },
    ]);
  };

  const handleRemoveGrnLine = (index: number) => {
    setGrnItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit GRN
  const handleSubmitGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showNotification('Please select a supplier', 'error');
      return;
    }
    if (!supplierInvoiceNo.trim()) {
      showNotification('Supplier invoice number is required', 'error');
      return;
    }
    if (grnItems.length === 0) {
      showNotification('Add at least one item line to GRN', 'error');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);

    const grn = db.receiveGoods({
      supplierId: selectedSupplierId,
      supplierName: supplier?.name || 'Authorized Supplier',
      supplierInvoiceNo: supplierInvoiceNo.trim(),
      items: grnItems,
      user: currentUser,
    });

    triggerDbRefresh();
    setIsNewGRNOpen(false);
    setGrnItems([]);
    setSupplierInvoiceNo('');
    showNotification(`GRN ${grn.grnNo} received successfully! Stock updated.`, 'success');
  };

  // Submit New Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) return;

    const supplier: Supplier = {
      ...newSupplier,
      id: `SUP${String(suppliers.length + 1).padStart(3, '0')}`,
      active: true,
    };

    db.saveSupplier(supplier);
    triggerDbRefresh();
    setIsNewSupplierOpen(false);
    setNewSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
    });
    showNotification(`Supplier ${supplier.name} added successfully`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchases & Supplier Management
          </h1>
          <p className="text-xs text-slate-500">
            Goods Receipt Notes (GRN), Input GST credits, and purchase orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-semibold mr-2">
            <button
              onClick={() => setActiveTab('grn')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'grn' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Goods Receipt (GRN)
            </button>
            <button
              onClick={() => setActiveTab('reorder')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'reorder' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Reorder Alerts ({reorderSuggestions.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'suppliers' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Suppliers Directory ({suppliers.length})
            </button>
          </div>

          {activeTab === 'grn' && (
            <button
              onClick={() => setIsNewGRNOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Create New GRN</span>
            </button>
          )}

          {activeTab === 'suppliers' && (
            <button
              onClick={() => setIsNewSupplierOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: GRN HISTORY */}
      {activeTab === 'grn' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Goods Receipt Notes (GRN)</h3>
            <span className="text-xs text-slate-500">
              Inward stock consignments with supplier tax invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">GRN Number</th>
                  <th className="py-3 px-3">Received Date</th>
                  <th className="py-3 px-3">Supplier Name</th>
                  <th className="py-3 px-3">Supplier Invoice #</th>
                  <th className="py-3 px-3 text-center">Items Received</th>
                  <th className="py-3 px-3 text-right">Total Cost (₹)</th>
                  <th className="py-3 px-3 text-right">Input GST (₹)</th>
                  <th className="py-3 px-3">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No GRN records yet. Click "Create New GRN" to receive stock.
                    </td>
                  </tr>
                ) : (
                  grns.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono-numbers font-bold text-blue-900">
                        {g.grnNo}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono-numbers">
                        {new Date(g.receivedDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{g.supplierName}</td>
                      <td className="py-3 px-3 font-mono-numbers text-slate-700">
                        {g.supplierInvoiceNo}
                      </td>
                      <td className="py-3 px-3 text-center font-mono-numbers">{g.items.length}</td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                        ₹{g.totalCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-emerald-700 font-semibold">
                        ₹{g.inputGST.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{g.receivedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: REORDER SUGGESTIONS */}
      {activeTab === 'reorder' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Low Stock Reorder Suggestions
            </h3>
            <span className="text-xs text-slate-500">
              Formula: Reorder Level = Average Daily Sales &times; Lead Time (Days) + Safety Stock
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Current Stock</th>
                  <th className="py-3 px-3 text-center">Reorder Point</th>
                  <th className="py-3 px-3 text-center">Suggested PO Qty</th>
                  <th className="py-3 px-3 text-right">Cost Rate</th>
                  <th className="py-3 px-3 text-right">Estimated Cost</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reorderSuggestions.map((item) => (
                  <tr key={item.product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {item.product.name}
                      <span className="text-[10px] text-slate-400 font-mono-numbers block">
                        {item.product.code} · Barcode: {item.product.barcode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.product.category}</td>
                    <td className="py-3 px-3 text-center font-mono-numbers font-bold text-amber-700">
                      {item.currentStock} {item.product.unit}
                    </td>
                    <td className="py-3 px-3 text-center font-mono-numbers text-slate-600">
                      {item.reorderLevel} {item.product.unit}
                    </td>
                    <td className="py-3 px-3 text-center font-mono-numbers font-bold text-blue-900">
                      {item.suggestedQty} {item.product.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      ₹{item.product.purchasePrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      ₹{item.estCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setIsNewGRNOpen(true);
                          handleAddGrnLine(item.product);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-900 text-white rounded hover:bg-blue-800"
                      >
                        Inward Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Registered Supermarket Suppliers</h3>
            <span className="text-xs text-slate-500">
              Verified vendor profiles with GSTIN identification
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Vendor Name</th>
                  <th className="py-3 px-3">Contact Person</th>
                  <th className="py-3 px-3">Phone & Email</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3 px-3 text-slate-700">{s.contactPerson}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono-numbers">
                      <div>{s.phone}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-3 px-3 font-mono-numbers font-medium text-slate-800">
                      {s.gstin}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{s.address}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE NEW GRN MODAL */}
      {isNewGRNOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Goods Receipt Note (GRN) Inward Entry
              </h2>
              <button
                onClick={() => setIsNewGRNOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGRN} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (GSTIN: {s.gstin})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Supplier Tax Invoice No
                  </label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    placeholder="e.g. INV/2026/8941"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                    required
                  />
                </div>
              </div>

              {/* Add item to GRN selection */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Add Product to GRN Consignment:
                </label>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) handleAddGrnLine(prod);
                    }}
                    value=""
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="" disabled>
                      -- Choose a product to add --
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code}) · Current: {p.currentStock} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GRN Item Lines Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 w-20 text-center">Qty</th>
                      <th className="p-2 w-24 text-right">Cost Rate</th>
                      <th className="p-2 w-24 text-center">Batch #</th>
                      <th className="p-2 w-28 text-center">Expiry</th>
                      <th className="p-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {grnItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          Select items from dropdown above to add consignment lines.
                        </td>
                      </tr>
                    ) : (
                      grnItems.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold text-slate-900">{line.productName}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setGrnItems((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, quantity: val } : item
                                  )
                                );
                              }}
                              className="w-full p-1 border border-slate-200 rounded text-center font-mono-numbers font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.purchaseRate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setGrnItems((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, purchaseRate: val } : item
                                  )
                                );
                              }}
                              className="w-full p-1 border border-slate-200 rounded text-right font-mono-numbers"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={line.batchNumber}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGrnItems((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, batchNumber: val } : item
                                  )
                                );
                              }}
                              className="w-full p-1 border border-slate-200 rounded text-center font-mono-numbers text-[11px]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={line.expiryDate}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGrnItems((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, expiryDate: val } : item
                                  )
                                );
                              }}
                              className="w-full p-1 border border-slate-200 rounded text-center font-mono-numbers text-[11px]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveGrnLine(idx)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewGRNOpen(false)}
                  className="px-4 py-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grnItems.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 rounded hover:bg-blue-800 disabled:opacity-50"
                >
                  Commit GRN & Increase Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW SUPPLIER MODAL */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Register New Supplier</h3>
              <button
                onClick={() => setIsNewSupplierOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Supplier / Firm Name</label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="e.g. Coimbatore Agri Traders"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Supplier GSTIN</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={newSupplier.gstin}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, gstin: e.target.value.toUpperCase() })
                    }
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address</label>
                <textarea
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierOpen(false)}
                  className="px-4 py-2 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 rounded hover:bg-blue-800"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
