<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\File;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\GenericImport;
use App\Exports\GenericExport;
use App\Traits\ModuleHandler;
use Illuminate\Support\Str;

class ImportExportController extends Controller
{
    use ModuleHandler;

    public function index()
    {
        $tables = array_map(function ($table) {
            $tableName = reset($table);
            return $tableName;
        }, DB::select('SHOW TABLES'));

        $existingPackages = [];
        $importDir = storage_path('app/import');
        if (File::isDirectory($importDir)) {
            $files = File::files($importDir);
            foreach ($files as $f) {
                if (strtolower($f->getExtension()) === 'zip') {
                    $existingPackages[] = [
                        'name' => $f->getFilename(),
                        'size' => round($f->getSize() / 1024, 1) . ' KB',
                        'date' => date('Y-m-d H:i', $f->getMTime()),
                    ];
                }
            }
        }

        return Inertia::render('Admin/ImportExport/Index', [
            'tables' => $tables,
            'existingPackages' => $existingPackages,
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
            'table' => 'nullable|string',
            'format' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $table = $request->input('table');
        $format = $request->input('format');
        $type = $request->input('type');
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'zip') {
            try {
                $result = $this->processZipPackage($file->getRealPath(), $file->getClientOriginalName());
                $msg = "Imported {$result['tables_count']} tables ({$result['total_rows']} records) and {$result['images_count']} images successfully.";
                return back()->with('success', $msg);
            } catch (\Exception $e) {
                return back()->withErrors(['file' => 'Error importing ZIP package: ' . $e->getMessage()]);
            }
        }

        if (empty($table) || !Schema::hasTable($table)) {
            return back()->withErrors(['table' => 'Valid database table is required for single-file import.']);
        }

        try {
            $rowsCount = $this->importFileToTable($file->getRealPath(), $table, $format ?: $extension);
            return back()->with('success', "Imported {$rowsCount} records into {$table} successfully.");
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Error importing data: ' . $e->getMessage()]);
        }
    }

    public function importPackage(Request $request)
    {
        $request->validate([
            'filename' => 'required|string',
        ]);

        $filename = basename($request->filename);
        $fullPath = storage_path('app/import/' . $filename);

        if (!File::exists($fullPath)) {
            return back()->withErrors(['file' => 'Export package not found: ' . $filename]);
        }

        try {
            $result = $this->processZipPackage($fullPath, $filename);
            $msg = "Package '{$filename}' imported successfully: {$result['tables_count']} tables ({$result['total_rows']} records), {$result['images_count']} images copied.";
            return back()->with('success', $msg);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Error importing package: ' . $e->getMessage()]);
        }
    }

    protected function processZipPackage($zipPath, $originalName = '')
    {
        $zip = new \ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new \Exception('Could not open ZIP package.');
        }

        $extractPath = storage_path('app/temp_import_' . uniqid());
        $zip->extractTo($extractPath);
        $zip->close();

        $imagesCount = 0;
        $totalRows = 0;
        $tablesProcessed = 0;

        // Default admin user ID (or fallback to 1)
        $admin = DB::table('users')->where('email', 'info@nestify.com')->first();
        $adminId = $admin ? (int) $admin->id : ((int) (DB::table('users')->first()?->id ?? 1));

        // In-memory mapping of old file IDs -> new database auto-increment IDs
        $taxIdMap = [];
        $postIdMap = [];
        $attrIdMap = [];
        $attrValIdMap = [];
        $variationIdMap = [];

        try {
            // 1. Process media/images folder
            $imagesDir = $extractPath . '/images';
            if (File::isDirectory($imagesDir)) {
                $images = File::files($imagesDir);
                $destDir = storage_path('app/public/uploads/image');
                if (!File::isDirectory($destDir)) {
                    File::makeDirectory($destDir, 0755, true, true);
                }
                foreach ($images as $img) {
                    File::copy($img->getRealPath(), $destDir . '/' . $img->getFilename());
                    $imagesCount++;
                }
            }

            // 2. Process data files in sequence
            $files = File::files($extractPath);
            usort($files, function($a, $b) {
                return strcmp($a->getFilename(), $b->getFilename());
            });

            foreach ($files as $f) {
                if ($f->isDir()) continue;

                $fileName = $f->getFilenameWithoutExtension();
                $ext = strtolower($f->getExtension());

                if (!in_array($ext, ['csv', 'json', 'xlsx', 'xml'])) {
                    continue;
                }

                // Strip sequence prefix e.g. 01_taxonomies -> taxonomies
                $targetTable = preg_replace('/^\d+_/', '', $fileName);

                // Map split media tables back to 'media' table
                if (in_array($targetTable, ['featured_image', 'gallery', 'variation_images'])) {
                    $targetTable = 'media';
                }

                if (!Schema::hasTable($targetTable)) {
                    continue;
                }

                $rawRows = [];
                if ($ext === 'csv') {
                    $rawRows = $this->parseCsvFile($f->getRealPath());
                } elseif ($ext === 'json') {
                    $content = file_get_contents($f->getRealPath());
                    $decoded = json_decode($content, true);
                    $rawRows = is_array($decoded) ? $decoded : [];
                } elseif ($ext === 'xlsx') {
                    $importedData = Excel::toArray(new GenericImport($targetTable), $f->getRealPath());
                    $rawRows = $importedData[0] ?? [];
                }

                $columns = Schema::getColumnListing($targetTable);
                $tableRowsCount = 0;

                foreach ($rawRows as $r) {
                    $row = (array) $r;
                    $oldId = $row['id'] ?? null;

                    // A. TAXONOMIES (categories, brands, tags)
                    if ($targetTable === 'taxonomies') {
                        $clean = $this->cleanRowForTable('taxonomies', $row, $columns);
                        unset($clean['id']); // Let MySQL assign fresh ID

                        // Resolve parent_id if old ID was supplied
                        if (!empty($clean['parent_id']) && $clean['parent_id'] != 0) {
                            $parentOldId = $clean['parent_id'];
                            $newParent = $taxIdMap[$parentOldId] ?? DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', (string)$parentOldId)->value('taxonomy_id');
                            $clean['parent_id'] = $newParent ?: 0;
                        }

                        $newTaxId = DB::table('taxonomies')->insertGetId($clean);
                        if ($oldId !== null) {
                            $taxIdMap[$oldId] = $newTaxId;
                            DB::table('taxonomy_meta')->insert([
                                'taxonomy_id' => $newTaxId,
                                'key' => 'related_id',
                                'value' => (string) $oldId,
                            ]);
                        }
                        $tableRowsCount++;
                    }

                    // B. TAXONOMY_META
                    elseif ($targetTable === 'taxonomy_meta') {
                        $clean = $this->cleanRowForTable('taxonomy_meta', $row, $columns);
                        unset($clean['id']);

                        if (!empty($clean['taxonomy_id'])) {
                            $oldTax = $clean['taxonomy_id'];
                            $newTax = $taxIdMap[$oldTax] ?? DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', (string)$oldTax)->value('taxonomy_id');
                            if ($newTax) {
                                $clean['taxonomy_id'] = $newTax;
                                DB::table('taxonomy_meta')->insert($clean);
                                $tableRowsCount++;
                            }
                        }
                    }

                    // C. POSTS (products, blogs, pages)
                    elseif ($targetTable === 'posts') {
                        $clean = $this->cleanRowForTable('posts', $row, $columns);
                        unset($clean['id']); // Let MySQL assign fresh ID
                        $clean['user_id'] = $adminId; // Use admin id or 1

                        // Ensure unique SKU if already exists
                        if (isset($clean['sku']) && DB::table('posts')->where('sku', $clean['sku'])->exists()) {
                            $clean['sku'] = $clean['sku'] . '-' . uniqid();
                        }

                        $newPostId = DB::table('posts')->insertGetId($clean);
                        if ($oldId !== null) {
                            $postIdMap[$oldId] = $newPostId;
                            DB::table('post_meta')->insert([
                                'post_id' => $newPostId,
                                'key' => 'related_id',
                                'value' => (string) $oldId,
                            ]);
                        }
                        $tableRowsCount++;
                    }

                    // D. POST_META
                    elseif ($targetTable === 'post_meta') {
                        $clean = $this->cleanRowForTable('post_meta', $row, $columns);
                        unset($clean['id']);

                        if (!empty($clean['post_id'])) {
                            $oldPost = $clean['post_id'];
                            $newPost = $postIdMap[$oldPost] ?? DB::table('post_meta')->where('key', 'related_id')->where('value', (string)$oldPost)->value('post_id');
                            if ($newPost) {
                                $clean['post_id'] = $newPost;

                                // If key is user_id, map to adminId
                                if ($clean['key'] === 'user_id') {
                                    $clean['value'] = (string) $adminId;
                                }

                                // If key is category, resolve old taxonomy IDs via taxonomy_meta related_id
                                elseif ($clean['key'] === 'category') {
                                    $catIds = json_decode($clean['value'], true);
                                    if (is_array($catIds)) {
                                        $newCatIds = [];
                                        foreach ($catIds as $cId) {
                                            $res = $taxIdMap[$cId] ?? DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', (string)$cId)->value('taxonomy_id');
                                            if ($res) $newCatIds[] = (string) $res;
                                        }
                                        $clean['value'] = json_encode($newCatIds);
                                    }
                                }

                                // If key is brand, resolve old brand ID via taxonomy_meta related_id
                                elseif ($clean['key'] === 'brand') {
                                    $bId = $clean['value'];
                                    if (!empty($bId)) {
                                        $res = $taxIdMap[$bId] ?? DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', (string)$bId)->value('taxonomy_id');
                                        if ($res) $clean['value'] = (string) $res;
                                    }
                                }

                                // If key is tags, resolve old tag IDs via taxonomy_meta related_id
                                elseif ($clean['key'] === 'tags') {
                                    $tagIds = json_decode($clean['value'], true);
                                    if (is_array($tagIds)) {
                                        $newTagIds = [];
                                        foreach ($tagIds as $tId) {
                                            $res = $taxIdMap[$tId] ?? DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', (string)$tId)->value('taxonomy_id');
                                            if ($res) $newTagIds[] = (string) $res;
                                        }
                                        $clean['value'] = json_encode($newTagIds);
                                    }
                                }

                                DB::table('post_meta')->insert($clean);
                                $tableRowsCount++;
                            }
                        }
                    }

                    // E. ATTRIBUTES
                    elseif ($targetTable === 'attributes') {
                        $clean = $this->cleanRowForTable('attributes', $row, $columns);
                        $attrName = $clean['name'] ?? null;
                        if ($attrName) {
                            $existing = DB::table('attributes')->where('name', $attrName)->first();
                            if ($existing) {
                                $newAttrId = $existing->id;
                            } else {
                                unset($clean['id']);
                                $newAttrId = DB::table('attributes')->insertGetId($clean);
                            }
                            if ($oldId !== null) {
                                $attrIdMap[$oldId] = $newAttrId;
                            }
                            $tableRowsCount++;
                        }
                    }

                    // F. ATTRIBUTE_VALUES
                    elseif ($targetTable === 'attribute_values') {
                        $clean = $this->cleanRowForTable('attribute_values', $row, $columns);
                        unset($clean['id']);

                        if (!empty($clean['attribute_id'])) {
                            $clean['attribute_id'] = $attrIdMap[$clean['attribute_id']] ?? $clean['attribute_id'];
                        }
                        if (($clean['parent_type'] ?? '') === 'post' && !empty($clean['parent_id'])) {
                            $clean['parent_id'] = $postIdMap[$clean['parent_id']] ?? DB::table('post_meta')->where('key', 'related_id')->where('value', (string)$clean['parent_id'])->value('post_id') ?? $clean['parent_id'];
                        }

                        $newValId = DB::table('attribute_values')->insertGetId($clean);
                        if ($oldId !== null) {
                            $attrValIdMap[$oldId] = $newValId;
                        }
                        $tableRowsCount++;
                    }

                    // G. POST_VARIATIONS
                    elseif ($targetTable === 'post_variations') {
                        $clean = $this->cleanRowForTable('post_variations', $row, $columns);
                        unset($clean['id']);

                        if (!empty($clean['post_id'])) {
                            $clean['post_id'] = $postIdMap[$clean['post_id']] ?? DB::table('post_meta')->where('key', 'related_id')->where('value', (string)$clean['post_id'])->value('post_id') ?? $clean['post_id'];
                        }
                        if (!empty($clean['parent_id'])) {
                            $clean['parent_id'] = $variationIdMap[$clean['parent_id']] ?? null;
                        }

                        $newVarId = DB::table('post_variations')->insertGetId($clean);
                        if ($oldId !== null) {
                            $variationIdMap[$oldId] = $newVarId;
                        }
                        $tableRowsCount++;
                    }

                    // H. PRODUCT_VARIATION_VALUES
                    elseif ($targetTable === 'product_variation_values') {
                        $clean = $this->cleanRowForTable('product_variation_values', $row, $columns);
                        unset($clean['id']);

                        if (!empty($clean['variation_id'])) {
                            $clean['variation_id'] = $variationIdMap[$clean['variation_id']] ?? $clean['variation_id'];
                        }
                        if (!empty($clean['attribute_option_id'])) {
                            $clean['attribute_option_id'] = $attrValIdMap[$clean['attribute_option_id']] ?? $clean['attribute_option_id'];
                        }

                        DB::table('product_variation_values')->insert($clean);
                        $tableRowsCount++;
                    }

                    // I. MEDIA (featured_image, gallery, variation_images)
                    elseif ($targetTable === 'media') {
                        $clean = $this->cleanRowForTable('media', $row, $columns);
                        unset($clean['id']);

                        $mediaType = $clean['type'] ?? '';
                        if ($mediaType === 'taxonomy') {
                            $oldParent = $clean['parent_id'];
                            $clean['parent_id'] = $taxIdMap[$oldParent] ?? DB::table('taxonomy_meta')->where('key', 'related_id')->where('value', (string)$oldParent)->value('taxonomy_id') ?? $oldParent;
                        } elseif ($mediaType === 'post' || $mediaType === 'post_gallery') {
                            $oldParent = $clean['parent_id'];
                            $clean['parent_id'] = $postIdMap[$oldParent] ?? DB::table('post_meta')->where('key', 'related_id')->where('value', (string)$oldParent)->value('post_id') ?? $oldParent;
                        } elseif ($mediaType === 'post_variation') {
                            $oldParent = $clean['parent_id'];
                            $clean['parent_id'] = $variationIdMap[$oldParent] ?? $postIdMap[$oldParent] ?? $oldParent;
                        } elseif ($mediaType === 'user') {
                            $clean['parent_id'] = $adminId;
                        }

                        // Prevent duplicate media entries
                        $exists = DB::table('media')
                            ->where('filename', $clean['filename'])
                            ->where('parent_id', $clean['parent_id'])
                            ->where('type', $clean['type'])
                            ->exists();

                        if (!$exists) {
                            DB::table('media')->insert($clean);
                            $tableRowsCount++;
                        }
                    }

                    // J. USERS
                    elseif ($targetTable === 'users') {
                        $clean = $this->cleanRowForTable('users', $row, $columns);
                        if (!empty($clean['email'])) {
                            $existingUser = DB::table('users')->where('email', $clean['email'])->first();
                            if ($existingUser) {
                                unset($clean['id']);
                                DB::table('users')->where('id', $existingUser->id)->update($clean);
                            } else {
                                unset($clean['id']);
                                DB::table('users')->insert($clean);
                            }
                            $tableRowsCount++;
                        }
                    }

                    // K. ANY OTHER TABLE
                    else {
                        $clean = $this->cleanRowForTable($targetTable, $row, $columns);
                        if (!empty($clean)) {
                            if (isset($clean['id']) && !empty($clean['id'])) {
                                DB::table($targetTable)->updateOrInsert(['id' => $clean['id']], $clean);
                            } else {
                                DB::table($targetTable)->insert($clean);
                            }
                            $tableRowsCount++;
                        }
                    }
                }

                $totalRows += $tableRowsCount;
                $tablesProcessed++;
            }

            File::deleteDirectory($extractPath);

            return [
                'tables_count' => $tablesProcessed,
                'total_rows' => $totalRows,
                'images_count' => $imagesCount,
            ];
        } catch (\Exception $e) {
            if (File::isDirectory($extractPath)) {
                File::deleteDirectory($extractPath);
            }
            throw $e;
        }
    }

    protected function importFileToTable($path, $table, $format = 'csv')
    {
        if (!Schema::hasTable($table)) {
            return 0;
        }

        $columns = Schema::getColumnListing($table);
        $rows = [];

        if ($format === 'csv') {
            $rows = $this->parseCsvFile($path);
        } elseif ($format === 'json') {
            $content = file_get_contents($path);
            $decoded = json_decode($content, true);
            $rows = is_array($decoded) ? $decoded : [];
        } elseif ($format === 'xlsx') {
            $importedData = Excel::toArray(new GenericImport($table), $path);
            $rows = $importedData[0] ?? [];
        } elseif ($format === 'xml') {
            $xml = simplexml_load_file($path);
            $json = json_encode($xml);
            $data = json_decode($json, true);
            $rows = $data['item'] ?? [];
            if (!empty($rows) && !isset($rows[0])) {
                $rows = [$rows];
            }
        }

        $processed = 0;
        foreach ($rows as $r) {
            $clean = $this->cleanRowForTable($table, (array) $r, $columns);
            if (empty($clean)) continue;

            if (isset($clean['id']) && !empty($clean['id'])) {
                DB::table($table)->updateOrInsert(['id' => $clean['id']], $clean);
            } else {
                DB::table($table)->insert($clean);
            }
            $processed++;
        }

        return $processed;
    }

    protected function cleanRowForTable($table, array $row, array $columns)
    {
        $cleaned = [];
        foreach ($row as $k => $v) {
            $key = trim($k);
            if (!in_array($key, $columns)) {
                continue;
            }
            if (is_string($v)) {
                $v = trim($v);
                if ($v === '' || strtolower($v) === 'null') {
                    $v = null;
                }
            }
            $cleaned[$key] = $v;
        }
        return $cleaned;
    }

    protected function parseCsvFile($filePath)
    {
        $rows = [];
        if (($handle = fopen($filePath, 'r')) !== false) {
            $header = null;
            while (($data = fgetcsv($handle, 0, ',')) !== false) {
                if (!$header) {
                    $data[0] = preg_replace('/^\xEF\xBB\xBF/', '', $data[0]); // Remove BOM
                    $header = array_map('trim', $data);
                } else {
                    if (count($data) === count($header)) {
                        $rows[] = array_combine($header, $data);
                    }
                }
            }
            fclose($handle);
        }
        return $rows;
    }

    public function export(Request $request)
    {
        $request->validate([
            'table' => 'required|string',
            'format' => 'required|in:csv,xlsx,json,xml',
        ]);

        $table = $request->table;
        $format = $request->format;
        $type = $request->input('type');
        $ids = $request->input('ids');

        if (!Schema::hasTable($table)) {
            return back()->withErrors(['table' => 'Table does not exist.']);
        }

        $db = $type ? $this->loadModuleConfig($type, 'DB') : null;

        if ($db) {
            return $this->exportModuleAsZip($type, $db, $table, $format, $ids);
        }

        $query = DB::table($table);
        if ($ids) {
            $query->whereIn('id', explode(',', $ids));
        }
        $data = $query->get()->map(function ($item) {
            return (array) $item;
        })->toArray();

        return $this->downloadSingleFile($table, $data, $format);
    }

    protected function exportModuleAsZip($type, $db, $tableName, $format, $ids = null)
    {
        $zipFile = storage_path('app/temp_export_' . time() . '.zip');
        $zip = new \ZipArchive();
        $zip->open($zipFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        $seq = 1;
        $order = function($name) use (&$seq) {
            return sprintf("%02d_%s", $seq++, $name);
        };

        // 1. Main Table
        $query = DB::table($tableName);
        if ($ids) {
            $query->whereIn('id', explode(',', $ids));
        }
        if (isset($db['fixed_fields'])) {
            foreach ($db['fixed_fields'] as $key => $val) {
                if ($val !== 'auth_id') {
                    $query->where($key, $val);
                }
            }
        }
        $mainData = $query->get();
        $mainIds = $mainData->pluck('id')->toArray();
        
        $mainContent = $this->formatData($mainData, $format);
        if ($mainContent) {
            $zip->addFromString($order($tableName) . '.' . $format, $mainContent);
        }

        // 2. Meta Table
        $metaTable = $db['meta_table'] ?? (Str::singular($tableName) . '_meta');
        if (Schema::hasTable($metaTable) && !empty($mainIds)) {
            $foreignKey = $db['meta_key'] ?? (Str::singular($tableName) . '_id');
            $metaData = DB::table($metaTable)->whereIn($foreignKey, $mainIds)->get();
            if ($metaData->count() > 0) {
                $zip->addFromString($order($metaTable) . '.' . $format, $this->formatData($metaData, $format));
            }
        }

        // 3. Attributes Definition
        if (!empty($mainIds) && Schema::hasTable('attribute_values')) {
            $attrValues = DB::table('attribute_values')->whereIn('parent_id', $mainIds)->where('parent_type', Str::singular($tableName))->get();
            if ($attrValues->count() > 0) {
                if (Schema::hasTable('attributes')) {
                    $attrIds = $attrValues->pluck('attribute_id')->unique()->toArray();
                    if (!empty($attrIds)) {
                        $attributes = DB::table('attributes')->whereIn('id', $attrIds)->get();
                        if ($attributes->count() > 0) {
                            $zip->addFromString($order('attributes') . '.' . $format, $this->formatData($attributes, $format));
                        }
                    }
                }
                // 4. Attribute Values
                $zip->addFromString($order('attribute_values') . '.' . $format, $this->formatData($attrValues, $format));
            }
        }

        // 5 & 6. Variations and Variation Values
        if (!empty($mainIds) && isset($db['features']['variations']) && $db['features']['variations']) {
            $variationsTable = $db['variations_table'] ?? (Str::singular($tableName) . '_variations');
            if (Schema::hasTable($variationsTable)) {
                $foreignKey = $db['meta_key'] ?? (Str::singular($tableName) . '_id');
                $variations = DB::table($variationsTable)->whereIn($foreignKey, $mainIds)->get();
                if ($variations->count() > 0) {
                    $zip->addFromString($order($variationsTable) . '.' . $format, $this->formatData($variations, $format));

                    if (Schema::hasTable('product_variation_values')) {
                        $varIds = $variations->pluck('id')->toArray();
                        $varValues = DB::table('product_variation_values')->whereIn('variation_id', $varIds)->get();
                        if ($varValues->count() > 0) {
                            $zip->addFromString($order('product_variation_values') . '.' . $format, $this->formatData($varValues, $format));
                        }
                    }
                }
            }
        }

        // 7, 8, 9. Media (Images and Galleries)
        if (!empty($mainIds) && Schema::hasTable('media')) {
            $mediaType = ($tableName === 'posts') ? 'post' : (($tableName === 'taxonomies') ? 'taxonomy' : $type);
            
            $featured = DB::table('media')->whereIn('parent_id', $mainIds)->where('type', $mediaType)->get();
            if ($featured->count() > 0) {
                $zip->addFromString($order('featured_image') . '.' . $format, $this->formatData($featured, $format));
                $this->addMediaFilesToZip($zip, $featured);
            }

            $gallery = DB::table('media')->whereIn('parent_id', $mainIds)->where('type', $mediaType . '_gallery')->get();
            if ($gallery->count() > 0) {
                $zip->addFromString($order('gallery') . '.' . $format, $this->formatData($gallery, $format));
                $this->addMediaFilesToZip($zip, $gallery);
            }

            $variationImages = DB::table('media')->whereIn('parent_id', $mainIds)->where('type', $mediaType . '_variation')->get();
            if ($variationImages->count() > 0) {
                $zip->addFromString($order('variation_images') . '.' . $format, $this->formatData($variationImages, $format));
                $this->addMediaFilesToZip($zip, $variationImages);
            }
        }

        $zip->close();
        return Response::download($zipFile, $type . '_export_package.zip')->deleteFileAfterSend(true);
    }

    protected function addMediaFilesToZip($zip, $mediaRecords)
    {
        foreach ($mediaRecords as $media) {
            $imagePath = storage_path('app/public/uploads/image/' . $media->filename);
            if (File::exists($imagePath)) {
                $zip->addFile($imagePath, 'images/' . $media->filename);
            }
        }
    }

    protected function formatData($collection, $format)
    {
        $data = $collection->map(function ($item) { return (array) $item; })->toArray();
        if (empty($data)) return null;

        if ($format === 'json') {
            return json_encode($data, JSON_PRETTY_PRINT);
        } elseif ($format === 'csv') {
            $output = fopen('php://temp', 'r+');
            fputcsv($output, array_keys($data[0]));
            foreach ($data as $row) {
                fputcsv($output, (array)$row);
            }
            rewind($output);
            $content = stream_get_contents($output);
            fclose($output);
            return $content;
        } elseif ($format === 'xml') {
            $xml = new \SimpleXMLElement('<root/>');
            foreach ($data as $item) {
                $node = $xml->addChild('item');
                foreach ($item as $key => $value) {
                    $key = is_numeric($key) ? 'key_' . $key : $key;
                    $node->addChild($key, htmlspecialchars((string) $value));
                }
            }
            return $xml->asXML();
        }
        
        // For Excel, ideally we use Maatwebsite, but writing to memory string is tricky.
        // Fallback to CSV format for XLSX in ZIP temporarily if Excel memory stream is too complex
        if ($format === 'xlsx') {
            $output = fopen('php://temp', 'r+');
            fputcsv($output, array_keys($data[0]));
            foreach ($data as $row) {
                fputcsv($output, (array)$row);
            }
            rewind($output);
            $content = stream_get_contents($output);
            fclose($output);
            return $content; 
        }

        return null;
    }

    protected function downloadSingleFile($table, $data, $format)
    {
        if ($format === 'csv' || $format === 'xlsx') {
            $extension = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;
            return Excel::download(new GenericExport($table), $table . '_export.' . $format, $extension);
        } elseif ($format === 'json') {
            return Response::make(json_encode($data, JSON_PRETTY_PRINT), 200, [
                'Content-Type' => 'application/json',
                'Content-Disposition' => 'attachment; filename="' . $table . '_export.json"',
            ]);
        } elseif ($format === 'xml') {
            $xml = new \SimpleXMLElement('<root/>');
            foreach ($data as $item) {
                $node = $xml->addChild('item');
                foreach ($item as $key => $value) {
                    $key = is_numeric($key) ? 'key_' . $key : $key;
                    $node->addChild($key, htmlspecialchars((string) $value));
                }
            }
            return Response::make($xml->asXML(), 200, [
                'Content-Type' => 'application/xml',
                'Content-Disposition' => 'attachment; filename="' . $table . '_export.xml"',
            ]);
        }
    }
}
