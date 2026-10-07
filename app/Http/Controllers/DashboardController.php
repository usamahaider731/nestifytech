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

    if (isset($data['main']) && is_array($data['main'])) {
      foreach ($data['main'] as $key => $value) {
        $table = $value['table'] ?? 'posts';
        $type = $value['type'] ?? null;
        $query = DB::table($table);

        if (!is_null($type)) {
          $query->where('type', $type);
        }

        $data['main'][$key]['counts'] = $query->count();
      }
    }

    if (isset($data['chart']) && is_array($data['chart'])) {
      foreach ($data['chart'] as $key => $value) {
        $table = $value['table'] ?? 'posts';
        $type = $value['type'] ?? null;
        $column = $value['column'] ?? 'created_at';
        $is_line = $value['is_line'] ?? false;
        $query = DB::table($table);

        if (!is_null($type)) {
          $query->where('type', $type);
        }

        if ($is_line) {
          $groupBy = $value['group_by'] ?? 'day';
          $format = '%Y-%m-%d';
          if ($groupBy === 'month') {
            $format = '%Y-%m';
          } elseif ($groupBy === 'year') {
            $format = '%Y';
          }

          $data['chart'][$key]['counts'] = $query->select(
            DB::raw('count(*) as count'),
            DB::raw("DATE_FORMAT($column, '$format') as date")
          )
            ->whereNotNull($column)
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->pluck('count', 'date');
        } else {
          $data['chart'][$key]['counts'] = $query->select(DB::raw('count(*) as count'), $column)
            ->groupBy($column)
            ->pluck('count', $column);

          $value_label = $value['value_label'] ?? [];
          if (!empty($value_label)) {
            foreach ($data['chart'][$key]['counts'] as $ke => $val) {
              foreach ($value_label as $vl) {
                if ($vl['key'] == $ke) {
                  $data['chart'][$key]['counts'][$vl['value']] = $val;
                  unset($data['chart'][$key]['counts'][$ke]);
                }
              }
            }
          }
        }
      }
    }

    $totalOrders = DB::table('orders')->count();
    $totalRevenue = (float) DB::table('orders')->sum('total_price');
    $totalCustomers = DB::table('users')->count();
    $totalProducts = DB::table('posts')->where('type', 'product')->count();

    $products = DB::table('posts')
      ->where('type', 'product')
      ->orderBy('id', 'desc')
      ->limit(6)
      ->get();

    $productIds = $products->pluck('id')->toArray();
    $metas = !empty($productIds) ? DB::table('post_meta')
      ->whereIn('post_id', $productIds)
      ->get()
      ->groupBy('post_id') : collect();

    $popularProducts = $products->map(function ($p) use ($metas) {
      $pMeta = $metas->get($p->id, collect());
      $price = $pMeta->where('key', 'first_price')->first()?->value ??
        $pMeta->where('key', 'price')->first()?->value ?? '0';
      $stock = $pMeta->where('key', 'stock')->first()?->value ?? '10';
      $catId = $pMeta->where('key', 'category')->first()?->value;
      $image = $pMeta->where('key', 'thumbnail')->first()?->value ??
        $pMeta->where('key', 'image')->first()?->value ?? null;

      $catName = 'General';
      if ($catId) {
        $decoded = json_decode($catId, true);
        $firstId = is_array($decoded) ? ($decoded[0] ?? null) : $catId;
        if ($firstId) {
          $catName = DB::table('taxonomies')->where('id', $firstId)->value('title') ?? 'General';
        }
      }

      return [
        'id' => $p->id,
        'title' => $p->title,
        'sku' => $p->sku,
        'category' => $catName,
        'price' => (float)$price,
        'stock' => is_numeric($stock) ? (int)$stock : 10,
        'status' => $p->status ?? 'publish',
        'image' => $image,
        'created_at' => $p->created_at ? date('d M Y', strtotime($p->created_at)) : 'Recent',
      ];
    });

    // Recent Orders / Transactions
    $recentOrders = DB::table('orders')
      ->leftJoin('users', 'orders.user_id', '=', 'users.id')
      ->select(
        'orders.id',
        'orders.total_price',
        'orders.status',
        'orders.payment_method',
        'orders.payment_status',
        'orders.order_date',
        'orders.created_at',
        'users.name as customer_name',
        'users.email as customer_email'
      )
      ->orderBy('orders.id', 'desc')
      ->limit(5)
      ->get()
      ->map(function ($ord) {
        return [
          'id' => $ord->id,
          'customer' => $ord->customer_name ?? 'Guest User',
          'email' => $ord->customer_email ?? 'customer@example.com',
          'amount' => (float) $ord->total_price,
          'method' => $ord->payment_method ?? 'Credit Card',
          'status' => $ord->status ?? 'pending',
          'date' => $ord->created_at ? date('d M, Y', strtotime($ord->created_at)) : date('d M, Y'),
        ];
      });

    // Category Sales / Breakdown for Doughnut Chart
    $categories = DB::table('taxonomies')
      ->where('type', 'category')
      ->limit(5)
      ->get(['id', 'title']);

    $categoryLabels = [];
    $categoryCounts = [];
    foreach ($categories as $cat) {
      $categoryLabels[] = $cat->title;
      $c = DB::table('post_meta')
        ->where('key', 'category')
        ->where('value', 'like', "%{$cat->id}%")
        ->count();
      $categoryCounts[] = max($c, 1);
    }
    if (empty($categoryLabels)) {
      $categoryLabels = ['Smartphones', 'Laptops', 'Audio', 'Accessories'];
      $categoryCounts = [45, 28, 18, 9];
    }
    // Make Main Array month that have Products According to Months
    $productsByMonths = [];
    $products = get_posts([
      'type' => 'product',
      'in_stock' => true,
      'price' => true,
      'limit' => -1
    ]);
    // $products = $products->filter(function($p){
    //   // created_at separate by each month
    //   $date = $p->created_at;
    //   $month = date('M', strtotime($date));
    //   return $month;
    // });
    $productsByMonths = [];
    foreach ($products as $product) {
      $year = date('Y', strtotime($product->created_at));
      $month = date('M', strtotime($product->created_at));
      $productsByMonths[$year][$month][] = $product;
    }
    // Calculate Monthly Revenue from Orders
    $currentYear = date('Y');
    $revenueData = DB::table('orders')
      ->whereYear('order_date', $currentYear)
      ->select(
        DB::raw('MONTH(order_date) as month'),
        DB::raw('SUM(total_price) as total')
      )
      ->groupBy('month')
      ->pluck('total', 'month')
      ->toArray();

    $reportMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $reportEarnings = [];
    $reportExpenses = [];
    $totalYearlyRevenue = 0;
    
    foreach ($reportMonths as $index => $monthName) {
        $m = $index + 1;
        $earn = isset($revenueData[$m]) ? (int)$revenueData[$m] : 0;
        
        $monthExpense = 0;
        // 1. Expense from newly added products (stock * current price)
        if (isset($productsByMonths[$currentYear][$monthName])) {
            foreach ($productsByMonths[$currentYear][$monthName] as $p) {
                $monthExpense += (float) ($p->price ?? 0);
            }
        }
        
        // 2. Expense from orders (using the locked-in order price so future price changes don't affect it)
        $monthExpense += $earn;

        $reportEarnings[] = $earn;
        $reportExpenses[] = (int)$monthExpense; 
        $totalYearlyRevenue += $earn;
    }

    $ecommerce = [
      'stats' => [
        'sales' => [
          'value' => $totalOrders > 0 ? (string)$totalOrders : '230k',
          'label' => 'Sales',
          'change' => '+18.2%',
          'color' => '#7367f0'
        ],
        'customers' => [
          'value' => $totalCustomers > 0 ? (string)$totalCustomers : '8.5k',
          'label' => 'Customers',
          'change' => '+24.5%',
          'color' => '#00bad1'
        ],
        'products' => [
          'value' => $totalProducts > 0 ? (string)$totalProducts : '1.4k',
          'label' => 'Products',
          'change' => '+12.8%',
          'color' => '#ff4c51'
        ],
        'revenue' => [
          'value' => $totalRevenue > 0 ? '$' . number_format($totalRevenue, 0) : '$97,450',
          'label' => 'Revenue',
          'change' => '+28.4%',
          'color' => '#28c76f'
        ],
      ],
      'revenue_report' => [
        'months' => $reportMonths,
        'earnings' => $reportEarnings,
        'expenses' => $reportExpenses,
        'budget' => '$' . number_format($totalYearlyRevenue > 0 ? $totalYearlyRevenue * 1.2 : 56800),
        'budget_growth' => '+24.8%',
        'deposit' => '$' . number_format($totalYearlyRevenue > 0 ? $totalYearlyRevenue * 0.3 : 25852)
      ],
      'profit_summary' => [
        'total_profit' => '$' . number_format($totalYearlyRevenue > 0 ? $totalYearlyRevenue * 0.3 : 28450),
        'profit_change' => '+42.5%',
        'total_expenses' => '$' . number_format(array_sum($reportExpenses)),
        'expenses_change' => '-12.4%'
      ],
      'popular_products' => $popularProducts,
      'recent_orders' => $recentOrders,
      'categories_chart' => [
        'labels' => $categoryLabels,
        'series' => $categoryCounts
      ]
    ];

    return Inertia::render('Admin/Dashboard', [
      'data' => $data,
      'ecommerce' => $ecommerce
    ]);
  }
}
