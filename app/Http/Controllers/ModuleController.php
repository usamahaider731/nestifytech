<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\ModuleHandler;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class ModuleController extends Controller
{
    use ModuleHandler;

    private function checkPermission(string $type, string $action)
    {
        $user = auth()->user();
        if (!$user)
            abort(403);
        $user = User::find($user->id);

        $permission = strtolower($type) . '-' . strtolower($action);
        if (!in_array($permission, $user->user_permissions)) {
            abort(403, "Access Denied: Permission '{$permission}' is required.");
        }
    }

    /**
     * Unified Index handler for all modules.
     */
    public function index(Request $request, $type, $id = null)
    {
        $this->checkPermission($type, 'read');

        $dbConfig = $this->loadModuleConfig($type, 'DB');
        $query = null;

        if ($dbConfig && isset($dbConfig['table'])) {
            $tableName = $dbConfig['table'];
            $query = DB::table($tableName);

            // Apply fixed fields (like type='product')
            if (isset($dbConfig['fixed_fields'])) {
                foreach ($dbConfig['fixed_fields'] as $key => $val) {
                    if (Schema::hasColumn($tableName, $key)) {
                        if ($val === 'auth_id') {
                            $query->where($key, auth()->id());
                        } else {
                            $query->where($key, $val);
                        }
                    }
                }
            }

            // Specialized category filtering if configured
            if ($id && ($dbConfig['features']['category_filter'] ?? false)) {
                $category = DB::table('taxonomies')->where(['type' => 'category', 'id' => $id])->first();
                if ($category) {
                    $metaTable = $dbConfig['meta_table'] ?? (Str::singular($tableName) . '_meta');
                    $metaKey = $dbConfig['meta_key'] ?? (Str::singular($tableName) . '_id');
                    $query->join($metaTable, "{$tableName}.id", '=', "{$metaTable}.{$metaKey}")
                        ->where("{$metaTable}.key", 'category')
                        ->where("{$metaTable}.value", 'like', '%"' . $category->id . '"%')
                        ->select("{$tableName}.*");
                }
            }
        }

        if (!$query) {
            if ($type === 'roles') {
                $query = DB::table('roles');
            } else {
                $query = DB::table('taxonomies')->where('type', $type);
                if ($type === 'category' && !$request->search) {
                    $query->where('parent_id', $id ?? 0);
                }
            }
        }

        $result = $this->handleTableRequest($request, $type, $query);

        if (($request->ajax() || $request->wantsJson()) && !$request->hasHeader('X-Inertia')) {
            return response()->json($result['data']);
        }

        // Module Specific View Mapping & Data
        $view = $this->resolveView($type, 'Index');
        $additionalData = $this->getAdditionalTableData($type, $result);

        // Map 'data' to plural type name for backward compatibility with frontend Index files
        $pluralType = Str::plural($type);

        return Inertia::render($view, array_merge([
            $pluralType => $result['data'],
            'data' => $result['data'],
            'table' => $result['table'],
            'type' => $type,
            'formData' => $result['formData']
        ], $additionalData));
    }

    /**
     * Unified Create handler.
     */
    public function create(Request $request, $type)
    {
        $this->checkPermission($type, 'write');
        $data = $this->loadModuleConfig($type, 'Form');
        $view = $this->resolveView($type, 'Create');

        return Inertia::render($view, [
            'Data' => $data[$type] ?? $data ?? [],
            'data' => $data[$type] ?? $data ?? [],
            'type' => $type,
            'mode' => 'create',
            'routes' => route('module.submit', ['type' => $type]),
            'redirectUrl' => route('module.index', ['type' => $type])
        ]);
    }

    /**
     * Unified Edit handler.
     */
    public function edit(Request $request, $type, $id)
    {
        if($type && is_numeric($type) && !is_numeric($id) && !empty($id)){
        
        }
        $this->checkPermission($type, 'write');
        // Fix for swapped parameters when using defaults() in legacy routes
        if (is_numeric($type) && !is_numeric($id) && !empty($id)) {
            $temp = $type;
            $type = $id;
            $id = $temp;
        }

        $dbConfig = $this->loadModuleConfig($type, 'DB');
        $table = $dbConfig['table'] ?? Str::plural($type);

        $record = DB::table($table)->where('id', $id)->first();
        if (!$record)
            abort(404);

        // Fetch meta if table exists
        $metaTable = $dbConfig['meta_table'] ?? (\Illuminate\Support\Str::singular($table) . '_meta');
        if (Schema::hasTable($metaTable)) {
            $metaKey = $dbConfig['meta_key'] ?? (\Illuminate\Support\Str::singular($table) . '_id');
            $record->meta = DB::table($metaTable)->where($metaKey, $id)->get();
        }

        // Transform record for frontend if needed
        $initialData = $this->transformForEdit($record, $type, $dbConfig);

        $formData = $this->loadModuleConfig($type, 'Form');
        $view = $this->resolveView($type, 'Edit');

        return Inertia::render($view, [
            'Data' => $formData[$type] ?? $formData ?? [],
            'data' => $formData[$type] ?? $formData ?? [],
            'initialData' => $initialData,
            'record' => $record,
            'category' => $record,
            'type' => $type,
            'mode' => 'edit',
            'routes' => route('module.submit', ['type' => $type, 'id' => $id]),
            'redirectUrl' => route('module.index', ['type' => $type])
        ]);
    }

    /**
     * Unified Submit (Store/Update) handler.
     */
    public function submit(Request $request, $type, $id = null)
    {

        $this->checkPermission($type, 'write');
        // Fix for swapped parameters when using defaults() in legacy routes
        if (is_numeric($type) && !is_numeric($id) && !empty($id)) {
            $temp = $type;
            $type = $id;
            $id = $temp;
        }

        $response = $this->handleSubmission($request, $type, $id);
        if (($request->ajax() || $request->wantsJson()) && !$request->hasHeader('X-Inertia')) {
            return response()->json($response, $response['success'] ? 200 : 500);
        }

        if ($response['success']) {
            return redirect()->back()->with('success', $response['message']);
        } else {
            return back()->with('error', $response['message'])->withInput();
        }
    }

    /**
     * Unified Migrate handler.
     */
    public function migrate(Request $request, $type)
    {
        $response = $this->migrateModule($type);

        if (($request->ajax() || $request->wantsJson()) && !$request->hasHeader('X-Inertia')) {
            return response()->json($response);
        }

        return redirect()->back()->with($response['success'] ? 'success' : 'error', $response['message']);
    }

    /**
     * Unified Destroy handler.
     */
    public function destroy(Request $request)
    {
        $id = $request->id;
        try {
            $type = $request->route('type');
            $this->checkPermission($type, 'delete');
            $dbConfig = $this->loadModuleConfig($type, 'DB');
            $table = $dbConfig['table'] ?? Str::plural($type);

            DB::table($table)->where('id', $id)->delete();

            return response()->json(['success' => true, 'message' => ucfirst($type) . ' deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete: ' . $e->getMessage()], 500);
        }
    }

    private function resolveView($type, $page)
    {
        // Unify all module forms into a single view
        if (in_array($page, ['Create', 'Edit'])) {
            return "Admin/Module/Form";
        }

        // Unify all module index pages into a single view
        return "Admin/Module/Index";
    }

    private function getAdditionalTableData($type, $result)
    {
        if ($type === 'user') {
            $totalUsers        = DB::table('users')->count();
            $activeUsers       = DB::table('users')->where('active', 1)->count();
            $inactiveUsers     = $totalUsers - $activeUsers;
            $recentlyActive    = DB::table('users')->where('updated_at', '>=', now()->subDays(7))->count();
            $onlineUsers       = DB::table('users')->where('last_seen_at', '>=', now()->subMinutes(5))->count();

            $previousTotal     = DB::table('users')->where('created_at', '<', now()->subDays(7))->count();
            $percentChange     = $previousTotal > 0 ? round((($totalUsers - $previousTotal) / $previousTotal) * 100, 1) : ($totalUsers > 0 ? 100 : 0);
            $activePercentage  = $totalUsers > 0 ? round(($recentlyActive / $totalUsers) * 100, 1) : 0;
            $onlinePercentage  = $totalUsers > 0 ? round(($onlineUsers / $totalUsers) * 100, 1) : 0;

            return [
                'users'     => $result['data'],
                'userStats' => [
                    'total'                 => $totalUsers,
                    'active_count'          => $activeUsers,
                    'inactive_count'        => $inactiveUsers,
                    'recently_active_count' => $recentlyActive,
                    'online_count'          => $onlineUsers,
                    'percent_change'        => $percentChange,
                    'active_percentage'     => $activePercentage,
                    'online_percentage'     => $onlinePercentage,
                ],
                'table' => $result['table']['user'] ?? $result['table'],
            ];
        }

        // Helper for percentage change
        $calcChange = function ($currentActivity, $pastActivity) {
            if ($pastActivity == 0) return $currentActivity > 0 ? 100 : 0;
            return round((($currentActivity - $pastActivity) / $pastActivity) * 100, 1);
        };

        $dbConfig  = $this->loadModuleConfig($type, 'DB');
        $tableName = $dbConfig['table'] ?? null;

        $now = now();
        $oneWeekAgo = now()->subDays(7);
        $twoWeeksAgo = now()->subDays(14);

        // ── Posts-based modules (product, listing, etc.) ────────────────────
        if ($tableName === 'posts') {
            $base     = DB::table('posts')->where('type', $type);
            $thisWeek = (clone $base)->where('updated_at', '>=', $oneWeekAgo);
            $lastWeek = (clone $base)->where('updated_at', '>=', $twoWeeksAgo)->where('updated_at', '<', $oneWeekAgo);

            $total       = (clone $base)->count();
            $publish     = (clone $base)->where('status', 'publish')->count();
            $draft       = (clone $base)->where('status', 'draft')->count();
            $other       = $total - $publish - $draft;

            $thisWeekTotal   = (clone $thisWeek)->count();
            $thisWeekPublish = (clone $thisWeek)->where('status', 'publish')->count();
            $thisWeekDraft   = (clone $thisWeek)->where('status', 'draft')->count();
            $thisWeekOther   = $thisWeekTotal - $thisWeekPublish - $thisWeekDraft;

            $lastWeekTotal   = (clone $lastWeek)->count();
            $lastWeekPublish = (clone $lastWeek)->where('status', 'publish')->count();
            $lastWeekDraft   = (clone $lastWeek)->where('status', 'draft')->count();
            $lastWeekOther   = $lastWeekTotal - $lastWeekPublish - $lastWeekDraft;
            
            $stats = [
                'total'            => $thisWeekTotal,
                'total_change'     => $calcChange($thisWeekTotal, $lastWeekTotal),
                'published'        => $thisWeekPublish,
                'published_change' => $calcChange($thisWeekPublish, $lastWeekPublish),
                'draft'            => $thisWeekDraft,
                'draft_change'     => $calcChange($thisWeekDraft, $lastWeekDraft),
                'other'            => $thisWeekOther,
                'other_change'     => $calcChange($thisWeekOther, $lastWeekOther),
            ];
            
            if ($type === 'product') {
                $checkStock = function($query) {
                    $inStock = 0;
                    $postIds = $query->pluck('id')->toArray();
                    if (empty($postIds)) return 0;
                    
                    $meta = DB::table('post_meta')
                        ->whereIn('post_id', $postIds)
                        ->whereIn('key', ['stock', 'variations'])
                        ->get()
                        ->groupBy('post_id');
                        
                    foreach ($postIds as $pid) {
                        $pMeta = $meta->get($pid, collect());
                        $stockMeta = $pMeta->where('key', 'stock')->first();
                        $varMeta = $pMeta->where('key', 'variations')->first()?->value;
                        
                        $inStockFlag = true; // Assume in stock by default (e.g. no stock tracking)
                        
                        // If there is a direct stock value, check if it is 0 or less
                        if ($stockMeta !== null && trim($stockMeta->value) !== '') {
                            if ((int)$stockMeta->value <= 0) {
                                $inStockFlag = false;
                            }
                        }
                        
                        // If variations exist, they override the simple stock check
                        if ($varMeta) {
                            $variations = json_decode($varMeta, true);
                            if (is_array($variations) && count($variations) > 0) {
                                $hasVariationStock = false;
                                foreach ($variations as $var) {
                                    if (isset($var['stock']) && (int)$var['stock'] > 0) {
                                        $hasVariationStock = true;
                                        break;
                                    }
                                }
                                $inStockFlag = $hasVariationStock;
                            }
                        }
                        
                        if ($inStockFlag) {
                            $inStock++;
                        }
                    }
                    return $inStock;
                };

                $thisWeekInStock = $checkStock(clone $thisWeek);
                $thisWeekOutStock = $thisWeekTotal - $thisWeekInStock;

                $lastWeekInStock = $checkStock(clone $lastWeek);
                $lastWeekOutStock = $lastWeekTotal - $lastWeekInStock;

                $stats['in_stock'] = $thisWeekInStock;
                $stats['in_stock_change'] = $calcChange($thisWeekInStock, $lastWeekInStock);
                $stats['out_stock'] = $thisWeekOutStock;
                $stats['out_stock_change'] = $calcChange($thisWeekOutStock, $lastWeekOutStock);
            }

            return [
                'stats' => $stats,
            ];
        }

        // ── Taxonomy-based modules (category, brand, tag, state, city, …) ───
        if ($tableName === 'taxonomies' || !$tableName) {
            $base     = DB::table('taxonomies')->where('type', $type);
            $thisWeek = (clone $base)->where('updated_at', '>=', $oneWeekAgo);
            $lastWeek = (clone $base)->where('updated_at', '>=', $twoWeeksAgo)->where('updated_at', '<', $oneWeekAgo);

            $total      = (clone $base)->count();
            $active     = (clone $base)->where('status', 'active')->count();
            $other      = $total - $active;
            
            $thisWeekTotal  = (clone $thisWeek)->count();
            $thisWeekActive = (clone $thisWeek)->where('status', 'active')->count();
            $thisWeekOther  = $thisWeekTotal - $thisWeekActive;

            $lastWeekTotal  = (clone $lastWeek)->count();
            $lastWeekActive = (clone $lastWeek)->where('status', 'active')->count();
            $lastWeekOther  = $lastWeekTotal - $lastWeekActive;

            return [
                'stats' => [
                    'total'         => $total,
                    'total_change'  => $calcChange($thisWeekTotal, $lastWeekTotal),
                    'active'        => $active,
                    'active_change' => $calcChange($thisWeekActive, $lastWeekActive),
                    'other'         => $other,
                    'other_change'  => $calcChange($thisWeekOther, $lastWeekOther),
                ],
            ];
        }

        // ── Generic fallback for any other table ─────────────────────────────
        $hasUpdatedAt = Schema::hasColumn($tableName, 'updated_at');
        
        $total = DB::table($tableName)->count();
        
        $thisWeekTotal = $hasUpdatedAt ? DB::table($tableName)->where('updated_at', '>=', $oneWeekAgo)->count() : 0;
        $lastWeekTotal = $hasUpdatedAt ? DB::table($tableName)->where('updated_at', '>=', $twoWeeksAgo)->where('updated_at', '<', $oneWeekAgo)->count() : 0;
        
        $hasStatus = Schema::hasColumn($tableName, 'status');
        $active = $hasStatus ? DB::table($tableName)->where('status', 'active')->count() : null;
        $other  = $active !== null ? $total - $active : null;

        $thisWeekActive = ($hasStatus && $hasUpdatedAt) ? DB::table($tableName)->where('status', 'active')->where('updated_at', '>=', $oneWeekAgo)->count() : 0;
        $lastWeekActive = ($hasStatus && $hasUpdatedAt) ? DB::table($tableName)->where('status', 'active')->where('updated_at', '>=', $twoWeeksAgo)->where('updated_at', '<', $oneWeekAgo)->count() : 0;
        
        $thisWeekOther = $hasUpdatedAt ? $thisWeekTotal - $thisWeekActive : 0;
        $lastWeekOther = $hasUpdatedAt ? $lastWeekTotal - $lastWeekActive : 0;

        return [
            'stats' => [
                'total'         => $total,
                'total_change'  => $hasUpdatedAt ? $calcChange($thisWeekTotal, $lastWeekTotal) : 0,
                'active'        => $active,
                'active_change' => $active !== null && $hasUpdatedAt ? $calcChange($thisWeekActive, $lastWeekActive) : null,
                'other'         => $other,
                'other_change'  => $other !== null && $hasUpdatedAt ? $calcChange($thisWeekOther, $lastWeekOther) : null,
            ],
        ];
    }

    private function transformForEdit($record, $type, $db)
    {
        $stuv = (array) $record;

        // Populate meta into main object for easy form binding
        if (isset($record->meta)) {
            foreach ($record->meta as $m) {
                $val = $m->value;
                if (is_string($val) && Str::isJson($val))
                    $val = json_decode($val, true);
                $stuv[$m->key] = $val;
            }
        }

        // Global JSON parsing for unified longText columns
        foreach ($stuv as $key => $val) {
            if (is_string($val) && (str_starts_with($val, '[') || str_starts_with($val, '{'))) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $stuv[$key] = $decoded;
                }
            }
        }

        // Image & Gallery handling
        $tableName = $db['table'] ?? \Illuminate\Support\Str::plural($type);
        $mediaType = ($tableName === 'posts') ? 'post' : (($tableName === 'taxonomies') ? 'taxonomy' : $type);

        $image = DB::table('media')->where(['parent_id' => $record->id, 'type' => $mediaType])->first();
        $stuv['image'] = $image ? $image->filename : null;

        $gallery = DB::table('media')->where(['parent_id' => $record->id, 'type' => $mediaType . '_gallery'])->pluck('filename')->toArray();
        if (!empty($gallery))
            $stuv['gallery'] = $gallery;

        // Specialized transformations based on features from JSON
        $features = $db['features'] ?? [];
        $metaTable = $db['meta_table'] ?? (Str::singular($tableName) . '_meta');
        $metaKey = $db['meta_key'] ?? (Str::singular($tableName) . '_id');

        // 1. Dynamic Meta Processing (Category, Brand, etc)
        $metaKeysToProcess = $db['meta_processing'] ?? [];
        foreach ($metaKeysToProcess as $key => $trait) {
            $meta = DB::table($metaTable)->where($metaKey, $record->id)->where('key', $key)->first();
            if ($trait === 'json_array') {
                $stuv[$key] = $meta ? json_decode($meta->value, true) : [];
            } else {
                $stuv[$key] = $meta ? $meta->value : '';
            }
        }

        // 2. Attributes System
        if ($features['attributes'] ?? false) {
            $attrValues = DB::table('attribute_values')->where(['parent_id' => $record->id, 'parent_type' => Str::singular($tableName)])->get();
            $stuv['attributes'] = $attrValues->map(function ($val) {
                $est = DB::table('attributes')->where('id', $val->attribute_id)->where('group', '!=', null)->first();
                if (!$est) return null;
                return [
                    'group' => $val->group ?? ($est->group ?? null),
                    'key' => $est->name,
                    'value' => $val->value
                ];
            })->filter()->values()->all();
        }
        // 3. Variations System
        if ($features['variations'] ?? false) {
            $variationsTable = $db['variations_table'] ?? (Str::singular($tableName) . '_variations');
            
            // Query parent variations (color groups)
            $parentVariations = DB::table($variationsTable)
                ->where($metaKey, $record->id)
                ->whereNull('parent_id')
                ->get();
            
            $formattedVariations = [];
            
            foreach ($parentVariations as $parent) {
                $vImage = DB::table('media')->where([
                    'type'      => Str::singular($tableName) . '_variation',
                    'parent_id' => $parent->id,
                ])->first();
                
                // Get shared attributes for the parent
                $parentValues = DB::table('product_variation_values')->where('variation_id', $parent->id)->get();
                $sharedAttributes = $parentValues->map(function ($v) {
                    $option = DB::table('attribute_values')->where('id', $v->attribute_option_id)->first();
                    if ($option) {
                        $attr = DB::table('attributes')->where('id', $option->attribute_id)->first();
                        return $attr ? ['key' => $attr->name, 'value' => $option->value, 'id' => $option->id] : null;
                    }
                    return null;
                })->filter()->values()->all();
                
                // Query child variations (combinations)
                $childVariations = DB::table($variationsTable)
                    ->where('parent_id', $parent->id)
                    ->get();
                
                $combinations = [];
                $totalStock = 0;
                $minPrice = $parent->price;
                
                foreach ($childVariations as $child) {
                    $childValues = DB::table('product_variation_values')->where('variation_id', $child->id)->get();
                    $comboAttributes = $childValues->map(function ($v) {
                        $option = DB::table('attribute_values')->where('id', $v->attribute_option_id)->first();
                        if ($option) {
                            $attr = DB::table('attributes')->where('id', $option->attribute_id)->first();
                            return $attr ? ['key' => $attr->name, 'value' => $option->value, 'id' => $option->id] : null;
                        }
                        return null;
                    })->filter()->values()->all();
                    
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
                ];
            }
            
            $stuv['variations'] = $formattedVariations;
        }
        return $stuv;
    }
}