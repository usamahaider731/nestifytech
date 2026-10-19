export function stripTags(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  // Administrator role has unrestricted access to everything
  // user_role is an array of role title strings e.g. ["Administrator"]
  const userRoles = Array.isArray(user?.user_role) ? user.user_role : [];
  if (userRoles.includes('Administrator')) return true;
  const permissions = user?.user_permissions || [];
  return permissions.includes(permission.toLowerCase());
}

export function html_print(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerHTML || "";
}

/**
 * Safely parse a numeric price from number, string with commas, or null.
 */
export function parseNumericPrice(val) {
  if (typeof val === 'number') return Number.isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates the adjusted final price considering:
 * - base price (sale price if lower than regular price, or combination price)
 * - category discount (if discount_toggle is true / discount active)
 * - user discount (from user/auth or coupon, passed in)
 * - category tax (if tax_toggle is true / tax percentage active)
 *
 * Returns a comprehensive pricing breakdown object.
 */
export function calculateAdjustedPrice({
  basePrice = 0,
  regularPrice = 0,
  category = null,
  userDiscount = 0, // e.g. 5 for 5%
  userDiscountType = 'percentage', // 'percentage' | 'fixed'
  installmentMonths = 0,
}) {
  const rawBase = parseNumericPrice(basePrice);
  const rawRegular = parseNumericPrice(regularPrice) || rawBase;

  // 1. Resolve Category Discount & Tax
  let categoryDiscountPercent = 0;
  let categoryTaxPercent = 0;

  // Extract from category object or primary category
  const catObj = Array.isArray(category) ? category[0] : category;
  if (catObj) {
    const meta = catObj.meta || {};
    const hasDiscountToggle = meta.discount_toggle === '1' || meta.discount_toggle === true || catObj.discount_toggle === '1' || catObj.discount_toggle === true;
    const hasTaxToggle = meta.tax_toggle === '1' || meta.tax_toggle === true || catObj.tax_toggle === '1' || catObj.tax_toggle === true;

    // Check discount validity by date if discount_date is provided
    const discountDateStr = meta.discount_date || catObj.discount_date;
    let isDateValid = true;
    if (discountDateStr) {
      try {
        const d = new Date(discountDateStr);
        if (!isNaN(d.getTime()) && d.getTime() < Date.now()) {
          isDateValid = false;
        }
      } catch (_) {}
    }

    if (hasDiscountToggle && isDateValid) {
      categoryDiscountPercent = parseNumericPrice(meta.discount || catObj.discount || 0);
    }

    if (hasTaxToggle) {
      categoryTaxPercent = parseNumericPrice(meta.category_tax || catObj.category_tax || 0);
    }
  }

  // 2. Apply Category Discount first on rawBase
  const categoryDiscountAmount = (rawBase * categoryDiscountPercent) / 100;
  const priceAfterCategoryDiscount = Math.max(0, rawBase - categoryDiscountAmount);

  // 3. Apply User Discount
  const rawUserDisc = parseNumericPrice(userDiscount);
  let userDiscountAmount = 0;
  if (userDiscountType === 'fixed') {
    userDiscountAmount = Math.min(priceAfterCategoryDiscount, rawUserDisc);
  } else {
    userDiscountAmount = (priceAfterCategoryDiscount * rawUserDisc) / 100;
  }
  const priceAfterDiscounts = Math.max(0, priceAfterCategoryDiscount - userDiscountAmount);

  // 4. Apply Category Tax
  const taxAmount = (priceAfterDiscounts * categoryTaxPercent) / 100;
  const finalPrice = Math.round((priceAfterDiscounts + taxAmount) * 100) / 100;

  // Total discount from regular or base
  const totalSavings = Math.max(0, rawRegular - finalPrice);
  const totalDiscountPercentage = rawRegular > 0 ? Math.round(((rawRegular - finalPrice) / rawRegular) * 100) : 0;

  // Installment estimation if requested
  const months = parseNumericPrice(installmentMonths);
  const monthlyInstallment = months > 0 ? Math.round((finalPrice / months) * 100) / 100 : null;

  return {
    rawBase,
    rawRegular,
    hasSalePrice: rawRegular > rawBase,
    categoryDiscountPercent,
    categoryDiscountAmount: Math.round(categoryDiscountAmount * 100) / 100,
    userDiscountPercent: userDiscountType === 'percentage' ? rawUserDisc : 0,
    userDiscountAmount: Math.round(userDiscountAmount * 100) / 100,
    categoryTaxPercent,
    taxAmount: Math.round(taxAmount * 100) / 100,
    priceAfterDiscounts: Math.round(priceAfterDiscounts * 100) / 100,
    finalPrice,
    totalSavings: Math.round(totalSavings * 100) / 100,
    totalDiscountPercentage: Math.max(0, totalDiscountPercentage),
    monthlyInstallment,
  };
}