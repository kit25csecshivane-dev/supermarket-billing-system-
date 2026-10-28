/**
 * Supermarket Billing and Management System (SBMS)
 * Transactional Data Layer with Realistic Seed Data, FEFO Inventory,
 * Sequential Invoicing, Audit Logging, and Local Persistence.
 */

import {
  Product,
  Invoice,
  StockLedgerEntry,
  Customer,
  Supplier,
  PurchaseOrder,
  GoodsReceiptNote,
  AuditLogEntry,
  StoreSettings,
  Offer,
  User,
  BillingCalculation,
  PaymentEntry,
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'sbms_products_v2',
  INVOICES: 'sbms_invoices_v2',
  STOCK_LEDGER: 'sbms_stock_ledger_v2',
  CUSTOMERS: 'sbms_customers_v2',
  SUPPLIERS: 'sbms_suppliers_v2',
  PURCHASE_ORDERS: 'sbms_po_v2',
  GRN: 'sbms_grn_v2',
  AUDIT_LOGS: 'sbms_audit_logs_v2',
  SETTINGS: 'sbms_settings_v2',
  OFFERS: 'sbms_offers_v2',
  HELD_BILLS: 'sbms_held_bills_v2',
  INVOICE_COUNTER: 'sbms_inv_seq_v2',
};

// Default Store Profile
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'SMK FRESH SUPERMARKET',
  branchName: 'Main Bazaar Branch',
  addressLine1: '12, Market Road',
  addressLine2: 'Gandhipuram',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  pincode: '641 001',
  stateCode: '33',
  phone: '+91 422 2345678',
  gstin: '33ABCDE1234F1Z5',
  fssaiNumber: '12426002000341',
  receiptHeaderNotice: 'TAX INVOICE',
  receiptFooterMessage: 'Thank you. Visit again!\nReturns within 7 days with bill.',
  returnPolicyDays: 7,
  isInterStateStore: false,
  enableLoyalty: true,
  loyaltyPointsPerHundred: 1,
  loyaltyRedemptionValue: 1,
};

// Seed Users for all 5 roles
export const INITIAL_USERS: User[] = [
  {
    id: 'U001',
    username: 'admin',
    name: 'Rajesh Kumar',
    role: 'admin',
    pin: '9999',
    active: true,
  },
  {
    id: 'U002',
    username: 'manager',
    name: 'Priya Sharma',
    role: 'manager',
    pin: '1234',
    active: true,
  },
  {
    id: 'U003',
    username: 'cashier1',
    name: 'Arun Patel',
    role: 'cashier',
    counterId: 'Counter 02',
    pin: '0000',
    active: true,
  },
  {
    id: 'U004',
    username: 'store',
    name: 'Murugan S',
    role: 'store_keeper',
    pin: '5678',
    active: true,
  },
  {
    id: 'U005',
    username: 'accountant',
    name: 'Ananya Rao',
    role: 'accountant',
    pin: '4321',
    active: true,
  },
];

// Seed Products matching Table 5.3 & standard Indian supermarket inventory
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P00123',
    code: 'P00123',
    name: 'Toor Dal 1 kg',
    barcode: '8901234567890',
    additionalBarcodes: ['8901234567800'],
    category: 'Pulses & Grains',
    brand: 'SMK Select',
    unit: 'Pack',
    mrp: 165.0,
    sellingPrice: 158.0,
    purchasePrice: 141.0,
    hsnCode: '0713',
    gstRate: 5,
    reorderLevel: 20,
    currentStock: 145,
    batches: [{ batchNumber: 'B245', expiryDate: '2027-03-31', quantity: 145 }],
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00124',
    code: 'P00124',
    name: 'Biscuits 100 g',
    barcode: '8901030012345',
    category: 'Bakery & Biscuits',
    brand: 'Britannia Good Day',
    unit: 'Pack',
    mrp: 30.0,
    sellingPrice: 30.0,
    purchasePrice: 24.0,
    hsnCode: '1905',
    gstRate: 5,
    reorderLevel: 50,
    currentStock: 280,
    batches: [{ batchNumber: 'B902', expiryDate: '2026-12-15', quantity: 280 }],
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00125',
    code: 'P00125',
    name: 'Shampoo 180 ml',
    barcode: '8901030098765',
    category: 'Personal Care',
    brand: 'Clinic Plus',
    unit: 'Piece',
    mrp: 220.0,
    sellingPrice: 209.6,
    purchasePrice: 175.0,
    hsnCode: '3305',
    gstRate: 5,
    reorderLevel: 15,
    currentStock: 42,
    batches: [{ batchNumber: 'SH110', expiryDate: '2027-08-31', quantity: 42 }],
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00126',
    code: 'P00126',
    name: 'Cold Drink 600 ml',
    barcode: '8901764012012',
    category: 'Beverages',
    brand: 'Thums Up',
    unit: 'Piece',
    mrp: 40.0,
    sellingPrice: 40.0,
    purchasePrice: 32.0,
    hsnCode: '2202',
    gstRate: 40, // 40% Sin/Aerated Goods GST Slab
    reorderLevel: 30,
    currentStock: 95,
    batches: [{ batchNumber: 'CD04', expiryDate: '2026-11-20', quantity: 95 }],
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00127',
    code: 'P00127',
    name: 'LED Bulb 9 W',
    barcode: '8902894561234',
    category: 'Electrical & Home',
    brand: 'Philips CorePro',
    unit: 'Piece',
    mrp: 140.0,
    sellingPrice: 120.0,
    purchasePrice: 95.0,
    hsnCode: '8539',
    gstRate: 18, // 18% General Standard GST Slab
    reorderLevel: 10,
    currentStock: 35,
    batches: [{ batchNumber: 'PH-9W', expiryDate: '2029-12-31', quantity: 35 }],
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00128',
    code: 'P00128',
    name: 'Tomato (loose)',
    barcode: '2000001001358', // 20 prefix + 00001 + 01350g + 8 check
    additionalBarcodes: ['2000128000000', '8900000000128'],
    category: 'Fresh Vegetables',
    brand: 'Local Farm Fresh',
    unit: 'kg',
    mrp: 40.0,
    sellingPrice: 40.0,
    purchasePrice: 28.0,
    hsnCode: '0702',
    gstRate: 0, // 0% Nil Rate Slab for fresh produce
    reorderLevel: 25,
    currentStock: 85.5,
    batches: [{ batchNumber: 'LOT-TOM-01', expiryDate: '2026-10-31', quantity: 85.5 }],
    active: true,
    isWeighed: true,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00129',
    code: 'P00129',
    name: 'Basmati Rice 5 kg',
    barcode: '8901112223334',
    category: 'Pulses & Grains',
    brand: 'India Gate Classic',
    unit: 'Pack',
    mrp: 680.0,
    sellingPrice: 625.0,
    purchasePrice: 530.0,
    hsnCode: '1006',
    gstRate: 5,
    reorderLevel: 15,
    currentStock: 48,
    batches: [{ batchNumber: 'IG-2026', expiryDate: '2028-06-30', quantity: 48 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00130',
    code: 'P00130',
    name: 'Sunflower Oil 1 L',
    barcode: '8901234005566',
    category: 'Edible Oils',
    brand: 'Fortune Sunlite',
    unit: 'Pack',
    mrp: 175.0,
    sellingPrice: 162.0,
    purchasePrice: 145.0,
    hsnCode: '1512',
    gstRate: 5,
    reorderLevel: 25,
    currentStock: 64,
    batches: [{ batchNumber: 'FO-99', expiryDate: '2027-04-30', quantity: 64 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00131',
    code: 'P00131',
    name: 'Aashirvaad Shudh Chakki Atta 5 kg',
    barcode: '8901030055443',
    category: 'Flours & Grains',
    brand: 'Aashirvaad',
    unit: 'Pack',
    mrp: 260.0,
    sellingPrice: 245.0,
    purchasePrice: 215.0,
    hsnCode: '1101',
    gstRate: 5,
    reorderLevel: 20,
    currentStock: 52,
    batches: [{ batchNumber: 'AT-881', expiryDate: '2027-02-28', quantity: 52 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00132',
    code: 'P00132',
    name: 'Tata Salt 1 kg',
    barcode: '8901030077889',
    category: 'Spices & Essentials',
    brand: 'Tata Salt',
    unit: 'Pack',
    mrp: 28.0,
    sellingPrice: 28.0,
    purchasePrice: 22.5,
    hsnCode: '2501',
    gstRate: 0,
    reorderLevel: 50,
    currentStock: 120,
    batches: [{ batchNumber: 'TS-44', expiryDate: '2028-12-31', quantity: 120 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00133',
    code: 'P00133',
    name: 'Nandini Toned Milk 500 ml',
    barcode: '8901234099887',
    category: 'Dairy',
    brand: 'KMF Nandini',
    unit: 'Pack',
    mrp: 24.0,
    sellingPrice: 24.0,
    purchasePrice: 22.0,
    hsnCode: '0401',
    gstRate: 0,
    reorderLevel: 40,
    currentStock: 30, // Low stock warning!
    batches: [{ batchNumber: 'MK-TODAY', expiryDate: '2026-10-29', quantity: 30 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00134',
    code: 'P00134',
    name: 'Amul Butter Pasteurised 500 g',
    barcode: '8901262010053',
    category: 'Dairy',
    brand: 'Amul',
    unit: 'Pack',
    mrp: 275.0,
    sellingPrice: 268.0,
    purchasePrice: 238.0,
    hsnCode: '0405',
    gstRate: 5,
    reorderLevel: 15,
    currentStock: 22,
    batches: [{ batchNumber: 'AM-BT', expiryDate: '2026-11-05', quantity: 22 }], // Near expiry!
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00135',
    code: 'P00135',
    name: 'Dettol Original Handwash 200 ml',
    barcode: '8901396001234',
    category: 'Personal Care',
    brand: 'Dettol',
    unit: 'Piece',
    mrp: 99.0,
    sellingPrice: 89.0,
    purchasePrice: 72.0,
    hsnCode: '3401',
    gstRate: 5,
    reorderLevel: 20,
    currentStock: 8, // Very low stock!
    batches: [{ batchNumber: 'DT-HW', expiryDate: '2027-09-30', quantity: 8 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00136',
    code: 'P00136',
    name: 'Mysore Sandal Soap 150 g',
    barcode: '8901234112233',
    category: 'Personal Care',
    brand: 'KSDL Mysore Sandal',
    unit: 'Piece',
    mrp: 85.0,
    sellingPrice: 80.0,
    purchasePrice: 66.0,
    hsnCode: '3401',
    gstRate: 5,
    reorderLevel: 25,
    currentStock: 50,
    batches: [{ batchNumber: 'MS-SOAP', expiryDate: '2028-05-31', quantity: 50 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00137',
    code: 'P00137',
    name: 'Surf Excel Easy Wash 1 kg',
    barcode: '8901030445566',
    category: 'Household Care',
    brand: 'Surf Excel',
    unit: 'Pack',
    mrp: 145.0,
    sellingPrice: 138.0,
    purchasePrice: 115.0,
    hsnCode: '3402',
    gstRate: 18,
    reorderLevel: 20,
    currentStock: 35,
    batches: [{ batchNumber: 'SF-101', expiryDate: '2028-10-31', quantity: 35 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00138',
    code: 'P00138',
    name: 'Red Label Tea 500 g',
    barcode: '8901030332211',
    category: 'Beverages',
    brand: 'Brooke Bond Red Label',
    unit: 'Pack',
    mrp: 260.0,
    sellingPrice: 240.0,
    purchasePrice: 205.0,
    hsnCode: '0902',
    gstRate: 5,
    reorderLevel: 20,
    currentStock: 45,
    batches: [{ batchNumber: 'RL-500', expiryDate: '2027-11-30', quantity: 45 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00139',
    code: 'P00139',
    name: 'Maggi 2-Minute Masala Noodles 280 g',
    barcode: '8901058863214',
    category: 'Packaged Foods',
    brand: 'Nestlé Maggi',
    unit: 'Pack',
    mrp: 60.0,
    sellingPrice: 56.0,
    purchasePrice: 47.0,
    hsnCode: '1902',
    gstRate: 5,
    reorderLevel: 40,
    currentStock: 78,
    batches: [{ batchNumber: 'MG-280', expiryDate: '2027-01-31', quantity: 78 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00140',
    code: 'P00140',
    name: 'Cadbury Dairy Milk Silk 150 g',
    barcode: '8901233024567',
    category: 'Chocolates & Confectionery',
    brand: 'Cadbury',
    unit: 'Piece',
    mrp: 195.0,
    sellingPrice: 185.0,
    purchasePrice: 152.0,
    hsnCode: '1806',
    gstRate: 18,
    reorderLevel: 25,
    currentStock: 60,
    batches: [{ batchNumber: 'CB-SILK', expiryDate: '2027-04-15', quantity: 60 }],
    active: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00141',
    code: 'P00141',
    name: 'Potato (loose)',
    barcode: '2000002002505',
    additionalBarcodes: ['2000141000000'],
    category: 'Fresh Vegetables',
    brand: 'Ooty Farm Direct',
    unit: 'kg',
    mrp: 35.0,
    sellingPrice: 32.0,
    purchasePrice: 22.0,
    hsnCode: '0701',
    gstRate: 0,
    reorderLevel: 30,
    currentStock: 110,
    batches: [{ batchNumber: 'POT-01', expiryDate: '2026-11-10', quantity: 110 }],
    active: true,
    isWeighed: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00142',
    code: 'P00142',
    name: 'Onion (loose)',
    barcode: '2000003001802',
    additionalBarcodes: ['2000142000000'],
    category: 'Fresh Vegetables',
    brand: 'Nasik Red',
    unit: 'kg',
    mrp: 45.0,
    sellingPrice: 42.0,
    purchasePrice: 30.0,
    hsnCode: '0703',
    gstRate: 0,
    reorderLevel: 30,
    currentStock: 95,
    batches: [{ batchNumber: 'ON-01', expiryDate: '2026-11-12', quantity: 95 }],
    active: true,
    isWeighed: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'P00143',
    code: 'P00143',
    name: 'Shimla Apple Royal Delicious 1 kg',
    barcode: '2000004001004',
    category: 'Fresh Fruits',
    brand: 'Shimla Orchards',
    unit: 'kg',
    mrp: 180.0,
    sellingPrice: 165.0,
    purchasePrice: 125.0,
    hsnCode: '0808',
    gstRate: 0,
    reorderLevel: 15,
    currentStock: 28,
    batches: [{ batchNumber: 'AP-SH', expiryDate: '2026-11-04', quantity: 28 }],
    active: true,
    isWeighed: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Sri Lakshmi Agro Commodities',
    contactPerson: 'Senthil Nathan',
    phone: '+91 94431 88990',
    email: 'orders@srilakshmiagro.com',
    address: '45, Goods Shed Road, Coimbatore - 641 001',
    gstin: '33AAAAA0000A1Z5',
    active: true,
  },
  {
    id: 'SUP002',
    name: 'Hindustan Unilever Dist. Ltd.',
    contactPerson: 'Karthik Raja',
    phone: '+91 98422 11223',
    email: 'cbe.dist@huldistributors.in',
    address: 'Plot 12, SIDCO Industrial Estate, Coimbatore',
    gstin: '33BBBBB1111B2Z4',
    active: true,
  },
  {
    id: 'SUP003',
    name: 'Britannia & FMCG Wholesale Corp',
    contactPerson: 'Manoj Verma',
    phone: '+91 97890 33445',
    email: 'supply@fmcgwholesale.in',
    address: '88, Mettupalayam Road, Coimbatore',
    gstin: '33CCCCC2222C3Z3',
    active: true,
  },
  {
    id: 'SUP004',
    name: 'Philips & Surya Electricals Depot',
    contactPerson: 'Gopalakrishnan',
    phone: '+91 99944 55667',
    email: 'orders@suryadepot.com',
    address: '22, Mill Road, Coimbatore',
    gstin: '33DDDDD3333D4Z2',
    active: true,
  },
  {
    id: 'SUP005',
    name: 'Nilgiris Farmer Producer Co.',
    contactPerson: 'Ravi Chandran',
    phone: '+91 98430 77889',
    email: 'procure@nilgirisfresh.org',
    address: 'Vegetable Market Yard, Mettupalayam',
    gstin: '33EEEEE4444E5Z1',
    active: true,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST001',
    name: 'Arunachalam K',
    mobile: '9842100001',
    email: 'arunachalam@example.com',
    loyaltyPoints: 340,
    totalSpent: 12450,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'CUST002',
    name: 'Meenakshi Sundaram',
    mobile: '9876543210',
    email: 'meenakshi@example.com',
    loyaltyPoints: 150,
    totalSpent: 8900,
    createdAt: '2026-04-12T11:20:00Z',
  },
  {
    id: 'CUST003',
    name: 'Annapoorna Caterers & Restaurant',
    mobile: '9443212345',
    email: 'accounts@annapoornarestaurant.in',
    companyName: 'Annapoorna Caterers Pvt Ltd',
    gstin: '33AAACR1234F1Z8', // B2B customer!
    loyaltyPoints: 1250,
    totalSpent: 94600,
    createdAt: '2026-02-15T09:00:00Z',
  },
];

export const INITIAL_OFFERS: Offer[] = [
  {
    id: 'OFF001',
    code: 'WELCOME50',
    title: 'Welcome Shopping Bonus',
    type: 'coupon',
    description: 'Flat ₹50 off on minimum purchase of ₹500',
    discountValue: 50,
    minBillAmount: 500,
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    active: true,
  },
  {
    id: 'OFF002',
    code: 'FESTIVE100',
    title: 'Festive Shopping Mega Discount',
    type: 'coupon',
    description: 'Flat ₹100 off on shopping above ₹1,000',
    discountValue: 100,
    minBillAmount: 1000,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    active: true,
  },
  {
    id: 'OFF003',
    code: 'BISCUIT10',
    title: 'Biscuits Special 10% Off',
    type: 'item_percent',
    description: '10% discount on Britannia Biscuits',
    discountValue: 10,
    applicableProductId: 'P00124',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    active: true,
  },
  {
    id: 'OFF004',
    code: 'SUPER50',
    title: 'Super Saver Bill Discount',
    type: 'bill_value',
    description: 'Flat ₹50 discount when cart crosses ₹1,000',
    discountValue: 50,
    minBillAmount: 1000,
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    active: true,
  },
  {
    id: 'OFF005',
    code: 'LOYALTY_MEMBER',
    title: 'Super Club Membership Privilege',
    type: 'loyalty',
    description: '2% instant discount on total bill for registered club members',
    discountValue: 2,
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    active: true,
  },
];

// Helper to safely load and save from LocalStorage
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export class SupermarketDatabase {
  private products: Product[];
  private invoices: Invoice[];
  private stockLedger: StockLedgerEntry[];
  private customers: Customer[];
  private suppliers: Supplier[];
  private purchaseOrders: PurchaseOrder[];
  private grns: GoodsReceiptNote[];
  private auditLogs: AuditLogEntry[];
  private settings: StoreSettings;
  private offers: Offer[];
  private heldBills: { id: string; name: string; items: any[]; timestamp: string; note?: string }[];
  private invoiceSequence: number;

  constructor() {
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.invoices = loadFromStorage(STORAGE_KEYS.INVOICES, []);
    this.stockLedger = loadFromStorage(STORAGE_KEYS.STOCK_LEDGER, []);
    this.customers = loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    this.suppliers = loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    this.purchaseOrders = loadFromStorage(STORAGE_KEYS.PURCHASE_ORDERS, []);
    this.grns = loadFromStorage(STORAGE_KEYS.GRN, []);
    this.auditLogs = loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, []);
    this.settings = loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
    this.offers = loadFromStorage(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
    this.heldBills = loadFromStorage(STORAGE_KEYS.HELD_BILLS, []);
    this.invoiceSequence = loadFromStorage(STORAGE_KEYS.INVOICE_COUNTER, 4581); // Seeded to start at 4582!

    // If invoices are empty, generate the exact benchmark worked example invoice from PDF Chapter 5.5
    if (this.invoices.length === 0) {
      this.seedBenchmarkInvoice();
    }
  }

  /**
   * Seeds the exact benchmark invoice worked out in Section 5.5 of the study report
   * SMK/2627/004582, Date: 28-10-2026 18:42, Cashier: C02, Counter: 3
   * Net: Rs 861.00 (Cash 500.00, UPI 361.00)
   */
  private seedBenchmarkInvoice() {
    const benchmarkInvoice: Invoice = {
      id: 'INV_BENCHMARK_4582',
      invoiceNo: 'SMK/2627/004582',
      financialYear: '2627',
      dateTime: '2026-10-28T18:42:00Z',
      cashierId: 'U003',
      cashierName: 'Arun Patel (C02)',
      counterId: 'Counter: 3',
      customerId: 'CUST001',
      customerName: 'Arunachalam K',
      customerMobile: '9842100001',
      isB2B: false,
      itemCount: 6,
      grossAmount: 869.6,
      discountAmount: 9.0,
      taxableValue: 790.54,
      cgstAmount: 35.04,
      sgstAmount: 35.02,
      igstAmount: 0.0,
      roundOff: 0.4,
      netPayable: 861.0,
      payments: [
        {
          mode: 'cash',
          amount: 500.0,
          tenderedCash: 500.0,
          changeGiven: 0.0,
          status: 'success',
          timestamp: '2026-10-28T18:42:15Z',
        },
        {
          mode: 'upi',
          amount: 361.0,
          reference: 'UPI/262704582991',
          status: 'success',
          timestamp: '2026-10-28T18:42:40Z',
        },
      ],
      gstSummary: [
        { gstRate: 0, netAmount: 54.0, taxableValue: 54.0, cgst: 0.0, sgst: 0.0, igst: 0, totalTax: 0.0 },
        { gstRate: 5, netAmount: 606.6, taxableValue: 577.71, cgst: 14.45, sgst: 14.44, igst: 0, totalTax: 28.89 },
        { gstRate: 18, netAmount: 120.0, taxableValue: 101.69, cgst: 9.16, sgst: 9.15, igst: 0, totalTax: 18.31 },
        { gstRate: 40, netAmount: 80.0, taxableValue: 57.14, cgst: 11.43, sgst: 11.43, igst: 0, totalTax: 22.86 },
      ],
      lines: [
        {
          productId: 'P00123',
          productName: 'Toor Dal 1 kg',
          hsnCode: '0713',
          unit: 'Pack',
          quantity: 2,
          rate: 158.0,
          grossAmount: 316.0,
          discountAmount: 0.0,
          netAmount: 316.0,
          gstRate: 5,
          taxableValue: 300.95,
          cgst: 7.53,
          sgst: 7.52,
          igst: 0,
        },
        {
          productId: 'P00124',
          productName: 'Biscuits 100 g',
          hsnCode: '1905',
          unit: 'Pack',
          quantity: 3,
          rate: 30.0,
          grossAmount: 90.0,
          discountAmount: 9.0, // 10% line discount
          netAmount: 81.0,
          gstRate: 5,
          taxableValue: 77.14,
          cgst: 1.93,
          sgst: 1.93,
          igst: 0,
        },
        {
          productId: 'P00125',
          productName: 'Shampoo 180 ml',
          hsnCode: '3305',
          unit: 'Piece',
          quantity: 1,
          rate: 209.6,
          grossAmount: 209.6,
          discountAmount: 0.0,
          netAmount: 209.6,
          gstRate: 5,
          taxableValue: 199.62,
          cgst: 4.99,
          sgst: 4.99,
          igst: 0,
        },
        {
          productId: 'P00126',
          productName: 'Cold Drink 600 ml',
          hsnCode: '2202',
          unit: 'Piece',
          quantity: 2,
          rate: 40.0,
          grossAmount: 80.0,
          discountAmount: 0.0,
          netAmount: 80.0,
          gstRate: 40,
          taxableValue: 57.14,
          cgst: 11.43,
          sgst: 11.43,
          igst: 0,
        },
        {
          productId: 'P00127',
          productName: 'LED Bulb 9 W',
          hsnCode: '8539',
          unit: 'Piece',
          quantity: 1,
          rate: 120.0,
          grossAmount: 120.0,
          discountAmount: 0.0,
          netAmount: 120.0,
          gstRate: 18,
          taxableValue: 101.69,
          cgst: 9.16,
          sgst: 9.15,
          igst: 0,
        },
        {
          productId: 'P00128',
          productName: 'Tomato (loose)',
          hsnCode: '0702',
          unit: 'kg',
          quantity: 1.35,
          rate: 40.0,
          grossAmount: 54.0,
          discountAmount: 0.0,
          netAmount: 54.0,
          gstRate: 0,
          taxableValue: 54.0,
          cgst: 0.0,
          sgst: 0.0,
          igst: 0,
        },
      ],
      status: 'paid',
    };

    this.invoices = [benchmarkInvoice];
    this.invoiceSequence = 4582;
    this.saveInvoices();
    this.saveInvoiceSequence();
  }

  // --- Products ---
  public getProducts(): Product[] {
    return [...this.products];
  }

  public findProductByBarcode(barcode: string): Product | undefined {
    const clean = barcode.trim();
    return this.products.find(
      (p) =>
        p.active &&
        (p.barcode === clean ||
          p.code === clean ||
          p.additionalBarcodes?.includes(clean))
    );
  }

  public saveProduct(product: Product, user: User): void {
    const existingIndex = this.products.findIndex((p) => p.id === product.id);
    if (existingIndex >= 0) {
      const old = this.products[existingIndex];
      this.audit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'price_override',
        details: `Updated product ${product.code} (${product.name})`,
        oldValue: `Price: ₹${old.sellingPrice}, Stock: ${old.currentStock}`,
        newValue: `Price: ₹${product.sellingPrice}, Stock: ${product.currentStock}`,
      });
      this.products[existingIndex] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      this.products.push({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      this.audit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'price_override',
        details: `Created new product ${product.code} - ${product.name}`,
        newValue: `MRP: ₹${product.mrp}, Selling: ₹${product.sellingPrice}, GST: ${product.gstRate}%`,
      });
    }
    this.saveProducts();
  }

  public deactivateProduct(id: string, user: User): void {
    const p = this.products.find((prod) => prod.id === id);
    if (p) {
      p.active = false;
      this.audit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'price_override',
        details: `Deactivated product ${p.code} - ${p.name}`,
      });
      this.saveProducts();
    }
  }

  // --- Sequential Invoicing (Section 4.3) ---
  public nextInvoiceNumber(): string {
    this.invoiceSequence += 1;
    this.saveInvoiceSequence();
    const running = String(this.invoiceSequence).padStart(6, '0');
    return `SMK/2627/${running}`;
  }

  // --- Complete Transactional Sale (Section 4.2, 5.4, 8.3) ---
  public completeSale(params: {
    calculation: BillingCalculation;
    payments: PaymentEntry[];
    cashier: User;
    counterId: string;
    customer?: Customer;
    isB2B?: boolean;
    b2bGSTIN?: string;
  }): Invoice {
    const { calculation, payments, cashier, counterId, customer, isB2B, b2bGSTIN } = params;
    const invNo = this.nextInvoiceNumber();
    const nowIso = new Date().toISOString();

    const invoiceLines = calculation.lineItems.map((li) => ({
      productId: li.product.id,
      productName: li.product.name,
      hsnCode: li.product.hsnCode,
      unit: li.product.unit,
      quantity: li.quantity,
      rate: li.rate,
      grossAmount: li.grossAmount,
      discountAmount: li.discountAmount,
      netAmount: li.netAmount,
      gstRate: li.taxRate,
      taxableValue: li.taxableValue,
      cgst: li.cgst,
      sgst: li.sgst,
      igst: li.igst,
    }));

    const newInvoice: Invoice = {
      id: `INV_${Date.now()}`,
      invoiceNo: invNo,
      financialYear: '2627',
      dateTime: nowIso,
      cashierId: cashier.id,
      cashierName: cashier.name,
      counterId,
      customerId: customer?.id,
      customerName: customer?.name,
      customerMobile: customer?.mobile,
      customerGSTIN: isB2B ? b2bGSTIN : undefined,
      isB2B: !!isB2B,
      lines: invoiceLines,
      itemCount: calculation.lineItems.length,
      grossAmount: calculation.grossTotal,
      discountAmount: calculation.totalDiscount,
      taxableValue: calculation.taxableValue,
      cgstAmount: calculation.totalCGST,
      sgstAmount: calculation.totalSGST,
      igstAmount: calculation.totalIGST,
      roundOff: calculation.roundOff,
      netPayable: calculation.netPayable,
      payments,
      gstSummary: calculation.gstSummary,
      status: 'paid',
    };

    // 1. Save invoice
    this.invoices.unshift(newInvoice);
    this.saveInvoices();

    // 2. Transactionally deduct inventory & append to immutable stock ledger
    calculation.lineItems.forEach((li) => {
      const prod = this.products.find((p) => p.id === li.product.id);
      if (prod) {
        const prevStock = prod.currentStock;
        const newStock = Math.max(0, Math.round((prevStock - li.quantity) * 100) / 100);
        prod.currentStock = newStock;

        // FEFO batch deduction
        if (prod.batches && prod.batches.length > 0) {
          let qtyToDeduct = li.quantity;
          prod.batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
          for (const b of prod.batches) {
            if (qtyToDeduct <= 0) break;
            const take = Math.min(b.quantity, qtyToDeduct);
            b.quantity = Math.round((b.quantity - take) * 100) / 100;
            qtyToDeduct = Math.round((qtyToDeduct - take) * 100) / 100;
          }
        }

        // Ledger record
        const ledgerEntry: StockLedgerEntry = {
          id: `LEDGER_${Date.now()}_${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          date: nowIso,
          type: 'sale',
          quantityChange: -li.quantity,
          previousStock: prevStock,
          newStock,
          referenceDoc: invNo,
          userId: cashier.id,
          userName: cashier.name,
          reason: `Retail POS Sale (${invNo})`,
        };
        this.stockLedger.unshift(ledgerEntry);
      }
    });

    this.saveProducts();
    this.saveStockLedger();

    // 3. Update customer loyalty & lifetime spent
    if (customer) {
      const custRecord = this.customers.find((c) => c.id === customer.id);
      if (custRecord) {
        custRecord.totalSpent += calculation.netPayable;
        // Earn 1 point per ₹100
        const earnedPoints = Math.floor(calculation.netPayable / 100);
        custRecord.loyaltyPoints += earnedPoints;
        this.saveCustomers();
      }
    }

    return newInvoice;
  }

  // --- Void / Cancel Invoice (Section 4.5) ---
  public voidInvoice(invoiceId: string, reason: string, manager: User): boolean {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (!inv || inv.status === 'cancelled') return false;

    inv.status = 'cancelled';
    inv.cancellationReason = reason;
    inv.cancelledBy = manager.name;

    // Restore stock
    inv.lines.forEach((line) => {
      const prod = this.products.find((p) => p.id === line.productId);
      if (prod) {
        const prev = prod.currentStock;
        prod.currentStock = Math.round((prev + line.quantity) * 100) / 100;
        this.stockLedger.unshift({
          id: `LEDGER_VOID_${Date.now()}_${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          date: new Date().toISOString(),
          type: 'sales_return',
          quantityChange: line.quantity,
          previousStock: prev,
          newStock: prod.currentStock,
          referenceDoc: `CN-VOID-${inv.invoiceNo}`,
          userId: manager.id,
          userName: manager.name,
          reason: `Invoice Voided: ${reason}`,
        });
      }
    });

    this.audit({
      userId: manager.id,
      userName: manager.name,
      userRole: manager.role,
      action: 'bill_void',
      details: `Voided Invoice ${inv.invoiceNo}. Reason: ${reason}`,
    });

    this.saveInvoices();
    this.saveProducts();
    this.saveStockLedger();
    return true;
  }

  // --- Manual Stock Adjustment ---
  public adjustStock(params: {
    productId: string;
    newStock: number;
    reason: string;
    user: User;
  }): void {
    const prod = this.products.find((p) => p.id === params.productId);
    if (!prod) return;

    const prev = prod.currentStock;
    const diff = Math.round((params.newStock - prev) * 100) / 100;
    prod.currentStock = params.newStock;

    this.stockLedger.unshift({
      id: `LEDGER_ADJ_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      date: new Date().toISOString(),
      type: diff >= 0 ? 'stock_count_diff' : 'wastage_expiry',
      quantityChange: diff,
      previousStock: prev,
      newStock: params.newStock,
      referenceDoc: `ADJ-${Date.now().toString().slice(-4)}`,
      userId: params.user.id,
      userName: params.user.name,
      reason: params.reason,
    });

    this.audit({
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      action: 'stock_adjustment',
      details: `Stock adjustment on ${prod.name} from ${prev} to ${params.newStock}. Reason: ${params.reason}`,
      oldValue: String(prev),
      newValue: String(params.newStock),
    });

    this.saveProducts();
    this.saveStockLedger();
  }

  // --- Goods Receipt Note (GRN) from Suppliers (Section 8.2) ---
  public receiveGoods(grnData: {
    supplierId: string;
    supplierName: string;
    supplierInvoiceNo: string;
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
    user: User;
  }): GoodsReceiptNote {
    const nowIso = new Date().toISOString();
    const grnNo = `GRN-2026-${String(this.grns.length + 89).padStart(4, '0')}`;
    let totalCost = 0;
    let inputGST = 0;

    grnData.items.forEach((item) => {
      const lineCost = item.quantity * item.purchaseRate;
      const gst = (lineCost * item.gstRate) / 100;
      totalCost += lineCost;
      inputGST += gst;

      // Update product current stock and batch
      const prod = this.products.find((p) => p.id === item.productId);
      if (prod) {
        const prev = prod.currentStock;
        prod.currentStock = Math.round((prev + item.quantity) * 100) / 100;
        prod.purchasePrice = item.purchaseRate; // update cost price
        if (item.mrp) prod.mrp = item.mrp;

        if (!prod.batches) prod.batches = [];
        prod.batches.push({
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
        });

        // Add to ledger
        this.stockLedger.unshift({
          id: `LEDGER_GRN_${Date.now()}_${item.productId}`,
          productId: prod.id,
          productName: prod.name,
          batchNumber: item.batchNumber,
          date: nowIso,
          type: 'purchase_receipt',
          quantityChange: item.quantity,
          previousStock: prev,
          newStock: prod.currentStock,
          referenceDoc: grnNo,
          userId: grnData.user.id,
          userName: grnData.user.name,
          reason: `GRN from ${grnData.supplierName} (Inv: ${grnData.supplierInvoiceNo})`,
        });
      }
    });

    const newGRN: GoodsReceiptNote = {
      id: `GRN_${Date.now()}`,
      grnNo,
      supplierId: grnData.supplierId,
      supplierName: grnData.supplierName,
      supplierInvoiceNo: grnData.supplierInvoiceNo,
      invoiceDate: nowIso.split('T')[0],
      receivedDate: nowIso,
      items: grnData.items,
      totalCost: Math.round(totalCost * 100) / 100,
      inputGST: Math.round(inputGST * 100) / 100,
      receivedBy: grnData.user.name,
    };

    this.grns.unshift(newGRN);
    this.saveGRN();
    this.saveProducts();
    this.saveStockLedger();
    return newGRN;
  }

  // --- Held Bills (Section 4.5) ---
  public getHeldBills() {
    return [...this.heldBills];
  }

  public holdBill(name: string, items: any[], note?: string): string {
    const id = `HELD_${Date.now()}`;
    this.heldBills.unshift({
      id,
      name,
      items,
      timestamp: new Date().toISOString(),
      note,
    });
    this.saveHeldBills();
    return id;
  }

  public resumeHeldBill(id: string): any[] | null {
    const index = this.heldBills.findIndex((b) => b.id === id);
    if (index >= 0) {
      const bill = this.heldBills[index];
      this.heldBills.splice(index, 1);
      this.saveHeldBills();
      return bill.items;
    }
    return null;
  }

  public removeHeldBill(id: string): void {
    this.heldBills = this.heldBills.filter((b) => b.id !== id);
    this.saveHeldBills();
  }

  // --- Audit Logging ---
  public audit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(fullEntry);
    this.saveAuditLogs();
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  // --- Invoices ---
  public getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.invoices.find((i) => i.id === id || i.invoiceNo === id);
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public findCustomerByMobile(mobile: string): Customer | undefined {
    const clean = mobile.trim().replace(/\D/g, '');
    return this.customers.find((c) => c.mobile.includes(clean));
  }

  public saveCustomer(customer: Customer): void {
    const idx = this.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      this.customers[idx] = customer;
    } else {
      this.customers.push(customer);
    }
    this.saveCustomers();
  }

  // --- Stock Ledger ---
  public getStockLedger(): StockLedgerEntry[] {
    return [...this.stockLedger];
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public saveSupplier(supplier: Supplier): void {
    const idx = this.suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      this.suppliers[idx] = supplier;
    } else {
      this.suppliers.push(supplier);
    }
    this.saveSuppliers();
  }

  // --- GRNs ---
  public getGRNs(): GoodsReceiptNote[] {
    return [...this.grns];
  }

  // --- Offers ---
  public getOffers(): Offer[] {
    return [...this.offers];
  }

  public saveOffer(offer: Offer): void {
    const idx = this.offers.findIndex((o) => o.id === offer.id);
    if (idx >= 0) {
      this.offers[idx] = offer;
    } else {
      this.offers.push(offer);
    }
    this.saveOffers();
  }

  // --- Settings ---
  public getSettings(): StoreSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: StoreSettings, user: User): void {
    this.settings = { ...newSettings };
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    this.audit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'tax_change',
      details: `Updated Store Profile & Tax Configuration (GSTIN: ${newSettings.gstin})`,
    });
  }

  // Internal persistence sync helpers
  private saveProducts() {
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
  }
  private saveInvoices() {
    saveToStorage(STORAGE_KEYS.INVOICES, this.invoices);
  }
  private saveStockLedger() {
    saveToStorage(STORAGE_KEYS.STOCK_LEDGER, this.stockLedger);
  }
  private saveCustomers() {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, this.customers);
  }
  private saveSuppliers() {
    saveToStorage(STORAGE_KEYS.SUPPLIERS, this.suppliers);
  }
  private saveGRN() {
    saveToStorage(STORAGE_KEYS.GRN, this.grns);
  }
  private saveAuditLogs() {
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }
  private saveOffers() {
    saveToStorage(STORAGE_KEYS.OFFERS, this.offers);
  }
  private saveHeldBills() {
    saveToStorage(STORAGE_KEYS.HELD_BILLS, this.heldBills);
  }
  private saveInvoiceSequence() {
    saveToStorage(STORAGE_KEYS.INVOICE_COUNTER, this.invoiceSequence);
  }
}

// Singleton database instance
export const db = new SupermarketDatabase();
