<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DeveloperController extends Controller
{
    public $manifest;

    public function __construct()
    {
        parent::__construct();
        $manifest_file = $this->json_import_location . '/manifest.json';
        $this->manifest = File::exists($manifest_file) ? json_decode(file_get_contents($manifest_file)) : null;
    }

    /**
     * Get the default admin user ID (or fallback to 1).
     */
    public function getAdminUserId(): int
    {
        $admin = DB::table('users')->where('email', 'info@nestify.com')->first();
        if ($admin) return (int) $admin->id;

        $first = DB::table('users')->first();
        return $first ? (int) $first->id : 1;
    }

    /**
     * Resolve a {resolve:table.return_col=search_val@where_col} macro.
     */
    private function resolveValueMacro(string $val): mixed
    {
        if (!preg_match('/^\{resolve:(\w+)\.(\w+)=(.+)@(\w+)\}$/', $val, $m)) {
            return $val;
        }
        [$_, $table, $returnCol, $searchVal, $whereCol] = $m;
        $row = DB::table($table)->where($whereCol, $searchVal)->first();
        return $row ? $row->$returnCol : null;
    }

    /**
     * Resolve a {resolve_json:table.return_col=search_val@where_col} macro.
     */
    private function resolveJsonMacro(string $val): string
    {
        if (!preg_match('/^\{resolve_json:(\w+)\.(\w+)=(.+)@(\w+)\}$/', $val, $m)) {
            return $val;
        }
        [$_, $table, $returnCol, $searchVal, $whereCol] = $m;
        $row = DB::table($table)->where($whereCol, $searchVal)->first();
        $id = $row ? $row->$returnCol : null;
        return json_encode($id !== null ? [(string) $id] : []);
    }

    /**
     * Resolve {related_taxonomy:<file_id>}
     */
    private function resolveRelatedTaxonomy(string $val): mixed
    {
        if (!preg_match('/^\{related_taxonomy:(.+)\}$/', $val, $m)) {
            return $val;
        }
        $searchId = trim($m[1]);
        $taxId = DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', $searchId)->value('taxonomy_id');
        if ($taxId) return (string) $taxId;

        // Fallback: check by slug or direct id
        $row = DB::table('taxonomies')->where('slug', $searchId)->orWhere('id', $searchId)->first();
        return $row ? (string) $row->id : $searchId;
    }

    /**
     * Resolve {related_taxonomy_json:<file_id1>,<file_id2>,...}
     */
    private function resolveRelatedTaxonomyJson(string $val): string
    {
        if (!preg_match('/^\{related_taxonomy_json:(.+)\}$/', $val, $m)) {
            return $val;
        }
        $ids = array_map('trim', explode(',', $m[1]));
        $resolved = [];
        foreach ($ids as $searchId) {
            $taxId = DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', $searchId)->value('taxonomy_id');
            if (!$taxId) {
                $row = DB::table('taxonomies')->where('slug', $searchId)->orWhere('id', $searchId)->first();
                $taxId = $row ? $row->id : null;
            }
            if ($taxId) {
                $resolved[] = (string) $taxId;
            }
        }
        return json_encode($resolved);
    }

    /**
     * Resolve {related_post:<file_id>}
     */
    private function resolveRelatedPost(string $val): mixed
    {
        if (!preg_match('/^\{related_post:(.+)\}$/', $val, $m)) {
            return $val;
        }
        $searchId = trim($m[1]);
        $postId = DB::table('post_meta')->where('key', 'related_id')->where('value', $searchId)->value('post_id');
        if ($postId) return (int) $postId;

        $row = DB::table('posts')->where('id', $searchId)->first();
        return $row ? (int) $row->id : null;
    }

    /**
     * Process scalar values: {now}, {admin_id}, {related_taxonomy:...}, {related_taxonomy_json:...}, {resolve:...}, bcrypt.
     */
    private function processScalar(string $key, mixed $val): mixed
    {
        if ($val === '{now}') {
            return now()->toDateTimeString();
        }
        if ($val === '{admin_id}' || $val === '{auth_id}') {
            return $this->getAdminUserId();
        }
        if (is_string($val)) {
            if (str_starts_with($val, '{related_taxonomy_json:')) {
                return $this->resolveRelatedTaxonomyJson($val);
            }
            if (str_starts_with($val, '{related_taxonomy:')) {
                return $this->resolveRelatedTaxonomy($val);
            }
            if (str_starts_with($val, '{related_post:')) {
                return $this->resolveRelatedPost($val);
            }
            if (str_starts_with($val, '{resolve_json:')) {
                return $this->resolveJsonMacro($val);
            }
            if (str_starts_with($val, '{resolve:')) {
                return $this->resolveValueMacro($val);
            }
        }
        if ($key === 'password') {
            return bcrypt($val);
        }
        return $val;
    }

    public function reset()
    {
        Artisan::call('migrate:fresh');

        // 1. Ensure images from storage/app/import/media/ are copied to uploads/image/
        $importMediaDir = storage_path('app/import/media');
        $destDir = storage_path('app/public/uploads/image');
        if (File::isDirectory($importMediaDir)) {
            if (!File::isDirectory($destDir)) {
                File::makeDirectory($destDir, 0755, true, true);
            }
            $images = File::files($importMediaDir);
            foreach ($images as $img) {
                File::copy($img->getRealPath(), $destDir . '/' . $img->getFilename());
            }
        }

        // 2. Iterate manifest in order
        foreach ($this->manifest as $key => $value) {
            $file = $this->json_import_location . "/{$value}";
            if (!File::exists($file)) continue;

            $file_content = file_get_contents($file);
            $decode_data = json_decode($file_content);

            $table = $decode_data->table;
            $data  = $decode_data->data;

            foreach ($data as $rowItem) {
                $relatedInserts = [];
                $itemRelatedId = null;

                if (isset($rowItem->related_id)) {
                    $itemRelatedId = $rowItem->related_id;
                    unset($rowItem->related_id);
                }

                foreach ($rowItem as $k => $val) {
                    if ($k === 'relation') {
                        $relations = is_array($val) ? $val : (array) $val;
                        foreach ($relations as $vv) {
                            $insert_in = $vv->insert_in ?? null;

                            if ($insert_in === 'main_table') {
                                $column             = $vv->where->column;
                                $whereValue         = $vv->where->value;
                                $operator           = $vv->where->operater;
                                $value_column       = $vv->value_column;
                                $relation_col_value = $vv->relation_column_value;
                                $resolved = DB::table($vv->table)
                                    ->where($column, $operator, $whereValue)
                                    ->pluck($relation_col_value);
                                $rowItem->$value_column = json_encode($resolved->values()->all());

                            } elseif ($insert_in === 'related_table') {
                                if (isset($vv->rows) && is_array($vv->rows)) {
                                    foreach ($vv->rows as $singleRow) {
                                        $clone = clone $vv;
                                        $clone->data = $singleRow;
                                        $relatedInserts[] = $clone;
                                    }
                                } else {
                                    $relatedInserts[] = $vv;
                                }
                            }
                        }
                        unset($rowItem->relation);
                        continue;
                    }

                    if (is_array($val) || is_object($val)) {
                        $val = json_encode($val);
                    } else {
                        $val = $this->processScalar($k, $val);
                    }

                    $rowItem->$k = $val;
                }

                // If user_id is on posts/product, ensure it resolves to a valid user
                if ($table === 'posts' && (!isset($rowItem->user_id) || empty($rowItem->user_id) || $rowItem->user_id == '{admin_id}')) {
                    $rowItem->user_id = $this->getAdminUserId();
                }

                // Insert main row and get fresh ID
                $newId = DB::table($table)->insertGetId((array) $rowItem);

                // Auto-save related_id in meta table if specified
                if ($itemRelatedId !== null) {
                    if ($table === 'taxonomies') {
                        DB::table('taxonomy_meta')->insert([
                            'taxonomy_id' => $newId,
                            'key' => 'related_id',
                            'value' => (string) $itemRelatedId,
                        ]);
                    } elseif ($table === 'posts') {
                        DB::table('post_meta')->insert([
                            'post_id' => $newId,
                            'key' => 'related_id',
                            'value' => (string) $itemRelatedId,
                        ]);
                    }
                }

                // Insert related-table rows using new ID
                foreach ($relatedInserts as $rel) {
                    $relData = [];
                    foreach ((array) ($rel->data ?? []) as $col => $colVal) {
                        if ($colVal === '{insert_id}') {
                            $colVal = $newId;
                        } else {
                            $colVal = $this->processScalar($col, $colVal);
                        }
                        $relData[$col] = $colVal;
                    }
                    if (!empty($relData)) {
                        DB::table($rel->table)->insert($relData);
                    }
                }
            }
        }

        return response()->json(['success' => true, 'message' => 'Database reset and seeded successfully.']);
    }
}
