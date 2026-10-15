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
        $this->manifest =  File::exists($manifest_file) ? json_decode(file_get_contents($manifest_file)) : null;
    }
    public function reset()
    {

        Artisan::call('migrate:fresh');

        foreach ($this->manifest as $key => $value) {
            $file = $this->json_import_location . "/{$value}";
            $file_content = file_get_contents($file);
            $decode_data = json_decode($file_content);

            $table = $decode_data->table;

            $data = $decode_data->data;
            $type = isset($decode_data->type) ?? null;
            foreach ($data as $key => $rowItem) {
                $relatedInserts = []; // collect related-table rows to insert after main insert

                foreach ($rowItem as $k => $val) {

                    if ($val == "{now}") {
                        $val = now()->toDateTimeString();
                    }

                    // handle relations
                    if ($k == 'relation') {
                        $relations = is_array($val) ? $val : (array) $val;
                        foreach ($relations as $vv) {
                            $insert_in = $vv->insert_in ?? null;

                            if ($insert_in == 'main_table') {
                                // resolve a value from another table and store it in the main row
                                $column              = $vv->where->column;
                                $whereValue          = $vv->where->value;
                                $operator            = $vv->where->operater;
                                $value_column        = $vv->value_column;
                                $relation_col_value  = $vv->relation_column_value;
                                $resolved = DB::table($vv->table)
                                    ->where($column, $operator, $whereValue)
                                    ->pluck($relation_col_value);
                                $rowItem->$value_column = json_encode($resolved->values()->all());

                            } elseif ($insert_in == 'related_table') {
                                $relatedInserts[] = $vv;
                            }
                        }
                        unset($rowItem->relation);
                        continue;
                    }

                    // encode arrays as JSON for storage
                    if (is_array($val) || is_object($val)) {
                        $val = json_encode($val);
                    }

                    // hash password fields automatically
                    if ($k === 'password') {
                        $val = bcrypt($val);
                    }

                    $rowItem->$k = $val;
                }

                // insert main row and get its new ID
                $newId = DB::table($table)->insertGetId((array) $rowItem);

                // now insert related-table rows using the new ID
                foreach ($relatedInserts as $rel) {
                    $relData = [];
                    foreach ((array) ($rel->data ?? []) as $col => $colVal) {
                        if ($colVal === '{insert_id}') {
                            $colVal = $newId;
                        } elseif ($colVal === '{now}') {
                            $colVal = now()->toDateTimeString();
                        }
                        $relData[$col] = $colVal;
                    }
                    if (!empty($relData)) {
                        DB::table($rel->table)->insert($relData);
                    }
                }
            }
        }
    }
}
