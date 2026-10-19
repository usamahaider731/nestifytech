<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GenericImport implements ToCollection, WithHeadingRow
{
    protected $table;
    protected $columns;

    public function __construct($table)
    {
        $this->table = $table;
        $this->columns = Schema::hasTable($table) ? Schema::getColumnListing($table) : [];
    }

    public function collection(Collection $rows): void
    {
        if (empty($this->columns)) return;

        foreach ($rows as $row) {
            $raw = $row->toArray();
            $cleaned = [];
            foreach ($raw as $k => $v) {
                $key = trim($k);
                if (!in_array($key, $this->columns)) continue;
                if (is_string($v)) {
                    $v = trim($v);
                    if ($v === '' || strtolower($v) === 'null') {
                        $v = null;
                    }
                }
                $cleaned[$key] = $v;
            }

            if (empty($cleaned)) continue;

            if (isset($cleaned['id']) && !empty($cleaned['id'])) {
                DB::table($this->table)->updateOrInsert(['id' => $cleaned['id']], $cleaned);
            } else {
                DB::table($this->table)->insert($cleaned);
            }
        }
    }
}