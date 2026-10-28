/**
 * Supermarket Billing and Management System (SBMS)
 * Discount & Promotion Engine (Chapter 5.1 of SBMS Report)
 */

import { CartItem, Offer } from '../types';
import { round2 } from './gstEngine';

export interface PromotionEvaluationResult {
  eligibleOffers: Offer[];
  suggestedBillDiscount: number;
  couponDiscount: number;
  promoDescription?: string;
  itemAdjustments: {
    productId: string;
    discountAmount: number;
    reason: string;
  }[];
}

export function evaluateOffers(
  items: CartItem[],
  activeOffers: Offer[],
  couponCode?: string,
  isLoyaltyCustomer?: boolean
): PromotionEvaluationResult {
  let suggestedBillDiscount = 0;
  let couponDiscount = 0;
  let promoDescription = '';
  const itemAdjustments: { productId: string; discountAmount: number; reason: string }[] = [];

  const basketSubtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // 1. Evaluate Item-level Buy X Get Y offers
  activeOffers
    .filter((o) => o.active && o.type === 'buy_x_get_y')
    .forEach((offer) => {
      const targetItem = items.find((i) => i.product.id === offer.applicableProductId);
      if (targetItem && offer.buyQuantity && offer.getQuantity) {
        const bundleSize = offer.buyQuantity + offer.getQuantity;
        if (targetItem.quantity >= bundleSize) {
          const freeUnits = Math.floor(targetItem.quantity / bundleSize) * offer.getQuantity;
          const disc = round2(freeUnits * targetItem.unitPrice);
          itemAdjustments.push({
            productId: targetItem.product.id,
            discountAmount: disc,
            reason: `${offer.title} (Free: ${freeUnits} units)`,
          });
          promoDescription += `[${offer.title}] `;
        }
      }
    });

  // 2. Evaluate Bill-Value discounts (highest value wins)
  activeOffers
    .filter((o) => o.active && o.type === 'bill_value')
    .forEach((offer) => {
      if (offer.minBillAmount && basketSubtotal >= offer.minBillAmount) {
        if (offer.discountValue > suggestedBillDiscount) {
          suggestedBillDiscount = offer.discountValue;
          promoDescription += `[₹${offer.discountValue} Bill Discount above ₹${offer.minBillAmount}] `;
        }
      }
    });

  // 3. Evaluate Coupon Code
  if (couponCode) {
    const cleanCode = couponCode.trim().toUpperCase();
    const matchedCoupon = activeOffers.find(
      (o) => o.active && o.type === 'coupon' && o.code.toUpperCase() === cleanCode
    );

    if (matchedCoupon) {
      if (!matchedCoupon.minBillAmount || basketSubtotal >= matchedCoupon.minBillAmount) {
        couponDiscount = matchedCoupon.discountValue;
        promoDescription += `[Coupon applied: ${matchedCoupon.code} (-₹${couponDiscount})] `;
      }
    } else if (cleanCode === 'WELCOME50' && basketSubtotal >= 500) {
      couponDiscount = 50;
      promoDescription += `[Coupon WELCOME50: ₹50 Off] `;
    } else if (cleanCode === 'FESTIVE100' && basketSubtotal >= 1000) {
      couponDiscount = 100;
      promoDescription += `[Coupon FESTIVE100: ₹100 Off] `;
    }
  }

  // 4. Loyalty Membership (2% standing discount if active)
  if (isLoyaltyCustomer) {
    const loyaltyOffer = activeOffers.find((o) => o.active && o.type === 'loyalty');
    const loyaltyPercent = loyaltyOffer ? loyaltyOffer.discountValue : 2;
    const loyaltyRupees = round2(basketSubtotal * (loyaltyPercent / 100));
    suggestedBillDiscount = round2(suggestedBillDiscount + loyaltyRupees);
    promoDescription += `[${loyaltyPercent}% Member Privilege] `;
  }

  return {
    eligibleOffers: activeOffers.filter((o) => o.active),
    suggestedBillDiscount,
    couponDiscount,
    promoDescription: promoDescription.trim(),
    itemAdjustments,
  };
}
