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

        return Inertia::render('Admin/ImportExport/Index', [
            'tables' => $tables,
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'table' => 'required|string',
            'format' => 'required|in:csv,xlsx,json,xml',
            'file' => 'required|file',
        ]);

        $table = $request->table;
        $format = $request->format;
        $file = $request->file('file');
        $type = $request->input('type');
        $extension = $file->getClientOriginalExtension();

        if ($extension === 'zip') {
            return $this->importZip($file, $table, $type, $format);
        }

        if (!Schema::hasTable($table)) {
            return back()->withErrors(['table' => 'Table does not exist.']);
        }

        try {
            $this->importFileToTable($file->getRealPath(), $table, $format);
            return back()->with('success', 'Data imported successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Error importing data: ' . $e->getMessage()]);
        }
    }

    protected function importZip($file, $tableName, $type, $format)
    {
        $zip = new \ZipArchive();
        if ($zip->open($file->getRealPath()) === true) {
            $extractPath = storage_path('app/temp_import_' . time());
            $zip->extractTo($extractPath);
            $zip->close();

            $files = File::files($extractPath);
            
            $files = File::files($extractPath);
            
            // Sort files alphabetically to respect the numbered sequence prefix
            usort($files, function($a, $b) {
                return strcmp($a->getFilename(), $b->getFilename());
            });

            try {
                foreach ($files as $f) {
                    if ($f->isDir()) continue;
                    
                    $fileName = $f->getFilenameWithoutExtension();
                    
                    // Extract actual table name by stripping out the '0X_' sequence prefix
                    $targetTable = preg_replace('/^\d+_/', '', $fileName);
                    
                    // Map split media tables back to 'media' table
                    if (in_array($targetTable, ['featured_image', 'gallery', 'variation_images'])) {
                        $targetTable = 'media';
                    }

                    if (Schema::hasTable($targetTable)) {
                        $this->importFileToTable($f->getRealPath(), $targetTable, $format);
                    }
                }
                File::deleteDirectory($extractPath);
                return back()->with('success', 'Technical Data Sequence imported successfully.');
            } catch (\Exception $e) {
                File::deleteDirectory($extractPath);
                return back()->withErrors(['file' => 'Error importing ZIP: ' . $e->getMessage()]);
            }
        }
        return back()->withErrors(['file' => 'Could not open ZIP file.']);
    }

    protected function importFileToTable($path, $table, $format)
    {
        if ($format === 'csv' || $format === 'xlsx') {
            Excel::import(new GenericImport($table), $path);
        } elseif ($format === 'json') {
            $data = json_decode(file_get_contents($path), true);
            if (is_array($data)) {
                DB::table($table)->insert($data);
            }
        } elseif ($format === 'xml') {
            $xml = simplexml_load_file($path);
            $json = json_encode($xml);
            $data = json_decode($json, true);
            if (isset($data['item']) && is_array($data['item'])) {
                DB::table($table)->insert($data['item']);
            }
        }
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
