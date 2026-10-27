<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Display a complete list of products and variations with live stock tracking.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $stockFilter = $request->input('filter', 'all'); // 'all', 'low', 'out', 'in'
        $storeFilter = $request->input('store'); // optional store ID filter
        $lowThreshold = (int) $request->input('threshold', 5);

        // Fetch products with their base metadata
        $query = DB::table('posts')
            ->where('posts.type', 'product')
            ->leftJoin('media', function ($join) {
                $join->on('media.parent_id', '=', 'posts.id')
                    ->where('media.type', '=', 'post');
            })
            ->select([
                'posts.id',
                'posts.title',
                'posts.sku',
                'posts.status',
                'posts.created_at',
                'media.filename as image',
            ])
            ->orderByDesc('posts.id');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('posts.title', 'like', "%{$search}%")
                    ->orWhere('posts.id', 'like', "%{$search}%");
            });
        }

        $allPosts = $query->get();
        $postIds = $allPosts->pluck('id')->toArray();

        // Fetch all relevant metadata for these posts
        $metas = !empty($postIds) ? DB::table('post_meta')
            ->whereIn('post_id', $postIds)
            ->whereIn('key', ['stock', 'sku', 'first_price', 'second_price', 'buy_price', 'category', 'brand', 'supplier', 'store'])
            ->get()
            ->groupBy('post_id') : collect();

        // Fetch variations
        $variations = !empty($postIds) ? DB::table('post_variations')
            ->whereIn('post_id', $postIds)
            ->whereNotNull('parent_id')
            ->get()
            ->groupBy('post_id') : collect();

        // Fetch taxonomy titles for category/brand/supplier labels
        $taxonomies = DB::table('taxonomies')->pluck('title', 'id')->toArray();

        // Fetch store posts for store lookup
        $stores = DB::table('posts')
            ->where('type', 'store')
            ->where('status', 'publish')
            ->pluck('title', 'id')
            ->toArray();

        $inventoryList = [];
        $totalItems = 0;
        $inStockCount = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;
        $totalStockUnits = 0;
        $totalInventoryValue = 0.0;
        $totalCostValue = 0.0;
        $totalProjectedProfit = 0.0;

        foreach ($allPosts as $post) {
            $postMeta = $metas->get($post->id, collect());
            $metaMap = [];
            foreach ($postMeta as $m) {
                $metaMap[$m->key] = $m->value;
            }

            $sku = $post->sku ?: ($metaMap['sku'] ?? ('SKU-' . $post->id));
            $buyPrice = (float) str_replace(',', '', $metaMap['buy_price'] ?? 0);
            $regPrice = (float) str_replace(',', '', $metaMap['first_price'] ?? 0);
            $salePrice = (float) str_replace(',', '', $metaMap['second_price'] ?? 0);
            $effectivePrice = ($salePrice > 0 && $salePrice < $regPrice) ? $salePrice : ($regPrice > 0 ? $regPrice : 0);

            $unitProfit = $effectivePrice - $buyPrice;
            $marginPct = ($effectivePrice > 0 && $buyPrice > 0) ? round(($unitProfit / $effectivePrice) * 100, 1) : 0;

            // Category resolution
            $categoryTitle = 'Uncategorized';
            if (!empty($metaMap['category'])) {
                $catVal = json_decode($metaMap['category'], true);
                if (is_array($catVal) && !empty($catVal)) {
                    $categoryTitle = $taxonomies[$catVal[0]] ?? 'General';
                } elseif (isset($taxonomies[$metaMap['category']])) {
                    $categoryTitle = $taxonomies[$metaMap['category']];
                }
            }

            // Brand resolution
            $brandTitle = 'Generic';
            if (!empty($metaMap['brand']) && isset($taxonomies[$metaMap['brand']])) {
                $brandTitle = $taxonomies[$metaMap['brand']];
            }

            // Supplier resolution
            $supplierTitle = 'Not Assigned';
            if (!empty($metaMap['supplier'])) {
                $supVal = json_decode($metaMap['supplier'], true);
                if (is_array($supVal) && !empty($supVal)) {
                    $supplierTitle = $taxonomies[$supVal[0]] ?? 'Vendor';
                } elseif (isset($taxonomies[$metaMap['supplier']])) {
                    $supplierTitle = $taxonomies[$metaMap['supplier']];
                }
            }

            // Store resolution
            $storeId = $metaMap['store'] ?? null;
            $storeTitle = $storeId && isset($stores[$storeId]) ? $stores[$storeId] : 'Not Assigned';

            $postVariations = $variations->get($post->id, collect());
            $hasVariations = $postVariations->isNotEmpty();

            if ($hasVariations) {
                $totalStock = 0;
                $variationRows = [];
                foreach ($postVariations as $var) {
                    $varStock = (int) $var->stock;
                    $varPrice = (float) ($var->price ?: $effectivePrice);
                    $totalStock += $varStock;
                    $totalStockUnits += $varStock;
                    $totalInventoryValue += ($varStock * $varPrice);
                    $totalCostValue += ($varStock * $buyPrice);
                    if ($buyPrice > 0) {
                        $totalProjectedProfit += ($varStock * ($varPrice - $buyPrice));
                    }

                    $variationRows[] = [
                        'id' => $var->id,
                        'name' => $var->name ?: "Variation #{$var->id}",
                        'stock' => $varStock,
                        'price' => $varPrice,
                        'color' => $var->color ?? null,
                    ];
                }

                $statusKey = $totalStock <= 0 ? 'out' : ($totalStock <= $lowThreshold ? 'low' : 'in');
                if ($statusKey === 'in') $inStockCount++;
                elseif ($statusKey === 'low') $lowStockCount++;
                else $outOfStockCount++;
                $totalItems++;

                $inventoryList[] = [
                    'id' => $post->id,
                    'title' => $post->title,
                    'sku' => $sku,
                    'image' => $post->image,
                    'category' => $categoryTitle,
                    'brand' => $brandTitle,
                    'supplier' => $supplierTitle,
                    'store_id' => $storeId,
                    'store' => $storeTitle,
                    'price' => $effectivePrice,
                    'buy_price' => $buyPrice,
                    'unit_profit' => $unitProfit,
                    'margin_pct' => $marginPct,
                    'stock' => $totalStock,
                    'has_variations' => true,
                    'variations' => $variationRows,
                    'status' => $post->status,
                    'stock_status' => $statusKey,
                ];
            } else {
                $stock = (int) str_replace(',', '', $metaMap['stock'] ?? 0);
                $totalStockUnits += $stock;
                $totalInventoryValue += ($stock * $effectivePrice);
                $totalCostValue += ($stock * $buyPrice);
                if ($buyPrice > 0) {
                    $totalProjectedProfit += ($stock * $unitProfit);
                }

                $statusKey = $stock <= 0 ? 'out' : ($stock <= $lowThreshold ? 'low' : 'in');
                if ($statusKey === 'in') $inStockCount++;
                elseif ($statusKey === 'low') $lowStockCount++;
                else $outOfStockCount++;
                $totalItems++;

                $inventoryList[] = [
                    'id' => $post->id,
                    'title' => $post->title,
                    'sku' => $sku,
                    'image' => $post->image,
                    'category' => $categoryTitle,
                    'brand' => $brandTitle,
                    'supplier' => $supplierTitle,
                    'store_id' => $storeId,
                    'store' => $storeTitle,
                    'price' => $effectivePrice,
                    'buy_price' => $buyPrice,
                    'unit_profit' => $unitProfit,
                    'margin_pct' => $marginPct,
                    'stock' => $stock,
                    'has_variations' => false,
                    'variations' => [],
                    'status' => $post->status,
                    'stock_status' => $statusKey,
                ];
            }
        }

        // Filter list based on store if requested
        if (!empty($storeFilter) && $storeFilter !== 'all') {
            $inventoryList = array_values(array_filter($inventoryList, fn($i) => (string)($i['store_id'] ?? '') === (string)$storeFilter));
        }

        // Filter list based on stock status if requested
        if ($stockFilter === 'out') {
            $inventoryList = array_values(array_filter($inventoryList, fn($i) => $i['stock_status'] === 'out'));
        } elseif ($stockFilter === 'low') {
            $inventoryList = array_values(array_filter($inventoryList, fn($i) => $i['stock_status'] === 'low'));
        } elseif ($stockFilter === 'in') {
            $inventoryList = array_values(array_filter($inventoryList, fn($i) => $i['stock_status'] === 'in'));
        }

        $currency = 'PKR';
        $settingPath = storage_path('app/data/setting.json');
        if (file_exists($settingPath)) {
            $settingsData = json_decode(file_get_contents($settingPath), true);
            $currency = $settingsData['site']['currency']['value'] ?? 'PKR';
        }

        $storeOptions = collect($stores)->map(fn($title, $id) => ['id' => $id, 'title' => $title])->values()->all();

        return Inertia::render('Admin/Inventory/Index', [
            'products' => $inventoryList,
            'stores' => $storeOptions,
            'filters' => [
                'search' => $search,
                'filter' => $stockFilter,
                'store' => $storeFilter,
                'threshold' => $lowThreshold,
            ],
            'stats' => [
                'total_products' => $totalItems,
                'in_stock' => $inStockCount,
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
                'total_units' => $totalStockUnits,
                'total_value' => round($totalInventoryValue),
                'total_cost' => round($totalCostValue),
                'total_projected_profit' => round($totalProjectedProfit),
                'currency' => $currency,
            ],
        ]);
    }

    /**
     * Quick-update a product's base stock.
     */
    public function updateStock(Request $request, $id)
    {
        $validated = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $post = DB::table('posts')->where('id', $id)->first();
        if (!$post) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        // Upsert stock into post_meta
        $existing = DB::table('post_meta')
            ->where('post_id', $id)
            ->where('key', 'stock')
            ->first();

        if ($existing) {
            DB::table('post_meta')
                ->where('id', $existing->id)
                ->update(['value' => (string) $validated['stock']]);
        } else {
            DB::table('post_meta')->insert([
                'post_id' => $id,
                'key' => 'stock',
                'value' => (string) $validated['stock'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Stock updated to {$validated['stock']} units.",
            'new_stock' => $validated['stock'],
        ]);
    }

    /**
     * Quick-update a variation's stock.
     */
    public function updateVariationStock(Request $request, $id)
    {
        $validated = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $variation = DB::table('post_variations')->where('id', $id)->first();
        if (!$variation) {
            return response()->json(['message' => 'Variation not found.'], 404);
        }

        DB::table('post_variations')
            ->where('id', $id)
            ->update(['stock' => $validated['stock']]);

        // Recalculate and update the parent's total stock meta for consistency
        $totalStock = DB::table('post_variations')
            ->where('post_id', $variation->post_id)
            ->whereNotNull('parent_id')
            ->sum('stock');

        $existing = DB::table('post_meta')
            ->where('post_id', $variation->post_id)
            ->where('key', 'stock')
            ->first();

        if ($existing) {
            DB::table('post_meta')
                ->where('id', $existing->id)
                ->update(['value' => (string) $totalStock]);
        } else {
            DB::table('post_meta')->insert([
                'post_id' => $variation->post_id,
                'key' => 'stock',
                'value' => (string) $totalStock,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Variation stock updated to {$validated['stock']} units.",
            'new_stock' => $validated['stock'],
            'parent_total' => $totalStock,
        ]);
    }

    /**
     * Bulk stock update.
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|integer',
            'updates.*.stock' => 'required|integer|min:0',
            'updates.*.is_variation' => 'nullable|boolean',
        ]);

        foreach ($validated['updates'] as $update) {
            if (!empty($update['is_variation'])) {
                DB::table('post_variations')
                    ->where('id', $update['id'])
                    ->update(['stock' => $update['stock']]);
            } else {
                DB::table('post_meta')
                    ->updateOrInsert(
                        ['post_id' => $update['id'], 'key' => 'stock'],
                        ['value' => (string) $update['stock']]
                    );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Bulk inventory levels updated successfully.',
        ]);
    }
}
