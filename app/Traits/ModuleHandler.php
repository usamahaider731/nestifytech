<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

trait ModuleHandler
{
    /**
     * Load Module configuration from storage/app/schema.
     * Supports single-file config ({type}.json) or multi-file ({type}_DB.json, etc.)
     */
    public function loadModuleConfig(string $type, string $section = 'DB'): ?array
    {
        // 1. Try single file approach (e.g., product.json)
        $singlePath = storage_path("app/schema/{$type}.json");
        if (File::exists($singlePath)) {
            $config = json_decode(File::get($singlePath), true);
            $key = strtolower($section);
            return $config[$key] ?? $config; // Return section or entire config if not split
        }

        // 2. Fallback to multi-file approach (e.g., product_DB.json)
        $path = storage_path("app/schema/{$type}_{$section}.json");
        if (File::exists($path)) {
            return json_decode(File::get($path), true);
        }
        return null;
    }

    /**
     * Create/Update database table based on JSON schema.
     */
    public function migrateModule(string $type)
    {
        $db = $this->loadModuleConfig($type, 'DB');
        if (!$db || empty($db['schema'])) {
            return ['success' => false, 'message' => "No schema defined for module: {$type}"];
        }

        $tableName = $db['table'] ?? Str::plural($type);

        try {
            if (!Schema::hasTable($tableName)) {
                Schema::create($tableName, function ($table) use ($db) {
                    $table->id();
                    foreach ($db['schema'] as $column) {
                        $name = $column['name'];
                        $type = $column['type'] ?? 'string';
                        
                        $col = $table->$type($name);
                        
                        if ($column['nullable'] ?? false) $col->nullable();
                        if ($column['unique'] ?? false) $col->unique();
                        if (isset($column['default'])) $col->default($column['default']);
                        if ($column['index'] ?? false) $col->index();
                    }
                    $table->timestamps();
                });
                return ['success' => true, 'message' => "Table '{$tableName}' created successfully"];
            } else {
                // Logic for adding missing columns
                Schema::table($tableName, function ($table) use ($db, $tableName) {
                    foreach ($db['schema'] as $column) {
                        $name = $column['name'];
                        if (!Schema::hasColumn($tableName, $name)) {
                            $type = $column['type'] ?? 'string';
                            $col = $table->$type($name);
                            if ($column['nullable'] ?? false) $col->nullable();
                            if ($column['unique'] ?? false) $col->unique();
                            if (isset($column['default'])) $col->default($column['default']);
                        }
                    }
                });
                return ['success' => true, 'message' => "Table '{$tableName}' updated with new columns"];
            }
        } catch (\Exception $e) {
            return ['success' => false, 'message' => "Migration failed: " . $e->getMessage()];
        }
    }

    /**
     * Generic table data handler for Index pages.
     */
    public function handleTableRequest(Request $request, string $type, $query = null)
    {
        $db = $this->loadModuleConfig($type, 'DB');
        $tableConfigs = $this->loadModuleConfig($type, 'Table');

        if (!$db) {
            $schema = $this->loadModuleConfig($type, 'Schema');
            if ($schema) {
                $db = $schema;
                $tableConfigs = $schema;
            } else {
                return [
                    'success' => false,
                    'message' => "Module configuration 'DB' or 'Schema' not found for: {$type}"
                ];
            }
        }

        $tableName = $db['table'] ?? Str::plural($type);

        if (!$query) {
            // Use ModuleHelper for complex queries (joins/selects)
            $query = \App\Helpers\ModuleHelper::buildQuery($tableName, $db);
        }

        // Search logic
        if ($request->search && isset($db['main_fields'])) {
            $search = $request->search;
            $query->where(function ($q) use ($search, $db, $tableName) {
                foreach ($db['main_fields'] as $field) {
                    $column = str_contains($field, '.') ? $field : ($tableName . '.' . $field);
                    $q->orWhere($column, 'like', "%$search%");
                }
            });
        }

        // Pagination
        $defaultPerPage = $tableConfigs['paginationPerPage'] ?? ($tableConfigs['pagination']['perPage'] ?? 10);
        $perPage = $request->input('per_page', $defaultPerPage);

        // Sorting
        if ($request->sort_by) {
            $query->orderBy($request->sort_by, $request->sort_order ?? 'asc');
        } else {
            $query->orderBy($tableName . '.id', 'desc');
        }

        // Fetch data
        $data = $query->paginate($perPage)->withQueryString();

        // Manual relation loading for Tables (Meta, Image)
        $data->getCollection()->transform(function ($item) use ($tableName, $type, $db) {
            if (is_array($item))
                $item = (object) $item;

            // Add meta if table exists
            $metaTable = $db['meta_table'] ?? (\Illuminate\Support\Str::singular($tableName) . '_meta');
            if (Schema::hasTable($metaTable)) {
                $foreignKey = $db['meta_key'] ?? (\Illuminate\Support\Str::singular($tableName) . '_id');
                $item->meta = DB::table($metaTable)->where($foreignKey, $item->id)->get();
            }

            // Image handling (via media table)
            $mediaType = ($tableName === 'posts') ? 'post' : (($tableName === 'taxonomies') ? 'taxonomy' : $type);
            $image = DB::table('media')
                ->where('parent_id', $item->id)
                ->where('type', $mediaType)
                ->first();
            $item->image = $image ? $image->filename : null;

            return $item;
        });

        // Apply column-level transformations from schema (Now that meta is attached)
        $columnsForTransform = $tableConfigs['columns'] ?? ($db['columns'] ?? null);
        if (is_array($columnsForTransform) && !empty($columnsForTransform)) {
            $data = \App\Helpers\ModuleHelper::transformList($data, ['columns' => $columnsForTransform]);
        }

        // Hook for transforming data after fetch
        if (method_exists($this, 'afterTableFetchHook')) {
            $this->afterTableFetchHook($data, $type);
        }

        return [
            'data' => $data,
            'table' => $tableConfigs,
            'formData' => $this->loadModuleConfig($type, 'Form') ?? $db
        ];
    }

    /**
     * Generic submission handler based on Database configuration.
     */
    public function handleSubmission(Request $request, string $type, $id = null)
    {
        $db = $this->loadModuleConfig($type, 'DB');
        if (!$db) {
            $db = $this->loadModuleConfig($type, 'Schema');
        }

        $tableName = $db['table'] ?? Str::plural($type);
        $isEdit = $request->has('id') || $id;
        $id = $id ?? $request->id;
        $rules = $db['validation'] ?? \App\Helpers\ModuleHelper::getValidationRules($db);
        if ($isEdit) {
            foreach ($rules as $field => &$rule) {
                if (is_string($rule) && str_contains($rule, 'unique:')) {
                    $parts = explode(':', $rule);
                    $params = explode(',', $parts[1]);
                    
                    if (count($params) === 1) {
                        $rule = $parts[0] . ':' . $params[0] . ',' . $field . ',' . $id;
                    } else {
                        $rule .= ',' . $id;
                    }
                }
            }
        }
        $request->validate($rules);

        try {
            DB::beginTransaction();

            $data = [];
            foreach ($db['main_fields'] ?? [] as $field) {
                if ($request->has($field))
                    $data[$field] = $request->input($field);
            }
            if (isset($db['columns'])) {
                foreach ($db['columns'] as $col) {
                    $field = $col['id'];
                    if ($request->has($field))
                        $data[$field] = $request->input($field);
                }
            }
            if (isset($db['fixed_fields'])) {
                foreach ($db['fixed_fields'] as $key => $val) {
                    $data[$key] = ($val === 'auth_id') ? auth()->id() : $val;
                }
            }
            $autoSlugField = $db['auto_slug'] ?? null;
            if ($autoSlugField && isset($data['title'])) {
                if (empty($data[$autoSlugField]) && (!$isEdit || empty($request->input($autoSlugField)))) {
                    $data[$autoSlugField] = Str::slug($data['title']);
                }
            }

            // Apply transformations
            $data = \App\Helpers\ModuleHelper::transformInput($data, $db);

            // Automatically JSON encode arrays for longText/json storage
            foreach ($data as $key => &$val) {
                if (is_array($val)) {
                    $val = json_encode($val);
                }
            }

            if ($isEdit) {
                DB::table($tableName)->where('id', $id)->update($data);
                $recordId = $id;
            } else {
                $recordId = DB::table($tableName)->insertGetId($data);
            }
            $record = (object) array_merge(['id' => $recordId], $data);

            if (method_exists($this, 'beforeSaveHook')) {
                $this->beforeSaveHook($request, $record, $type, $isEdit);
            }

            $mediaType = ($tableName === 'posts') ? 'post' : (($tableName === 'taxonomies') ? 'taxonomy' : $type);

            // Image handling (via DB directly)
            if ($request->hasFile('image')) {
                $this->handleDBImageUpload($request->file('image'), $recordId, $mediaType);
            }
            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $file) {
                    $this->handleDBGalleryUpload($file, $recordId, $mediaType . '_gallery');
                }
            }

            if (method_exists($this, 'afterSaveHook')) {
                $this->afterSaveHook($request, $record, $type, $isEdit);
            }

            // Handle Meta
            $metaTable = $db['meta_table'] ?? (\Illuminate\Support\Str::singular($tableName) . '_meta');
            if (Schema::hasTable($metaTable)) {
                $foreignKey = $db['meta_key'] ?? (\Illuminate\Support\Str::singular($tableName) . '_id');
                $ignore = array_merge(
                    $db['main_fields'] ?? [], 
                    ['id', '_token', 'image', 'gallery', 'attributes', 'variations', 'meta', 'created_at', 'updated_at']
                );
                $metaData = $request->except($ignore);

                foreach ($metaData as $key => $value) {
                    if ($value instanceof \Illuminate\Http\UploadedFile)
                        continue;
                    DB::table($metaTable)->updateOrInsert(
                        [$foreignKey => $recordId, 'key' => $key],
                        ['value' => is_array($value) ? json_encode($value) : $value]
                    );
                }
            }

            // 1. Handle Attributes (Key-Value Specs)
            if ($request->has('attributes')) {
                $rawAttributes = $request->input('attributes');
                $attributes = is_string($rawAttributes) ? json_decode($rawAttributes, true) : $rawAttributes;
                if (is_array($attributes)) {
                    DB::table('attribute_values')->where(['parent_id' => $recordId, 'parent_type' => Str::singular($tableName)])->delete();

                    // Supports:
                    // - flat: [{key,value,group?}]
                    // - nested: [{group, attributes:[{key,value}]}]
                    $flat = [];
                    // When sent via FormData, nested "attributes" is often JSON-stringified per-group.
                    $firstNested = (!empty($attributes) && isset($attributes[0]) && array_key_exists('attributes', $attributes[0]));
                    if ($firstNested) {
                        foreach ($attributes as $g) {
                            $gName = $g['group'] ?? null;

                            $inner = $g['attributes'] ?? [];
                            if (is_string($inner)) {
                                $decoded = json_decode($inner, true);
                                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                                    $inner = $decoded;
                                }
                            }

                            if (!is_array($inner)) $inner = [];

                            foreach ($inner as $a) {
                                $flat[] = [
                                    'group' => $gName,
                                    'key' => $a['key'] ?? null,
                                    'value' => $a['value'] ?? null,
                                ];
                            }
                        }
                    } else {
                        $flat = $attributes;
                    }

                    foreach ($flat as $attr) {
                        if (empty($attr['key'])) continue;

                        $group = $attr['group'] ?? null;

                        // Find or create the attribute definition
                        $attrDef = DB::table('attributes')->where('name', $attr['key'])->first();
                        if (!$attrDef) {
                            $insert = ['name' => $attr['key'], 'type' => 'text'];
                            if ($group) $insert['group'] = $group;
                            $attrDefId = DB::table('attributes')->insertGetId($insert);
                            $attrDef = (object)['id' => $attrDefId];
                        } else {
                            // If group not provided, try to inherit from definition
                            if (!$group && !empty($attrDef->group)) {
                                $group = $attrDef->group;
                            }
                            if ($group && empty($attrDef->group)) {
                            // Backfill group on definition when missing
                            DB::table('attributes')->where('id', $attrDef->id)->update(['group' => $group]);
                            }
                        }

                        DB::table('attribute_values')->insert([
                            'attribute_id' => $attrDef->id,
                            'parent_id' => $recordId,
                            'parent_type' => Str::singular($tableName),
                            'value' => $attr['value'] ?? '',
                            'group' => $group,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            // 2. Handle Variations
            if ($request->has('variations')) {
                $rawVariations = $request->input('variations');
                $variations = is_string($rawVariations) ? json_decode($rawVariations, true) : $rawVariations;
                if (is_array($variations)) {
                    $variationsTable = $db['variations_table'] ?? (Str::singular($tableName) . '_variations');
                    if (Schema::hasTable($variationsTable)) {
                        $foreignKey = $db['meta_key'] ?? (Str::singular($tableName) . '_id');
                        
                        // Clear existing variations for this record (Simplified sync)
                        $oldVariations = DB::table($variationsTable)->where($foreignKey, $recordId)->pluck('id');
                        DB::table('product_variation_values')->whereIn('variation_id', $oldVariations)->delete();
                        DB::table($variationsTable)->where($foreignKey, $recordId)->delete();

                        foreach ($variations as $variation) {
                            $vId = DB::table($variationsTable)->insertGetId([
                                $foreignKey => $recordId,
                                'price' => $variation['price'] ?? 0,
                                'stock' => $variation['stock'] ?? 0,
                            ]);

                            // Save Variation Image if provided (filename from the VariationsSelector)
                            if (!empty($variation['image'])) {
                                DB::table('media')->updateOrInsert(
                                    ['parent_id' => $vId, 'type' => Str::singular($tableName) . '_variation'],
                                    ['filename' => $variation['image'], 'updated_at' => now()]
                                );
                            }

                            // Save Variation Attributes (Size, Color loop)
                            $vAttrs = $variation['size'] ?? [];
                            if (is_string($vAttrs)) $vAttrs = json_decode($vAttrs, true) ?: [];

                            foreach ($vAttrs as $vAttr) {
                                if (empty($vAttr['key'])) continue;

                                $attrDef = DB::table('attributes')->where('name', $vAttr['key'])->first();
                                if (!$attrDef) {
                                    $attrDefId = DB::table('attributes')->insertGetId(['name' => $vAttr['key'], 'type' => 'text']);
                                    $attrDef = (object)['id' => $attrDefId];
                                }

                                $optionId = DB::table('attribute_values')->insertGetId([
                                    'attribute_id' => $attrDef->id,
                                    'parent_id' => $recordId, // Link to product for context
                                    'parent_type' => 'variation_option',
                                    'value' => $vAttr['value'] ?? ''
                                ]);

                                DB::table('product_variation_values')->insert([
                                    'variation_id' => $vId,
                                    'attribute_option_id' => $optionId
                                ]);
                            }
                        }
                    }
                }
            }

            DB::commit();
            return ['success' => true, 'message' => $isEdit ? ucfirst($type) . ' updated successfully' : ucfirst($type) . ' created successfully', 'data' => $record];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()];
        }
    }

    protected function handleDBImageUpload($file, $parentId, $type)
    {
        $filename = time() . '_' . $file->getClientOriginalName();
        $file->move(public_path('uploads/image'), $filename);

        DB::table('media')->updateOrInsert(
            ['parent_id' => $parentId, 'type' => $type],
            ['filename' => $filename, 'updated_at' => now()]
        );
    }

    protected function handleDBGalleryUpload($file, $parentId, $type)
    {
        $filename = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
        $file->move(public_path('uploads/image'), $filename);

        DB::table('media')->insert([
            'parent_id' => $parentId,
            'type' => $type,
            'filename' => $filename,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
}
