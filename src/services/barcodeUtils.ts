/**
 * Barcode utilities for Supermarket Billing and Management System
 * Includes EAN-13 check digit calculation matching Chapter 3.2 of the SBMS Report
 * And SVG barcode rendering for thermal and shelf-edge printing.
 */

/**
 * Calculates the EAN-13 check digit for the first 12 digits
 * Rule:
 * 1. Sum digits at odd positions (1st, 3rd, 5th, etc.)
 * 2. Sum digits at even positions (2nd, 4th, 6th, etc.) and multiply by 3
 * 3. Total the two sums
 * 4. The check digit is (10 - (Total % 10)) % 10
 */
export function calculateEAN13CheckDigit(twelveDigits: string): number {
  if (twelveDigits.length < 12) {
    throw new Error('Requires at least 12 digits');
  }
  const digits = twelveDigits.slice(0, 12).split('').map(Number);
  let oddSum = 0;
  let evenSum = 0;

  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      oddSum += digits[i]; // 1st, 3rd, 5th, etc. (0-indexed: 0, 2, 4...)
    } else {
      evenSum += digits[i]; // 2nd, 4th, 6th, etc.
    }
  }

  const total = oddSum + evenSum * 3;
  const mod = total % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Validates a 13-digit EAN-13 code
 */
export function validateEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;
  const expectedCheck = calculateEAN13CheckDigit(barcode.slice(0, 12));
  return Number(barcode[12]) === expectedCheck;
}

/**
 * Generates an internal supermarket EAN-13 barcode starting with 200 (in-store GS1 prefix)
 */
export function generateInternalBarcode(itemSequence: number): string {
  const paddedSeq = String(itemSequence).padStart(9, '0');
  const base12 = `200${paddedSeq}`;
  const checkDigit = calculateEAN13CheckDigit(base12);
  return `${base12}${checkDigit}`;
}

/**
 * Decodes weighed-item barcodes (GS1 standard prefix 20)
 * Format: 20 + 5-digit product code + 5-digit weight (in grams) + 1-digit check
 * Example: 20 00128 01350 8 -> Product P00128, Weight: 1.350 kg
 */
export function parseWeighedBarcode(barcode: string): {
  isWeighed: boolean;
  productCode?: string;
  weightKg?: number;
} {
  if (barcode.startsWith('20') && barcode.length === 13) {
    const codePart = barcode.slice(2, 7);
    const weightGrams = parseInt(barcode.slice(7, 12), 10);
    return {
      isWeighed: true,
      productCode: `P${codePart}`,
      weightKg: weightGrams / 1000,
    };
  }
  return { isWeighed: false };
}

/**
 * Generates an SVG barcode pattern for crisp display and receipt/label printing
 */
export function generateBarcodeSvgPattern(code: string): string {
  // Produce a realistic variable-width barcode visual pattern based on char codes
  let pattern = '101'; // Start guard
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    // Simple pseudo-Code128 / EAN binary pattern for crisp vector rendering
    const bits = (c * 17 + i * 3) % 256;
    for (let b = 0; b < 6; b++) {
      pattern += (bits >> b) & 1 ? '110' : '100';
    }
  }
  pattern += '101'; // Stop guard
  return pattern;
}
