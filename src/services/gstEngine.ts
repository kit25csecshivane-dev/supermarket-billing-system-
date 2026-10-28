/**
 * Supermarket Billing and Management System (SBMS)
 * GST Calculation Engine
 * Complies with GST Council India (56th Meeting 2025/2026 Slabs: 0%, 5%, 18%, 40%)
 * Implements Chapter 5 specifications of the SBMS System Study Report.
 */

import { CartItem, BillingCalculation, GSTBreakdownItem } from '../types';

/**
 * Rounds a number to 2 decimal places safely without floating point drift
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Rounds to nearest integer rupee with signed round-off calculation
 */
export function calculateRoundOff(netAmount: number): { roundedTotal: number; roundOff: number } {
  const roundedTotal = Math.round(netAmount);
  const roundOff = round2(roundedTotal - netAmount);
  return { roundedTotal, roundOff };
}

export interface CalculationOptions {
  isInterState?: boolean; // If true, IGST is used instead of CGST + SGST
  billDiscountRupees?: number; // Optional flat bill-level discount
  couponDiscountRupees?: number; // Optional coupon code discount
  loyaltyPointsRedeemed?: number; // Points redeemed (₹1 each)
  appliedOfferName?: string;
}

/**
 * Calculates line-by-line figures, slab-wise GST breakdown, and final totals.
 * Applies exact tax-inclusive formulas:
 * Taxable Value = Net / (1 + Rate)
 * GST Amount = Net - Taxable Value
 * CGST = GST / 2
 * SGST = GST - CGST (extra paisa awarded to SGST)
 */
export function calculateBill(
  items: CartItem[],
  options: CalculationOptions = {}
): BillingCalculation {
  const isInterState = !!options.isInterState;
  const billDiscount = round2(options.billDiscountRupees || 0);
  const couponDiscount = round2(options.couponDiscountRupees || 0);
  const loyaltyDiscount = round2(options.loyaltyPointsRedeemed || 0);

  // 1. First pass: compute line gross and line discounts
  let rawGrossTotal = 0;
  let totalLineDiscount = 0;
  let totalItemsCount = 0;

  const preLines = items.map((item) => {
    const qty = item.quantity;
    totalItemsCount += qty;
    const gross = round2(qty * item.unitPrice);
    
    // Line discount: either direct rupee discount or percentage discount
    let discount = round2(item.lineDiscount || 0);
    if (item.discountPercent && item.discountPercent > 0) {
      discount = round2(gross * (item.discountPercent / 100));
    }
    // Prevent discount > gross
    discount = Math.min(discount, gross);
    const netBeforeBillDiscount = round2(gross - discount);

    rawGrossTotal = round2(rawGrossTotal + gross);
    totalLineDiscount = round2(totalLineDiscount + discount);

    return {
      item,
      qty,
      gross,
      discount,
      netBeforeBillDiscount,
      gstRate: item.product.gstRate,
    };
  });

  const totalBillLevelDiscounts = round2(billDiscount + couponDiscount + loyaltyDiscount);
  const netAfterLineDiscounts = round2(rawGrossTotal - totalLineDiscount);

  // Distribute bill-level discount proportionally across lines to maintain tax integrity
  const lines = preLines.map((line) => {
    let allocatedBillDiscount = 0;
    if (netAfterLineDiscounts > 0 && totalBillLevelDiscounts > 0) {
      allocatedBillDiscount = round2(
        (line.netBeforeBillDiscount / netAfterLineDiscounts) * totalBillLevelDiscounts
      );
    }
    const finalLineDiscount = round2(line.discount + allocatedBillDiscount);
    const lineNet = round2(Math.max(0, line.gross - finalLineDiscount));

    return {
      ...line,
      allocatedBillDiscount,
      finalLineDiscount,
      lineNet,
    };
  });

  // 2. Group by GST rate slab to calculate tax per slab (matching Section 5.4/5.5)
  const slabMap = new Map<number, { netAmount: number }>();

  // Ensure default slabs exist in display order: 0, 5, 18, 40
  [0, 5, 18, 40].forEach((rate) => {
    slabMap.set(rate, { netAmount: 0 });
  });

  lines.forEach((line) => {
    const rate = line.gstRate;
    const current = slabMap.get(rate) || { netAmount: 0 };
    current.netAmount = round2(current.netAmount + line.lineNet);
    slabMap.set(rate, current);
  });

  const gstSummary: GSTBreakdownItem[] = [];
  let aggregateTaxable = 0;
  let aggregateCGST = 0;
  let aggregateSGST = 0;
  let aggregateIGST = 0;
  let aggregateTotalTax = 0;

  // Process all rates that have transactions (or show standard rates if non-zero)
  Array.from(slabMap.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([rate, data]) => {
      if (data.netAmount <= 0) return;

      const netAmount = data.netAmount;
      let taxableValue: number;
      let totalTax: number;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (rate === 0) {
        taxableValue = netAmount;
        totalTax = 0;
      } else {
        const rateFactor = rate / 100;
        // Taxable value = Net / (1 + GST rate)
        taxableValue = round2(netAmount / (1 + rateFactor));
        // GST amount = Net - Taxable value
        totalTax = round2(netAmount - taxableValue);

        if (isInterState) {
          igst = totalTax;
        } else {
          // Half for CGST, remaining for SGST to preserve total paise
          const halfTaxPaise = Math.floor(Math.round(totalTax * 100) / 2);
          cgst = round2(halfTaxPaise / 100);
          sgst = round2(totalTax - cgst);
        }
      }

      aggregateTaxable = round2(aggregateTaxable + taxableValue);
      aggregateCGST = round2(aggregateCGST + cgst);
      aggregateSGST = round2(aggregateSGST + sgst);
      aggregateIGST = round2(aggregateIGST + igst);
      aggregateTotalTax = round2(aggregateTotalTax + totalTax);

      gstSummary.push({
        gstRate: rate,
        netAmount,
        taxableValue,
        cgst,
        sgst,
        igst,
        totalTax,
      });
    });

  // Calculate detailed line tax outputs
  const calculatedLineItems = lines.map((l) => {
    const rateFactor = l.gstRate / 100;
    const taxable = l.gstRate === 0 ? l.lineNet : round2(l.lineNet / (1 + rateFactor));
    const tax = round2(l.lineNet - taxable);
    const cgst = isInterState ? 0 : round2(tax / 2);
    const sgst = isInterState ? 0 : round2(tax - cgst);
    const igst = isInterState ? tax : 0;

    return {
      product: l.item.product,
      quantity: l.qty,
      rate: l.item.unitPrice,
      grossAmount: l.gross,
      discountAmount: l.finalLineDiscount,
      netAmount: l.lineNet,
      taxRate: l.gstRate,
      taxableValue: taxable,
      cgst,
      sgst,
      igst,
      totalTax: tax,
    };
  });

  const totalDiscount = round2(totalLineDiscount + totalBillLevelDiscounts);
  const netBeforeRoundOff = round2(rawGrossTotal - totalDiscount);
  const { roundedTotal, roundOff } = calculateRoundOff(netBeforeRoundOff);

  return {
    lineItems: calculatedLineItems,
    totalItemsCount: round2(totalItemsCount),
    grossTotal: rawGrossTotal,
    totalLineDiscount,
    billDiscount,
    couponDiscount,
    loyaltyDiscount,
    totalDiscount,
    taxableValue: aggregateTaxable,
    totalCGST: aggregateCGST,
    totalSGST: aggregateSGST,
    totalIGST: aggregateIGST,
    totalGST: aggregateTotalTax,
    subtotalWithTax: netBeforeRoundOff,
    roundOff,
    netPayable: roundedTotal,
    gstSummary,
    appliedOfferDescription: options.appliedOfferName,
  };
}
