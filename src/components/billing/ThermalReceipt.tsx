/**
 * Thermal Receipt Component
 * Replicates the exact 80mm thermal receipt layout from Figure 7.1 of the SBMS Report
 */

import React from 'react';
import { Invoice, StoreSettings } from '../../types';
import { generateBarcodeSvgPattern } from '../../services/barcodeUtils';
import { Printer, X, Download } from 'lucide-react';

interface ThermalReceiptProps {
  invoice: Invoice;
  settings: StoreSettings;
  isDuplicate?: boolean;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  invoice,
  settings,
  isDuplicate = false,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    // Generate raw ESC/POS style plain text receipt
    const dateFormatted = new Date(invoice.dateTime).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = new Date(invoice.dateTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let txt = `==========================================\n`;
    txt += `          ${settings.storeName}\n`;
    txt += `   ${settings.addressLine1}, ${settings.city} - ${settings.pincode}\n`;
    txt += `       GSTIN: ${settings.gstin}\n`;
    txt += `              TAX INVOICE\n`;
    if (isDuplicate) {
      txt += `          *** DUPLICATE COPY ***\n`;
    }
    txt += `------------------------------------------\n`;
    txt += `Inv No : ${invoice.invoiceNo}\n`;
    txt += `Date   : ${dateFormatted}   Time: ${timeFormatted}\n`;
    txt += `Cashier: ${invoice.cashierName}   ${invoice.counterId}\n`;
    if (invoice.customerName) {
      txt += `Cust   : ${invoice.customerName} (${invoice.customerMobile || ''})\n`;
    }
    if (invoice.isB2B && invoice.customerGSTIN) {
      txt += `Buyer GSTIN: ${invoice.customerGSTIN}\n`;
    }
    txt += `------------------------------------------\n`;
    txt += `Item                   Qty    Rate   Amount\n`;
    txt += `------------------------------------------\n`;

    invoice.lines.forEach((line) => {
      const namePart = line.productName.padEnd(20, ' ').slice(0, 20);
      const qtyPart = String(line.quantity).padStart(5, ' ');
      const ratePart = line.rate.toFixed(2).padStart(8, ' ');
      const amtPart = line.grossAmount.toFixed(2).padStart(9, ' ');
      txt += `${namePart} ${qtyPart} ${ratePart} ${amtPart}\n`;
      if (line.discountAmount > 0) {
        txt += `  Discount                  -${line.discountAmount.toFixed(2).padStart(8, ' ')}\n`;
      }
    });

    txt += `------------------------------------------\n`;
    txt += `Items: ${invoice.lines.length.toString().padEnd(14, ' ')} Gross      ${invoice.grossAmount.toFixed(2).padStart(8, ' ')}\n`;
    if (invoice.discountAmount > 0) {
      txt += `                     Discount   -${invoice.discountAmount.toFixed(2).padStart(8, ' ')}\n`;
    }
    const roundOffSign = invoice.roundOff >= 0 ? '+' : '';
    txt += `                     Round off   ${roundOffSign}${invoice.roundOff.toFixed(2).padStart(7, ' ')}\n`;
    txt += `NET PAYABLE          Rs.        ${invoice.netPayable.toFixed(2).padStart(8, ' ')}\n`;
    txt += `------------------------------------------\n`;
    txt += `GST    Taxable      CGST      SGST\n`;
    invoice.gstSummary.forEach((slab) => {
      const gstStr = `${slab.gstRate}%`.padEnd(6, ' ');
      const taxVal = slab.taxableValue.toFixed(2).padStart(11, ' ');
      const cgstVal = slab.cgst.toFixed(2).padStart(9, ' ');
      const sgstVal = slab.sgst.toFixed(2).padStart(9, ' ');
      txt += `${gstStr}${taxVal}${cgstVal}${sgstVal}\n`;
    });
    txt += `------------------------------------------\n`;

    // Payments line
    const paymentStr = invoice.payments
      .map((p) => `${p.mode.toUpperCase()} ${p.amount.toFixed(2)}`)
      .join('  ');
    txt += `Paid: ${paymentStr}\n`;
    if (invoice.discountAmount > 0) {
      txt += `You saved Rs. ${invoice.discountAmount.toFixed(2)} today\n`;
    }
    txt += `------------------------------------------\n`;
    txt += `${settings.receiptFooterMessage}\n`;
    txt += `==========================================\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${invoice.invoiceNo.replace(/\//g, '_')}.txt`;
    a.click();
  };

  const invoiceDate = new Date(invoice.dateTime);
  const dateFormatted = invoiceDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = invoiceDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const barcodePattern = generateBarcodeSvgPattern(invoice.invoiceNo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[95vh] w-full max-w-md flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Toolbar (hidden during physical print) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-900" />
            <h3 className="font-bold text-slate-800 text-sm">
              Thermal Receipt Preview (80 mm)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadText}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              title="Download text file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded hover:bg-blue-800"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto p-6 bg-slate-100 flex justify-center">
          {/* Printable Thermal Receipt Box */}
          <div
            id="printable-thermal-receipt"
            className="w-[340px] bg-white p-5 shadow-sm font-mono text-[13px] leading-relaxed text-black border border-slate-200"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Header Section */}
            <div className="text-center">
              {isDuplicate && (
                <div className="mb-2 py-0.5 border border-dashed border-red-600 font-bold text-red-600 text-xs">
                  *** DUPLICATE RECEIPT ***
                </div>
              )}
              {invoice.status === 'cancelled' && (
                <div className="mb-2 py-0.5 border border-dashed border-red-600 font-bold text-red-600 text-xs">
                  *** VOID / CANCELLED ***
                </div>
              )}
              <h2 className="font-bold text-base uppercase tracking-wider">
                {settings.storeName}
              </h2>
              <p className="text-[11px] leading-tight mt-0.5">
                {settings.addressLine1}, {settings.city} - {settings.pincode}
              </p>
              <p className="text-[11px] leading-tight">
                GSTIN: {settings.gstin}
              </p>
              <p className="font-bold text-[12px] mt-1 tracking-widest">
                TAX INVOICE
              </p>
            </div>

            <div className="my-2 border-t border-dashed border-black"></div>

            {/* Bill Details */}
            <div className="text-[12px] space-y-0.5">
              <div className="flex justify-between">
                <span>Inv No : {invoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Date : {dateFormatted}</span>
                <span>Time: {timeFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier: {invoice.cashierName.slice(0, 10)}</span>
                <span>{invoice.counterId}</span>
              </div>
              {invoice.customerName && (
                <div className="text-[11px] text-slate-800">
                  Cust : {invoice.customerName} ({invoice.customerMobile || ''})
                </div>
              )}
              {invoice.isB2B && invoice.customerGSTIN && (
                <div className="text-[11px] font-bold text-slate-900">
                  Buyer GSTIN: {invoice.customerGSTIN}
                </div>
              )}
            </div>

            <div className="my-2 border-t border-dashed border-black"></div>

            {/* Item Lines Header */}
            <div className="grid grid-cols-12 text-[11px] font-bold pb-1 border-b border-black">
              <span className="col-span-5">Item</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>

            {/* Item Lines */}
            <div className="divide-y divide-dashed divide-slate-200 py-1 text-[12px]">
              {invoice.lines.map((line, idx) => (
                <div key={idx} className="py-1">
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 truncate font-medium">
                      {line.productName}
                    </span>
                    <span className="col-span-2 text-right font-mono-numbers">
                      {line.quantity}
                    </span>
                    <span className="col-span-2 text-right font-mono-numbers">
                      {line.rate.toFixed(2)}
                    </span>
                    <span className="col-span-3 text-right font-mono-numbers font-semibold">
                      {line.grossAmount.toFixed(2)}
                    </span>
                  </div>
                  {line.discountAmount > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-600 pl-4">
                      <span>Discount</span>
                      <span className="font-mono-numbers">
                        -{line.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="my-2 border-t border-dashed border-black"></div>

            {/* Totals Block */}
            <div className="space-y-1 text-[12px]">
              <div className="flex justify-between">
                <span>Items: {invoice.lines.length}</span>
                <div className="flex gap-4">
                  <span>Gross</span>
                  <span className="font-mono-numbers font-semibold w-16 text-right">
                    {invoice.grossAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Discount</span>
                  <span className="font-mono-numbers w-16 text-right">
                    -{invoice.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>Round off</span>
                <span className="font-mono-numbers w-16 text-right">
                  {invoice.roundOff >= 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                <span>NET PAYABLE</span>
                <span className="font-mono-numbers text-base">
                  Rs. {invoice.netPayable.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="my-2 border-t border-dashed border-black"></div>

            {/* GST Slab Summary Table (Matching Table 5.4) */}
            <div className="text-[11px] space-y-0.5">
              <div className="grid grid-cols-12 font-bold pb-0.5 border-b border-black">
                <span className="col-span-3">GST %</span>
                <span className="col-span-3 text-right">Taxable</span>
                <span className="col-span-3 text-right">CGST</span>
                <span className="col-span-3 text-right">SGST</span>
              </div>
              {invoice.gstSummary.map((slab) => (
                <div key={slab.gstRate} className="grid grid-cols-12 text-[10.5px]">
                  <span className="col-span-3">{slab.gstRate}%</span>
                  <span className="col-span-3 text-right font-mono-numbers">
                    {slab.taxableValue.toFixed(2)}
                  </span>
                  <span className="col-span-3 text-right font-mono-numbers">
                    {slab.cgst.toFixed(2)}
                  </span>
                  <span className="col-span-3 text-right font-mono-numbers">
                    {slab.sgst.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-2 border-t border-dashed border-black"></div>

            {/* Payments & Savings */}
            <div className="text-[11px] space-y-1">
              <div className="font-semibold">
                Paid:{' '}
                {invoice.payments.map((p, i) => (
                  <span key={i} className="mr-2">
                    {p.mode.toUpperCase()} {p.amount.toFixed(2)}
                  </span>
                ))}
              </div>
              {invoice.discountAmount > 0 && (
                <div className="font-bold text-slate-800">
                  You saved Rs. {invoice.discountAmount.toFixed(2)} today
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="mt-3 text-center text-[10.5px] leading-tight space-y-1">
              <p className="font-semibold">Thank you. Visit again!</p>
              <p>Returns within {settings.returnPolicyDays} days with bill</p>
            </div>

            {/* Simulated Barcode */}
            <div className="mt-3 flex flex-col items-center">
              <div className="h-9 w-48 flex items-center justify-center overflow-hidden">
                <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 25">
                  {barcodePattern.split('').map((bit, idx) => (
                    <rect
                      key={idx}
                      x={(idx / barcodePattern.length) * 100}
                      y="0"
                      width={100 / barcodePattern.length}
                      height="25"
                      fill={bit === '1' ? '#000000' : 'transparent'}
                    />
                  ))}
                </svg>
              </div>
              <span className="text-[10px] tracking-widest mt-0.5">{invoice.invoiceNo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
