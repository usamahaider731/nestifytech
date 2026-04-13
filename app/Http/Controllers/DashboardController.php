<?php
namespace App\Http\Controllers;

use File;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
  protected $file;
  protected $data;
  public function __construct()
  {
    parent::__construct();
    $this->file = $this->json_file_location . '/dashboard.json';
    if (File::exists($this->file)) {
      $this->data = json_decode(File::get($this->file), true);
    } else {
      $this->data = [];
    }
  }
  public function dashboard()
  {
    $data = $this->data;
    foreach ($data['main'] as $key => $value) {
      $table = $value['table'];
      $type = $value['type'] ?? null;

      $query = DB::table($table);

      if (!is_null($type)) {
        $query->where('type', $type);
      }


      $data['main'][$key]['counts'] = $query->get()->count();
    }
    foreach ($data['chart'] as $key => $value) {
      $table = $value['table'];
      $type = $value['type'] ?? null;
      $column = $value['column'];
      $is_line = $value['is_line'] ?? false;
      $query = DB::table($table);

      if (!is_null($type)) {
        $query->where('type', $type);
      }
      if ($is_line) {
        $groupBy = $value['group_by'] ?? 'day';
        $format = '%Y-%m-%d'; // Default to day

        if ($groupBy === 'month') {
          $format = '%Y-%m';
        } elseif ($groupBy === 'year') {
          $format = '%Y';
        }

        $data['chart'][$key]['counts'] = $query->select(
          DB::raw('count(*) as count'),
          DB::raw("DATE_FORMAT($column, '$format') as date")
        )
          ->groupBy('date')
          ->orderBy('date', 'asc')
          ->pluck('count', 'date');
      } else {

        $data['chart'][$key]['counts'] = $query->select(DB::raw('count(*) as count'), $column)->groupBy($column)->pluck('count', $column);
        $value_label = $value['value_label'] ?? [];
        if (!empty($value_label)) {
          foreach ($data['chart'][$key]['counts'] as $ke => $value) {
            foreach ($value_label as $k => $val) {
              if ($val['key'] == $ke) {
                $data['chart'][$key]['counts'][$val['value']] = $value;
                unset($data['chart'][$key]['counts'][$ke]);
              }
            }
          }
          
        }
      }
    }
    return Inertia::render('Admin/Dashboard', [
      'data' => $data
    ]);
  }
}