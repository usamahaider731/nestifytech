<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FilterController extends Controller
{
    public function bulk_action(Request $request)
    {
        $table = $request->table;
        $type = $request->type;
        $action = $request->action;
        $column = $request->column;
        $is_meta = $request->is_meta;
        $ids = $request->ids;
        $data = DB::table($table)
            ->whereIn('id', $ids)
        ;
        if ($action == "delete") {
            $data->delete();
        } else {
            if (!empty($column)) {
                if ($is_meta) {
                    $data->get();

                } else {
                    $data->update([
                        $column => $action
                    ]);
                }
            }
        }
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully',
        ]);
    }
}
