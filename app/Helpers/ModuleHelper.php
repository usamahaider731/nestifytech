<?php

namespace App\Helpers;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ModuleHelper
{
    /**
     * Get validation rules from schema columns.
     */
    public static function getValidationRules($config)
    {
        $rules = [];
        $columns = $config['columns'] ?? [];
        foreach ($columns as $col) {
            if (!empty($col['form']['validation'])) {
                $name = $col['form']['name'] ?? $col['id'];
                $rules[$name] = $col['form']['validation'];
            }
        }
        return $rules;
    }

    /**
     * Transform data for database insertion.
     */
    public static function transformInput($data, $config)
    {
        $columns = $config['columns'] ?? [];
        foreach ($columns as $col) {
            $field = $col['id'];
            if (!isset($data[$field])) continue;

            $transform = $col['form']['transform'] ?? null;
            if ($transform === 'hash') {
                $data[$field] = Hash::make($data[$field]);
            } elseif ($transform === 'json') {
                $data[$field] = json_encode($data[$field]);
            } elseif ($transform === 'lowercase') {
                $data[$field] = strtolower($data[$field]);
            }
        }
        return $data;
    }

    /**
     * Transform a collection of items for listing.
     */
    public static function transformList($items, $config)
    {
        $columns = $config['columns'] ?? [];
        
        $items->getCollection()->transform(function ($item) use ($columns) {
            foreach ($columns as $col) {
                $id = $col['id'];
                
                // 0. If a table column is sourced from meta, map meta -> row property
                // This is needed for modules where data is stored in *_meta tables (e.g., taxonomies discount fields).
                if (($col['meta'] ?? false) && !isset($col['value_table'])) {
                    $metaKey = $col['meta_key'] ?? $col['field'] ?? $id;
                    $targetProp = $col['column'] ?? $id;
                    $meta = collect($item->meta ?? [])->where('key', $metaKey)->first();
                    $raw = $meta ? $meta->value : null;

                    if ($raw !== null) {
                        $val = $raw;
                        if (($col['meta_value_type'] ?? '') === 'json' && is_string($raw)) {
                            $decoded = json_decode($raw, true);
                            if (json_last_error() === JSON_ERROR_NONE) {
                                $val = $decoded;
                            }
                        }
                        $item->{$targetProp} = $val;
                        if (!isset($item->{$id})) {
                            $item->{$id} = $val;
                        }
                    }
                }

                // 1. Dynamic Database Lookup logic (value_table + value_condition)
                if (isset($col['value_table']) && isset($col['value_condition'])) {
                    $lookupTable = $col['value_table'];
                    $condition = $col['value_condition'];
                    $passKey = $condition['pass_value_of_key'] ?? 'id';
                    $returnKey = $condition['return_key'] ?? 'title';
                    $targetProp = $col['column'] ?? $id;
                    
                    // Get the base value to look up
                    $baseValue = null;
                    if ($col['meta'] ?? false) {
                        $metaKey = $col['meta_key'] ?? $col['field'] ?? $id;
                        $meta = collect($item->meta ?? [])->where('key', $metaKey)->first();
                        $baseValue = $meta ? $meta->value : null;
                    } else {
                        $columnName = $col['source_column'] ?? $col['field'] ?? ($col['column'] ?? $id);
                        $baseValue = $item->{$columnName} ?? null;
                    }

                    if ($baseValue === null || $baseValue === '' || $baseValue === []) {
                        continue;
                    }

                    // Normalize to ID array (supports json strings, scalar, or arrays)
                    $values = [];
                    if (is_array($baseValue)) {
                        $values = $baseValue;
                    } elseif (is_string($baseValue)) {
                        $shouldJsonDecode = (str_starts_with($baseValue, '[') || str_starts_with($baseValue, '{'));
                        if ($shouldJsonDecode) {
                            $decoded = json_decode($baseValue, true);
                            $values = (json_last_error() === JSON_ERROR_NONE) ? (is_array($decoded) ? $decoded : [$decoded]) : [$baseValue];
                        } else {
                            $values = [$baseValue];
                        }
                    } else {
                        $values = [$baseValue];
                    }

                    // Flatten any accidental object arrays like [{id:1}, {id:2}]
                    $values = array_values(array_filter(array_map(function ($v) use ($passKey) {
                        if (is_array($v) && array_key_exists($passKey, $v)) return $v[$passKey];
                        if (is_object($v) && isset($v->{$passKey})) return $v->{$passKey};
                        return $v;
                    }, $values), fn($v) => $v !== null && $v !== ''));

                    if (empty($values)) {
                        continue;
                    }

                    // Perform lookup
                    $rows = DB::table($lookupTable)
                        ->whereIn($passKey, $values)
                        ->get([$passKey, $returnKey]);

                    $titles = $rows->pluck($returnKey)->filter()->values()->all();

                    // Schema-driven brand image object mapping
                    if (($col['type'] ?? null) === 'brand_image') {
                        $first = $rows->first();
                        if ($first) {
                            $mediaType = $col['media_type'] ?? 'taxonomy';
                            $image = DB::table('media')
                                ->where('parent_id', $first->{$passKey})
                                ->where('type', $mediaType)
                                ->first();

                            $item->{$id} = [
                                $passKey => $first->{$passKey} ?? null,
                                $returnKey => $first->{$returnKey} ?? null,
                                'image' => $image ? $image->filename : null,
                            ];
                        }
                        continue;
                    }

                    // If the column is an array, expose an array of objects (for badge UIs)
                    if (($col['is_array'] ?? false) || (($col['meta_value_type'] ?? '') === 'json')) {
                        $item->{$targetProp} = $rows->map(function ($r) use ($passKey, $returnKey) {
                            return [
                                $passKey => $r->{$passKey} ?? null,
                                $returnKey => $r->{$returnKey} ?? null,
                            ];
                        })->values()->all();

                        // Also set a string fallback on the column id (useful for generic tables)
                        $item->{$id} = implode(', ', $titles);
                    } else {
                        $item->{$targetProp} = $titles[0] ?? null;
                        $item->{$id} = $item->{$targetProp};
                    }
                }

                // 2. Legacy Transformation logic
                $transform = $col['list']['transform'] ?? null;
                if ($transform && isset($item->{$id})) {
                    $item->{$id} = self::applyTransform($item->{$id}, $transform);
                }
            }
            return $item;
        });

        return $items;
    }

    /**
     * Transform a single item for detailed view/edit.
     */
    public static function transformOutput($item, $config)
    {
        $itemArray = (array)$item;
        $columns = $config['columns'] ?? [];
        
        foreach ($columns as $col) {
            $field = $col['id'];
            if (!isset($itemArray[$field])) continue;

            $transform = $col['form']['transform'] ?? null;
            if ($transform === 'json') {
                $itemArray[$field] = is_string($itemArray[$field]) ? json_decode($itemArray[$field], true) : $itemArray[$field];
            } elseif ($transform === 'hash') {
                $itemArray[$field] = ''; // Don't send hashed passwords
            }
        }
        return (object)$itemArray;
    }

    /**
     * Apply specific transformation logic.
     */
    private static function applyTransform($value, $type)
    {
        return match ($type) {
            'date'       => Carbon::parse($value)->format('F j, Y'),
            'human_date' => Carbon::parse($value)->diffForHumans(),
            'json'       => is_string($value) ? json_decode($value, true) : $value,
            default      => $value
        };
    }

    /**
     * Build the query with joins and selects based on schema.
     */
    public static function buildQuery($tableName, $config)
    {
        $query = DB::table($tableName);
        
        // Handle Joins
        if (!empty($config['join'])) {
            foreach ($config['join'] as $join) {
                $query->leftJoin($join['table'], "{$tableName}.{$join['key']}", '=', "{$join['table']}.{$join['foreign_key']}");
            }
        }

        // Handle Selects
        $select = [];
        $columns = $config['columns'] ?? [];
        foreach ($columns as $col) {
            if (isset($col['db'])) {
                if (isset($col['list']['name'])) {
                    $select[] = "{$col['list']['name']} as {$col['id']}";
                } else {
                    $select[] = "{$tableName}.{$col['id']}";
                }
            }
        }

        if (!empty($select)) {
            $query->select($select);
        }

        return $query;
    }
}
