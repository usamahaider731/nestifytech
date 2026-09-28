<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GenericExport implements FromCollection, WithHeadings
{
    protected $table;

    public function __construct($table)
    {
        $this->table = $table;
    }

    public function collection(): \Illuminate\Support\Collection
    {
        return DB::table($this->table)->get();
    }

    public function headings(): array
    {
        return Schema::getColumnListing($this->table);
    }
}
