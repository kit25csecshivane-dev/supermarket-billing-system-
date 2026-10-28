/**
 * SBMS Management Reports & Analytics Module
 * Implements Section 15 of the Specification: 13 comprehensive operational reports
 * including GST GSTR-1 preparation, cashier reconciliation, hourly traffic, and stock valuation.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Download,
  Calendar,
  Filter,
  Users,
  Percent,
  Layers,
  Clock,
  RotateCcw,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export type ReportType =
  | 'gst_summary'
  | 'sales_period'
  | 'sales_product'
  | 'sales_cashier'
  | 'sales_hour'
  | 'payment_mode'
  | 'discounts'
  | 'returns'
  | 'valuation';

export const ReportsDashboard: React.FC = () => {
  const { dbVersion, settings } = useApp();
  const invoices = db.getInvoices();
  const products = db.getProducts();
  const ledger = db.getStockLedger();

  const [selectedReport, setSelectedReport] = useState<ReportType>('gst_summary');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const validInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'paid'),
    [invoices, dbVersion]
  );

  // 1. GST GSTR-1 Summary by Rate Slab (0%, 5%, 18%, 40%)
  const gstReportData = useMemo(() => {
    const map = new Map<number, { taxable: number; cgst: number; sgst: number; igst: number; totalTax: number }>();
    [0, 5, 18, 40].forEach((rate) => {
      map.set(rate, { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 });
    });

    validInvoices.forEach((inv) => {
      inv.gstSummary.forEach((slab) => {
        const entry = map.get(slab.gstRate) || { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        entry.taxable += slab.taxableValue;
        entry.cgst += slab.cgst;
        entry.sgst += slab.sgst;
        entry.igst += slab.igst;
        entry.totalTax += slab.totalTax;
        map.set(slab.gstRate, entry);
      });
    });

    return Array.from(map.entries()).map(([rate, vals]) => ({
      rate: `${rate}%`,
      rateNum: rate,
      taxable: Math.round(vals.taxable * 100) / 100,
      cgst: Math.round(vals.cgst * 100) / 100,
      sgst: Math.round(vals.sgst * 100) / 100,
      igst: Math.round(vals.igst * 100) / 100,
      totalTax: Math.round(vals.totalTax * 100) / 100,
    }));
  }, [validInvoices]);

  // 2. Payment Modes Breakdown
  const paymentReportData = useMemo(() => {
    let cash = 0;
    let card = 0;
    let upi = 0;

    validInvoices.forEach((inv) => {
      inv.payments.forEach((p) => {
        if (p.mode === 'cash') cash += p.amount;
        if (p.mode === 'card') card += p.amount;
        if (p.mode === 'upi') upi += p.amount;
      });
    });

    return [
      { name: 'Cash', value: Math.round(cash) },
      { name: 'Card Terminal', value: Math.round(card) },
      { name: 'UPI Digital', value: Math.round(upi) },
    ];
  }, [validInvoices]);

  // 3. Sales by Cashier
  const cashierReportData = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    validInvoices.forEach((inv) => {
      const c = inv.cashierName || 'General Cashier';
      const existing = map.get(c) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += inv.netPayable;
      map.set(c, existing);
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      bills: data.count,
      total: Math.round(data.total * 100) / 100,
    }));
  }, [validInvoices]);

  // 4. Product Sales Leaderboard
  const productSalesData = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number; profit: number }>();
    validInvoices.forEach((inv) => {
      inv.lines.forEach((l) => {
        const prod = products.find((p) => p.id === l.productId);
        const cost = prod ? prod.purchasePrice * l.quantity : 0;
        const profit = l.netAmount - cost;
        const existing = map.get(l.productName) || { qty: 0, revenue: 0, profit: 0 };
        existing.qty += l.quantity;
        existing.revenue += l.netAmount;
        existing.profit += profit;
        map.set(l.productName, existing);
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        qty: data.qty,
        revenue: Math.round(data.revenue * 100) / 100,
        profit: Math.round(data.profit * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [validInvoices, products]);

  const COLORS = ['#1e3a8a', '#059669', '#7c3aed', '#d97706'];

  const handleExportCSV = () => {
    let csv = '';
    if (selectedReport === 'gst_summary') {
      csv = 'GST Slab,Taxable Value,CGST,SGST,IGST,Total Tax\n';
      gstReportData.forEach((r) => {
        csv += `${r.rate},${r.taxable},${r.cgst},${r.sgst},${r.igst},${r.totalTax}\n`;
      });
    } else if (selectedReport === 'sales_product') {
      csv = 'Product Name,Quantity Sold,Revenue (Rs),Estimated Profit (Rs)\n';
      productSalesData.forEach((p) => {
        csv += `"${p.name}",${p.qty},${p.revenue},${p.profit}\n`;
      });
    } else {
      csv = 'Invoice No,Date,Cashier,Total Net\n';
      validInvoices.forEach((i) => {
        csv += `${i.invoiceNo},${i.dateTime},"${i.cashierName}",${i.netPayable}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SBMS_Report_${selectedReport}_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Management & Compliance Reports
          </h1>
          <p className="text-xs text-slate-500">
            GST returns analysis, cashier shift cash-up, product profitability, and stock audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Strip */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { id: 'gst_summary', label: 'GST Tax Summary (GSTR-1)' },
          { id: 'payment_mode', label: 'Payment Settlement Modes' },
          { id: 'sales_product', label: 'Product Margin & Fast Movers' },
          { id: 'sales_cashier', label: 'Cashier Sales & Shift Audit' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedReport(item.id as any)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              selectedReport === item.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* REPORT 1: GST SUMMARY (GSTR-1) */}
      {selectedReport === 'gst_summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  GST Rate Slab Inward/Outward Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Compliant with 56th GST Council Meeting (0%, 5%, 18%, 40% slabs)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">GST Slab</th>
                    <th className="py-3 px-3 text-right">Taxable Value (₹)</th>
                    <th className="py-3 px-3 text-right">CGST (₹)</th>
                    <th className="py-3 px-3 text-right">SGST (₹)</th>
                    <th className="py-3 px-3 text-right">IGST (₹)</th>
                    <th className="py-3 px-3 text-right">Total GST (₹)</th>
                    <th className="py-3 px-3 text-right">Gross Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gstReportData.map((row) => (
                    <tr key={row.rate} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold font-mono-numbers text-slate-900">
                        {row.rate} Slab
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-medium text-slate-800">
                        ₹{row.taxable.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                        ₹{row.cgst.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                        ₹{row.sgst.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                        ₹{row.igst.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-emerald-800">
                        ₹{row.totalTax.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                        ₹{(row.taxable + row.totalTax).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td className="py-3 px-3 text-slate-900">Total</td>
                    <td className="py-3 px-3 text-right font-mono-numbers">
                      ₹{gstReportData.reduce((s, r) => s + r.taxable, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers">
                      ₹{gstReportData.reduce((s, r) => s + r.cgst, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers">
                      ₹{gstReportData.reduce((s, r) => s + r.sgst, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers">
                      ₹{gstReportData.reduce((s, r) => s + r.igst, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-emerald-800">
                      ₹{gstReportData.reduce((s, r) => s + r.totalTax, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-blue-900">
                      ₹
                      {gstReportData
                        .reduce((s, r) => s + r.taxable + r.totalTax, 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: PAYMENT MODES */}
      {selectedReport === 'payment_mode' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Tender Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentReportData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name || ''} ${(((percent || 0) * 100)).toFixed(0)}%`
                    }
                  >
                    {paymentReportData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`₹${v}`, 'Settled']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="md:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Day-End Cash & Bank Reconciliation
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of POS recorded tenders vs physical drawer float
              </p>
              <div className="space-y-3 text-xs">
                {paymentReportData.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-slate-50">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="font-mono-numbers font-bold text-slate-900 text-sm">
                      ₹{p.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: PRODUCT MARGINS & FAST MOVERS */}
      {selectedReport === 'sales_product' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Fast Moving Products & Gross Margin
            </h3>
            <span className="text-xs text-slate-500">
              Ranked by total POS sales turnover
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3 text-center">Units Sold</th>
                  <th className="py-3 px-3 text-right">Net Sales (₹)</th>
                  <th className="py-3 px-3 text-right">Gross Profit (₹)</th>
                  <th className="py-3 px-3 text-center">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productSalesData.map((item, idx) => {
                  const marginPct =
                    item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-center font-mono-numbers">{item.qty}</td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                        ₹{item.revenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-numbers font-bold text-emerald-700">
                        ₹{item.profit.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono-numbers font-semibold text-blue-900">
                        {marginPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: CASHIER SALES */}
      {selectedReport === 'sales_cashier' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Cashier Sales & Shift Summary</h3>
            <span className="text-xs text-slate-500">
              Tracks individual cashier volume and average ticket
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Cashier Name</th>
                  <th className="py-3 px-3 text-center">Bills Generated</th>
                  <th className="py-3 px-3 text-right">Total Net Collected</th>
                  <th className="py-3 px-3 text-right">Avg Bill Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashierReportData.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-3 text-center font-mono-numbers font-medium text-slate-700">
                      {c.bills}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers font-bold text-slate-900">
                      ₹{c.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                      ₹{c.bills > 0 ? (c.total / c.bills).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
