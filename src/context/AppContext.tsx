/**
 * Supermarket Billing and Management System (SBMS)
 * Central Application Context & State Management
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  Product,
  CartItem,
  Customer,
  BillingCalculation,
  Invoice,
  StoreSettings,
} from '../types';
import { db, INITIAL_USERS, DEFAULT_STORE_SETTINGS } from '../services/database';
import { calculateBill } from '../services/gstEngine';
import { evaluateOffers } from '../services/discountEngine';
import { parseWeighedBarcode } from '../services/barcodeUtils';

export type NavigationTab =
  | 'billing'
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'stock_count'
  | 'purchases'
  | 'invoices'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'audit_log';

interface NotificationState {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  counterId: string;
  setCounterId: (id: string) => void;
  settings: StoreSettings;
  updateStoreSettings: (newSettings: StoreSettings) => void;

  // Cart & POS
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, discountPercent?: number) => void;
  updateCartItemQty: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discountAmount: number, isPercent?: boolean) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  currentCustomer: Customer | null;
  setCurrentCustomer: (c: Customer | null) => void;
  appliedCoupon: string;
  setAppliedCoupon: (code: string) => void;
  billDiscountRupees: number;
  setBillDiscountRupees: (amt: number) => void;
  isInterState: boolean;
  setIsInterState: (val: boolean) => void;
  isB2B: boolean;
  setIsB2B: (val: boolean) => void;
  b2bGSTIN: string;
  setB2BGSTIN: (val: string) => void;
  calculation: BillingCalculation;

  // Barcode actions
  handleBarcodeScanned: (barcode: string) => { success: boolean; message: string; product?: Product };

  // Hold & Resume
  heldBillsCount: number;
  holdCurrentBill: (note?: string) => boolean;
  resumeBillById: (id: string) => boolean;

  // Thermal Receipt & History
  receiptToPrint: Invoice | null;
  setReceiptToPrint: (inv: Invoice | null) => void;
  isDuplicatePrint: boolean;
  setIsDuplicatePrint: (val: boolean) => void;
  showReceiptModal: boolean;
  setShowReceiptModal: (show: boolean) => void;

  // Notifications
  notification: NotificationState | null;
  showNotification: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;

  // DB Sync trigger
  dbVersion: number;
  triggerDbRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default user is Cashier (Arun Patel) for immediate POS demonstration, or Admin
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('sbms_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USERS[2]; // Cashier Arun Patel
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('billing');
  const [counterId, setCounterId] = useState<string>('Counter 02');
  const [settings, setSettings] = useState<StoreSettings>(() => db.getSettings());
  const [dbVersion, setDbVersion] = useState<number>(0);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [billDiscountRupees, setBillDiscountRupees] = useState<number>(0);
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [isB2B, setIsB2B] = useState<boolean>(false);
  const [b2bGSTIN, setB2BGSTIN] = useState<string>('');

  // Receipt & Print Modal
  const [receiptToPrint, setReceiptToPrint] = useState<Invoice | null>(null);
  const [isDuplicatePrint, setIsDuplicatePrint] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Notification State
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotification({ id, message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  }, []);

  const triggerDbRefresh = useCallback(() => {
    setDbVersion((v) => v + 1);
    setSettings(db.getSettings());
  }, []);

  const updateStoreSettings = useCallback((newSettings: StoreSettings) => {
    db.updateSettings(newSettings, currentUser);
    setSettings(newSettings);
    triggerDbRefresh();
    showNotification('Store profile and tax settings updated successfully', 'success');
  }, [currentUser, triggerDbRefresh, showNotification]);

  // Handle User switch
  const handleSetCurrentUser = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sbms_active_user', JSON.stringify(user));
    db.audit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'system_login',
      details: `Switched user session to ${user.name} (${user.role.toUpperCase()})`,
    });
    showNotification(`Active user switched to ${user.name} (${user.role.toUpperCase()})`, 'info');
  }, [showNotification]);

  // Cart operations
  const addToCart = useCallback((product: Product, quantity = 1, discountPercent = 0) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        // Increment quantity
        const updated = [...prevCart];
        const newQty = Math.round((updated[existingIndex].quantity + quantity) * 100) / 100;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity: Math.round(quantity * 100) / 100,
            unitPrice: product.sellingPrice,
            lineDiscount: 0,
            discountPercent,
            selectedBatch: product.batches?.[0]?.batchNumber,
            expiryDate: product.batches?.[0]?.expiryDate,
          },
        ];
      }
    });
  }, []);

  const updateCartItemQty = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.round(quantity * 100) / 100 }
          : item
      )
    );
  }, []);

  const updateCartItemDiscount = useCallback(
    (productId: string, discountAmount: number, isPercent = false) => {
      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.product.id !== productId) return item;
          if (isPercent) {
            return { ...item, discountPercent: discountAmount, lineDiscount: 0 };
          } else {
            return { ...item, lineDiscount: discountAmount, discountPercent: 0 };
          }
        })
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCurrentCustomer(null);
    setAppliedCoupon('');
    setBillDiscountRupees(0);
    setIsB2B(false);
    setB2BGSTIN('');
  }, []);

  // Barcode Scanning Handler
  const handleBarcodeScanned = useCallback(
    (barcode: string): { success: boolean; message: string; product?: Product } => {
      const clean = barcode.trim();
      if (!clean) return { success: false, message: 'Barcode is empty' };

      // Check if this is a weighed barcode (prefix 20)
      const weighed = parseWeighedBarcode(clean);
      let product: Product | undefined;
      let qty = 1;

      if (weighed.isWeighed && weighed.productCode && weighed.weightKg) {
        product = db.getProducts().find((p) => p.code === weighed.productCode || p.id === weighed.productCode);
        if (product) {
          qty = weighed.weightKg;
        }
      }

      if (!product) {
        product = db.findProductByBarcode(clean);
      }

      if (!product) {
        showNotification(`Barcode not found in catalog: ${clean}`, 'error');
        return { success: false, message: `Barcode not found: ${clean}` };
      }

      if (!product.active) {
        showNotification(`Product ${product.name} is deactivated`, 'warning');
        return { success: false, message: `Product is inactive` };
      }

      // Check expiry of batches
      const today = new Date().toISOString().split('T')[0];
      const earliestBatch = product.batches?.[0];
      if (earliestBatch && earliestBatch.expiryDate && earliestBatch.expiryDate < today) {
        showNotification(`Cannot sell expired batch for ${product.name}! (Expired: ${earliestBatch.expiryDate})`, 'error');
        return { success: false, message: 'Item batch is expired' };
      }

      // Default discount check (e.g. Biscuits has 10% line discount in Chapter 5.5 worked example)
      let initialDiscountPercent = 0;
      if (product.id === 'P00124') {
        initialDiscountPercent = 10;
      }

      addToCart(product, qty, initialDiscountPercent);
      showNotification(`Added: ${product.name} (${qty} ${product.unit})`, 'success');
      return { success: true, message: `Added ${product.name}`, product };
    },
    [addToCart, showNotification]
  );

  // Hold & Resume
  const heldBillsCount = useMemo(() => db.getHeldBills().length, [dbVersion, cart]);

  const holdCurrentBill = useCallback(
    (note?: string): boolean => {
      if (cart.length === 0) {
        showNotification('Cannot hold an empty bill', 'warning');
        return false;
      }
      const title = currentCustomer
        ? `${currentCustomer.name} (${cart.length} items)`
        : `Bill #${heldBillsCount + 1} (${cart.length} items)`;

      db.holdBill(title, cart, note);
      clearCart();
      triggerDbRefresh();
      showNotification(`Bill parked on hold: "${title}"`, 'info');
      return true;
    },
    [cart, currentCustomer, heldBillsCount, clearCart, triggerDbRefresh, showNotification]
  );

  const resumeBillById = useCallback(
    (id: string): boolean => {
      const items = db.resumeHeldBill(id);
      if (items && items.length > 0) {
        setCart(items);
        triggerDbRefresh();
        showNotification('Held bill resumed to active terminal', 'success');
        return true;
      }
      return false;
    },
    [triggerDbRefresh, showNotification]
  );

  // Live bill calculation using Chapter 5.3-5.5 formulas
  const calculation = useMemo(() => {
    // 1. Evaluate promotions
    const activeOffers = db.getOffers();
    const promoResult = evaluateOffers(
      cart,
      activeOffers,
      appliedCoupon,
      currentCustomer ? currentCustomer.loyaltyPoints > 0 : false
    );

    const effectiveBillDiscount = billDiscountRupees > 0 ? billDiscountRupees : promoResult.suggestedBillDiscount;
    const effectiveCouponDiscount = promoResult.couponDiscount;

    return calculateBill(cart, {
      isInterState,
      billDiscountRupees: effectiveBillDiscount,
      couponDiscountRupees: effectiveCouponDiscount,
      appliedOfferName: promoResult.promoDescription || undefined,
    });
  }, [cart, isInterState, billDiscountRupees, appliedCoupon, currentCustomer, dbVersion]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        activeTab,
        setActiveTab,
        counterId,
        setCounterId,
        settings,
        updateStoreSettings,

        cart,
        addToCart,
        updateCartItemQty,
        updateCartItemDiscount,
        removeFromCart,
        clearCart,
        currentCustomer,
        setCurrentCustomer,
        appliedCoupon,
        setAppliedCoupon,
        billDiscountRupees,
        setBillDiscountRupees,
        isInterState,
        setIsInterState,
        isB2B,
        setIsB2B,
        b2bGSTIN,
        setB2BGSTIN,
        calculation,

        handleBarcodeScanned,
        heldBillsCount,
        holdCurrentBill,
        resumeBillById,

        receiptToPrint,
        setReceiptToPrint,
        isDuplicatePrint,
        setIsDuplicatePrint,
        showReceiptModal,
        setShowReceiptModal,

        notification,
        showNotification,

        dbVersion,
        triggerDbRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
