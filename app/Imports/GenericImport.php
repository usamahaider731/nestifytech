<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\DB;

class GenericImport implements ToCollection, WithHeadingRow
{
    protected $table;

    public function __construct($table)
    {
        $this->table = $table;
    }

    public function collection(Collection $rows): void
    {
        $data = [];
        foreach ($rows as $row) {
            $data[] = $row->toArray();
        }
        
        if (!empty($data)) {
            DB::table($this->table)->insert($data);
        }
    }
}