/**
 * Supermarket Billing and Management System (SBMS)
 * Type Definitions & Domain Models
 * Derived from the SBMS System Study & Report (GST Council 2025/2026 specs)
 */

export type UserRole = 'admin' | 'manager' | 'cashier' | 'store_keeper' | 'accountant';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  counterId?: string;
  pin?: string; // 4-digit manager/user PIN for overrides
  active: boolean;
}

export type UnitOfMeasure = 'Piece' | 'Pack' | 'kg' | 'gram' | 'litre' | 'ml';

export interface BatchInfo {
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
}

export interface Product {
  id: string; // Product code e.g. P00123
  code: string;
  name: string;
  barcode: string;
  additionalBarcodes?: string[];
  category: string;
  brand: string;
  unit: UnitOfMeasure;
  mrp: number; // Maximum retail price (tax inclusive)
  sellingPrice: number; // Price charged (<= MRP)
  purchasePrice: number; // Supplier cost price
  hsnCode: string; // e.g. 0713, 1905, 3305
  gstRate: number; // e.g. 0, 5, 18, 40 (%)
  reorderLevel: number;
  currentStock: number;
  batches?: BatchInfo[];
  active: boolean;
  isWeighed?: boolean; // For vegetables/grains sold by weight
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // Decimal supported (e.g. 1.35 kg)
  unitPrice: number; // Base selling price
  lineDiscount: number; // Specific rupee discount on line
  discountPercent?: number; // e.g. 10%
  selectedBatch?: string;
  expiryDate?: string;
}

export interface GSTBreakdownItem {
  gstRate: number; // 0, 5, 18, 40
  netAmount: number; // Amount inclusive of tax
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface BillingCalculation {
  lineItems: {
    product: Product;
    quantity: number;
    rate: number;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
    taxRate: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  }[];
  totalItemsCount: number;
  grossTotal: number;
  totalLineDiscount: number;
  billDiscount: number;
  couponDiscount: number;
  loyaltyDiscount: number;
  totalDiscount: number;
  taxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  subtotalWithTax: number;
  roundOff: number;
  netPayable: number;
  gstSummary: GSTBreakdownItem[];
  appliedOfferDescription?: string;
}

export type PaymentMode = 'cash' | 'card' | 'upi';

export interface PaymentEntry {
  mode: PaymentMode;
  amount: number;
  reference?: string; // UPI ref / RRN / Card approval code
  cardLast4?: string;
  cardNetwork?: string;
  tenderedCash?: number;
  changeGiven?: number;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  gstin?: string; // For B2B tax invoice
  companyName?: string;
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
}

export type InvoiceStatus = 'paid' | 'held' | 'cancelled' | 'returned';

export interface InvoiceLine {
  productId: string;
  productName: string;
  hsnCode: string;
  unit: string;
  quantity: number;
  rate: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string; // e.g. SMK/2627/004582
  financialYear: string; // e.g. 2627
  dateTime: string; // ISO string
  cashierId: string;
  cashierName: string;
  counterId: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  customerGSTIN?: string;
  isB2B: boolean;
  lines: InvoiceLine[];
  itemCount: number;
  grossAmount: number;
  discountAmount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  netPayable: number;
  payments: PaymentEntry[];
  gstSummary: GSTBreakdownItem[];
  status: InvoiceStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  isDuplicate?: boolean;
}

export type StockMovementType =
  | 'purchase_receipt'
  | 'sale'
  | 'sales_return'
  | 'purchase_return'
  | 'wastage_expiry'
  | 'stock_count_diff'
  | 'manual_adjustment';

export interface StockLedgerEntry {
  id: string;
  productId: string;
  productName: string;
  batchNumber?: string;
  date: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceDoc: string; // e.g. Invoice #, GRN #, Return #
  userId: string;
  userName: string;
  reason?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  active: boolean;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  orderedQty: number;
  purchaseRate: number;
  receivedQty?: number;
  hsnCode: string;
  gstRate: number;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string; // e.g. PO-2026-0042
  supplierId: string;
  supplierName: string;
  orderDate: string;
  status: 'draft' | 'ordered' | 'received' | 'partial' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDate?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNo: string; // e.g. GRN-2026-0089
  poId?: string;
  poNo?: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNo: string;
  invoiceDate: string;
  receivedDate: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    purchaseRate: number;
    mrp: number;
    batchNumber: string;
    expiryDate: string;
    gstRate: number;
  }[];
  totalCost: number;
  inputGST: number;
  receivedBy: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'price_override' | 'line_delete' | 'bill_void' | 'stock_adjustment' | 'tax_change' | 'system_login' | 'sales_return';
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  stateCode: string; // 33 for Tamil Nadu, 27 for Maharashtra, etc.
  phone: string;
  gstin: string;
  fssaiNumber: string;
  receiptHeaderNotice: string;
  receiptFooterMessage: string;
  returnPolicyDays: number;
  isInterStateStore: boolean;
  enableLoyalty: boolean;
  loyaltyPointsPerHundred: number;
  loyaltyRedemptionValue: number; // in ₹ per point
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  type: 'item_percent' | 'item_flat' | 'bill_value' | 'buy_x_get_y' | 'coupon' | 'loyalty';
  description: string;
  discountValue: number; // % or flat ₹
  minBillAmount?: number;
  applicableCategory?: string;
  applicableProductId?: string;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: string;
  endDate: string;
  active: boolean;
}
