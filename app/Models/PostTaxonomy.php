<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PostTaxonomy extends Model
{
    use HasFactory;
    public $table = 'taxonomies';
    protected $appends = ['variations'];
    public $timestamps = false;
    public static function forTable($tableName)
    {
        $instance = new static;
        $instance->setTable($tableName);
        return $instance->newQuery();
    }
    public function image()
    {
        $type = $this->getTable() === 'posts' ? 'post' : 'taxonomy';
        return $this->hasOne(Media::class, 'parent_id', 'id')->where('type', $type);
    }
    public function parent()
    {
        return $this->hasOne(PostTaxonomy::class, 'id', 'parent_id');
    }
    public function gallery()
    {
        return $this->hasMany(Media::class, 'parent_id', 'id')->where('type', 'post_gallery');
    }
    public function meta()
    {
        $instance = new static;
        if ($this->getTable() === 'posts') {
            $instance->setTable('post_meta');

            return new \Illuminate\Database\Eloquent\Relations\HasMany($instance->newQuery(), $this, $instance->getTable() . '.post_id', $this->getKeyName());
        } else {
            $instance->setTable('taxonomy_meta');
            return new \Illuminate\Database\Eloquent\Relations\HasMany($instance->newQuery(), $this, $instance->getTable() . '.taxonomy_id', $this->getKeyName());
        }
    }
    public static function get_attribute($collection, $table = '', $key = '', $source = '', $meta_key = '', $default = '')
    {
        if ($source !== 'from_meta' || empty($collection)) {
            return $collection;
        }

        $metaKeys = is_array($meta_key) ? $meta_key : [$meta_key];
        $allIds = [];

        // Step 1: Extract all IDs from meta values
        foreach ($collection as $item) {
            if (!$item->meta) continue;

            $metas = $item->meta->whereIn('key', $metaKeys);
            foreach ($metas as $meta) {
                $val = json_decode($meta->value, true);
                if (is_array($val)) {
                    $allIds = array_merge($allIds, $val);
                } else {
                    $allIds[] = $meta->value;
                }
            }
        }

        $allIds = array_unique(array_filter($allIds));

        // Step 2: Batch fetch related records
        $related = [];
        if (!empty($allIds) && !empty($table)) {
            $fetched = \Illuminate\Support\Facades\DB::table($table)
                ->whereIn('id', $allIds)
                ->get()
                ->keyBy('id');

            $mediaType = ($table === 'posts') ? 'post' : (($table === 'taxonomies') ? 'taxonomy' : \Illuminate\Support\Str::singular($table));
            $media = \Illuminate\Support\Facades\DB::table('media')
                ->whereIn('parent_id', $allIds)
                ->where('type', $mediaType)
                ->get()
                ->keyBy('parent_id');

            foreach ($fetched as $id => $item) {
                $item->image = $media[$id] ?? null;
                $related[$id] = $item;
            }

            if ($table === 'taxonomies' && Schema::hasTable('taxonomy_meta')) {
                $taxMetas = \Illuminate\Support\Facades\DB::table('taxonomy_meta')
                    ->whereIn('taxonomy_id', $allIds)
                    ->get()
                    ->groupBy('taxonomy_id');

                foreach ($related as $id => $item) {
                    $itemMetas = $taxMetas->get($id, collect());
                    $metaAssoc = [];
                    foreach ($itemMetas as $tm) {
                        $metaAssoc[$tm->key] = $tm->value;
                    }
                    $item->meta = $metaAssoc;
                    foreach ($metaAssoc as $mKey => $mVal) {
                        if (!isset($item->$mKey)) {
                            $item->$mKey = $mVal;
                        }
                    }
                }
            }
        }

        // Step 3: Map related records back to collection items
        foreach ($collection as $item) {
            if (is_array($meta_key)) {
                foreach ($metaKeys as $mKey) {
                    $item->$mKey = $default;
                }
            } else {
                $item->$meta_key = $default;
            }
            if (!$item->meta) continue;
            $metas = $item->meta->whereIn('key', $metaKeys);
            foreach ($metas as $meta) {
                $currentMetaKey = $meta->key;
                $val = json_decode($meta->value, true);
                if (is_array($val)) {
                    $mapped = [];
                    foreach ($val as $id) {
                        if (isset($related[$id])) {
                            $mapped[] = $key ? $related[$id]->$key : $related[$id];
                        }
                    }
                    $item->$currentMetaKey = $mapped;
                } else {
                    $id = $meta->value;
                    if (isset($related[$id])) {
                        $item->$currentMetaKey = $key ? $related[$id]->$key : $related[$id];
                    }
                }
            }
        }
        return $collection;
    }
    // In PostTaxonomy.php

    // Rename the method to be an accessor
    public function getVariationsAttribute()
    {
        // Add a safety check in case the model is new and hasn't been saved yet
        if (!$this->id) {
            return null;
        }

        $rftl = [];

        // Query parent variations (color groups)
        $parentVariations = DB::table('post_variations')
            ->where('post_id', $this->id)
            ->whereNull('parent_id')
            ->get();

        $formattedVariations = [];

        foreach ($parentVariations as $parent) {
            $vImage = DB::table('media')->where([
                'type'      => 'post_variation', // or whatever type you use for variations
                'parent_id' => $parent->id,
            ])->first();

            // Get shared attributes for the parent
            $parentValues = DB::table('product_variation_values')->where('variation_id', $parent->id)->get();
            $sharedAttributes = [];
            foreach ($parentValues as $v) {
                $option = DB::table('attribute_values')->where('id', $v->attribute_option_id)->first();
                if ($option) {
                    $attr = DB::table('attributes')->where('id', $option->attribute_id)->first();
                    if ($attr) {
                        $sharedAttributes[] = ['key' => $attr->name, 'value' => $option->value, 'id' => $option->id];
                    }
                }
            }

            // Query child variations (combinations)
            $childVariations = DB::table('post_variations')
                ->where('parent_id', $parent->id)
                ->get();

            $combinations = [];
            $totalStock = 0;
            $minPrice = $parent->price;

            foreach ($childVariations as $child) {
                $childValues = DB::table('product_variation_values')->where('variation_id', $child->id)->get();
                $comboAttributes = [];
                foreach ($childValues as $v) {
                    $option = DB::table('attribute_values')->where('id', $v->attribute_option_id)->first();
                    if ($option) {
                        $attr = DB::table('attributes')->where('id', $option->attribute_id)->first();
                        if ($attr) {
                            $comboAttributes[] = ['key' => $attr->name, 'value' => $option->value, 'id' => $option->id];
                        }
                    }
                }

                $combinations[] = [
                    'id' => $child->id,
                    'price' => $child->price,
                    'stock' => $child->stock,
                    'attributes' => $comboAttributes
                ];

                $totalStock += (int) $child->stock;
                if ($minPrice === 0 || ($child->price > 0 && $child->price < $minPrice)) {
                    $minPrice = $child->price;
                }
            }

            $formattedVariations[] = [
                'id'                => $parent->id,
                'price'             => $minPrice,
                'stock'             => $totalStock,
                'color'             => $parent->color ?? '',
                'image'             => $vImage ? $vImage->filename : null,
                'combinations'      => $combinations,
                'shared_attributes' => $sharedAttributes,
                'attributes'        => [] // some legacy code might expect this on the root object
            ];
        }

        // Convert to objects if needed by the frontend (previously it returned object representations of DB rows)
        foreach ($formattedVariations as $grp) {
            $rftl[] = (object) $grp;
        }

        return $rftl;
    }
    public function getRealPriceAfterRuleAttribute()
    {
        if (!$this->id) {
            return null;
        }
        $priorityDiscountRule = [];
        $priorityTaxRule = [];
        $productRules = DB::table('promotions_and_tax_rules')->where('target_type', 'product')->where("status", "active")->get();
        $prorityProductTaxRule = null;
        $prorityProductDiscountRule = null;
        foreach ($productRules as $kk => $value) {
            if ($value->type == 'tax') {

                foreach (is_string($value->target_ids) ? json_decode($value->target_ids) : $value->target_ids as $k => $val) {

                    if ($val == $this->id) {

                        if (
                            $prorityProductTaxRule === null ||
                            $value->priority > $prorityProductTaxRule->priority
                        ) {

                            $prorityProductTaxRule = $value;
                        }
                    }
                }
            }

            if ($value->type == "discount") {
                $discTargetIds = is_string($value->target_ids) ? json_decode($value->target_ids, true) : $value->target_ids;
                foreach ((array) $discTargetIds as $k => $val) {
                    if ($val == $this->id) {
                        if (
                            $prorityProductDiscountRule === null ||
                            $value->priority > $prorityProductDiscountRule->priority
                        ) {
                            $prorityProductDiscountRule = $value;
                        }
                    }
                }
            }
        }
        if ($prorityProductDiscountRule !== null) {
            $priorityDiscountRule[] = $prorityProductDiscountRule;
        }
        if ($prorityProductTaxRule !== null) {
            $priorityTaxRule[] = $prorityProductTaxRule;
        }
        $variations = $this->variations;
        $meta = $this->meta;
        $prices = [];
        if (!empty($meta)) {
            foreach ($meta as $value) {
                if ($value->key == 'category') {
                    $categoryIDs = is_string($value->value)
                        ? json_decode($value->value, true)
                        : $value->value;
                    if (!is_array($categoryIDs)) {
                        $categoryIDs = [];
                    }
                    $priorityCategoryTaxRule = null;
                    $priorityCategoryDiscountRule = null;
                    foreach ($categoryIDs as $categoryID) {
                        $rules = DB::table('promotions_and_tax_rules')
                            ->where('target_type', 'category')
                            ->where('status', 'active')
                            ->get()
                            ->filter(function ($rule) use ($categoryID) {
                                $targetIDs = is_string($rule->target_ids)
                                    ? json_decode($rule->target_ids, true)
                                    : $rule->target_ids;
                                return is_array($targetIDs)
                                    && in_array((string) $categoryID, array_map('strval', $targetIDs), true);
                            });
                        foreach ($rules as $rule) {
                            if ($rule->type === 'tax') {
                                if (
                                    $priorityCategoryTaxRule === null ||
                                    $rule->priority > $priorityCategoryTaxRule->priority
                                ) {
                                    $priorityCategoryTaxRule = $rule;
                                }
                            }
                            if ($rule->type === 'discount') {
                                if (
                                    $priorityCategoryDiscountRule === null ||
                                    $rule->priority > $priorityCategoryDiscountRule->priority
                                ) {
                                    $priorityCategoryDiscountRule = $rule;
                                }
                            }
                        }
                    }
                    if ($priorityCategoryDiscountRule !== null) {
                        $priorityDiscountRule[] = $priorityCategoryDiscountRule;
                    }
                    if ($priorityCategoryTaxRule !== null) {
                        $priorityTaxRule[] = $priorityCategoryTaxRule;
                    }
                }
                if ($value->key == 'collection') {

                    $collectionIDs = is_string($value->value)
                        ? json_decode($value->value, true)
                        : $value->value;
                    if (!is_array($collectionIDs)) {
                        $collectionIDs = [];
                    }
                    $priorityCollectionTaxRule = null;
                    $priorityCollectionDiscountRule = null;
                    foreach ($collectionIDs as $collectionID) {
                        $rules = DB::table('promotions_and_tax_rules')
                            ->where('target_type', 'collection')
                            ->where('status', 'active')
                            ->get()
                            ->filter(function ($rule) use ($collectionID) {
                                $targetIDs = is_string($rule->target_ids)
                                    ? json_decode($rule->target_ids, true)
                                    : $rule->target_ids;
                                return is_array($targetIDs)
                                    && in_array((string) $collectionID, array_map('strval', $targetIDs), true);
                            });
                        foreach ($rules as $rule) {
                            if ($rule->type === 'tax') {
                                if (
                                    $priorityCollectionTaxRule === null ||
                                    $rule->priority > $priorityCollectionTaxRule->priority
                                ) {
                                    $priorityCollectionTaxRule = $rule;
                                }
                            }
                            if ($rule->type === 'discount') {
                                if (
                                    $priorityCollectionDiscountRule === null ||
                                    $rule->priority > $priorityCollectionDiscountRule->priority
                                ) {
                                    $priorityCollectionDiscountRule = $rule;
                                }
                            }
                        }
                    }
                    if ($priorityCollectionDiscountRule !== null) {
                        $priorityDiscountRule[] = $priorityCollectionDiscountRule;
                    }
                    if ($priorityCollectionTaxRule !== null) {
                        $priorityTaxRule[] = $priorityCollectionTaxRule;
                    }
                }
                if ($value->key == 'brand') {
                    $brandId = $value->value;
                    $priorityBrandTaxRule = null;
                    $priorityBrandDiscountRule = null;
                    $rules = DB::table('promotions_and_tax_rules')
                        ->where('target_type', 'brand')
                        ->where('status', 'active')
                        ->get()
                        ->filter(function ($rule) use ($brandId) {
                            $targetIDs = is_string($rule->target_ids)
                                ? json_decode($rule->target_ids, true)
                                : $rule->target_ids;
                            return is_array($targetIDs)
                                && in_array((string) $brandId, array_map('strval', $targetIDs), true);
                        });
                    foreach ($rules as $rule) {
                        if ($rule->type === 'tax') {
                            if (
                                $priorityBrandTaxRule === null ||
                                $rule->priority > $priorityBrandTaxRule->priority
                            ) {
                                $priorityBrandTaxRule = $rule;
                            }
                        }
                        if ($rule->type === 'discount') {
                            if (
                                $priorityBrandDiscountRule === null ||
                                $rule->priority > $priorityBrandDiscountRule->priority
                            ) {
                                $priorityBrandDiscountRule = $rule;
                            }
                        }
                    }


                    if ($priorityBrandDiscountRule !== null) {
                        $priorityDiscountRule[] = $priorityBrandDiscountRule;
                    }

                    if ($priorityBrandTaxRule !== null) {
                        $priorityTaxRule[] = $priorityBrandTaxRule;
                    }
                }
            }
        }
        // ── User & role rules (only for authenticated users) ──────────────────
        $user_id = Auth::id();
        if ($user_id) {
            $userRules = DB::table('promotions_and_tax_rules')
                ->where('target_type', 'user')
                ->where('status', 'active')
                ->get()
                ->filter(function ($rule) use ($user_id) {
                    $targetIDs = is_string($rule->target_ids)
                        ? json_decode($rule->target_ids, true)
                        : $rule->target_ids;
                    return is_array($targetIDs)
                        && in_array((string) $user_id, array_map('strval', $targetIDs), true);
                });

            $priorityUserTaxRule      = $userRules->where('type', 'tax')->sortByDesc('priority')->first();
            $priorityUserDiscountRule = $userRules->where('type', 'discount')->sortByDesc('priority')->first();

            if ($priorityUserDiscountRule !== null) {
                $priorityDiscountRule[] = $priorityUserDiscountRule;
            }
            if ($priorityUserTaxRule !== null) {
                $priorityTaxRule[] = $priorityUserTaxRule;
            }

            // Role-based rules
            $userRow = DB::table('users')->where('id', $user_id)->first();
            $roles   = [];
            if ($userRow) {
                $rawRoles = $userRow->roles ?? $userRow->user_role ?? null;
                if (is_string($rawRoles)) {
                    $decoded = json_decode($rawRoles, true);
                    $roles   = is_array($decoded) ? $decoded : [$rawRoles];
                } elseif (is_array($rawRoles)) {
                    $roles = $rawRoles;
                }
            }

            $userRoleRules = DB::table('promotions_and_tax_rules')
                ->where('target_type', 'user_role')
                ->where('status', 'active')
                ->get()
                ->filter(function ($rule) use ($roles) {
                    $targetIDs = is_string($rule->target_ids)
                        ? json_decode($rule->target_ids, true)
                        : $rule->target_ids;
                    if (!is_array($targetIDs) || empty($roles)) {
                        return false;
                    }
                    $rolesToMatch = is_array($roles) ? $roles : [$roles];
                    return !empty(array_intersect(
                        array_map('strval', $rolesToMatch),
                        array_map('strval', $targetIDs)
                    ));
                });

            $priorityUserRoleTaxRule      = $userRoleRules->where('type', 'tax')->sortByDesc('priority')->first();
            $priorityUserRoleDiscountRule = $userRoleRules->where('type', 'discount')->sortByDesc('priority')->first();

            if ($priorityUserRoleDiscountRule !== null) {
                $priorityDiscountRule[] = $priorityUserRoleDiscountRule;
            }
            if ($priorityUserRoleTaxRule !== null) {
                $priorityTaxRule[] = $priorityUserRoleTaxRule;
            }
        }

        // ── Resolve base price ─────────────────────────────────────────────────
        $basePrice = 0.0;
        if (!empty($meta)) {
            $metaMap = collect($meta)->pluck('value', 'key');
            $second  = (float) str_replace([',', ' '], '', (string) ($metaMap['second_price'] ?? ''));
            $first   = (float) str_replace([',', ' '], '', (string) ($metaMap['first_price'] ?? ''));
            if ($second > 0 && $first > 0 && $first > $second) {
                $basePrice = $second;   // on-sale: second_price is the discounted price
            } elseif ($second > 0) {
                $basePrice = $second;
            } elseif ($first > 0) {
                $basePrice = $first;
            }
        }

        // For variation products use the cheapest active combination price
        if ($basePrice == 0.0 && !empty($variations)) {
            $minPrice = null;
            foreach ($variations as $parent) {
                if (isset($parent->combinations) && is_array($parent->combinations)) {
                    foreach ($parent->combinations as $child) {
                        $p = isset($child['price']) ? (float) $child['price'] : 0.0;
                        if ($p > 0 && ($minPrice === null || $p < $minPrice)) {
                            $minPrice = $p;
                        }
                    }
                }
            }
            $basePrice = $minPrice ?? 0.0;
        }

        if ($basePrice <= 0.0) {
            return null; // price unknown — cannot apply rules
        }

        // ── Pick the single best discount rule (highest effective savings) ─────
        $bestDiscountRule   = null;
        $bestDiscountAmount = 0.0;
        foreach ($priorityDiscountRule as $rule) {
            $rate   = (float) $rule->rate_value;
            $amount = $rule->rate_type === 'fixed' ? $rate : ($basePrice * $rate / 100);
            if (
                $amount > $bestDiscountAmount ||
                ($bestDiscountRule !== null && $rule->priority > $bestDiscountRule->priority)
            ) {
                $bestDiscountAmount = $amount;
                $bestDiscountRule   = $rule;
            }
        }

        // ── Apply discount ────────────────────────────────────────────────────
        $priceAfterDiscount = $basePrice;
        if ($bestDiscountRule !== null) {
            $rate           = (float) $bestDiscountRule->rate_value;
            $discountAmount = $bestDiscountRule->rate_type === 'fixed'
                ? $rate
                : ($basePrice * $rate / 100);
            $priceAfterDiscount = max(0.0, $basePrice - $discountAmount);
        }

        // ── Pick the single best tax rule (highest effective tax amount) ───────
        $bestTaxRule   = null;
        $bestTaxAmount = 0.0;
        foreach ($priorityTaxRule as $rule) {
            $rate   = (float) $rule->rate_value;
            $amount = $rule->rate_type === 'fixed' ? $rate : ($priceAfterDiscount * $rate / 100);
            if (
                $amount > $bestTaxAmount ||
                ($bestTaxRule !== null && $rule->priority > $bestTaxRule->priority)
            ) {
                $bestTaxAmount = $amount;
                $bestTaxRule   = $rule;
            }
        }

        // ── Apply tax ─────────────────────────────────────────────────────────
        $finalPrice = $priceAfterDiscount;
        if ($bestTaxRule !== null) {
            $rate      = (float) $bestTaxRule->rate_value;
            $taxAmount = $bestTaxRule->rate_type === 'fixed'
                ? $rate
                : ($priceAfterDiscount * $rate / 100);
            $finalPrice = $priceAfterDiscount + $taxAmount;
        }

        return round($finalPrice, 2);
    }

    public function getTotalPriceAttribute()
    {
        $variations = $this->variations;
        $meta = $this->meta;
        if (empty($variations)) {
            if (empty($meta)) return 0.0;
            else {
                foreach ($meta as  $value) {
                    if ($value->key === 'first_price') {
                        return $value->value;
                    }
                }
                return 0.0;
            }
        }

        $grandTotal = 0.0;

        foreach ($variations as $parent) {
            if (isset($parent->combinations) && is_array($parent->combinations)) {
                foreach ($parent->combinations as $child) {
                    $price = isset($child['price']) ? (float) $child['price'] : 0.0;
                    $stock = isset($child['stock']) ? (int) $child['stock'] : 0;

                    $grandTotal += ($price * $stock);
                }
            }
        }

        return $grandTotal;
    }
    public function getBuyPriceAttribute()
    {
        $variations = $this->variations;
        $meta = $this->meta;

        if (!empty($meta)) {
            $buyVal = null;
            if ($meta instanceof \Illuminate\Support\Collection || is_array($meta)) {
                // If keyed by 'key' (from hydrate_posts keyBy('key'))
                if (isset($meta['buy_price'])) {
                    $item = $meta['buy_price'];
                    $buyVal = is_object($item) ? ($item->value ?? null) : (is_array($item) ? ($item['value'] ?? null) : $item);
                } else {
                    foreach ($meta as $k => $value) {
                        if (is_object($value) && isset($value->key) && $value->key === 'buy_price') {
                            $buyVal = $value->value;
                            break;
                        } elseif (is_array($value) && isset($value['key']) && $value['key'] === 'buy_price') {
                            $buyVal = $value['value'];
                            break;
                        }
                    }
                }
            }
            if ($buyVal !== null && $buyVal !== '') {
                return (float) str_replace(',', '', (string) $buyVal);
            }
        }

        if (!empty($variations)) {
            foreach ($variations as $parent) {
                if (isset($parent->combinations) && is_array($parent->combinations)) {
                    foreach ($parent->combinations as $child) {
                        if (isset($child['buy_price']) && (float) $child['buy_price'] > 0) {
                            return (float) $child['buy_price'];
                        }
                    }
                }
            }
        }

        return 0.0;
    }

    public function getTotalBuyPriceAttribute()
    {
        $variations = $this->variations;
        $unitBuyPrice = (float) $this->buy_price;

        // If product has variations with combinations
        if (!empty($variations)) {
            $grandBuyTotal = 0.0;
            $hasCombo = false;
            foreach ($variations as $parent) {
                if (isset($parent->combinations) && is_array($parent->combinations)) {
                    foreach ($parent->combinations as $child) {
                        $hasCombo = true;
                        $cBuy = isset($child['buy_price']) && (float) $child['buy_price'] > 0
                            ? (float) $child['buy_price']
                            : $unitBuyPrice;
                        $cStock = isset($child['stock']) ? (int) $child['stock'] : 0;
                        $grandBuyTotal += ($cBuy * $cStock);
                    }
                }
            }
            if ($hasCombo) {
                return $grandBuyTotal;
            }
        }

        // Simple product: unit buy price * real stock
        $realStock = (int) $this->stock;
        return $unitBuyPrice * ($realStock > 0 ? $realStock : 0);
    }
    public function getPriceAttribute()
    {
        $variations = $this->variations;
        $meta = $this->meta;
        if (!empty($meta)) {
            foreach ($meta as  $value) {
                if ($value->key === 'first_price') {
                    $first_price = $value->value;
                }
                if ($value->key == "second_price") {
                    $second_price = $value->value;
                }
            }
            if (isset($first_price) && $first_price > $second_price) {
                return $second_price;
            }
            return $first_price;
        } else {

            foreach ($variations as $parent) {
                if (isset($parent->combinations) && is_array($parent->combinations)) {
                    $price = isset($parent->combinations[0]['price']) ? (float) $parent->combinations[0]['price'] : 0.0;
                    return $price;
                }
            }
        }
    }
    public function getStockAttribute()
    {
        $variations = $this->variations;
        $meta = $this->meta;
        if (empty($variations)) {
            if (empty($meta)) return 0;
            else {
                foreach ($meta as  $value) {
                    if ($value->key === 'stock') {
                        return $value->value;
                    }
                }
                return 0;
            }
        }

        $grandStock = 0;

        foreach ($variations as $parent) {
            if (isset($parent->combinations) && is_array($parent->combinations)) {
                foreach ($parent->combinations as $child) {
                    $stock = isset($child['stock']) ? (int) $child['stock'] : 0;
                    $grandStock += ($stock);
                }
            }
        }

        return $grandStock;
    }
}
