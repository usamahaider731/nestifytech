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

/** Normalize role / slug strings for loose matching (admin ↔ Administrator). */
function normalizeRoleKey(val) {
  return String(val ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** Collect numeric IDs from taxonomy objects, meta values, or JSON arrays. */
function collectNumericIds(...sources) {
  const ids = [];
  const push = (val) => {
    if (val == null || val === '') return;
    if (Array.isArray(val)) {
      val.forEach(push);
      return;
    }
    if (typeof val === 'object') {
      if (val.id != null) ids.push(Number(val.id));
      if (val.value != null && val.value !== val) push(val.value);
      return;
    }
    if (typeof val === 'number') {
      if (!Number.isNaN(val)) ids.push(val);
      return;
    }
    const str = String(val).trim();
    if (!str) return;
    if ((str.startsWith('[') || str.startsWith('{')) ) {
      try {
        push(JSON.parse(str));
        return;
      } catch (_) { /* fall through */ }
    }
    const num = Number(str);
    if (!Number.isNaN(num)) ids.push(num);
  };
  sources.forEach(push);
  return [...new Set(ids.filter((id) => id > 0))];
}

/**
 * Lowest absolute combo / size price from product variations (admin Price Mod fields).
 */
export function getLowestVariationPrice(product) {
  const variations = product?.variations;
  if (!Array.isArray(variations) || variations.length === 0) return 0;

  let min = Infinity;
  for (const variation of variations) {
    const combinations = Array.isArray(variation?.combinations) ? variation.combinations : [];
    for (const combo of combinations) {
      const price = parseNumericPrice(combo?.price);
      if (price > 0 && price < min) min = price;
    }
    const sizes = Array.isArray(variation?.sizes) ? variation.sizes : [];
    for (const size of sizes) {
      const price = parseNumericPrice(size?.price);
      if (price > 0 && price < min) min = price;
    }
    if (combinations.length === 0 && sizes.length === 0) {
      const price = parseNumericPrice(variation?.price);
      if (price > 0 && price < min) min = price;
    }
  }
  return min === Infinity ? 0 : min;
}

/**
 * Resolve display base + regular price from product meta and optional variation prices.
 * first_price = regular/list, second_price = sale; variation combo.price is absolute SKU price.
 */
export function resolveProductPrices(product) {
  const firstPrice = parseNumericPrice(product?.meta?.first_price?.value ?? product?.first_price);
  const secondPrice = parseNumericPrice(product?.meta?.second_price?.value ?? product?.second_price);
  const variationMin = getLowestVariationPrice(product);
  const metaSale = (firstPrice > secondPrice && secondPrice > 0)
    ? secondPrice
    : (firstPrice || parseNumericPrice(product?.price));
  // Variation combo.price is the absolute SKU price from VariationsSelector
  const basePrice = variationMin > 0 ? variationMin : metaSale;
  const regularPrice = Math.max(firstPrice, variationMin, secondPrice, basePrice);
  return { firstPrice, secondPrice, variationMin, basePrice, regularPrice };
}

/**
 * Calculates the adjusted final price considering:
 * - Product-level promotions rules (target by product, category, brand, collection, user role/user)
 * - Legacy: category discount/tax from meta (discount_toggle / tax_toggle)
 * - User discount (from user/auth or coupon, passed in)
 * - Tax rules from the promotions system
 *
 * @param {object} params
 * @param {number}       params.basePrice
 * @param {number}       params.regularPrice
 * @param {object|null}  params.category
 * @param {object|null}  params.brand          - Hydrated brand taxonomy (ProductCard passes this)
 * @param {object|null}  params.collection     - Hydrated collection taxonomy / ids
 * @param {number}       params.userDiscount
 * @param {string}       params.userDiscountType
 * @param {number}       params.installmentMonths
 * @param {object|null}  params.product
 * @param {object|null}  params.user
 * @param {Array}        params.pricingRules
 * @param {string|null}  params.couponCode     - When set, also unlocks rules that require a code
 */
export function calculateAdjustedPrice({
  basePrice = 0,
  regularPrice = 0,
  category = null,
  brand = null,
  collection = null,
  userDiscount = 0,
  userDiscountType = 'percentage',
  installmentMonths = 0,
  product = null,
  user = null,
  pricingRules = [],
  couponCode = null,
}) {
  
  const rawBase = parseNumericPrice(basePrice);
  const rawRegular = parseNumericPrice(regularPrice) || rawBase;
  const nowTs = Date.now();
  const normalizedCoupon = couponCode ? String(couponCode).trim().toUpperCase() : '';

  const isRuleActive = (rule) => {
    if (rule.status && rule.status !== 'active') return false;
    if (rule.start_date) {
      const start = new Date(rule.start_date).getTime();
      if (!isNaN(start) && nowTs < start) return false;
    }
    if (rule.end_date) {
      const end = new Date(rule.end_date).getTime();
      if (!isNaN(end) && nowTs > end) return false;
    }
    const minSpend = parseNumericPrice(rule.min_spend);
    if (minSpend > 0 && rawBase < minSpend) return false;
    // Coupon-coded rules only apply when the matching code is provided
    if (rule.code) {
      const ruleCode = String(rule.code).trim().toUpperCase();
      if (!normalizedCoupon || normalizedCoupon !== ruleCode) return false;
    }
    return true;
  };

  const categoriesList = Array.isArray(category)
    ? category
    : (category ? [category] : (Array.isArray(product?.category) ? product.category : (product?.category ? [product.category] : [])));

  const brandIds = collectNumericIds(
    brand,
    product?.brand,
    product?.meta?.brand,
    product?.meta?.brand_id,
    product?.brand_id,
  );
  const collectionIds = collectNumericIds(
    collection,
    product?.collection,
    product?.meta?.collection,
    product?.meta?.collection_id,
    product?.collection_id,
  );

  const ruleMatchesProduct = (rule) => {
    const targetType = rule.target_type;
    const rawTargets = Array.isArray(rule.target_ids) ? rule.target_ids : [];
    const targetIds = rawTargets.map(Number).filter((n) => !Number.isNaN(n));

    if (targetType === 'all') return true;

    if (targetType === 'product') {
      if (!product?.id) return false;
      return targetIds.includes(Number(product.id));
    }

    if (targetType === 'category') {
      return categoriesList.some((cat) => targetIds.includes(Number(cat?.id)));
    }

    if (targetType === 'brand') {
      if (brandIds.some((id) => targetIds.includes(id))) return true;
      return categoriesList.some((cat) => cat?.type === 'brand' && targetIds.includes(Number(cat?.id)));
    }

    if (targetType === 'collection') {
      if (collectionIds.some((id) => targetIds.includes(id))) return true;
      return categoriesList.some((cat) => cat?.type === 'collection' && targetIds.includes(Number(cat?.id)));
    }

    if (targetType === 'user_role') {
      if (!user) return false;
      const userRoles = Array.isArray(user?.user_role) ? user.user_role : [];
      if (userRoles.length === 0 || rawTargets.length === 0) return false;
      const userKeys = userRoles.map(normalizeRoleKey).filter(Boolean);
      return rawTargets.some((target) => {
        const targetKey = normalizeRoleKey(target);
        if (!targetKey) return false;
        return userKeys.some(
          (roleKey) => roleKey === targetKey || roleKey.includes(targetKey) || targetKey.includes(roleKey),
        );
      });
    }

    if (targetType === 'user') {
      if (!user?.id) return false;
      return targetIds.includes(Number(user.id));
    }

    return false;
  };

  let bestDiscountPercent = 0;
  let bestDiscountFixed = 0;
  let bestDiscountRuleTitle = '';
  let bestDiscountAmount = 0;
  let bestDiscountPriority = -Infinity;
  let taxFromRulesPercent = 0;
  let taxFromRulesFixed = 0;
  let bestTaxAmount = 0;
  let bestTaxPriority = -Infinity;

  let legacyCategoryDiscountPercent = 0;
  let legacyCategoryTaxPercent = 0;
  let legacyDiscountedCategoryTitle = '';

  if (Array.isArray(pricingRules) && pricingRules.length > 0) {
    const applicableRules = pricingRules
      .filter(isRuleActive)
      .filter(ruleMatchesProduct);

    for (const rule of applicableRules) {
      const priority = Number(rule.priority) || 0;
      const rateValue = parseNumericPrice(rule.rate_value);

      if (rule.type === 'discount') {
        const amount = rule.rate_type === 'fixed'
          ? rateValue
          : (rawBase * rateValue) / 100;
        const betterAmount = amount > bestDiscountAmount;
        const sameAmountHigherPriority = amount === bestDiscountAmount && priority > bestDiscountPriority;
        if (betterAmount || sameAmountHigherPriority) {
          bestDiscountAmount = amount;
          bestDiscountPriority = priority;
          bestDiscountRuleTitle = rule.name || '';
          if (rule.rate_type === 'fixed') {
            bestDiscountFixed = rateValue;
            bestDiscountPercent = 0;
          } else {
            bestDiscountPercent = rateValue;
            bestDiscountFixed = 0;
          }
        }
      } else if (rule.type === 'tax') {
        const amount = rule.rate_type === 'fixed'
          ? rateValue
          : (rawBase * rateValue) / 100;
        const betterAmount = amount > bestTaxAmount;
        const sameAmountHigherPriority = amount === bestTaxAmount && priority > bestTaxPriority;
        if (betterAmount || sameAmountHigherPriority) {
          bestTaxAmount = amount;
          bestTaxPriority = priority;
          if (rule.rate_type === 'fixed') {
            taxFromRulesFixed = rateValue;
            taxFromRulesPercent = 0;
          } else {
            taxFromRulesPercent = rateValue;
            taxFromRulesFixed = 0;
          }
        }
      }
    }
  }

  for (const catObj of categoriesList) {
    if (!catObj || typeof catObj !== 'object') continue;
    const meta = catObj.meta || {};
    const hasDiscountToggle =
      meta.discount_toggle === '1' || meta.discount_toggle === 1 ||
      meta.discount_toggle === true || meta.discount_toggle === 'true' ||
      catObj.discount_toggle === '1' || catObj.discount_toggle === 1 ||
      catObj.discount_toggle === true || catObj.discount_toggle === 'true';
    const hasTaxToggle =
      meta.tax_toggle === '1' || meta.tax_toggle === 1 ||
      meta.tax_toggle === true || meta.tax_toggle === 'true' ||
      catObj.tax_toggle === '1' || catObj.tax_toggle === 1 ||
      catObj.tax_toggle === true || catObj.tax_toggle === 'true';

    let rawDateVal = meta.discount_date ?? catObj.discount_date;
    if (typeof rawDateVal === 'string' && (rawDateVal.startsWith('[') || rawDateVal.startsWith('{'))) {
      try { rawDateVal = JSON.parse(rawDateVal); } catch (_) { /* ignore */ }
    }

    let isDateValid = true;
    if (Array.isArray(rawDateVal) && rawDateVal.length >= 2) {
      const start = new Date(rawDateVal[0]).getTime();
      const end = new Date(rawDateVal[1]).getTime();
      if (!isNaN(start) && nowTs < start) isDateValid = false;
      if (!isNaN(end) && nowTs > end) isDateValid = false;
    } else if (rawDateVal) {
      const singleDate = new Date(Array.isArray(rawDateVal) ? rawDateVal[0] : rawDateVal).getTime();
      if (!isNaN(singleDate) && singleDate < nowTs) isDateValid = false;
    }

    if (hasDiscountToggle && isDateValid) {
      const dVal = parseNumericPrice(meta.discount ?? catObj.discount ?? 0);
      if (dVal > legacyCategoryDiscountPercent) {
        legacyCategoryDiscountPercent = dVal;
        legacyDiscountedCategoryTitle = catObj.title || catObj.name || '';
      }
    }
    if (hasTaxToggle) {
      const tVal = parseNumericPrice(meta.category_tax ?? catObj.category_tax ?? 0);
      if (tVal > legacyCategoryTaxPercent) legacyCategoryTaxPercent = tVal;
    }
  }

  // Prefer promotion-system discount when it yields a real savings; else legacy category %
  const legacyDiscountAmount = (rawBase * legacyCategoryDiscountPercent) / 100;
  const usePromotionDiscount = bestDiscountAmount > 0 && bestDiscountAmount >= legacyDiscountAmount;
  const effectiveDiscountPercent = usePromotionDiscount ? bestDiscountPercent : legacyCategoryDiscountPercent;
  const effectiveDiscountFixed = usePromotionDiscount ? bestDiscountFixed : 0;
  const effectiveDiscountTitle = usePromotionDiscount
    ? bestDiscountRuleTitle
    : legacyDiscountedCategoryTitle;

  const usePromotionTax = bestTaxAmount > 0 || taxFromRulesFixed > 0 || taxFromRulesPercent > 0;
  const effectiveTaxPercent = usePromotionTax ? taxFromRulesPercent : legacyCategoryTaxPercent;
  const effectiveTaxFixed = usePromotionTax ? taxFromRulesFixed : 0;

  const categoryDiscountAmount = (rawBase * effectiveDiscountPercent) / 100;
  const priceAfterCategoryDiscount = Math.max(0, rawBase - categoryDiscountAmount - effectiveDiscountFixed);

  const rawUserDisc = parseNumericPrice(userDiscount);
  let userDiscountAmount = 0;
  if (userDiscountType === 'fixed') {
    userDiscountAmount = Math.min(priceAfterCategoryDiscount, rawUserDisc);
  } else {
    userDiscountAmount = (priceAfterCategoryDiscount * rawUserDisc) / 100;
  }

  const priceAfterDiscounts = Math.max(0, priceAfterCategoryDiscount - userDiscountAmount);
  const taxAmount = (priceAfterDiscounts * effectiveTaxPercent) / 100 + effectiveTaxFixed;
  const finalPrice = Math.round((priceAfterDiscounts + taxAmount) * 100) / 100;
  const totalSavings = Math.max(0, rawRegular - finalPrice);
  const totalDiscountPercentage = rawRegular > 0
    ? Math.round(((rawRegular - finalPrice) / rawRegular) * 100)
    : 0;
  const months = parseNumericPrice(installmentMonths);
  const monthlyInstallment = months > 0 ? Math.round((finalPrice / months) * 100) / 100 : null;

  return {
    rawBase,
    rawRegular,
    hasSalePrice: rawRegular > rawBase,
    categoryDiscountPercent: effectiveDiscountPercent,
    categoryDiscountAmount: Math.round((categoryDiscountAmount + effectiveDiscountFixed) * 100) / 100,
    categoryTitle: effectiveDiscountTitle,
    userDiscountPercent: userDiscountType === 'percentage' ? rawUserDisc : 0,
    userDiscountAmount: Math.round(userDiscountAmount * 100) / 100,
    categoryTaxPercent: effectiveTaxPercent,
    taxAmount: Math.round(taxAmount * 100) / 100,
    priceAfterDiscounts: Math.round(priceAfterDiscounts * 100) / 100,
    finalPrice,
    totalSavings: Math.round(totalSavings * 100) / 100,
    totalDiscountPercentage: Math.max(0, totalDiscountPercentage),
    monthlyInstallment,
  };
}
