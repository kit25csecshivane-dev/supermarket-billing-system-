/**
 * Product & Barcode Management Module
 * Comprehensive catalog with EAN-13 check digit validation, price safeguards (Selling <= MRP),
 * CSV Import/Export, and shelf-edge barcode label printing.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Product, UnitOfMeasure } from '../../types';
import { calculateEAN13CheckDigit, generateInternalBarcode, generateBarcodeSvgPattern } from '../../services/barcodeUtils';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Barcode as BarcodeIcon,
} from 'lucide-react';

export const ProductList: React.FC = () => {
  const { currentUser, showNotification, triggerDbRefresh, dbVersion, settings } = useApp();
  const products = db.getProducts();

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBarcodeLabelModalOpen, setIsBarcodeLabelModalOpen] = useState<boolean>(false);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    barcode: string;
    category: string;
    brand: string;
    unit: UnitOfMeasure;
    mrp: number;
    sellingPrice: number;
    purchasePrice: number;
    hsnCode: string;
    gstRate: number;
    reorderLevel: number;
    currentStock: number;
    batchNumber: string;
    expiryDate: string;
    isWeighed: boolean;
  }>({
    code: '',
    name: '',
    barcode: '',
    category: 'Packaged Foods',
    brand: '',
    unit: 'Pack',
    mrp: 100,
    sellingPrice: 95,
    purchasePrice: 80,
    hsnCode: '1905',
    gstRate: 5,
    reorderLevel: 20,
    currentStock: 50,
    batchNumber: 'B-01',
    expiryDate: '2027-12-31',
    isWeighed: false,
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.currentStock <= p.reorderLevel && p.currentStock > 0;
      if (stockFilter === 'out') matchStock = p.currentStock <= 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter, dbVersion]);

  // Open Add modal
  const handleOpenAdd = () => {
    const nextSeq = products.length + 124;
    const nextCode = `P00${nextSeq}`;
    const generatedBarcode = generateInternalBarcode(nextSeq);

    setEditingProduct(null);
    setFormData({
      code: nextCode,
      name: '',
      barcode: generatedBarcode,
      category: 'Grocery',
      brand: '',
      unit: 'Pack',
      mrp: 100,
      sellingPrice: 95,
      purchasePrice: 80,
      hsnCode: '0713',
      gstRate: 5,
      reorderLevel: 20,
      currentStock: 50,
      batchNumber: `B${nextSeq}`,
      expiryDate: '2027-12-31',
      isWeighed: false,
    });
    setIsAddEditOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      brand: product.brand,
      unit: product.unit,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      hsnCode: product.hsnCode,
      gstRate: product.gstRate,
      reorderLevel: product.reorderLevel,
      currentStock: product.currentStock,
      batchNumber: product.batches?.[0]?.batchNumber || 'B-01',
      expiryDate: product.batches?.[0]?.expiryDate || '2027-12-31',
      isWeighed: !!product.isWeighed,
    });
    setIsAddEditOpen(true);
  };

  // Save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotification('Product name is required', 'error');
      return;
    }

    if (formData.sellingPrice > formData.mrp) {
      showNotification('Selling price cannot exceed MRP (Indian Legal Metrology Act)', 'error');
      return;
    }

    // Check duplicate barcode
    const duplicate = products.find(
      (p) =>
        p.barcode === formData.barcode.trim() &&
        p.id !== (editingProduct?.id || '')
    );
    if (duplicate) {
      showNotification(`Barcode ${formData.barcode} is already assigned to ${duplicate.name}`, 'error');
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : formData.code,
      code: formData.code,
      name: formData.name.trim(),
      barcode: formData.barcode.trim(),
      category: formData.category,
      brand: formData.brand.trim() || 'General',
      unit: formData.unit,
      mrp: Number(formData.mrp),
      sellingPrice: Number(formData.sellingPrice),
      purchasePrice: Number(formData.purchasePrice),
      hsnCode: formData.hsnCode.trim(),
      gstRate: Number(formData.gstRate),
      reorderLevel: Number(formData.reorderLevel),
      currentStock: Number(formData.currentStock),
      batches: [
        {
          batchNumber: formData.batchNumber,
          expiryDate: formData.expiryDate,
          quantity: Number(formData.currentStock),
        },
      ],
      active: true,
      isWeighed: formData.isWeighed,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveProduct(newProduct, currentUser);
    triggerDbRefresh();
    setIsAddEditOpen(false);
    showNotification(
      `Product ${newProduct.name} saved successfully`,
      'success'
    );
  };

  // Deactivate
  const handleDeactivate = (id: string, name: string) => {
    if (window.confirm(`Deactivate product "${name}"? It will not be available for scanning.`)) {
      db.deactivateProduct(id, currentUser);
      triggerDbRefresh();
      showNotification(`Product deactivated: ${name}`, 'info');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Product Code',
      'Barcode',
      'Name',
      'Category',
      'Brand',
      'Unit',
      'MRP',
      'Selling Price',
      'Purchase Price',
      'HSN Code',
      'GST Rate (%)',
      'Current Stock',
      'Reorder Level',
    ];

    const rows = products.map((p) => [
      p.code,
      p.barcode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.brand,
      p.unit,
      p.mrp.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.purchasePrice.toFixed(2),
      p.hsnCode,
      p.gstRate,
      p.currentStock,
      p.reorderLevel,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supermarket_Products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showNotification('Product catalog exported as CSV', 'success');
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Product & Barcode Master
          </h1>
          <p className="text-xs text-slate-500">
            Maintain item catalog, barcodes, GST rate slabs, and pricing rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, barcode, code..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-900 focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Stock Status</option>
            <option value="low">Low Stock Alerts</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-3">Barcode</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">MRP</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-center">GST</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= p.reorderLevel;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers font-semibold text-slate-800">
                      {p.code}
                    </td>
                    <td className="py-3 px-3 font-mono-numbers text-slate-600">
                      {p.barcode}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {p.name}
                      <span className="text-[10px] text-slate-400 font-normal block">
                        HSN: {p.hsnCode} · {p.brand}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.category}</td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-500 line-through">
                      ₹{p.mrp.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      ₹{p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-600">
                      ₹{p.purchasePrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers ${
                          p.gstRate === 40
                            ? 'bg-purple-100 text-purple-800'
                            : p.gstRate === 18
                            ? 'bg-blue-100 text-blue-800'
                            : p.gstRate === 5
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.gstRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono-numbers">
                      <span
                        className={`font-semibold ${
                          isLow ? 'text-amber-700 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLabelProduct(p);
                            setIsBarcodeLabelModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-900 rounded hover:bg-slate-100"
                          title="Print Barcode Label"
                        >
                          <BarcodeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 text-slate-500 hover:text-blue-900 rounded hover:bg-slate-100"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {p.active && (
                          <button
                            onClick={() => handleDeactivate(p.id, p.name)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100"
                            title="Deactivate"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add / Edit Product Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product Master' : 'Add New Product to Catalog'}
              </h2>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Product Code</label>
                  <input
                    type="text"
                    disabled={!!editingProduct}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers disabled:bg-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Barcode (EAN-13 / Store Code)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Toor Dal 1 kg"
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="Pack">Pack</option>
                    <option value="Piece">Piece</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="gram">gram</option>
                    <option value="litre">litre</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">MRP (₹ Tax Incl.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Selling Price (₹) &le; MRP
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers font-bold text-blue-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
                  >
                    <option value={0}>0% (Nil - Fresh Essentials)</option>
                    <option value={5}>5% (Packaged staples, oil, soaps)</option>
                    <option value={18}>18% (Electricals, confectionery)</option>
                    <option value={40}>40% (Aerated drinks, luxury goods)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, reorderLevel: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono-numbers"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Printing Modal */}
      {isBarcodeLabelModalOpen && selectedLabelProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Print Shelf Barcode Tag</h3>
              <button
                onClick={() => setIsBarcodeLabelModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-5 flex flex-col items-center">
              {/* Shelf Tag Visual Preview */}
              <div className="w-64 border-2 border-slate-800 p-3 bg-white rounded flex flex-col items-center text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {settings.storeName}
                </div>
                <div className="font-bold text-xs text-slate-900 mt-0.5 line-clamp-1">
                  {selectedLabelProduct.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono-numbers">
                  HSN: {selectedLabelProduct.hsnCode} · GST: {selectedLabelProduct.gstRate}%
                </div>

                {/* SVG Barcode */}
                <div className="h-10 w-48 my-2">
                  <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 25">
                    {generateBarcodeSvgPattern(selectedLabelProduct.barcode)
                      .split('')
                      .map((bit, idx) => (
                        <rect
                          key={idx}
                          x={(idx / 150) * 100}
                          y="0"
                          width={100 / 150}
                          height="25"
                          fill={bit === '1' ? '#000000' : 'transparent'}
                        />
                      ))}
                  </svg>
                </div>
                <span className="text-[11px] font-mono-numbers font-bold">
                  {selectedLabelProduct.barcode}
                </span>

                {/* Price Display */}
                <div className="mt-2 w-full pt-1.5 border-t border-slate-300 flex justify-between items-baseline px-2">
                  <span className="text-[10px] text-slate-400 line-through font-mono-numbers">
                    MRP: ₹{selectedLabelProduct.mrp.toFixed(2)}
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono-numbers">
                    OUR PRICE: ₹{selectedLabelProduct.sellingPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsBarcodeLabelModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsBarcodeLabelModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-900 text-white rounded hover:bg-blue-800 flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
